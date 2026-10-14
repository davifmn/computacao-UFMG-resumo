// Um Git de brinquedo: commits formam um grafo acíclico dirigido, ramos são
// só ponteiros para commits e HEAD aponta para o ramo atual. Suporta commit,
// branch, checkout/switch, merge (avanço rápido ou de três vias), rebase,
// reset e revert, interpretando a linha de comando.

export function initRepo() {
  return { commits: { c0: { id: 'c0', parents: [], msg: 'commit inicial', order: 0, branch: 'main' } }, branches: { main: 'c0' }, head: { branch: 'main', detached: null }, next: 1, log: [] };
}

const clone = r => structuredClone(r);
export const headCommit = r => (r.head.branch ? r.branches[r.head.branch] : r.head.detached);

export function ancestors(r, id) {
  const seen = new Set(), st = [id];
  while (st.length) { const c = st.pop(); if (c == null || seen.has(c)) continue; seen.add(c); st.push(...r.commits[c].parents); }
  return seen;
}

/** Ancestral comum mais recente (base do merge). */
export function mergeBase(r, a, b) {
  const A = ancestors(r, a);
  const B = ancestors(r, b);
  const common = [...A].filter(x => B.has(x));
  // o mais "recente": aquele que não é ancestral de nenhum outro comum
  return common.find(c => !common.some(d => d !== c && ancestors(r, d).has(c))) ?? null;
}

function newCommit(r, parents, msg, extra = {}) {
  const id = `c${r.next++}`;
  r.commits[id] = { id, parents, msg, order: Object.keys(r.commits).length, branch: r.head.branch ?? r.commits[parents[0]]?.branch, ...extra };
  return id;
}

function moveHead(r, id) {
  if (r.head.branch) r.branches[r.head.branch] = id; else r.head.detached = id;
}

