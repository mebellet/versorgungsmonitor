// Speicher-Adapter für die Entwicklung: alles liegt in Dateien unter data/.
// Für den Produktivbetrieb wird nur diese Datei gegen eine Datenbank-Variante
// mit denselben Funktionen getauscht (siehe docs/datenspeicherung-konzept.md).
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const pfad = (datei) => fileURLToPath(new URL(`../data/${datei}`, import.meta.url));

const DEMO = pfad('demo/meldungen.demo.json');
const NEU = pfad('neu/meldungen.jsonl');
const IDENTITAETEN = pfad('neu/identitaeten.json');

function leseNeue() {
  if (!existsSync(NEU)) return [];
  return readFileSync(NEU, 'utf8').split('\n').filter(Boolean).map((zeile) => JSON.parse(zeile));
}

function leseIdentitaeten() {
  return existsSync(IDENTITAETEN) ? JSON.parse(readFileSync(IDENTITAETEN, 'utf8')) : [];
}

export function alleMeldungen() {
  return [...JSON.parse(readFileSync(DEMO, 'utf8')), ...leseNeue()]
    .filter((m) => m.status === 'veroeffentlicht');
}

export function meldungMitClientId(clientId) {
  return leseNeue().find((m) => m.clientId === clientId) ?? null;
}

export function speichereMeldung(meldung) {
  appendFileSync(NEU, `${JSON.stringify(meldung)}\n`);
}

// Dieselbe Person behält ihren Pseudonym-Schlüssel, damit Mehrfachmeldungen als
// eine Praxis zählen. Erkannt wird sie an E-Mail oder LANR.
export function holeOderErzeugeIdentitaet(angaben) {
  const liste = leseIdentitaeten();
  const email = angaben.email.trim().toLowerCase();
  const lanr = angaben.lanr?.trim() || null;
  let eintrag = liste.find((i) => i.email === email || (lanr && i.lanr === lanr));
  if (!eintrag) {
    eintrag = {
      praxisKey: `p-${randomUUID()}`,
      sitzung: randomBytes(32).toString('hex'),
      email,
      lanr,
      name: angaben.name?.trim() || null,
      berufsstatus: angaben.berufsstatus,
      bundesland: angaben.bundesland,
      kvStatus: angaben.kvStatus,
      verifiziertAm: new Date().toISOString(),
    };
    liste.push(eintrag);
    writeFileSync(IDENTITAETEN, JSON.stringify(liste, null, 1));
  }
  return eintrag;
}

export function identitaetZuSitzung(sitzung) {
  if (!sitzung) return null;
  return leseIdentitaeten().find((i) => i.sitzung === sitzung) ?? null;
}
