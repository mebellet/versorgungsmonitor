import { useEffect, useRef, useState } from 'react';
import { ladeSitzung } from '../../api/client.js';
import { inhalt } from '../../lib/content.js';
import { useVersorgungsdaten } from '../../state/VersorgungsdatenContext.jsx';
import { pruefeIdentitaet, pruefeSchritt } from '../../../shared/validierung.js';
import Markdown from '../Markdown.jsx';
import { Schritt1, Schritt2, Schritt3, Schritt4, Schritt5, Schritt6 } from './schritte.jsx';
import { neueId } from '../../lib/id.js';

const LETZTER_SCHRITT = 6;
const PRUEF_TAKT_MS = 650;

const leereMeldung = () => ({
  regionId: null,
  datum: '',
  gruende: [],
  praxisform: null,
  sitzAnteil: null,
  gkvVorher: '', privatVorher: '', selbstVorher: '',
  gkvJetzt: '', privatJetzt: '', selbstJetzt: '',
  wzVorher: '', wzNachher: '',
  schliessDatum: '',
  nachbesetzung: false,
  politischText: '',
  sonstigeText: '',
  betroffeneGruppen: [],
});

const leereIdentitaet = () => ({
  berufsstatus: '', email: '', name: '', lanr: '', bundesland: '', kvStatus: '',
});

const warte = (ms) => new Promise((fertig) => { setTimeout(fertig, ms); });

