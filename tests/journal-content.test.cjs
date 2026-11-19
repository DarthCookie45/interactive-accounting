const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '../js/journal-entry.js'), 'utf8');
const context = vm.createContext({ document: { querySelector: () => ({ querySelector: () => ({}) }) }, Intl, Math });
vm.runInContext(source.slice(0, source.indexOf('let currentTransaction =')), context);
const terms = vm.runInContext('transactionTypes', context);
const accrued = terms.find(item => item.topic === 'accrued-income');
assert.equal(accrued.debitAccount, 'accrued-income');
assert.equal(accrued.creditAccount, 'sundry-income');
assert(accrued.buildQuestion('A café', '£500').includes('sundry income'));
for (const topic of ['loan', 'allowance', 'drawings', 'purchases', 'sales']) assert.equal(terms.filter(item => item.topic === topic).length, 2, topic);
assert(terms.some(item => item.debitAccount === 'drawings' && item.creditAccount === 'purchases'));
assert(terms.some(item => item.debitAccount === 'receivables' && item.creditAccount === 'sales'));
assert(terms.some(item => item.debitAccount === 'purchases' && item.creditAccount === 'payables'));
for (const term of terms) {
  assert(!/expense/i.test(term.debitName + term.creditName));
  const question = term.buildQuestion('A café', '£500');
  assert(question.endsWith('Record the transaction.'), question);
  assert.equal((question.match(/Record the transaction/g) || []).length, 1);
}
console.log('Passed: accrued income/Sundry income, grouped directions, cash/credit sales and purchases, goods drawings, account labels and transaction instructions.');
