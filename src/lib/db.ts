import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
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
const DB_PATH = path.join(DATA_DIR, "store.json");

interface Store {
  admins: Array<{
    id: number;
    username: string;
    passwordHash: string;
    createdAt: string;
  }>;
  events: Event[];
  beerEntries: BeerEntry[];
  quizSubmissions: QuizSubmission[];
  awardBallots: AwardBallot[];
  eventRsvps: EventRsvp[];
  nextAdminId: number;
  nextEventId: number;
  nextBeerEntryId: number;
  nextQuizSubmissionId: number;
  nextAwardBallotId: number;
  nextEventRsvpId: number;
}

let cache: Store | null = null;

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function emptyStore(): Store {
  return {
    admins: [],
    events: [],
    beerEntries: [],
    quizSubmissions: [],
    awardBallots: [],
    eventRsvps: [],
    nextAdminId: 1,
    nextEventId: 1,
    nextBeerEntryId: 1,
    nextQuizSubmissionId: 1,
    nextAwardBallotId: 1,
    nextEventRsvpId: 1,
  };
}

function normalizeEvent(raw: Partial<Event> & { id: number; date: string }): Event {
  return {
    id: raw.id,
    date: raw.date,
    title: raw.title ?? "",
    description: raw.description ?? "",
    explorationLevel: (raw.explorationLevel ?? 1) as ExplorationLevel,
    youtubeUrl: raw.youtubeUrl ?? null,
    previewImage: raw.previewImage ?? null,
    isActive: raw.isActive !== false,
    beerCounterEnabled: Boolean(raw.beerCounterEnabled),
    createdAt: raw.createdAt ?? nowIso(),
    updatedAt: raw.updatedAt ?? nowIso(),
  };
}

function migrateStore(raw: Partial<Store>): Store {
  const store: Store = {
    admins: raw.admins ?? [],
    events: (raw.events ?? []).map((e) => normalizeEvent(e)),
    beerEntries: raw.beerEntries ?? [],
    quizSubmissions: raw.quizSubmissions ?? [],
    awardBallots: raw.awardBallots ?? [],
    eventRsvps: raw.eventRsvps ?? [],
    nextAdminId: raw.nextAdminId ?? 1,
    nextEventId: raw.nextEventId ?? 1,
    nextBeerEntryId: raw.nextBeerEntryId ?? 1,
    nextQuizSubmissionId: raw.nextQuizSubmissionId ?? 1,
    nextAwardBallotId: raw.nextAwardBallotId ?? 1,
    nextEventRsvpId: raw.nextEventRsvpId ?? 1,
  };
  return store;
}

function readStore(): Store {
  if (cache) return cache;
  ensureDataDir();

  if (!fs.existsSync(DB_PATH)) {
    cache = emptyStore();
    ensureAdmin(cache);
    writeStore(cache);
    return cache;
  }

  const parsed = JSON.parse(fs.readFileSync(DB_PATH, "utf-8")) as Partial<Store>;
  cache = migrateStore(parsed);
  ensureAdmin(cache);
  return cache;
}

function writeStore(store: Store): void {
  ensureDataDir();
  const tmp = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), "utf-8");
  fs.renameSync(tmp, DB_PATH);
  cache = store;
}

function ensureAdmin(store: Store): void {
  if (store.admins.length > 0) return;

  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "Admin123!";
  const passwordHash = bcrypt.hashSync(password, 12);

  store.admins.push({
    id: store.nextAdminId++,
    username,
    passwordHash,
    createdAt: nowIso(),
  });
  writeStore(store);
}

export function resetDbCache(): void {
  cache = null;
}

export function getAllEvents(): Event[] {
  return [...readStore().events].sort((a, b) => a.date.localeCompare(b.date));
}

export function getActiveEvents(): Event[] {
  return getAllEvents().filter((e) => e.isActive);
}

export function getEventById(id: number): Event | null {
  return readStore().events.find((e) => e.id === id) ?? null;
}

export function getEventByDate(date: string): Event | null {
  return readStore().events.find((e) => e.date === date) ?? null;
}