export default function MeldeFormular() {
  const { melde } = useVersorgungsdaten();
  const [schritt, setSchritt] = useState(1);
  const [meldung, setMeldung] = useState(leereMeldung);
  const [identitaet, setIdentitaet] = useState(leereIdentitaet);
  const [fehler, setFehler] = useState({});
  const [verifiziert, setVerifiziert] = useState(false);
  const [pruefStatus, setPruefStatus] = useState(['wartend', 'wartend']);
  const [laeuft, setLaeuft] = useState(false);
  const [sendefehler, setSendefehler] = useState(null);
  const [gemeldeteRegion, setGemeldeteRegion] = useState(null);

  // Bleibt bei Wiederholungen gleich, damit der Server Doppelte erkennt.
  const clientId = useRef(null);
  if (clientId.current === null) clientId.current = neueId();
  const schrittRef = useRef(null);
  const ersterRender = useRef(true);

  useEffect(() => {
    ladeSitzung().then((s) => setVerifiziert(s.verifiziert)).catch(() => {});
  }, []);

  // Fokus beim Schrittwechsel mitnehmen (Tastatur, Screenreader).
  useEffect(() => {
    if (ersterRender.current) { ersterRender.current = false; return; }
    schrittRef.current?.focus({ preventScroll: true });
  }, [schritt]);

  const setze = (feld, wert) => setMeldung((m) => ({ ...m, [feld]: wert }));
  const setzeIdent = (feld, wert) => setIdentitaet((i) => ({ ...i, [feld]: wert }));

  const absenden = async (mitIdentitaet) => {
    const antwort = await melde({
      clientId: clientId.current,
      meldung,
      identitaet: mitIdentitaet ? identitaet : undefined,
    });
    setGemeldeteRegion(antwort.regionId);
    setVerifiziert(true);
    setSchritt(LETZTER_SCHRITT);
  };

  // Simulierte Prüfung (Schritt 5): Das Speichern läuft parallel zur Anzeige,
  // Schritt 6 erscheint erst, wenn beides fertig ist.
  const verifizieren = async () => {
    setLaeuft(true);
    setSendefehler(null);
    try {
      for (const index of [0, 1]) {
        setPruefStatus((s) => s.map((x, i) => (i === index ? 'pruefung' : x)));
        await warte(PRUEF_TAKT_MS);
        setPruefStatus((s) => s.map((x, i) => (i === index ? 'fertig' : x)));
      }
      await absenden(true);
    } catch (e) {
      setSendefehler(e.message);
      setPruefStatus(['wartend', 'wartend']);
    } finally {
      setLaeuft(false);
    }
  };

  // Bereits verifizierte Personen überspringen Schritt 4 und 5.
  const direktAbsenden = async () => {
    setLaeuft(true);
    setSendefehler(null);
    try {
      await absenden(false);
    } catch (e) {
      setSendefehler(e.message);
    } finally {
      setLaeuft(false);
    }
  };

  const zurueckAufStart = () => {
    setMeldung(leereMeldung());
    setIdentitaet(leereIdentitaet());
    setFehler({});
    setPruefStatus(['wartend', 'wartend']);
    setSendefehler(null);
    clientId.current = neueId();
    setSchritt(1);
  };

  const weiter = () => {
    if (schritt === LETZTER_SCHRITT) { zurueckAufStart(); return; }

    const gefunden = schritt === 4 ? pruefeIdentitaet(identitaet) : pruefeSchritt(schritt, meldung);
    setFehler(gefunden);
    if (Object.keys(gefunden).length) return;

    if (schritt === 3 && verifiziert) { direktAbsenden(); return; }
    if (schritt === 4) { setSchritt(5); verifizieren(); return; }
    setSchritt(schritt + 1);
  };

  const zurueck = () => { setSendefehler(null); setSchritt(schritt - 1); };

  const seite = inhalt(`melden/schritt-${schritt}`);
  const { titel, linkText, buttonNeu, demoHinweis } = seite.attributes;

  let naechsterText = 'Weiter';
  if (schritt === 5) naechsterText = laeuft ? 'Verifikation läuft…' : 'Erneut versuchen';
  if (schritt === LETZTER_SCHRITT) naechsterText = buttonNeu;

  return (
    <div className="formular">
      <div className="schritte" aria-hidden="true">
        {Array.from({ length: LETZTER_SCHRITT }, (_, i) => {
          const nummer = i + 1;
          let klasse = '';
          if (nummer < schritt) klasse = 'erledigt';
          if (nummer === schritt) klasse = 'aktuell';
          return <div key={nummer} className={`schritt-punkt ${klasse}`} />;
        })}
      </div>

      <div className="formular-schritt" ref={schrittRef} tabIndex={-1}>
        {schritt < LETZTER_SCHRITT && (
          <>
            <span className="schritt-label">Schritt {schritt} von {LETZTER_SCHRITT}</span>
            <h2>{titel}</h2>
            <div className="schritt-text"><Markdown>{seite.body}</Markdown></div>
          </>
        )}

        {schritt === 1 && <Schritt1 f={meldung} setze={setze} fehler={fehler} />}
        {schritt === 2 && <Schritt2 f={meldung} setze={setze} fehler={fehler} />}
        {schritt === 3 && <Schritt3 f={meldung} setze={setze} fehler={fehler} />}
        {schritt === 4 && <Schritt4 i={identitaet} setzeIdent={setzeIdent} fehler={fehler} />}
        {schritt === 5 && <Schritt5 pruefStatus={pruefStatus} sendefehler={sendefehler} />}
        {schritt === 6 && <Schritt6 regionId={gemeldeteRegion} titel={titel} text={seite.body} linkText={linkText} hinweis={import.meta.env.VITE_DEMO === 'true' ? demoHinweis : null} />}
      </div>

      {schritt === 3 && sendefehler && <p className="fehler" role="alert">{sendefehler}</p>}

      <div className="formular-aktionen">
        <button
          type="button"
          className="btn"
          onClick={zurueck}
          disabled={laeuft}
          style={{ visibility: schritt === 1 || schritt === LETZTER_SCHRITT ? 'hidden' : 'visible' }}
        >
          Zurück
        </button>
        <button
          type="button"
          className="btn btn-primaer"
          onClick={schritt === 5 ? verifizieren : weiter}
          disabled={laeuft}
        >
          {naechsterText}
        </button>
      </div>
    </div>
  );
}
