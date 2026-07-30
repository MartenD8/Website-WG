# Event Kalender

Produktionsreife Präsentationswebsite für einen Event-Kalender (25.09. – 18.10.) mit Material Design 3 (MUI), Dark/Light Mode, YouTube-Weiterleitung und geschütztem Adminbereich.

**Projekt-Erklärung & Datei-Übersicht:** siehe Ordner [`erklaerung/`](./erklaerung/README.md) (Funktionen, wo man Texte findet, Datenspeicherung, Ausblick).

## Funktionen

### Öffentlich

- Kalenderübersicht mit einer Kachel pro Tag
- Eventtitel, Vorschau, Explorationsstufe (Level 1–5)
- Kennzeichnung leerer Tage
- Detail-Dialog mit Beschreibung und „YouTube öffnen“
- Responsive Layout (Mobile First)
- Hell- und Dunkelmodus

### Admin

- Login mit Benutzername/Passwort (kein öffentliches Registrieren)
- Dashboard mit CRUD für Events
- Explorationsstufe, YouTube-Link, Beschreibung, Vorschaubild
- Aktiv/Inaktiv-Schalter (sofort auf der Startseite sichtbar)

## Technologie

| Bereich | Stack |
|--------|--------|
| Frontend | Next.js 15 (App Router), React 19, TypeScript (strict), MUI 6 |
| Backend | Next.js Route Handlers |
| Auth | JWT in httpOnly-Cookie (`jose`), bcryptjs |
| Daten | JSON-Datei (`data/store.json`) |
| Validierung | Zod |

## Voraussetzungen

- Node.js **20+** (empfohlen: 22 LTS)
- npm 10+

Keine nativen Build-Tools nötig – die Daten liegen in einer JSON-Datei.

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
| `NEXT_PUBLIC_SITE_URL` | Öffentliche URL (z. B. `http://localhost:3000`) |
| `NEXT_PUBLIC_CALENDAR_YEAR` | Optional, Kalenderjahr (Standard: aktuelles Jahr) |

> Passwörter werden mit **bcrypt** gehasht gespeichert – niemals im Klartext.

### 3. Beispieldaten (optional)

```bash
npm run db:seed
```

Legt Beispiel-Events an und erzeugt ggf. den Admin-Account.

Ohne Seed wird `data/store.json` beim ersten Request automatisch erstellt (inkl. Admin aus `.env.local`).

### 4. Entwicklungsserver

```bash
npm run dev
```

- Website: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3000/admin](http://localhost:3000/admin)

Standard-Login (aus `.env.example` / `.env.local`):

- Benutzer: `admin`
- Passwort: `Admin123!`

### 5. Produktionsbuild lokal testen

```bash
npm run build
npm start
```

## Projektstruktur

```
├── data/                 # store.json (gitignored) – Events & Admin
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
│   ├── middleware.ts     # Schutz von /admin/*
│   ├── theme/            # MUI MD3-Theme + Dark Mode
│   └── types/
├── .env.example
└── README.md
```

## Admin-Konfiguration

1. Vor dem **ersten** Start `ADMIN_USERNAME` / `ADMIN_PASSWORD` in `.env.local` setzen.
2. App starten – Admin wird in `data/store.json` angelegt.
3. Danach ändern Umgebungsvariablen den bestehenden Admin **nicht** mehr automatisch.
4. Passwort ändern: Admin-Eintrag in `store.json` anpassen oder Datei löschen und neu seedén (Datenverlust der Events!):

```bash
# Neuen Hash erzeugen
node -e "console.log(require('bcryptjs').hashSync('NeuesPasswort!', 12))"
# In data/store.json unter admins[].passwordHash eintragen
```

## Sicherheit

- Passwort-Hashing mit bcrypt (Cost 12)
- JWT-Session in httpOnly-, SameSite=Lax-Cookie (Secure in Production)
- Middleware schützt `/admin/*` (außer Login)
- Zod-Validierung aller Schreibzugriffe
- React escaped Ausgabe (XSS-Schutz)
- Keine SQL-Schicht – JSON-Persistenz ohne Injection-Vektor
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

JSON-Datei sichern:

```bash
cp /var/www/event-calendar/data/store.json \
   /var/backups/events-$(date +%F).json

# Optional cron (täglich 03:00)
# 0 3 * * * cp /var/www/event-calendar/data/store.json /var/backups/events-$(date +\%F).json
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
| Admin-Login klappt nicht | Alten Hash in `data/store.json` prüfen; oder Datei löschen und neu starten/seedén (Datenverlust!) |
| Events erscheinen nicht | Im Admin „Aktiv“ prüfen; Cache/Hard-Reload |
| Port 3000 belegt | In `ecosystem.config.cjs` anderen Port setzen und Nginx anpassen |
| Nginx 502 | `pm2 status` – App läuft? `curl http://127.0.0.1:3000` |

## Lizenz

Privates Projekt – Nutzung nach Absprache mit dem Betreiber.
