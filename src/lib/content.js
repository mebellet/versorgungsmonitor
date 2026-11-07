// Lädt alle Markdown-Dateien aus /content beim Build ein. Die Felder im Kopf
// der Datei (Frontmatter) landen in `attributes`, der Text in `body`.
import fm from 'front-matter';

const dateien = import.meta.glob('../../content/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const seiten = Object.fromEntries(
  Object.entries(dateien).map(([pfad, roh]) => [
    pfad.replace('../../content/', '').replace('.md', ''),
    fm(roh),
  ]),
);

export const inhalt = (name) => seiten[name];

export const rechtlicheAbschnitte = Object.keys(seiten)
  .filter((name) => /^rechtliches\/\d/.test(name))
  .sort()
  .map((name) => seiten[name]);
