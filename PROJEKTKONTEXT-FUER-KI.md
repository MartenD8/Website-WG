# Projektkontext für KI-Assistenten

> **Zweck dieser Datei:** Dieses Dokument beschreibt das Projekt **„Monat der offenen Tür“** vollständig genug, damit eine KI **ohne Zugriff auf den Quellcode** Fragen beantworten und **passenden Code** (TypeScript, React, Next.js, API-Routen) erzeugen kann.
>
> **Sprache:** UI-Texte und Fehlermeldungen sind **Deutsch**. Code, Typen, Dateinamen und API-Felder sind **Englisch** (camelCase in TS, snake_case in SQLite-Spalten).

---

## 1. Was ist das Projekt?

Eine **Event-Kalender-Website** für die WG-Verabschiedung („Monat der offenen Tür“).

- **Öffentlich:** Kalender mit Tageskacheln, Event-Details, Biercounter, WG-Quiz, Awards-Abstimmung, Event-Anmeldungen (RSVP)
- **Admin:** Geschützter Bereich unter `/admin` für Event-CRUD und Auswertungen
- **Domain (Produktion):** `alleshateinendenurdiewghat24.de`
- **Erwarteter Traffic:** ~50 gleichzeitige Nutzer auf einem kleinen VPS (2 vCPU, 2 GB RAM)

---

## 2. Technologie-Stack

| Bereich | Technologie |
|---------|-------------|
| Framework | **Next.js 15** (App Router) |
| UI | **React 19**, **TypeScript** (strict), **MUI 6** (Material UI) |
| Design | Material Design 3 inspiriert, Hell/Dunkelmodus |
| Backend | Next.js **Route Handlers** unter `src/app/api/` |
| Datenbank | **SQLite** in `data/wg.db` via Node.js **`node:sqlite`** (`DatabaseSync`) |
| Node.js | **≥ 22** (Pflicht wegen `node:sqlite`) |
| Auth | **JWT** (`jose`) in httpOnly-Cookie, Passwort-Hash mit **bcryptjs** (Cost 12) |
| Validierung | **Zod** |
| Datum | **date-fns** (Locale `de`) |
| Deployment | **PM2** + **Nginx** auf Ubuntu |

**Wichtig:** Kein `better-sqlite3`, kein Prisma, kein PostgreSQL. Keine native Build-Tools nötig.

---

## 3. Projektstruktur (Ordner)

```
Website WG/
├── data/
│   ├── wg.db                    # SQLite-Datenbank (gitignored, Laufzeit)
│   ├── uploads/videos/          # Hochgeladene Event-Videos (gitignored)
│   ├── store.json.migrated      # Alte JSON nach Migration (optional)
│   └── .gitkeep
├── deploy/
│   ├── ecosystem.config.cjs     # PM2-Konfiguration (App-Name: event-calendar)
│   └── nginx*.conf              # Reverse Proxy
├── erklaerung/                  # Deutsche Entwickler-Doku
├── scripts/
│   ├── seed.ts                  # npm run db:seed
│   └── reset-admin.ts           # npm run admin:reset
├── src/
│   ├── app/                     # Next.js App Router (Seiten + API)
│   │   ├── page.tsx             # Startseite (Kalender)
│   │   ├── layout.tsx           # Root-Layout, Metadata
│   │   ├── admin/
│   │   │   ├── page.tsx         # Admin-Dashboard
│   │   │   └── login/page.tsx   # Admin-Login
│   │   └── api/                 # REST-API (siehe Abschnitt 8)
│   ├── components/              # React-Komponenten (öffentlich)
│   │   └── admin/               # Admin-Komponenten
│   ├── data/                    # Statische Inhalte (NICHT in DB)
│   │   ├── quiz.ts              # Quizfragen + Auswertung
│   │   └── awards.ts            # Award-Definitionen
│   ├── lib/                     # Backend-Logik
│   │   ├── db.ts                # SQLite-Zugriff (zentrale Schicht)
│   │   ├── auth.ts              # Session-Cookies
│   │   ├── session.ts           # JWT erstellen/verifizieren (Admin + Gast)
│   │   ├── siteAccess.ts        # Zugangsdaten der Besucher-Sperre (Server)
│   │   ├── cookies.ts           # Secure-Flag-Logik für Cookies
│   │   ├── validation.ts        # Zod-Schemas
│   │   ├── video.ts             # Video-Konstanten (client-safe)
│   │   ├── uploads.ts           # Video-Dateien speichern/löschen (Server)
│   │   └── calendar.ts          # Kalender-Logik, Datumsformatierung
│   ├── theme/
│   │   ├── theme.ts             # MUI-Theme, LEVEL_COLORS
│   │   └── ThemeRegistry.tsx    # ThemeProvider, Dark Mode
│   ├── types/
│   │   └── index.ts             # Alle TypeScript-Interfaces
│   └── middleware.ts            # Besucher-Sperre für alles + Schutz für /admin/*
├── .env.example
├── package.json                 # name: "event-calendar"
└── next.config.ts
```

