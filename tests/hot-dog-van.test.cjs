// Run with: node tests/hot-dog-van.test.cjs
// Exercises the script linked by the real HTML; no third-party dependencies.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');

class Element {
  constructor(tag = 'div') {
    this.tag = tag; this.children = []; this.attributes = {}; this.listeners = {};
    this.hidden = false; this.disabled = false; this.required = false; this.value = '';
    this.className = ''; this.textContent = ''; this.style = { setProperty() {} };
    this.classList = { toggle: (name, on) => {
      const classes = new Set(this.className.split(/\s+/).filter(Boolean));
      if (on) classes.add(name); else classes.delete(name);
      this.className = [...classes].join(' ');
    } };
  }
  append(...nodes) {
    for (const node of nodes) {
      if (node.parentElement) {
        const old = node.parentElement.children;
        const index = old.indexOf(node);
        if (index >= 0) old.splice(index, 1);
      }
      node.parentElement = this;
      this.children.push(node);
    }
  }
  prepend(...nodes) { this.children.unshift(...nodes); }
  insertBefore(node, before) { const i = this.children.indexOf(before); this.children.splice(i < 0 ? 0 : i, 0, node); }
  get firstChild() { return this.children[0]; }
  replaceChildren(...nodes) { this.children = nodes; }
  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name === 'class') this.className = value;
    if (['id', 'type', 'value'].includes(name)) this[name] = value;
    if (['hidden', 'disabled', 'required'].includes(name)) this[name] = true;
  }
  removeAttribute(name) { delete this.attributes[name]; }
  get dataset() { return { vanReport: this.attributes['data-van-report'] }; }
  all() { return this.children.flatMap(node => node instanceof Element ? [node, ...node.all()] : []); }
  matches(selector) {
    if (selector.startsWith('#')) return this.id === selector.slice(1);
    if (selector.startsWith('.')) return this.className.split(/\s+/).includes(selector.slice(1));
    const attr = selector.match(/^(\w+)?\[([\w-]+)(?:="([^"]*)")?\]$/);
    if (attr) return (!attr[1] || this.tag === attr[1]) && attr[2] in this.attributes && (attr[3] === undefined || this.attributes[attr[2]] === attr[3]);
    return this.tag === selector;
  }
  querySelectorAll(selector) { return this.all().filter(node => node.matches(selector)); }
  querySelector(selector) {
    if (selector === 'table tbody tr:last-child') return this.querySelector('tbody').children.at(-1);
    return this.querySelectorAll(selector)[0] || null;
  }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  emit(type, extra = {}) {
    const event = { preventDefault() {}, stopPropagation() {}, ...extra };
    (this.listeners[type] || []).forEach(fn => fn(event));
  }
  click() { if (!this.disabled) this.emit('click'); }
  drop(value) { this.emit('drop', { dataTransfer: { getData: () => String(value) } }); }
  focus() {}
  reset() { this.all().filter(node => ['input', 'select'].includes(node.tag)).forEach(node => { node.value = ''; }); }
  reportValidity() { return this.all().every(node => node.disabled || !node.required || String(node.value).trim() !== ''); }
  add(node) { this.append(node); }
  createCaption() { const node = new Element('caption'); this.append(node); return node; }
  createTHead() { const node = new Element('thead'); this.append(node); return node; }
  createTBody() { const node = new Element('tbody'); this.append(node); return node; }
  insertRow() { const node = new Element('tr'); this.append(node); return node; }
  insertCell() { const node = new Element('td'); this.append(node); return node; }
  get cells() { return this.children; }
  cloneNode(deep) {
    const node = new Element(this.tag);
    Object.entries(this.attributes).forEach(([name, value]) => node.setAttribute(name, value));
    node.textContent = this.textContent;
    if (deep) this.children.forEach(child => node.append(child.cloneNode(true)));
    return node;
  }
  showModal() {} close() {}
}

