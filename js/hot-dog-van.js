"use strict";

// Add approved words here to expand the name generator.
const firstWords = ["Sizzling", "Golden", "Sunny", "Toasty", "Rocket", "Copper", "Street", "Maple"];
const lastWords = ["Franks", "Buns", "Grill", "Bites", "Dogs", "Diner", "Wagon", "Kitchen"];
const names = firstWords.flatMap((first) => lastWords.map((last) => `${first} ${last}`));

const page = document.querySelector(".hot-dog-page");
const setup = document.querySelector("#van-setup");
const nameDisplay = document.querySelector("#van-name");
const sign = document.querySelector("#van-sign");
const primary = document.querySelector("#van-primary");
const accent = document.querySelector("#van-accent");
const day = document.querySelector("#van-day");
const dayName = document.querySelector("#van-day-name");
let businessName = "";

function rollName() {
  const choices = names.filter((name) => name !== businessName);
  businessName = choices[Math.floor(Math.random() * choices.length)];
  nameDisplay.textContent = businessName;
  sign.textContent = businessName;
}

function updatePaint() {
  page.style.setProperty("--van-primary", primary.value);
  page.style.setProperty("--van-accent", accent.value);
  for (const [name, value] of [["primary", primary.value], ["accent", accent.value]]) {
    const rgb = value.match(/[a-f\d]{2}/gi).map((hex) => {
      const n = parseInt(hex, 16) / 255;
      return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
    });
    const luminance = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
    page.style.setProperty("--van-" + name + "-ink", luminance > 0.179 ? "#111111" : "#ffffff");
  }
}

document.querySelector("#van-roll").addEventListener("click", rollName);
primary.addEventListener("input", updatePaint);
accent.addEventListener("input", updatePaint);

