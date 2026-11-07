import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { inhalt } from '../../lib/content.js';

// Titelzeile des Monitors. Logo und Hauptnavigation liefert die Homepage,
// in die der Monitor eingebettet wird.
export default function Kopfbereich() {
  const navigate = useNavigate();
  const { attributes: a } = inhalt('allgemein');
  const obenRef = useRef(null);
  const [schwebend, setSchwebend] = useState(false);

  // Sobald der Button neben dem Titel nach oben aus dem Bild gescrollt ist,
  // erscheint eine schwebende Kopie unten rechts.
  useEffect(() => {
    const beobachter = new IntersectionObserver(([eintrag]) => {
      setSchwebend(!eintrag.isIntersecting && eintrag.boundingClientRect.top < 0);
    });
    beobachter.observe(obenRef.current);
    return () => beobachter.disconnect();
  }, []);

  // Der Zeitstempel sorgt dafür, dass das Formular auch von /melden aus zurückspringt.
  const melden = () => navigate('/melden', { state: { neu: Date.now() } });

  return (
    <header className="kopf">
      <div className="kopf-titel">
        <h1>{a.titel}</h1>
        <p className="kopf-untertitel">{a.untertitel}</p>
      </div>
      <button ref={obenRef} type="button" className="btn btn-primaer btn-gross" onClick={melden}>
        {a.cta}
      </button>
      {/* Der Rahmen ist so breit wie die Seite, damit der Button rechts mit den Kästen abschließt. */}
      <div className={`melden-schwebend${schwebend ? ' sichtbar' : ''}`} aria-hidden={!schwebend}>
        <div className="melden-schwebend-innen">
          <button type="button" className="btn btn-primaer btn-gross" onClick={melden} tabIndex={schwebend ? 0 : -1}>
            {a.cta}
          </button>
        </div>
      </div>
    </header>
  );
}
