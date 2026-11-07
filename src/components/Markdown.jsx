import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';

// Interne Links aus Markdown (z. B. /rechtliches) laufen über den Router.
function MdLink({ href, children }) {
  return href?.startsWith('/') ? <Link to={href}>{children}</Link> : <a href={href}>{children}</a>;
}

export default function Markdown({ children }) {
  return <ReactMarkdown components={{ a: MdLink }}>{children}</ReactMarkdown>;
}
