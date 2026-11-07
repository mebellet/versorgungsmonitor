import Markdown from '../components/Markdown.jsx';
import Uebersicht from '../components/layout/Uebersicht.jsx';
import Seitenkopf from '../components/Seitenkopf.jsx';
import { inhalt, rechtlicheAbschnitte } from '../lib/content.js';

export default function RechtlichesPage() {
  return (
    <>
      <Uebersicht />
      <Seitenkopf seite={inhalt('rechtliches/intro')} />
      {rechtlicheAbschnitte.map(({ attributes: a, body }) => (
        <section className="recht-karte" key={a.label}>
          <span className="recht-label">{a.label}</span>
          <h3>{a.titel}</h3>
          <Markdown>{body}</Markdown>
        </section>
      ))}
    </>
  );
}
