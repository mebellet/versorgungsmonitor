# Die Deutschlandkarte: Umsetzung und Quelle

Stand: 05.11.2026

## Quelle

| | |
| --- | --- |
| Datensatz | [Verwaltungsgebiete 1 : 2 500 000 (VG2500)](https://gdz.bkg.bund.de/index.php/default/verwaltungsgebiete-1-2-500-000-stand-31-12-vg2500-12-31.html) des Bundesamts für Kartographie und Geodäsie (BKG), Ebene Kreise (`VG2500_KRS`) |
| Gebietsstand | 01.01.2026 (Sonderaufbereitung des BKG wegen der neuen kreisfreien Stadt Hanau) |
| Download | [vg2500_01-01-2026.utm32s.shape.zip](https://daten.gdz.bkg.bund.de/produkte/vg/vg2500/aktuell/vg2500_01-01-2026.utm32s.shape.zip), Shapefile, UTM32 (EPSG:25832) |
| Lizenz | [Datenlizenz Deutschland – Namensnennung 2.0](https://www.govdata.de/dl-de/by-2-0), kostenfrei, auch kommerziell |
| Umfang | 401 Kreise: 294 Landkreise (inkl. Region Hannover, Städteregion Aachen, Regionalverband Saarbrücken) und 107 kreisfreie Städte |
| Kennung | amtlicher Kreisschlüssel (AGS, fünfstellig, z. B. `09162` München Stadt) als `regionId` |

VG2500 ist für Übersichtskarten im Maßstab 1 : 2 500 000 generalisiert und passt damit zur Kartengröße der App. Für deutlich größere Darstellungen gibt es dieselben Daten genauer als VG250 (1 : 250 000, ca. 64 MB).

### Quellenvermerk

Pflicht laut BKG, steht in `content/karte.md` (unter der Karte) und in `content/rechtliches/06-datenquellen.md`:

> © BKG (2026) dl-de/by-2-0 (Daten verändert), Datenquellen: https://sgx.geodatenzentrum.de/web_public/gdz/datenquellen/datenquellen_vg_nuts.pdf

„BKG“ wird mit https://www.bkg.bund.de verlinkt, „dl-de/by-2-0“ mit https://www.govdata.de/dl-de/by-2-0. Die Jahreszahl ist das Jahr des letzten Datenbezugs und muss bei einer Aktualisierung mitgeändert werden.

## Aufbereitung

`npm run daten:regionen` führt `scripts/build-regionen.mjs` aus. Das Skript braucht keine zusätzlichen Pakete:

1. Sucht in `data/quellen/` die Kreisebene `VG2500_KRS`, entweder in der ZIP oder im ausgepackten Ordner (Safari packt ZIPs automatisch aus).
2. Liest Shapefile und Attributtabelle und rechnet UTM32 in Längen- und Breitengrade (WGS84) um.
3. Vereinfacht die Grenzlinien (`TOLERANZ_KM`, derzeit 250 m). Gemeinsame Grenzen werden dabei für beide Nachbarkreise identisch vereinfacht, damit keine Lücken entstehen.
4. Schreibt `public/geo/kreise.geo.json` (ca. 500 KB, nur `id` als Property) und `data/stammdaten/regionen.json` mit `id`, `name` (GEN), `bez` (amtliche Bezeichnung, z. B. „Stadtkreis“), `typ` (Landkreis / Kreisfreie Stadt), `bundesland` und `label`.

Gleichnamige Kreise bekommen ein eindeutiges Label, z. B. „Karlsruhe (Stadt)“ und „Karlsruhe (Landkreis)“.

## Jährliche Aktualisierung

Das BKG aktualisiert VG2500 einmal im Jahr (Stand 31.12.). Bei einer Gebietsreform:

1. Neue ZIP von der BKG-Seite nach `data/quellen/` legen, alte entfernen.
2. `npm run daten:regionen` ausführen.
3. Jahreszahl im Quellenvermerk anpassen.
4. Gespeicherte Meldungen prüfen: Fällt ein Kreisschlüssel weg (Fusion), müssen dessen Meldungen dem Nachfolgekreis zugeordnet werden. Sonst werden sie nicht mehr angezeigt und die Validierung lehnt sie ab.

## Wechsel von der alten Quelle

Bis November 2026 nutzte das Projekt wie der Prototyp die archivierte Datei aus [isellsoap/deutschlandGeoJSON](https://github.com/isellsoap/deutschlandGeoJSON) (434 Kreise, Gebietsstand vor 2008/2011, Lizenz der Ursprungsdaten ungeklärt, englische Namen, Bodensee als eigener Kreis). Mit der Umstellung:

- `regionId` ist jetzt der AGS statt der laufenden Nummer der alten Datei. Die Demo-Meldungen wurden umgestellt (z. B. `141` → `11000` Berlin, `83` → `09184` Landkreis München).
- Namenskorrekturen und die Bodensee-Fläche sind entfallen.
- Neu oder geändert sind u. a. Erzgebirgskreis, Vorpommern-Rügen, Landkreis Rostock, Wartburgkreis mit Eisenach und die kreisfreie Stadt Hanau.

## Umsetzung im React-Projekt

| Baustein | Datei |
| --- | --- |
| Rohdaten BKG, unverändert | `data/quellen/vg2500_01-01-2026/` |
| Aufbereitung | `scripts/build-regionen.mjs` |
| Kartenformen für den Browser | `public/geo/kreise.geo.json` |
| Werteliste der Landkreise | `data/stammdaten/regionen.json` |
| Darstellung | `src/components/karte/GermanyMap.jsx` |
| Quellenvermerk unter der Karte | `content/karte.md` (`legendeQuelle`), `src/components/karte/MapLegend.jsx` |
| Farben | `src/styles/tokens.css`, `src/styles/karte.css` |

D3 berechnet Projektion (Mercator) und Zoom, die Pfade zeichnet React. Karte und Daten werden vom eigenen Server ausgeliefert, es gibt keinen Abruf bei Dritten.
