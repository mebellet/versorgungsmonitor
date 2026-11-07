// Baut aus den Formulareingaben die gespeicherte Meldung. Nimmt nur bekannte
// Felder, und nur die, die zum gewählten Grund gehören. Wird vom Server und
// von der Demo-Version für GitHub Pages (src/api/demo.js) genutzt.
const zahl = (v) => (v == null || v === '' ? null : Number(v));
const text = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);

export function baueMeldung(eingabe, { id, praxisKey, clientId, eingegangenAm = new Date().toISOString() }) {
  const hat = (grund) => eingabe.gruende.includes(grund);
  return {
    id,
    clientId,
    status: 'veroeffentlicht',
    regionId: eingabe.regionId,
    datum: eingabe.datum,
    eingegangenAm,
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