const get = (id) => document.getElementById(id);
const currency = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const money = (pennies) => currency.format((pennies || 0) / 100);
const weeklyRent = 35000;
const equipmentCost = 30000;
const tyreRepair = 8500;
function randomInteger(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

const runSellingPrice = randomInteger(25, 45) * 10;
const assistantHours = randomInteger(12, 75) / 2;
const assistantRate = randomInteger(1271, 1352);
const assistantWages = Math.round(assistantHours * assistantRate);
const closingInventory = randomInteger(30, 80) * 100;
// A shuffled schedule guarantees different task styles within every week.
const salesChallengeModes = ["quantity", "truefalse", "mistake", "journal", "quantity", "mistake"];
for (let i = salesChallengeModes.length - 1; i > 0; i--) {
  const swap = randomInteger(0, i);
  [salesChallengeModes[i], salesChallengeModes[swap]] = [salesChallengeModes[swap], salesChallengeModes[i]];
}

const week = [
  ["Monday", 0, 0], ["Tuesday", 53, 73], ["Wednesday", 47, 67],
  ["Thursday", 62, 82], ["Friday", 76, 96], ["Saturday", 110, 130],
  ["Sunday", 66, 86]
].map(([name, min, max]) => {
  const customers = randomInteger(min, max);
  return ({
  name,
  customers,
  hotDogs: customers + (customers ? randomInteger(Math.ceil(customers * 0.2), Math.ceil(customers * 0.5)) : 0),
  salePrice: runSellingPrice,
  ingredientPrice: randomInteger(10, 18) * 10
});
});
const accountNames = ["Bank", "Closing inventory – SFP", "Closing inventory – SPL", "Equipment", "Motor vehicles", "Owner’s capital", "Purchases", "Rent expense", "Repairs expense", "Sales", "Wages expense"];
const form = get("van-journal-form");
const debit = get("van-debit");
const credit = get("van-credit");
const debitAmount = get("van-debit-amount");
const creditAmount = get("van-credit-amount");
const checkEntry = form.querySelector('button[type="submit"]');
const hint = get("van-hint");
const hintText = get("van-hint-text");
const nextEntry = get("van-journal-next");
const feedback = get("van-journal-feedback");
const postedEntries = [];
const achievements = new Set();
let dayIndex = 0;
let entryIndex = 0;
let journal = [];
let score = 0;
let hardMode = false;
let streak = 0;
let bestStreak = 0;
let usedHint = false;
let missedEntry = false;
let dayMistakes = 0;
let weekMistakes = 0;
let weekHints = 0;
let dayScore = 0;
let reportTrigger = null;

const challengePanel = document.createElement("div");
challengePanel.className = "van-sales-challenge mb-3";
challengePanel.hidden = true;
const challengeLabel = document.createElement("label");
challengeLabel.className = "form-label fw-bold";
const quantityAnswer = document.createElement("input");
quantityAnswer.id = "van-quantity-answer";
quantityAnswer.className = "form-control";
quantityAnswer.type = "number";
quantityAnswer.min = "1";
quantityAnswer.step = "1";
quantityAnswer.inputMode = "numeric";
const choiceAnswer = document.createElement("select");
choiceAnswer.id = "van-choice-answer";
choiceAnswer.className = "form-select";
challengePanel.append(challengeLabel, quantityAnswer, choiceAnswer);
form.insertBefore(challengePanel, form.firstChild);

function buildSalesChallenge(entry, mode) {
  const price = week[dayIndex].salePrice;
  const proposal = "Debit Bank " + money(entry.pennies) + "; credit Sales " + money(entry.pennies) + ".";
  if (mode === "quantity") return {
    mode, answer: String(entry.sold),
    question: "Work backwards: " + businessName + " has recorded these sales: " + proposal + " Every hot dog sold for " + money(price) + ", with no discounts or refunds. How many hot dogs were sold?",
    hint: "List what is known: total takings and the price of one item. Think about the relationship between quantity, unit price and total. Check your estimate by rebuilding the takings.",
    explanation: money(entry.pennies) + " ÷ " + money(price) + " = " + entry.sold + " hot dogs. " + entry.explanation
  };
  if (mode === "truefalse") {
    const valid = Math.random() < 0.5;
    return {
      mode, answer: String(valid), options: [["true", "True"], ["false", "False"]],
      question: "True or false? " + businessName + " receives " + money(entry.pennies) + " into Bank for hot dog sales. A trainee proposes: " + (valid ? proposal : "Debit Sales " + money(entry.pennies) + "; credit Bank " + money(entry.pennies) + ".") + " Does the whole entry correctly record this sale?",
      hint: "Trace what happened to the money, then consider what the sale represents. Check both account sides; equal amounts alone do not make an entry correct.",
      explanation: (valid ? "The proposed entry is correct. " : "The sides in the proposal were reversed. ") + entry.explanation
    };
  }
  const error = randomInteger(0, 2);
  const proposed = error === 0 ? "Debit Sales; credit Bank" : error === 1 ? "Debit Equipment; credit Sales" : "Debit Bank; credit Owner’s capital";
  const alternatives = [
    ["correct", "Debit Bank; credit Sales"], ["reversed", "Debit Sales; credit Bank"],
    ["capital", "Debit Bank; credit Owner’s capital"], ["asset", "Debit Equipment; credit Sales"]
  ];
  alternatives.sort((a, b) => a[1].localeCompare(b[1], "en-GB"));
  return {
    mode: "mistake", answer: "correct", options: alternatives,
    question: "Find and correct the mistake: " + businessName + " receives " + money(entry.pennies) + " from customers into Bank. The trainee records “" + proposed + "”, using " + money(entry.pennies) + " on each side. Choose the corrected entry.",
    hint: "Consider the source of the receipt and where it arrived. Check whether the proposed accounts describe that event, then apply the normal-balance rules.",
    explanation: "The corrected entry debits Bank and credits Sales. " + entry.explanation
  };
}

function showSalesChallenge(entry) {
  const challenge = entry.challenge;
  challengePanel.hidden = !challenge;
  form.querySelector(".van-journal-grid").hidden = Boolean(challenge);
  get("van-money-format").hidden = Boolean(challenge);
  for (const field of [debit, credit, debitAmount, creditAmount]) {
    field.required = !challenge;
    field.disabled = Boolean(challenge);
  }
  quantityAnswer.value = "";
  quantityAnswer.hidden = quantityAnswer.disabled = !challenge || challenge.mode !== "quantity";
  quantityAnswer.required = !quantityAnswer.disabled;
  choiceAnswer.hidden = choiceAnswer.disabled = !challenge || challenge.mode === "quantity";
  choiceAnswer.required = !choiceAnswer.disabled;
  choiceAnswer.replaceChildren();
  checkEntry.textContent = challenge ? "Check answer" : "Check entry";
  if (!challenge) return;
  get("van-journal-question").textContent = challenge.question;
  challengeLabel.htmlFor = challenge.mode === "quantity" ? quantityAnswer.id : choiceAnswer.id;
  challengeLabel.textContent = challenge.mode === "quantity" ? "Hot dogs sold (whole number)" : "Your answer";
  if (challenge.options) {
    choiceAnswer.add(new Option("Choose an answer", ""));
    challenge.options.forEach(([value, text]) => choiceAnswer.add(new Option(text, value)));
  }
}

for (const select of [debit, credit]) {
  select.add(new Option("Choose an account", ""));
  for (const account of accountNames) select.add(new Option(account, account));
}

function buildJournal() {
  const { name, hotDogs: customers, salePrice, ingredientPrice } = week[dayIndex];
  const ingredients = customers * ingredientPrice + (dayIndex === 6 ? closingInventory : 0);
  const revenue = customers * salePrice;
  const entries = [
    {
      label: name + " ingredients", debit: "Purchases", credit: "Bank", pennies: ingredients,
      question: hardMode
        ? businessName + " buys ingredients for " + customers + " hot dogs at " + money(ingredientPrice) + " each." + (dayIndex === 6 ? " It also buys " + money(closingInventory) + " of unopened ingredients for next week." : "") + " Calculate the total purchase paid from Bank."
        : businessName + " pays " + money(ingredients) + " from Bank for ingredients (" + customers + " hot dogs at " + money(ingredientPrice) + " each" + (dayIndex === 6 ? ", plus " + money(closingInventory) + " of unopened ingredients for next week" : "") + "). Record the purchase.",
      explanation: "Ingredients used increase the expense. Paying the supplier reduces Bank."
    },
    {
      label: name + " sales", debit: "Bank", credit: "Sales", pennies: revenue, sold: customers,
      question: businessName + " sells " + customers + " hot dogs at " + money(salePrice) + " each. " +
        (hardMode ? "Customers pay into Bank. Calculate and record the total sales."
          : "Customers pay " + money(revenue) + " into Bank. Record the sale."),
      explanation: "Bank increases and Sales records the revenue earned."
    }
  ];
  if (dayIndex === 0) {
    return [
      {
        label: "Owner’s investment", debit: "Bank", credit: "Owner’s capital", pennies: 1000000,
        question: "You invest £10,000 of your own money into the bank account for " + businessName + ".",
        explanation: "Bank increases and the owner’s investment increases capital."
      },
      {
        label: "Van purchase", debit: "Motor vehicles", credit: "Bank", pennies: 600000,
        question: businessName + " buys its van for £6,000 and pays immediately from Bank.",
        explanation: "The van increases non-current assets and the payment reduces Bank."
      },
      {
        label: "Equipment purchase", debit: "Equipment", credit: "Bank", pennies: equipmentCost,
        question: businessName + " pays " + money(equipmentCost) + " from Bank for a hot dog warmer and serving equipment to use throughout the week.",
        explanation: "The equipment is an asset. Paying for it reduces Bank."
      }
    ];
  }
  if (name === "Thursday") {
    entries.push({
      label: "Tyre repair", debit: "Repairs expense", credit: "Bank", pennies: tyreRepair,
      question: "A mobile mechanic repairs a puncture in the van’s tyre. " + businessName + " pays " + money(tyreRepair) + " from Bank.",
      explanation: "The repair keeps the van working, so it is an expense. The payment reduces Bank."
    });
  }
  if (dayIndex === week.length - 1) {
    entries.push({
      label: "Weekly pitch rent", debit: "Rent expense", credit: "Bank", pennies: weeklyRent,
      question: businessName + " pays " + money(weeklyRent) + " from Bank for a week’s market pitch rent.",
      explanation: "Pitch rent increases the week’s expenses and the payment reduces Bank."
    });
    entries.push({
      label: "Closing inventory adjustment", debit: "Closing inventory – SFP", credit: "Closing inventory – SPL", pennies: closingInventory,
      question: businessName + " has " + money(closingInventory) + " of unused ingredients at Sunday’s close. Record the closing inventory adjustment for the SPL and SFP.",
      explanation: "Closing inventory is a current asset and reduces the cost of sales for the week. Bank is unchanged."
    });
  }
  if (name === "Saturday") entries.push({
    label: "Catering assistant wages", debit: "Wages expense", credit: "Bank", pennies: assistantWages,
    question: businessName + " pays its catering assistant for " + assistantHours + " hours at " + money(assistantRate) + " per hour. " + (hardMode ? "Calculate the wages to the nearest penny and record the Bank payment." : "The wages total " + money(assistantWages) + ". Record the Bank payment."),
    explanation: "Wages increase expenses and the payment reduces Bank."
  });
  return entries;
}

function balanceFor(account, entries = postedEntries) {
  return entries.reduce((balance, entry) => {
    if (entry.debit === account) return balance + entry.pennies;
    if (entry.credit === account) return balance - entry.pennies;
    return balance;
  }, 0);
}

function totalsFor(entries) {
  const sales = -balanceFor("Sales", entries);
  const ingredients = balanceFor("Purchases", entries);
  const rent = balanceFor("Rent expense", entries);
  const repairs = balanceFor("Repairs expense", entries);
  const wages = balanceFor("Wages expense", entries);
  const inventory = -balanceFor("Closing inventory – SPL", entries);
  return { sales, ingredients, rent, repairs, wages, inventory, profit: sales - ingredients + inventory - rent - repairs - wages };
}

function soldFor(entries) {
  return entries.reduce((total, entry) => total + (entry.sold || 0), 0);
}

function updateStats() {
  if (score > 3000) achievements.add("I love you 3000");
  get("van-stat-score").textContent = score.toLocaleString("en-GB");
  get("van-stat-streak").textContent = streak;
  get("van-stat-bank").textContent = money(balanceFor("Bank"));
  get("van-stat-sold").textContent = soldFor(postedEntries);
  const today = postedEntries.filter((entry) => entry.day === dayIndex);
  get("van-today-customers").textContent = week[dayIndex].customers;
  get("van-today-sold").textContent = soldFor(today);
  get("van-today-sales").textContent = money(totalsFor(today).sales);
}

function renderLedger(container) {
  container.replaceChildren();
  if (!postedEntries.length) {
    if (container.id !== "van-ledger") container.textContent = "No journal entries posted yet.";
    return;
  }
  const weekClosed = postedEntries.some((entry) => entry.label === "Closing inventory adjustment");
  const accounts = new Set(postedEntries.flatMap((entry) => [entry.debit, entry.credit]));
  for (const account of accounts) {
    const card = document.createElement("section");
    card.className = "van-ledger-card";
    const heading = document.createElement("h4");
    heading.textContent = account;
    const sides = document.createElement("div");
    sides.className = "van-t-account";
    const capitalTransfer = weekClosed && account === "Owner’s capital"
      ? totalsFor(postedEntries).profit : 0;
    const balance = balanceFor(account) - capitalTransfer;
    const permanent = ["Bank", "Equipment", "Motor vehicles", "Owner’s capital", "Closing inventory – SFP"].includes(account);
    const balancedTotal = postedEntries.reduce((sum, entry) =>
      sum + (entry.debit === account ? entry.pennies : 0), 0) +
      Math.max(0, -capitalTransfer) + Math.max(0, -balance);

    for (const side of ["debit", "credit"]) {
      const column = document.createElement("div");
      const debitSide = side === "debit";
      const label = document.createElement("strong");
      label.textContent = debitSide ? "Debit" : "Credit";
      column.append(label);

      function addLine(narrative, pennies, className = "") {
        const row = document.createElement("div");
        row.className = "van-ledger-line " + className;
        const description = document.createElement("span");
        const amount = document.createElement("span");
        description.textContent = narrative;
        amount.textContent = money(pennies);
        row.append(description, amount);
        column.append(row);
      }

      for (const entry of postedEntries.filter((item) => item[side] === account)) {
        addLine(entry[debitSide ? "credit" : "debit"], entry.pennies);
      }
      if (weekClosed) {
        if (capitalTransfer && debitSide === (capitalTransfer < 0)) {
          addLine(capitalTransfer > 0 ? "Profit transfer" : "Loss transfer",
            Math.abs(capitalTransfer), resultClass(capitalTransfer));
        }
        if (balance && debitSide === (balance < 0)) {
          addLine(permanent ? "Balance c/d" : "Profit or loss transfer", Math.abs(balance));
        }
        addLine("Total", balancedTotal, "van-ledger-total");
        if (permanent && balance) {
          if (debitSide === (balance > 0)) addLine("Balance b/d", Math.abs(balance));
          else {
            const spacer = document.createElement("div");
            spacer.className = "van-ledger-spacer";
            column.append(spacer);
          }
        }
      }
      sides.append(column);
    }
    const total = document.createElement("p");
    total.className = "van-ledger-balance";
    total.textContent = "Balance: " + money(Math.abs(balance)) + (balance > 0 ? " Dr" : balance < 0 ? " Cr" : "");
    card.append(heading, sides);
    if (!weekClosed) card.append(total);
    container.append(card);
  }
}

function showEntry() {
  form.reset();
  for (const field of [debit, credit, debitAmount, creditAmount, checkEntry, hint]) field.disabled = false;
  usedHint = false;
  missedEntry = false;
  hintText.hidden = true;
  hint.setAttribute("aria-expanded", "false");
  get("van-journal-step").textContent = "Transaction " + (entryIndex + 1) + " of " + journal.length;
  get("van-journal-question").textContent = journal[entryIndex].question;
  showSalesChallenge(journal[entryIndex]);
  feedback.textContent = "";
  feedback.hidden = true;
  nextEntry.hidden = true;
}

function startDay() {
  entryIndex = 0;
  dayMistakes = 0;
  dayScore = score;
  journal = buildJournal();
  journal.forEach((entry) => {
    if (entry.credit === "Sales" && salesChallengeModes[dayIndex - 1] !== "journal") {
      entry.challenge = buildSalesChallenge(entry, salesChallengeModes[dayIndex - 1]);
    }
  });
  get("van-day-label").textContent = week[dayIndex].name + " · Day " + (dayIndex + 1) + " of " + week.length +
    (hardMode ? " · Hard" : " · Easy");
  get("van-journal-panel").hidden = false;
  get("van-day-summary").hidden = true;
  showEntry();
  updateStats();
  get("van-journal-title").focus();
}

get("van-guide-next").addEventListener("click", () => {
  get("van-guide").hidden = true;
  setup.hidden = false;
  get("van-setup-title").focus();
});

get("van-start").addEventListener("click", () => {
  hardMode = get("van-difficulty").value === "hard";
  dayName.textContent = businessName;
  setup.hidden = true;
  day.hidden = false;
  get("van-nav-stats").hidden = false;
  startDay();
});

function entryHint(entry) {
  if (entry.challenge) return entry.challenge.hint;
  if (entry.debit === "Wages expense") return "Write down hours and hourly pay separately. Work out what the units tell you to do, then round only the final result to the nearest penny. Which two parts of the business change when staff are paid?";
  if (entry.debit === "Closing inventory – SFP") return "Some ingredients will benefit next week. Think about how to avoid charging this week for ingredients not yet used, and where the remaining value should appear.";
  if (entry.debit === "Purchases") return "Separate the cost of ingredients from the equipment used to prepare them. Work through the quantities and prices, including any extra stock mentioned, and consider how paying a supplier changes the business.";
  if (entry.credit === "Owner’s capital") return "Ask where the money came from. Has the business earned it by serving a customer, borrowed it, or received an investment from its owner? Then consider what changed when it arrived.";
  if (["Motor vehicles", "Equipment"].includes(entry.debit)) return "Will this purchase help the business for more than one period? Distinguish that benefit from a running cost, then consider how it was paid for.";
  if (entry.credit === "Sales") return "Distinguish the money received from the reason it was earned. Identify the two account categories and apply the normal-balance rules you have learnt.";
  return "Identify what the business received or used, whether it is a running cost or lasting benefit, and how it was paid for. Decide which account categories change before choosing sides.";
}

hint.addEventListener("click", () => {
  if (checkEntry.disabled) return;
  usedHint = true;
  weekHints += 1;
  const entry = journal[entryIndex];
  hintText.textContent = entryHint(entry);
  hintText.hidden = false;
  hint.setAttribute("aria-expanded", "true");
  hint.disabled = true;
  updateStats();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (checkEntry.disabled || !form.reportValidity()) return;

  const entry = journal[entryIndex];
  const decimalAmount = /^(?:\d+|\d{1,3}(?:,\d{3})+)\.\d{2}$/;
  const debitText = debitAmount.value.trim();
  const creditText = creditAmount.value.trim();
  if (!entry.challenge && ![debitText, creditText].every((value) => decimalAmount.test(value))) {
    feedback.className = "alert alert-warning mt-3 mb-2";
    feedback.hidden = false;
    feedback.textContent = "Enter both amounts with exactly two decimal places, including .00 for whole pounds. For example, 10000.00.";
    return;
  }
  const pennies = (value) => Number(value.replace(/[,.]/g, ""));
  const response = entry.challenge?.mode === "quantity" ? quantityAnswer.value : choiceAnswer.value;
  const accountsMatch = entry.challenge
    ? entry.challenge.mode === "quantity" ? Number(response) === Number(entry.challenge.answer) : response === entry.challenge.answer
    : debit.value === entry.debit && credit.value === entry.credit;
  const amountsMatch = Boolean(entry.challenge) || pennies(debitText) === entry.pennies && pennies(creditText) === entry.pennies;
  if (!accountsMatch || !amountsMatch) {
    missedEntry = true;
    dayMistakes += 1;
    weekMistakes += 1;
    const previousStreak = streak;
    streak = 0;
    if (hardMode) score -= 100;
    feedback.className = "alert alert-danger mt-3 mb-2";
    feedback.hidden = false;
    const detail = entry.challenge ? "Re-read the event and check your reasoning. Use a hint for guidance, then try again." : accountsMatch ? "Use the transaction amount on both sides." : "Check which accounts change and which side each belongs on.";
    feedback.textContent = "Entry not posted. " + detail +
      (previousStreak ? " Your streak of " + previousStreak + " ended." : "") +
      (hardMode ? " −100 points." : "") + " Try again.";
    updateStats();
    return;
  }

  for (const field of [debit, credit, debitAmount, creditAmount, checkEntry, hint, quantityAnswer, choiceAnswer]) field.disabled = true;
  if (!usedHint && !missedEntry) streak += 1;
  bestStreak = Math.max(bestStreak, streak);
  const fullPoints = hardMode ? 200 : 100;
  const basePoints = usedHint ? fullPoints / 2 : fullPoints;
  const bonus = streak * (usedHint ? 5 : 10);
  const points = basePoints + bonus;
  score += points;
  postedEntries.push({ ...entry, day: dayIndex });
  achievements.add("First entry");
  if (streak >= 5) achievements.add("Five in a row");
  get("van-ledger-empty").hidden = true;
  renderLedger(get("van-ledger"));
  updateStats();
  feedback.className = "alert alert-success mt-3 mb-2";
  feedback.hidden = false;
  feedback.textContent = "Entry posted. " + (entry.challenge?.explanation || entry.explanation) + " Score +" + points + " points.";
  const today = totalsFor(postedEntries.filter((item) => item.day === dayIndex));
  const trading = document.createElement("strong");
  trading.className = "d-block mt-1 " + resultClass(today.profit);
  trading.textContent = "Posted today: " + money(today.sales) + " sales · " + resultLabel(today.profit);
  feedback.prepend(trading);
  nextEntry.textContent = entryIndex === journal.length - 1 ? "View day results" : "Next transaction";
  nextEntry.hidden = false;
  nextEntry.focus({ preventScroll: true });
});

function resultClass(amount) {
  return amount > 0 ? "van-profit" : amount < 0 ? "van-loss" : "";
}

function resultLabel(amount) {
  if (!amount) return "Break-even · £0.00";
  return (amount > 0 ? "Profit " : "Loss ") + money(Math.abs(amount));
}

function renderSummary(rows) {
  const list = get("van-summary-stats");
  list.replaceChildren();
  for (const [label, value, className] of rows) {
    const row = document.createElement("div");
    const term = document.createElement("dt");
    const detail = document.createElement("dd");
    term.textContent = label;
    detail.textContent = value;
    if (className) detail.className = className;
    row.append(term, detail);
    list.append(row);
  }
}

function showSummary(final = false) {
  const today = postedEntries.filter((entry) => entry.day === dayIndex);
  const totals = totalsFor(final ? postedEntries : today);
  if (!dayMistakes) achievements.add("Perfect day");
  if (dayIndex === week.length - 1 && trialComplete() && statementExercise.sfpComplete) {
    if (!weekHints) achievements.add("No hints please!");
    if (!weekMistakes) achievements.add("Perfect Week");
    if (totalsFor(postedEntries).profit > 0) achievements.add("In the black");
  }
  if (score > 3000) achievements.add("I love you 3000");
  get("van-journal-panel").hidden = true;
  get("van-day-summary").hidden = false;
  get("van-live-sidebar").hidden = final;
  get("van-final-art").hidden = !final;
  if (final && !get("van-final-artwork").children.length) {
    const art = setup.querySelector("svg").cloneNode(true);
    art.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
    art.removeAttribute("aria-labelledby");
    art.setAttribute("aria-label", businessName + " customised van");
    get("van-final-artwork").append(art);
  }
  get("van-summary-title").textContent = businessName + " · " +
    (final ? "Week complete!" : week[dayIndex].name + " complete!");
  get("van-summary-message").textContent = final
    ? "You’ve completed seven trading days. Open the reports to see how your journals build the financial statements."
    : dayMistakes ? "All entries posted. Keep using your ledger to check how each transaction changes the business."
      : "All entries posted without a mistake. Well done!";
  renderSummary([
    ["Sales revenue", money(totals.sales)],
    ["Profit or loss", resultLabel(totals.profit), resultClass(totals.profit)],
    ["Score", final ? score.toLocaleString("en-GB") : (score - dayScore).toLocaleString("en-GB", { signDisplay: "exceptZero" }) + " today · " + score.toLocaleString("en-GB") + " total"],
    ["Bank", money(balanceFor("Bank"))],
    ["Hot dogs sold", soldFor(final ? postedEntries : today)],
    ["Entries posted", (final ? postedEntries : today).length],
    ["Best streak", bestStreak]
  ]);
  const badges = get("van-achievements");
  badges.replaceChildren();
  for (const badge of achievements) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "van-achievement-button";
    button.textContent = badge;
    button.addEventListener("click", showAchievements);
    item.append(button);
    badges.append(item);
  }
  const next = get("van-next-day");
  next.hidden = final;
  const sunday = dayIndex === 6;
  next.disabled = sunday && (!trialComplete() || !statementExercise.sfpComplete);
  get("van-trial-required").hidden = !sunday || !next.disabled;
  get("van-trial-required").textContent = trialComplete()
    ? "Build and check your financial statements to view the final results."
    : "Complete the end-of-week Trial Balance Exercise, then build your financial statements.";
  get("van-trial-open").hidden = !sunday;
  get("van-day-summary").querySelector('[data-van-report="statements"]').hidden = !sunday || !trialComplete();
  get("van-trial-open").textContent = trialComplete() ? "Trial balance" : "Complete Trial Balance Exercise";
  updateReportNavigation();
  next.textContent = dayIndex === week.length - 1 ? "View final results" : "Start " + week[dayIndex + 1].name;
  get("van-summary-title").focus();
}

