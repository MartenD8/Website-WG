# 04 – Datenspeicherung

## Zentrale Datei

Alle dynamischen Daten liegen in:

```
data/store.json
```

Pfad im Code: `src/lib/db.ts` (`DB_PATH`).

- Die Datei wird **automatisch angelegt**, wenn sie fehlt.
- Sie ist in `.gitignore` – wird **nicht** mit Git ausgeliefert.
- Auf dem Server bleibt sie lokal im Projektordner (Backups separat machen!).

Statische Inhalte (Quizfragen, Award-Liste) stehen **nicht** in `store.json`, sondern im Code unter `src/data/`.

---

## Was steckt in `store.json`?

| Schlüssel | Inhalt |
|-----------|--------|
| `admins` | Admin-Benutzer (Benutzername + **Passwort-Hash**, nie Klartext) |
| `events` | Alle Kalender-Events |
| `beerEntries` | Bier-Einträge (Name, Anzahl, Event) |
| `quizSubmissions` | Quiz-Teilnahmen inkl. Antworten & Punktzahl |
| `awardBallots` | Award-Abstimmungen (Wähler + Nominierungen) |
| `eventRsvps` | Event-Anmeldungen (Gäste) |
| `next*Id` | Laufende IDs für neue Einträge |

### Event (vereinfacht)

- `date`, `title`, `description`
- `explorationLevel` (1–5)
- `youtubeUrl`, `previewImage`
- `isActive`
- `beerCounterEnabled`

### Beispiel-Struktur (Ausschnitt)

```json
{
  "admins": [{ "id": 1, "username": "admin", "passwordHash": "..." }],
  "events": [{ "id": 1, "date": "2026-09-26", "title": "...", "beerCounterEnabled": true }],
  "beerEntries": [{ "id": 1, "eventId": 1, "name": "Max", "beers": 3 }],
  "quizSubmissions": [],
  "awardBallots": [],
  "eventRsvps": [],
  "nextEventId": 2,
  "nextBeerEntryId": 2
}
```

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
cp data/store.json /pfad/zum/backup/store-$(date +%F).json
```

**Restore:** Datei zurückkopieren und App neu starten (`pm2 restart …`).

**Achtung:** Bei `npm run db:seed` werden Beispiel-Events geschrieben/überschrieben (gleiche Daten). Admin bleibt erhalten, wenn schon vorhanden.

---

## Warum keine SQL-Datenbank?

Für wenige Events und einfache Formulare reicht eine JSON-Datei. Vorteile: kein natives Modul, einfaches Backup, wenig Betrieb. Grenzen: keine parallelen Schreibzugriffe unter Last, alles in einer Datei – für eine WG-Party-Website ausreichend.
