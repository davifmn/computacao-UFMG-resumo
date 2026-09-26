// Probabilidade: distribuições (fmp/fdp, fda, média, variância, amostragem),
// Bayes e Monty Hall. Funções puras, testadas em tests/probabilidade.test.js.

import { normal, exponential } from '../../../engine/random.js';

// ---------- Funções auxiliares ----------

export function logFactorial(n) {
  let s = 0;
  for (let k = 2; k <= n; k++) s += Math.log(k);
  return s;
}
export const logBinom = (n, k) => logFactorial(n) - logFactorial(k) - logFactorial(n - k);

/** Função erro (aproximação de Abramowitz–Stegun 7.1.26, erro < 1,5·10⁻⁷). */
export function erf(x) {
  const s = Math.sign(x);
  x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
}
export const normalCdf = (x, mu = 0, sigma = 1) => 0.5 * (1 + erf((x - mu) / (sigma * Math.SQRT2)));

// ---------- Distribuições ----------
// Cada uma: { nome, discreta, params: [{k, nome, min, max, step, v}], suporte(params) → [lo, hi],
//             f(x, p) (fmp ou fdp), cdf(x, p), media(p), variancia(p), amostra(r, p), tex }

export const DISTS = {
  binomial: {
    nome: 'Binomial', discreta: true,
    params: [{ k: 'n', nome: 'n (tentativas)', min: 1, max: 60, step: 1, v: 20 }, { k: 'p', nome: 'p (sucesso)', min: 0.01, max: 0.99, step: 0.01, v: 0.3 }],
    suporte: ({ n }) => [0, n],
    f: (x, { n, p }) => (x < 0 || x > n || !Number.isInteger(x) ? 0 : Math.exp(logBinom(n, x) + x * Math.log(p) + (n - x) * Math.log(1 - p))),
    media: ({ n, p }) => n * p, variancia: ({ n, p }) => n * p * (1 - p),
    amostra: (r, { n, p }) => { let s = 0; for (let i = 0; i < n; i++) if (r() < p) s++; return s; },
    tex: 'P(X = k) = \\binom{n}{k} p^k (1-p)^{n-k}',
    exemplo: 'número de caras em n lançamentos; número de pacotes corrompidos entre n enviados',
  },
  geometrica: {
    nome: 'Geométrica', discreta: true,
    params: [{ k: 'p', nome: 'p (sucesso)', min: 0.02, max: 0.95, step: 0.01, v: 0.2 }],
    suporte: ({ p }) => [1, Math.max(10, Math.ceil(Math.log(0.002) / Math.log(1 - p)))],
    f: (x, { p }) => (x < 1 || !Number.isInteger(x) ? 0 : (1 - p) ** (x - 1) * p),
    media: ({ p }) => 1 / p, variancia: ({ p }) => (1 - p) / p ** 2,
    amostra: (r, { p }) => { let k = 1; while (r() >= p) k++; return k; },
    tex: 'P(X = k) = (1-p)^{k-1}\\, p',
    exemplo: 'número de tentativas até o primeiro sucesso (ex.: retransmissões até o pacote chegar)',
  },
  poisson: {
    nome: 'Poisson', discreta: true,
    params: [{ k: 'lambda', nome: 'λ (taxa)', min: 0.2, max: 30, step: 0.1, v: 4 }],
    suporte: ({ lambda }) => [0, Math.ceil(lambda + 5 * Math.sqrt(lambda) + 5)],
    f: (x, { lambda }) => (x < 0 || !Number.isInteger(x) ? 0 : Math.exp(x * Math.log(lambda) - lambda - logFactorial(x))),
    media: ({ lambda }) => lambda, variancia: ({ lambda }) => lambda,
    amostra: (r, { lambda }) => { const L = Math.exp(-lambda); let k = 0, p = 1; do { k++; p *= r(); } while (p > L); return k - 1; },
    tex: 'P(X = k) = \\frac{\\lambda^k e^{-\\lambda}}{k!}',
    exemplo: 'número de eventos raros num intervalo: requisições por segundo num servidor, erros por página',
  },
  uniforme: {
    nome: 'Uniforme', discreta: false,
    params: [{ k: 'a', nome: 'a', min: -5, max: 5, step: 0.1, v: 0 }, { k: 'b', nome: 'b', min: -4, max: 10, step: 0.1, v: 4 }],
    suporte: ({ a, b }) => [Math.min(a, b) - 1, Math.max(a, b) + 1],
    f: (x, { a, b }) => (b > a && x >= a && x <= b ? 1 / (b - a) : 0),
    cdf: (x, { a, b }) => (x <= a ? 0 : x >= b ? 1 : (x - a) / (b - a)),
    media: ({ a, b }) => (a + b) / 2, variancia: ({ a, b }) => (b - a) ** 2 / 12,
    amostra: (r, { a, b }) => a + (b - a) * r(),
    tex: 'f(x) = \\frac{1}{b-a},\\ a \\le x \\le b',
    exemplo: 'Math.random(); um instante "qualquer" dentro de um intervalo',
  },
  exponencial: {
    nome: 'Exponencial', discreta: false,
    params: [{ k: 'lambda', nome: 'λ (taxa)', min: 0.1, max: 4, step: 0.05, v: 1 }],
    suporte: ({ lambda }) => [0, 6 / lambda],
    f: (x, { lambda }) => (x < 0 ? 0 : lambda * Math.exp(-lambda * x)),
    cdf: (x, { lambda }) => (x < 0 ? 0 : 1 - Math.exp(-lambda * x)),
    media: ({ lambda }) => 1 / lambda, variancia: ({ lambda }) => 1 / lambda ** 2,
    amostra: (r, { lambda }) => exponential(r, lambda),
    tex: 'f(x) = \\lambda e^{-\\lambda x},\\ x \\ge 0',
    exemplo: 'tempo até o próximo evento de um processo de Poisson; tempo de vida sem "memória"',
  },
  normal: {
    nome: 'Normal', discreta: false,
    params: [{ k: 'mu', nome: 'μ (média)', min: -5, max: 5, step: 0.1, v: 0 }, { k: 'sigma', nome: 'σ (desvio)', min: 0.2, max: 4, step: 0.05, v: 1 }],
    suporte: ({ mu, sigma }) => [mu - 4 * sigma, mu + 4 * sigma],
    f: (x, { mu, sigma }) => Math.exp(-(((x - mu) / sigma) ** 2) / 2) / (sigma * Math.sqrt(2 * Math.PI)),
    cdf: (x, { mu, sigma }) => normalCdf(x, mu, sigma),
    media: ({ mu }) => mu, variancia: ({ sigma }) => sigma ** 2,
    amostra: (r, { mu, sigma }) => normal(r, mu, sigma),
    tex: 'f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}',
    exemplo: 'erros de medida, alturas, somas de muitas variáveis independentes (Teorema Central do Limite)',
  },
};