export function createEvent(input: EventInput): Event {
  const store = readStore();
  if (store.events.some((e) => e.date === input.date)) {
    throw new Error("UNIQUE constraint failed: events.date");
  }

  const stamp = nowIso();
  const event: Event = {
    id: store.nextEventId++,
    date: input.date,
    title: input.title,
    description: input.description,
    explorationLevel: input.explorationLevel,
    youtubeUrl: input.youtubeUrl ?? null,
    previewImage: input.previewImage ?? null,
    isActive: input.isActive !== false,
    beerCounterEnabled: Boolean(input.beerCounterEnabled),
    createdAt: stamp,
    updatedAt: stamp,
  };

  store.events.push(event);
  writeStore(store);
  return event;
}

export function updateEvent(id: number, input: EventInput): Event | null {
  const store = readStore();
  const index = store.events.findIndex((e) => e.id === id);
  if (index < 0) return null;

  if (store.events.some((e) => e.date === input.date && e.id !== id)) {
    throw new Error("UNIQUE constraint failed: events.date");
  }

  const existing = store.events[index];
  const updated: Event = {
    ...existing,
    date: input.date,
    title: input.title,
    description: input.description,
    explorationLevel: input.explorationLevel as ExplorationLevel,
    youtubeUrl: input.youtubeUrl ?? null,
    previewImage: input.previewImage ?? null,
    isActive: input.isActive !== false,
    beerCounterEnabled: Boolean(input.beerCounterEnabled),
    updatedAt: nowIso(),
  };

  store.events[index] = updated;
  writeStore(store);
  return updated;
}

export function deleteEvent(id: number): boolean {
  const store = readStore();
  const before = store.events.length;
  store.events = store.events.filter((e) => e.id !== id);
  store.beerEntries = store.beerEntries.filter((b) => b.eventId !== id);
  store.eventRsvps = store.eventRsvps.filter((r) => r.eventId !== id);
  if (store.events.length === before) return false;
  writeStore(store);
  return true;
}

export function addBeerEntry(input: {
  eventId: number;
  name: string;
  beers: number;
}): BeerEntry {
  const store = readStore();
  const event = store.events.find((e) => e.id === input.eventId);
  if (!event || !event.isActive) {
    throw new Error("EVENT_NOT_FOUND");
  }
  if (!event.beerCounterEnabled) {
    throw new Error("BEER_COUNTER_DISABLED");
  }

  const nameKey = input.name.trim().toLowerCase();
  const alreadyEntered = store.beerEntries.some(
    (e) => e.eventId === event.id && e.name.trim().toLowerCase() === nameKey
  );
  if (alreadyEntered) {
    throw new Error("DUPLICATE_NAME");
  }

  const entry: BeerEntry = {
    id: store.nextBeerEntryId++,
    eventId: event.id,
    date: event.date,
    name: input.name.trim(),
    beers: input.beers,
    createdAt: nowIso(),
  };

  store.beerEntries.push(entry);
  writeStore(store);
  return entry;
}

export function getBeerStats(): BeerStats {
  const store = readStore();
  const enabledIds = new Set(
    store.events.filter((e) => e.beerCounterEnabled).map((e) => e.id)
  );
  const entries = store.beerEntries.filter((e) => enabledIds.has(e.eventId));

  const totalBeers = entries.reduce((sum, e) => sum + e.beers, 0);

  const byName = new Map<string, { displayName: string; beers: number }>();
  for (const entry of entries) {
    const key = entry.name.trim().toLowerCase();
    if (!key) continue;
    const existing = byName.get(key);
    if (existing) {
      existing.beers += entry.beers;
    } else {
      byName.set(key, { displayName: entry.name.trim(), beers: entry.beers });
    }
  }

  let topDrinker: string | null = null;
  let topDrinkerBeers = 0;
  for (const row of byName.values()) {
    if (row.beers > topDrinkerBeers) {
      topDrinkerBeers = row.beers;
      topDrinker = row.displayName;
    }
  }

  return { totalBeers, topDrinker, topDrinkerBeers };
}

