import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import type { Event, EventInput, ExplorationLevel } from "@/types";

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
  nextAdminId: number;
  nextEventId: number;
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
    nextAdminId: 1,
    nextEventId: 1,
  };
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

  const raw = fs.readFileSync(DB_PATH, "utf-8");
  cache = JSON.parse(raw) as Store;
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

/** Invalidate in-memory cache (e.g. after external seed) */
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

  if (
    store.events.some((e) => e.date === input.date && e.id !== id)
  ) {
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
  if (store.events.length === before) return false;
  writeStore(store);
  return true;
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

/** Used by seed script / tests */
export function replaceAllEvents(events: Omit<Event, "id" | "createdAt" | "updatedAt">[]): void {
  const store = readStore();
  const stamp = nowIso();
  store.events = events.map((e) => ({
    ...e,
    id: store.nextEventId++,
    createdAt: stamp,
    updatedAt: stamp,
  }));
  writeStore(store);
}

export function getStorePath(): string {
  return DB_PATH;
}
