import { formatDelta, formatWochen, regionUntertitel } from '../../lib/format.js';
import TrendSparkline from './TrendSparkline.jsx';

const MAX_ANMERKUNGEN = 5;

const LEER = {
  meldungen: 0, praxen: 0, gkvDelta: 0, privatDelta: 0, selbstDelta: 0,
  schliessungen: 0, nachbesetzung: 0, wartezeit: null, anmerkungen: [], trend: [],
};

function Zeile({ label, wert, negativ }) {
  return (
    <div className="kv-zeile">
      <span className="kv-label">{label}</span>
      <span className={`kv-wert${negativ ? ' negativ' : ''}`}>{wert}</span>
    </div>
  );
}

function DeltaZeile({ label, wert }) {
  const d = formatDelta(wert);
  return <Zeile label={label} wert={d.text} negativ={d.negativ} />;
}

export default function RegionPanel({ region, daten, texte }) {
  if (!region) {
    return (
      <aside className="panel">
        <h3>{texte.panelLeerTitel}</h3>
        <div className="panel-sub">{texte.panelLeerText}</div>
      </aside>
    );
  }

  const d = daten ?? LEER;
  const weitere = d.anmerkungen.length - MAX_ANMERKUNGEN;

  return (
    <aside className="panel" aria-live="polite">
      <h3>{region.name}</h3>
      <div className="panel-sub">{regionUntertitel(region)}</div>

      <Zeile
        label={texte.panelMeldungen}
        wert={d.meldungen ? `${d.meldungen} (${d.praxen} ${d.praxen === 1 ? 'Praxis' : 'Praxen'})` : '0'}
      />
      <DeltaZeile label={texte.panelGkv} wert={d.gkvDelta} />
      <DeltaZeile label={texte.panelPrivat} wert={d.privatDelta} />
      <DeltaZeile label={texte.panelSelbst} wert={d.selbstDelta} />
      <Zeile label={texte.panelSchliessungen} wert={d.schliessungen} />
      {d.schliessungen > 0 && (
        <Zeile label={texte.panelNachbesetzung} wert={`${d.nachbesetzung} von ${d.schliessungen}`} />
      )}
      <Zeile label={texte.panelWartezeit} wert={d.wartezeit != null ? formatWochen(d.wartezeit) : 'Keine Meldung dazu'} />

      {!daten && <p className="hinweis">{texte.panelKeineMeldungen}</p>}

      <TrendSparkline trend={d.trend} titel={texte.panelTrend} />

      {d.anmerkungen.length > 0 && (
        <div className="panel-block">
          <div className="panel-block-titel">{texte.panelAnmerkungen}</div>
          <ul className="anmerkungen">
            {d.anmerkungen.slice(0, MAX_ANMERKUNGEN).map((a) => (
              <li key={a.art + a.text}><b>{a.art}:</b> {a.text}</li>
            ))}
            {weitere > 0 && <li className="anmerkungen-mehr">+ {weitere} weitere</li>}
          </ul>
        </div>
      )}

      <p className="hinweis">{texte.panelHinweis.replace('{name}', region.label)}</p>
    </aside>
  );
}
