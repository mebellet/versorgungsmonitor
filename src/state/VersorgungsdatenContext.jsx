import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ladeAggregat, sendeMeldung } from '../api/client.js';

const Kontext = createContext(null);

export function VersorgungsdatenProvider({ children }) {
  const [aggregat, setAggregat] = useState(null);
  const [ladefehler, setLadefehler] = useState(false);

  const aktualisiere = useCallback(() => {
    ladeAggregat().then((daten) => {
      setAggregat(daten);
      setLadefehler(false);
    }).catch(() => setLadefehler(true));
  }, []);

  // Beim Zurückkehren in den Tab auch Meldungen anderer Personen nachladen.
  useEffect(() => {
    aktualisiere();
    window.addEventListener('focus', aktualisiere);
    return () => window.removeEventListener('focus', aktualisiere);
  }, [aktualisiere]);

  // Die Serverantwort enthält das neue Aggregat. Karte, Kacheln und Seitenpanel
  // hängen an diesem State und zeigen die Meldung ohne Neuladen.
  const melde = useCallback(async (nutzdaten) => {
    const antwort = await sendeMeldung(nutzdaten);
    setAggregat(antwort.aggregat);
    return antwort;
  }, []);

  const wert = useMemo(() => ({ aggregat, ladefehler, melde }), [aggregat, ladefehler, melde]);
  return <Kontext.Provider value={wert}>{children}</Kontext.Provider>;
}

export function useVersorgungsdaten() {
  return useContext(Kontext);
}
