import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import regionen from '../../data/stammdaten/regionen.json';
import GermanyMap from '../components/karte/GermanyMap.jsx';
import MapLegend from '../components/karte/MapLegend.jsx';
import RegionPanel from '../components/karte/RegionPanel.jsx';
import LandkreisInput from '../components/LandkreisInput.jsx';
import Uebersicht from '../components/layout/Uebersicht.jsx';
import Markdown from '../components/Markdown.jsx';
import { inhalt } from '../lib/content.js';
import { useVersorgungsdaten } from '../state/VersorgungsdatenContext.jsx';

const seite = inhalt('karte');
const texte = seite.attributes;

export default function KartePage() {
  const { aggregat } = useVersorgungsdaten();
  const [params, setParams] = useSearchParams();

  // Die Auswahl steht in der URL (?landkreis=…): So kann das Formular direkt
  // auf den gemeldeten Landkreis verlinken, und der Link ist teilbar.
  const ausgewaehlt = params.get('landkreis');
  const region = regionen.find((r) => r.id === ausgewaehlt) ?? null;

  const waehle = useCallback((id) => {
    setParams(id ? { landkreis: id } : {}, { replace: true });
  }, [setParams]);

  const gemeldet = useMemo(() => new Set(Object.keys(aggregat?.regionen ?? {})), [aggregat]);

  return (
    <>
      <Uebersicht />
      {/* Einleitungstext aus content/karte.md, direkt unter den Reitern */}
      <div className="karte-einleitung"><Markdown>{seite.body}</Markdown></div>

      <div className="karte-layout">
        <div className="karte-kachel">
          <div className="feld">
            <label htmlFor="karte-suche">{texte.sucheLabel}</label>
            <LandkreisInput
              id="karte-suche"
              wert={ausgewaehlt}
              placeholder={texte.suchePlatzhalter}
              onAuswahl={(id) => { if (id) waehle(id); }}
            />
          </div>
          <GermanyMap gemeldet={gemeldet} ausgewaehlt={ausgewaehlt} onWaehle={waehle} texte={texte} />
          <MapLegend texte={texte} />
        </div>
        <RegionPanel region={region} daten={aggregat?.regionen[ausgewaehlt]} texte={texte} />
      </div>
    </>
  );
}
