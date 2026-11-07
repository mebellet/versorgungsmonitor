// Anzeige-Konventionen aus der Designer-Anleitung (Anhang).
const zahl = (wert) => Math.abs(wert).toLocaleString('de-DE');

export function formatDelta(wert) {
  if (wert > 0) return { text: `+${zahl(wert)} (Steigerung)`, negativ: false };
  if (wert < 0) return { text: `−${zahl(wert)} (Verlust)`, negativ: true };
  return { text: '±0', negativ: false };
}

export function formatVorzeichen(wert) {
  if (wert === 0) return '0';
  return `${wert < 0 ? '−' : '+'}${zahl(wert)}`;
}

export function formatWochen(wert) {
  return `${wert.toFixed(1).replace('.', ',')} Wochen`;
}

export function formatMonat(iso) {
  return new Date(`${iso}-01T00:00:00Z`).toLocaleDateString('de-DE', { month: 'short', timeZone: 'UTC' });
}

export function regionUntertitel(region) {
  return `${region.typ} · ${region.bundesland}`;
}
