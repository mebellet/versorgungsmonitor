import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { aggregiere } from './aggregation.js';

const demo = JSON.parse(readFileSync(new URL('../data/demo/meldungen.demo.json', import.meta.url)));
const JETZT = Date.parse('2026-07-03T12:00:00Z');

const meldung = (felder) => ({
  regionId: '1', praxisKey: 'a', eingegangenAm: '2026-04-01T10:00:00Z', gruende: ['kapazitaet'],
  gkvVorher: 100, privatVorher: null, selbstVorher: null,
  gkvJetzt: 90, privatJetzt: null, selbstJetzt: null,
  wzNachher: null, nachbesetzung: null, sonstigeText: null, politischText: null,
  ...felder,
});

test('Demodaten: bundesweite Kennzahlen entsprechen dem HTML-Prototyp', () => {
  const b = aggregiere(demo, JETZT).bundesweit;
  assert.equal(b.gkvDelta, -750);
  assert.equal(b.wartezeit, 10.4);
  assert.equal(b.meldungen, 16);
  assert.equal(b.praxenDieseWoche, 1);
});

test('Mehrfachmeldung: vorher aus erster, jetzt aus neuester Meldung', () => {
  const r = aggregiere([
    meldung({ gkvVorher: 100, gkvJetzt: 90 }),
    meldung({ eingegangenAm: '2026-06-01T10:00:00Z', gkvVorher: null, gkvJetzt: 70 }),
  ], JETZT).regionen['1'];
  assert.equal(r.praxen, 1);
  assert.equal(r.meldungen, 2);
  assert.equal(r.gkvDelta, -30);
  assert.deepEqual(r.trend.map((t) => t.verlust), [10, 10, 30]);
});

test('Schließung bleibt sichtbar, wenn die Praxis später anderes meldet', () => {
  const r = aggregiere([
    meldung({ gruende: ['schliessung'], nachbesetzung: true }),
    meldung({ eingegangenAm: '2026-06-01T10:00:00Z', gruende: ['budget'] }),
  ], JETZT).regionen['1'];
  assert.equal(r.schliessungen, 1);
  assert.equal(r.nachbesetzung, 1);
});

test('Fehlender Jetzt-Wert zählt nicht als vollständiger Verlust', () => {
  const r = aggregiere([meldung({ privatVorher: 20, privatJetzt: null })], JETZT).regionen['1'];
  assert.equal(r.privatDelta, 0);
});
