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
}

document.querySelector("#van-roll").addEventListener("click", rollName);
primary.addEventListener("input", updatePaint);
accent.addEventListener("input", updatePaint);

const get = (id) => document.getElementById(id);
const currency = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const money = (pennies) => currency.format(pennies / 100);
const weeklyRent = 35000;
const equipmentCost = 30000;
const tyreRepair = 8500;
function randomInteger(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

const week = [
  ["Monday", 0, 0], ["Tuesday", 53, 73], ["Wednesday", 47, 67],
  ["Thursday", 62, 82], ["Friday", 76, 96], ["Saturday", 110, 130],
  ["Sunday", 66, 86]
].map(([name, min, max]) => ({
  name,
  customers: randomInteger(min, max),
  salePrice: randomInteger(11, 17) * 25,
  ingredientPrice: randomInteger(10, 18) * 10
}));
const accountNames = ["Bank", "Equipment", "Ingredient costs", "Motor vehicles", "Owner’s capital", "Rent expense", "Repairs expense", "Sales"];
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
let dayScore = 0;
let reportTrigger = null;

for (const select of [debit, credit]) {
  select.add(new Option("Choose an account", ""));
  for (const account of accountNames) select.add(new Option(account, account));
}

function buildJournal() {
  const { name, customers, salePrice, ingredientPrice } = week[dayIndex];
  const ingredients = customers * ingredientPrice;
  const revenue = customers * salePrice;
  const entries = [
    {
      label: name + " ingredients", debit: "Ingredient costs", credit: "Bank", pennies: ingredients,
      question: hardMode
        ? businessName + " pays from Bank for ingredients for " + customers + " hot dogs at " + money(ingredientPrice) + " each. Calculate and record the total cost."
        : businessName + " pays " + money(ingredients) + " from Bank for the ingredients used today (" + customers + " hot dogs at " + money(ingredientPrice) + " each). Record the cost.",
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
  }
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
  const ingredients = balanceFor("Ingredient costs", entries);
  const rent = balanceFor("Rent expense", entries);
  const repairs = balanceFor("Repairs expense", entries);
  return { sales, ingredients, rent, repairs, profit: sales - ingredients - rent - repairs };
}

function soldFor(entries) {
  return entries.reduce((total, entry) => total + (entry.sold || 0), 0);
}

function updateStats() {
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
  const weekClosed = postedEntries.some((entry) => entry.label === "Weekly pitch rent");
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
    const permanent = ["Bank", "Equipment", "Motor vehicles", "Owner’s capital"].includes(account);
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
  feedback.textContent = "";
  feedback.hidden = true;
  nextEntry.hidden = true;
}

function startDay() {
  entryIndex = 0;
  dayMistakes = 0;
  dayScore = score;
  journal = buildJournal();
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

hint.addEventListener("click", () => {
  if (checkEntry.disabled) return;
  usedHint = true;
  const entry = journal[entryIndex];
  const amountHint = hardMode
    ? "For sales and ingredients, multiply the number of hot dogs by the price per hot dog. Use the same amount on both sides."
    : "Enter " + money(entry.pennies) + " on both sides.";
  hintText.textContent = "Debit " + entry.debit + " and credit " + entry.credit +
    ". " + amountHint + " " + entry.explanation;
  hintText.hidden = false;
  hint.setAttribute("aria-expanded", "true");
  hint.disabled = true;
  updateStats();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (checkEntry.disabled || !form.reportValidity()) return;

  const decimalAmount = /^(?:\d+|\d{1,3}(?:,\d{3})+)\.\d{2}$/;
  const debitText = debitAmount.value.trim();
  const creditText = creditAmount.value.trim();
  if (![debitText, creditText].every((value) => decimalAmount.test(value))) {
    feedback.className = "alert alert-warning mt-3 mb-2";
    feedback.hidden = false;
    feedback.textContent = "Enter both amounts with exactly two decimal places, including .00 for whole pounds. For example, 10000.00.";
    return;
  }
  const pennies = (value) => Number(value.replace(/[,.]/g, ""));
  const entry = journal[entryIndex];
  const accountsMatch = debit.value === entry.debit && credit.value === entry.credit;
  const amountsMatch = pennies(debitText) === entry.pennies && pennies(creditText) === entry.pennies;
  if (!accountsMatch || !amountsMatch) {
    missedEntry = true;
    dayMistakes += 1;
    const previousStreak = streak;
    streak = 0;
    if (hardMode) score -= 100;
    feedback.className = "alert alert-danger mt-3 mb-2";
    feedback.hidden = false;
    const detail = accountsMatch ? "Use the transaction amount on both sides." : "Check which accounts change and which side each belongs on.";
    feedback.textContent = "Entry not posted. " + detail +
      (previousStreak ? " Your streak of " + previousStreak + " ended." : "") +
      (hardMode ? " −100 points." : "") + " Try again.";
    updateStats();
    return;
  }

  for (const field of [debit, credit, debitAmount, creditAmount, checkEntry, hint]) field.disabled = true;
  if (!usedHint && !missedEntry) streak += 1;
  bestStreak = Math.max(bestStreak, streak);
  const fullPoints = hardMode ? 200 : 100;
  const basePoints = usedHint ? fullPoints / 2 : fullPoints;
  const bonus = hardMode ? 0 : streak * (usedHint ? 5 : 10);
  const points = basePoints + bonus;
  score += points;
  postedEntries.push({ ...entry, day: dayIndex });
  achievements.add("First entry");
  if (streak >= 5) achievements.add("Five in a row");
  if (soldFor(postedEntries) >= 250) achievements.add("250 hot dogs sold");
  get("van-ledger-empty").hidden = true;
  renderLedger(get("van-ledger"));
  updateStats();
  feedback.className = "alert alert-success mt-3 mb-2";
  feedback.hidden = false;
  feedback.textContent = "Entry posted. " + entry.explanation + " Score +" + points + " points.";
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
  if (dayIndex === week.length - 1) {
    achievements.add("Week complete");
    if (totalsFor(postedEntries).profit > 0) achievements.add("In the black");
  }
  get("van-journal-panel").hidden = true;
  get("van-day-summary").hidden = false;
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
    item.textContent = badge;
    badges.append(item);
  }
  const next = get("van-next-day");
  next.hidden = final;
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

function renderTrialBalance(container) {
  let debits = 0;
  let credits = 0;
  const rows = [];
  for (const account of accountNames) {
    const balance = balanceFor(account);
    if (!balance) continue;
    const dr = Math.max(0, balance);
    const cr = Math.max(0, -balance);
    debits += dr;
    credits += cr;
    rows.push([account, dr ? money(dr) : "—", cr ? money(cr) : "—"]);
  }

  if (!trialExercises.has(dayIndex)) {
    const tiles = rows.flatMap((row, index) => {
      if (index >= 5) return [];
      const column = index % 2 === 0 ? 0 : row[1] === "—" ? 2 : 1;
      return [{ id: index, column, value: row[column] }];
    });
    for (let index = tiles.length - 1; index > 0; index--) {
      const swap = randomInteger(0, index);
      [tiles[index], tiles[swap]] = [tiles[swap], tiles[index]];
    }
    trialExercises.set(dayIndex, { tiles, placed: new Map(), hinted: false });
  }

  const exercise = trialExercises.get(dayIndex);
  let selected = null;
  const guidance = document.createElement("p");
  guidance.textContent = "Complete the missing account names and balances. Drag a tile into a blank, or select a tile and then select its blank. Use the T-accounts to check each balance.";
  const pool = document.createElement("div");
  pool.className = "d-flex flex-wrap gap-2 mb-3";
  const status = document.createElement("p");
  status.setAttribute("role", "status");
  const hintButton = document.createElement("button");
  hintButton.type = "button";
  hintButton.className = "btn van-hint-button mb-3";
  hintButton.textContent = "Hint · half points";
  hintButton.addEventListener("click", () => {
    exercise.hinted = true;
    const blank = exercise.tiles.find((tile) => !exercise.placed.has(tile.id));
    if (blank) {
      status.textContent = blank.column === 0
        ? "Hint: the missing account on row " + (blank.id + 1) + " is " + blank.value + "."
        : "Hint: check the " + rows[blank.id][0] + " balance in the T-accounts. It goes in the " +
          (blank.column === 1 ? "debit" : "credit") + " column.";
    }
  });
  const tileButtons = new Map();
  let totalsRow;

  function place(tileId, blank, button) {
    const tile = exercise.tiles.find((item) => item.id === tileId);
    if (!tile || exercise.placed.has(blank.id) || [...exercise.placed.values()].includes(tileId)) return;
    if (tile.column !== blank.column || tile.value !== blank.value) {
      status.textContent = "That tile doesn’t fit this blank. Check the account or balance side, then try again.";
      return;
    }
    exercise.placed.set(blank.id, tileId);
    tileButtons.get(tileId).hidden = true;
    selected = null;
    button.replaceWith(document.createTextNode(blank.value));
    const done = exercise.placed.size === exercise.tiles.length;
    if (done) {
      const award = exercise.hinted ? 50 : 100;
      score += award;
      updateStats();
      hintButton.hidden = true;
      status.textContent = "Trial balance complete. Debits and credits agree. +" + award + " points.";
      totalsRow.cells[1].textContent = money(debits);
      totalsRow.cells[2].textContent = money(credits);
      status.focus();
    } else {
      status.textContent = "Correct placement.";
      const nextTile = [...tileButtons.values()].find((item) => !item.hidden);
      nextTile?.focus();
    }
  }

  for (const tile of exercise.tiles) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-outline-primary";
    button.textContent = tile.value;
    button.draggable = true;
    button.hidden = [...exercise.placed.values()].includes(tile.id);
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("dragstart", (event) => event.dataTransfer.setData("text/plain", String(tile.id)));
    button.addEventListener("click", () => {
      selected = tile.id;
      tileButtons.forEach((item, id) => item.setAttribute("aria-pressed", String(id === selected)));
      status.textContent = tile.value + " selected. Choose a blank.";
    });
    tileButtons.set(tile.id, button);
    pool.append(button);
  }

  const complete = exercise.placed.size === exercise.tiles.length;
  hintButton.hidden = complete;
  status.tabIndex = -1;
  status.textContent = complete ? "Trial balance complete. Debits and credits agree." : "";
  container.append(guidance, pool, hintButton);
  const exerciseRows = rows.map((row, index) => {
    const blank = exercise.tiles.find((tile) => tile.id === index);
    if (!blank || exercise.placed.has(index)) return row;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-sm btn-outline-secondary van-trial-blank";
    button.textContent = "Place tile";
    button.setAttribute("aria-label", "Place tile in row " + (index + 1) + ", " + ["account", "debit", "credit"][blank.column]);
    button.addEventListener("click", () => {
      if (selected === null) status.textContent = "Select a tile first.";
      else place(selected, blank, button);
    });
    button.addEventListener("dragover", (event) => event.preventDefault());
    button.addEventListener("drop", (event) => {
      event.preventDefault();
      const data = event.dataTransfer.getData("text/plain");
      if (/^\d+$/.test(data)) place(Number(data), blank, button);
    });
    return row.map((value, column) => column === blank.column ? button : value);
  });
  exerciseRows.push(["Totals", complete ? money(debits) : "—", complete ? money(credits) : "—"]);
  addReportTable(container, "Trial balance before closing entries", ["Account", "Debit", "Credit"], exerciseRows);
  totalsRow = container.querySelector("table tbody tr:last-child");
  container.append(status);
}

function renderStatements(container) {
  const { sales, ingredients, rent, repairs, profit } = totalsFor(postedEntries);
  const bank = balanceFor("Bank");
  const vehicle = balanceFor("Motor vehicles");
  const capital = -balanceFor("Owner’s capital");
  const equipment = balanceFor("Equipment");
  const assets = bank + vehicle + equipment;
  const closingCapital = capital + profit;
  addReportTable(container, "Statement of profit or loss", ["Item", "Amount"], [
    ["Sales", money(sales)], ["Ingredient costs", money(-ingredients)],
    ["Gross profit", money(sales - ingredients)], ["Pitch rent", money(-rent)], ["Repairs", money(-repairs)],
    ["Profit or loss", { profit }]
  ]);
  addReportTable(container, "Statement of financial position", ["Item", "Amount"], [
    ["Motor vehicles", money(vehicle)], ["Equipment", money(equipment)], ["Bank", money(bank)], ["Total assets", money(assets)],
    ["Total liabilities", money(0)], ["Owner’s investment", money(capital)],
    ["Profit or loss", { profit }], ["Closing capital", money(closingCapital)],
    ["Total liabilities and capital", money(closingCapital)]
  ]);
  const note = document.createElement("p");
  note.textContent = assets === closingCapital ? "Balanced: assets equal liabilities plus capital." : "Check that assets equal liabilities plus capital.";
  container.append(note);
}

function openReport(type) {
  const titles = { ledger: "T-accounts", trial: "Trial balance exercise", statements: "Financial statements" };
  const renderers = { ledger: renderLedger, trial: renderTrialBalance, statements: renderStatements };
  const reportContent = get("van-report-content");
  reportContent.replaceChildren();
  reportContent.className = type === "ledger" ? "van-report-ledger" : type === "statements" ? "van-statement-tables" : "table-responsive";
  renderers[type](reportContent);
  get("van-report-title").textContent = businessName + " · " + titles[type] + " · " + week[dayIndex].name;
  get("van-report-tools").hidden = get("van-day-summary").hidden;
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