nextEntry.addEventListener("click", () => {
  if (nextEntry.hidden || !checkEntry.disabled) return;
  entryIndex += 1;
  if (entryIndex < journal.length) {
    showEntry();
    debit.focus();
  } else {
    showSummary();
  }
});

get("van-next-day").addEventListener("click", () => {
  if (get("van-next-day").disabled || get("van-next-day").hidden) return;
  if (dayIndex === week.length - 1) {
    showSummary(true);
  } else {
    dayIndex += 1;
    startDay();
  }
});

function addReportTable(container, title, headings, rows) {
  const table = document.createElement("table");
  table.className = "table table-sm align-middle";
  const caption = table.createCaption();
  caption.className = "caption-top fw-bold";
  caption.textContent = title;
  const header = table.createTHead().insertRow();
  for (const heading of headings) {
    const cell = document.createElement("th");
    cell.scope = "col";
    cell.textContent = heading;
    header.append(cell);
  }
  const body = table.createTBody();
  for (const row of rows) {
    const line = body.insertRow();
    for (const value of row) {
      const cell = line.insertCell();
      if (value instanceof HTMLElement) {
        cell.append(value);
      } else if (typeof value === "object") {
        cell.textContent = resultLabel(value.profit);
        cell.className = resultClass(value.profit);
      } else {
        cell.textContent = value;
      }
    }
  }
  container.append(table);
}

