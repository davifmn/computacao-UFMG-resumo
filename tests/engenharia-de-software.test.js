import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../periodo-06/engenharia-de-software/visualizacoes/git.js';
import * as T from '../periodo-06/engenharia-de-software/visualizacoes/testes.js';

test('git: commit, ramos e merges', () => {
  const { repo, outs } = G.run(G.SCENARIOS.feature.cmds);
  assert.ok(outs.every(o => o.ok));
  const m = repo.commits[repo.branches.main];
  assert.equal(m.parents.length, 2, 'merge de três vias tem dois pais');
  assert.equal(m.base, 'c1');
  const ff = G.run(G.SCENARIOS.ff.cmds).repo;
  assert.equal(ff.branches.main, ff.branches.hotfix, 'avanço rápido não cria commit');
  assert.equal(Object.keys(ff.commits).length, 2);
  assert.equal(G.run(['git merge main']).outs[0].ok, false, 'já atualizado');
});

test('git: rebase cria commits novos e deixa o histórico linear', () => {
  const { repo } = G.run(G.SCENARIOS.rebase.cmds);
  const tip = repo.commits[repo.branches.login];
  assert.ok(tip.rebasedFrom);
  const anc = G.ancestors(repo, repo.branches.login);
  assert.ok(anc.has(repo.branches.main), 'login agora está em cima da main');
  assert.ok(!G.reachable(repo).has('c3'), 'os commits antigos ficam órfãos');
  for (const c of anc) assert.ok(repo.commits[c].parents.length <= 1, 'sem merges');
});

test('git: reset × revert', () => {
  const rv = G.run(G.SCENARIOS.revert.cmds).repo;
  assert.equal(rv.commits[rv.branches.main].revertOf, 'c2');
  assert.equal(G.reachable(rv).size, 5, 'nada some');
  const rs = G.run(G.SCENARIOS.reset.cmds).repo;
  assert.equal(rs.branches.main, 'c1');
  assert.ok(!G.reachable(rs).has('c3'));
  const fix = G.run(['git commit -m a', 'git commit -m b', 'git commit -m c', 'git branch feature', 'git reset --hard HEAD~3', 'git switch feature']).repo;
  assert.deepEqual(fix.branches, { main: 'c0', feature: 'c3' });
  assert.equal(G.run(['git branch x', 'git switch x', 'git branch -d x']).outs[2].ok, false, 'não apaga o ramo atual');
  assert.equal(G.mergeBase(G.run(G.SCENARIOS.feature.cmds).repo, 'c3', 'c4'), 'c1');
});

test('triângulos: suítes, cobertura e mutação', () => {
  for (const s of Object.values(T.SUITES)) assert.ok(T.evaluate(s.tests).results.every(r => r.pass));
  const classes = T.evaluate(T.SUITES.classes.tests);
  assert.equal(classes.branchCov, 1);
  assert.ok(classes.score < 1, '100% de ramos e ainda há mutantes vivos');
  assert.equal(T.evaluate(T.SUITES.fronteira.tests).score, 1);
  assert.ok(T.MUTANTS.every(m => !T.isEquivalent(m.id)), 'nenhum mutante é equivalente');
  assert.equal(T.evaluate([{ a: 1, b: 1, c: 1, expected: 'escaleno' }]).results[0].pass, false);
  // o código mostrado tem as linhas citadas pelos mutantes
  for (const m of T.MUTANTS) assert.ok(T.CODE[m.line - 1].trim().split(' ')[0] === m.code.trim().split(' ')[0]);
});
