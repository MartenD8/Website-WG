/**
 * Reset admin from env into SQLite.
 * Usage: npm run admin:reset
 */
import path from "path";
import fs from "fs";
import { getStorePath, resetAdminFromEnv } from "@/lib/db";

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

const { username } = resetAdminFromEnv();
console.log(`Admin zurückgesetzt: Benutzername="${username}"`);
console.log(`Datei: ${getStorePath()}`);
console.log("App neu starten (pm2 restart …), dann anmelden.");
