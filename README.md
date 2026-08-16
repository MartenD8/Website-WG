# Event Kalender

Produktionsreife Präsentationswebsite für einen Event-Kalender (25.09. – 18.10.) mit Material Design 3 (MUI), Dark/Light Mode, eigenem Video-Player und geschütztem Adminbereich.

**Projekt-Erklärung & Datei-Übersicht:** siehe Ordner [`erklaerung/`](./erklaerung/README.md) (Funktionen, wo man Texte findet, Datenspeicherung, Ausblick).

## Funktionen

### Öffentlich

- Kalenderübersicht mit einer Kachel pro Tag
- Eventtitel, Vorschau, Explorationsstufe (Level 1–5)
- Kennzeichnung leerer Tage
- Detail-Dialog mit Beschreibung und eingebautem Video-Player (Klick auf die Vorschau startet das Video)
- Responsive Layout (Mobile First)
- Hell- und Dunkelmodus

### Zugang

- Die gesamte Website ist durch eine gemeinsame Besucher-Anmeldung geschützt (`/login`)
- Standardzugang: Benutzer `HasselWG`, Passwort `#RettetXoro` (überschreibbar via `SITE_USERNAME` / `SITE_PASSWORD`)
- Hochgeladene Videos liegen ebenfalls hinter der Sperre

### Admin

- Login mit Benutzername/Passwort (kein öffentliches Registrieren)
- Dashboard mit CRUD für Events
- Explorationsstufe, Video-Upload (MP4/WebM), Beschreibung
- Aktiv/Inaktiv-Schalter (sofort auf der Startseite sichtbar)

## Technologie

| Bereich | Stack |
|--------|--------|
| Frontend | Next.js 15 (App Router), React 19, TypeScript (strict), MUI 6 |
| Backend | Next.js Route Handlers |
| Auth | JWT in httpOnly-Cookie (`jose`), bcryptjs |
| Daten | SQLite (`data/wg.db`, `node:sqlite`, Node 22+) |
| Validierung | Zod |

## Voraussetzungen

- Node.js **22+** (für eingebautes `node:sqlite`)
- npm 10+

Keine nativen Build-Tools nötig – SQLite kommt mit Node mit.

## Lokal starten

### 1. Abhängigkeiten installieren

```bash
npm install
```

### 2. Umgebungsvariablen

```bash
cp .env.example .env.local
```

Mindestens setzen:

| Variable | Beschreibung |
|----------|--------------|
| `AUTH_SECRET` | Geheimer Schlüssel für JWT (≥ 16 Zeichen, Produktion: ≥ 32) |
| `ADMIN_USERNAME` | Initialer Admin (nur beim ersten DB-Start) |
| `ADMIN_PASSWORD` | Initiales Passwort (nur beim ersten DB-Start) |
| `SITE_USERNAME` | Besucher-Login für die ganze Seite (Standard: `HasselWG`) |
| `SITE_PASSWORD` | Passwort dazu (Standard: `#RettetXoro`) – in `.env` **in Anführungszeichen** setzen, sonst gilt `#` als Kommentar |
| `GUEST_SESSION_MAX_AGE_DAYS` | Optional, Gültigkeit der Besucher-Anmeldung (Standard: 30 Tage) |
| `NEXT_PUBLIC_SITE_URL` | Öffentliche URL (z. B. `http://localhost:3000`) |
| `NEXT_PUBLIC_CALENDAR_YEAR` | Optional, Kalenderjahr (Standard: aktuelles Jahr) |

> Passwörter werden mit **bcrypt** gehasht gespeichert – niemals im Klartext.

### 3. Beispieldaten (optional)

```bash
npm run db:seed
```

Legt Beispiel-Events an und erzeugt ggf. den Admin-Account.

Ohne Seed wird `data/wg.db` beim ersten Request automatisch erstellt (inkl. Admin aus `.env.local`). Eine vorhandene `data/store.json` wird einmalig migriert.

### 4. Entwicklungsserver

```bash
npm run dev
```