export function getBeerPersonOverview(): BeerPersonOverview[] {
  const store = readStore();
  const eventById = new Map(store.events.map((e) => [e.id, e]));
  const byName = new Map<string, BeerPersonOverview>();

  for (const entry of store.beerEntries) {
    const key = entry.name.trim().toLowerCase();
    if (!key) continue;
    const event = eventById.get(entry.eventId);
    const row = byName.get(key) ?? {
      name: entry.name.trim(),
      totalBeers: 0,
      entries: [],
    };
    row.totalBeers += entry.beers;
    row.entries.push({
      id: entry.id,
      eventId: entry.eventId,
      eventTitle: event?.title || `Event #${entry.eventId}`,
      date: entry.date,
      name: entry.name.trim(),
      beers: entry.beers,
      createdAt: entry.createdAt,
    });
    byName.set(key, row);
  }

  return [...byName.values()]
    .map((p) => ({
      ...p,
      entries: p.entries.sort((a, b) => a.date.localeCompare(b.date)),
    }))
    .sort((a, b) => b.totalBeers - a.totalBeers || a.name.localeCompare(b.name));
}

export function updateBeerEntry(
  id: number,
  input: { name?: string; beers?: number }
): BeerEntry | null {
  const store = readStore();
  const index = store.beerEntries.findIndex((e) => e.id === id);
  if (index < 0) return null;

  const existing = store.beerEntries[index];
  const nextName = input.name?.trim() ?? existing.name;
  const nextBeers = input.beers ?? existing.beers;

  if (!nextName) throw new Error("INVALID_NAME");
  if (!Number.isInteger(nextBeers) || nextBeers < 1 || nextBeers > 50) {
    throw new Error("INVALID_BEERS");
  }

  const nameKey = nextName.toLowerCase();
  const duplicate = store.beerEntries.some(
    (e) =>
      e.id !== id &&
      e.eventId === existing.eventId &&
      e.name.trim().toLowerCase() === nameKey
  );
  if (duplicate) throw new Error("DUPLICATE_NAME");

  const updated: BeerEntry = {
    ...existing,
    name: nextName,
    beers: nextBeers,
  };
  store.beerEntries[index] = updated;
  writeStore(store);
  return updated;
}

export function deleteBeerEntry(id: number): boolean {
  const store = readStore();
  const before = store.beerEntries.length;
  store.beerEntries = store.beerEntries.filter((e) => e.id !== id);
  if (store.beerEntries.length === before) return false;
  writeStore(store);
  return true;
}

export function submitQuiz(input: {
  name: string;
  answers: Record<string, string | Record<string, string>>;
}): QuizSubmission {
  const store = readStore();
  const name = input.name.trim();
  if (!name) throw new Error("INVALID_NAME");

  const nameKey = name.toLowerCase();
  if (
    store.quizSubmissions.some((s) => s.name.trim().toLowerCase() === nameKey)
  ) {
    throw new Error("DUPLICATE_NAME");
  }

  const { correctCount } = scoreQuizAnswers(input.answers);
  const submission: QuizSubmission = {
    id: store.nextQuizSubmissionId++,
    name,
    answers: input.answers,
    correctCount,
    totalQuestions: QUIZ_QUESTIONS.length,
    createdAt: nowIso(),
  };
  store.quizSubmissions.push(submission);
  writeStore(store);
  return submission;
}

export function getQuizSubmissions(): QuizSubmission[] {
  return [...readStore().quizSubmissions].sort(
    (a, b) =>
      b.correctCount - a.correctCount || a.name.localeCompare(b.name)
  );
}

export function updateQuizSubmission(
  id: number,
  input: {
    name?: string;
    answers?: Record<string, string | Record<string, string>>;
  }
): QuizSubmission | null {
  const store = readStore();
  const index = store.quizSubmissions.findIndex((s) => s.id === id);
  if (index < 0) return null;

  const existing = store.quizSubmissions[index];
  const nextName = input.name?.trim() ?? existing.name;
  if (!nextName) throw new Error("INVALID_NAME");

  const nameKey = nextName.toLowerCase();
  const duplicate = store.quizSubmissions.some(
    (s) => s.id !== id && s.name.trim().toLowerCase() === nameKey
  );
  if (duplicate) throw new Error("DUPLICATE_NAME");

  const answers = input.answers ?? existing.answers;
  const { correctCount } = scoreQuizAnswers(answers);

  const updated: QuizSubmission = {
    ...existing,
    name: nextName,
    answers,
    correctCount,
    totalQuestions: QUIZ_QUESTIONS.length,
  };
  store.quizSubmissions[index] = updated;
  writeStore(store);
  return updated;
}

