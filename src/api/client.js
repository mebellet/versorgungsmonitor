// Schnittstelle zum Server. In der Demo-Version für GitHub Pages
// (VITE_DEMO=true, siehe .env.pages) übernimmt src/api/demo.js.
const DEMO = import.meta.env.VITE_DEMO === 'true';

async function anfrage(pfad, optionen) {
  const antwort = await fetch(pfad, optionen);
  const daten = await antwort.json().catch(() => ({}));
  if (!antwort.ok) {
    const fehler = new Error(daten.fehler ?? 'Die Anfrage ist fehlgeschlagen.');
    fehler.felder = daten.felder;
    throw fehler;
  }
  return daten;
}

const demo = (name) => (...args) => import('./demo.js').then((m) => m[name](...args));

export const ladeAggregat = DEMO ? demo('ladeAggregat') : () => anfrage('/api/aggregat');

export const ladeSitzung = DEMO ? demo('ladeSitzung') : () => anfrage('/api/sitzung');

export const sendeMeldung = DEMO ? demo('sendeMeldung') : (nutzdaten) => anfrage('/api/meldungen', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(nutzdaten),
});
