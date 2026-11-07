import { formatMonat } from '../../lib/format.js';

const B = 240;
const H = 56;
const P = 6;

// Unter zwei Punkten gibt es keinen Verlauf, dann bleibt der Bereich weg.
export default function TrendSparkline({ trend, titel }) {
  if (trend.length < 2) return null;

  const werte = trend.map((t) => t.verlust);
  const min = Math.min(0, ...werte);
  const max = Math.max(0, ...werte);
  const spanne = max - min || 1;
  const schritt = (B - P * 2) / (trend.length - 1);
  const punkte = trend.map((t, i) => ({
    ...t,
    x: P + i * schritt,
    y: H - P - ((t.verlust - min) / spanne) * (H - P * 2),
  }));
  const linie = punkte.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const von = formatMonat(trend[0].monat);
  const bis = formatMonat(trend.at(-1).monat);

  return (
    <div className="panel-block">
      <div className="panel-block-titel">{titel}</div>
      <svg className="trend" viewBox={`0 0 ${B} ${H}`} role="img" aria-label={`${titel}, von ${von} bis ${bis}`}>
        <path d={linie} />
        {punkte.map((p) => (
          <circle key={p.monat} cx={p.x} cy={p.y} r="2.5">
            <title>{formatMonat(p.monat)}: {p.verlust.toLocaleString('de-DE')} Kassenplätze verloren (kumuliert)</title>
          </circle>
        ))}
      </svg>
      <div className="trend-achse"><span>{von}</span><span>{bis}</span></div>
    </div>
  );
}