const trialExercises = new Map();
const statementExercise = { placed: new Map(), splComplete: false, sfpComplete: false, stage: "spl" };

function trialComplete() {
  const exercise = trialExercises.get(dayIndex);
  return Boolean(exercise && exercise.complete);
}

const achievementDescriptions = {
  "First entry": "Post your first correct journal entry.",
  "Perfect day": "Post all journal entries for a day without an incorrect submission. Hints are allowed.",
  "Five in a row": "Reach a streak of five correct first-try journal entries.",
  "In the black": "Complete the week and final exercises with a positive profit.",
  "No hints please!": "Complete the week without using any journal or trial balance hints.",
  "Perfect Week": "Complete the week with no incorrect submitted answers in journals or final exercises.",
  "I love you 3000": "Score over 3000 points."
};

function achievementProgress(name) {
  const counts = [3, 2, 2, 3, 2, 3, 4];
  const days = counts.filter((count, index) => postedEntries.filter((entry) => entry.day === index).length >= count).length;
  const earned = achievements.has(name);
  const targets = { "First entry": 1, "Perfect day": 1, "Five in a row": 5, "I love you 3000": 3001 };
  const target = targets[name] || 7;
  let value = name === "First entry" ? postedEntries.length : name === "Perfect day" ? Number(earned) : name === "Five in a row" ? bestStreak : name === "I love you 3000" ? score : days;
  const blocked = name === "No hints please!" && weekHints > 0 || name === "Perfect Week" && weekMistakes > 0;
  const note = earned ? "Unlocked" : blocked ? "Unavailable this run — try again in a new game."
    : name === "In the black" ? "Finish the week and final exercises with a profit."
    : days === 7 && target === 7 ? "Complete the final exercises to unlock." : "In progress";
  return { value: earned ? target : Math.max(0, Math.min(target, value)), target, earned, note };
}

