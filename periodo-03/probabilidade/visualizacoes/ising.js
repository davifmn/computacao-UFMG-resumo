// Modelo de Ising 2D e o algoritmo de Metropolis (cadeia de Markov Monte Carlo).
// Rede L×L de spins ±1 com contorno periódico, J = 1, k_B = 1:
//   E = −Σ_{vizinhos <i,j>} s_i s_j        M = Σ s_i
// Funções puras, testadas em tests/ising.test.js. Base do projeto em
// periodo-03/probabilidade/projetos/modelo-de-ising/.

import { lineFinder } from '../../../engine/highlight.js';

/** Temperatura crítica exata de Onsager (1944) para a rede quadrada infinita. */
export const TC = 2 / Math.log(1 + Math.SQRT2); // ≈ 2,269

// Código Python do projeto (função metropolis_step do notebook), um spin por passo.
export const CODE = `def metropolis_step(lattice, beta):
    L = lattice.shape[0]
    for _ in range(L**2):                    # uma varredura = L² tentativas
        i = np.random.randint(0, L)          # sorteia um spin
        j = np.random.randint(0, L)
        S = lattice[i, j]
        vizinhos = (lattice[(i+1)%L, j] + lattice[i, (j+1)%L]
                  + lattice[(i-1)%L, j] + lattice[i, (j-1)%L])
        dE = 2 * S * vizinhos                # custo de virar o spin
        if dE < 0 or np.random.rand() < np.exp(-dE * beta):
            lattice[i, j] = -S               # aceita a virada`;

/** Rede como Int8Array linha a linha. modo: 'aleatorio' (T = ∞) ou 'cima' (T = 0). */
export function criarRede(L, r, modo = 'aleatorio') {
  const s = new Int8Array(L * L);
  for (let k = 0; k < s.length; k++) s[k] = modo === 'cima' ? 1 : r() < 0.5 ? 1 : -1;
  return s;
}

export const vizinhos = (s, L, i, j) =>
  s[((i + 1) % L) * L + j] + s[i * L + ((j + 1) % L)] + s[((i - 1 + L) % L) * L + j] + s[i * L + ((j - 1 + L) % L)];

/** Variação de energia ao virar o spin (i, j): ΔE = 2 s_ij Σ vizinhos ∈ {−8, −4, 0, 4, 8}. */
export const deltaE = (s, L, i, j) => 2 * s[i * L + j] * vizinhos(s, L, i, j) + 0; // + 0 evita o −0

export function energia(s, L) {
  let e = 0;
  for (let i = 0; i < L; i++) for (let j = 0; j < L; j++) {
    const v = s[i * L + j];
    e -= v * (s[((i + 1) % L) * L + j] + s[i * L + ((j + 1) % L)]); // cada par contado uma vez
  }
  return e;
}

export const magnetizacao = s => s.reduce((a, b) => a + b, 0);

/** Uma varredura de Metropolis (L² tentativas). Altera `s`; devolve quantas viradas foram aceitas. */
export function varredura(s, L, T, r) {
  const beta = 1 / T;
  const aceita = [Math.exp(-4 * beta), Math.exp(-8 * beta)]; // só ΔE = 4 e 8 precisam de sorteio
  let n = 0;
  for (let t = 0; t < L * L; t++) {
    const i = Math.floor(r() * L), j = Math.floor(r() * L);
    const dE = deltaE(s, L, i, j);
    if (dE <= 0 || r() < aceita[dE / 4 - 1]) { s[i * L + j] = -s[i * L + j]; n++; }
  }
  return n;
}

/**
 * Médias termodinâmicas por spin (N = L²), com as fórmulas de flutuação:
 *   c = (⟨E²⟩ − ⟨E⟩²) / (N T²)        χ = (⟨M²⟩ − ⟨|M|⟩²) / (N T)
 */
