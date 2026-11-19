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
  get dataset() { return this.data ||= { vanReport: this.attributes['data-van-report'] }; }
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
  for (const match of html.matchAll(/<script src="([^"?]+)(?:\\?[^"]*)?" defer>/g)) {
    vm.runInContext(fs.readFileSync(path.resolve(root, 'activities', match[1]), 'utf8'), context);
  }
  const run = code => vm.runInContext(code, context);
  const get = id => document.getElementById(id);
  get('van-guide-next').click();
  get('van-difficulty').value = mode;
  get('van-start').click();
  return { document, context, run, get };
}

function completeMonth(mode, useHint) {
  const { run, get } = loadPage(mode);
  const content = get('van-report-content');
  const button = text => content.all().find(node => node.tag === 'button' && node.textContent === text);
  for (let week = 0; week < 4; week++) {
    for (let day = 0; day < 7; day++) {
      const count = run('journal.length');
      for (let i = 0; i < count; i++) {
        const entry = run('journal[entryIndex]');
        if (entry.challenge) get(entry.challenge.mode === 'quantity' ? 'van-quantity-answer' : 'van-choice-answer').value = entry.challenge.answer;
        else {
          get('van-debit').value = entry.debit; get('van-credit').value = entry.credit;
          get('van-debit-amount').value = get('van-credit-amount').value = (entry.pennies / 100).toFixed(2);
        }
        get('van-journal-form').emit('submit');
        assert(get('van-journal-form').querySelector('button[type="submit"]').disabled, 'correct entry must post');
        const posted = run('postedEntries.length'); get('van-journal-form').emit('submit'); assert.equal(run('postedEntries.length'), posted);
        get('van-journal-next').click();
      }
      if (day < 6) {
        assert(get('van-trial-open').hidden); assert(!get('van-next-day').disabled);
        get('van-day-summary').querySelector('[data-van-report="ledger"]').click(); assert(get('van-report-tools').hidden);
        get('van-report-back').click(); get('van-next-day').click();
      }
    }
    assert(get('van-next-day').disabled);
    get('van-trial-open').click();
    assert.equal(get('van-trial-tray-host').parentElement, get('van-report-dock'), 'tray and report buttons share the sticky dock');
    assert(get('van-trial-tray-host').querySelector('.van-trial-pool'));
    assert(get('van-report-tools').querySelector('[data-van-report="trial"]').className.includes('van-report-featured'));
    if (useHint) button('Hint · half points').click();
    const rows = run('accountNames.map(account => ({account,balance:balanceFor(account)})).filter(row => row.balance)');
    const tableRows = content.querySelector('tbody').children;
    rows.forEach((row, index) => tableRows[index].cells[row.balance > 0 ? 1 : 2].children[0].drop(index));
    const before = run('score'); button('Check entry').click();
    assert(run('trialComplete()')); assert.equal(run('score') - before, useHint ? 125 : 250);
    get('van-report-back').click();
    get('van-day-summary').querySelector('[data-van-report="statements"]').click();
    assert(get('van-report-tools').querySelector('[data-van-report="statements"]').className.includes('van-report-featured'));
    const fill = () => {
      const groups = run('statementExercise.stage') === 'spl' ? ['sales','openingCost','cost','closingCost','expenses'] : ['noncurrent','current','capital','drawings','currentLiability','noncurrentLiability'];
      const slots = content.querySelectorAll('.van-financial-slot'); const accounts = run('financialAccounts()'); let index = 0;
      groups.forEach(section => accounts.filter(account => account.section === section).forEach(account => slots[index++].drop(account.account)));
    };
    fill(); button('Remove all tiles').click(); assert.equal(run('statementExercise.placed.size'), 0);
    fill(); button('Check profit or loss statement').click(); assert(run('statementExercise.splComplete'));
    fill();
    // An otherwise correct SFP must not pass without the period profit/loss.
    const wrongBefore = run('totalMistakes');
    button('Check financial position statement').click(); assert(!run('statementExercise.sfpComplete'));
    assert.equal(run('totalMistakes'), wrongBefore + 1);
    const profit = get('van-statement-profit');
    const periodResult = run('game.totals().profit');
    profit.value = periodResult < 0 && useHint ? '(£' + (-periodResult / 100).toFixed(2) + ')' : (periodResult < 0 ? '-£' : '£') + (Math.abs(periodResult) / 100).toFixed(2);
    profit.emit('input');
    button('Check financial position statement').click(); assert(run('statementExercise.sfpComplete'));
    if (useHint) {
      const progress = run('achievementProgress("No Spoilers!")');
      assert(progress.value < progress.target, 'disqualified hint progress must not display 7/7');
      assert(progress.note.includes('hint use(s)'));
    }
    const perfect = run('achievementProgress("Perfect Week")');
    if (!perfect.earned) {
      assert(perfect.value < perfect.target, 'incorrect final exercise must disqualify Sunday');
      assert(perfect.note.includes('incorrect submission(s)'));
    }
    get('van-report-back').click(); assert(!get('van-next-day').disabled); get('van-next-day').click();
    assert(!get('van-final-art').hidden); assert(get('van-live-sidebar').hidden); assert(get('van-final-artwork').querySelector('svg'));
    assert.equal(run('game.snapshots.length'), week + 1);
    if (week < 3) { assert(!get('van-next-week').hidden); get('van-next-week').click(); assert.equal(run('game.weekIndex'), week + 1); }
    else { assert(get('van-next-week').hidden); assert(run('achievements.has("You nerd")')); }
  }
}
for (let i = 0; i < 6; i++) { completeMonth('easy', i % 2 === 0); completeMonth('hard', i % 2 === 1); }
{
  const { run, get } = loadPage('hard');
  run('score = 9000; updateStats()');
  assert(!run('achievements.has("Its over 9000!")'));
  run('score = 9001; updateStats()');
  assert(run('achievements.has("Its over 9000!")'));
  get('van-primary').value = get('van-accent').value = '#ffffff';
  get('van-start').click();
  assert(run('achievements.has("Standard Joe")'));
}
{
  const { run, get } = loadPage('hard');
  get('van-show-achievements').click();
  const lockedText = get('van-achievement-guide').all().map(node => node.textContent).join(' ');
  assert(!lockedText.includes('Back in the Bun'));
  assert(!lockedText.includes('Frankly Indecisive'));
  assert(!lockedText.includes('Ketchup with the Mustard'));
  run('score = -100; updateStats(); score = 10; updateStats()');
  assert(run('achievements.has("Back in the Bun")'));
  get('van-show-achievements').click();
  assert(get('van-achievement-guide').all().map(node => node.textContent).join(' ').includes('Back in the Bun'));
  run('score = 3000; weekScore = 0; updateStats()');
  assert(!run('achievements.has("I Love You 3000")'));
  run('score = 3001; updateStats()');
  assert(run('achievements.has("I Love You 3000")'));
  run('postedEntries.push({week:0,customers:515,sold:2999}); updateStats()');
  assert(!run('achievements.has("Introverts Nightmare")'));
  assert(!run('achievements.has("Hot Diggity Dog")'));
  run('postedEntries.push({week:0,customers:1,sold:1}); updateStats()');
  assert(run('achievements.has("Introverts Nightmare")'));
  assert(run('achievements.has("Hot Diggity Dog")'));
  run('postedEntries.push({week:1,customers:1685}); score = 60001; updateStats()');
  assert(run('achievements.has("People Person")'));
  assert(run('achievements.has("Getting It")'));
  assert(run('achievements.has("We got GTA 6 before the Hot Dog Van")'));
  assert.equal(run('customerCount(true)'), 516);
  run('postedEntries.push({credit:"Owner’s capital",pennies:1800000}); updateStats()');
  assert(!run('achievements.has("Made of Money")'));
  run('postedEntries.push({credit:"Owner’s capital",pennies:1}); updateStats()');
  assert(run('achievements.has("Made of Money")'));
}
{
  const { run, get } = loadPage('easy');
  for (let i = 0; i < 30; i++) get('van-roll').click();
  get('van-primary').value = '#ff0000';
  get('van-accent').value = '#ffff00';
  get('van-start').click();
  assert(run('achievements.has("Frankly Indecisive")'));
  assert(run('achievements.has("Ketchup with the Mustard")'));
}
{
  const { run, get } = loadPage('easy');
  for (const id of ['van-guide-achievements', 'van-today-achievements', 'van-setup-achievements', 'van-report-achievements']) {
    get(id).click(); assert(get('van-achievement-guide').children.length > 0);
    get('van-close-achievements').click();
  }
  run('bestStreak = 11; totalMistakes = 19; updateStats()');
  assert(!run('achievements.has("Vardy Party")'));
  assert(!run('achievements.has("My Bad")'));
  run('bestStreak = 12; totalMistakes = 20; updateStats()');
  assert(run('achievements.has("Vardy Party")'));
  assert(run('achievements.has("My Bad")'));
  assert.equal(run('achievementProgress("My Bad").value'), 20);
  assert.equal(run('achievementProgress("Vardy Party").value'), 12);
}
console.log('Passed: 12 complete Easy/Hard months through the HTML-linked scripts, four weekly trial balances, dynamic SPL/SFP accounts, typed profit/loss, weekly closing, next-week navigation and month achievement.');
{
  const { run, get } = loadPage('easy');
  assert(run('Object.hasOwn(achievementDescriptions, "No Spoilers!")'));
  assert(!run('Object.hasOwn(achievementDescriptions, "No hints please!")'));
  run('Object.keys(achievementDescriptions).forEach(name => achievements.add(name))');
  get('van-show-achievements').click();
  const icons = get('van-achievement-guide').all().filter(node => node.className === 'van-achievement-icon');
  assert.equal(icons.length, run('Object.keys(achievementDescriptions).length'));
  assert.equal(new Set(icons.map(icon => icon.src)).size, icons.length, 'every revealed achievement has a unique icon');
  for (const icon of icons) {
    const file = path.resolve(root, 'activities', icon.src);
    assert(fs.readFileSync(file, 'utf8').includes('<svg'), 'local SVG must exist: ' + icon.src);
  }
}
{
  const { run, get } = loadPage('easy');
  run('achievements.delete("Alliteration"); businessName = "Golden Buns"');
  get('van-start').click();
  assert(!run('achievements.has("Alliteration")'));
  run('businessName = "Golden Grill"');
  get('van-start').click();
  assert(run('achievements.has("Alliteration")'));
  assert.equal(run('achievementProgress("Alliteration").value'), 1);
  assert.equal(run('achievementProgress("Alliteration").target'), 1);
}
