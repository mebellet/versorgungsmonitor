# Abweichungen vom HTML-Prototyp

Stand: 05.11.2026

Die Rechenlogik wurde geprüft: Alle bundesweiten Kennzahlen und die Werte aller 12 Landkreise mit Demodaten stimmen mit dem Originalcode des Prototyps überein. Lagen HTML und Designer-Anleitung auseinander, gilt die Anleitung.

## Design: Styleguide statt Prototyp-Optik

| Element | Prototyp | Jetzt (Styleguide v4.0) |
| --- | --- | --- |
| Schriften | Baloo 2, Nunito | Bricolage Grotesque, IBM Plex Sans |
| Farben | eigene Plum-/Pink-/Coral-Palette | Pink 500, Pink 950, Pink 200, Taupe |
| Negativwerte | Coral | Red 500 aus der Datenpalette |
| Kopfzeile | dunkel mit „VM“-Kachel | entfällt: Der Monitor wird in aktionsbuendnis-psychotherapie.info eingebettet. Titel „Versorgungsmonitor“ mit „Jetzt melden“ rechts daneben, Reiter direkt über dem Inhalt, Hintergrund Pink 200, kein Demo-Banner und keine eigene Fußzeile |
| Karte | Pink-Töne | gemeldet Pink 500, leer Taupe 200, Auswahl Pink 950 |

Die Bildmarke wurde aus dem Styleguide-PDF ausgeschnitten (`public/brand/bildmarke.svg`). Die Originaldatei sollte sie ersetzen.

Hinweis zur Barrierefreiheit: Pink 500 und Red 500 erreichen auf Weiß nur etwa 3,5 bis 3,8 zu 1, für kleine Schrift empfiehlt WCAG AA 4,5 zu 1. Der Styleguide gibt Pink 500 für Captions vor, das ist so umgesetzt. Verluste tragen zusätzlich das Minuszeichen und das Wort „Verlust“, die Bedeutung hängt also nicht an der Farbe.

## Behobene Fehler des Prototyps

| Fehler | Auswirkung | Jetzt |
| --- | --- | --- |
| Link im Banner löst einen JavaScript-Fehler aus (im Browser bestätigt) | Seite bleibt leer | Routing mit eigenen URLs |
| Absenden ohne Landkreis | Erfolgsmeldung, aber nichts gespeichert | Pflichtfeld, nur Werte aus der Liste |
| „Zurück“ auf Schritt 6 und erneute Verifikation | Meldung wird doppelt gezählt | kein Zurück, Server erkennt Doppelte |
| Schritt 5 wartet auf einen Klick auf „Verifikation läuft…“ | irreführend | startet automatisch, Button gesperrt |
| Schritte 4 und 5 werden nie übersprungen | Zusage im Text stimmt nicht | verifizierte Personen springen von Schritt 3 direkt zu 6 |
| Betroffene Gruppen und Schließungsdatum werden nicht gespeichert | Angaben gehen verloren | gespeichert |
| „Neue Meldung“ leert nicht alle Felder | Altwerte bleiben stehen | alles zurückgesetzt |
| Fehlender Vorher- oder Jetzt-Wert zählt als 0 | Scheinverlust oder -zuwachs | Praxis zählt für diesen Wert nicht |
| Klarname als Schlüssel in der Meldung | Datenschutzproblem | zufälliges Pseudonym |
| Alle Meldungen liegen im Browser, gehen beim Neuladen verloren | keine Persistenz, kein Datenschutz | Server speichert, Browser erhält nur Summen |

## Nach Designer-Anleitung geändert

- Delta-Texte: „Steigerung“ statt „Zuwachs“, „±0“ statt „±0 (unverändert)“
- Leere Landkreise zeigen 0, ±0 und „Keine Meldung dazu“ statt Strichen
- Feld „Qualitative Hinweise“ in Schritt 3 entfernt
- Eingabegrenzen: Datum ab 01.03.2026 und nicht in der Zukunft, Ganzzahlen ≥ 0, LANR genau 9 Ziffern, E-Mail-Format, „Sonstiger Grund“ verpflichtend
- Felder mit „empfohlen ja“ sind Pflichtfelder

## Eigene Entscheidungen, bitte prüfen

- **Tooltips in Schritt 3:** Die Erklärungen stehen direkt sichtbar unter jeder Option, wie bei den Gründen in Schritt 1. Das funktioniert auch auf dem Handy. Der Satz in der Anleitung dazu bricht mitten im Wort ab („jede mit Tooltip ( kann auch“).
- **Tooltip bei der LANR:** Stattdessen steht ein Hinweistext unter dem Feld.
- **„Meldungen in dieser Sitzung“** heißt jetzt „Meldungen“, weil Daten über die Sitzung hinaus gespeichert werden.
- **Dropdowns in Schritt 4** starten mit „Bitte wählen“, damit niemand versehentlich den ersten Wert meldet.
- **Freitexte** sind auf 500 Zeichen begrenzt. Die Anleitung nennt keine Grenze, der Server braucht aber eine.
- **Verlaufsgrafik im Seitenpanel:** Sie ist im Prototyp vorhanden, fehlt aber in der Anleitung, und bleibt erhalten.
- **Landkreisnamen und Grenzen:** amtliche Namen und Gebietsstand 01.01.2026 aus den BKG-Daten (VG2500) statt der veralteten Datei des Prototyps (siehe [Deutschlandkarte](deutschlandkarte.md)). Gleichnamige Kreise heißen z. B. „Karlsruhe (Stadt)“ und „Karlsruhe (Landkreis)“.

## Widersprüche in den Quellen

| Thema | Quelle A | Quelle B | Umgesetzt |
| --- | --- | --- | --- |
| Gesetz in der Überschrift | HTML, Konzept: BSSG | Anleitung: GKV-BStabG | BStabG (Untertitel), änderbar in `content/allgemein.md` |
| Patientenzahlen im Panel | Konzept: vorher → jetzt | Anleitung, HTML: nur Differenz | Differenz |
| Anrede | „Klicke“, „Deine Meldung“ | „in dem Sie tätig sind“ | Text unverändert übernommen |
| Zielgruppe im Formularkopf | „Psychologische oder Ärztliche“ | Konzept nennt auch KJP | Text unverändert übernommen |

## Demodaten

Die Demo-Meldungen für München sind dem **Landkreis** München (`09184`) zugeordnet, wie schon in der alten Kartenquelle des Prototyps. Die Praxis „Schwabing“ liegt aber in der Stadt (`09162`). Die Zuordnung ist unverändert übernommen, damit die Zahlen vergleichbar bleiben. Beim Wechsel auf die BKG-Daten wurden die `regionId` der Demo-Meldungen auf den amtlichen Kreisschlüssel umgestellt. Die Praxis-Kennungen wurden durch neutrale IDs wie `demo-praxis-01` ersetzt.
