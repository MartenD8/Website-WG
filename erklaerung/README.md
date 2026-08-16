# Erklärung & Übersicht – Website WG

Willkommen in der Projektdokumentation für **Monat der offenen Tür** (Website-WG).

Dieser Ordner erklärt Aufbau, Funktionen und typische Änderungsorte – z. B. wenn Texte, Tippfehler oder Inhalte angepasst werden sollen.

## Inhalt

| Datei | Thema |
|-------|--------|
| [01-uebersicht.md](./01-uebersicht.md) | Projektüberblick & Technik |
| [02-funktionen.md](./02-funktionen.md) | Alle Funktionen im Detail |
| [03-datei-index.md](./03-datei-index.md) | **Wo finde ich was?** (Texte, Tipps, Features) |
| [04-datenspeicherung.md](./04-datenspeicherung.md) | Wo und wie Daten gespeichert werden |
| [05-ausblick.md](./05-ausblick.md) | Mögliche zukünftige Erweiterungen |

## Schnellstart (Erinnerung)

```bash
npm install
npm run db:seed    # optional: Beispieldaten
npm run dev        # http://localhost:3000
```

Besucher-Login: `/login` · Benutzer `HasselWG`, Passwort `#RettetXoro` (änderbar über `SITE_USERNAME` / `SITE_PASSWORD`)

Admin: `/admin` · Login über `.env.local` (`ADMIN_USERNAME` / `ADMIN_PASSWORD`)

Ausführliche Deploy-Hinweise stehen weiterhin in der Root-Datei [`README.md`](../README.md).