**Import-Alias:** `@/` → `src/` (z. B. `import { Event } from "@/types"`)

---

## 4. Fachbegriffe (Deutsch ↔ Code)

| Deutsch (UI) | Englisch (Code) | Beschreibung |
|--------------|-----------------|--------------|
| Monat der offenen Tür | — | Marken-/Seitentitel |
| Event / Tageskachel | `Event` | Ein Kalendertag mit Inhalten |
| Explorationsstufe / Level | `ExplorationLevel` | 1–5 (Gemütlich → Legendär) |
| Biercounter / Bier-Zähler | `beerCounterEnabled`, `BeerEntry`, `BeerStats` | Pro Event aktivierbar |
| Das große WG-Quiz | `QuizSubmission`, `QuizQuestion` | Fragen statisch in `quiz.ts` |
| Awards | `AwardBallot`, `AwardDefinition` | Abstimmung, Liste in `awards.ts` |
| Event-Anmeldung / Gästeliste | `EventRsvp`, `EventGuestList` | RSVP im Event-Detail-Modal |
| Event-Video | `videoPath`, `EventVideoPlayer` | Selbst gehostetes MP4/WebM |
| Admin | `AdminUser`, `SessionPayload` | Ein Admin-Account in DB |
| Abschluss-Kachel / Finale | `isRange`, `CALENDAR_FINALE_*` | Zeitraum 19.10.–29.10. |
| Halt-Stop-Meldung | `DUPLICATE_NAME` | Doppelte Teilnahme (Bier/Quiz/Awards) |
| Anzahl vergenussverferkelter Bier | `BeerStats.totalBeers` | Banner-Text oben |

---

## 5. Kalender-Logik

### Zeiträume (in `src/types/index.ts`)

```typescript
CALENDAR_START = { month: 9, day: 26 }   // 26. September
CALENDAR_END   = { month: 10, day: 18 }  // 18. Oktober (inklusive)
CALENDAR_FINALE_START = { month: 10, day: 19 }
CALENDAR_FINALE_END   = { month: 10, day: 29 }
```

- **Tageskacheln:** 26.09. – 18.10. (ein Tag = eine Kachel)
- **Extra-Kachel „Abschluss-Zeitraum“:** 19.10. – 29.10., gespeichert als **ein Event** mit Datum `YYYY-10-19` (ISO `YYYY-MM-DD`)
- **Jahr:** `getCalendarYear()` liest `NEXT_PUBLIC_CALENDAR_YEAR` oder `CALENDAR_YEAR`, sonst aktuelles Jahr

### Explorationsstufen (`ExplorationLevel = 1 | 2 | 3 | 4 | 5`)

| Level | Label (`EXPLORATION_LABELS`) |
|-------|------------------------------|
| 1 | Level 1 – Gemütlich |
| 2 | Level 2 – Ausgelassen |
| 3 | Level 3 – Vollgas |
| 4 | Level 4 – Eskalation |
| 5 | Level 5 – Legendär |

**Farben (`LEVEL_COLORS` in `theme.ts`):** Level 4 = Orange, Level 5 = Rot.

---

## 6. TypeScript-Typen (`src/types/index.ts`)

```typescript
type ExplorationLevel = 1 | 2 | 3 | 4 | 5;

interface Event {
  id: number;
  date: string;              // ISO "YYYY-MM-DD"
  title: string;
  description: string;
  explorationLevel: ExplorationLevel;
  videoPath: string | null;    // z. B. "/uploads/videos/<uuid>.mp4"
  isActive: boolean;
  beerCounterEnabled: boolean;
  createdAt: string;           // ISO datetime
  updatedAt: string;
}

interface EventInput {
  date: string;
  title: string;
  description: string;
  explorationLevel: ExplorationLevel;
  videoPath?: string | null;
  isActive?: boolean;
  beerCounterEnabled?: boolean;
}

interface BeerEntry {
  id: number;
  eventId: number;
  date: string;
  name: string;
  beers: number;
  createdAt: string;
}

interface BeerStats {
  totalBeers: number;
  topDrinker: string | null;
  topDrinkerBeers: number;
}

interface BeerPersonOverview {
  name: string;
  totalBeers: number;
  entries: Array<{
    id: number;
    eventId: number;
    eventTitle: string;
    date: string;
    name: string;
    beers: number;
    createdAt: string;
  }>;
}

interface QuizSubmission {
  id: number;
  name: string;
  answers: Record<string, string | Record<string, string>>;
  correctCount: number;
  totalQuestions: number;
  createdAt: string;
}

interface AwardBallot {
  id: number;
  voterName: string;
  nominations: Record<string, string>;  // awardId → Personenname
  createdAt: string;
}

interface AwardResult {
  awardId: string;
  awardTitle: string;
  top: Array<{ name: string; votes: number }>;
}

interface EventRsvp {
  id: number;
  eventId: number;
  date: string;
  name: string;
  createdAt: string;
}

interface EventGuestList {
  eventId: number;
  eventTitle: string;
  date: string;
  guests: EventRsvp[];
}

interface SessionPayload {
  sub: string;       // Admin user id
  username: string;
  iat: number;
  exp: number;
}

interface ApiError {
  error: string;
  details?: unknown;
}
```

