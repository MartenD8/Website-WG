# 01 – Projektübersicht

## Was ist das?

Eine Präsentations-Website für den WG-Abschlusszeitraum **„Monat der offenen Tür“** (Kalender ca. 26.09. – 18.10., plus Abschluss-Zeitraum 19.10. – 29.10.).

Besucher können:

- Events im Kalender ansehen und Details öffnen
- YouTube-Links öffnen
- sich zu Events anmelden
- Bier zählen (wenn aktiv)
- am WG-Quiz teilnehmen
- Awards vergeben

Administratoren verwalten Events und Auswertungen unter `/admin`.

## Technologiestack

| Bereich | Technologie |
|--------|-------------|
| Framework | Next.js 15 (App Router) |
| Sprache | TypeScript (strict) |
| UI | Material UI (MUI) 6 |
| Auth | JWT in httpOnly-Cookie (`jose`) + bcrypt |
| Validierung | Zod |
| Persistenz | JSON-Datei `data/store.json` |

## Grobe Ordnerstruktur

```
Website WG/
├── src/
│   ├── app/              # Seiten & API-Routen
│   ├── components/       # UI-Komponenten (öffentlich + admin/)
│   ├── data/             # Statische Inhalte (Quiz, Awards)
│   ├── lib/              # DB, Auth, Kalender, Validierung
│   ├── theme/            # Design / Farben / Level-Farben
│   └── types/            # TypeScript-Typen
├── data/                 # Laufzeit-Datenbank (store.json, gitignored)
├── scripts/              # Seed & Admin-Reset
├── deploy/               # Nginx / PM2
├── erklaerung/           # Diese Dokumentation
└── README.md             # Installation & Deployment
```

## Öffentliche vs. Admin-Bereiche

| URL | Zweck |
|-----|--------|
| `/` | Startseite mit Kalender, Counter, Quiz, Awards |
| `/admin/login` | Admin-Login |
| `/admin` | Dashboard (Events, Bier, Gäste, Quiz, Awards) |
| `/api/...` | Backend-Endpunkte |

Der Schutz von `/admin/*` (außer Login) erfolgt in `src/middleware.ts`.
