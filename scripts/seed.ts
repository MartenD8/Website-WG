/**
 * Seed script – creates sample events for the calendar period.
 * Run: npm run db:seed
 *
 * Loads .env.local if present (without extra dependency).
 */
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "store.json");
const YEAR =
  Number(process.env.NEXT_PUBLIC_CALENDAR_YEAR || process.env.CALENDAR_YEAR) ||
  new Date().getFullYear();

function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf-8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(path.join(process.cwd(), ".env.local"));
loadEnvFile(path.join(process.cwd(), ".env"));

interface SeedEvent {
  date: string;
  title: string;
  description: string;
  explorationLevel: 1 | 2 | 3 | 4 | 5;
  youtubeUrl: string;
  previewImage: null;
  isActive: boolean;
}

const samples: SeedEvent[] = [
  {
    date: `${YEAR}-09-26`,
    title: "Kick-off: Willkommen im Kalender",
    description:
      "Der Startschuss für die Event-Reihe. Wir stellen das Format vor, erklären die Explorationsstufen und zeigen, wie du die täglichen Videos optimal nutzt.",
    explorationLevel: 1,
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    previewImage: null,
    isActive: true,
  },
  {
    date: `${YEAR}-09-27`,
    title: "Grundlagen der Exploration",
    description:
      "Lerne die Bausteine kennen: Beobachtung, Fragen stellen und erste Hypothesen formulieren. Ideal für Einsteigerinnen und Einsteiger.",
    explorationLevel: 2,
    youtubeUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    previewImage: null,
    isActive: true,
  },
  {
    date: `${YEAR}-09-30`,
    title: "Methoden im Fokus",
    description:
      "Vertiefung: Wir vergleichen verschiedene Explorationsmethoden und zeigen, wann welche Methode besonders gut funktioniert.",
    explorationLevel: 3,
    youtubeUrl: "https://www.youtube.com/watch?v=9bZkp7q19f0",
    previewImage: null,
    isActive: true,
  },
  {
    date: `${YEAR}-10-03`,
    title: "Praxis-Workshop",
    description:
      "Hands-on Session mit konkreten Übungen. Pausiere das Video und arbeite die Aufgaben parallel mit – dann geht es gemeinsam weiter.",
    explorationLevel: 3,
    youtubeUrl: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
    previewImage: null,
    isActive: true,
  },
  {
    date: `${YEAR}-10-07`,
    title: "Fortgeschrittene Strategien",
    description:
      "Komplexe Szenarien, Trade-offs und Entscheidungsheuristiken. Für alle, die die Grundlagen bereits sicher beherrschen.",
    explorationLevel: 4,
    youtubeUrl: "https://www.youtube.com/watch?v=fJ9rUzIMcZQ",
    previewImage: null,
    isActive: true,
  },
  {
    date: `${YEAR}-10-12`,
    title: "Experten-Deep-Dive",
    description:
      "Ein intensiver Deep-Dive mit Edge-Cases, Performance-Überlegungen und Best Practices aus der Praxis.",
    explorationLevel: 5,
    youtubeUrl: "https://www.youtube.com/watch?v=3JZ_D3ELwOQ",
    previewImage: null,
    isActive: true,
  },
  {
    date: `${YEAR}-10-15`,
    title: "Community Highlights",
    description:
      "Rückblick auf die besten Momente der bisherigen Events und Ausblick auf kommende Formate.",
    explorationLevel: 2,
    youtubeUrl: "https://www.youtube.com/watch?v=L_jWHffIx5E",
    previewImage: null,
    isActive: true,
  },
  {
    date: `${YEAR}-10-18`,
    title: "Finale & Ausblick",
    description:
      "Abschluss der Kalenderperiode: Zusammenfassung der wichtigsten Learnings und Tipps für den weiteren Weg.",
    explorationLevel: 4,
    youtubeUrl: "https://www.youtube.com/watch?v=hTWKbfoikeg",
    previewImage: null,
    isActive: true,
  },
];

interface Store {
  admins: Array<{
    id: number;
    username: string;
    passwordHash: string;
    createdAt: string;
  }>;
  events: Array<{
    id: number;
    date: string;
    title: string;
    description: string;
    explorationLevel: number;
    youtubeUrl: string | null;
    previewImage: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  nextAdminId: number;
  nextEventId: number;
}

function main(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  let store: Store;
  if (fs.existsSync(DB_PATH)) {
    store = JSON.parse(fs.readFileSync(DB_PATH, "utf-8")) as Store;
  } else {
    store = { admins: [], events: [], nextAdminId: 1, nextEventId: 1 };
  }

  if (store.admins.length === 0) {
    const username = process.env.ADMIN_USERNAME || "admin";
    const password = process.env.ADMIN_PASSWORD || "Admin123!";
    store.admins.push({
      id: store.nextAdminId++,
      username,
      passwordHash: bcrypt.hashSync(password, 12),
      createdAt: new Date().toISOString(),
    });
    console.log(`Admin angelegt: ${username}`);
  }

  const stamp = new Date().toISOString();
  for (const sample of samples) {
    const existing = store.events.find((e) => e.date === sample.date);
    if (existing) {
      existing.title = sample.title;
      existing.description = sample.description;
      existing.explorationLevel = sample.explorationLevel;
      existing.youtubeUrl = sample.youtubeUrl;
      existing.previewImage = sample.previewImage;
      existing.isActive = sample.isActive;
      existing.updatedAt = stamp;
    } else {
      store.events.push({
        id: store.nextEventId++,
        ...sample,
        createdAt: stamp,
        updatedAt: stamp,
      });
    }
  }

  fs.writeFileSync(DB_PATH, JSON.stringify(store, null, 2), "utf-8");
  console.log(`Seed abgeschlossen: ${samples.length} Events für ${YEAR}`);
  console.log(`Datei: ${DB_PATH}`);
}

main();
