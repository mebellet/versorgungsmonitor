import { NavLink } from 'react-router-dom';
import { inhalt } from '../../lib/content.js';

// Umschalter zwischen den drei Ansichten, direkt über dem jeweiligen Inhalt.
export default function Navigation() {
  const { attributes: a } = inhalt('allgemein');
  return (
    <nav className="reiter" aria-label={a.navLabel}>
      <NavLink to="/" end>{a.navKarte}</NavLink>
      <NavLink to="/melden">{a.navMelden}</NavLink>
      <NavLink to="/rechtliches">{a.navRechtliches}</NavLink>
    </nav>
  );
}
