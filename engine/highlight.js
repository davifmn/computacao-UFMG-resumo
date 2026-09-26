// Realce de sintaxe mínimo (C/C++, Python, bash e Makefile), sem dependências.
// Trabalha linha a linha para que o player possa destacar a linha em execução.

const KEYWORDS = {
  cpp: new Set(('if else for while do return new delete nullptr true false const struct class public private '
    + 'using namespace template typename auto break continue switch case default sizeof virtual override '
    + 'explicit inline constexpr static protected this throw try catch operator friend noexcept final').split(' ')),
  python: new Set(('def return if elif else for while in not and or None True False is import from class '
    + 'pass continue break lambda yield with as').split(' ')),
  bash: new Set('if then else fi for do done while in echo cd mkdir make git g++ export'.split(' ')),
  make: new Set('all clean test PHONY'.split(' ')),
};

// Linguagens em que '#' inicia um comentário.
const HASH_COMMENT = new Set(['python', 'bash', 'make']);

const TYPES = {
  cpp: new Set('int float double char bool void long short unsigned string vector size_t std'.split(' ')),
  python: new Set('int float str bool list dict set tuple range len print'.split(' ')),
};

const TOKEN = /(\/\/.*$|#.*$)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)|(\s+)|(.)/g;

export function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

export function highlightLine(line, lang = 'cpp') {
  if (lang === 'cpp' && /^\s*#/.test(line)) return `<span class="tk-pp">${escapeHtml(line)}</span>`;
  const kw = KEYWORDS[lang] ?? KEYWORDS.cpp;
  const ty = TYPES[lang] ?? new Set();
  let out = '';
  TOKEN.lastIndex = 0;
  let m;
  while ((m = TOKEN.exec(line))) {
    const [tok, com, str, num, id] = m;
    if (com) {
      // '#' é comentário em Python/bash/Makefile; '//' em C++.
      const isComment = HASH_COMMENT.has(lang) ? tok.startsWith('#') : tok.startsWith('//');
      if (isComment) { out += `<span class="tk-com">${escapeHtml(tok)}</span>`; continue; }
      out += escapeHtml(tok[0]);
      TOKEN.lastIndex = m.index + 1;
      continue;
    }
    if (str) out += `<span class="tk-str">${escapeHtml(tok)}</span>`;
    else if (num) out += `<span class="tk-num">${tok}</span>`;
    else if (id) {
      const isCall = /^\s*\(/.test(line.slice(m.index + tok.length));
      if (kw.has(id)) out += `<span class="tk-kw">${id}</span>`;
      else if (ty.has(id)) out += `<span class="tk-ty">${id}</span>`;
      else if (isCall) out += `<span class="tk-fn">${id}</span>`;
      else out += id;
    } else out += escapeHtml(tok);
  }
  return out;
}

/**
 * Cria um localizador de linhas: `const L = lineFinder(code); L('if (n < 2)')`
 * devolve o número (1-based) da primeira linha que contém o trecho.
 * Usar trechos de código em vez de números evita que as animações fiquem
 * dessincronizadas quando alguém edita o código exibido.
 */
export function lineFinder(code) {
  const lines = code.split('\n');
  return (snippet, from = 1) => {
    for (let i = from - 1; i < lines.length; i++) if (lines[i].includes(snippet)) return i + 1;
    throw new Error(`Trecho não encontrado no código: "${snippet}"`);
  };
}
