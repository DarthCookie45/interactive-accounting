"use strict";

// Add approved words here to expand the name generator.
const firstWords = ["Sizzling", "Golden", "Sunny", "Toasty", "Rocket", "Copper", "Street", "Maple", "Happy", "Cheeky", "Smoky", "Cosmic", "Mighty", "Crispy", "Rolling", "Rustic", "Lucky", "Bouncy", "Pepper", "Dapper", "Jolly", "Flaming", "Turbo", "Cracking"];
const lastWords = ["Franks", "Buns", "Grill", "Bites", "Dogs", "Diner", "Wagon", "Kitchen", "Sausages", "Sizzlers", "Snacks", "Feast", "Bangers", "Munch", "Picnic", "Chomp", "Rolls", "Flavours", "Stop", "Hatch"];
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
  const luminances = {};
  for (const [name, value] of [["primary", primary.value], ["accent", accent.value]]) {
    const rgb = value.match(/[a-f\d]{2}/gi).map((hex) => {
      const n = parseInt(hex, 16) / 255;
      return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
    });
    const luminance = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
    luminances[name] = luminance;
    page.style.setProperty("--van-" + name + "-ink", luminance > 0.179 ? "#000000" : "#ffffff");
  }
  const contrast = (Math.max(luminances.primary, luminances.accent) + 0.05) / (Math.min(luminances.primary, luminances.accent) + 0.05);
  const fallback = contrast < 3;
  const selection = fallback ? (luminances.primary > 0.179 ? "#1f2937" : "#ffffff") : accent.value;
  page.style.setProperty("--van-selection", selection);
  page.style.setProperty("--van-selection-ink", fallback ? (luminances.primary > 0.179 ? "#ffffff" : "#000000") : (luminances.accent > 0.179 ? "#000000" : "#ffffff"));
}

let nameRerolls = 0;
document.querySelector("#van-roll").addEventListener("click", () => {
  nameRerolls += 1;
  rollName();
});
primary.addEventListener("input", updatePaint);
accent.addEventListener("input", updatePaint);

const get = (id) => document.getElementById(id);
const currency = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const money = (pennies) => currency.format((pennies || 0) / 100);
function randomInteger(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }
const game = new VanAccounting();
let week = game.week;
const accountNames = Object.keys(game.accounts).sort((a, b) => a.localeCompare(b, "en-GB"));
const salesChallengeModes = ["quantity", "truefalse", "mistake", "journal", "quantity", "mistake"];
for (let i = salesChallengeModes.length - 1; i > 0; i--) {
  const swap = randomInteger(0, i);
  [salesChallengeModes[i], salesChallengeModes[swap]] = [salesChallengeModes[swap], salesChallengeModes[i]];
}
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
const postedEntries = game.entries;
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
let totalMistakes = 0;
let weekHints = 0;
const weekHintDays = new Set();
const weekMistakeDays = new Set();
let dayScore = 0;
let weekScore = 0;
let bestWeekScore = 0;
let hasNegativeScore = false;

function customerCount(firstWeekOnly = false) {
  // Sales post once, so each day's customers are counted once, after recording sales.
  return postedEntries.filter(entry => !firstWeekOnly || entry.week === 0)
    .reduce((total, entry) => total + (entry.customers || 0), 0);
}
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
  const price = entry.unitPrice || week[dayIndex].salePrice;
  const proposal = "Debit " + entry.debit + " " + money(entry.pennies) + "; credit Sales " + money(entry.pennies) + ".";
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
      question: "True or false? " + businessName + " records " + money(entry.pennies) + " of hot dog sales" + (entry.debit === "Receivables" ? " on credit." : ", paid into Bank.") + " A trainee proposes: " + (valid ? proposal : "Debit Sales " + money(entry.pennies) + "; credit " + entry.debit + " " + money(entry.pennies) + ".") + " Is this correct?",
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
    question: "Find and correct the mistake: " + businessName + " receives " + money(entry.pennies) + " from customers into Bank. The trainee records “" + proposed + "”, using " + money(entry.pennies) + " on each side. What should the transaction have been?",
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
  return game.planDay(dayIndex, hardMode, money).map((entry) => ({ ...entry, question: businessName + ": " + entry.question }));
}
function balanceFor(account, entries) {
  if (entries === undefined) return game.balance(account);
  return entries.reduce((sum, entry) => sum + (entry.debit === account ? entry.pennies : 0) - (entry.credit === account ? entry.pennies : 0), 0);
}
function totalsFor(entries = game.currentEntries()) {
  return game.totals(entries.filter((entry) => entry.week === undefined || entry.week === game.weekIndex));
}

function soldFor(entries) {
  return entries.reduce((total, entry) => total + (entry.sold || 0), 0);
}

function updateStats() {
  updateMilestones();
  if (score > 9000) achievements.add("Its over 9000!");
  get("van-stat-score").textContent = score.toLocaleString("en-GB");
  get("van-stat-streak").textContent = streak;
  get("van-stat-bank").textContent = money(balanceFor("Bank"));
  get("van-stat-sold").textContent = soldFor(postedEntries);
  const today = game.currentEntries().filter((entry) => entry.day === dayIndex);
  get("van-today-customers").textContent = week[dayIndex].customers;
  get("van-today-sold").textContent = soldFor(today);
  get("van-today-sales").textContent = money(totalsFor(today).sales);
}

