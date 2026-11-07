// Erzeugt aus den amtlichen Verwaltungsgebieten des BKG (VG2500, Ebene Kreise)
// die zwei Dateien, die die App tatsächlich nutzt:
//   data/stammdaten/regionen.json  – Werteliste aller Kreise (Suche, Formular, Validierung)
//   public/geo/kreise.geo.json     – schlanke Kartenformen in WGS84, nur mit `id` (AGS)
//
// Quelle: https://gdz.bkg.bund.de/index.php/default/verwaltungsgebiete-1-2-500-000-stand-31-12-vg2500-12-31.html
// Die ZIP (Shapefile, UTM32) wird unverändert nach data/quellen/ gelegt, ausgepackt
// oder nicht. Das Skript braucht keine zusätzlichen Pakete: ZIP, Shapefile, DBF und
// die Umrechnung UTM32 → Längen/Breitengrad sind unten von Hand umgesetzt.
//
// Aufruf: npm run daten:regionen
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { inflateRawSync } from 'node:zlib';

const QUELLORDNER = 'data/quellen';
const EBENE = /VG2500_KRS\.(shp|dbf|prj|cpg)$/i;

// Vereinfachung der Grenzlinien in Kilometern. VG2500 ist schon für den Maßstab
// 1 : 2 500 000 generalisiert; 0 schaltet die zusätzliche Vereinfachung ab.
const TOLERANZ_KM = 0.25;
const NACHKOMMASTELLEN = 4; // ≈ 10 m, mehr sieht man auch bei 8-fachem Zoom nicht

const BUNDESLAENDER = {
  '01': 'Schleswig-Holstein', '02': 'Hamburg', '03': 'Niedersachsen', '04': 'Bremen',
  '05': 'Nordrhein-Westfalen', '06': 'Hessen', '07': 'Rheinland-Pfalz', '08': 'Baden-Württemberg',
  '09': 'Bayern', '10': 'Saarland', '11': 'Berlin', '12': 'Brandenburg',
  '13': 'Mecklenburg-Vorpommern', '14': 'Sachsen', '15': 'Sachsen-Anhalt', '16': 'Thüringen',
};
const KREISFREI = new Set(['Kreisfreie Stadt', 'Stadtkreis']);

// ---------------------------------------------------------------- Quelle finden

function sucheDateien(ordner) {
  const treffer = { zip: [], lose: {} };
  for (const name of readdirSync(ordner)) {
    const pfad = join(ordner, name);
    if (statSync(pfad).isDirectory()) {
      const unter = sucheDateien(pfad);
      treffer.zip.push(...unter.zip);
      Object.assign(treffer.lose, unter.lose);
    } else if (/^vg2500.*\.zip$/i.test(name)) {
      treffer.zip.push(pfad);
    } else if (EBENE.test(name)) {
      treffer.lose[name.match(EBENE)[1].toLowerCase()] = pfad;
    }
  }
  return treffer;
}

// Minimaler ZIP-Leser: Zentralverzeichnis lesen, gesuchte Einträge entpacken.
function ausZip(pfad) {
  const buf = readFileSync(pfad);
  let ende = buf.length - 22;
  while (ende >= 0 && buf.readUInt32LE(ende) !== 0x06054b50) ende--;
  if (ende < 0) throw new Error(`${pfad} ist keine gültige ZIP-Datei.`);
  const anzahl = buf.readUInt16LE(ende + 10);
  let pos = buf.readUInt32LE(ende + 16);
  const dateien = {};
  for (let i = 0; i < anzahl; i++) {
    const methode = buf.readUInt16LE(pos + 10);
    const groesse = buf.readUInt32LE(pos + 20);
    const nameLaenge = buf.readUInt16LE(pos + 28);
    const extraLaenge = buf.readUInt16LE(pos + 30);
    const kommentarLaenge = buf.readUInt16LE(pos + 32);
    const lokal = buf.readUInt32LE(pos + 42);
    const name = buf.toString('utf8', pos + 46, pos + 46 + nameLaenge);
    pos += 46 + nameLaenge + extraLaenge + kommentarLaenge;
    const m = basename(name).match(EBENE);
    if (!m) continue;
    const start = lokal + 30 + buf.readUInt16LE(lokal + 26) + buf.readUInt16LE(lokal + 28);
    const roh = buf.subarray(start, start + groesse);
    dateien[m[1].toLowerCase()] = methode === 0 ? roh : inflateRawSync(roh);
  }
  return dateien;
}