### Kalender-Hilfstyp

```typescript
interface CalendarDay {
  date: string;
  event: Event | null;
  hasEvent: boolean;
  isRange?: boolean;   // true für Abschluss-Kachel
}
```

---

## 7. SQLite-Datenbank (`data/wg.db`)

**Modul:** `src/lib/db.ts`  
**Pfad:** `data/wg.db` (über `getStorePath()`)  
**PRAGMA:** `journal_mode=WAL`, `foreign_keys=ON`, `busy_timeout=5000`

### Tabellen

| Tabelle | Zweck |
|---------|-------|
| `admins` | Admin-Benutzer (username, password_hash) |
| `events` | Kalender-Events |
| `beer_entries` | Bier-Einträge pro Event |
| `quiz_submissions` | Quiz-Teilnahmen |
| `award_ballots` | Award-Abstimmungen |
| `event_rsvps` | Event-Anmeldungen |

### Spalten-Mapping (DB snake_case → TS camelCase)

| SQLite-Spalte | TypeScript-Feld |
|---------------|-----------------|
| `exploration_level` | `explorationLevel` |
| `video_path` | `videoPath` |
| `is_active` | `isActive` (INTEGER 0/1 → boolean) |
| `beer_counter_enabled` | `beerCounterEnabled` |
| `event_id` | `eventId` |
| `password_hash` | `passwordHash` |
| `answers_json` | `answers` (JSON geparst) |
| `correct_count` | `correctCount` |
| `total_questions` | `totalQuestions` |
| `voter_name` | `voterName` |
| `nominations_json` | `nominations` (JSON geparst) |

**Schema-Upgrades:** `applySchemaUpgrades()` ergänzt fehlende Spalten (`PRAGMA table_info` + `ALTER TABLE`) beim Öffnen der DB. Die Altspalte `youtube_url` bleibt in bestehenden Datenbanken erhalten, wird aber nicht mehr gelesen oder geschrieben.

### Exportierte DB-Funktionen (`src/lib/db.ts`)

```typescript
// Events
getAllEvents(): Event[]
getActiveEvents(): Event[]
getEventById(id: number): Event | null
getEventByDate(date: string): Event | null
createEvent(input: EventInput): Event
updateEvent(id: number, input: EventInput): Event | null
deleteEvent(id: number): boolean

// Bier
addBeerEntry(input: { eventId: number; name: string; beers: number }): BeerEntry
getBeerStats(): BeerStats
getBeerPersonOverview(): BeerPersonOverview[]
updateBeerEntry(id: number, input: { name?: string; beers?: number }): BeerEntry | null
deleteBeerEntry(id: number): boolean

// Quiz
submitQuiz(input: { name: string; answers: Record<...> }): QuizSubmission
getQuizSubmissions(): QuizSubmission[]
updateQuizSubmission(id: number, input: { name?: string; answers?: ...; recalculate?: boolean }): QuizSubmission | null
deleteQuizSubmission(id: number): boolean

// RSVP
addEventRsvp(input: { eventId: number; name: string }): EventRsvp
getEventGuestLists(): EventGuestList[]
deleteEventRsvp(id: number): boolean

// Awards
submitAwardBallot(input: { voterName: string; nominations: Record<string, string> }): AwardBallot
getAwardResults(): AwardResult[]

// Admin
findAdminByUsername(username: string): { id: number; username: string; passwordHash: string } | null
verifyPassword(plain: string, hash: string): boolean
resetAdminFromEnv(): { username: string }
getStorePath(): string
resetDbCache(): void
```

### DB-Fehlercodes (geworfen als `Error.message`)

| Code | Bedeutung |
|------|-----------|
| `EVENT_NOT_FOUND` | Event existiert nicht oder ist inaktiv |
| `BEER_COUNTER_DISABLED` | Bier-Zähler für Event aus |
| `DUPLICATE_NAME` | Name bereits verwendet (Bier/Quiz/Awards) |
| `DUPLICATE_RSVP` | Person schon für Event angemeldet |
| `EMPTY_NOMINATIONS` | Awards ohne Nominierung |

### JSON-Migration (Legacy)