function renderLedger(container) {
  container.replaceChildren();
  const closed = dayIndex === 6 && get("van-journal-panel").hidden;
  const entries = game.currentEntries();
  const balances = game.balances();
  const profit = game.totals().profit;
  const drawings = balanceFor("Drawings");
  for (const account of accountNames) {
    if (!balances[account] && !game.opening[account] && !entries.some(entry => entry.debit === account || entry.credit === account) && !(closed && account === "Accumulated profit/loss" && (profit || drawings))) continue;
    const card = document.createElement("section");
    card.className = "van-ledger-card";
    const heading = document.createElement("h4");
    heading.textContent = account;
    const sides = document.createElement("div");
    sides.className = "van-t-account";
    const lines = { debit: [], credit: [] };
    const opening = game.opening[account] || 0;
    if (opening) lines[opening > 0 ? "debit" : "credit"].push(["Balance b/d", Math.abs(opening)]);
    for (const entry of entries) {
      if (entry.debit === account) lines.debit.push([entry.credit, entry.pennies]);
      if (entry.credit === account) lines.credit.push([entry.debit, entry.pennies]);
    }
    const permanent = ["noncurrent", "current", "capital", "currentLiability", "noncurrentLiability"].includes(game.accounts[account]);
    let balance = balances[account];
    if (closed && account === "Accumulated profit/loss") {
      if (profit) lines[profit > 0 ? "credit" : "debit"].push([profit > 0 ? "Profit transfer" : "Loss transfer", Math.abs(profit)]);
      if (drawings) lines.debit.push(["Drawings transfer", drawings]);
      balance = balance - profit + drawings;
    }
    if (closed && balance) lines[balance > 0 ? "credit" : "debit"].push([
      permanent ? "Balance c/d" : account === "Drawings" ? "Accumulated profit/loss" : "Profit or loss transfer", Math.abs(balance)
    ]);
    for (const side of ["debit", "credit"]) {
      const column = document.createElement("div");
      const label = document.createElement("strong");
      label.textContent = side === "debit" ? "Debit" : "Credit";
      column.append(label);
      const add = (text, amount, className = "") => {
        const row = document.createElement("div");
        row.className = "van-ledger-line " + className;
        const narrative = document.createElement("span"), value = document.createElement("span");
        narrative.textContent = text; value.textContent = money(amount);
        row.append(narrative, value); column.append(row);
      };
      lines[side].forEach(([text, amount]) => add(text, amount));
      if (closed) {
        add("Total", lines[side].reduce((sum, [, amount]) => sum + amount, 0), "van-ledger-total");
        if (permanent && balance && side === (balance > 0 ? "debit" : "credit")) add("Balance b/d", Math.abs(balance));
      }
      sides.append(column);
    }
    card.append(heading, sides);
    if (!closed) {
      const total = document.createElement("p");
      total.className = "van-ledger-balance";
      total.textContent = "Balance: " + money(Math.abs(balance)) + (balance > 0 ? " Dr" : balance < 0 ? " Cr" : "");
      card.append(total);
    }
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
    const mode = salesChallengeModes[(dayIndex - 1 + game.weekIndex) % salesChallengeModes.length];
    if (entry.sold && entry.debit === "Bank" && dayIndex > 0 && mode !== "journal") {
      entry.challenge = buildSalesChallenge(entry, mode);
    }
  });
  get("van-day-label").textContent = "Week " + (game.weekIndex + 1) + " of 4 · " + week[dayIndex].name +
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
  if (primary.value.toLowerCase() === "#ffffff" && accent.value.toLowerCase() === "#ffffff") achievements.add("Standard Joe");
  if (nameRerolls >= 30) achievements.add("Frankly Indecisive");
  const businessWords = businessName.trim().split(/\s+/);
  if (businessWords.length === 2 && businessWords[0][0].toLowerCase() === businessWords[1][0].toLowerCase()) achievements.add("Alliteration");
  const paints = [primary.value, accent.value].map(value => value.match(/[a-f\d]{2}/gi).map(hex => parseInt(hex, 16)));
  const red = ([r, g, b]) => r >= 180 && g <= 100 && b <= 100;
  const yellow = ([r, g, b]) => r >= 180 && g >= 160 && b <= 100;
  if ((red(paints[0]) && yellow(paints[1])) || (yellow(paints[0]) && red(paints[1]))) achievements.add("Ketchup with the Mustard");
  hardMode = get("van-difficulty").value === "hard";
  dayName.textContent = businessName;
  setup.hidden = true;
  day.hidden = false;
  get("van-nav-stats").hidden = false;
  startDay();
});

