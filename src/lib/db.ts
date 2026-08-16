import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import { DatabaseSync } from "node:sqlite";
import type {
  AwardBallot,
  AwardResult,
  BeerEntry,
  BeerPersonOverview,
  BeerStats,
  Event,
  EventGuestList,
  EventInput,
  EventRsvp,
  ExplorationLevel,
  QuizSubmission,
} from "@/types";
import { AWARDS } from "@/data/awards";
import { QUIZ_QUESTIONS, scoreQuizAnswers } from "@/data/quiz";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "wg.db");
const JSON_LEGACY = path.join(DATA_DIR, "store.json");

let db: DatabaseSync | null = null;

function nowIso(): string {
  return new Date().toISOString();
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getDb(): DatabaseSync {
  if (db) return db;
  ensureDataDir();
  db = new DatabaseSync(DB_PATH);
  db.exec(
    "PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;"
  );
  initSchema(db);
  applySchemaUpgrades(db);
  ensureAdmin(db);
  migrateFromJsonIfNeeded(db);
  return db;
}

/** Add columns introduced after the initial release to existing databases. */
function applySchemaUpgrades(database: DatabaseSync): void {
  const columns = database
    .prepare("PRAGMA table_info(events)")
    .all() as Array<{ name: string }>;

  if (!columns.some((column) => column.name === "video_path")) {
    database.exec("ALTER TABLE events ADD COLUMN video_path TEXT");
  }
}

function initSchema(database: DatabaseSync): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      exploration_level INTEGER NOT NULL DEFAULT 1,
      video_path TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      beer_counter_enabled INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS beer_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      name TEXT NOT NULL,
      beers INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS quiz_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      answers_json TEXT NOT NULL,
      correct_count INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS award_ballots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voter_name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      nominations_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS event_rsvps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_beer_event ON beer_entries(event_id);
    CREATE INDEX IF NOT EXISTS idx_rsvp_event ON event_rsvps(event_id);
  `);
}

function ensureAdmin(database: DatabaseSync): void {
  const row = database.prepare("SELECT id FROM admins LIMIT 1").get() as
    | { id: number }
    | undefined;
  if (row) return;
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "Admin123!";
  database
    .prepare(
      "INSERT INTO admins (username, password_hash, created_at) VALUES (?, ?, ?)"
    )
    .run(username, bcrypt.hashSync(password, 12), nowIso());
}

function migrateFromJsonIfNeeded(database: DatabaseSync): void {
  if (!fs.existsSync(JSON_LEGACY)) return;
  const count = (
    database.prepare("SELECT COUNT(*) AS c FROM events").get() as { c: number }
  ).c;
  if (count > 0) return;

  try {
    const raw = JSON.parse(fs.readFileSync(JSON_LEGACY, "utf-8")) as {
      /** The JSON store predates video uploads and only knew `youtubeUrl`. */
      events?: Array<Omit<Event, "videoPath">>;
      beerEntries?: BeerEntry[];
      quizSubmissions?: QuizSubmission[];
      awardBallots?: AwardBallot[];
      eventRsvps?: EventRsvp[];
      admins?: Array<{ username: string; passwordHash: string; createdAt: string }>;
    };

    const insertEvent = database.prepare(
      `INSERT OR IGNORE INTO events
       (id, date, title, description, exploration_level, video_path, is_active, beer_counter_enabled, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const e of raw.events ?? []) {
      insertEvent.run(
        e.id,
        e.date,
        e.title,
        e.description,
        e.explorationLevel,
        null,
        e.isActive ? 1 : 0,
        e.beerCounterEnabled ? 1 : 0,
        e.createdAt,
        e.updatedAt
      );
    }

    const insertBeer = database.prepare(
      `INSERT OR IGNORE INTO beer_entries (id, event_id, date, name, beers, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    for (const b of raw.beerEntries ?? []) {
      insertBeer.run(b.id, b.eventId, b.date, b.name, b.beers, b.createdAt);
    }

    const insertQuiz = database.prepare(
      `INSERT OR IGNORE INTO quiz_submissions
       (id, name, answers_json, correct_count, total_questions, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    for (const q of raw.quizSubmissions ?? []) {
      insertQuiz.run(
        q.id,
        q.name,
        JSON.stringify(q.answers),
        q.correctCount,
        q.totalQuestions,
        q.createdAt
      );
    }

    const insertAward = database.prepare(
      `INSERT OR IGNORE INTO award_ballots (id, voter_name, nominations_json, created_at)
       VALUES (?, ?, ?, ?)`
    );
    for (const a of raw.awardBallots ?? []) {
      insertAward.run(
        a.id,
        a.voterName,
        JSON.stringify(a.nominations),
        a.createdAt
      );
    }

    const insertRsvp = database.prepare(
      `INSERT OR IGNORE INTO event_rsvps (id, event_id, date, name, created_at)
       VALUES (?, ?, ?, ?, ?)`
    );
    for (const r of raw.eventRsvps ?? []) {
      insertRsvp.run(r.id, r.eventId, r.date, r.name, r.createdAt);
    }

    // Prefer existing hashed admin from JSON if present
    if (raw.admins?.[0]) {
      database.prepare("DELETE FROM admins").run();
      database
        .prepare(
          "INSERT INTO admins (username, password_hash, created_at) VALUES (?, ?, ?)"
        )
        .run(
          raw.admins[0].username,
          raw.admins[0].passwordHash,
          raw.admins[0].createdAt
        );
    }

    fs.renameSync(JSON_LEGACY, `${JSON_LEGACY}.migrated`);
  } catch (error) {
    console.error("JSON→SQLite Migration fehlgeschlagen", error);
  }
}

function mapEvent(row: Record<string, unknown>): Event {
  return {
    id: row.id as number,
    date: row.date as string,
    title: row.title as string,
    description: row.description as string,
    explorationLevel: row.exploration_level as ExplorationLevel,
    videoPath: (row.video_path as string | null) ?? null,
    isActive: Boolean(row.is_active),
    beerCounterEnabled: Boolean(row.beer_counter_enabled),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function resetDbCache(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function getAllEvents(): Event[] {
  return (
    getDb()
      .prepare("SELECT * FROM events ORDER BY date ASC")
      .all() as Record<string, unknown>[]
  ).map(mapEvent);
}

export function getActiveEvents(): Event[] {
  return (
    getDb()
      .prepare("SELECT * FROM events WHERE is_active = 1 ORDER BY date ASC")
      .all() as Record<string, unknown>[]
  ).map(mapEvent);
}

export function getEventById(id: number): Event | null {
  const row = getDb()
    .prepare("SELECT * FROM events WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;
  return row ? mapEvent(row) : null;
}

export function getEventByDate(date: string): Event | null {
  const row = getDb()
    .prepare("SELECT * FROM events WHERE date = ?")
    .get(date) as Record<string, unknown> | undefined;
  return row ? mapEvent(row) : null;
}

export function createEvent(input: EventInput): Event {
  const stamp = nowIso();
  try {
    const result = getDb()
      .prepare(
        `INSERT INTO events
         (date, title, description, exploration_level, video_path, is_active, beer_counter_enabled, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        input.date,
        input.title,
        input.description,
        input.explorationLevel,
        input.videoPath ?? null,
        input.isActive === false ? 0 : 1,
        input.beerCounterEnabled ? 1 : 0,
        stamp,
        stamp
      );
    return getEventById(Number(result.lastInsertRowid))!;
  } catch (error) {
    if (String(error).includes("UNIQUE")) {
      throw new Error("UNIQUE constraint failed: events.date");
    }
    throw error;
  }
}

export function updateEvent(id: number, input: EventInput): Event | null {
  if (!getEventById(id)) return null;
  try {
    getDb()
      .prepare(
        `UPDATE events SET
          date = ?, title = ?, description = ?, exploration_level = ?,
          video_path = ?, is_active = ?, beer_counter_enabled = ?,
          updated_at = ?
         WHERE id = ?`
      )
      .run(
        input.date,
        input.title,
        input.description,
        input.explorationLevel,
        input.videoPath ?? null,
        input.isActive === false ? 0 : 1,
        input.beerCounterEnabled ? 1 : 0,
        nowIso(),
        id
      );
    return getEventById(id);
  } catch (error) {
    if (String(error).includes("UNIQUE")) {
      throw new Error("UNIQUE constraint failed: events.date");
    }
    throw error;
  }
}

export function deleteEvent(id: number): boolean {
  const result = getDb().prepare("DELETE FROM events WHERE id = ?").run(id);
  getDb().prepare("DELETE FROM beer_entries WHERE event_id = ?").run(id);
  getDb().prepare("DELETE FROM event_rsvps WHERE event_id = ?").run(id);
  return Number(result.changes) > 0;
}

export function addBeerEntry(input: {
  eventId: number;
  name: string;
  beers: number;
}): BeerEntry {
  const event = getEventById(input.eventId);
  if (!event || !event.isActive) throw new Error("EVENT_NOT_FOUND");
  if (!event.beerCounterEnabled) throw new Error("BEER_COUNTER_DISABLED");

  const name = input.name.trim();
  const dup = getDb()
    .prepare(
      "SELECT id FROM beer_entries WHERE event_id = ? AND lower(name) = lower(?)"
    )
    .get(event.id, name);
  if (dup) throw new Error("DUPLICATE_NAME");

  const stamp = nowIso();
  const result = getDb()
    .prepare(
      "INSERT INTO beer_entries (event_id, date, name, beers, created_at) VALUES (?, ?, ?, ?, ?)"
    )
    .run(event.id, event.date, name, input.beers, stamp);

  return {
    id: Number(result.lastInsertRowid),
    eventId: event.id,
    date: event.date,
    name,
    beers: input.beers,
    createdAt: stamp,
  };
}

export function getBeerStats(): BeerStats {
  const rows = getDb()
    .prepare(
      `SELECT b.name, b.beers FROM beer_entries b
       INNER JOIN events e ON e.id = b.event_id
       WHERE e.beer_counter_enabled = 1`
    )
    .all() as Array<{ name: string; beers: number }>;

  const totalBeers = rows.reduce((s, r) => s + r.beers, 0);
  const byName = new Map<string, { displayName: string; beers: number }>();
  for (const row of rows) {
    const key = row.name.trim().toLowerCase();
    if (!key) continue;
    const existing = byName.get(key);
    if (existing) existing.beers += row.beers;
    else byName.set(key, { displayName: row.name.trim(), beers: row.beers });
  }
  let topDrinker: string | null = null;
  let topDrinkerBeers = 0;
  for (const v of byName.values()) {
    if (v.beers > topDrinkerBeers) {
      topDrinkerBeers = v.beers;
      topDrinker = v.displayName;
    }
  }
  return { totalBeers, topDrinker, topDrinkerBeers };
}

export function getBeerPersonOverview(): BeerPersonOverview[] {
  const rows = getDb()
    .prepare(
      `SELECT b.id, b.event_id, b.date, b.name, b.beers, b.created_at, e.title AS event_title
       FROM beer_entries b
       LEFT JOIN events e ON e.id = b.event_id
       ORDER BY b.date ASC`
    )
    .all() as Array<{
    id: number;
    event_id: number;
    date: string;
    name: string;
    beers: number;
    created_at: string;
    event_title: string | null;
  }>;

  const byName = new Map<string, BeerPersonOverview>();
  for (const row of rows) {
    const key = row.name.trim().toLowerCase();
    if (!key) continue;
    const person = byName.get(key) ?? {
      name: row.name.trim(),
      totalBeers: 0,
      entries: [],
    };
    person.totalBeers += row.beers;
    person.entries.push({
      id: row.id,
      eventId: row.event_id,
      eventTitle: row.event_title || `Event #${row.event_id}`,
      date: row.date,
      name: row.name.trim(),
      beers: row.beers,
      createdAt: row.created_at,
    });
    byName.set(key, person);
  }
  return [...byName.values()].sort(
    (a, b) => b.totalBeers - a.totalBeers || a.name.localeCompare(b.name)
  );
}

export function updateBeerEntry(
  id: number,
  input: { name?: string; beers?: number }
): BeerEntry | null {
  const existing = getDb()
    .prepare("SELECT * FROM beer_entries WHERE id = ?")
    .get(id) as
    | {
        id: number;
        event_id: number;
        date: string;
        name: string;
        beers: number;
        created_at: string;
      }
    | undefined;
  if (!existing) return null;

  const nextName = input.name?.trim() ?? existing.name;
  const nextBeers = input.beers ?? existing.beers;
  if (!nextName) throw new Error("INVALID_NAME");
  if (!Number.isInteger(nextBeers) || nextBeers < 1 || nextBeers > 50) {
    throw new Error("INVALID_BEERS");
  }

  const dup = getDb()
    .prepare(
      `SELECT id FROM beer_entries
       WHERE event_id = ? AND lower(name) = lower(?) AND id != ?`
    )
    .get(existing.event_id, nextName, id);
  if (dup) throw new Error("DUPLICATE_NAME");

  getDb()
    .prepare("UPDATE beer_entries SET name = ?, beers = ? WHERE id = ?")
    .run(nextName, nextBeers, id);

  return {
    id: existing.id,
    eventId: existing.event_id,
    date: existing.date,
    name: nextName,
    beers: nextBeers,
    createdAt: existing.created_at,
  };
}

export function deleteBeerEntry(id: number): boolean {
  return Number(getDb().prepare("DELETE FROM beer_entries WHERE id = ?").run(id).changes) > 0;
}

export function submitQuiz(input: {
  name: string;
  answers: Record<string, string | Record<string, string>>;
}): QuizSubmission {
  const name = input.name.trim();
  if (!name) throw new Error("INVALID_NAME");
  const dup = getDb()
    .prepare("SELECT id FROM quiz_submissions WHERE lower(name) = lower(?)")
    .get(name);
  if (dup) throw new Error("DUPLICATE_NAME");

  const { correctCount } = scoreQuizAnswers(input.answers);
  const stamp = nowIso();
  const result = getDb()
    .prepare(
      `INSERT INTO quiz_submissions (name, answers_json, correct_count, total_questions, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(name, JSON.stringify(input.answers), correctCount, QUIZ_QUESTIONS.length, stamp);

  return {
    id: Number(result.lastInsertRowid),
    name,
    answers: input.answers,
    correctCount,
    totalQuestions: QUIZ_QUESTIONS.length,
    createdAt: stamp,
  };
}

export function getQuizSubmissions(): QuizSubmission[] {
  return (
    getDb()
      .prepare(
        "SELECT * FROM quiz_submissions ORDER BY correct_count DESC, name ASC"
      )
      .all() as Array<Record<string, unknown>>
  ).map((row) => ({
    id: row.id as number,
    name: row.name as string,
    answers: JSON.parse(row.answers_json as string) as QuizSubmission["answers"],
    correctCount: row.correct_count as number,
    totalQuestions: row.total_questions as number,
    createdAt: row.created_at as string,
  }));
}

export function updateQuizSubmission(
  id: number,
  input: {
    name?: string;
    answers?: Record<string, string | Record<string, string>>;
  }
): QuizSubmission | null {
  const existing = getDb()
    .prepare("SELECT * FROM quiz_submissions WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;
  if (!existing) return null;

  const nextName = input.name?.trim() ?? (existing.name as string);
  if (!nextName) throw new Error("INVALID_NAME");
  const dup = getDb()
    .prepare(
      "SELECT id FROM quiz_submissions WHERE lower(name) = lower(?) AND id != ?"
    )
    .get(nextName, id);
  if (dup) throw new Error("DUPLICATE_NAME");

  const answers =
    input.answers ??
    (JSON.parse(existing.answers_json as string) as QuizSubmission["answers"]);
  const { correctCount } = scoreQuizAnswers(answers);

  getDb()
    .prepare(
      `UPDATE quiz_submissions
       SET name = ?, answers_json = ?, correct_count = ?, total_questions = ?
       WHERE id = ?`
    )
    .run(
      nextName,
      JSON.stringify(answers),
      correctCount,
      QUIZ_QUESTIONS.length,
      id
    );

  return {
    id,
    name: nextName,
    answers,
    correctCount,
    totalQuestions: QUIZ_QUESTIONS.length,
    createdAt: existing.created_at as string,
  };
}

export function deleteQuizSubmission(id: number): boolean {
  return Number(
    getDb().prepare("DELETE FROM quiz_submissions WHERE id = ?").run(id).changes
  ) > 0;
}

export function addEventRsvp(input: {
  eventId: number;
  name: string;
}): EventRsvp {
  const event = getEventById(input.eventId);
  if (!event || !event.isActive) throw new Error("EVENT_NOT_FOUND");
  const name = input.name.trim();
  if (!name) throw new Error("INVALID_NAME");

  const dup = getDb()
    .prepare(
      "SELECT id FROM event_rsvps WHERE event_id = ? AND lower(name) = lower(?)"
    )
    .get(event.id, name);
  if (dup) throw new Error("DUPLICATE_RSVP");

  const stamp = nowIso();
  const result = getDb()
    .prepare(
      "INSERT INTO event_rsvps (event_id, date, name, created_at) VALUES (?, ?, ?, ?)"
    )
    .run(event.id, event.date, name, stamp);

  return {
    id: Number(result.lastInsertRowid),
    eventId: event.id,
    date: event.date,
    name,
    createdAt: stamp,
  };
}

export function getEventGuestLists(
  sort: "newest" | "oldest" = "newest"
): EventGuestList[] {
  const events = getAllEvents();
  const order = sort === "newest" ? "DESC" : "ASC";
  return events.map((event) => {
    const guests = (
      getDb()
        .prepare(
          `SELECT * FROM event_rsvps WHERE event_id = ? ORDER BY created_at ${order}`
        )
        .all(event.id) as Array<Record<string, unknown>>
    ).map((row) => ({
      id: row.id as number,
      eventId: row.event_id as number,
      date: row.date as string,
      name: row.name as string,
      createdAt: row.created_at as string,
    }));
    return {
      eventId: event.id,
      eventTitle: event.title,
      date: event.date,
      guests,
    };
  });
}

export function deleteEventRsvp(id: number): boolean {
  return Number(getDb().prepare("DELETE FROM event_rsvps WHERE id = ?").run(id).changes) > 0;
}

export function submitAwardBallot(input: {
  voterName: string;
  nominations: Record<string, string>;
}): AwardBallot {
  const voterName = input.voterName.trim();
  if (!voterName) throw new Error("INVALID_NAME");
  const dup = getDb()
    .prepare("SELECT id FROM award_ballots WHERE lower(voter_name) = lower(?)")
    .get(voterName);
  if (dup) throw new Error("DUPLICATE_NAME");

  const validIds = new Set(AWARDS.map((a) => a.id));
  const nominations: Record<string, string> = {};
  for (const [awardId, person] of Object.entries(input.nominations)) {
    if (!validIds.has(awardId)) continue;
    const trimmed = person.trim();
    if (trimmed) nominations[awardId] = trimmed;
  }
  if (Object.keys(nominations).length === 0) throw new Error("EMPTY_NOMINATIONS");

  const stamp = nowIso();
  const result = getDb()
    .prepare(
      "INSERT INTO award_ballots (voter_name, nominations_json, created_at) VALUES (?, ?, ?)"
    )
    .run(voterName, JSON.stringify(nominations), stamp);

  return {
    id: Number(result.lastInsertRowid),
    voterName,
    nominations,
    createdAt: stamp,
  };
}

export function getAwardResults(): AwardResult[] {
  const ballots = getDb()
    .prepare("SELECT nominations_json FROM award_ballots")
    .all() as Array<{ nominations_json: string }>;

  return AWARDS.map((award) => {
    const counts = new Map<string, { name: string; votes: number }>();
    for (const ballot of ballots) {
      const nominations = JSON.parse(ballot.nominations_json) as Record<
        string,
        string
      >;
      const nominee = nominations[award.id]?.trim();
      if (!nominee) continue;
      const key = nominee.toLowerCase();
      const existing = counts.get(key);
      if (existing) existing.votes += 1;
      else counts.set(key, { name: nominee, votes: 1 });
    }
    const top = [...counts.values()]
      .sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name))
      .slice(0, 3);
    return { awardId: award.id, awardTitle: award.title, top };
  });
}

export function findAdminByUsername(username: string): {
  id: number;
  username: string;
  passwordHash: string;
} | null {
  const row = getDb()
    .prepare(
      "SELECT id, username, password_hash AS passwordHash FROM admins WHERE username = ?"
    )
    .get(username) as
    | { id: number; username: string; passwordHash: string }
    | undefined;
  return row ?? null;
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

export function resetAdminFromEnv(): { username: string } {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "Admin123!";
  const passwordHash = bcrypt.hashSync(password, 12);
  const database = getDb();
  const existing = database.prepare("SELECT id FROM admins LIMIT 1").get() as
    | { id: number }
    | undefined;
  if (!existing) {
    database
      .prepare(
        "INSERT INTO admins (username, password_hash, created_at) VALUES (?, ?, ?)"
      )
      .run(username, passwordHash, nowIso());
  } else {
    database
      .prepare(
        "UPDATE admins SET username = ?, password_hash = ? WHERE id = ?"
      )
      .run(username, passwordHash, existing.id);
  }
  return { username };
}

export function getStorePath(): string {
  return DB_PATH;
}