Beim ersten DB-Start: Wenn `data/store.json` existiert **und** Tabelle `events` leer ist → Daten importieren, Datei umbenennen zu `store.json.migrated`.  
**Wichtig:** `npm run db:seed` vor Migration ausführen würde Migration verhindern!

---

## 8. API-Referenz

Basis-URL: `/api`  
Antwortformat: JSON  
Fehler: `{ error: string, details?: unknown }`

### Auth

| Methode | Route | Auth | Beschreibung |
|---------|-------|------|--------------|
| POST | `/api/auth/login` | — | Login, setzt Cookie |
| GET | `/api/auth/login` | Cookie | Session prüfen (`authenticated: true/false`) |
| DELETE | `/api/auth/login` | — | Logout |
| GET | `/api/auth/me` | Cookie | Aktueller User |
| POST | `/api/auth/logout` | — | Logout (Alternative) |
| POST | `/api/auth/site` | — | **Besucher-Login** (gesamte Website), setzt Gast-Cookie |
| DELETE | `/api/auth/site` | — | Besucher-Logout |

**Cookie-Namen:** `event_admin_session` (`SESSION_COOKIE`) für Admins, `event_guest_session` (`GUEST_COOKIE`) für Besucher  
**Cookie-Flags:** httpOnly, sameSite=lax, secure nur bei HTTPS (`X-Forwarded-Proto` oder `COOKIE_SECURE`) – gemeinsame Logik in `@/lib/cookies`

Login-Body (beide Routen): `{ username: string, password: string }`  
Erfolg Admin: `{ success: true, user: { id, username } }`, Erfolg Besucher: `{ success: true }`

### Events

| Methode | Route | Auth | Beschreibung |
|---------|-------|------|--------------|
| GET | `/api/events` | optional | Öffentlich: nur `isActive`; mit Session: alle |
| POST | `/api/events` | Admin | Event anlegen |
| GET | `/api/events/[id]` | optional | Einzelnes Event |
| PUT | `/api/events/[id]` | Admin | Event bearbeiten |
| DELETE | `/api/events/[id]` | Admin | Event löschen |

Body (POST/PUT): `EventInput` (siehe Zod `eventSchema`)

### Bier

| Methode | Route | Auth | Beschreibung |
|---------|-------|------|--------------|
| GET | `/api/beers` | — | `{ stats: BeerStats }` |
| POST | `/api/beers` | — | `{ eventId, name, beers }` → `{ entry, stats }` |
| PUT | `/api/beers/[id]` | Admin | Eintrag bearbeiten |
| DELETE | `/api/beers/[id]` | Admin | Eintrag löschen |
| GET | `/api/beers/overview` | Admin | Personen-Übersicht |

### Quiz

| Methode | Route | Auth | Beschreibung |
|---------|-------|------|--------------|
| GET | `/api/quiz` | — | Fragen **ohne** Lösungen |
| POST | `/api/quiz` | — | `{ name, answers }` → `{ submission: { id, name, correctCount, totalQuestions } }` |
| GET | `/api/quiz/results` | Admin | Alle Teilnahmen |
| PUT | `/api/quiz/results/[id]` | Admin | Bearbeiten / neu berechnen |
| DELETE | `/api/quiz/results/[id]` | Admin | Löschen |

### Awards

| Methode | Route | Auth | Beschreibung |
|---------|-------|------|--------------|
| GET | `/api/awards` | — | `{ awards: AwardDefinition[] }` |
| POST | `/api/awards` | — | `{ voterName, nominations }` |
| GET | `/api/awards/results` | Admin | Top 3 je Award |

### Video-Upload

| Methode | Route | Auth | Beschreibung |
|---------|-------|------|--------------|
| POST | `/api/uploads/video` | Admin | Datei als **roher Request-Body**, MIME-Typ im `Content-Type` → `{ videoPath }` |
| DELETE | `/api/uploads/video` | Admin | `{ videoPath }` – entfernt eine nicht referenzierte Datei |

- Erlaubt: `video/mp4`, `video/webm`
- **Keine Größenbeschränkung** – der Body wird per Stream direkt auf die Platte geschrieben (konstanter Speicherbedarf). Deshalb **kein** `multipart/form-data`: `request.formData()` würde die komplette Datei in den RAM laden.
- Client lädt per `XMLHttpRequest` hoch, um den Fortschritt anzuzeigen
- Ablage: `data/uploads/videos/<uuid>.<ext>` – **nicht** unter `public/`
- Beim Ersetzen/Löschen eines Events wird die alte Datei automatisch entfernt

### Video-Auslieferung

| Methode | Route | Auth | Beschreibung |
|---------|-------|------|--------------|
| GET | `/uploads/videos/[file]` | Gast | Streamt die Datei, beantwortet `Range` mit `206` |

