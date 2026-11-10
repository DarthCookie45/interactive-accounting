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

document.querySelector("#van-start").addEventListener("click", () => {
  dayName.textContent = businessName;
  setup.hidden = true;
  day.hidden = false;
  dayName.focus();
});

rollName();
updatePaint();

const journal = [
  {
    label: "Owner’s investment",
    question: "You invest £10,000 of your own money into the business bank account.",
    debit: "Bank",
    credit: "Owner’s capital",
    pennies: 1000000,
    explanation: "Bank increases and the owner’s investment increases capital."
  },
  {
    label: "Van purchase",
    question: "The business buys the van for £6,000 and pays immediately from its bank account. Ignore VAT.",
    debit: "Motor vehicles",
    credit: "Bank",
    pennies: 600000,
    explanation: "The van increases non-current assets and the payment reduces Bank."
  }
];

const journalForm = document.querySelector("#van-journal-form");
const debit = document.querySelector("#van-debit");
const credit = document.querySelector("#van-credit");
const debitAmount = document.querySelector("#van-debit-amount");
const creditAmount = document.querySelector("#van-credit-amount");
const feedback = document.querySelector("#van-journal-feedback");
const nextEntry = document.querySelector("#van-journal-next");
const step = document.querySelector("#van-journal-step");
const question = document.querySelector("#van-journal-question");
const checkEntry = journalForm.querySelector('button[type="submit"]');
const currency = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
let entryIndex = 0;
const postedEntries = [];

function renderLedger() {
  const ledger = document.querySelector("#van-ledger");
  ledger.replaceChildren();
  document.querySelector("#van-ledger-empty").hidden = postedEntries.length > 0;
  const accounts = new Set(postedEntries.flatMap((entry) => [entry.debit, entry.credit]));
  for (const account of accounts) {
    const card = document.createElement("section");
    card.className = "van-ledger-card";
    const heading = document.createElement("h4");
    heading.textContent = account;
    const sides = document.createElement("div");
    sides.className = "van-t-account";
    let balance = 0;

    for (const side of ["debit", "credit"]) {
      const column = document.createElement("div");
      const label = document.createElement("strong");
      label.textContent = side === "debit" ? "Debit" : "Credit";
      column.append(label);
      for (const entry of postedEntries.filter((posted) => posted[side] === account)) {
        const line = document.createElement("p");
        line.className = "mb-1 small";
        line.textContent = `${entry.label} · ${currency.format(entry.pennies / 100)}`;
        column.append(line);
        balance += side === "debit" ? entry.pennies : -entry.pennies;
      }
      sides.append(column);
    }

    const total = document.createElement("p");
    total.className = "van-ledger-balance";
    const balanceSide = balance > 0 ? " Dr" : balance < 0 ? " Cr" : "";
    total.textContent = `Balance: ${currency.format(Math.abs(balance) / 100)}${balanceSide}`;
    card.append(heading, sides, total);
    ledger.append(card);
    if (account === "Bank") {
      document.querySelector("#van-bank").textContent = currency.format(balance / 100);
    }
  }
}

for (const select of [debit, credit]) {
  select.add(new Option("Choose an account", ""));
  for (const account of ["Bank", "Motor vehicles", "Owner’s capital", "Pitch fees", "Sales"]) {
    select.add(new Option(account, account));
  }
}

function showEntry() {
  journalForm.reset();
  for (const field of [debit, credit, debitAmount, creditAmount, checkEntry]) {
    field.disabled = false;
  }
  step.textContent = `Transaction ${entryIndex + 1} of ${journal.length}`;
  question.textContent = journal[entryIndex].question;
  feedback.textContent = "";
  nextEntry.hidden = true;
}

journalForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (checkEntry.disabled) return;

  const entry = journal[entryIndex];
  if (debit.value !== entry.debit || credit.value !== entry.credit) {
    feedback.textContent = "Check which accounts change and which side each change belongs on.";
    return;
  }
  if (Math.round(debitAmount.valueAsNumber * 100) !== entry.pennies ||
      Math.round(creditAmount.valueAsNumber * 100) !== entry.pennies) {
    feedback.textContent = "Use the transaction amount on both sides of the entry.";
    return;
  }

  for (const field of [debit, credit, debitAmount, creditAmount, checkEntry]) {
    field.disabled = true;
  }
  postedEntries.push(entry);
  renderLedger();
  feedback.textContent = `Entry posted. ${entry.explanation}`;
  nextEntry.textContent = entryIndex === journal.length - 1 ? "Continue to trading" : "Next transaction";
  nextEntry.hidden = false;
  nextEntry.focus();
});

nextEntry.addEventListener("click", () => {
  if (nextEntry.hidden || !checkEntry.disabled) return;
  entryIndex += 1;
  if (entryIndex < journal.length) {
    showEntry();
    debit.focus();
    return;
  }
  const trading = document.querySelector("#van-trading");
  journalForm.closest("section").replaceWith(trading);
  trading.hidden = false;
  openTrading.disabled = false;
  document.querySelector("#trading-title").focus({ preventScroll: true });
});

showEntry();

const demand = 40;
const pitchFee = 2000;
const tradingForm = document.querySelector("#hot-dog-form");
const openTrading = tradingForm.querySelector('button[type="submit"]');
const quantity = document.querySelector("#hot-dog-quantity");
const price = document.querySelector("#hot-dog-price");
const outcome = document.querySelector("#hot-dog-outcome");
document.querySelector("#hot-dog-demand").textContent = `${demand} customers`;

tradingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (openTrading.disabled || !tradingForm.reportValidity()) return;

  const prepared = quantity.valueAsNumber;
  const sold = Math.min(prepared, demand);
  const revenue = sold * Math.round(price.valueAsNumber * 100);
  const ingredients = prepared * 100;
  const costs = ingredients + pitchFee;
  if (!Number.isSafeInteger(revenue) || !Number.isSafeInteger(costs)) {
    outcome.textContent = "Enter a smaller quantity or price.";
    return;
  }
  const profit = revenue - costs;

  document.querySelector("#hot-dog-sold").textContent = sold;
  document.querySelector("#hot-dog-unsold").textContent = prepared - sold;
  for (const [field, pennies] of Object.entries({
    revenue, ingredients, "pitch-fee": pitchFee, costs, profit
  })) {
    document.querySelector(`#hot-dog-${field}`).textContent = currency.format(pennies / 100);
  }
  const result = profit > 0 ? "You made a profit." : profit < 0 ? "You made a loss." : "You broke even.";
  outcome.textContent = `Day 1 complete. You sold ${sold} of ${prepared} hot dogs. ${result}`;
  quantity.disabled = true;
  price.disabled = true;
  openTrading.disabled = true;
});