function ladeQuelle() {
  const { zip, lose } = sucheDateien(QUELLORDNER);
  if (lose.shp && lose.dbf) {
    const dateien = {};
    for (const [endung, pfad] of Object.entries(lose)) dateien[endung] = readFileSync(pfad);
    return { dateien, herkunft: lose.shp };
  }
  // Mehrere ZIPs: die neueste Sonderaufbereitung zuerst (Name sortiert absteigend).
  zip.sort().reverse();
  for (const pfad of zip) {
    const dateien = ausZip(pfad);
    if (dateien.shp && dateien.dbf) return { dateien, herkunft: pfad };
  }
  throw new Error(`Keine VG2500-Kreisebene (VG2500_KRS.shp) in ${QUELLORDNER}/ gefunden.`);
}

// ---------------------------------------------------------------- DBF und SHP

function leseDbf(buf, kodierung) {
  const anzahl = buf.readUInt32LE(4);
  const kopfLaenge = buf.readUInt16LE(8);
  const satzLaenge = buf.readUInt16LE(10);
  const dekoder = new TextDecoder(kodierung);
  const felder = [];
  for (let p = 32, versatz = 1; buf[p] !== 0x0d; p += 32) {
    const name = buf.toString('latin1', p, p + 11).replace(/\0.*$/, '');
    const laenge = buf[p + 16];
    felder.push({ name, versatz, laenge });
    versatz += laenge;
  }
  const saetze = [];
  for (let i = 0; i < anzahl; i++) {
    const start = kopfLaenge + i * satzLaenge;
    const satz = {};
    for (const f of felder) {
      satz[f.name] = dekoder.decode(buf.subarray(start + f.versatz, start + f.versatz + f.laenge)).trim();
    }
    saetze.push(satz);
  }
  return saetze;
}

function leseShp(buf) {
  const formen = [];
  for (let pos = 100; pos < buf.length;) {
    const laenge = buf.readInt32BE(pos + 4) * 2;
    const c = pos + 8;
    const typ = buf.readInt32LE(c);
    const ringe = [];
    if (typ === 5 || typ === 15 || typ === 25) {
      const teile = buf.readInt32LE(c + 36);
      const punkte = buf.readInt32LE(c + 40);
      const anfang = [];
      for (let i = 0; i < teile; i++) anfang.push(buf.readInt32LE(c + 44 + i * 4));
      anfang.push(punkte);
      const p0 = c + 44 + teile * 4;
      for (let i = 0; i < teile; i++) {
        const ring = [];
        for (let k = anfang[i]; k < anfang[i + 1]; k++) {
          ring.push([buf.readDoubleLE(p0 + k * 16), buf.readDoubleLE(p0 + k * 16 + 8)]);
        }
        ringe.push(ring);
      }
    } else if (typ !== 0) {
      throw new Error(`Unerwarteter Shape-Typ ${typ}, erwartet werden Flächen.`);
    }
    formen.push(ringe);
    pos = c + laenge;
  }
  return formen;
}

// ------------------------------------------- ETRS89 / UTM Zone 32N → Länge/Breite