function showAchievements() {
  const list = get("van-achievement-guide");
  list.replaceChildren();
  const icons = { "First entry": "📝", "Perfect day": "⭐", "Five in a row": "🔥", "In the black": "📈", "No hints please!": "🧠", "Perfect Week": "🏆", "I love you 3000": "🚀" };
  const entries = Object.entries(achievementDescriptions).sort(([a], [b]) => Number(achievements.has(b)) - Number(achievements.has(a)));
  for (const [name, description] of entries) {
    const progress = achievementProgress(name);
    const item = document.createElement("li");
    item.className = "van-achievement-card " + (progress.earned ? "is-unlocked" : "is-locked");
    const picture = document.createElement("span");
    picture.className = "van-achievement-picture";
    picture.setAttribute("aria-hidden", "true");
    const icon = document.createElement("span");
    icon.className = "van-achievement-icon";
    icon.textContent = icons[name];
    picture.append(icon);
    if (!progress.earned) {
      const lock = document.createElement("span");
      lock.className = "van-achievement-lock";
      lock.textContent = "🔒";
      picture.append(lock);
    }
    const content = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = name;
    const detail = document.createElement("p");
    detail.textContent = description;
    const tracker = document.createElement("p");
    tracker.className = "van-achievement-tracker";
    tracker.textContent = progress.value.toLocaleString("en-GB") + "/" + progress.target.toLocaleString("en-GB") + " · " + progress.note;
    const bar = document.createElement("progress");
    bar.max = progress.target;
    bar.value = progress.value;
    bar.setAttribute("aria-label", name + " progress");
    content.append(title, detail, tracker, bar);
    item.append(picture, content);
    list.append(item);
  }
  get("van-achievement-dialog").showModal();
}
get("van-show-achievements").addEventListener("click", showAchievements);
get("van-close-achievements").addEventListener("click", () => get("van-achievement-dialog").close());


