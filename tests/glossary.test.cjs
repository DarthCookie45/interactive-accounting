// Run with: node tests/glossary.test.cjs
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const nodes = {};
function element() {
  return {
    value: '', children: [], handlers: {},
    append(...items) { this.children.push(...items); },
    replaceChildren() { this.children = []; },
    addEventListener(type, handler) {
      const previous = this.handlers[type];
      this.handlers[type] = (...args) => { previous?.(...args); handler(...args); };
    },
    setAttribute() {},
    showModal() { this.open = true; },
    close() { this.open = false; },
    focus() { this.focused = true; }
  };
}
const document = {
  getElementById: id => nodes[id] ||= element(),
  createElement: element,
  createTextNode: text => ({ textContent: text })
};
document.querySelector = () => nodes.heading ||= element();
const window = { scrollY: 0, listeners: {}, reducedMotion: false,
  addEventListener(type, handler) { this.listeners[type] = handler; },
  matchMedia() { return { matches: this.reducedMotion }; },
  scrollTo(options) { this.lastScroll = options; this.scrollY = options.top; this.listeners.scroll(); }
};
const context = vm.createContext({ document, window, requestAnimationFrame: fn => fn() });
vm.runInContext(fs.readFileSync(path.join(root, 'js/glossary.js'), 'utf8'), context);
const run = code => vm.runInContext(code, context);
const terms = run('glossaryTerms');
assert(terms.length >= 60);
assert.equal(new Set(terms.map(term => term.term)).size, terms.length, 'duplicate term');
for (let i = 0; i < terms.length; i++) {
  assert(terms[i].definition && terms[i].example && Array.isArray(terms[i].aliases));
  if (i) assert(terms[i - 1].term.localeCompare(terms[i].term, 'en-GB') <= 0);
}
for (const [query, expected] of [
  ['double-entry', 'Double-entry bookkeeping'], ['D.E.A.L.E.R.', 'D.E.A.L.E.R.'],
  ['dealer', 'D.E.A.L.E.R.'], ['DEADCLIC', 'DEADCLIC'], ['S.P.L.', 'Statement of profit or loss'],
  [' SFP ', 'Statement of financial position'], ['balance sheet', 'Statement of financial position'],
  ['P&L', 'Statement of profit or loss'], ['COGS', 'Cost of sales'],
  ['b/d', 'Balance brought down'], ['NRV', 'Net realisable value'],
  ['PPE', 'Property, plant and equipment'], ['money owed', 'Liability']
]) {
  assert(run(`filterGlossaryTerms(${JSON.stringify(query)}).some(entry => entry.term === ${JSON.stringify(expected)})`), query);
}
assert.equal(run('filterGlossaryTerms("D.E.A.L.E.R.").length'), 1);
assert.equal(run('filterGlossaryTerms("   ").length'), terms.length);
nodes['glossary-search'].value = 'no-such-term-zzzz';
nodes['glossary-search'].handlers.input();
assert.equal(nodes['glossary-results'].children.length, 0);
assert.equal(nodes['glossary-empty'].hidden, false);
nodes['glossary-clear'].handlers.click();
assert.equal(nodes['glossary-results'].children.length, terms.length);
assert(nodes['glossary-search'].focused);
assert(nodes['glossary-back-top'].hidden);
window.scrollY = 500;
window.listeners.scroll();
assert.equal(nodes['glossary-back-top'].hidden, false);
nodes['glossary-back-top'].handlers.click();
assert.equal(window.lastScroll.behavior, 'smooth');
assert(nodes['glossary-back-top'].hidden);
assert(nodes.heading.focused);
window.reducedMotion = true;
nodes['glossary-back-top'].handlers.click();
assert.equal(window.lastScroll.behavior, 'instant');
run('showGlossaryAccount(glossaryTerms.find(entry => entry.term === "Trade payables"))');
assert(nodes['glossary-account-dialog'].open);
assert(nodes['glossary-account-title'].textContent.includes('Trade payables'));
const sides = nodes['glossary-account-content'].children[0].children;
assert(sides[1].children[1].textContent.includes('Increases'));
assert(sides[0].children[1].textContent.includes('Decreases'));
nodes['glossary-account-close'].handlers.click();
assert.equal(nodes['glossary-account-dialog'].open, false);
for (const file of ['index.html', 'glossary.html']) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  assert(html.includes('<body class="site-page">'));
  for (const match of html.matchAll(/(?:href|src)="([^"#][^"]*)"/g)) {
    if (match[1].startsWith('https:')) continue;
    assert(fs.existsSync(path.join(root, match[1].split(/[?#]/)[0])), 'missing local link: ' + match[1]);
  }
}
console.log(`Passed: ${terms.length} unique alphabetical terms, definitions/examples, acronym and alias search, empty results, reset and page links.`);
