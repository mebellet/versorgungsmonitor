import Markdown from './Markdown.jsx';

// Überschrift (optional) und Einleitung einer Ansicht. Der Haupttitel
// „Versorgungsmonitor“ steht im Kopfbereich, daher hier h2.
export default function Seitenkopf({ seite }) {
  const { eyebrow, titel } = seite.attributes;
  return (
    <>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      {titel && <h2 className="seiten-titel">{titel}</h2>}
      <div className="untertitel"><Markdown>{seite.body}</Markdown></div>
    </>
  );
}
