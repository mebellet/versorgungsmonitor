import Markdown from '../Markdown.jsx';

export default function MapLegend({ texte }) {
  return (
    <div className="legende">
      <span><i className="legende-punkt gemeldet" />{texte.legendeGemeldet}</span>
      <span><i className="legende-punkt" />{texte.legendeLeer}</span>
      <span><i className="legende-punkt auswahl" />{texte.legendeAuswahl}</span>
      <span className="legende-hinweis">{texte.legendeHinweis}</span>
      <span className="legende-quelle"><Markdown>{texte.legendeQuelle}</Markdown></span>
    </div>
  );
}
