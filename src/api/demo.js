// Demo-Version ohne Server, für GitHub Pages (npm run build:pages).
// Ersetzt die drei Aufrufe aus client.js: Die Kennzahlen entstehen im Browser
// aus den fiktiven Demo-Meldungen, neue Meldungen landen nur im Arbeitsspeicher
// und sind nach dem Neuladen wieder weg.
//
// Achtung: Hier gehen Einzelmeldungen an den Browser. Das ist nur vertretbar,
// weil alle Demo-Daten fiktiv sind. Der echte Betrieb läuft über server/api.js.
import demoMeldungen from '../../data/demo/meldungen.demo.json';
import { aggregiere } from '../../shared/aggregation.js';
import { baueMeldung } from '../../shared/meldung.js';
import { pruefeIdentitaet, pruefeMeldung } from '../../shared/validierung.js';
import { neueId } from '../lib/id.js';

const meldungen = demoMeldungen.filter((m) => m.status === 'veroeffentlicht');
let praxisKey = null; // gesetzt nach der (simulierten) Verifikation

const aktuellesAggregat = () => aggregiere(meldungen);

function feldfehler(meldung, felder) {
  const fehler = new Error(meldung);
  fehler.felder = felder;
  return fehler;
}

export async function ladeAggregat() {
  return aktuellesAggregat();
}

export async function ladeSitzung() {
  return { verifiziert: praxisKey != null };
}

export async function sendeMeldung({ clientId, meldung, identitaet }) {
  // Doppeltes Absenden legt nichts neu an, wie auf dem Server.
  if (meldungen.some((m) => m.clientId === clientId)) {
    return { aggregat: aktuellesAggregat(), regionId: meldung.regionId };
  }

  const fehler = pruefeMeldung(meldung);
  if (Object.keys(fehler).length) throw feldfehler('Eingaben prüfen.', fehler);

  if (!praxisKey) {
    if (!identitaet) throw new Error('Verifikation erforderlich.');
    const identFehler = pruefeIdentitaet(identitaet);
    if (Object.keys(identFehler).length) throw feldfehler('Eingaben prüfen.', identFehler);
    praxisKey = `demo-sitzung-${neueId()}`;
  }

  meldungen.push(baueMeldung(meldung, { id: neueId(), praxisKey, clientId }));
  return { aggregat: aktuellesAggregat(), regionId: meldung.regionId };
}
