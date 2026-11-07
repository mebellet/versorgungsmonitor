import { useEffect, useState } from 'react';
import regionen from '../../data/stammdaten/regionen.json';

const nachLabel = new Map(regionen.map((r) => [r.label.toLowerCase(), r]));
const nachId = new Map(regionen.map((r) => [r.id, r]));

// Textfeld mit Vorschlägen. Nur exakte Treffer aus der Werteliste lösen eine
// Auswahl aus, freier Text ohne Treffer bleibt ohne Wirkung.
export default function LandkreisInput({ id, wert, onAuswahl, ...rest }) {
  const [text, setText] = useState(nachId.get(wert)?.label ?? '');

  useEffect(() => { setText(nachId.get(wert)?.label ?? ''); }, [wert]);

  const aendern = (e) => {
    setText(e.target.value);
    const treffer = nachLabel.get(e.target.value.trim().toLowerCase());
    onAuswahl(treffer?.id ?? null, e.target.value);
  };

  return (
    <>
      <input id={id} type="text" list={`${id}-liste`} autoComplete="off" value={text} onChange={aendern} {...rest} />
      <datalist id={`${id}-liste`}>
        {regionen.map((r) => <option key={r.id} value={r.label} />)}
      </datalist>
    </>
  );
}