- Die Route existiert, weil Next.js `public/` **nur beim Build** einliest: zur Laufzeit dort abgelegte Dateien liefern 404. Uploads dürfen deshalb nie in `public/` landen.
- `resolveVideoFile()` in `@/lib/uploads` sucht zuerst in `data/uploads/videos/`, dann im Altbestand `public/uploads/videos/`. Der Pfad in der DB bleibt unverändert `/uploads/videos/<uuid>.<ext>`.
- Range-Antworten sind Pflicht: ohne sie kann der Browser die Länge von MP4s mit Metadaten am Dateiende nicht lesen und zeigt `0:00`.

### RSVP (Event-Anmeldung)

| Methode | Route | Auth | Beschreibung |
|---------|-------|------|--------------|
| POST | `/api/rsvp` | — | `{ eventId, name }` |
| DELETE | `/api/rsvp/[id]` | Admin | Gast entfernen |
| GET | `/api/rsvp/overview` | Admin | Gästelisten pro Event |

---

## 9. Validierung (Zod, `src/lib/validation.ts`)

| Schema | Felder / Regeln |
|--------|-----------------|
| `eventSchema` | `date` (YYYY-MM-DD), `title` (1–200), `description` (max 5000), `explorationLevel` (1–5), `videoPath` (muss `VIDEO_PATH_PATTERN` entsprechen), `isActive`, `beerCounterEnabled` |
| `videoDeleteSchema` | `videoPath` (Pfad aus dem Upload) |
| `beerEntrySchema` | `eventId` (positive int), `name` (1–40), `beers` (1–50, int) |
| `beerEntryUpdateSchema` | `name?`, `beers?` |
| `quizSubmitSchema` | `name` (1–40), `answers` (Record) |
| `quizUpdateSchema` | `name?`, `answers?`, `recalculate?` |
| `awardSubmitSchema` | `voterName` (1–40), `nominations` (Record awardId→string) |
| `rsvpSchema` | `eventId`, `name` (1–40) |
| `loginSchema` | `username`, `password` |

---

## 10. Authentifizierung & Middleware

Es gibt **zwei getrennte Ebenen**: eine Besucher-Sperre für die gesamte Website und darüber hinaus die Admin-Anmeldung.

### Ablauf Besucher (gesamte Website)

1. Jeder Aufruf ohne Session landet auf `/login` (Deep-Link wird als `?next=` gemerkt)
2. `POST /api/auth/site` prüft die geteilten Zugangsdaten aus `@/lib/siteAccess`
3. JWT wird in Cookie `event_guest_session` gesetzt (Standard 30 Tage)
4. Zugangsdaten: `SITE_USERNAME` / `SITE_PASSWORD`, Standard `HasselWG` / `#RettetXoro`
5. Benutzername wird case-insensitive geprüft, Passwort exakt (`timingSafeEqual`)

### Ablauf Admin

1. Admin loggt sich unter `/admin/login` ein
2. `POST /api/auth/login` prüft bcrypt-Hash in `admins`-Tabelle
3. JWT wird in Cookie `event_admin_session` gesetzt
4. `src/middleware.ts` schützt `/admin/*` (außer `/admin/login`)
5. API-Routen nutzen `requireSession()` aus `@/lib/auth`
6. Eine Admin-Session gilt automatisch auch als Besucher-Zugang (kein doppeltes Login)

### Middleware-Regeln (`src/middleware.ts`)

| Pfad | Verhalten ohne Session |
|------|------------------------|
| `/login`, `/admin/login`, `/api/auth/*` | immer offen |
| `/api/uploads/*` | **nicht im Matcher** – die Route prüft selbst per `requireSession()` |
| `/admin/*` | Redirect auf `/admin/login` |
| `/api/*` (übrige) | **401 JSON** statt Redirect |
| alles andere inkl. `/uploads/videos/*` | Redirect auf `/login?next=…` |

Vom Matcher ausgenommen: `_next/static`, `_next/image`, `favicon.ico` und Bild-/Meta-Dateiendungen. Videos liegen bewusst **hinter** der Sperre; Range-Requests (206) funktionieren dort weiterhin.

**Sicherheitsdetail:** Gast-Tokens werden mit einem abgeleiteten Schlüssel (`AUTH_SECRET + "::guest"`) signiert. Dadurch lässt sich ein Gast-Token nicht in das Admin-Cookie kopieren und umgekehrt.

### Erst-Anlage Admin

- Beim ersten DB-Start: Admin aus `ADMIN_USERNAME` / `ADMIN_PASSWORD` (`.env.local`)
- Danach ändern Env-Variablen den Admin **nicht** automatisch
- Reset: `npm run admin:reset`

### Wichtige Klassen/Funktionen

