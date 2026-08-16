/**
 * Seed sample events into SQLite (data/wg.db).
 * Run: npm run db:seed
 */
import path from "path";
import fs from "fs";
import {
  createEvent,
  getEventByDate,
  getStorePath,
  updateEvent,
} from "@/lib/db";

const YEAR =
  Number(process.env.NEXT_PUBLIC_CALENDAR_YEAR || process.env.CALENDAR_YEAR) ||
  new Date().getFullYear();

function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf-8").split(/\r?\n/)) {
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

const samples = [
  {
    date: `${YEAR}-09-26`,
    title: "Kick-off: Willkommen im Kalender",
    description:
      "Der Startschuss für die Event-Reihe. Wir stellen das Format vor, erklären die Explorationsstufen und zeigen, wie du die täglichen Videos optimal nutzt.",
    explorationLevel: 1 as const,
    videoPath: null,
    isActive: true,
    beerCounterEnabled: false,
  },
  {
    date: `${YEAR}-09-27`,
    title: "Grundlagen der Exploration",
    description:
      "Lerne die Bausteine kennen: Beobachtung, Fragen stellen und erste Hypothesen formulieren.",
    explorationLevel: 2 as const,
    videoPath: null,
    isActive: true,
    beerCounterEnabled: false,
  },
  {
    date: `${YEAR}-10-18`,
    title: "Finale & Ausblick",
    description:
      "Abschluss der Kalenderperiode: Zusammenfassung der wichtigsten Learnings.",
    explorationLevel: 4 as const,
    videoPath: null,
    isActive: true,
    beerCounterEnabled: false,
  },
  {
    date: `${YEAR}-10-19`,
    title: "Abschluss-Zeitraum",
    description:
      "Vom 19. bis 29. Oktober – der besondere Abschlusszeitraum mit weiteren Highlights der WG.",
    explorationLevel: 5 as const,
    videoPath: null,
    isActive: true,
    beerCounterEnabled: false,
  },
];

for (const sample of samples) {
  const existing = getEventByDate(sample.date);
  if (existing) {
    updateEvent(existing.id, sample);
  } else {
    createEvent(sample);
  }
}

console.log(`Seed OK: ${samples.length} Events → ${getStorePath()}`);