export const defaults = d => Object.fromEntries(DISTS[d].params.map(p => [p.k, p.v]));

/** P(a ≤ X ≤ b). */
export function prob(d, params, a, b) {
  const D = DISTS[d];
  if (D.discreta) {
    let s = 0;
    for (let k = Math.ceil(a); k <= Math.floor(b); k++) s += D.f(k, params);
    return s;
  }
  return D.cdf(b, params) - D.cdf(a, params);
}

// ---------- Bayes ----------

/** Teste diagnóstico: prevalência, sensibilidade P(+|D), especificidade P(−|¬D). */
export function bayesTest({ prevalencia, sensibilidade, especificidade }, populacao = 1000) {
  const doentes = prevalencia * populacao;
  const sadios = populacao - doentes;
  const vp = doentes * sensibilidade;             // verdadeiros positivos
  const fn = doentes - vp;
  const fp = sadios * (1 - especificidade);       // falsos positivos
  const vn = sadios - fp;
  return { vp, fn, fp, vn, posterior: vp / (vp + fp), negPreditivo: vn / (vn + fn) };
}

// ---------- Monty Hall ----------

/** Simula `games` jogos; devolve a fração de vitórias ficando e trocando de porta. */
export function montyHall(r, games = 1000) {
  let fica = 0, troca = 0;
  for (let g = 0; g < games; g++) {
    const carro = Math.floor(r() * 3);
    const escolha = Math.floor(r() * 3);
    // o apresentador abre uma porta que não é a escolhida nem a do carro
    const opcoes = [0, 1, 2].filter(p => p !== escolha && p !== carro);
    const aberta = opcoes[Math.floor(r() * opcoes.length)];
    const outra = [0, 1, 2].find(p => p !== escolha && p !== aberta);
    if (escolha === carro) fica++;
    if (outra === carro) troca++;
  }
  return { fica: fica / games, troca: troca / games };
}

// ---------- Distribuições-base para o Teorema Central do Limite ----------
// Todas bem diferentes da normal, de propósito.

export const BASES = {
  dado: { nome: 'Dado (1 a 6)', media: 3.5, sd: Math.sqrt(35 / 12), range: [0.5, 6.5], amostra: r => 1 + Math.floor(r() * 6), discreta: true, f: x => (Number.isInteger(x) && x >= 1 && x <= 6 ? 1 / 6 : 0) },
  uniforme: { nome: 'Uniforme [0, 1]', media: 0.5, sd: Math.sqrt(1 / 12), range: [0, 1], amostra: r => r(), f: x => (x >= 0 && x <= 1 ? 1 : 0) },
  exponencial: { nome: 'Exponencial (assimétrica)', media: 1, sd: 1, range: [0, 5], amostra: r => -Math.log(1 - r()), f: x => (x < 0 ? 0 : Math.exp(-x)) },
  bimodal: {
    nome: 'Em "U" (arco-seno)', media: 0.5, sd: Math.sqrt(1 / 8), range: [0, 1],
    amostra: r => Math.sin((Math.PI * r()) / 2) ** 2,
    f: x => (x > 0 && x < 1 ? 1 / (Math.PI * Math.sqrt(x * (1 - x))) : 0),
  },
};

/** Médias de `reps` amostras de tamanho n. */
export function sampleMeans(r, base, n, reps) {
  const B = BASES[base];
  return Array.from({ length: reps }, () => {
    let s = 0;
    for (let i = 0; i < n; i++) s += B.amostra(r);
    return s / n;
  });
}

/** Bola na tábua de Galton: sequência de desvios (0 = esquerda, 1 = direita). */
export const galtonPath = (r, rows, p = 0.5) => Array.from({ length: rows }, () => (r() < p ? 1 : 0));