- Website: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3000/admin](http://localhost:3000/admin)

Besucher-Login (gesamte Website):

- Benutzer: `HasselWG`
- Passwort: `#RettetXoro`

Admin-Login (aus `.env.example` / `.env.local`):

- Benutzer: `admin`
- Passwort: `Admin123!`

### 5. Produktionsbuild lokal testen

```bash
npm run build
npm start
```

## Projektstruktur

```
├── data/                 # wg.db (gitignored) – Events & Admin
├── deploy/
│   ├── ecosystem.config.cjs   # PM2
│   └── nginx.conf             # Nginx Reverse Proxy
├── public/uploads/       # Optionale lokale Bilder
├── scripts/seed.ts       # Beispieldaten
├── src/
│   ├── app/
│   │   ├── api/          # Auth- & Event-APIs
│   │   ├── admin/        # Login + Dashboard
│   │   ├── layout.tsx
│   │   └── page.tsx      # Öffentliche Startseite
│   ├── components/       # UI (Kalender, Dialog, Admin)
│   ├── lib/              # DB, Auth, Validierung, Kalenderlogik
│   ├── middleware.ts     # Besucher-Sperre + Schutz von /admin/*
│   ├── theme/            # MUI MD3-Theme + Dark Mode
│   └── types/
├── .env.example
└── README.md
```

## Admin-Konfiguration

1. Vor dem **ersten** Start `ADMIN_USERNAME` / `ADMIN_PASSWORD` in `.env.local` setzen.
2. App starten – Admin wird in `data/wg.db` angelegt.
3. Danach ändern Umgebungsvariablen den bestehenden Admin **nicht** mehr automatisch.
4. Passwort ändern: `npm run admin:reset` (setzt Admin aus `.env` neu).

## Sicherheit

- Passwort-Hashing mit bcrypt (Cost 12)
- JWT-Session in httpOnly-, SameSite=Lax-Cookie (Secure in Production)
- Middleware schützt die gesamte Website (außer Login-Seiten und Auth-Endpunkten) sowie zusätzlich `/admin/*`
- Gast-Tokens werden mit einem abgeleiteten Schlüssel signiert und können nicht als Admin-Token verwendet werden
- Zod-Validierung aller Schreibzugriffe
- React escaped Ausgabe (XSS-Schutz)
- SQLite über parametrisierte Statements (`node:sqlite`)
- Kein öffentliches Registrieren

## Deployment auf Ubuntu (Linux-Server)

### 1. Server vorbereiten

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl nginx
```

### 2. Node.js 22 LTS (NodeSource)

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v
```

### 3. PM2 global

```bash
sudo npm install -g pm2
```

### 4. Projekt klonen & bauen

```bash
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www
cd /var/www
git clone <DEIN_REPO_URL> event-calendar
cd event-calendar

cp .env.example .env.local
nano .env.local   # AUTH_SECRET, Admin, NEXT_PUBLIC_SITE_URL=https://deine-domain.de
```

Starken Secret erzeugen:

```bash
openssl rand -base64 48
```

```bash
npm install
npm run db:seed   # optional
npm run build
mkdir -p logs
```

### 5. Mit PM2 starten

```bash
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup      # Anweisungen ausführen, damit PM2 nach Reboot startet
pm2 status
```

### 6. Nginx Reverse Proxy

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/event-calendar
sudo nano /etc/nginx/sites-available/event-calendar
# YOUR_DOMAIN durch deine Domain ersetzen

sudo ln -sf /etc/nginx/sites-available/event-calendar /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Firewall (falls UFW aktiv):

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 7. HTTPS mit Let’s Encrypt (Certbot)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d deine-domain.de -d www.deine-domain.de
```

Certbot konfiguriert HTTPS und eine Weiterleitung von HTTP → HTTPS. Automatische Erneuerung:

```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

## Domain einrichten (Schritt für Schritt)

1. **Domain kaufen** bei einem Registrar (z. B. Namecheap, Cloudflare Registrar, IONOS, Strato).
2. **DNS-Zone** öffnen und A-Record setzen:
   - Host `@` → IPv4-Adresse deines Servers
   - Host `www` → dieselbe IP (oder CNAME auf `@`)
3. **TTL** auf 300–3600 Sekunden; Propagation kann einige Minuten bis Stunden dauern.
4. Prüfen: `dig +short deine-domain.de` bzw. `nslookup deine-domain.de`
5. Nginx + Certbot wie oben – danach ist `https://deine-domain.de` erreichbar.
6. In `.env.local` `NEXT_PUBLIC_SITE_URL=https://deine-domain.de` setzen und App neu bauen/starten:

```bash
npm run build
pm2 restart event-calendar
```

## Wartung

### Backups

SQLite-Datei sichern:

```bash
cp /var/www/event-calendar/data/wg.db \
   /var/backups/wg-$(date +%F).db

# Optional cron (täglich 03:00)
# 0 3 * * * cp /var/www/event-calendar/data/wg.db /var/backups/wg-$(date +\%F).db
```

### Updates

```bash
cd /var/www/event-calendar
git pull
npm install
npm run build
pm2 restart event-calendar
```

### Logs

```bash
pm2 logs event-calendar
# oder
tail -f logs/out.log logs/err.log
sudo journalctl -u nginx -f
```

### Neustart

```bash
pm2 restart event-calendar
sudo systemctl restart nginx
```

### Monitoring

```bash
pm2 monit
pm2 plus   # optional, PM2 Plus / Keymetrics
```

Zusätzlich: Uptime-Monitoring (UptimeRobot, Better Stack) auf `https://deine-domain.de` und Alerting bei HTTP ≠ 200.

## Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| 401 im Admin | Cookie/Session abgelaufen; neu einloggen; `AUTH_SECRET` unverändert lassen |
| Admin-Login klappt nicht | `npm run admin:reset`; oder `data/wg.db` löschen und neu starten (Datenverlust!) |
| Events erscheinen nicht | Im Admin „Aktiv“ prüfen; Cache/Hard-Reload |
| Port 3000 belegt | In `ecosystem.config.cjs` anderen Port setzen und Nginx anpassen |
| Nginx 502 | `pm2 status` – App läuft? `curl http://127.0.0.1:3000` |
| Besucher-Passwort wird nicht angenommen | `SITE_PASSWORD` in `.env.local` ohne Anführungszeichen? `#` startet dort einen Kommentar |
| Video-Upload bricht ab | Nginx: `client_max_body_size 0;` und `proxy_request_buffering off;` im **HTTPS**-Block? Ohne das kommt 413 |
| Hochgeladenes Video ist abgeschnitten | `api/uploads` darf nicht im Matcher von `src/middleware.ts` stehen – sonst wird der Request-Body gekürzt |

## Lizenz

Privates Projekt – Nutzung nach Absprache mit dem Betreiber.
