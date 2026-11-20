const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'js/accessibility.js'), 'utf8');
function load(storage, blocked = false) {
  const properties = new Map();
  const html = { dataset: {}, style: { setProperty: (k, v) => properties.set(k, v), removeProperty: k => properties.delete(k) } };
  const backButton = {};
  const brand = { nextElementSibling: backButton };
  const navbar = { querySelector: selector => selector === '.navbar-brand' ? brand : null, insertBefore: (node, before) => { navbar.control = node; assert.equal(before, backButton, 'text size belongs immediately after the brand'); } };
  const events = {};
  const document = { documentElement: html, querySelector: () => navbar,
    addEventListener: (type, fn) => { events[type] = fn; },
    createElement: () => ({ children: [], handlers: {}, append(...nodes) { this.children.push(...nodes); }, addEventListener(type, fn) { this.handlers[type] = fn; } }) };
  const sessionStorage = { getItem: key => { if (blocked) throw Error('blocked'); return storage.get(key); }, setItem: (key, value) => { if (blocked) throw Error('blocked'); storage.set(key, value); } };
  vm.runInNewContext(script, { document, sessionStorage });
  events.DOMContentLoaded();
  return { html, properties, select: navbar.control.children[1] };
}
const storage = new Map();
const first = load(storage);
assert.equal(first.select.value, 'standard');
assert.deepEqual(first.select.children.map(option => option.value), ['standard','14','16','18','20','24']);
first.select.value = '14'; first.select.handlers.change();
assert.equal(first.properties.get('--reading-min'), '14pt');
assert.equal(first.properties.get('font-size'), '14pt');
const next = load(storage);
assert.equal(next.select.value, '14', 'navigation and refresh preserve the tab preference');
next.select.value = '24'; next.select.handlers.change();
assert.equal(next.properties.get('--reading-min'), '24pt');
next.select.value = 'standard'; next.select.handlers.change();
assert.equal(next.properties.size, 0, 'standard restores the original sizing');
const blocked = load(new Map(), true);
blocked.select.value = '18'; blocked.select.handlers.change();
assert.equal(blocked.html.dataset.textSize, '18');
const invalid = load(new Map([['interactive-accounting-text-size', '999']]));
assert.equal(invalid.select.value, 'standard');
for (const page of ['index.html', 'glossary.html', ...fs.readdirSync(path.join(root, 'activities')).filter(name => name.endsWith('.html')).map(name => 'activities/' + name)]) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  assert(html.includes('accessibility.js'), page + ' must load the shared control');
}
console.log('Passed: text-size options, immediate changes, cross-page persistence, reset, blocked storage, invalid preferences and inclusion on every page.');