```typescript
// session.ts
SESSION_COOKIE = "event_admin_session"
GUEST_COOKIE = "event_guest_session"
createSessionToken(userId, username): Promise<string>
verifySessionToken(token): Promise<SessionPayload | null>
createGuestToken(username): Promise<string>
verifyGuestToken(token): Promise<boolean>
getGuestMaxAgeSeconds(): number          // GUEST_SESSION_MAX_AGE_DAYS, Standard 30

// siteAccess.ts (nur Server)
getSiteUsername(): string
verifySiteCredentials(username, password): boolean

// cookies.ts
cookieSecure(request): boolean           // Secure nur bei echtem HTTPS

// auth.ts
getSession(): Promise<SessionPayload | null>
requireSession(): Promise<SessionPayload>  // wirft AuthError
setSessionCookie(token): Promise<void>
clearSessionCookie(): Promise<void>
class AuthError extends Error
```

---

## 11. Statische Inhalte (nicht in DB)

### Quiz (`src/data/quiz.ts`)

- `QUIZ_QUESTIONS: QuizQuestion[]` – enthält **korrekte Antworten** (nur serverseitig)
- Fragetypen: `"single"` (Multiple Choice A–D) und `"matching"` (Zuordnung)
- `getPublicQuizQuestions()` – ohne `correct`-Felder für Client
- `scoreQuizAnswers(answers)` – Punkteberechnung
- `getQuizResultTier(correctCount)` – Ergebnis-Texte:

| Punkte | Titel |
|--------|-------|
| ≥ 10 | Du bist eine WG-Legende! |
| ≥ 8 | Ehrenwerter WG-Gast! |
| ≥ 5 | Hättest gerne häufiger kommen können… |
| ≥ 2 | Kennst du uns überhaupt? |
| < 2 | Das ist ja erbärmlich… |

### Awards (`src/data/awards.ts`)

- `AWARDS: AwardDefinition[]` mit `id` (slug) und `title`
- IDs: `spruecheklopfer`, `gar-nicht-kommer`, `bester-bierpong`, `bester-dj`, `groesster-wg-fan`, `spendierhosen`, `last-man-standing`, `first-man-falling`, `haeufigster-partygast`, `abrissbirne`, `bester-kippendreher`, `bester-trinker`, `bester-spitzname`, `haette-haeufiger`, `stimmungskanone`

---

## 12. UI-Komponenten

### Öffentlich (`src/components/`)

| Komponente | Datei | Aufgabe |
|----------|-------|---------|
| `CalendarGrid` | `CalendarGrid.tsx` | Startseite: Banner, Quiz/Awards-Buttons, Kacheln |
| `EventCard` | `EventCard.tsx` | Tageskachel |
| `EventDialog` | `EventDialog.tsx` | Event-Modal (Video, RSVP, Bier) |
| `EventVideoPlayer` | `EventVideoPlayer.tsx` | Standbild aus dem Video (`#t=0.1`) → Klick → `<video controls>`; Download und Bild-in-Bild sind deaktiviert |
| `BeerCounterBanner` | `BeerCounterBanner.tsx` | „Anzahl vergenussverferkelter Bier“ |
| `BeerCheckInForm` | `BeerCheckInForm.tsx` | Bier-Formular im Modal |
| `EventRsvpForm` | `EventRsvpForm.tsx` | Anmeldung im Modal |
| `QuizDialog` | `QuizDialog.tsx` | Quiz-Ablauf |
| `QuizResultModal` | `QuizResultModal.tsx` | Ergebnis nach Quiz |
| `AwardsDialog` | `AwardsDialog.tsx` | Award-Abstimmung |
| `ExplorationBadge` | `ExplorationBadge.tsx` | Level-Anzeige |
| `SiteHeader` | `SiteHeader.tsx` | Header, Dark-Mode-Toggle, Admin-Link |

### Admin (`src/components/admin/`)

| Komponente | Datei |
|----------|-------|
| `AdminDashboard` | `AdminDashboard.tsx` |
| `EventFormDialog` | `EventFormDialog.tsx` |
| `AdminBeerOverview` | `AdminBeerOverview.tsx` |
| `AdminGuestLists` | `AdminGuestLists.tsx` |
| `AdminQuizOverview` | `AdminQuizOverview.tsx` |
| `AdminAwardsOverview` | `AdminAwardsOverview.tsx` |

### Seiten

| Route | Datei | Rendering |
|-------|-------|-----------|
| `/` | `src/app/page.tsx` | Server: `getActiveEvents()`, `getBeerStats()` → `CalendarGrid` |
| `/admin` | `src/app/admin/page.tsx` | Server: Session-Check, `getAllEvents()` |
| `/admin/login` | `src/app/admin/login/page.tsx` | Client-Login-Formular |
| `/login` | `src/app/login/page.tsx` | Besucher-Login (Client), Sperre für die ganze Seite |

**Client vs. Server:** Komponenten mit `"use client"` sind interaktiv (Modals, Forms). Seiten laden DB-Daten serverseitig und übergeben Props.

---