function renderTrialBalance(container) {
  const rows = accountNames.map((account) => ({ account, balance: balanceFor(account) })).filter((row) => row.balance);
  if (!trialExercises.has(dayIndex)) {
    const tiles = rows.map((row, id) => ({ id, pennies: Math.abs(row.balance) }));
    for (let i = tiles.length - 1; i > 0; i--) {
      const swap = randomInteger(0, i);
      [tiles[i], tiles[swap]] = [tiles[swap], tiles[i]];
    }
    trialExercises.set(dayIndex, { tiles, placed: new Map(), hinted: false, complete: false });
  }
  const exercise = trialExercises.get(dayIndex);
  let selected = null;
  const guidance = document.createElement("p");
  guidance.textContent = "Place every balance in its debit or credit column. Drag amounts or select an amount and its destination. You can move them again before checking. Totals update live; select Check entry to mark your work.";
  const pool = document.createElement("div");
  pool.className = "van-trial-pool d-flex flex-wrap gap-2 mb-3";
  pool.setAttribute("aria-label", "Available balance tiles");
  const status = document.createElement("p");
  status.setAttribute("role", "status");
  status.tabIndex = -1;
  status.hidden = true;
  function message(text, style) {
    status.textContent = text;
    status.className = "alert mt-3 " + style;
    status.hidden = false;
  }
  const hints = [
    "Use the difference between an account’s two T-account sides, rather than adding all its transactions.",
    "Consider the type of each account and its normal balance. Then check whether this week’s transactions leave a debit or credit balance.",
    "Matching totals do not guarantee correct accounts. Compare each row’s balance with its own T-account."
  ];
  let hintIndex = 0;
  const hintButton = document.createElement("button");
  hintButton.type = "button";
  hintButton.className = "btn van-hint-button";
  hintButton.textContent = "Hint · half points";
  hintButton.addEventListener("click", () => {
    if (exercise.complete) return;
    if (!exercise.hinted) weekHints++;
    exercise.hinted = true;
    message(hints[hintIndex++ % hints.length], "van-hint-box");
  });
  const check = document.createElement("button");
  check.type = "button";
  check.className = "btn btn-primary";
  check.textContent = "Check entry";
  const controls = document.createElement("div");
  controls.className = "d-flex flex-wrap gap-2 mt-3";
  controls.append(check, hintButton);
  const tileButtons = new Map();
  const cells = new Map();
  let totalsRow;
  function refresh() {
    const used = new Set(exercise.placed.values());
    tileButtons.forEach((button, id) => {
      button.hidden = used.has(id);
      button.disabled = exercise.complete;
      button.setAttribute("aria-pressed", String(selected === id));
    });
    let dr = 0, cr = 0;
    cells.forEach((button, key) => {
      const id = exercise.placed.get(key);
      const tile = exercise.tiles.find((item) => item.id === id);
      const [row, side] = key.split(":");
      button.textContent = tile ? money(tile.pennies) : "Place tile";
      button.setAttribute("data-filled", String(Boolean(tile)));
      button.setAttribute("aria-label", rows[Number(row)].account + ", " + side + ", " + button.textContent);
      button.setAttribute("aria-pressed", String(tile !== undefined && selected === id));
      button.disabled = exercise.complete;
      button.draggable = Boolean(tile) && !exercise.complete;
      if (tile) { if (side === "debit") dr += tile.pennies; else cr += tile.pennies; }
    });
    totalsRow.cells[1].textContent = money(dr);
    totalsRow.cells[2].textContent = money(cr);
    check.disabled = exercise.complete;
    hintButton.hidden = exercise.complete;
    returnTile.disabled = returnAll.disabled = exercise.complete;
  }
  function move(id, destination) {
    if (exercise.complete || !exercise.tiles.some((tile) => tile.id === id)) return;
    for (const [key, value] of exercise.placed) if (value === id) exercise.placed.delete(key);
    if (destination !== null) exercise.placed.set(destination, id);
    selected = null;
    status.hidden = true;
    refresh();
  }
  function drag(button, readId) {
    button.addEventListener("dragstart", (event) => {
      const id = readId();
      if (exercise.complete || id === undefined) event.preventDefault();
      else event.dataTransfer.setData("text/plain", String(id));
    });
  }
  function drop(button, destination) {
    button.addEventListener("dragover", (event) => event.preventDefault());
    button.addEventListener("drop", (event) => {
      event.preventDefault();
      const value = event.dataTransfer.getData("text/plain");
      if (/^\d+$/.test(value)) move(Number(value), destination);
    });
  }
  for (const tile of exercise.tiles) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-outline-primary";
    button.textContent = money(tile.pennies);
    button.draggable = true;
    button.addEventListener("click", () => { selected = tile.id; refresh(); });
    drag(button, () => tile.id);
    tileButtons.set(tile.id, button);
    pool.append(button);
  }
  drop(pool, null);
  const returnTile = document.createElement("button");
  returnTile.type = "button";
  returnTile.className = "btn btn-outline-secondary";
  returnTile.textContent = "Return selected amount to tray";
  returnTile.addEventListener("click", () => { if (selected !== null) move(selected, null); });
  const returnAll = document.createElement("button");
  returnAll.type = "button";
  returnAll.className = "btn btn-outline-secondary";
  returnAll.textContent = "Return all amounts";
  returnAll.addEventListener("click", () => {
    if (exercise.complete) return;
    exercise.placed.clear();
    selected = null;
    status.hidden = true;
    refresh();
  });
  const trayControls = document.createElement("div");
  trayControls.className = "d-flex flex-wrap gap-2 mb-3";
  trayControls.append(returnTile, returnAll);
  const tableRows = rows.map((row, index) => [
    row.account, ...["debit", "credit"].map((side) => {
      const key = index + ":" + side;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-sm btn-outline-secondary van-trial-blank";
      button.addEventListener("click", () => {
        if (selected !== null) move(selected, key);
        else if (exercise.placed.has(key)) { selected = exercise.placed.get(key); refresh(); }
      });
      drag(button, () => exercise.placed.get(key));
      drop(button, key);
      cells.set(key, button);
      return button;
    })
  ]);
  tableRows.push(["Totals", money(0), money(0)]);
  container.append(guidance, pool, trayControls);
  addReportTable(container, "Trial balance before closing entries", ["Account", "Debit", "Credit"], tableRows);
  totalsRow = container.querySelector("table tbody tr:last-child");
  container.append(controls, status);
  check.addEventListener("click", () => {
    if (exercise.complete) return;
    const problems = [];
    const occupiedRows = new Set([...exercise.placed.keys()].map((key) => key.split(":")[0]));
    if (exercise.placed.size !== exercise.tiles.length || occupiedRows.size !== rows.length) problems.push("Place one balance in every row.");
    let dr = 0, cr = 0, wrongAmount = false, wrongSide = false;
    for (const [key, id] of exercise.placed) {
      const [index, side] = key.split(":");
      const tile = exercise.tiles.find((item) => item.id === id);
      const row = rows[Number(index)];
      if (side === "debit") dr += tile.pennies; else cr += tile.pennies;
      if (tile.pennies !== Math.abs(row.balance)) wrongAmount = true;
      if (side !== (row.balance > 0 ? "debit" : "credit")) wrongSide = true;
    }
    if (dr !== cr) problems.push("Debit and credit totals do not balance.");
    if (wrongAmount) problems.push("An amount is in the wrong account. Recheck closing balances in the ledger.");
    if (wrongSide) problems.push("An account balance is on the wrong side. Review the account’s normal balance and transactions.");
    if (problems.length) {
      weekMistakes++;
      message(problems.join(" "), "alert-danger");
    } else {
      exercise.complete = true;
      const award = exercise.hinted ? 125 : 250;
      score += award;
      updateStats();
      message("Correct! All account balances and sides are correct. +" + award + " points. Return to the van to build your financial statements.", "alert-success");
      refresh();
    }
    status.focus({ preventScroll: true });
  });
  refresh();
  if (exercise.complete) message("Trial balance checked and correct. Return to the van to continue.", "alert-success");
}
function financialAccounts() {
  const sections = {
    "Sales": "sales", "Purchases": "cost", "Closing inventory – SPL": "cost",
    "Rent expense": "expenses", "Repairs expense": "expenses", "Wages expense": "expenses",
    "Motor vehicles": "noncurrent", "Equipment": "noncurrent", "Bank": "current",
    "Closing inventory – SFP": "current", "Owner’s capital": "capital"
  };
  return accountNames.map((account) => ({ account, balance: balanceFor(account), section: sections[account] })).filter((row) => row.balance);
}

