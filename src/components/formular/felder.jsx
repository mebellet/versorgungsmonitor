// Wiederkehrende Formular-Bausteine. `id` verbindet Label, Feld und Fehlertext.

export function Fehlertext({ id, text }) {
  if (!text) return null;
  return <div className="feld-fehler" id={`${id}-fehler`} role="alert">{text}</div>;
}

export function Feld({ id, label, zusatz, hinweis, fehler, children }) {
  return (
    <div className="feld">
      <label htmlFor={id}>{label} {zusatz && <span className="label-zusatz">{zusatz}</span>}</label>
      {children}
      {hinweis && <div className="feld-hinweis">{hinweis}</div>}
      <Fehlertext id={id} text={fehler} />
    </div>
  );
}

export function TextFeld({ id, label, zusatz, hinweis, fehler, wert, onChange, ...rest }) {
  return (
    <Feld id={id} label={label} zusatz={zusatz} hinweis={hinweis} fehler={fehler}>
      <input
        id={id}
        value={wert ?? ''}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(fehler)}
        aria-describedby={fehler ? `${id}-fehler` : undefined}
        {...rest}
      />
    </Feld>
  );
}

// Ganzzahl ≥ 0: nimmt Ziffern an und verwirft alles andere schon beim Tippen.
export function ZahlFeld(props) {
  const { onChange, ...rest } = props;
  return (
    <TextFeld
      {...rest}
      inputMode="numeric"
      autoComplete="off"
      onChange={(v) => onChange(v.replace(/\D/g, ''))}
    />
  );
}

export function AuswahlFeld({ id, label, fehler, wert, onChange, optionen }) {
  return (
    <Feld id={id} label={label} fehler={fehler}>
      <select id={id} value={wert ?? ''} onChange={(e) => onChange(e.target.value)} aria-invalid={Boolean(fehler)}>
        <option value="" disabled>Bitte wählen</option>
        {optionen.map((o) => <option key={o}>{o}</option>)}
      </select>
    </Feld>
  );
}

export function RadioKacheln({ name, label, fehler, wert, onChange, optionen }) {
  return (
    <fieldset className="feld">
      <legend>{label}</legend>
      <div className="chips">
        {optionen.map((o) => (
          <label className="chip" key={o.value}>
            <input type="radio" name={name} checked={wert === o.value} onChange={() => onChange(o.value)} />
            {o.label}
          </label>
        ))}
      </div>
      <Fehlertext id={name} text={fehler} />
    </fieldset>
  );
}

export function CheckboxZeilen({ name, label, zusatz, fehler, werte, onChange, optionen }) {
  const umschalten = (value) => onChange(
    werte.includes(value) ? werte.filter((v) => v !== value) : [...werte, value],
  );
  return (
    <fieldset className="feld">
      <legend>{label} {zusatz && <span className="label-zusatz">{zusatz}</span>}</legend>
      <div className="zeilen">
        {optionen.map((o) => (
          <label className="zeile" key={o.value}>
            <input type="checkbox" name={name} checked={werte.includes(o.value)} onChange={() => umschalten(o.value)} />
            <span>
              <span className="zeile-titel">{o.label}</span>
              <span className="zeile-text">{o.beschreibung}</span>
            </span>
          </label>
        ))}
      </div>
      <Fehlertext id={name} text={fehler} />
    </fieldset>
  );
}
