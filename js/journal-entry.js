"use strict";

const journalForm = document.querySelector("#journal-form");
const journalFeedback = document.querySelector("#journal-feedback");

const transactionText = document.querySelector("#journal-transaction");
const newTransactionButton = document.querySelector("#new-transaction");

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
    description: "buys equipment",
    paymentText: "and pays immediately from its business bank account",
    debitAccount: "equipment",
    debitName: "Equipment",
    creditAccount: "bank",
    creditName: "Bank",
    explanation:
      "Equipment increases, so it is debited. Money in the bank decreases, so Bank is credited."
  },
  {
    description: "pays this month’s rent",
    paymentText: "and pays immediately from its business bank account",
    debitAccount: "rent",
    debitName: "Rent expense",
    creditAccount: "bank",
    creditName: "Bank",
    explanation:
      "Rent expense increases, so it is debited. Money in the bank decreases, so Bank is credited."
  },
  {
    description: "receives payment for services provided",
    paymentText: "directly into its business bank account",
    debitAccount: "bank",
    debitName: "Bank",
    creditAccount: "sales",
    creditName: "Sales",
    explanation:
    "Money in the bank increases, so Bank is debited. Sales income increases, so Sales is credited."
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

  const typeIndex = Math.floor(Math.random() * transactionTypes.length);
    currentTransaction = transactionTypes[typeIndex];

    transactionText.textContent =
      `${businesses[businessIndex]} ${currentTransaction.description} for ` +
      `${pounds.format(transactionAmount)} ${currentTransaction.paymentText}.`;

        journalForm.reset();
        journalFeedback.hidden = true;
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
});

// Clear old feedback when the student changes their entry.
journalForm.addEventListener("input", () => {
  journalFeedback.hidden = true;
});

journalForm.addEventListener("change", () => {
  journalFeedback.hidden = true;
});

newTransactionButton.addEventListener("click", generateTransaction);

generateTransaction();

const totalDebitsDisplay = document.querySelector("#total-debits");
const totalCreditsDisplay = document.querySelector("#total-credits");
const balanceStatus = document.querySelector("#balance-status");

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

// Reset totals after the new transaction clears the form.
newTransactionButton.addEventListener("click", updateTotals);

updateTotals();
