"use strict";

const journalForm = document.querySelector("#journal-form");
const journalFeedback = document.querySelector("#journal-feedback");

const transactionText = document.querySelector("#journal-transaction");
const newTransactionButton = document.querySelector("#new-transaction");
const checkEntryButton = journalForm.querySelector('button[type="submit"]');

const businesses = [
  "A Bristol café",
  "A Cardiff bakery",
  "A Manchester florist",
  "An Edinburgh bookshop",
  "A Belfast bicycle shop",
  "A Leeds hair salon",
  "A Halesowen car repair garage",
  "A Dudley plumbing business",
  "A Birmingham IT consultancy",
  "A London marketing agency",
  "A Glasgow clothing store",
  "A Liverpool music shop",
];

const pounds = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0
});

let transactionAmount = 0;

const transactionTypes = [
  {
    topic: "equipment",
    description: "buys equipment",
    paymentText: "and pays immediately from its business bank account",
    debitAccount: "equipment",
    debitName: "Equipment",
    creditAccount: "bank",
    creditName: "Bank",
    hint:
      "Think about the asset the business gained and the asset it used to pay. Increases in assets are debits; decreases are credits.",
    explanation:
      "Equipment increases, so it is debited. Money in the bank decreases, so Bank is credited."
  },
  {
    topic: "rent",
    description: "pays this month’s rent",
    paymentText: "and pays immediately from its business bank account",
    debitAccount: "rent",
    debitName: "Rent expense",
    creditAccount: "bank",
    creditName: "Bank",
    hint:
      "Think about the expense incurred and the money leaving the bank. Expenses increase with a debit; assets decrease with a credit.",
    explanation:
      "Rent expense increases, so it is debited. Money in the bank decreases, so Bank is credited."
  },
  {
    topic: "sales",
    description: "receives payment for services provided",
    paymentText: "directly into its business bank account",
    debitAccount: "bank",
    debitName: "Bank",
    creditAccount: "sales",
    creditName: "Sales",
    hint:
      "Think about the money received and the income earned. Assets increase with a debit; income increases with a credit.",
    explanation:
      "Money in the bank increases, so Bank is debited. Sales income increases, so Sales is credited."
  },
  {
    topic: "capital",
    description: "receives a capital contribution from its owner",
    paymentText: "directly into its business bank account",
    debitAccount: "bank",
    debitName: "Bank",
    creditAccount: "capital",
    creditName: "Owner’s capital",
    explanation:
      "Money in the bank increases, so Bank is debited. The owner’s investment increases capital, so Owner’s capital is credited. This is not sales income.",
    hint:
      "The business receives money, but it has not earned it from a customer. Think about the owner’s investment and the increase in the bank balance."
  },
  {
    topic: "drawings",
    description: "records a personal withdrawal by its owner",
    paymentText: "paid directly from its business bank account",
    debitAccount: "drawings",
    debitName: "Drawings",
    creditAccount: "bank",
    creditName: "Bank",
    explanation:
      "The owner’s personal withdrawal increases Drawings, so Drawings is debited. Money in the business bank account decreases, so Bank is credited. Drawings are not a business expense.",
    hint:
      "The money is being used personally by the owner, rather than to run the business. Think about the account for personal withdrawals and the money leaving Bank."
  }
];
  
let currentTransaction = transactionTypes[0];

function generateTransaction() {
  const businessIndex = Math.floor(Math.random() * businesses.length);

  // Generate a different amount from the previous question.
  const previousAmount = transactionAmount;

  do {
    transactionAmount = (Math.floor(Math.random() * 36) + 5) * 50;
  } while (transactionAmount === previousAmount);

  const availableTypes = transactionTypes.filter((transaction) => {
    return (
      topicSelector.value === "all" ||
      transaction.topic === topicSelector.value
    );
  });

const typeIndex = Math.floor(Math.random() * availableTypes.length);
currentTransaction = availableTypes[typeIndex];

    transactionText.textContent =
      `${businesses[businessIndex]} ${currentTransaction.description} for ` +
      `${pounds.format(transactionAmount)} ${currentTransaction.paymentText}.`;

  journalForm.reset();
  journalFeedback.hidden = true;
  hintPanel.hidden = true;
  hintPanel.textContent = "";
  hintButton.textContent = "Show hint";
  hintButton.setAttribute("aria-expanded", "false");
  setEntryLocked(false);
  newTransactionButton.textContent = "New transaction";
}

function advanceQuestion() {
  generateTransaction();
  updateTotals();
  document.querySelector("#account-1").focus();
}

function setEntryLocked(isLocked) {
  journalForm.querySelectorAll("select, input").forEach((field) => {
    field.disabled = isLocked;
  });

  checkEntryButton.disabled = isLocked;
}

function showFeedback(message, isCorrect) {
  journalFeedback.textContent = message;
  journalFeedback.className = isCorrect
    ? "alert alert-success mt-3 mb-0"
    : "alert alert-warning mt-3 mb-0";

  journalFeedback.hidden = false;
}

function readRow(rowNumber) {
  const debitValue = document.querySelector(`#debit-${rowNumber}`).value;
  const creditValue = document.querySelector(`#credit-${rowNumber}`).value;

  return {
    account: document.querySelector(`#account-${rowNumber}`).value,
    debit: debitValue === "" ? 0 : Number(debitValue),
    credit: creditValue === "" ? 0 : Number(creditValue)
  };
}

journalForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (checkEntryButton.disabled) {
    return;
  }

  const rows = [readRow(1), readRow(2)];

  const hasInvalidAmount = rows.some((row) => {
    return (
      !Number.isFinite(row.debit) ||
      !Number.isFinite(row.credit) ||
      row.debit < 0 ||
      row.credit < 0
    );
  });

  if (hasInvalidAmount) {
    showFeedback("Enter valid amounts of zero or more.", false);
    return;
  }

  const hasInvalidRow = rows.some((row) => {
    const hasDebit = row.debit > 0;
    const hasCredit = row.credit > 0;

    return hasDebit === hasCredit;
  });

  if (hasInvalidRow) {
    showFeedback(
      "Enter one positive amount on each row: either a debit or a credit, but not both.",
      false
    );
    return;
  }

  if (rows[0].account === rows[1].account) {
    showFeedback(
      "Choose two different accounts. Think about what the business paid for and how it paid.",
      false
    );
    return;
  }

  // Compare whole pennies to avoid decimal rounding differences.
  const totalDebit = rows.reduce((total, row) => {
    return total + Math.round(row.debit * 100);
  }, 0);

  const totalCredit = rows.reduce((total, row) => {
    return total + Math.round(row.credit * 100);
  }, 0);

  if (totalDebit !== totalCredit) {
    showFeedback(
      "Your entry does not balance yet. Total debits must equal total credits.",
      false
    );
    return;
  }

  const debitRow = rows.find((row) => row.account === currentTransaction.debitAccount);
  const creditRow = rows.find((row) => {
    return row.account === currentTransaction.creditAccount;
  });

  if (!debitRow || !creditRow) {
    showFeedback(
      `Your entry balances, but check the accounts. This transaction affects ${currentTransaction.debitName} and ${currentTransaction.creditName}.`,
      false
    );
    return;
  }

  if (debitRow.debit === 0 || creditRow.credit === 0) {
    showFeedback(
      "The accounts are correct, but the sides are reversed. " + currentTransaction.explanation,
      false
    );
    return;
  }

  if (
    debitRow.debit !== transactionAmount ||
    creditRow.credit !== transactionAmount
  ) {
    showFeedback(
      "The accounts and sides are correct. Check the transaction amount: " +
      `${pounds.format(transactionAmount)}.`,
      false
    );
    return;
  }

  showFeedback(
    `Correct! Debit ${currentTransaction.debitName} ` +
    `${pounds.format(transactionAmount)} and credit ` +
    `${currentTransaction.creditName} ${pounds.format(transactionAmount)}. ` +
    currentTransaction.explanation,
    true
  );
  setEntryLocked(true);
  newTransactionButton.textContent = "Next transaction";
  newTransactionButton.focus();
});

const hintButton = document.querySelector("#show-hint");
const hintPanel = document.querySelector("#journal-hint");

// Clear old feedback when the student changes their entry.
journalForm.addEventListener("input", () => {
  journalFeedback.hidden = true;
});

journalForm.addEventListener("change", () => {
  journalFeedback.hidden = true;
});

newTransactionButton.addEventListener("click", advanceQuestion);

const totalDebitsDisplay = document.querySelector("#total-debits");
const totalCreditsDisplay = document.querySelector("#total-credits");
const balanceStatus = document.querySelector("#balance-status");
const topicSelector = document.querySelector("#transaction-topic");

const moneyWithPennies = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP"
});

function updateTotals() {
  const rows = [readRow(1), readRow(2)];

  const debitPennies = rows.reduce((total, row) => {
    return total + (Number.isFinite(row.debit)
      ? Math.round(row.debit * 100)
      : 0);
  }, 0);

  const creditPennies = rows.reduce((total, row) => {
    return total + (Number.isFinite(row.credit)
      ? Math.round(row.credit * 100)
      : 0);
  }, 0);

  totalDebitsDisplay.textContent =
    moneyWithPennies.format(debitPennies / 100);

  totalCreditsDisplay.textContent =
    moneyWithPennies.format(creditPennies / 100);

  balanceStatus.classList.remove("is-balanced", "is-unbalanced");

  if (debitPennies === 0 && creditPennies === 0) {
    balanceStatus.textContent = "Enter your amounts to begin.";
  } else if (debitPennies === creditPennies) {
    balanceStatus.textContent =
      "Your entry balances. Use Check entry to check the accounting.";
    balanceStatus.classList.add("is-balanced");
  } else {
    const difference = Math.abs(debitPennies - creditPennies) / 100;

    balanceStatus.textContent =
      `Not balanced yet. Difference: ${moneyWithPennies.format(difference)}.`;
    balanceStatus.classList.add("is-unbalanced");
  }
}

journalForm.addEventListener("input", updateTotals);

hintButton.addEventListener("click", () => {
  const showHint = hintPanel.hidden;

  hintPanel.hidden = !showHint;
  hintPanel.textContent = showHint ? currentTransaction.hint : "";

  hintButton.textContent = showHint ? "Hide hint" : "Show hint";
  hintButton.setAttribute("aria-expanded", String(showHint));
});

topicSelector.addEventListener("change", () => {
  generateTransaction();
  updateTotals();
});

generateTransaction();
updateTotals();
