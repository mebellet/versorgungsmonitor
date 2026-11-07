import { Link } from 'react-router-dom';
import optionen from '../../../data/stammdaten/formular-optionen.json';
import { FRUEHESTES_DATUM, POLITISCH_GRUENDE, heuteIso } from '../../../shared/validierung.js';
import LandkreisInput from '../LandkreisInput.jsx';
import { AuswahlFeld, CheckboxZeilen, Feld, RadioKacheln, TextFeld, ZahlFeld } from './felder.jsx';

export function Schritt1({ f, setze, fehler }) {
  return (
    <>
      <div className="feld-reihe">
        <Feld id="regionId" label="Landkreis / kreisfreie Stadt" fehler={fehler.regionId}>
          <LandkreisInput
            id="regionId"
            wert={f.regionId}
            placeholder="Landkreis auswählen oder tippen…"
            onAuswahl={(id) => setze('regionId', id)}
          />
        </Feld>
        <TextFeld
          id="datum"
          type="date"
          label="Datum der Veränderung"
          min={FRUEHESTES_DATUM}
          max={heuteIso()}
          wert={f.datum}
          onChange={(v) => setze('datum', v)}
          fehler={fehler.datum}
        />
      </div>
      <CheckboxZeilen
        name="gruende"
        label="Gründe der Veränderung"
        zusatz="(Mehrfachauswahl möglich)"
        optionen={optionen.gruende}
        werte={f.gruende}
        onChange={(v) => setze('gruende', v)}
        fehler={fehler.gruende}
      />
    </>
  );
}

function PatientenBlock({ titel, zusatz, zeitpunkt, f, setze, fehler, gkvBeispiel }) {
  const felder = [
    { key: `gkv${zeitpunkt}`, label: 'GKV-Patient:innen', platzhalter: gkvBeispiel },
    { key: `privat${zeitpunkt}`, label: 'Privatpatient:innen', platzhalter: 'optional' },
    { key: `selbst${zeitpunkt}`, label: 'Selbstzahler', platzhalter: 'optional' },
  ];
  return (
    <fieldset className="feld">
      <legend>{titel} <span className="label-zusatz">{zusatz}</span></legend>
      <div className="feld-reihe-3">
        {felder.map((x) => (
          <ZahlFeld
            key={x.key}
            id={x.key}
            label={x.label}
            placeholder={x.platzhalter}
            wert={f[x.key]}
            onChange={(v) => setze(x.key, v)}
            fehler={fehler[x.key]}
          />
        ))}
      </div>
    </fieldset>
  );
}

export function Schritt2({ f, setze, fehler }) {
  const hat = (grund) => f.gruende.includes(grund);
  return (
    <>
      <RadioKacheln
        name="praxisform"
        label="Praxisform"
        optionen={optionen.praxisformen}
        wert={f.praxisform}
        onChange={(v) => setze('praxisform', v)}
        fehler={fehler.praxisform}
      />
      <RadioKacheln
        name="sitzAnteil"
        label="Umfang des betroffenen Kassensitzes"
        optionen={optionen.kassensitz}
        wert={f.sitzAnteil}
        onChange={(v) => setze('sitzAnteil', v)}
        fehler={fehler.sitzAnteil}
      />
      <PatientenBlock
        titel="Behandelte Patient:innen – vor der gemeldeten Veränderung"
        zusatz="(Referenzwert)"
        zeitpunkt="Vorher"
        gkvBeispiel="z. B. 40"
        f={f}
        setze={setze}
        fehler={fehler}
      />
      <PatientenBlock
        titel="Behandelte Patient:innen – jetzt"
        zusatz="(aktueller Stand)"
        zeitpunkt="Jetzt"
        gkvBeispiel="z. B. 30"
        f={f}
        setze={setze}
        fehler={fehler}
      />

      {hat('schliessung') && (
        <>
          <div className="abschnitt">Praxisaufgabe / Schließung</div>
          <div className="feld-reihe">
            <TextFeld
              id="schliessDatum"
              type="date"
              label="Schließungsdatum"
              min={FRUEHESTES_DATUM}
              wert={f.schliessDatum}
              onChange={(v) => setze('schliessDatum', v)}
              fehler={fehler.schliessDatum}
            />
            <label className="chip chip-unten">
              <input type="checkbox" checked={f.nachbesetzung} onChange={(e) => setze('nachbesetzung', e.target.checked)} />
              Nachbesetzung geplant
            </label>
          </div>
        </>
      )}

      {hat('wartezeit') && (
        <>
          <div className="abschnitt">Wartezeitveränderung</div>
          <div className="feld-reihe">
            <ZahlFeld id="wzVorher" label="Wartezeit vorher (Wochen)" placeholder="z. B. 5" wert={f.wzVorher} onChange={(v) => setze('wzVorher', v)} fehler={fehler.wzVorher} />
            <ZahlFeld id="wzNachher" label="Wartezeit nachher (Wochen)" placeholder="z. B. 9" wert={f.wzNachher} onChange={(v) => setze('wzNachher', v)} fehler={fehler.wzNachher} />
          </div>
        </>
      )}

      {f.gruende.some((g) => POLITISCH_GRUENDE.includes(g)) && (
        <>
          <div className="abschnitt">Politische / strukturelle Einordnung</div>
          <Feld id="politischText" label="Kurze Einordnung" zusatz="(optional)" fehler={fehler.politischText}>
            <textarea
              id="politischText"
              placeholder="z. B. konkrete Budgetgrenze, Regresssumme, betroffene Richtlinie"
              value={f.politischText}
              onChange={(e) => setze('politischText', e.target.value)}
            />
          </Feld>
        </>
      )}

      {hat('sonstige') && (
        <>
          <div className="abschnitt">Sonstiger Grund</div>
          <TextFeld
            id="sonstigeText"
            type="text"
            label="Bitte kurz beschreiben"
            placeholder="z. B. Reduktion GKV-Plätze aufgrund Verlagerung auf andere Erwerbsquellen (Coaching usw.)"
            wert={f.sonstigeText}
            onChange={(v) => setze('sonstigeText', v)}
            fehler={fehler.sonstigeText}
          />
        </>
      )}
    </>
  );
}

