// Rechnet Einzelmeldungen in die veröffentlichten Kennzahlen um. Läuft nur auf
// dem Server: Der Browser bekommt ausschließlich dieses Ergebnis, nie die
// Einzelmeldungen. Einzige Ausnahme ist die Demo für GitHub Pages mit fiktiven
// Daten (src/api/demo.js). Reine Fakten, keine Bewertung – keine Prozentrechnung, kein
// Schweregrad, kein Confidence-Score (Konzeptbeschreibung, Kapitel 5).

const WOCHE_MS = 7 * 24 * 60 * 60 * 1000;

const ts = (m) => Date.parse(m.eingegangenAm);

// Differenz jetzt − vorher. Fehlt einer der beiden Werte, gibt es keine
// Aussage über diese Praxis, also zählt sie mit 0.
function differenz(vorher, jetzt) {
  return vorher != null && jetzt != null ? jetzt - vorher : 0;
}

// Fasst alle Meldungen einer Praxis zu einem Stand zusammen. Dieselbe Praxis
// darf beliebig oft erneut melden:
//  - "Vorher"-Werte kommen aus der ERSTEN Meldung (Stand vor der allerersten
//    gemeldeten Veränderung).
//  - "Jetzt"-Werte kommen aus der NEUESTEN Meldung (aktueller Stand).
//  - Ereignisse wie Schließung oder Wartezeit zählen aus JEDER Meldung, eine
//    frühere Schließung geht also nicht verloren.
export function buildPraxisSnapshots(meldungen) {
  const gruppen = new Map();
  meldungen.forEach((m) => {
    if (!gruppen.has(m.praxisKey)) gruppen.set(m.praxisKey, []);
    gruppen.get(m.praxisKey).push(m);
  });

  return [...gruppen.entries()].map(([praxisKey, liste]) => {
    const sortiert = liste.slice().sort((a, b) => ts(a) - ts(b));
    const erste = sortiert.find((m) => m.gkvVorher != null) ?? sortiert[0];
    const letzte = sortiert.findLast((m) => m.gkvJetzt != null) ?? sortiert.at(-1);
    const schliessungen = sortiert.filter((m) => m.gruende.includes('schliessung'));
    const letzteWartezeit = sortiert.findLast((m) => m.gruende.includes('wartezeit') && m.wzNachher != null);

    const anmerkungen = sortiert.flatMap((m) => [
      ...(m.sonstigeText ? [{ text: m.sonstigeText, art: 'Sonstiges', ts: ts(m) }] : []),
      ...(m.politischText ? [{ text: m.politischText, art: 'Politische Einordnung', ts: ts(m) }] : []),
    ]);

    return {
      praxisKey,
      gkvDelta: differenz(erste.gkvVorher, letzte.gkvJetzt),
      privatDelta: differenz(erste.privatVorher, letzte.privatJetzt),
      selbstDelta: differenz(erste.selbstVorher, letzte.selbstJetzt),
      hatSchliessung: schliessungen.length > 0,
      nachbesetzungGeplant: schliessungen.some((m) => m.nachbesetzung === true),
      wzNachher: letzteWartezeit?.wzNachher ?? null,
      anmerkungen,
    };
  });
}

const summe = (liste, feld) => liste.reduce((s, x) => s + x[feld], 0);

function mittlereWartezeit(snapshots) {
  const werte = snapshots.filter((s) => s.wzNachher != null).map((s) => s.wzNachher);
  return werte.length ? werte.reduce((a, b) => a + b, 0) / werte.length : null;
}

// Für jeden Monat zwischen erster und letzter Meldung: gemeldeter Verlust auf
// Basis aller bis dahin eingegangenen Meldungen (rein deskriptiv, keine Prognose).
function regionTrend(meldungen) {
  const zeiten = meldungen.map(ts);
  const start = new Date(Math.min(...zeiten));
  const ende = new Date(Math.max(...zeiten));
  const trend = [];
  for (let y = start.getUTCFullYear(), mo = start.getUTCMonth();
    y < ende.getUTCFullYear() || (y === ende.getUTCFullYear() && mo <= ende.getUTCMonth());
    mo === 11 ? (y++, mo = 0) : mo++) {
    const grenze = Date.UTC(y, mo + 1, 1);
    const snapshots = buildPraxisSnapshots(meldungen.filter((m) => ts(m) < grenze));
    trend.push({ monat: `${y}-${String(mo + 1).padStart(2, '0')}`, verlust: -summe(snapshots, 'gkvDelta') });
  }
  return trend;
}

function regionKennzahlen(meldungen) {
  const snapshots = buildPraxisSnapshots(meldungen);
  const schliessungen = snapshots.filter((s) => s.hatSchliessung);
  return {
    meldungen: meldungen.length,
    praxen: snapshots.length,
    gkvDelta: summe(snapshots, 'gkvDelta'),
    privatDelta: summe(snapshots, 'privatDelta'),
    selbstDelta: summe(snapshots, 'selbstDelta'),
    schliessungen: schliessungen.length,
    nachbesetzung: schliessungen.filter((s) => s.nachbesetzungGeplant).length,
    wartezeit: mittlereWartezeit(snapshots),
    anmerkungen: snapshots.flatMap((s) => s.anmerkungen)
      .sort((a, b) => b.ts - a.ts)
      .map(({ art, text }) => ({ art, text })),
    trend: regionTrend(meldungen),
  };
}

// `jetzt` ist nur für Tests ein Parameter.
export function aggregiere(meldungen, jetzt = Date.now()) {
  const snapshots = buildPraxisSnapshots(meldungen);
  const proRegion = new Map();
  meldungen.forEach((m) => {
    if (!proRegion.has(m.regionId)) proRegion.set(m.regionId, []);
    proRegion.get(m.regionId).push(m);
  });

  const regionen = {};
  proRegion.forEach((liste, id) => { regionen[id] = regionKennzahlen(liste); });

  const dieseWoche = meldungen.filter((m) => jetzt - ts(m) >= 0 && jetzt - ts(m) <= WOCHE_MS);

  return {
    stand: new Date(jetzt).toISOString(),
    bundesweit: {
      gkvDelta: summe(snapshots, 'gkvDelta'),
      wartezeit: mittlereWartezeit(snapshots),
      meldungen: meldungen.length,
      praxenDieseWoche: new Set(dieseWoche.map((m) => m.praxisKey)).size,
    },
    regionen,
  };
}
