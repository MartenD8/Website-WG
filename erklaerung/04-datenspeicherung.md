# 04 – Datenspeicherung

## Zentrale Datei

Alle dynamischen Daten liegen in:

```
data/wg.db
```

(SQLite, Modul `node:sqlite` – Node.js **22+**, kein natives Addon nötig.)

Pfad im Code: `src/lib/db.ts` (`DB_PATH`).

- Die Datei wird **automatisch angelegt**, wenn sie fehlt.
- Sie ist in `.gitignore` – wird **nicht** mit Git ausgeliefert.
- Alte `data/store.json` wird **einmalig** nach SQLite migriert (dann umbenannt in `store.json.migrated`).

Statische Inhalte (Quizfragen, Award-Liste) stehen **nicht** in der DB, sondern im Code unter `src/data/`.

Hochgeladene Event-Videos liegen als Dateien unter `public/uploads/videos/`. In der Datenbank steht nur der Pfad (`events.video_path`). Der Ordner ist gitignored und muss separat gesichert werden.

---

## Was steckt in der Datenbank?

Tabellen u. a.: `admins`, `events`, `beer_entries`, `quiz_submissions`, `award_ballots`, `event_rsvps`.

---

## Statische Datenquellen (Code)

| Inhalt | Datei |
|--------|--------|
| Quizfragen + Lösungen + Ergebnis-Texte | `src/data/quiz.ts` |
| Award-Namen | `src/data/awards.ts` |

Änderungen dort gelten nach **Build/Neustart** der App – nicht über den Admin-Editor.

---

## Umgebung / Secrets

Datei: `.env.local` (lokal) bzw. auf dem Server (nicht committen)

| Variable | Bedeutung |
|----------|-----------|
| `AUTH_SECRET` | JWT-Signatur (Pflicht) |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Initialer Admin (beim ersten Anlegen / `npm run admin:reset`) |
| `NEXT_PUBLIC_SITE_URL` | Öffentliche URL |
| `NEXT_PUBLIC_CALENDAR_YEAR` | Optional Kalenderjahr |
| `COOKIE_SECURE` | Optional Cookie-Secure erzwingen |

Sessions: JWT-Cookie `event_admin_session` (httpOnly).

---

## Backup & Restore

**Backup:**

```bash
cp data/wg.db /pfad/zum/backup/wg-$(date +%F).db
# Hochgeladene Videos liegen außerhalb der Datenbank:
cp -r public/uploads/videos /pfad/zum/backup/videos-$(date +%F)
```

**Restore:** Datei zurückkopieren und App neu starten (`pm2 restart …`).

**Achtung:** Bei `npm run db:seed` werden Beispiel-Events geschrieben/aktualisiert.