export function deleteQuizSubmission(id: number): boolean {
  const store = readStore();
  const before = store.quizSubmissions.length;
  store.quizSubmissions = store.quizSubmissions.filter((s) => s.id !== id);
  if (store.quizSubmissions.length === before) return false;
  writeStore(store);
  return true;
}

export function addEventRsvp(input: {
  eventId: number;
  name: string;
}): EventRsvp {
  const store = readStore();
  const event = store.events.find((e) => e.id === input.eventId);
  if (!event || !event.isActive) throw new Error("EVENT_NOT_FOUND");

  const name = input.name.trim();
  if (!name) throw new Error("INVALID_NAME");

  const nameKey = name.toLowerCase();
  const duplicate = store.eventRsvps.some(
    (r) => r.eventId === event.id && r.name.trim().toLowerCase() === nameKey
  );
  if (duplicate) throw new Error("DUPLICATE_RSVP");

  const rsvp: EventRsvp = {
    id: store.nextEventRsvpId++,
    eventId: event.id,
    date: event.date,
    name,
    createdAt: nowIso(),
  };
  store.eventRsvps.push(rsvp);
  writeStore(store);
  return rsvp;
}

export function getEventGuestLists(
  sort: "newest" | "oldest" = "newest"
): EventGuestList[] {
  const store = readStore();
  const events = [...store.events].sort((a, b) => a.date.localeCompare(b.date));

  return events.map((event) => {
    const guests = store.eventRsvps
      .filter((r) => r.eventId === event.id)
      .sort((a, b) =>
        sort === "newest"
          ? b.createdAt.localeCompare(a.createdAt)
          : a.createdAt.localeCompare(b.createdAt)
      );
    return {
      eventId: event.id,
      eventTitle: event.title,
      date: event.date,
      guests,
    };
  });
}

export function deleteEventRsvp(id: number): boolean {
  const store = readStore();
  const before = store.eventRsvps.length;
  store.eventRsvps = store.eventRsvps.filter((r) => r.id !== id);
  if (store.eventRsvps.length === before) return false;
  writeStore(store);
  return true;
}

export function submitAwardBallot(input: {
  voterName: string;
  nominations: Record<string, string>;
}): AwardBallot {
  const store = readStore();
  const voterName = input.voterName.trim();
  if (!voterName) throw new Error("INVALID_NAME");

  const nameKey = voterName.toLowerCase();
  if (
    store.awardBallots.some((b) => b.voterName.trim().toLowerCase() === nameKey)
  ) {
    throw new Error("DUPLICATE_NAME");
  }

  const validIds = new Set(AWARDS.map((a) => a.id));
  const nominations: Record<string, string> = {};
  for (const [awardId, person] of Object.entries(input.nominations)) {
    if (!validIds.has(awardId)) continue;
    const trimmed = person.trim();
    if (trimmed) nominations[awardId] = trimmed;
  }

  if (Object.keys(nominations).length === 0) {
    throw new Error("EMPTY_NOMINATIONS");
  }

  const ballot: AwardBallot = {
    id: store.nextAwardBallotId++,
    voterName,
    nominations,
    createdAt: nowIso(),
  };
  store.awardBallots.push(ballot);
  writeStore(store);
  return ballot;
}

export function getAwardResults(): AwardResult[] {
  const store = readStore();
  return AWARDS.map((award) => {
    const counts = new Map<string, { name: string; votes: number }>();
    for (const ballot of store.awardBallots) {
      const nominee = ballot.nominations[award.id]?.trim();
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
  const admin = readStore().admins.find((a) => a.username === username);
  if (!admin) return null;
  return {
    id: admin.id,
    username: admin.username,
    passwordHash: admin.passwordHash,
  };
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

export function resetAdminFromEnv(): { username: string } {
  const store = readStore();
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "Admin123!";
  const passwordHash = bcrypt.hashSync(password, 12);
  const stamp = nowIso();

  if (store.admins.length === 0) {
    store.admins.push({
      id: store.nextAdminId++,
      username,
      passwordHash,
      createdAt: stamp,
    });
  } else {
    store.admins[0] = {
      ...store.admins[0],
      username,
      passwordHash,
    };
  }

  writeStore(store);
  return { username };
}

export function getStorePath(): string {
  return DB_PATH;
}
