import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import type {
  BeerEntry,
  BeerStats,
  Event,
  EventInput,
  ExplorationLevel,
} from "@/types";

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
  nextAdminId: number;
  nextEventId: number;
  nextBeerEntryId: number;
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
    nextAdminId: 1,
    nextEventId: 1,
    nextBeerEntryId: 1,
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
    nextAdminId: raw.nextAdminId ?? 1,
    nextEventId: raw.nextEventId ?? 1,
    nextBeerEntryId: raw.nextBeerEntryId ?? 1,
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