function renderStatements(container) {
  if (dayIndex !== 6 || !trialComplete()) {
    container.textContent = "Complete Sunday’s trial balance before building the financial statements.";
    return;
  }
  container.className = "van-report-paper van-financial-exercise";
  const accounts = financialAccounts();
  const stage = statementExercise.stage;
  const locked = stage === "spl" ? statementExercise.splComplete : statementExercise.sfpComplete;
  const allowed = stage === "spl" ? ["sales", "cost", "expenses"] : ["noncurrent", "current", "capital"];
  let selected = null;
  const toolbar = document.createElement("div");
  toolbar.className = "d-flex flex-wrap gap-2 mb-3";
  for (const [value, label] of [["spl", "1. Profit or loss"], ["sfp", "2. Financial position"]]) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn " + (value === stage ? "btn-primary" : "btn-outline-primary");
    button.textContent = label;
    button.disabled = value === "sfp" && !statementExercise.splComplete;
    button.addEventListener("click", () => { statementExercise.stage = value; rerender(); });
    toolbar.append(button);
  }
  function rerender() { container.replaceChildren(); renderStatements(container); }
  const guidance = document.createElement("p");
  guidance.textContent = "Drag an account from the completed trial balance to a statement space, or select it then a space. Used accounts are marked. Select a placed account to return it before checking. Complete the SPL first, then carry its profit or loss into the SFP.";
  const layout = document.createElement("div");
  layout.className = "van-financial-layout";
  const reference = document.createElement("aside");
  reference.className = "van-financial-reference";
  const statement = document.createElement("section");
  const heading = document.createElement("h3");
  heading.className = "h5";
  heading.textContent = businessName + (stage === "spl" ? " · Statement of profit or loss for the week" : " · Statement of financial position at Sunday’s close");
  statement.append(heading);
  const status = document.createElement("p");
  status.setAttribute("role", "status");
  status.tabIndex = -1;
  status.hidden = true;
  const slots = new Map(), sources = new Map(), totals = new Map();
  function used(name) { return [...statementExercise.placed.values()].includes(name); }
  function sum(section) {
    return [...statementExercise.placed].reduce((total, [key, name]) => {
      if (!key.startsWith(section + ":")) return total;
      const balance = balanceFor(name);
      return total + (section === "cost" ? balance : Math.abs(balance));
    }, 0);
  }
  function refresh() {
    sources.forEach((button, name) => {
      button.disabled = locked || used(name);
      button.textContent = name + (used(name) ? " · used" : "");
      button.setAttribute("aria-pressed", String(selected === name));
    });
    slots.forEach((button, key) => {
      const name = statementExercise.placed.get(key);
      button.textContent = name ? name + " · " + money(Math.abs(balanceFor(name))) : "Place account";
      button.setAttribute("data-filled", String(Boolean(name)));
      button.disabled = locked;
      button.draggable = Boolean(name) && !locked;
    });
    const profit = totalsFor(postedEntries).profit;
    const values = {
      cost: sum("cost"), gross: sum("sales") - sum("cost"), expenses: sum("expenses"),
      net: sum("sales") - sum("cost") - sum("expenses"),
      assets: sum("noncurrent") + sum("current"), capital: sum("capital") + profit,
      capitalLiabilities: sum("capital") + profit
    };
    totals.forEach((element, key) => {
      const value = values[key];
      element.textContent = value < 0 ? "(" + money(-value) + ")" : money(value);
      element.className = ["gross", "net"].includes(key) ? resultClass(value) : "";
    });
  }
  function place(name, key) {
    if (locked || !accounts.some((row) => row.account === name)) return;
    const previous = [...statementExercise.placed].find(([, account]) => account === name);
    if (previous && stage === "sfp" && ["sales", "cost", "expenses"].includes(previous[0].split(":")[0])) return;
    if (previous) statementExercise.placed.delete(previous[0]);
    statementExercise.placed.set(key, name);
    selected = null;
    status.hidden = true;
    refresh();
  }
  function section(label, key, count) {
    const heading = document.createElement("h4");
    heading.className = "h6 fw-bold mt-3";
    heading.textContent = label;
    statement.append(heading);
    for (let i = 0; i < count; i++) {
      const slot = key + ":" + i;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-outline-secondary van-financial-slot";
      button.setAttribute("aria-label", label + ", space " + (i + 1));
      button.addEventListener("click", () => {
        if (selected !== null) place(selected, slot);
        else if (!locked) { statementExercise.placed.delete(slot); status.hidden = true; refresh(); }
      });
      button.addEventListener("dragstart", (event) => {
        const name = statementExercise.placed.get(slot);
        if (!name || locked) event.preventDefault();
        else event.dataTransfer.setData("text/plain", name);
      });
      button.addEventListener("dragover", (event) => event.preventDefault());
      button.addEventListener("drop", (event) => { event.preventDefault(); place(event.dataTransfer.getData("text/plain"), slot); });
      slots.set(slot, button);
      statement.append(button);
    }
  }
  function line(label, key, fixed) {
    const row = document.createElement("p");
    row.className = "van-financial-total";
    const title = document.createElement("span");
    title.textContent = label;
    const value = document.createElement("strong");
    if (key) totals.set(key, value);
    else value.textContent = fixed;
    if (label === "Profit / loss for the week") value.className = resultClass(totalsFor(postedEntries).profit);
    row.append(title, value);
    statement.append(row);
  }
  if (stage === "spl") {
    section("Sales revenue", "sales", 1);
    section("Cost of sales — purchases less closing inventory (opening inventory £0.00)", "cost", 2);
    line("Cost of sales", "cost");
    line("Gross profit / loss", "gross");
    section("Expenses", "expenses", 3);
    line("Total expenses", "expenses");
    line("Net profit / loss for the week", "net");
  } else {
    section("Assets — non-current assets", "noncurrent", 2);
    section("Current assets", "current", 2);
    line("Total assets", "assets");
    section("Capital — capital introduced", "capital", 1);
    line("Profit / loss for the week", null, resultLabel(totalsFor(postedEntries).profit));
    line("Less: drawings", null, money(0));
    line("Total capital", "capital");
    line("Liabilities — current liabilities", null, money(0));
    line("Non-current liabilities", null, money(0));
    line("Total liabilities", null, money(0));
    line("Total capital and liabilities", "capitalLiabilities");
    const note = document.createElement("p");
    note.className = "small";
    note.textContent = "Assets = capital + liabilities. There are no drawings or liabilities in this week’s scenario.";
    statement.append(note);
  }
  const tbRows = accounts.map((row) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-sm btn-outline-primary text-start";
    button.draggable = true;
    button.addEventListener("click", () => { selected = row.account; refresh(); });
    button.addEventListener("dragstart", (event) => {
      if (locked || used(row.account)) event.preventDefault();
      else event.dataTransfer.setData("text/plain", row.account);
    });
    sources.set(row.account, button);
    return [button, row.balance > 0 ? money(row.balance) : "—", row.balance < 0 ? money(-row.balance) : "—"];
  });
  tbRows.push(["Totals", money(accounts.reduce((total, row) => total + Math.max(0, row.balance), 0)),
    money(accounts.reduce((total, row) => total + Math.max(0, -row.balance), 0))]);
  addReportTable(reference, "Completed trial balance", ["Account", "Debit", "Credit"], tbRows);
  const check = document.createElement("button");
  check.type = "button";
  check.className = "btn btn-primary mt-3";
  check.textContent = stage === "spl" ? "Check profit or loss statement" : "Check financial position statement";
  check.disabled = locked;
  check.addEventListener("click", () => {
    if (locked) return;
    const correct = [...slots.keys()].every((key) => accounts.some((row) =>
      row.account === statementExercise.placed.get(key) && row.section === key.split(":")[0])) &&
      accounts.filter((row) => allowed.includes(row.section)).every((row) =>
        [...slots.keys()].some((key) => statementExercise.placed.get(key) === row.account));
    if (!correct) {
      weekMistakes++;
      status.className = "alert alert-danger mt-3";
      status.textContent = "Some accounts are missing or in the wrong section. Review whether each balance measures income, a cost, an asset or the owner’s investment, then check the statement headings.";
      status.hidden = false;
      status.focus({ preventScroll: true });
      return;
    }
    if (stage === "spl") { statementExercise.splComplete = true; statementExercise.stage = "sfp"; }
    else statementExercise.sfpComplete = true;
    rerender();
  });
  statement.append(check);
  const clear = document.createElement("button");
  clear.type = "button";
  clear.className = "btn btn-outline-secondary mt-3 ms-2";
  clear.textContent = "Remove all tiles";
  clear.disabled = locked;
  clear.addEventListener("click", () => {
    if (locked) return;
    for (const key of slots.keys()) statementExercise.placed.delete(key);
    selected = null;
    status.hidden = true;
    refresh();
  });
  statement.append(clear);
  if (locked || (stage === "sfp" && statementExercise.splComplete)) {
    status.className = "alert alert-success mt-3";
    status.textContent = locked
      ? stage === "spl" ? "Profit or loss statement checked and correct." : "Both statements are correct. Assets equal capital plus liabilities. Return to the van for your final results."
      : "Profit or loss statement complete. Now build the statement of financial position.";
    status.hidden = false;
  }
  layout.append(reference, statement);
  container.append(toolbar, guidance, layout, status);
  refresh();
}
function updateReportNavigation() {
  const feature = trialComplete() ? "statements" : "trial";
  const order = feature === "statements" ? ["trial", "statements", "ledger"] : ["statements", "trial", "ledger"];
  for (const container of [get("van-day-summary").querySelector(".van-summary-reports"), get("van-report-tools")]) {
    const buttons = [...container.querySelectorAll("[data-van-report]")].sort((a, b) => order.indexOf(a.dataset.vanReport) - order.indexOf(b.dataset.vanReport));
    buttons.forEach((button) => {
      const featured = button.dataset.vanReport === feature;
      button.classList.toggle("van-report-featured", featured);
      button.classList.toggle("btn-primary", featured);
      button.classList.toggle("btn-outline-primary", !featured);
    });
    container.append(...buttons);
  }
}

