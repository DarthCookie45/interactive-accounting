"use strict";

// Integer pennies throughout. Rates are weekly teaching rates, fixed for the run.
class VanAccounting {
  constructor(random = Math.random) {
    this.random = random;
    this.weekIndex = 0;
    this.entries = [];
    this.opening = {};
    this.snapshots = [];
    this.plans = new Map();
    const depreciationEnabled = random() < 0.8;
    this.config = {
      price: this.integer(25, 45) * 10,
      capital: this.integer(110, 150) * 10000,
      vehicle: this.integer(40, 65) * 10000,
      equipment: this.integer(4, 9) * 10000,
      vehicleRate: this.integer(1, 50), equipmentRate: this.integer(1, 20),
      vehicleDepreciation: depreciationEnabled, equipmentDepreciation: depreciationEnabled,
      allowanceRate: this.integer(1, 10)
    };
    this.accounts = {
      "Bank": "current", "Receivables": "current", "Payables": "currentLiability",
      "Bank loan": "noncurrentLiability", "Motor vehicles": "noncurrent", "Equipment": "noncurrent",
      "Accumulated depreciation: Motor vehicles": "noncurrent", "Accumulated depreciation: Equipment": "noncurrent",
      "Allowance for doubtful receivables": "current", "Owner’s capital": "capital", "Accumulated profit/loss": "capital", "Drawings": "drawings",
      "Sales": "sales", "Purchases": "cost", "Opening inventory (SPL)": "openingCost",
      "Closing inventory – SFP": "current", "Closing inventory – SPL": "closingCost",
      "Rent": "expenses", "Repairs": "expenses", "Wages": "expenses",
      "Depreciation charges": "expenses", "Allowance adjustment (SPL)": "expenses"
    };
    this.makeWeek();
  }
  integer(min, max) { return min + Math.floor(this.random() * (max - min + 1)); }
  static parseMoney(input) {
    let text = String(input).trim().replace(/\u2212/g, "-");
    let negative = false;
    if (text.startsWith("(") && text.endsWith(")")) { negative = true; text = text.slice(1, -1).trim(); }
    if (text.startsWith("-")) { if (negative) return null; negative = true; text = text.slice(1).trim(); }
    if (text.startsWith("£")) text = text.slice(1).trim();
    if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{2})?$/.test(text)) return null;
    const pennies = Math.round(Number(text.replace(/,/g, "")) * 100);
    return Number.isSafeInteger(pennies) ? (negative ? -pennies : pennies) : null;
  }
  makeWeek() {
    this.week = [["Monday", this.weekIndex ? 50 : 0, this.weekIndex ? 70 : 0], ["Tuesday", 53, 73], ["Wednesday", 47, 67], ["Thursday", 62, 82], ["Friday", 76, 96], ["Saturday", 110, 130], ["Sunday", 66, 86]]
      .map(([name, min, max]) => {
        const customers = this.integer(min, max);
        return { name, customers, hotDogs: customers ? customers + this.integer(Math.ceil(customers * .2), Math.ceil(customers * .5)) : 0,
          salePrice: this.config.price, ingredientPrice: this.integer(10, 18) * 10 };
      });
    this.rent = this.integer(20, 40) * 1000;
    this.repair = this.integer(5, 18) * 1000;
    this.hours = this.integer(12, 75) / 2;
    this.hourlyRate = this.integer(1271, 1352);
    this.closingStock = this.integer(20, 50) * 100;
  }
  currentEntries() { return this.entries.filter(entry => entry.week === this.weekIndex); }
  balance(account) {
    return (this.opening[account] || 0) + this.currentEntries().reduce((sum, e) => sum + (e.debit === account ? e.pennies : 0) - (e.credit === account ? e.pennies : 0), 0);
  }
  balances() { return Object.fromEntries(Object.keys(this.accounts).map(account => [account, this.balance(account)])); }
  totals(entries = this.currentEntries()) {
    const balance = account => entries.reduce((sum, e) => sum + (e.debit === account ? e.pennies : 0) - (e.credit === account ? e.pennies : 0), 0);
    const sales = -balance("Sales"), ingredients = balance("Purchases"), openingInventory = balance("Opening inventory (SPL)"), inventory = -balance("Closing inventory – SPL");
    const rent = balance("Rent"), repairs = balance("Repairs"), wages = balance("Wages"), depreciation = balance("Depreciation charges"), allowance = balance("Allowance adjustment (SPL)");
    const costOfSales = openingInventory + ingredients - inventory;
    return { sales, ingredients, openingInventory, inventory, costOfSales, rent, repairs, wages, depreciation, allowance,
      profit: sales - costOfSales - rent - repairs - wages - depreciation - allowance };
  }
  post(entry, day) {
    if (!Number.isSafeInteger(entry.pennies) || entry.pennies <= 0) throw Error("Invalid monetary amount");
    this.entries.push({ ...entry, week: this.weekIndex, day });
  }
  planDay(day, hard, money) {
    const key = this.weekIndex + ":" + day;
    if (this.plans.has(key)) return this.plans.get(key);
    const entries = [];
    const add = (label, debit, credit, pennies, question, explanation, extra = {}) => entries.push({ label, debit, credit, pennies, question: question + " Record the transaction.", explanation, ...extra });
    const c = this.config, data = this.week[day];
    if (day === 0 && this.weekIndex === 0) {
      add("Owner’s investment", "Bank", "Owner’s capital", c.capital, "The owner invests " + money(c.capital) + " into the business bank account.", "The investment increases Bank and Owner’s capital.");
      add("Van purchase", "Motor vehicles", "Bank", c.vehicle, "The business buys a van for " + money(c.vehicle) + ", paid from Bank.", "Motor vehicles increases and Bank decreases.");
      add("Equipment purchase", "Equipment", "Bank", c.equipment, "The business buys cooking equipment for " + money(c.equipment) + ", paid from Bank.", "Equipment increases and Bank decreases.");
    } else {
      const purchase = data.hotDogs * data.ingredientPrice + (day === 6 ? this.closingStock : 0);
      const supplier = day === 1 || day === 4;
      const qtyText = data.hotDogs + " hot dogs at " + money(data.ingredientPrice) + " per hot dog";
      const stockText = day === 6 ? " Add " + money(this.closingStock) + " for unopened ingredients kept for next week." : "";
      add("Ingredient purchases", "Purchases", supplier ? "Payables" : "Bank", purchase,
        hard ? "Buy ingredients for " + qtyText + "." + stockText + (supplier ? " The supplier allows credit; no payment is made today." : " Pay the total from Bank.")
          : "Buy ingredients for a total of " + money(purchase) + (supplier ? " on credit; the supplier will be paid later." : ", paid from Bank.") +
            " This total is " + money(data.hotDogs * data.ingredientPrice) + " for " + data.hotDogs + " hot dogs at " + money(data.ingredientPrice) + " each" +
            (day === 6 ? ", plus " + money(this.closingStock) + " for unopened ingredients kept for next week" : "") + ". Do not add anything to the stated total.",
        supplier ? "Credit purchases increase Purchases and Payables." : "Purchases increases and the payment reduces Bank.");
      const creditSale = day === 1 || day === 4;
      const revenue = data.hotDogs * data.salePrice;
      add("Hot dog sales", creditSale ? "Receivables" : "Bank", "Sales", revenue,
        "Sell " + data.hotDogs + " hot dogs at " + money(data.salePrice) + " each." + (hard ? " Calculate the sales total." : " Sales total " + money(revenue) + ".") +
        (creditSale ? " A local employer buys them on credit for its staff; payment will follow later." : " Customers pay into Bank."),
        creditSale ? "Sales increases and the unpaid customer balance increases Receivables." : "Bank and Sales increase.", { sold: data.hotDogs, customers: data.customers, unitPrice: data.salePrice });
    }
    if (day === 2) {
      const outstanding = this.balance("Receivables");
      if (outstanding > 0) {
        const received = Math.max(1, Math.round(outstanding * this.integer(40, 80) / 100));
        add("Customer settlement", "Bank", "Receivables", received, "A customer pays " + money(received) + " into Bank against an existing credit sale.", "Bank increases and the customer’s Receivables balance decreases; this is not new sales income.");
      }
      if (this.weekIndex === 0 || this.balance("Bank loan") === 0) {
        const loan = this.integer(10, 25) * 10000;
        add("Loan received", "Bank", "Bank loan", loan, "Receive a " + money(loan) + " long-term bank loan into Bank. No instalments are due in the next twelve months; repayments in this activity are voluntary.", "Bank and the loan liability increase; borrowing is not income.");
      }
    }
    if (day === 3) {
      add("Tyre repair", "Repairs", "Bank", this.repair, "A mobile mechanic repairs a tyre. Pay " + money(this.repair) + " from Bank.", "Repairs increases and Bank decreases.");
      const owed = -this.balance("Payables");
      if (owed > 0) {
        const paid = Math.max(1, Math.round(owed * this.integer(30, 75) / 100));
        add("Supplier settlement", "Payables", "Bank", paid, "Pay " + money(paid) + " from Bank to a supplier against an existing credit purchase.", "Payables and Bank decrease; this is not a new purchase.");
      }
    }
    if (day === 4) {
      const amount = this.integer(4, 12) * 10000;
      add("Additional capital", "Bank", "Owner’s capital", amount, "The owner invests a further " + money(amount) + " of personal funds into Bank.", "Bank and the owner’s investment increase.");
      const drawing = this.integer(3, 10) * 1000;
      const goods = this.weekIndex % 2 === 1;
      add(goods ? "Goods drawings" : "Cash drawings", "Drawings", goods ? "Purchases" : "Bank", drawing,
        goods ? "The owner withdraws ingredients costing " + money(drawing) + " for personal use." : "The owner withdraws " + money(drawing) + " from Bank for personal use.",
        "Drawings records the personal withdrawal; " + (goods ? "Purchases is reduced for goods taken." : "Bank decreases."));
    }
    if (day === 5) {
      const wages = Math.round(this.hours * this.hourlyRate);
      add("Assistant wages", "Wages", "Bank", wages, "Pay the catering assistant for " + this.hours + " hours at " + money(this.hourlyRate) + " per hour." + (hard ? " Calculate the payment to the nearest penny." : " The total is " + money(wages) + "."), "Wages increases and Bank decreases.");
      const outstanding = -this.balance("Bank loan");
      if (outstanding > 0) {
        const repayment = Math.min(outstanding, this.integer(10, 30) * 1000);
        add("Loan repayment", "Bank loan", "Bank", repayment, "Repay " + money(repayment) + " of the existing bank loan from Bank. This is principal only; ignore interest.", "The loan liability and Bank decrease.");
      }
    }
    if (day === 6) {
      add("Weekly pitch rent", "Rent", "Bank", this.rent, "Pay the weekly market pitch rent of " + money(this.rent) + " from Bank.", "Rent increases and Bank decreases.");
      add("Closing inventory adjustment", "Closing inventory – SFP", "Closing inventory – SPL", this.closingStock, "The stock count values unused ingredients at " + money(this.closingStock) + ". Record closing inventory for the week.", "Closing inventory is a current asset and reduces cost of sales.");
      for (const [asset, enabled, rate] of [["Motor vehicles", c.vehicleDepreciation, c.vehicleRate], ["Equipment", c.equipmentDepreciation, c.equipmentRate]]) {
        if (!enabled) continue;
        const accumulated = "Accumulated depreciation: " + asset;
        const base = asset === "Motor vehicles" ? this.balance(asset) + this.balance(accumulated) : this.balance(asset);
        const charge = Math.round(base * rate / 100);
        if (charge > 0) add("Depreciation: " + asset, "Depreciation charges", accumulated, charge,
          asset + " is depreciated at the same " + rate + "% weekly teaching rate throughout the activity, using " + (asset === "Motor vehicles" ? "reducing balance on its current carrying amount of " : "straight-line on its original cost of ") + money(base) + ". Calculate this week’s charge to the nearest penny.",
          "The depreciation charge belongs in the SPL. Accumulated depreciation reduces the asset’s carrying amount in the SFP.");
      }
      const receivables = this.balance("Receivables");
      if (receivables > 0) {
        const target = Math.round(receivables * c.allowanceRate / 100);
        const old = -this.balance("Allowance for doubtful receivables");
        const change = target - old;
        if (change) add("Allowance adjustment", change > 0 ? "Allowance adjustment (SPL)" : "Allowance for doubtful receivables", change > 0 ? "Allowance for doubtful receivables" : "Allowance adjustment (SPL)", Math.abs(change),
          "Set the receivables allowance to " + c.allowanceRate + "% of Receivables of " + money(receivables) + ". The existing allowance is " + money(old) + ". Calculate the required adjustment, rounding the target to the nearest penny.",
          "Only the change in the allowance affects this week’s profit; the closing allowance reduces net Receivables.");
      }
    }
    this.plans.set(key, entries);
    return entries;
  }
  finishWeek() {
    if (this.snapshots.some(snapshot => snapshot.week === this.weekIndex)) return;
    const balances = this.balances(), totals = this.totals();
    const nextOpening = {};
    for (const [account, section] of Object.entries(this.accounts)) {
      if (["noncurrent", "current", "currentLiability", "noncurrentLiability", "capital"].includes(section) && balances[account]) nextOpening[account] = balances[account];
    }
    nextOpening["Accumulated profit/loss"] = (balances["Accumulated profit/loss"] || 0) - totals.profit + (balances["Drawings"] || 0);
    this.snapshots.push({ week: this.weekIndex, balances, totals, nextOpening });
  }
  nextWeek() {
    if (this.weekIndex >= 3) return false;
    this.finishWeek();
    this.opening = { ...this.snapshots.at(-1).nextOpening };
    this.weekIndex++;
    this.makeWeek();
    const inventory = this.opening["Closing inventory – SFP"] || 0;
    if (inventory) this.post({ label: "Opening inventory transfer", debit: "Opening inventory (SPL)", credit: "Closing inventory – SFP", pennies: inventory, system: true }, 0);
    return true;
  }
}
if (typeof module !== "undefined") module.exports = VanAccounting;
