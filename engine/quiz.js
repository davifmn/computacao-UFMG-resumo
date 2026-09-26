// Exercícios interativos.
//
// Dois tipos de questão:
//   { q, options: [...], answer: índice, explain }      → múltipla escolha
//   { q, input: true, answer, check?(resposta), explain } → resposta digitada
//
// `mountQuiz` mostra uma lista fixa; `mountGenerator` gera questões novas
// infinitamente a partir de uma função `generate()` — a semente do futuro
// gerador de exercícios do repositório.

import { h, renderMath, shuffle } from './page.js';

function normalize(s) {
  return String(s).trim().toLowerCase().replace(/\s+/g, '').replace(',', '.');
}

function questionCard(question, onAnswer) {
  const card = h('div', { class: 'q-card' });
  card.append(h('div', { class: 'q', html: question.q }));
  const feedback = h('div', { class: 'feedback', 'aria-live': 'polite' });

  const reveal = ok => {
    feedback.className = `feedback ${ok ? 'ok' : 'bad'}`;
    feedback.innerHTML = `<b>${ok ? 'Correto!' : 'Ainda não.'}</b> ${question.explain ?? ''}`;
    renderMath(feedback);
    onAnswer?.(ok);
  };

  if (question.input) {
    const input = h('input', { type: 'text', placeholder: 'Sua resposta', 'aria-label': 'Resposta' });
    const check = question.check ?? (v => normalize(v) === normalize(question.answer));
    const submit = () => {
      if (!input.value.trim()) return;
      const ok = check(input.value);
      input.disabled = true; btn.disabled = true;
      reveal(ok);
      if (!ok) feedback.insertAdjacentHTML('beforeend', ` <br>Resposta esperada: <code>${question.answer}</code>`);
    };
    const btn = h('button', { class: 'btn primary small', onclick: submit }, 'Verificar');
    input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    card.append(h('div', { class: 'row' }, input, btn));
  } else {
    // Embaralha as alternativas, mas lembra qual é a correta.
    const order = question.shuffle === false ? question.options.map((_, i) => i) : shuffle(question.options.map((_, i) => i));
    const opts = h('div', { class: 'opts' });
    for (const i of order) {
      const b = h('button', { class: 'opt', html: question.options[i] });
      b.addEventListener('click', () => {
        const ok = i === question.answer;
        for (const other of opts.children) other.disabled = true;
        b.classList.add(ok ? 'right' : 'wrong');
        if (!ok) opts.children[order.indexOf(question.answer)].classList.add('right');
        reveal(ok);
      });
      opts.append(b);
    }
    card.append(opts);
  }
  card.append(feedback);
  renderMath(card);
  return card;
}

export function mountQuiz(root, questions) {
  root.classList.add('quiz');
  let right = 0, answered = 0;
  const score = h('span', { class: 'score' }, `0 / ${questions.length}`);
  root.append(h('div', { class: 'q-head' }, h('span', { class: 'c-muted' }, 'Responda e veja a explicação.'), score));
  for (const q of questions) {
    root.append(questionCard(q, ok => {
      answered++; if (ok) right++;
      score.textContent = `${right} / ${questions.length}${answered === questions.length ? ' ✓' : ''}`;
    }));
  }
}

export function mountGenerator(root, { generate, label = 'Novo exercício' }) {
  root.classList.add('quiz');
  let right = 0, total = 0;
  const score = h('span', { class: 'score' }, 'acertos: 0 / 0');
  const slot = h('div');
  const next = () => {
    slot.replaceChildren(questionCard(generate(), ok => {
      total++; if (ok) right++;
      score.textContent = `acertos: ${right} / ${total}`;
    }));
  };
  root.append(
    h('div', { class: 'q-head' }, h('button', { class: 'btn', onclick: next }, `↻ ${label}`), score),
    slot,
  );
  next();
}