## 13. Wichtige Geschäftsregeln

| Situation | Verhalten | HTTP |
|-----------|-----------|------|
| Doppelter Bier-Name am selben Event | „HALT STOP! Es bleibt alles so wie es ist, ob du ein Melker bist oder nicht." | 409 |
| Doppelte Quiz-Teilnahme (gleicher Name) | dieselbe Halt-Stop-Meldung | 409 |
| Doppelte Award-Abstimmung | dieselbe Halt-Stop-Meldung | 409 |
| Doppelte Event-Anmeldung | „Wir wissen, dass das Event überragend ist, aber du bist schon angemeldet." | 409 |
| Event `isActive: false` | Nicht öffentlich sichtbar | — |
| `beerCounterEnabled: false` | Kein Bier-Formular | 403 bei POST |
| Event-Datum doppelt | „Für dieses Datum existiert bereits ein Event" | 409 |
| Admin ohne Session | Redirect zu `/admin/login` | 401 |
| Besucher ohne Session | Redirect zu `/login?next=…` | 401 bei `/api/*` |

**Duplikat-Prüfung:** Namen case-insensitive (`COLLATE NOCASE` in SQLite für Quiz/Awards; Bier pro `event_id` + `lower(name)`).

---

## 14. Umgebungsvariablen (`.env.local`)

```bash
AUTH_SECRET=...                    # JWT-Secret, min. 16 Zeichen (empfohlen 32+)
ADMIN_USERNAME=admin               # Nur bei Erst-Anlage
ADMIN_PASSWORD=Admin123!           # Nur bei Erst-Anlage
SESSION_MAX_AGE_HOURS=24
SITE_USERNAME=HasselWG             # Besucher-Login, Standard HasselWG
SITE_PASSWORD="#RettetXoro"        # Standard #RettetXoro – Anführungszeichen nötig!
GUEST_SESSION_MAX_AGE_DAYS=30      # Optional, Standard 30
NEXT_PUBLIC_SITE_URL=https://...   # Metadata, OG
NEXT_PUBLIC_CALENDAR_YEAR=2026     # Optional, für Client-Kalenderjahr
COOKIE_SECURE=true|false           # Optional, sonst auto via X-Forwarded-Proto
```

> `SITE_PASSWORD` muss in Anführungszeichen stehen: Ein unquotiertes `#` startet in `.env`-Dateien einen Kommentar, der Wert wäre sonst leer.

---

## 15. NPM-Skripte

```bash
npm run dev          # Entwicklung (Port 3000)
npm run build        # Production-Build
npm run start        # Production-Server
npm run db:seed      # Beispiel-Events in SQLite
npm run admin:reset  # Admin aus Env neu setzen
```

---

## 16. Deployment (Produktion)

```bash
# Auf Server (Ubuntu)
git pull
npm install
npm run build
pm2 restart event-calendar   # deploy/ecosystem.config.cjs

# Backup
cp data/wg.db /pfad/backup/wg-$(date +%F).db
```

**PM2:** App-Name `event-calendar`, Port 3000, `cwd` = Projektroot  
**Nginx:** Reverse Proxy → `127.0.0.1:3000`  
**Node:** Version ≥ 22 prüfen (`node -v`)

### Migration JSON → SQLite auf Live-Server

1. `cp data/store.json backup.json`
2. Sicherstellen: **keine** leere/falsche `wg.db` vorhanden (oder löschen wenn leer)
3. **`npm run db:seed` nicht ausführen** vor Migration
4. Deploy + `pm2 restart`
5. Erster Request migriert → `store.json.migrated` + `wg.db`

---

## 17. Code-Konventionen (für generierten Code)

1. **TypeScript strict**, keine `any` ohne Grund
2. **Imports:** `@/` Alias für `src/`
3. **API-Routen:** `NextRequest`/`NextResponse`, Zod-Validierung, try/catch, `AuthError` → 401
4. **DB-Zugriff:** Nur über `@/lib/db`, nie direkt SQL in Routen
5. **Client-Komponenten:** `"use client"` am Dateianfang
6. **Dynamische Seiten:** `export const dynamic = "force-dynamic"` wo DB-Daten geladen werden
7. **MUI:** Version 6, `Grid2` statt `Grid`, Icons aus `@mui/icons-material`
8. **Fehlertexte:** Deutsch, benutzerfreundlich
9. **Daten an Client:** Nur serialisierbare Werte (keine BigInt, keine Funktionen)
10. **Neue API-Felder:** Zod-Schema + DB-Spalte + TypeScript-Interface + `mapEvent()`/`map*` in `db.ts`

### Beispiel: Neue API-Route (Admin-geschützt)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireSession } from "@/lib/auth";
import { someDbFunction } from "@/lib/db";