export function Schritt3({ f, setze, fehler }) {
  return (
    <CheckboxZeilen
      name="betroffeneGruppen"
      label="Betroffene Gruppen"
      optionen={optionen.betroffeneGruppen}
      werte={f.betroffeneGruppen}
      onChange={(v) => setze('betroffeneGruppen', v)}
      fehler={fehler.betroffeneGruppen}
    />
  );
}

export function Schritt4({ i, setzeIdent, fehler }) {
  return (
    <>
      <AuswahlFeld id="berufsstatus" label="Berufsstatus" optionen={optionen.berufsstatus} wert={i.berufsstatus} onChange={(v) => setzeIdent('berufsstatus', v)} fehler={fehler.berufsstatus} />
      <TextFeld
        id="email"
        type="email"
        label="Berufliche E-Mail-Adresse"
        placeholder="name@praxis.de"
        hinweis="Zur Verifikation senden wir einen Bestätigungslink an diese Adresse."
        wert={i.email}
        onChange={(v) => setzeIdent('email', v)}
        fehler={fehler.email}
      />
      <div className="feld-reihe">
        <TextFeld id="name" type="text" label="Name" placeholder="Vor- und Nachname" wert={i.name} onChange={(v) => setzeIdent('name', v)} fehler={fehler.name} />
        <TextFeld
          id="lanr"
          type="text"
          inputMode="numeric"
          maxLength={9}
          label="LANR"
          placeholder="z. B. 123456789"
          hinweis="Lebenslange Arztnummer, 9 Ziffern."
          wert={i.lanr}
          onChange={(v) => setzeIdent('lanr', v.replace(/\D/g, ''))}
          fehler={fehler.lanr}
        />
      </div>
      <div className="feld-hinweis feld-hinweis-block">Name oder LANR genügt – beide Angaben dienen ausschließlich der Verifikation und werden nicht veröffentlicht.</div>
      <div className="feld-reihe">
        <AuswahlFeld id="bundesland" label="Bundesland, in dem Sie tätig sind" optionen={optionen.bundeslaender} wert={i.bundesland} onChange={(v) => setzeIdent('bundesland', v)} fehler={fehler.bundesland} />
        <AuswahlFeld id="kvStatus" label="KV-Zulassungsstatus" optionen={optionen.kvStatus} wert={i.kvStatus} onChange={(v) => setzeIdent('kvStatus', v)} fehler={fehler.kvStatus} />
      </div>
    </>
  );
}

const PRUEFUNGEN = [
  { titel: 'Berufliche E-Mail-Adresse', text: 'Bestätigungslink wird versendet' },
  { titel: 'SMS-Verifikation (2. Faktor)', text: 'Zusätzlicher Sicherheitscode per SMS' },
];
const SYMBOL = { wartend: null, pruefung: '…', fertig: '✓' };

export function Schritt5({ pruefStatus, sendefehler }) {
  return (
    <>
      {PRUEFUNGEN.map((p, index) => (
        <div className="pruef-zeile" key={p.titel}>
          <div className={`pruef-symbol ${pruefStatus[index]}`}>{SYMBOL[pruefStatus[index]] ?? index + 1}</div>
          <div className="pruef-text"><b>{p.titel}</b><span>{p.text}</span></div>
        </div>
      ))}
      {sendefehler && <p className="fehler" role="alert">{sendefehler}</p>}
    </>
  );
}

export function Schritt6({ regionId, titel, text, linkText, hinweis }) {
  return (
    <div className="erfolg">
      <div className="erfolg-symbol" aria-hidden="true">✓</div>
      <h2>{titel}</h2>
      <p>{text}</p>
      {hinweis && <p className="hinweis">{hinweis}</p>}
      <p><Link to={`/?landkreis=${regionId}`}>{linkText}</Link></p>
    </div>
  );
}
