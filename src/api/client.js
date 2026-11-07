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

export const ladeAggregat = () => anfrage('/api/aggregat');

export const ladeSitzung = () => anfrage('/api/sitzung');

export const sendeMeldung = (nutzdaten) => anfrage('/api/meldungen', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(nutzdaten),
});