export async function GET() {
  try {
    await requireSession();
    const data = someDbFunction();
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("GET /api/example", error);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}
```

### Beispiel: Client-Fetch

```typescript
const res = await fetch("/api/beers", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ eventId: 1, name: "Max", beers: 3 }),
});
const data = await res.json();
if (!res.ok) {
  setError(data.error ?? "Unbekannter Fehler");
  return;
}
setBeerStats(data.stats);
```

---

## 18. Häufige Aufgaben → Dateien

| Aufgabe | Datei(en) |
|---------|-----------|
| Startseiten-Intro-Text | `src/components/CalendarGrid.tsx` |
| Bier-Banner-Text | `src/components/BeerCounterBanner.tsx` |
| Quiz-Fragen ändern | `src/data/quiz.ts` |
| Quiz-Ergebnis-Texte | `src/data/quiz.ts` → `getQuizResultTier()` |
| Awards-Liste | `src/data/awards.ts` |
| Level-Namen | `src/types/index.ts` → `EXPLORATION_LABELS` |
| Level-Farben | `src/theme/theme.ts` → `LEVEL_COLORS` |
| Kalender-Zeitraum | `src/types/index.ts` → `CALENDAR_*` |
| Halt-Stop-Meldung | `src/app/api/beers/route.ts`, `quiz/route.ts`, `awards/route.ts` |
| RSVP-Doppel-Meldung | `src/app/api/rsvp/route.ts` |
| Neue DB-Tabelle / -Spalte | `src/lib/db.ts` (Schema + `applySchemaUpgrades` + Funktionen) |
| Video-Grenzwerte (Typ/Größe) | `src/lib/video.ts` |
| Video-Speicherort | `src/lib/uploads.ts` |
| Neue Validierung | `src/lib/validation.ts` |
| Admin-UI erweitern | `src/components/admin/AdminDashboard.tsx` + neue Admin-Komponente |

---

## 19. Bekannte Stolpersteine

1. **Node < 22:** `node:sqlite` fehlt → App startet nicht
2. **Mehrere Dev-Server:** SQLite-Lock → 500-Fehler; nur eine Instanz
3. **Admin-Login auf HTTP:** `Secure`-Cookie ohne HTTPS blockiert Login → `COOKIE_SECURE=false` oder Nginx HTTPS
4. **`AUTH_SECRET` fehlt/kurz:** Login schlägt fehl
5. **Theme `visibility:hidden`:** Wurde entfernt – früher weißer Screen bei Hydration-Problemen
6. **`db:seed` vor Migration:** Verhindert JSON→SQLite-Import
7. **Finale-Event:** Immer Datum `YYYY-10-19` speichern, UI zeigt „19.–29. Okt"
8. **Video-Upload schlägt mit 413 fehl:** In Nginx fehlt `client_max_body_size 0;` für `/api/uploads/`
9. **Videos nach Deploy weg:** `data/uploads/videos/` liegt außerhalb von Git – beim Serverumzug mitkopieren und ins Backup aufnehmen
9a. **Uploads niemals nach `public/` schreiben:** Next.js liest diesen Ordner nur beim Build ein. Zur Laufzeit dort abgelegte Dateien beantwortet der Server mit **404 und `Content-Type: text/html`**; der Player meldet dann `MEDIA_ELEMENT_ERROR: Format error` und Länge `NaN`, obwohl die Datei auf der Platte einwandfrei ist. Auslieferung läuft über `src/app/uploads/videos/[file]/route.ts`.
10. **`SITE_PASSWORD` unquotiert:** `#` startet einen Kommentar → Wert leer, es gilt still das Standardpasswort
11. **Neue öffentliche Route:** Muss in `src/middleware.ts` freigeschaltet werden, sonst Redirect auf `/login`
12. **Upload-Route nie in den Middleware-Matcher aufnehmen:** Die Middleware schneidet große Request-Bodys ab (im Produktions-Build kamen von 200 MB nur 10 MB an, Antwort trotzdem 201). Deshalb ist `api/uploads` ausgenommen; die Route authentifiziert selbst. Zusätzlich vergleicht `saveVideoStream` die geschriebenen Bytes mit `Content-Length` und verwirft unvollständige Uploads (`INCOMPLETE_UPLOAD`).

---

## 20. Fragen an diese KI stellen

Du kannst z. B. fragen:

- „Schreibe eine neue API-Route für …"
- „Wie ändere ich den Text bei …?"
- „Erweitere das Event-Model um Feld X"
- „Was passiert wenn jemand zweimal am Quiz teilnimmt?"
- „Gib mir den SQL für die beer_entries-Tabelle"
- „Wie deploye ich sicher mit bestehender store.json?"

**Antworten der KI sollten:** exakte Dateipfade, Typnamen, API-Pfade und bestehende Konventionen verwenden.

---

*Stand: Juli 2026 · Projekt „Monat der offenen Tür“ / `event-calendar`*
