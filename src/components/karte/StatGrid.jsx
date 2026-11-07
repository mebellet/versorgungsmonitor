import { formatVorzeichen, formatWochen } from '../../lib/format.js';

export default function StatGrid({ bundesweit, texte }) {
  const b = bundesweit;
  const kacheln = [
    { wert: b ? formatVorzeichen(b.gkvDelta) : '–', label: texte.statKassenplaetze, negativ: b?.gkvDelta < 0 },
    { wert: b?.wartezeit != null ? formatWochen(b.wartezeit) : '–', label: texte.statWartezeit },
    { wert: b ? b.meldungen.toLocaleString('de-DE') : '–', label: texte.statMeldungen },
    { wert: b ? b.praxenDieseWoche.toLocaleString('de-DE') : '–', label: texte.statPraxenWoche },
  ];

  return (
    <div className="stat-raster">
      {kacheln.map((k) => (
        <div className="stat-kachel" key={k.label}>
          <div className={`stat-zahl${k.negativ ? ' negativ' : ''}`}>{k.wert}</div>
          <div className="stat-label">{k.label}</div>
        </div>
      ))}
    </div>
  );
}