// Inverse transversale Mercator-Projektion nach Snyder (1987), GRS80-Ellipsoid.
// Für Deutschland liegt die Abweichung deutlich unter einem Meter.
const A = 6378137;
const F = 1 / 298.257222101;
const E2 = F * (2 - F);
const EP2 = E2 / (1 - E2);
const K0 = 0.9996;
const E1 = (1 - Math.sqrt(1 - E2)) / (1 + Math.sqrt(1 - E2));
const MU_FAKTOR = A * (1 - E2 / 4 - (3 * E2 ** 2) / 64 - (5 * E2 ** 3) / 256);
const GRAD = 180 / Math.PI;

function utm32ZuLonLat([x, y]) {
  const mu = y / K0 / MU_FAKTOR;
  const phi1 = mu
    + ((3 * E1) / 2 - (27 * E1 ** 3) / 32) * Math.sin(2 * mu)
    + ((21 * E1 ** 2) / 16 - (55 * E1 ** 4) / 32) * Math.sin(4 * mu)
    + ((151 * E1 ** 3) / 96) * Math.sin(6 * mu)
    + ((1097 * E1 ** 4) / 512) * Math.sin(8 * mu);
  const sin1 = Math.sin(phi1);
  const cos1 = Math.cos(phi1);
  const tan1 = Math.tan(phi1);
  const C1 = EP2 * cos1 ** 2;
  const T1 = tan1 ** 2;
  const N1 = A / Math.sqrt(1 - E2 * sin1 ** 2);
  const R1 = (A * (1 - E2)) / (1 - E2 * sin1 ** 2) ** 1.5;
  const D = (x - 500000) / (N1 * K0);
  const phi = phi1 - ((N1 * tan1) / R1) * (
    D ** 2 / 2
    - ((5 + 3 * T1 + 10 * C1 - 4 * C1 ** 2 - 9 * EP2) * D ** 4) / 24
    + ((61 + 90 * T1 + 298 * C1 + 45 * T1 ** 2 - 252 * EP2 - 3 * C1 ** 2) * D ** 6) / 720);
  const lambda = (D
    - ((1 + 2 * T1 + C1) * D ** 3) / 6
    + ((5 - 2 * C1 + 28 * T1 - 3 * C1 ** 2 + 8 * EP2 + 24 * T1 ** 2) * D ** 5) / 120) / cos1;
  return [9 + lambda * GRAD, phi * GRAD];
}

// ---------------------------------------------------------------- Geometrie

const flaeche = (ring) => {
  let s = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) s += (ring[j][0] - ring[i][0]) * (ring[j][1] + ring[i][1]);
  return -s / 2; // > 0 im Uhrzeigersinn (x nach Osten, y nach Norden)
};

const enthaelt = (ring, [x, y]) => {
  let innen = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) innen = !innen;
  }
  return innen;
};

// Shapefile-Teile zu Polygonen ordnen: Außenringe laufen im Uhrzeigersinn,
// Löcher (z. B. kreisfreie Städte in einem Landkreis) gegen den Uhrzeigersinn.
// Das ist zugleich die Ringrichtung, die d3-geo erwartet.
function zuPolygonen(ringe) {
  const aussen = [];
  const loecher = [];
  for (const r of ringe) (flaeche(r) >= 0 ? aussen : loecher).push(r);
  const polygone = aussen.map((r) => [r]);
  for (const loch of loecher) {
    const ziel = aussen
      .map((r, i) => ({ i, a: Math.abs(flaeche(r)) }))
      .filter(({ i }) => enthaelt(aussen[i], loch[0]))
      .sort((x, y) => x.a - y.a)[0];
    if (ziel) polygone[ziel.i].push(loch);
    else polygone.push([loch.slice().reverse()]);
  }
  return polygone;
}

const runde = (wert) => +wert.toFixed(NACHKOMMASTELLEN);
const schluessel = (p) => `${p[0]},${p[1]}`;

function ohneDoppelte(ring) {
  const r = ring.filter((p, i) => i === 0 || schluessel(p) !== schluessel(ring[i - 1]));
  if (r.length > 1 && schluessel(r[0]) === schluessel(r[r.length - 1])) r.pop();
  return r; // offener Ring, ohne wiederholten Endpunkt
}

