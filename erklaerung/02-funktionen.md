# 02 – Funktionen

## Öffentlicher Bereich

### Kalender & Events

- Eine Kachel pro Tag (26.09. – 18.10.) plus eine Abschluss-Kachel (19.10. – 29.10.)
- Klick öffnet die Detailansicht (Modal)
- Inhalte: Titel, Beschreibung, Explorationsstufe (Level), optional Vorschaubild, YouTube-Button
- In der Detailansicht: **Event-Anmeldung** (Name)

### Biercounter

- Oben auf der Startseite: Gesamtzahl + Person mit den meisten Bieren
- Pro Event im Admin aktivierbar
- In der Detailansicht: Name + Anzahl Bier
- Pro Name und Tag nur ein Eintrag (sonst Halt-Stop-Meldung)

### Das große WG-Quiz

- Button auf der Startseite → Modal
- Zuerst Name, dann Fragen (inkl. Zuordnungsfrage)
- Speicherung der Antworten + Punkte
- Ergebnis-Pop-up je nach Punktzahl (Legende / Ehren-Gast / …)
- Pro Name nur eine Teilnahme

### Awards

- Button auf der Startseite → Modal
- Name + Freitext-Nominierungen pro Award
- Hinweistext zu vollständigen Namen
- Pro Name nur eine Abstimmung

### Design

- Hell-/Dunkelmodus
- Mobile-first, Karten, MUI-Komponenten

---

## Admin-Bereich (`/admin`)

### Events

- Anlegen, Bearbeiten, Löschen
- Aktiv/Inaktiv
- Bier-Zähler an/aus
- Felder: Datum, Titel, Beschreibung, Level, YouTube, Vorschaubild

### Biercounter-Übersicht

- Personen absteigend nach Gesamtbier
- Accordion mit Einträgen (Event + Anzahl)
- Einträge bearbeiten oder löschen

### Gästelisten

- Pro Event: angemeldete Gäste mit Datum/Uhrzeit
- Sortierung neueste/älteste zuerst
- Gäste löschen

### Quiz-Übersicht

- Teilnehmer + Punkte
- Antworten einsehen
- Neu berechnen
- Versuch löschen

### Awards-Übersicht

- Top 3 je Award inkl. Stimmenzahl

---

## Wichtige Regeln (Validierung)

| Situation | Verhalten |
|-----------|-----------|
| Doppelter Bier-Name am selben Tag | Fehlermeldung „HALT STOP! …“ |
| Doppelte Quiz-/Award-Teilnahme | dieselbe Halt-Stop-Meldung |
| Doppelte Event-Anmeldung | „Wir wissen, dass das Event überragend ist …“ |
| Inaktives Event | erscheint nicht öffentlich |
| Bier-Zähler aus | kein Formular in der Detailansicht |
