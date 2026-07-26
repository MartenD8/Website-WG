/**
 * Reset admin username/password from environment variables.
 * Usage on the server:
 *   ADMIN_USERNAME=admin ADMIN_PASSWORD='DeinNeuesPasswort' npm run admin:reset
 */
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "store.json");

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
loadEnvFile(path.join(process.cwd(), ".env.production.local"));
loadEnvFile(path.join(process.cwd(), ".env.production"));
loadEnvFile(path.join(process.cwd(), ".env"));

interface Store {
  admins: Array<{
    id: number;
    username: string;
    passwordHash: string;
    createdAt: string;
  }>;
  events: unknown[];
  nextAdminId: number;
  nextEventId: number;
}

function main(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "Admin123!";

  let store: Store;
  if (fs.existsSync(DB_PATH)) {
    store = JSON.parse(fs.readFileSync(DB_PATH, "utf-8")) as Store;
  } else {
    store = { admins: [], events: [], nextAdminId: 1, nextEventId: 1 };
  }

  const passwordHash = bcrypt.hashSync(password, 12);
  const stamp = new Date().toISOString();

  if (store.admins.length === 0) {
    store.admins.push({
      id: store.nextAdminId++,
      username,
      passwordHash,
      createdAt: stamp,
    });
  } else {
    store.admins[0].username = username;
    store.admins[0].passwordHash = passwordHash;
  }

  fs.writeFileSync(DB_PATH, JSON.stringify(store, null, 2), "utf-8");
  console.log(`Admin zurückgesetzt: Benutzername="${username}"`);
  console.log(`Datei: ${DB_PATH}`);
  console.log("App neu starten (pm2 restart event-calendar), dann anmelden.");
}

main();