// Douglas-Peucker in lokal metrischen Koordinaten (km).
const KM_PRO_GRAD = 111.32;
function douglasPeucker(punkte, toleranz) {
  if (punkte.length < 3) return punkte;
  const cosB = Math.cos((punkte[0][1] * Math.PI) / 180);
  const xy = punkte.map(([lon, lat]) => [lon * KM_PRO_GRAD * cosB, lat * KM_PRO_GRAD]);
  const behalten = new Uint8Array(punkte.length);
  behalten[0] = behalten[punkte.length - 1] = 1;
  const stapel = [[0, punkte.length - 1]];
  while (stapel.length) {
    const [a, b] = stapel.pop();
    const [ax, ay] = xy[a];
    const [bx, by] = xy[b];
    const dx = bx - ax;
    const dy = by - ay;
    const l2 = dx * dx + dy * dy;
    let max = 0;
    let idx = -1;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = xy[i];
      let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
      t = Math.max(0, Math.min(1, t));
      const d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
      if (d > max) { max = d; idx = i; }
    }
    if (max > toleranz) {
      behalten[idx] = 1;
      stapel.push([a, idx], [idx, b]);
    }
  }
  return punkte.filter((_, i) => behalten[i]);
}

// Gemeinsame Grenzen müssen auf beiden Seiten gleich vereinfacht werden, sonst
// entstehen Lücken zwischen Nachbarkreisen. Deshalb werden die Ringe an
// Knotenpunkten (dort treffen drei oder mehr Linien zusammen) in Teilstücke
// zerlegt, jedes Teilstück einmal vereinfacht und auf beiden Seiten verwendet.
function vereinfacheAlle(features, toleranz) {
  const nachbarn = new Map();
  const alleRinge = features.flatMap((f) => f.polygone.flat());
  for (const ring of alleRinge) {
    ring.forEach((p, i) => {
      const k = schluessel(p);
      if (!nachbarn.has(k)) nachbarn.set(k, new Set());
      const s = nachbarn.get(k);
      s.add(schluessel(ring[(i - 1 + ring.length) % ring.length]));
      s.add(schluessel(ring[(i + 1) % ring.length]));
    });
  }
  const istKnoten = (p) => nachbarn.get(schluessel(p)).size > 2;
  const cache = new Map();

  const vereinfacheStueck = (stueck) => {
    const vor = stueck.map(schluessel).join(';');
    const rueck = stueck.slice().reverse().map(schluessel).join(';');
    const umgedreht = rueck < vor;
    const kanon = umgedreht ? rueck : vor;
    if (!cache.has(kanon)) cache.set(kanon, douglasPeucker(umgedreht ? stueck.slice().reverse() : stueck, toleranz));
    const ergebnis = cache.get(kanon);
    return umgedreht ? ergebnis.slice().reverse() : ergebnis;
  };

  const vereinfacheRing = (ring) => {
    let start = ring.findIndex(istKnoten);
    if (start < 0) {
      // Ring ohne Knoten (Insel, Enklave): beim kleinsten Punkt beginnen,
      // damit beide Seiten einer Enklavengrenze dasselbe Teilstück erhalten.
      start = ring.reduce((m, p, i) => (schluessel(p) < schluessel(ring[m]) ? i : m), 0);
    }
    const gedreht = [...ring.slice(start), ...ring.slice(0, start), ring[start]];
    const knoten = [0];
    for (let i = 1; i < gedreht.length - 1; i++) if (istKnoten(gedreht[i])) knoten.push(i);
    knoten.push(gedreht.length - 1);
    const ergebnis = [];
    for (let i = 0; i < knoten.length - 1; i++) {
      const teil = vereinfacheStueck(gedreht.slice(knoten[i], knoten[i + 1] + 1));
      ergebnis.push(...(i === 0 ? teil : teil.slice(1)));
    }
    ergebnis.pop(); // Endpunkt = Startpunkt, wird beim Schreiben wieder angehängt
    return ergebnis.length >= 3 ? ergebnis : ring;
  };

  for (const f of features) {
    f.polygone = f.polygone
      .map((poly) => poly.map(vereinfacheRing))
      .filter((poly) => poly[0].length >= 3);
  }
}

