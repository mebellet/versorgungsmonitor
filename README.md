# Versorgungsmonitor Psychotherapie

React-Umsetzung des HTML-Prototyps v16 für das Aktionsbündnis Psychotherapie. Alle Zahlen sind fiktive Demodaten.

## Starten

Voraussetzung ist Node.js ab Version 22.

```bash
npm install
```

```bash
npm run dev
```

Die Adresse steht danach im Terminal, normalerweise http://localhost:5173. Die API läuft im selben Prozess mit.

| Befehl | Zweck |
| --- | --- |
| `npm run dev` | Entwicklung mit automatischem Neuladen |
| `npm run dev:netz` | wie `dev`, zusätzlich im WLAN erreichbar (z. B. zum Testen auf dem Handy) |
| `npm run build` | Produktionsversion nach `dist/` bauen |
| `npm start` | gebaute Version mit API starten (Port 3000) |
| `npm test` | Rechenlogik prüfen |
| `npm run daten:regionen` | Landkreisliste und Kartenformen neu erzeugen |

## Struktur

```text
content/                  Texte als Markdown
  allgemein.md            Titel, Untertitel, Reiter, Button „Jetzt melden“
  karte.md                Startseite, alle Beschriftungen der Karte
  melden/                 Formular-Einleitung und je eine Datei pro Schritt
  rechtliches/            je eine Datei pro Abschnitt
data/
  demo/                   vorliegende Demo-Meldungen
  neu/                    neue Meldungen und Identitäten (nicht in Git)
  stammdaten/             Landkreise, Formularoptionen
  quellen/                amtliche Geo-Rohdaten des BKG (VG2500), unverändert
public/
  geo/                    Kartenformen für den Browser
  brand/                  Bildmarke
shared/                   Regeln für Browser und Server
  aggregation.js          Einzelmeldungen → Kennzahlen
  validierung.js          Feldregeln
server/
  api.js                  Schnittstelle
  store.js                Speicher (für die Datenbank austauschbar)
  index.js                Produktiv-Server
src/
  components/             React-Komponenten (layout, karte, formular)
  pages/                  die drei Ansichten
  state/                  gemeinsamer Datenstand
  styles/                 CSS, Designwerte in tokens.css
docs/                     Konzept und Hintergrund
```

## Was wo ändern?

| Änderung | Datei |
| --- | --- |
| Text auf einer Seite | `content/…` |
| Rechtlicher Abschnitt hinzufügen | neue Datei in `content/rechtliches/`, Nummer bestimmt die Reihenfolge |
| Grund oder Auswahloption | `data/stammdaten/formular-optionen.json` |
| Farbe oder Schrift | `src/styles/tokens.css` |
| Regel für ein Formularfeld | `shared/validierung.js` |
| Testdaten zurücksetzen | Inhalt von `data/neu/` löschen, außer `.gitkeep` |

Text in den Kopfbereichen der Markdown-Dateien (zwischen `---`) wird beim Build eingelesen. Doppelpunkte im Wert brauchen Anführungszeichen.

## Dokumentation

- [Konzept Datenspeicherung](docs/datenspeicherung-konzept.md): wie neue Meldungen gespeichert werden und sofort in die Ansicht gelangen
- [Deutschlandkarte](docs/deutschlandkarte.md): Umsetzung, Quelle, Lizenzrisiko, Empfehlung
- [Abweichungen zum Prototyp](docs/abweichungen-zum-prototyp.md): Designänderungen, behobene Fehler, offene Fragen

## Stand

Die Verifikation per E-Mail und SMS ist simuliert, und die Speicherung in Dateien ist nur für die Entwicklung gedacht. Vor echten Meldungen sind die Punkte im Konzept umzusetzen, vor allem der Abschnitt „Offene Entscheidungen“.
