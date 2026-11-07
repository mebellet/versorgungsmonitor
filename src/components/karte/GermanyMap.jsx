import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { select } from 'd3-selection';
import { zoom as d3Zoom, zoomIdentity } from 'd3-zoom';
import 'd3-transition';
import regionen from '../../../data/stammdaten/regionen.json';

const BREITE = 380;
const HOEHE = 460;
const RAND = 5;

const regionNachId = new Map(regionen.map((r) => [r.id, r]));

// D3 rechnet hier nur Koordinaten und Zoom; gezeichnet wird von React. Die
// Pfade sind memoisiert, damit ein Klick nicht alle rund 400 Formen neu rendert.
const Kreise = memo(function Kreise({ formen, gemeldet, onWaehle }) {
  return formen.map(({ id, d }) => (
    <path
      key={id}
      d={d}
      className={`kreis${gemeldet.has(id) ? ' gemeldet' : ''}`}
      onClick={() => onWaehle(id)}
    >
      <title>{regionNachId.get(id)?.label}</title>
    </path>
  ));
});

export default function GermanyMap({ gemeldet, ausgewaehlt, onWaehle, texte }) {
  const svgRef = useRef(null);
  const gRef = useRef(null);
  const zoomRef = useRef(null);
  const [geo, setGeo] = useState(null);
  const [fehler, setFehler] = useState(false);

  useEffect(() => {
    let aktiv = true;
    fetch(`${import.meta.env.BASE_URL}geo/kreise.geo.json`)
      .then((r) => r.json())
      .then((daten) => { if (aktiv) setGeo(daten); })
      .catch(() => { if (aktiv) setFehler(true); });
    return () => { aktiv = false; };
  }, []);

  const formen = useMemo(() => {
    if (!geo) return [];
    const projektion = geoMercator().fitSize([BREITE - RAND * 2, HOEHE - RAND * 2], geo);
    const pfad = geoPath().projection(projektion);
    return geo.features.map((f) => ({ id: f.properties.id, d: pfad(f) }));
  }, [geo]);

  useEffect(() => {
    if (!geo) return undefined;
    const svg = select(svgRef.current);
    const verhalten = d3Zoom()
      .scaleExtent([1, 8])
      .translateExtent([[-100, -100], [BREITE + 100, HOEHE + 100]])
      .on('zoom', (event) => {
        gRef.current.setAttribute('transform', `translate(${RAND},${RAND}) ${event.transform}`);
      });
    svg.call(verhalten);
    zoomRef.current = verhalten;
    return () => svg.on('.zoom', null);
  }, [geo]);

  const zoomen = (faktor) => select(svgRef.current).transition().duration(200).call(zoomRef.current.scaleBy, faktor);
  const zuruecksetzen = () => select(svgRef.current).transition().duration(250).call(zoomRef.current.transform, zoomIdentity);

  if (fehler) return <p className="karte-fehler">{texte.karteFehler}</p>;

  const auswahlForm = formen.find((f) => f.id === ausgewaehlt);

  return (
    <>
      <div className="karte-werkzeuge" role="group" aria-label="Kartenzoom">
        <button type="button" className="btn btn-klein" onClick={() => zoomen(1.4)} aria-label="Karte vergrößern">+</button>
        <button type="button" className="btn btn-klein" onClick={() => zoomen(1 / 1.4)} aria-label="Karte verkleinern">−</button>
        <button type="button" className="btn btn-klein" onClick={zuruecksetzen}>Zoom zurücksetzen</button>
      </div>
      <svg ref={svgRef} className="karte" viewBox={`0 0 ${BREITE} ${HOEHE}`} role="img" aria-label={texte.karteAria}>
        <g ref={gRef} transform={`translate(${RAND},${RAND})`}>
          <Kreise formen={formen} gemeldet={gemeldet} onWaehle={onWaehle} />
          {/* Eigene Ebene, damit die Kontur nicht von Nachbarkreisen überdeckt wird. */}
          {auswahlForm && <path d={auswahlForm.d} className="kreis-auswahl" />}
        </g>
      </svg>
    </>
  );
}
