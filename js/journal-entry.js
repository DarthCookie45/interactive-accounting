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
  "A Leeds hair salon"
];

const pounds = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0
});

let transactionAmount = 0;

function generateTransaction() {
  const businessIndex = Math.floor(Math.random() * businesses.length);

  // Generate a different amount from the previous question.
  const previousAmount = transactionAmount;

  do {
    transactionAmount = (Math.floor(Math.random() * 36) + 5) * 50;
  } while (transactionAmount === previousAmount);

  transactionText.textContent =
    `${businesses[businessIndex]} buys equipment for ` +
    `${pounds.format(transactionAmount)} and pays immediately ` +
    "from its business bank account.";

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
      "Choose two different accounts. Think about what the café gained and how it paid.",
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

  const equipmentRow = rows.find((row) => row.account === "equipment");
  const bankRow = rows.find((row) => row.account === "bank");

  if (!equipmentRow || !bankRow) {
    showFeedback(
      "Your entry balances, but check the accounts. The café gained equipment and paid from its bank account.",
      false
    );
    return;
  }

  if (equipmentRow.debit === 0 || bankRow.credit === 0) {
    showFeedback(
      "The accounts are correct, but the sides are reversed. An increase in equipment is a debit; a decrease in bank is a credit.",
      false
    );
    return;
  }

  if (
    equipmentRow.debit !== transactionAmount ||
    bankRow.credit !== transactionAmount
  ) {
    showFeedback(
      "The accounts and sides are correct. Check the transaction amount: " +
      `the equipment cost ${pounds.format(transactionAmount)}.`,
      false
    );
    return;
  }

  showFeedback(
    `Correct! Debit Equipment ${pounds.format(transactionAmount)} ` +
    `and credit Bank ${pounds.format(transactionAmount)}. ` +
    "Equipment increases, while money in the bank decreases.",
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