import { useLocation } from 'react-router-dom';
import MeldeFormular from '../components/formular/MeldeFormular.jsx';
import Uebersicht from '../components/layout/Uebersicht.jsx';
import Seitenkopf from '../components/Seitenkopf.jsx';
import { inhalt } from '../lib/content.js';

export default function MeldenPage() {
  const { state } = useLocation();
  return (
    <>
      <Uebersicht />
      <Seitenkopf seite={inhalt('melden/intro')} />
      {/* Neuer key = frisches Formular, ausgelöst vom Button „Jetzt melden“. */}
      <MeldeFormular key={state?.neu ?? 'start'} />
    </>
  );
}
