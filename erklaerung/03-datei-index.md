# 03 – Datei-Index: Wo finde ich was?

Praktische Übersicht für Textkorrekturen, neue Inhalte und Feature-Anpassungen.

---

## Texte & Tippfehler (häufigste Fälle)

| Was ändern? | Datei |
|-------------|--------|
| Titel „Monat der offenen Tür.“ + Intro-Text auf der Startseite | `src/components/CalendarGrid.tsx` |
| Counter-Text „Anzahl vergenussverferkelter Bier:“ | `src/components/BeerCounterBanner.tsx` |
| Header-/Seitentitel | `src/components/SiteHeader.tsx`, `src/app/layout.tsx`, `src/app/page.tsx` |
| Footer-Text | `src/app/page.tsx` |
| Level-Namen (Gemütlich, Ausgelassen, …) | `src/types/index.ts` → `EXPLORATION_LABELS` |
| Level-Farben (z. B. orange/rot) | `src/theme/theme.ts` → `LEVEL_COLORS` |
| Quiz-Fragen, Antworten, richtige Lösung | `src/data/quiz.ts` |
| Quiz-Ergebnis-Texte (Legende, Ehren-Gast, …) | `src/data/quiz.ts` → `getQuizResultTier()` |
| Award-Titel / Liste | `src/data/awards.ts` |
| Awards-Hinweis („vollständigen und korrekten Namen …“) | `src/components/AwardsDialog.tsx` |
| Halt-Stop-Meldung (Bier/Quiz/Awards) | `src/app/api/beers/route.ts`, `src/app/api/quiz/route.ts`, `src/app/api/awards/route.ts` (+ ggf. Admin-Update-Routen) |
| Event-Anmeldung Doppel-Meldung | `src/app/api/rsvp/route.ts` |
| Texte im Bier-Check-in | `src/components/BeerCheckInForm.tsx` |
| Texte Event-Anmeldung | `src/components/EventRsvpForm.tsx` |
| Leere-Tage / „Kein Event“ | `src/components/EventCard.tsx`, `src/components/EventDialog.tsx` |

---

## Kalender & Zeiträume

| Thema | Datei |
|-------|--------|
| Start/Ende Tageskalender (26.09.–18.10.) | `src/types/index.ts` → `CALENDAR_START` / `CALENDAR_END` |
| Abschluss-Kachel (19.10.–29.10.) | `src/types/index.ts` → `CALENDAR_FINALE_*` |
| Kalender-Logik, Datumsformatierung | `src/lib/calendar.ts` |
| Kalenderjahr (optional) | `.env.local` → `NEXT_PUBLIC_CALENDAR_YEAR` |

---

## UI-Komponenten (öffentlich)

| Komponente | Datei | Aufgabe |
|------------|-------|---------|
| Startseiten-Layout / Grid | `src/components/CalendarGrid.tsx` | Banner, Buttons, Kacheln, Dialoge |
| Event-Kachel | `src/components/EventCard.tsx` | Tageskarte |
| Event-Detail | `src/components/EventDialog.tsx` | Modal inkl. Anmeldung + Bier |
| Video-Player | `src/components/EventVideoPlayer.tsx` | Vorschau anklicken → Video startet |
| Bier-Banner | `src/components/BeerCounterBanner.tsx` | Counter oben |
| Bier-Formular | `src/components/BeerCheckInForm.tsx` | Check-in |
| Event-Anmeldung | `src/components/EventRsvpForm.tsx` | RSVP in Detailansicht |
| Quiz | `src/components/QuizDialog.tsx` | Quiz-Ablauf |
| Quiz-Ergebnis | `src/components/QuizResultModal.tsx` | Ergebnis-Pop-up |
| Awards | `src/components/AwardsDialog.tsx` | Award-Abstimmung |
| Level-Badge | `src/components/ExplorationBadge.tsx` | Level-Anzeige |
| Header | `src/components/SiteHeader.tsx` | Navigation / Dark Mode |

---

## Admin-Komponenten

| Bereich | Datei |
|---------|--------|
| Dashboard-Rahmen | `src/components/admin/AdminDashboard.tsx` |
| Event anlegen/bearbeiten | `src/components/admin/EventFormDialog.tsx` |
| Bier-Übersicht | `src/components/admin/AdminBeerOverview.tsx` |
| Gästelisten | `src/components/admin/AdminGuestLists.tsx` |
| Quiz-Auswertung | `src/components/admin/AdminQuizOverview.tsx` |
| Awards-Auswertung | `src/components/admin/AdminAwardsOverview.tsx` |
| Admin-Seite | `src/app/admin/page.tsx` |
| Login-Seite (Admin) | `src/app/admin/login/page.tsx` |
| Login-Seite (Besucher) | `src/app/login/page.tsx` |

---

## API-Routen (`src/app/api/`)

| Endpunkt | Zweck |
|----------|--------|
| `auth/login`, `auth/logout`, `auth/me` | Anmeldung / Session |
| `events`, `events/[id]` | Event CRUD |
| `beers`, `beers/[id]`, `beers/overview` | Bier public + Admin |
| `quiz`, `quiz/results`, `quiz/results/[id]` | Quiz public + Admin |
| `awards`, `awards/results` | Awards public + Admin |
| `rsvp`, `rsvp/[id]`, `rsvp/overview` | Event-Anmeldungen |
| `uploads/video` | Video-Upload / -Löschung (Admin) |

---

## Backend-Kern

| Thema | Datei |
|-------|--------|
| Lesen/Schreiben aller Daten | `src/lib/db.ts` |
| Video-Grenzwerte (Typ, Größe, Pfadmuster) | `src/lib/video.ts` |
| Video-Dateien speichern/löschen | `src/lib/uploads.ts` |
| Typen / Labels / Kalender-Konstanten | `src/types/index.ts` |
| Eingabe-Validierung (Zod) | `src/lib/validation.ts` |
| Session / JWT | `src/lib/session.ts`, `src/lib/auth.ts` |
| Besucher-Zugangsdaten | `src/lib/siteAccess.ts` |
| Routenschutz (Besucher + Admin) | `src/middleware.ts` |
| Theme / Design | `src/theme/theme.ts`, `src/theme/ThemeRegistry.tsx` |

---

## Skripte & Konfiguration

| Datei | Zweck |
|-------|--------|
| `scripts/seed.ts` | Beispiel-Events anlegen |
| `scripts/reset-admin.ts` | Admin-Passwort aus Env setzen |
| `.env.local` / `.env.example` | Secrets, Admin, Site-URL |
| `deploy/ecosystem.config.cjs` | PM2 |
| `deploy/nginx*.conf` | Reverse Proxy |

---

## Tipp: Suche nach Texten

Im Projektordner (VS Code / Cursor):

1. `Strg+Shift+F` (globale Suche)
2. Den fehlerhaften Textausschnitt eingeben
3. Treffer öffnen und korrigieren
4. Lokal mit `npm run dev` prüfen
5. Auf dem Server: `git pull` → `npm run build` → `pm2 restart …`