function loadPage(mode) {
  const html = fs.readFileSync(path.join(root, 'activities/hot-dog-van.html'), 'utf8');
  const document = new Element('document');
  const stack = [document];
  const voidTags = new Set(['meta', 'link', 'input', 'br', 'hr', 'img']);
  for (const match of html.matchAll(/<\/?([a-z][\w:-]*)\b([^>]*?)>/gi)) {
    const [token, tag, attributes] = match;
    if (token.startsWith('</')) { if (stack.at(-1).tag === tag) stack.pop(); continue; }
    const element = new Element(tag);
    for (const attr of attributes.matchAll(/([\w:-]+)(?:\s*=\s*"([^"]*)")?/g)) element.setAttribute(attr[1], attr[2] ?? '');
    stack.at(-1).append(element);
    if (!voidTags.has(tag) && !token.endsWith('/>')) stack.push(element);
  }
  document.createElement = tag => new Element(tag);
  document.getElementById = id => document.querySelector('#' + id);
  function Option(text, value) { const option = new Element('option'); option.textContent = text; option.value = value; return option; }
  const context = vm.createContext({ document, HTMLElement: Element, Option, Intl, Math, console });
  const script = html.match(/<script src="([^"?]+)(?:\?[^"]*)?" defer>/)[1];
  vm.runInContext(fs.readFileSync(path.resolve(root, 'activities', script), 'utf8'), context);
  const run = code => vm.runInContext(code, context);
  const get = id => document.getElementById(id);
  get('van-guide-next').click();
  get('van-difficulty').value = mode;
  get('van-start').click();
  return { document, context, run, get };
}

function completeWeek(mode, useHint) {
  const { run, get } = loadPage(mode);
  const seen = new Set();
  const submit = get('van-journal-form').querySelector('button[type="submit"]');
  for (let day = 0; day < 7; day++) {
    const count = run('journal.length');
    for (let i = 0; i < count; i++) {
      const entry = run('journal[entryIndex]');
      if (entry.challenge) {
        seen.add(entry.challenge.mode);
        get(entry.challenge.mode === 'quantity' ? 'van-quantity-answer' : 'van-choice-answer').value = entry.challenge.answer;
      } else {
        get('van-debit').value = entry.debit; get('van-credit').value = entry.credit;
        get('van-debit-amount').value = get('van-credit-amount').value = (entry.pennies / 100).toFixed(2);
      }
      get('van-journal-form').emit('submit');
      assert(submit.disabled, 'correct response must post the entry');
      const posted = run('postedEntries.length');
      get('van-journal-form').emit('submit');
      assert.equal(run('postedEntries.length'), posted, 'entry cannot post twice');
      get('van-journal-next').click();
    }
    if (day < 6) {
      assert(get('van-trial-open').hidden, 'no daily trial exercise');
      assert(!get('van-next-day').disabled, 'next day must not require a trial balance');
      get('van-day-summary').querySelector('[data-van-report="ledger"]').click();
      assert(get('van-report-tools').hidden, 'Monday–Saturday ledger must not show a redundant report button');
      get('van-report-back').click();
      get('van-next-day').click();
    }
  }
  assert.deepEqual([...seen].sort(), ['mistake', 'quantity', 'truefalse']);
  assert(get('van-next-day').disabled, 'Sunday requires final exercises');
  const arithmetic = run(`(() => {
    const t = totalsFor(postedEntries);
    return { hours: assistantHours, rate: assistantRate, wages: assistantWages,
      assets: balanceFor('Bank') + balanceFor('Equipment') + balanceFor('Motor vehicles') + balanceFor('Closing inventory – SFP'),
      capital: -balanceFor('Owner’s capital') + t.profit,
      tb: accountNames.reduce((sum, account) => sum + balanceFor(account), 0) };
  })()`);
  assert(arithmetic.hours >= 6 && arithmetic.hours <= 37.5 && Number.isInteger(arithmetic.hours * 2));
  assert(arithmetic.rate >= 1271 && arithmetic.rate <= 1352);
  assert.equal(arithmetic.wages, Math.round(arithmetic.hours * arithmetic.rate));
  assert.equal(arithmetic.assets, arithmetic.capital); assert.equal(arithmetic.tb, 0);
  get('van-trial-open').click();
  assert(!get('van-report-tools').hidden, 'Sunday exercises must keep report navigation available');
  const content = get('van-report-content');
  const button = text => content.all().find(node => node.tag === 'button' && node.textContent === text);
  if (useHint) button('Hint · half points').click();
  const tiles = run('trialExercises.get(6).tiles');
  const rows = run('accountNames.map(account => ({account,balance:balanceFor(account)})).filter(row => row.balance)');
  let tableRows = content.querySelector('tbody').children;
  // Totals follow a balance moved between sides without being marked yet.
  tableRows[0].cells[1].children[0].drop(0);
  tableRows[0].cells[2].children[0].drop(0);
  assert.equal(run('weekMistakes'), 0);
  assert.equal(tableRows.at(-1).cells[1].textContent, run('money(0)'));
  button('Return all amounts').click();
  assert.equal(run('trialExercises.get(6).placed.size'), 0);
  rows.forEach((row, index) => {
    const tile = tiles.find(item => item.id === index);
    tableRows[index].cells[row.balance > 0 ? 1 : 2].children[0].drop(tile.id);
  });
  assert(!run('trialComplete()'), 'placing balances does not complete the exercise');
  const before = run('score'); button('Check entry').click();
  assert(run('trialComplete()'));
  assert.equal(run('score') - before, useHint ? 125 : 250);
  get('van-report-back').click();
  assert(get('van-next-day').disabled, 'statements are still required');
  const navButtons = get('van-day-summary').querySelector('.van-summary-reports').children;
  assert.equal(navButtons[1].dataset.vanReport, 'statements', 'financial statements become the centre action');
  assert(navButtons[1].className.includes('van-report-featured'));
  get('van-day-summary').querySelector('[data-van-report="statements"]').click();
  function fillStatement() {
    const groups = run('statementExercise.stage') === 'spl' ? ['sales', 'cost', 'expenses'] : ['noncurrent', 'current', 'capital'];
    const slots = content.querySelectorAll('.van-financial-slot');
    const accounts = run('financialAccounts()');
    let index = 0;
    groups.forEach(section => accounts.filter(account => account.section === section).forEach(account => slots[index++].drop(account.account)));
  }
  fillStatement();
  assert(content.querySelector('.van-financial-slot').attributes['data-filled'] === 'true');
  button('Remove all tiles').click();
  assert.equal(run('statementExercise.placed.size'), 0);
  fillStatement(); button('Check profit or loss statement').click();
  assert(run('statementExercise.splComplete')); assert.equal(run('statementExercise.stage'), 'sfp');
  fillStatement(); button('Remove all tiles').click();
  assert.equal(run('statementExercise.placed.size'), 6, 'SFP reset preserves checked SPL accounts');
  fillStatement(); button('Check financial position statement').click();
  assert(run('statementExercise.sfpComplete'));
  get('van-report-back').click(); assert(!get('van-next-day').disabled);
  get('van-next-day').click();
  assert(!get('van-final-art').hidden); assert(get('van-live-sidebar').hidden);
  assert(get('van-final-artwork').querySelector('svg'), 'final results must contain the customised van');
  get('van-show-achievements').click();
  const cards = get('van-achievement-guide').children;
  assert.equal(cards.length, 7);
  let lockedSeen = false;
  for (const card of cards) {
    if (card.className.includes('is-locked')) lockedSeen = true;
    else assert(!lockedSeen, 'unlocked cards must precede locked cards');
    const bar = card.querySelector('progress');
    assert(bar && bar.value >= 0 && bar.value <= bar.max);
    assert.equal(Boolean(card.querySelector('.van-achievement-lock')), card.className.includes('is-locked'));
  }
  return seen;
}
for (let i = 0; i < 12; i++) {
  completeWeek('easy', i % 2 === 0);
  completeWeek('hard', i % 2 === 1);
}
for (const mode of ['easy', 'hard']) {
  const { run, get } = loadPage(mode);
  get('van-hint').click();
  assert(!/Debit Bank|credit Owner|10000|10,000/.test(get('van-hint-text').textContent));
  assert.equal(run('postedEntries.length'), 0);
  get('van-debit').value = 'Bank'; get('van-credit').value = 'Owner’s capital';
  get('van-debit-amount').value = get('van-credit-amount').value = '10000';
  get('van-journal-form').emit('submit');
  assert.equal(run('postedEntries.length'), 0);
  assert(get('van-journal-feedback').textContent.includes('two decimal places'));
  get('van-debit-amount').value = get('van-credit-amount').value = '10000.00';
  get('van-journal-form').emit('submit');
  assert.equal(run('postedEntries.length'), 1);
  assert.equal(run('score'), mode === 'easy' ? 50 : 100);
}
console.log('Passed: 24 complete Easy/Hard weeks using the script linked in the HTML, varied tasks, Sunday-only trial balance, live totals, 250/125 scoring, SPL → SFP, wages, reconciliation, final van, hints and decimal validation.');
