// Feldregeln aus der Designer-Anleitung (Kapitel 4 und Anhang). Dieselbe Datei
// prüft im Browser (Fehlermeldungen je Schritt) und auf dem Server (Schutz vor
// manipulierten Anfragen).

import optionen from '../data/stammdaten/formular-optionen.json' with { type: 'json' };
import regionen from '../data/stammdaten/regionen.json' with { type: 'json' };

export const FRUEHESTES_DATUM = '2026-03-01';
export const MAX_FREITEXT = 500;
export const POLITISCH_GRUENDE = ['budget', 'honorar', 'regress', 'kv', 'gba'];

const regionIds = new Set(regionen.map((r) => r.id));
const werte = (liste) => liste.map((o) => o.value);

// Kalendertag in Deutschland, unabhängig von der Zeitzone des Servers.
export const heuteIso = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });

const istDatum = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s ?? '') && !Number.isNaN(Date.parse(s));
const istZahl = (v) => /^\d+$/.test(String(v ?? ''));
const leer = (v) => v == null || String(v).trim() === '';

const zuLang = (v) => String(v ?? '').length > MAX_FREITEXT;

function pruefeSchritt1(f, fehler) {
  if (!regionIds.has(f.regionId)) fehler.regionId = 'Bitte einen Landkreis aus der Liste auswählen.';
  if (!istDatum(f.datum)) fehler.datum = 'Bitte ein gültiges Datum angeben.';
  else if (f.datum < FRUEHESTES_DATUM) fehler.datum = 'Das Datum darf frühestens der 01.03.2026 sein.';
  else if (f.datum > heuteIso()) fehler.datum = 'Das Datum darf nicht in der Zukunft liegen.';

  const gueltig = werte(optionen.gruende);
  if (!f.gruende?.length) fehler.gruende = 'Bitte mindestens einen Grund auswählen.';
  else if (!f.gruende.every((g) => gueltig.includes(g))) fehler.gruende = 'Ungültiger Grund.';
}

function pruefeSchritt2(f, fehler) {
  if (!werte(optionen.praxisformen).includes(f.praxisform)) fehler.praxisform = 'Bitte eine Praxisform auswählen.';
  if (!werte(optionen.kassensitz).includes(f.sitzAnteil)) fehler.sitzAnteil = 'Bitte den Umfang des Kassensitzes auswählen.';

  ['gkvVorher', 'gkvJetzt'].forEach((feld) => {
    if (leer(f[feld])) fehler[feld] = 'Bitte eine Zahl angeben.';
  });
  ['gkvVorher', 'privatVorher', 'selbstVorher', 'gkvJetzt', 'privatJetzt', 'selbstJetzt'].forEach((feld) => {
    if (!leer(f[feld]) && !istZahl(f[feld])) fehler[feld] = 'Nur ganze Zahlen ab 0.';
  });

  if (f.gruende?.includes('schliessung')) {
    if (!istDatum(f.schliessDatum)) fehler.schliessDatum = 'Bitte das Schließungsdatum angeben.';
    else if (f.schliessDatum < FRUEHESTES_DATUM) fehler.schliessDatum = 'Das Datum darf frühestens der 01.03.2026 sein.';
  }
  if (f.gruende?.includes('wartezeit')) {
    ['wzVorher', 'wzNachher'].forEach((feld) => {
      if (!istZahl(f[feld])) fehler[feld] = 'Bitte eine ganze Zahl ab 0 angeben.';
    });
  }
  if (f.gruende?.includes('sonstige') && leer(f.sonstigeText)) fehler.sonstigeText = 'Bitte kurz beschreiben.';
  if (zuLang(f.sonstigeText)) fehler.sonstigeText = `Maximal ${MAX_FREITEXT} Zeichen.`;
  if (zuLang(f.politischText)) fehler.politischText = `Maximal ${MAX_FREITEXT} Zeichen.`;
}

function pruefeSchritt3(f, fehler) {
  const gueltig = werte(optionen.betroffeneGruppen);
  if (!(f.betroffeneGruppen ?? []).every((g) => gueltig.includes(g))) fehler.betroffeneGruppen = 'Ungültige Auswahl.';
}

export function pruefeIdentitaet(i) {
  const fehler = {};
  if (!optionen.berufsstatus.includes(i.berufsstatus)) fehler.berufsstatus = 'Bitte den Berufsstatus auswählen.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(i.email ?? '')) fehler.email = 'Bitte eine gültige E-Mail-Adresse angeben.';
  if (leer(i.name) && leer(i.lanr)) fehler.name = 'Bitte Name oder LANR angeben.';
  if (!leer(i.lanr) && !/^\d{9}$/.test(i.lanr)) fehler.lanr = 'Die LANR besteht aus genau 9 Ziffern.';
  if (!optionen.bundeslaender.includes(i.bundesland)) fehler.bundesland = 'Bitte das Bundesland auswählen.';
  if (!optionen.kvStatus.includes(i.kvStatus)) fehler.kvStatus = 'Bitte den KV-Zulassungsstatus auswählen.';
  return fehler;
}

const PRUEFER = { 1: pruefeSchritt1, 2: pruefeSchritt2, 3: pruefeSchritt3 };

export function pruefeSchritt(schritt, meldung) {
  const fehler = {};
  PRUEFER[schritt]?.(meldung, fehler);
  return fehler;
}

export function pruefeMeldung(meldung) {
  return { ...pruefeSchritt(1, meldung), ...pruefeSchritt(2, meldung), ...pruefeSchritt(3, meldung) };
}
