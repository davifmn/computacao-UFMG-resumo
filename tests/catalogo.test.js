import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { PERIODOS } from '../catalogo.js';

const pages = PERIODOS.flatMap(p => (p.disciplinas ?? []).flatMap(d => d.visualizacoes.map(v => ({
  d, v, file: `${d.pasta}/${v.tipo === 'tutorial' ? 'tutoriais' : 'visualizacoes'}/${v.arquivo}`,
}))));

test('toda página do catálogo existe', () => {
  for (const { file } of pages) assert.ok(existsSync(file), `falta ${file}`);
});

test('toda disciplina publicada tem README', () => {
  for (const p of PERIODOS) for (const d of p.disciplinas ?? []) assert.ok(existsSync(`${d.pasta}/README.md`), `falta ${d.pasta}/README.md`);
});

test('toda página tem título, volta para a home e usa o tema', () => {
  for (const { file } of pages) {
    const html = readFileSync(file, 'utf8');
    assert.match(html, /<title>[^<]+<\/title>/, file);
    assert.ok(html.includes('../../../index.html'), `${file}: sem link para a home`);
    assert.ok(html.includes('../../../engine/theme.css'), `${file}: sem theme.css`);
  }
});

test('ids de disciplina são únicos (são as âncoras da home)', () => {
  const ids = PERIODOS.flatMap(p => (p.disciplinas ?? []).map(d => d.id));
  assert.equal(new Set(ids).size, ids.length);
});
