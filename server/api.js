// HTTP-Schnittstelle. Läuft als Middleware im Vite-Dev-Server (vite.config.js)
// und im Produktiv-Server (server/index.js).
//
//   GET  /api/aggregat   veröffentlichte Kennzahlen, nie Einzelmeldungen
//   GET  /api/sitzung    ist diese Person schon verifiziert?
//   POST /api/meldungen  neue Meldung speichern, antwortet mit neuem Aggregat
import { randomUUID } from 'node:crypto';
import { aggregiere } from '../shared/aggregation.js';
import { pruefeIdentitaet, pruefeMeldung } from '../shared/validierung.js';
import * as store from './store.js';

const MAX_BODY = 20_000;
const COOKIE = 'vm_sitzung';
const EIN_JAHR = 60 * 60 * 24 * 365;

function json(res, status, daten) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(daten));
}

async function leseBody(req) {
  let text = '';
  for await (const teil of req) {
    text += teil;
    if (text.length > MAX_BODY) throw new Error('zu gross');
  }
  return JSON.parse(text);
}

function sitzungAusCookie(req) {
  const treffer = (req.headers.cookie ?? '').match(new RegExp(`(?:^|; )${COOKIE}=([a-f0-9]+)`));
  return treffer?.[1] ?? null;
}

const zahl = (v) => (v == null || v === '' ? null : Number(v));
const text = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);

// Nimmt nur bekannte Felder, und nur die, die zum gewählten Grund gehören.
function baueMeldung(eingabe, praxisKey, clientId) {
  const hat = (grund) => eingabe.gruende.includes(grund);
  return {
    id: randomUUID(),
    clientId,
    status: 'veroeffentlicht',
    regionId: eingabe.regionId,
    datum: eingabe.datum,
    eingegangenAm: new Date().toISOString(),
    praxisKey,
    gruende: eingabe.gruende,
    praxisform: eingabe.praxisform,
    sitzAnteil: eingabe.sitzAnteil,
    gkvVorher: zahl(eingabe.gkvVorher),
    privatVorher: zahl(eingabe.privatVorher),
    selbstVorher: zahl(eingabe.selbstVorher),
    gkvJetzt: zahl(eingabe.gkvJetzt),
    privatJetzt: zahl(eingabe.privatJetzt),
    selbstJetzt: zahl(eingabe.selbstJetzt),
    wzVorher: hat('wartezeit') ? zahl(eingabe.wzVorher) : null,
    wzNachher: hat('wartezeit') ? zahl(eingabe.wzNachher) : null,
    schliessDatum: hat('schliessung') ? eingabe.schliessDatum : null,
    nachbesetzung: hat('schliessung') ? eingabe.nachbesetzung === true : null,
    politischText: text(eingabe.politischText),
    sonstigeText: hat('sonstige') ? text(eingabe.sonstigeText) : null,
    betroffeneGruppen: eingabe.betroffeneGruppen ?? [],
  };
}

async function postMeldung(req, res) {
  let body;
  try {
    body = await leseBody(req);
  } catch {
    return json(res, 400, { fehler: 'Ungültige Anfrage.' });
  }

  const { clientId, meldung, identitaet } = body;
  if (typeof clientId !== 'string' || !meldung) return json(res, 400, { fehler: 'Ungültige Anfrage.' });

  // Doppeltes Absenden (Netzwerk-Wiederholung, Doppelklick) legt nichts neu an.
  if (store.meldungMitClientId(clientId)) {
    return json(res, 200, { aggregat: aggregiere(store.alleMeldungen()), regionId: meldung.regionId });
  }

  const feldfehler = pruefeMeldung(meldung);
  if (Object.keys(feldfehler).length) return json(res, 422, { fehler: 'Eingaben prüfen.', felder: feldfehler });

  let person = store.identitaetZuSitzung(sitzungAusCookie(req));
  if (!person) {
    if (!identitaet) return json(res, 401, { fehler: 'Verifikation erforderlich.' });
    const identFehler = pruefeIdentitaet(identitaet);
    if (Object.keys(identFehler).length) return json(res, 422, { fehler: 'Eingaben prüfen.', felder: identFehler });
    // Prototyp: Die Verifikation von E-Mail und SMS ist simuliert und gilt hier
    // als bestanden. Produktiv siehe Statusmodell im Konzept.
    person = store.holeOderErzeugeIdentitaet(identitaet);
    const sicher = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader('Set-Cookie', `${COOKIE}=${person.sitzung}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${EIN_JAHR}${sicher}`);
  }

  store.speichereMeldung(baueMeldung(meldung, person.praxisKey, clientId));
  return json(res, 201, { aggregat: aggregiere(store.alleMeldungen()), regionId: meldung.regionId });
}

// Gibt `true` zurück, wenn die Anfrage hier beantwortet wurde.
export async function behandleApi(req, res) {
  const { pathname } = new URL(req.url, 'http://localhost');
  if (!pathname.startsWith('/api/')) return false;

  if (req.method === 'GET' && pathname === '/api/aggregat') {
    json(res, 200, aggregiere(store.alleMeldungen()));
  } else if (req.method === 'GET' && pathname === '/api/sitzung') {
    json(res, 200, { verifiziert: store.identitaetZuSitzung(sitzungAusCookie(req)) != null });
  } else if (req.method === 'POST' && pathname === '/api/meldungen') {
    await postMeldung(req, res);
  } else {
    json(res, 404, { fehler: 'Nicht gefunden.' });
  }
  return true;
}
