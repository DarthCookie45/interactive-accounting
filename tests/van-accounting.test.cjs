const assert = require('node:assert/strict');
const VanAccounting = require('../js/van-accounting.js');
for (let run = 0; run < 200; run++) {
  const game = new VanAccounting();
  // Cover both the persistent-depreciation and never-enabled branches.
  assert.equal(game.config.vehicleDepreciation, game.config.equipmentDepreciation, 'both depreciation methods are enabled together');
  game.config.vehicleDepreciation = run % 2 === 0;
  game.config.equipmentDepreciation = run % 2 === 0;
  const config = { ...game.config };
  for (let week = 0; week < 4; week++) {
    const beforeVehicle = game.balance('Motor vehicles') + game.balance('Accumulated depreciation: Motor vehicles');
    for (let day = 0; day < 7; day++) {
      for (const entry of game.planDay(day, true, pennies => 'GBP ' + pennies)) {
        if (week > 0 && day === 0 && entry.label === 'Ingredient purchases') {
          assert.equal(entry.pennies, game.week[0].hotDogs * game.week[0].ingredientPrice, 'new purchases do not deduct opening stock');
          assert(!entry.question.includes('opening ingredients'));
        }
        if (entry.label === 'Customer settlement') assert(game.balance('Receivables') >= entry.pennies);
        if (entry.label === 'Supplier settlement') assert(-game.balance('Payables') >= entry.pennies);
        if (entry.label === 'Loan repayment') assert(-game.balance('Bank loan') >= entry.pennies);
        if (entry.label === 'Depreciation: Motor vehicles') {
          const base = week ? beforeVehicle : config.vehicle;
          assert.equal(entry.pennies, Math.round(base * config.vehicleRate / 100));
        }
        if (entry.label === 'Depreciation: Equipment') assert.equal(entry.pennies, Math.round(config.equipment * config.equipmentRate / 100));
        game.post(entry, day);
      }
    }
    const balances = game.balances(), totals = game.totals();
    assert.equal(Object.values(balances).reduce((sum, n) => sum + n, 0), 0, 'trial balance');
    const assets = Object.keys(balances).filter(account => ['current', 'noncurrent'].includes(game.accounts[account])).reduce((sum, account) => sum + balances[account], 0);
    assert.equal(assets, -balances['Owner’s capital'] + totals.profit - balances.Drawings - balances.Payables - balances['Bank loan'], 'SFP');
    assert(!Object.hasOwn(balances, 'Accumulated profit/loss'));
    assert.equal(balances['Owner’s capital'], (game.opening['Owner’s capital'] || 0) + game.currentEntries().reduce((sum, entry) => sum + (entry.debit === 'Owner’s capital' ? entry.pennies : 0) - (entry.credit === 'Owner’s capital' ? entry.pennies : 0), 0), 'capital includes brought-forward capital and this week’s investments');
    assert(game.currentEntries().every(entry => !entry.question?.includes('teaching')));
    assert.equal(-balances['Allowance for doubtful receivables'], Math.round(balances.Receivables * config.allowanceRate / 100));
    assert.equal(game.currentEntries().some(entry => entry.label === 'Depreciation: Motor vehicles'), config.vehicleDepreciation);
    assert.equal(game.currentEntries().some(entry => entry.label === 'Depreciation: Equipment'), config.equipmentDepreciation);
    game.finishWeek(); game.finishWeek();
    assert.equal(game.snapshots.length, week + 1, 'closing cannot duplicate');
    assert.equal(game.snapshots.at(-1).nextOpening['Owner’s capital'], balances['Owner’s capital'] - totals.profit + balances.Drawings, 'profit and drawings close directly to capital');
    assert.equal(Object.values(game.snapshots.at(-1).nextOpening).reduce((sum, n) => sum + n, 0), 0);
    if (week < 3) {
      const stock = balances['Closing inventory – SFP'];
      assert(game.nextWeek());
      for (const account of ['Sales', 'Purchases', 'Rent', 'Wages', 'Repairs', 'Drawings', 'Depreciation charges', 'Allowance adjustment (SPL)']) assert.equal(game.balance(account), 0, account + ' must reset');
      assert.equal(game.balance('Opening inventory (SPL)'), stock);
      for (const [account, opening] of Object.entries(game.opening)) {
        if (account !== 'Closing inventory – SFP') assert.equal(game.balance(account), opening);
      }
    } else assert.equal(game.nextWeek(), false, 'stop at four weeks');
    assert.deepEqual(game.config, config, 'rates and selling price remain fixed');
  }
}
console.log('Passed: 200 four-week runs, settlement prerequisites, both depreciation methods and disabled branches, allowance recalculation, balanced closings, carry-forwards and nominal resets.');
for (const [text, expected] of [['-£100', -10000], ['(£100)', -10000], ['-100.00', -10000], ['(100.00)', -10000], ['(£1,234.56)', -123456], ['£100.00', 10000], ['100', 10000], ['0.00', 0], ['−£50.25', -5025]]) {
  assert.equal(VanAccounting.parseMoney(text), expected, text);
}
for (const text of ['', '(-100)', '(100', '-£-100', '1,00.00', '100.001', 'NaN']) assert.equal(VanAccounting.parseMoney(text), null, text);
console.log('Passed: signed, bracketed and pound-prefixed profit/loss input, with malformed amounts rejected.');