function entryHint(entry) {
  if (entry.challenge) return entry.challenge.hint;
  if (entry.debit === "Wages") return "Write down hours and hourly pay separately. Work out what the units tell you to do, then round only the final result to the nearest penny. Which two parts of the business change when staff are paid?";
  if (entry.debit === "Depreciation charges") return "Identify which method is stated. Reducing balance uses the amount left after earlier depreciation; straight-line here uses original cost. Apply the percentage and round once at the end.";
  if (entry.label === "Allowance adjustment") return "Calculate the required closing estimate from the outstanding customer balance. Compare it with the allowance already recorded; post only the difference, not the full estimate again.";
  if (["Customer settlement", "Supplier settlement", "Loan repayment"].includes(entry.label)) return "This settles part of an existing balance. Look back at what was already recorded and avoid recognising the original sale, purchase or borrowing twice.";
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
  weekHintDays.add(dayIndex);
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
    totalMistakes += 1;
    weekMistakeDays.add(dayIndex);
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
  game.post(entry, dayIndex);
  achievements.add("First entry");
  if (streak >= 5) achievements.add("Five in a row");
  get("van-ledger-empty").hidden = true;
  renderLedger(get("van-ledger"));
  updateStats();
  feedback.className = "alert alert-success mt-3 mb-2";
  feedback.hidden = false;
  feedback.textContent = "Entry posted. " + (entry.challenge?.explanation || entry.explanation) + " Score +" + points + " points.";
  const today = totalsFor(game.currentEntries().filter((item) => item.day === dayIndex));
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
  const dayEntries = game.currentEntries().filter((entry) => entry.day === dayIndex);
  const today = dayEntries.filter((entry) => !entry.system);
  const sunday = dayIndex === 6;
  const ready = trialComplete() && statementExercise.sfpComplete;
  const monthComplete = final && game.weekIndex === 3;
  if (score - dayScore < 0) achievements.add("Bad Day");
  let totals = totalsFor(final ? game.currentEntries() : dayEntries);
  if (!dayMistakes) achievements.add("Perfect day");
  if (sunday && ready) {
    if (!weekHints) achievements.add("No Spoilers!");
    if (!weekMistakes) achievements.add("Perfect Week");
    if (game.totals().profit > 0) achievements.add("In the black");
  }
  if (final) {
    game.finishWeek();
    if (monthComplete) {
      achievements.add("You nerd");
      totals = game.snapshots.reduce((sum, snapshot) => ({ sales: sum.sales + snapshot.totals.sales, profit: sum.profit + snapshot.totals.profit }), { sales: 0, profit: 0 });
    }
  }
  updateMilestones();
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
  get("van-summary-title").textContent = businessName + " · " + (monthComplete ? "Month complete!" : final ? "Week " + (game.weekIndex + 1) + " complete!" : "Week " + (game.weekIndex + 1) + " · " + week[dayIndex].name + " complete!");
  get("van-summary-message").textContent = monthComplete
    ? "Four weeks complete! Your monthly totals bring together all four weeks."
    : final ? "Weekly accounts complete. Your permanent balances carry forward; income, costs and drawings start afresh next week."
    : dayMistakes ? "All entries posted. Use the ledger to review each transaction." : "All entries posted without a mistake. Well done!";
  const shownEntries = monthComplete ? postedEntries.filter((entry) => !entry.system) : final ? game.currentEntries().filter((entry) => !entry.system) : today;
  renderSummary([
    ["Sales revenue", money(totals.sales)], ["Profit or loss", resultLabel(totals.profit), resultClass(totals.profit)],
    ["Score", score.toLocaleString("en-GB")], ["Bank", money(balanceFor("Bank"))],
    ["Hot dogs sold", soldFor(shownEntries)], ["Entries posted", shownEntries.length], ["Best streak", bestStreak],
    ...(final ? [["Wrong answers this week", weekMistakes]] : [])
  ]);
  const badges = get("van-achievements");
  badges.replaceChildren();
  for (const badge of achievements) {
    const item = document.createElement("li"), button = document.createElement("button");
    button.type = "button";
    button.className = "van-achievement-button";
    button.textContent = badge;
    button.addEventListener("click", showAchievements);
    item.append(button); badges.append(item);
  }
  const next = get("van-next-day");
  next.hidden = final;
  next.disabled = sunday && !ready;
  next.textContent = sunday ? "View week " + (game.weekIndex + 1) + " results" : "Start " + week[dayIndex + 1].name;
  get("van-next-week").hidden = !final || monthComplete;
  get("van-next-week").textContent = "Start week " + (game.weekIndex + 2) + " →";
  get("van-trial-required").hidden = !sunday || ready;
  get("van-trial-required").textContent = trialComplete() ? "Build and check your financial statements to finish this week." : "Complete the weekly trial balance, then build your financial statements.";
  get("van-trial-open").hidden = !sunday;
  get("van-trial-open").textContent = trialComplete() ? "Trial balance" : "Complete Trial Balance Exercise";
  get("van-day-summary").querySelector('[data-van-report="statements"]').hidden = !sunday || !trialComplete();
  updateReportNavigation();
  renderLedger(get("van-ledger"));
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

get("van-next-week").addEventListener("click", () => {
  if (get("van-next-week").hidden || !statementExercise.sfpComplete || !trialComplete()) return;
  if (!game.nextWeek()) return;
  weekScore = score;
  week = game.week;
  dayIndex = 0;
  weekMistakes = 0;
  weekHints = 0;
  weekHintDays.clear();
  weekMistakeDays.clear();
  statementExercise = { placed: new Map(), splComplete: false, sfpComplete: false, stage: "spl", profitText: "" };
  get("van-final-art").hidden = true;
  get("van-live-sidebar").hidden = false;
  get("van-next-week").hidden = true;
  startDay();
  renderLedger(get("van-ledger"));
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
let statementExercise = { placed: new Map(), splComplete: false, sfpComplete: false, stage: "spl" };

function trialComplete() {
  const exercise = trialExercises.get(game.weekIndex);
  return Boolean(exercise && exercise.complete);
}

const achievementDescriptions = {
  "First entry": "Post your first correct journal entry.",
  "Perfect day": "Post all journal entries for a day without an incorrect submission. Hints are allowed.",
  "Five in a row": "Reach a streak of five correct first-try journal entries.",
  "In the black": "Complete the week and final exercises with a positive profit.",
  "No Spoilers!": "Complete the week without using any journal or trial balance hints.",
  "Perfect Week": "Complete the week with no incorrect submitted answers in journals or final exercises.",
  "I Love You 3000": "Score over 3,000 points in one week.",
  "Vardy Party": "Get a streak of 12 correct first-try answers in a row.",
  "My Bad": "Submit 20 wrong answers or entries across the month.",
  "You nerd": "You finished the month — complete all four weeks and their final accounts.",
  "Standard Joe": "Use the standard van colours.",
  "Alliteration": "Start your van with both words in its company name beginning with the same letter.",
  "Its over 9000!": "Score over 9000 points.",
  "Introverts Nightmare": "Have more than 515 customers in your first week.",
  "People Person": "Serve over 2,200 customers across the month.",
  "Made of Money": "Receive over £18,000 in owner investments across the month.",
  "Bad Day": "Finish a day with a negative daily score.",
  "Hot Diggity Dog": "Sell 3,000 hot dogs across the month.",
  "Getting It": "Score over 25,000 points.",
  "We got GTA 6 before the Hot Dog Van": "Score over 60,000 points.",
  "Back in the Bun": "Recover from a negative total score to a positive total score.",
  "Frankly Indecisive": "Reroll your company name at least 30 times before starting your van.",
  "Ketchup with the Mustard": "Start your van with a red-and-yellow colour combination. Extra sauce!"
};
const hiddenAchievements = new Set(["Back in the Bun", "Frankly Indecisive", "Ketchup with the Mustard"]);

function investedTotal() {
  return postedEntries.filter(entry => entry.credit === "Owner’s capital").reduce((sum, entry) => sum + entry.pennies, 0);
}

function updateMilestones() {
  if (bestStreak >= 12) achievements.add("Vardy Party");
  if (totalMistakes >= 20) achievements.add("My Bad");
  bestWeekScore = Math.max(bestWeekScore, score - weekScore);
  if (score < 0) hasNegativeScore = true;
  if (hasNegativeScore && score > 0) achievements.add("Back in the Bun");
  for (const [name, qualifies] of [
    ["I Love You 3000", bestWeekScore > 3000],
    ["Getting It", score > 25000],
    ["We got GTA 6 before the Hot Dog Van", score > 60000],
    ["Introverts Nightmare", customerCount(true) > 515],
    ["People Person", customerCount() > 2200],
    ["Made of Money", investedTotal() > 1800000],
    ["Hot Diggity Dog", soldFor(postedEntries) >= 3000]
  ]) if (qualifies) achievements.add(name);
}

function achievementProgress(name) {
  const ready = trialComplete() && statementExercise.sfpComplete;
  const completedDays = week.map((_, index) => index).filter((index) => {
    const plan = game.plans.get(game.weekIndex + ":" + index);
    return plan && (index !== 6 || ready) && game.currentEntries().filter((entry) => entry.day === index && !entry.system).length >= plan.length;
  });
  const earned = achievements.has(name);
  const targets = { "First entry": 1, "Perfect day": 1, "Five in a row": 5, "Its over 9000!": 9001, "You nerd": 4, "In the black": 1, "Standard Joe": 1 };
  const milestoneTargets = { "I Love You 3000": 3001, "Introverts Nightmare": 516, "People Person": 2201, "Hot Diggity Dog": 3000, "Getting It": 25001, "We got GTA 6 before the Hot Dog Van": 60001, "Bad Day": 1 };
  milestoneTargets["Vardy Party"] = 12; milestoneTargets["My Bad"] = 20;
  milestoneTargets["Alliteration"] = 1;
  const target = name === "Made of Money" ? 1800001 : milestoneTargets[name] || (hiddenAchievements.has(name) ? 1 : targets[name]) || 7;
  let value = name === "You nerd" ? game.snapshots.length : name === "First entry" ? postedEntries.filter(entry => !entry.system).length : name === "Perfect day" || name === "Standard Joe" || name === "In the black" ? Number(earned) : name === "Five in a row" ? bestStreak : name === "Its over 9000!" ? score : completedDays.length;
  let note = earned ? "Unlocked" : "In progress";
  if (name === "I Love You 3000") value = bestWeekScore;
  if (name === "Introverts Nightmare") { value = customerCount(true); if (!earned && game.weekIndex > 0) note = "First week ended with " + value + " customers. Try again in a new game."; }
  if (name === "People Person") value = customerCount();
  if (name === "Vardy Party") value = bestStreak;
  if (name === "My Bad") value = totalMistakes;
  if (name === "Alliteration") value = Number(earned);
  if (name === "Made of Money") { value = investedTotal(); note = earned ? "Unlocked" : "Invested " + money(value) + "; exceed £18,000 to unlock."; }
  if (name === "Hot Diggity Dog") value = soldFor(postedEntries);
  if (name === "Getting It" || name === "We got GTA 6 before the Hot Dog Van") value = score;
  if (name === "Bad Day" || hiddenAchievements.has(name)) value = Number(earned);
  if (!earned && name === "No Spoilers!") {
    value = completedDays.filter(index => !weekHintDays.has(index)).length;
    note = weekHints ? weekHints + " hint use(s), on " + [...weekHintDays].map(index => week[index].name).join(", ") + ". This week no longer qualifies; try again next week."
      : "Days completed without hints. Sunday includes the final exercises.";
  }
  if (!earned && name === "Perfect Week") {
    value = completedDays.filter(index => !weekMistakeDays.has(index)).length;
    note = weekMistakes ? weekMistakes + " incorrect submission(s), on " + [...weekMistakeDays].map(index => week[index].name).join(", ") + ". This week no longer qualifies; try again next week."
      : "Days completed without incorrect submissions. Sunday includes the final exercises.";
  }
  if (!earned && name === "In the black") note = ready ? game.totals().profit < 0 ? "Not unlocked: this week made a loss of " + money(-game.totals().profit) + "." : "Not unlocked: this week broke even (£0.00); a positive profit is required." : "Complete this week’s final accounts with a positive profit. Days alone do not unlock this achievement.";
  if (!earned && name === "Standard Joe") note = "Choose the van’s standard colour combination when starting a new game.";
  return { value: earned ? target : Math.max(0, Math.min(target, value)), target, earned, note };
}

function showAchievements() {
  const list = get("van-achievement-guide");
  list.replaceChildren();
  const icons = {
    "First entry": "file-pen", "Perfect day": "sun", "Five in a row": "fire",
    "In the black": "chart-line", "No Spoilers!": "eye-slash", "Perfect Week": "trophy",
    "I Love You 3000": "heart", "Vardy Party": "champagne-glasses", "My Bad": "eraser",
    "You nerd": "graduation-cap", "Standard Joe": "truck", "Alliteration": "font",
    "Its over 9000!": "bolt", "Introverts Nightmare": "people-roof", "People Person": "users",
    "Made of Money": "money-bill-wave", "Bad Day": "cloud-rain", "Hot Diggity Dog": "hotdog",
    "Getting It": "lightbulb", "We got GTA 6 before the Hot Dog Van": "gamepad",
    "Back in the Bun": "rotate-left", "Frankly Indecisive": "shuffle", "Ketchup with the Mustard": "bottle-droplet"
  };
  const entries = Object.entries(achievementDescriptions).sort(([a], [b]) => Number(achievements.has(b)) - Number(achievements.has(a)));
  for (const [name, description] of entries) {
    const progress = achievementProgress(name);
    const item = document.createElement("li");
    item.className = "van-achievement-card " + (progress.earned ? "is-unlocked" : "is-locked");
    const picture = document.createElement("span");
    picture.className = "van-achievement-picture";
    picture.setAttribute("aria-hidden", "true");
    const icon = document.createElement("img");
    icon.className = "van-achievement-icon";
    const concealed = hiddenAchievements.has(name) && !progress.earned;
    icon.src = "../assets/icons/fontawesome/" + (concealed ? "question" : icons[name]) + ".svg";
    icon.alt = "";
    icon.width = 36;
    icon.height = 36;
    picture.append(icon);
    if (!progress.earned) {
      const lock = document.createElement("span");
      lock.className = "van-achievement-lock";
      lock.textContent = "🔒";
      picture.append(lock);
    }
    const content = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = concealed ? "Hidden achievement" : name;
    const detail = document.createElement("p");
    detail.textContent = concealed ? "" : description;
    const tracker = document.createElement("p");
    tracker.className = "van-achievement-tracker";
    tracker.textContent = progress.value.toLocaleString("en-GB") + "/" + progress.target.toLocaleString("en-GB") + " · " + progress.note;
    const bar = document.createElement("progress");
    bar.max = progress.target;
    bar.value = progress.value;
    bar.setAttribute("aria-label", name + " progress");
    if (concealed) content.append(title);
    else content.append(title, detail, tracker, bar);
    item.append(picture, content);
    list.append(item);
  }
  get("van-achievement-dialog").showModal();
}
for (const id of ["van-show-achievements", "van-guide-achievements", "van-today-achievements", "van-setup-achievements", "van-report-achievements"]) get(id).addEventListener("click", showAchievements);
get("van-close-achievements").addEventListener("click", () => get("van-achievement-dialog").close());


function renderTrialBalance(container) {
  const rows = accountNames.map((account) => ({ account, balance: balanceFor(account) })).filter((row) => row.balance);
  if (!trialExercises.has(game.weekIndex)) {
    const tiles = rows.map((row, id) => ({ id, pennies: Math.abs(row.balance) }));
    for (let i = tiles.length - 1; i > 0; i--) {
      const swap = randomInteger(0, i);
      [tiles[i], tiles[swap]] = [tiles[swap], tiles[i]];
    }
    trialExercises.set(game.weekIndex, { tiles, placed: new Map(), hinted: false, complete: false });
  }
  const exercise = trialExercises.get(game.weekIndex);
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
    weekHintDays.add(dayIndex);
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
  container.append(guidance);
  const trayHost = get("van-trial-tray-host");
  trayHost.replaceChildren(pool, trayControls);
  trayHost.hidden = false;
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
      totalMistakes++;
      updateMilestones();
      weekMistakeDays.add(dayIndex);
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
  return accountNames.map((account) => ({ account, balance: balanceFor(account), section: account === "Bank" && balanceFor(account) < 0 ? "currentLiability" : game.accounts[account] }))
    .filter((row) => row.balance !== 0 || row.account === "Opening inventory (SPL)");
}

function renderStatements(container) {
  if (dayIndex !== 6 || !trialComplete()) { container.textContent = "Complete this week’s Sunday trial balance first."; return; }
  container.className = "van-report-paper van-financial-exercise";
  const accounts = financialAccounts(), stage = statementExercise.stage;
  const locked = stage === "spl" ? statementExercise.splComplete : statementExercise.sfpComplete;
  const allowed = stage === "spl" ? ["sales", "openingCost", "cost", "closingCost", "expenses"] : ["noncurrent", "current", "capital", "drawings", "currentLiability", "noncurrentLiability"];
  let selected = null;
  const toolbar = document.createElement("div");
  toolbar.className = "d-flex flex-wrap gap-2 mb-3";
  for (const [value, label] of [["spl", "1. Profit or loss"], ["sfp", "2. Financial position"]]) {
    const button = document.createElement("button");
    button.type = "button"; button.className = "btn " + (value === stage ? "btn-primary" : "btn-outline-primary"); button.textContent = label;
    button.disabled = value === "sfp" && !statementExercise.splComplete;
    button.addEventListener("click", () => { statementExercise.stage = value; rerender(); });
    toolbar.append(button);
  }
  function rerender() { container.replaceChildren(); renderStatements(container); }
  const guidance = document.createElement("p");
  guidance.textContent = "Build the SPL first, then the SFP. Drag accounts or select an account and its space. Used accounts are marked; select a placed account to return it before checking. Accumulated depreciation and receivables allowances are deductions from assets.";
  const layout = document.createElement("div"); layout.className = "van-financial-layout";
  const reference = document.createElement("aside"); reference.className = "van-financial-reference";
  const statement = document.createElement("section");
  const heading = document.createElement("h3"); heading.className = "h5";
  heading.textContent = businessName + " · Week " + (game.weekIndex + 1) + (stage === "spl" ? " · Statement of profit or loss" : " · Statement of financial position");
  statement.append(heading);
  const status = document.createElement("p"); status.setAttribute("role", "status"); status.tabIndex = -1; status.hidden = true;
  const slots = new Map(), sources = new Map(), totals = new Map();
  const balanceNote = document.createElement("p"); balanceNote.className = "alert alert-info mt-3"; balanceNote.setAttribute("role", "status");
  let profitInput;
  const readProfit = () => VanAccounting.parseMoney(statementExercise.profitText || "");
  const used = name => [...statementExercise.placed.values()].includes(name);
  function sum(section) {
    return [...statementExercise.placed].reduce((total, [key, name]) => key.startsWith(section + ":") ? total + balanceFor(name) : total, 0);
  }
  function refresh() {
    sources.forEach((button, name) => {
      button.disabled = locked || used(name); button.textContent = name + (used(name) ? " · used" : "");
      button.setAttribute("aria-pressed", String(selected === name));
    });
    slots.forEach((button, key) => {
      const name = statementExercise.placed.get(key), signed = name ? balanceFor(name) : 0;
      button.textContent = name ? name + " · " + (signed < 0 && ["noncurrent", "current", "expenses"].includes(game.accounts[name]) ? "(" + money(-signed) + ")" : money(Math.abs(signed))) : "Place account";
      button.setAttribute("data-filled", String(Boolean(name))); button.disabled = locked; button.draggable = Boolean(name) && !locked;
    });
    const cost = sum("openingCost") + sum("cost") + sum("closingCost");
    const profit = readProfit() ?? 0;
    const capital = -sum("capital") + profit - sum("drawings");
    const assets = sum("noncurrent") + sum("current");
    const liabilities = -sum("currentLiability") - sum("noncurrentLiability");
    const figures = { openingCost: sum("openingCost"), cost, gross: -sum("sales") - cost,
      expenses: sum("expenses"), net: -sum("sales") - cost - sum("expenses"),
      noncurrent: sum("noncurrent"), current: sum("current"), assets, capital,
      liabilities, capitalLiabilities: capital + liabilities };
    totals.forEach((element, key) => {
      const value = figures[key]; element.textContent = value < 0 ? "(" + money(-value) + ")" : money(value);
      element.className = ["gross", "net"].includes(key) ? resultClass(value) : "";
    });
    if (stage === "sfp") {
      const matches = assets === capital + liabilities;
      balanceNote.className = "alert mt-3 " + (matches ? "alert-success" : "alert-warning");
      balanceNote.textContent = matches ? "✓ Total assets match total capital and liabilities. Check every account before submitting."
        : "Assets = capital + liabilities. Difference: " + money(Math.abs(assets - capital - liabilities)) + ".";
    }
  }
  function place(name, key) {
    if (locked || !accounts.some((row) => row.account === name)) return;
    const previous = [...statementExercise.placed].find(([, account]) => account === name);
    if (previous && stage === "sfp" && ["sales", "openingCost", "cost", "closingCost", "expenses"].includes(previous[0].split(":")[0])) return;
    if (previous) statementExercise.placed.delete(previous[0]);
    statementExercise.placed.set(key, name); selected = null; status.hidden = true; refresh();
  }
  function section(label, key) {
    const title = document.createElement("h4"); title.className = "h6 fw-bold mt-3"; title.textContent = label; statement.append(title);
    const rows = accounts.filter(row => row.section === key);
    if (!rows.length) { const zero = document.createElement("p"); zero.textContent = money(0); statement.append(zero); return; }
    rows.forEach((_, index) => {
      const slot = key + ":" + index;
      const button = document.createElement("button"); button.type = "button"; button.className = "btn btn-outline-secondary van-financial-slot";
      button.setAttribute("aria-label", label + ", space " + (index + 1));
      button.addEventListener("click", () => {
        if (selected !== null) place(selected, slot);
        else if (!locked) { statementExercise.placed.delete(slot); status.hidden = true; refresh(); }
      });
      button.addEventListener("dragstart", (event) => { const name = statementExercise.placed.get(slot); if (!name || locked) event.preventDefault(); else event.dataTransfer.setData("text/plain", name); });
      button.addEventListener("dragover", event => event.preventDefault());
      button.addEventListener("drop", event => { event.preventDefault(); place(event.dataTransfer.getData("text/plain"), slot); });
      slots.set(slot, button); statement.append(button);
    });
  }
  function line(label, key) {
    const row = document.createElement("p"); row.className = "van-financial-total";
    const text = document.createElement("span"), value = document.createElement("strong");
    text.textContent = label; totals.set(key, value); row.append(text, value); statement.append(row);
  }
  if (stage === "spl") {
    section("Sales revenue", "sales");
    section("Cost of sales — opening inventory", "openingCost");
    section("Purchases", "cost");
    section("Less: closing inventory", "closingCost");
    line("Cost of sales", "cost"); line("Gross profit / loss", "gross");
    section("Expenses and adjustments", "expenses"); line("Total expenses", "expenses"); line("Net profit / loss for the week", "net");
  } else {
    section("Non-current assets and accumulated depreciation", "noncurrent"); line("Net non-current assets", "noncurrent");
    section("Current assets and receivables allowance", "current"); line("Net current assets", "current"); line("Total assets", "assets");
    section("Capital introduced / brought forward", "capital");
    const label = document.createElement("label"); label.htmlFor = "van-statement-profit"; label.className = "form-label fw-bold mt-3";
    label.textContent = "Profit / loss for this week (£) — use a minus sign or brackets for a loss";
    profitInput = document.createElement("input"); profitInput.id = "van-statement-profit"; profitInput.type = "text";
    profitInput.inputMode = "decimal"; profitInput.className = "form-control"; profitInput.placeholder = "0.00";
    profitInput.value = statementExercise.profitText || ""; profitInput.disabled = locked;
    profitInput.addEventListener("input", () => { statementExercise.profitText = profitInput.value; status.hidden = true; refresh(); });
    statement.append(label, profitInput);
    section("Less: drawings", "drawings"); line("Total capital", "capital");
    section("Current liabilities", "currentLiability"); section("Non-current liabilities", "noncurrentLiability");
    line("Total liabilities", "liabilities"); line("Total capital and liabilities", "capitalLiabilities"); statement.append(balanceNote);
  }
  const tbRows = accounts.map(row => {
    const button = document.createElement("button"); button.type = "button"; button.className = "btn btn-sm btn-outline-primary text-start"; button.draggable = true;
    button.addEventListener("click", () => { selected = row.account; refresh(); });
    button.addEventListener("dragstart", event => { if (locked || used(row.account)) event.preventDefault(); else event.dataTransfer.setData("text/plain", row.account); });
    sources.set(row.account, button);
    return [button, row.balance >= 0 ? money(row.balance) : "—", row.balance < 0 ? money(-row.balance) : "—"];
  });
  tbRows.push(["Totals", money(accounts.reduce((total, row) => total + Math.max(0, row.balance), 0)), money(accounts.reduce((total, row) => total + Math.max(0, -row.balance), 0))]);
  addReportTable(reference, "Completed trial balance — Week " + (game.weekIndex + 1), ["Account", "Debit", "Credit"], tbRows);
  const check = document.createElement("button"); check.type = "button"; check.className = "btn btn-primary mt-3";
  check.textContent = stage === "spl" ? "Check profit or loss statement" : "Check financial position statement"; check.disabled = locked;
  check.addEventListener("click", () => {
    if (locked) return;
    const correct = [...slots.keys()].every(key => accounts.some(row => row.account === statementExercise.placed.get(key) && row.section === key.split(":")[0])) &&
      accounts.filter(row => allowed.includes(row.section)).every(row => [...slots.keys()].some(key => statementExercise.placed.get(key) === row.account));
    const profitCorrect = stage === "spl" || readProfit() === game.totals().profit;
    if (!correct || !profitCorrect) {
      weekMistakes++;
      totalMistakes++;
      updateMilestones();
      weekMistakeDays.add(dayIndex);
      status.className = "alert alert-danger mt-3"; status.hidden = false;
      status.textContent = !correct ? "Check missing or misplaced accounts. Distinguish income, costs, assets, capital and liabilities. Asset deductions belong with their related assets."
        : "Check the profit or loss carried from your SPL. For a loss, use a minus sign or brackets, for example -£100.00 or (£100.00).";
      status.focus({ preventScroll: true }); return;
    }
    if (stage === "spl") { statementExercise.splComplete = true; statementExercise.stage = "sfp"; }
    else statementExercise.sfpComplete = true;
    rerender();
  });
  const clear = document.createElement("button"); clear.type = "button"; clear.className = "btn btn-outline-secondary mt-3 ms-2"; clear.textContent = "Remove all tiles"; clear.disabled = locked;
  clear.addEventListener("click", () => { if (locked) return; for (const key of slots.keys()) statementExercise.placed.delete(key); selected = null; status.hidden = true; refresh(); });
  statement.append(check, clear);
  if (locked || stage === "sfp" && statementExercise.splComplete) {
    status.className = "alert alert-success mt-3"; status.hidden = false;
    status.textContent = locked ? stage === "spl" ? "Profit or loss statement checked and correct." : "Both statements are correct. Assets = capital + liabilities. Return to the van for this week’s results."
      : "SPL complete. Build the SFP and enter this week’s profit or loss.";
  }
  layout.append(reference, statement); container.append(toolbar, guidance, layout, status); refresh();
}
function updateReportNavigation() {
  const feature = !get("van-report").hidden && get("van-report-tools").dataset.activeReport ? get("van-report-tools").dataset.activeReport : trialComplete() ? "statements" : "trial";
  const order = ["trial", "statements", "ledger"];
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
  get("van-trial-tray-host").replaceChildren();
  get("van-trial-tray-host").hidden = true;
  reportContent.replaceChildren();
  reportContent.className = type === "ledger" ? "van-report-ledger" : type === "statements" ? "van-statement-tables" : "table-responsive";
  reportContent.classList.toggle("van-report-paper", type !== "ledger");
  renderers[type](reportContent);
  get("van-report-sidebar").hidden = type === "ledger";
  get("van-report-layout").classList.toggle("has-ledger", type !== "ledger");
  if (type !== "ledger") renderLedger(get("van-report-ledger"));
  get("van-report-title").textContent = businessName + " · " + titles[type] + " · Week " + (game.weekIndex + 1) + " · " + week[dayIndex].name;
  get("van-report-tools").hidden = dayIndex !== 6 || get("van-day-summary").hidden;
  get("van-report-dock").hidden = get("van-report-tools").hidden;
  get("van-report-tools").dataset.activeReport = type;
  updateReportNavigation();
  get("van-report-tools").querySelectorAll("[data-van-report]").forEach((button) => {
    button.hidden = button.dataset.vanReport !== "ledger" && (dayIndex !== 6 || (button.dataset.vanReport === "statements" && !trialComplete()));
    if (button.dataset.vanReport === type) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  day.hidden = true;
  get("van-report").hidden = false;
  get("van-report-tools").dataset.activeReport = type;
  updateReportNavigation();
  get("van-report-title").focus();
}

document.querySelectorAll("[data-van-report]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!day.hidden) reportTrigger = button;
    openReport(button.dataset.vanReport);
  });
});
get("van-report-ledger-open").addEventListener("click", () => openReport("ledger"));
if (typeof ResizeObserver !== "undefined") {
  new ResizeObserver(() => {
    get("van-report").style.setProperty("--report-dock-height", get("van-report-dock").getBoundingClientRect().height + "px");
  }).observe(get("van-report-dock"));
}
get("van-report-back").addEventListener("click", () => {
  get("van-report").hidden = true;
  day.hidden = false;
  if (!get("van-day-summary").hidden) showSummary(get("van-next-day").hidden);
  reportTrigger.focus();
});

rollName();
updatePaint();
