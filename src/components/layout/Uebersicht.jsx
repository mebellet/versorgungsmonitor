import StatGrid from '../karte/StatGrid.jsx';
import { inhalt } from '../../lib/content.js';
import { useVersorgungsdaten } from '../../state/VersorgungsdatenContext.jsx';
import Navigation from './Navigation.jsx';

const texte = inhalt('karte').attributes;

// Kasten mit den bundesweiten Kennzahlen und darunter die Reiter. Steht in
// allen drei Ansichten, damit die bisherigen Meldungen immer sichtbar sind.
export default function Uebersicht() {
  const { aggregat, ladefehler } = useVersorgungsdaten();
  return (
    <>
      {ladefehler && <p className="fehler" role="alert">{texte.datenFehler}</p>}
      <StatGrid bundesweit={aggregat?.bundesweit} texte={texte} />
      <Navigation />
    </>
  );
}