const schliesse = (ring) => [...ring, ring[0]];

// ---------------------------------------------------------------- Aufbereitung

const { dateien, herkunft } = ladeQuelle();
const prj = dateien.prj?.toString('latin1') ?? '';
if (!/UTM.*32|25832/i.test(prj)) {
  throw new Error('Erwartet wird die Georeferenzierung UTM32 (Datei „…utm32s.shape.zip“).');
}
const kodierung = /utf-?8/i.test(dateien.cpg?.toString('latin1') ?? '') ? 'utf-8' : 'latin1';
const saetze = leseDbf(dateien.dbf, kodierung);
const formen = leseShp(dateien.shp);

// Pro Kreis kann es mehrere Datensätze geben. Wasserflächen (GF 1 und 2, nur in
// VG250) bleiben weg; VG2500 führt ausschließlich Landflächen (GF 9).
const nachAgs = new Map();
saetze.forEach((s, i) => {
  if (['1', '2'].includes(s.GF)) return;
  const ags = s.AGS.slice(0, 5);
  if (!nachAgs.has(ags)) nachAgs.set(ags, { satz: s, polygone: [] });
  const polygone = zuPolygonen(formen[i].map((ring) => ohneDoppelte(
    ring.map((p) => utm32ZuLonLat(p).map(runde)),
  )).filter((r) => r.length >= 3));
  nachAgs.get(ags).polygone.push(...polygone);
});

const features = [...nachAgs.entries()].map(([id, { satz, polygone }]) => ({ id, satz, polygone }));
if (TOLERANZ_KM > 0) vereinfacheAlle(features, TOLERANZ_KM);

const regionen = features.map(({ id, satz }) => ({
  id,
  name: satz.GEN,
  bez: satz.BEZ,
  typ: KREISFREI.has(satz.BEZ) ? 'Kreisfreie Stadt' : 'Landkreis',
  bundesland: BUNDESLAENDER[id.slice(0, 2)],
}));

// Gleichnamige Einträge (Karlsruhe Stadt / Karlsruhe Landkreis) brauchen einen
// eindeutigen Anzeigenamen, weil Suche und Formular über den Text auswählen.
const haeufigkeit = {};
regionen.forEach((r) => { haeufigkeit[r.name] = (haeufigkeit[r.name] ?? 0) + 1; });
regionen.forEach((r) => {
  r.label = haeufigkeit[r.name] > 1 ? `${r.name} (${r.typ === 'Landkreis' ? 'Landkreis' : 'Stadt'})` : r.name;
});
regionen.sort((a, b) => a.label.localeCompare(b.label, 'de'));

const schlank = {
  type: 'FeatureCollection',
  features: features
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(({ id, polygone }) => {
      const coords = polygone.map((poly) => poly.map(schliesse));
      return {
        type: 'Feature',
        properties: { id },
        geometry: coords.length === 1
          ? { type: 'Polygon', coordinates: coords[0] }
          : { type: 'MultiPolygon', coordinates: coords },
      };
    }),
};

writeFileSync('data/stammdaten/regionen.json', JSON.stringify(regionen, null, 1) + '\n');
writeFileSync('public/geo/kreise.geo.json', JSON.stringify(schlank));
const punkte = schlank.features.reduce((s, f) => s + JSON.stringify(f.geometry.coordinates).split('],[').length, 0);
const typen = regionen.reduce((z, r) => ({ ...z, [r.typ]: (z[r.typ] ?? 0) + 1 }), {});
console.log(`Quelle: ${herkunft}`);
console.log(`${regionen.length} Regionen geschrieben (${Object.entries(typen).map(([t, n]) => `${n} ${t}`).join(', ')}), ~${punkte} Punkte.`);