export function medir(L, T, { termalizacao = 200, medidas = 400, r, s = null } = {}) {
  s = s ?? criarRede(L, r, T < TC ? 'cima' : 'aleatorio');
  for (let k = 0; k < termalizacao; k++) varredura(s, L, T, r);
  let e1 = 0, e2 = 0, m1 = 0, m2 = 0;
  for (let k = 0; k < medidas; k++) {
    varredura(s, L, T, r);
    const e = energia(s, L), m = Math.abs(magnetizacao(s));
    e1 += e; e2 += e * e; m1 += m; m2 += m * m;
  }
  const N = L * L;
  e1 /= medidas; e2 /= medidas; m1 /= medidas; m2 /= medidas;
  return { T, e: e1 / N, m: m1 / N, c: (e2 - e1 * e1) / (N * T * T), chi: (m2 - m1 * m1) / (N * T), s };
}

/** Magnetização espontânea exata (Onsager–Yang) no limite L → ∞. */
export const mExata = T => (T >= TC ? 0 : Math.pow(1 - Math.pow(Math.sinh(2 / T), -4), 1 / 8));

/**
 * Passos para o player: tentativas de Metropolis individuais numa rede pequena.
 * Cada passo traz o spin sorteado, os vizinhos, ΔE, o número aleatório u e a decisão.
 */
export function passosMetropolis(L, T, n, r, s0 = null) {
  const Lf = lineFinder(CODE);
  const s = s0 ? Int8Array.from(s0) : criarRede(L, r);
  const beta = 1 / T;
  const passos = [];
  const snap = (line, msg, extra = {}) => passos.push({
    line, msg, rede: Int8Array.from(s), E: energia(s, L), M: magnetizacao(s), ...extra,
    vars: { T: T.toFixed(2), E: energia(s, L), M: magnetizacao(s), ...(extra.vars ?? {}) },
  });
  snap(Lf('L = lattice.shape[0]'), `Rede ${L}×${L} com spins ±1 sorteados. Energia E = ${energia(s, L)}, magnetização M = ${magnetizacao(s)}. Cada tentativa sorteia um spin e decide se ele vira.`);
  for (let k = 0; k < n; k++) {
    const i = Math.floor(r() * L), j = Math.floor(r() * L);
    const S = s[i * L + j], viz = vizinhos(s, L, i, j), dE = 2 * S * viz;
    snap(Lf('dE = 2 * S * vizinhos'), `Sorteado o spin (${i}, ${j}) = ${S > 0 ? '+1' : '−1'}. Soma dos 4 vizinhos = ${viz}. Virá-lo muda a energia em ΔE = 2·(${S})·(${viz}) = <b>${dE}</b>${dE < 0 ? ': fica mais alinhado com os vizinhos.' : dE === 0 ? ': tanto faz para a energia.' : ': fica menos alinhado.'}`,
      { alvo: [i, j], viz: true, vars: { i, j, S, vizinhos: viz, dE } });
    if (dE <= 0) {
      s[i * L + j] = -S;
      snap(Lf('lattice[i, j] = -S'), `ΔE ≤ 0: a energia não sobe, então a virada é <b>sempre aceita</b>.`, { alvo: [i, j], aceito: true, vars: { i, j, dE } });
    } else {
      const u = r(), p = Math.exp(-dE * beta);
      const ok = u < p;
      if (ok) s[i * L + j] = -S;
      snap(Lf(ok ? 'lattice[i, j] = -S' : 'if dE < 0 or'), `ΔE > 0: aceita com probabilidade e<sup>−ΔE/T</sup> = e<sup>−${dE}/${T.toFixed(2)}</sup> = ${p.toFixed(3)}. Sorteado u = ${u.toFixed(3)} ${ok ? '&lt;' : '≥'} ${p.toFixed(3)}: ${ok ? '<b>aceita</b>. É isso que deixa o sistema subir de energia e escapar de mínimos locais.' : '<b>rejeita</b>, o spin fica como estava.'}`,
        { alvo: [i, j], aceito: ok, vars: { i, j, dE, 'e^(-dE/T)': p.toFixed(3), u: u.toFixed(3) } });
    }
  }
  return passos;
}