function openReport(type) {
  if (type === "trial" && dayIndex !== 6) type = "ledger";
  const titles = { ledger: "T-accounts", trial: "Trial balance exercise", statements: "Financial statements" };
  const renderers = { ledger: renderLedger, trial: renderTrialBalance, statements: renderStatements };
  const reportContent = get("van-report-content");
  reportContent.replaceChildren();
  reportContent.className = type === "ledger" ? "van-report-ledger" : type === "statements" ? "van-statement-tables" : "table-responsive";
  reportContent.classList.toggle("van-report-paper", type !== "ledger");
  renderers[type](reportContent);
  get("van-report-title").textContent = businessName + " · " + titles[type] + " · " + week[dayIndex].name;
  get("van-report-tools").hidden = dayIndex !== 6 || get("van-day-summary").hidden;
  updateReportNavigation();
  get("van-report-tools").querySelectorAll("[data-van-report]").forEach((button) => {
    button.hidden = button.dataset.vanReport !== "ledger" && (dayIndex !== 6 || (button.dataset.vanReport === "statements" && !trialComplete()));
    if (button.dataset.vanReport === type) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  day.hidden = true;
  get("van-report").hidden = false;
  get("van-report-title").focus();
}

document.querySelectorAll("[data-van-report]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!day.hidden) reportTrigger = button;
    openReport(button.dataset.vanReport);
  });
});
get("van-report-back").addEventListener("click", () => {
  get("van-report").hidden = true;
  day.hidden = false;
  if (!get("van-day-summary").hidden) showSummary(get("van-next-day").hidden);
  reportTrigger.focus();
});

rollName();
updatePaint();