/** Executa um comando; devolve { repo, out, ok }. */
export function exec(repo, line) {
  const r = clone(repo);
  const args = line.trim().replace(/^git\s+/, '').match(/"[^"]*"|'[^']*'|\S+/g)?.map(a => a.replace(/^["']|["']$/g, '')) ?? [];
  const [cmd, ...rest] = args;
  const fail = out => ({ repo, out, ok: false });
  const done = out => { r.log.push(line.trim()); return { repo: r, out, ok: true }; };
  const resolve = ref => {
    if (ref == null) return null;
    if (r.branches[ref]) return r.branches[ref];
    if (ref === 'HEAD') return headCommit(r);
    const m = ref.match(/^(HEAD|[\w-]+)~(\d+)$/);
    if (m) { let c = m[1] === 'HEAD' ? headCommit(r) : r.branches[m[1]] ?? m[1]; for (let k = 0; k < +m[2]; k++) c = r.commits[c]?.parents[0]; return c ?? null; }
    return r.commits[ref] ? ref : null;
  };
  switch (cmd) {
    case 'commit': {
      const mi = rest.indexOf('-m');
      const msg = mi >= 0 ? rest[mi + 1] ?? '' : `mudança ${r.next}`;
      const id = newCommit(r, [headCommit(r)], msg);
      moveHead(r, id);
      return done(`[${r.head.branch ?? 'HEAD destacado'} ${id}] ${msg}`);
    }
    case 'branch': {
      if (!rest.length) return done(Object.keys(r.branches).map(b => (b === r.head.branch ? `* ${b}` : `  ${b}`)).join('\n'));
      if (rest[0] === '-d' || rest[0] === '-D') {
        const b = rest[1];
        if (!r.branches[b]) return fail(`error: o ramo '${b}' não existe`);
        if (b === r.head.branch) return fail(`error: não dá para apagar o ramo atual '${b}'`);
        const merged = Object.entries(r.branches).some(([k, c]) => k !== b && ancestors(r, c).has(r.branches[b]));
        if (!merged && rest[0] === '-d') return fail(`error: o ramo '${b}' não foi integrado. Use -D para apagar mesmo assim (os commits ficam inacessíveis).`);
        delete r.branches[b];
        return done(`Ramo ${b} apagado.`);
      }
      const b = rest[0];
      if (r.branches[b]) return fail(`fatal: o ramo '${b}' já existe`);
      r.branches[b] = resolve(rest[1]) ?? headCommit(r);
      return done(`Ramo ${b} criado apontando para ${r.branches[b]} (só um ponteiro novo; nada foi copiado).`);
    }
    case 'checkout': case 'switch': {
      if (rest[0] === '-b' || rest[0] === '-c') {
        const b = rest[1];
        if (!b) return fail('falta o nome do ramo');
        if (r.branches[b]) return fail(`fatal: o ramo '${b}' já existe`);
        r.branches[b] = headCommit(r);
        r.head = { branch: b, detached: null };
        return done(`Ramo ${b} criado e agora é o atual.`);
      }
      const ref = rest[0];
      if (r.branches[ref]) { r.head = { branch: ref, detached: null }; return done(`Mudou para o ramo '${ref}'.`); }
      const c = resolve(ref);
      if (c && cmd === 'checkout') { r.head = { branch: null, detached: c }; return done(`HEAD destacado em ${c}: commits feitos aqui não pertencem a nenhum ramo.`); }
      return fail(`error: '${ref}' não é um ramo${cmd === 'switch' ? '' : ' nem um commit'}`);
    }
    case 'merge': {
      const other = resolve(rest[0]);
      if (!other) return fail(`merge: '${rest[0]}' não existe`);
      const cur = headCommit(r);
      if (ancestors(r, cur).has(other)) return fail('Já está atualizado.');
      if (ancestors(r, other).has(cur) && !rest.includes('--no-ff')) {
        moveHead(r, other);
        return done(`Avanço rápido (fast-forward): ${cur} já é ancestral de ${other}, então o ramo só anda para frente. Nenhum commit novo.`);
      }
      const base = mergeBase(r, cur, other);
      const id = newCommit(r, [cur, other], `Merge ${rest[0]} em ${r.head.branch ?? 'HEAD'}`, { merge: true, base });
      moveHead(r, id);
      return done(`Merge de três vias: base ${base}, pontas ${cur} e ${other}. Novo commit ${id} com dois pais.`);
    }
    case 'rebase': {
      const onto = resolve(rest[0]);
      if (!onto) return fail(`rebase: '${rest[0]}' não existe`);
      if (!r.head.branch) return fail('rebase precisa de um ramo atual');
      const cur = headCommit(r);
      const base = mergeBase(r, cur, onto);
      if (base === cur) { moveHead(r, onto); return done(`O ramo atual estava atrás de ${rest[0]}: avanço rápido.`); }
      if (base === onto) return fail('O ramo já está em cima de ' + rest[0] + '.');
      // commits exclusivos do ramo atual, do mais antigo ao mais novo (só primeira linha de pais)
      const mine = [];
      for (let c = cur; c && c !== base && !ancestors(r, onto).has(c); c = r.commits[c].parents[0]) mine.unshift(c);
      let tip = onto;
      const map = [];
      for (const c of mine) {
        const old = r.commits[c];
        tip = newCommit(r, [tip], old.msg, { rebasedFrom: c });
        map.push(`${c} → ${tip}`);
      }
      moveHead(r, tip);
      return done(`Rebase: ${mine.length} commit(s) reaplicado(s) em cima de ${rest[0]} (${map.join(', ')}). Os originais continuam existindo, mas nenhum ramo aponta para eles: o histórico ficou linear, e os commits são NOVOS (outros ids).`);
    }
    case 'reset': {
      const target = resolve(rest.find(a => !a.startsWith('--')));
      if (!target) return fail('reset: referência inválida');
      moveHead(r, target);
      return done(`O ramo atual agora aponta para ${target}${rest.includes('--hard') ? ' (e o diretório de trabalho foi descartado)' : ''}. Commits posteriores ficam órfãos: o histórico foi reescrito.`);
    }
    case 'revert': {
      const c = resolve(rest[0]);
      if (!c) return fail('revert: commit inválido');
      const id = newCommit(r, [headCommit(r)], `Revert "${r.commits[c].msg}"`, { revertOf: c });
      moveHead(r, id);
      return done(`Novo commit ${id} que desfaz as mudanças de ${c}. Nada foi apagado: seguro para ramos compartilhados.`);
    }
    case 'log': {
      const out = [];
      const seen = new Set();
      const q = [headCommit(r)];
      while (q.length) {
        q.sort((a, b) => r.commits[b].order - r.commits[a].order);
        const c = q.shift();
        if (seen.has(c)) continue;
        seen.add(c);
        out.push(`${c}  ${r.commits[c].msg}`);
        q.push(...r.commits[c].parents);
      }
      return done(out.join('\n'));
    }
    default:
      return fail(`comando não suportado: '${cmd ?? ''}'. Use commit, branch, checkout/switch, merge, rebase, reset, revert ou log.`);
  }
}

export function run(lines, repo = initRepo()) {
  const outs = [];
  for (const l of lines) { const res = exec(repo, l); repo = res.repo; outs.push(res); }
  return { repo, outs };
}

/** Commits alcançáveis a partir de algum ramo ou do HEAD. */
export function reachable(r) {
  const s = new Set();
  for (const c of [...Object.values(r.branches), r.head.detached].filter(Boolean)) for (const a of ancestors(r, c)) s.add(a);
  return s;
}

export const SCENARIOS = {
  feature: { nome: 'Ramo de funcionalidade + merge', cmds: ['git commit -m "base"', 'git switch -c login', 'git commit -m "tela de login"', 'git commit -m "valida senha"', 'git switch main', 'git commit -m "corrige README"', 'git merge login'] },
  ff: { nome: 'Avanço rápido (fast-forward)', cmds: ['git switch -c hotfix', 'git commit -m "corrige bug"', 'git switch main', 'git merge hotfix'] },
  rebase: { nome: 'Rebase em vez de merge', cmds: ['git commit -m "base"', 'git switch -c login', 'git commit -m "tela de login"', 'git commit -m "valida senha"', 'git switch main', 'git commit -m "corrige README"', 'git switch login', 'git rebase main'] },
  revert: { nome: 'Desfazer com revert (seguro)', cmds: ['git commit -m "A"', 'git commit -m "B (com bug)"', 'git commit -m "C"', 'git revert c2'] },
  reset: { nome: 'Desfazer com reset (reescreve a história)', cmds: ['git commit -m "A"', 'git commit -m "B (com bug)"', 'git commit -m "C"', 'git reset --hard HEAD~2'] },
};
