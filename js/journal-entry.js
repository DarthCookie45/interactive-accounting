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
    buildQuestion: (business, amount) =>
      `${business} buys equipment for ${amount}, paying immediately from its business bank account.`,
    debitAccount: "equipment",
    debitName: "Equipment",
    creditAccount: "bank",
    creditName: "Bank",
    hint:
      "Will the item benefit the business beyond this period? Identify what was received and how it was paid for, then apply the normal-balance rules to each account category.",
    explanation:
      "Equipment increases, so it is debited. Money in the bank decreases, so Bank is credited."
  },
  {
    topic: "rent",
    buildQuestion: (business, amount) =>
      `${business} pays ${amount} from its business bank account for this month’s rent.`,
    debitAccount: "rent",
    debitName: "Rent expense",
    creditAccount: "bank",
    creditName: "Bank",
    hint:
      "Decide which period benefits from the payment. Is it a running cost, a lasting asset or a payment for a future period? Then consider how the payment changes the business.",
    explanation:
      "Rent expense increases, so it is debited. Money in the bank decreases, so Bank is credited."
  },
  {
    topic: "sales",
    buildQuestion: (business, amount) =>
      `${business} provides services for ${amount} and receives payment immediately into its business bank account.`,
    debitAccount: "bank",
    debitName: "Bank",
    creditAccount: "sales",
    creditName: "Sales",
    hint:
      "Separate the receipt of money from the reason it was received. Has the business earned it, borrowed it, or received an investment? Use those categories to decide the accounts and sides.",
    explanation:
      "Money in the bank increases, so Bank is debited. Sales income increases, so Sales is credited."
  },
  {
    topic: "capital",
    buildQuestion: (business, amount) =>
      `${business} receives ${amount} into its business bank account as a capital contribution from its owner.`,
    debitAccount: "bank",
    debitName: "Bank",
    creditAccount: "capital",
    creditName: "Owner’s capital",
    explanation:
      "Money in the bank increases, so Bank is debited. The owner’s investment increases capital, so Owner’s capital is credited. This is not sales income.",
    hint:
      "Look at who provided the money and whether the business supplied anything in return. How does this differ from a customer payment or borrowing?"
  },
  {
    topic: "drawings",
    buildQuestion: (business, amount) =>
      `${business} records its owner withdrawing ${amount} from the business bank account for personal use.`,
    debitAccount: "drawings",
    debitName: "Drawings",
    creditAccount: "bank",
    creditName: "Bank",
    explanation:
      "The owner’s personal withdrawal increases Drawings, so Drawings is debited. Money in the business bank account decreases, so Bank is credited. Drawings are not a business expense.",
    hint:
      "Ask who benefits from this payment: the business or its owner personally. How should that distinction affect the category you choose?"
  },
  {
    topic: "loan",
    buildQuestion: (business, amount) =>
      `${business} receives a bank loan of ${amount} into its business bank account.`,
    debitAccount: "bank",
    debitName: "Bank",
    creditAccount: "loan",
    creditName: "Bank loan",
    explanation:
      "Money in the bank increases, so Bank is debited. The amount owed to the lender increases, so Bank loan is credited. Borrowing money does not create sales income.",
    hint:
      "Does this receipt belong to the business permanently, or must it be repaid? Consider both what arrived and the obligation that came with it."
  },
  {
    topic: "loan-repayment",
    buildQuestion: (business, amount) =>
      `${business} repays ${amount} of its bank loan from its business bank account. This repayment is principal only; there is no interest.`,
    debitAccount: "loan",
    debitName: "Bank loan",
    creditAccount: "bank",
    creditName: "Bank",
    explanation:
      "The amount owed to the lender decreases, so Bank loan is debited. Money in the bank decreases, so Bank is credited. Repaying loan principal is not a business expense.",
    hint:
      "Distinguish repayment of an amount borrowed from interest charged for borrowing. Which existing balances does a principal-only repayment change?"
  }
];
  
// Period-end adjustments: the question states what has already been recorded.
const adjustments = [
  ["accrued-expense", "Accrued expense", "rent", "Rent expense", "accrued-expense", "Accrued expense",
    "has incurred unpaid rent of AMOUNT for this period which has not yet been recorded. Record the year-end accrual",
    "Debit Rent expense to recognise the cost for this period; credit Accrued expense for the liability. No bank payment occurs.",
    "Compare when the service was used with when it will be paid for. Which period should bear the cost, and what remains outstanding at its end?"],
  ["accrued-income", "Accrued income", "accrued-income", "Accrued income", "sales", "Sales",
    "has earned service income of AMOUNT this period which has not been received or recorded. Record the accrued income",
    "Debit Accrued income for the asset receivable; credit Sales for income earned this period.",
    "Separate earning income from receiving payment. What has the business done by the reporting date, and what right does it have as a result?"],
  ["prepaid-expense", "Prepaid expense", "prepaid-expense", "Prepaid expense", "rent", "Rent expense",
    "has already debited all rent paid to Rent expense. AMOUNT relates to next period. Record the year-end prepayment adjustment",
    "Debit Prepaid expense for the future benefit; credit Rent expense to remove next period’s cost from this period.",
    "Check what was originally recorded and which period receives the benefit. Does the full amount belong in this period’s costs?"],
  ["prepaid-income", "Prepaid income (deferred income)", "sales", "Sales", "prepaid-income", "Prepaid income (deferred income)",
    "has already credited all customer receipts to Sales. AMOUNT relates to services to be provided next period. Record the income received in advance adjustment",
    "Debit Sales to remove income not yet earned; credit Prepaid income (deferred income) for the obligation to provide future services.",
    "Compare the original entry with the work completed by the reporting date. Has the business done everything it owes the customer yet?"],
  ["depreciation", "Depreciation", "depreciation", "Depreciation expense", "accumulated-depreciation", "Accumulated depreciation",
    "needs to record equipment depreciation of AMOUNT for this period. No depreciation for this period has yet been recorded",
    "Debit Depreciation expense in profit or loss; credit Accumulated depreciation, which reduces the equipment’s carrying amount in the SFP.",
    "Think about allocating the cost of a long-lasting item over its useful life. Does recognising that allocation involve a new cash payment?"],
  ["allowance-increase", "Allowance for doubtful receivables — increase", "allowance-adjustment", "Allowance adjustment (SPL)", "allowance", "Allowance for doubtful receivables",
    "needs to increase its existing allowance for doubtful receivables BY AMOUNT. Record only the increase, not the total closing allowance",
    "Debit Allowance adjustment (SPL) for the extra expense; credit Allowance for doubtful receivables to increase the deduction from trade receivables.",
    "Compare the old estimate with the revised estimate. Focus on the change required, rather than recording the full closing estimate again."],
  ["allowance-decrease", "Allowance for doubtful receivables — decrease", "allowance", "Allowance for doubtful receivables", "allowance-adjustment", "Allowance adjustment (SPL)",
    "needs to decrease its existing allowance for doubtful receivables BY AMOUNT. The existing allowance is sufficient for this reduction. Record only the decrease",
    "Debit Allowance for doubtful receivables to reduce it; credit Allowance adjustment (SPL) to reduce the period’s expense.",
    "The estimate is being reduced. Think about which part of the earlier adjustment now needs to be reversed, and record only that change."],
  ["closing-inventory", "Closing inventory", "inventory", "Closing inventory (SFP)", "inventory-adjustment", "Closing inventory adjustment (SPL)",
    "has closing inventory valued at AMOUNT at the lower of cost and net realisable value. Under periodic inventory accounting, opening inventory has already been transferred to cost of sales. Record the closing inventory adjustment",
    "Debit Closing inventory (SFP) for the current asset; credit Closing inventory adjustment (SPL) to reduce cost of sales. This credit is not sales revenue.",
    "Which goods have not yet been used to earn this period’s sales? Think about matching costs to the period and showing the remaining resources at the reporting date." ]
];

adjustments.forEach(([topic, topicName, debitAccount, debitName, creditAccount, creditName, question, explanation, hint]) => {
  transactionTypes.push({
    topic, topicName, debitAccount, debitName, creditAccount, creditName, explanation, hint,
    buildQuestion: (business, amount) => `${business} ${question.replace("AMOUNT", amount).replace("BY", "by")}.`
  });
});

let currentTransaction = transactionTypes[0];

let mixedPracticeQueue = [];

function chooseTransactionType() {
  if (topicSelector.value !== "all") {
    return transactionTypes.find((transaction) => {
      return transaction.topic === topicSelector.value;
    });
  }

  if (mixedPracticeQueue.length === 0) {
    mixedPracticeQueue = [...transactionTypes];

    // Shuffle the copied array using Fisher–Yates.
    for (let index = mixedPracticeQueue.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1));

      [mixedPracticeQueue[index], mixedPracticeQueue[randomIndex]] =
        [mixedPracticeQueue[randomIndex], mixedPracticeQueue[index]];
    }
  }

  return mixedPracticeQueue.pop();
}

function generateTransaction() {
  const businessIndex = Math.floor(Math.random() * businesses.length);
  const previousAmount = transactionAmount;

  do {
    transactionAmount = (Math.floor(Math.random() * 36) + 5) * 50;
  } while (transactionAmount === previousAmount);

  currentTransaction = chooseTransactionType();
  transactionText.textContent = currentTransaction.buildQuestion(
    businesses[businessIndex],
    pounds.format(transactionAmount)
  );
  
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

// Keep both account selectors and topic choices aligned with the teaching data.
transactionTypes.forEach((transaction) => {
  if (!Array.from(topicSelector.options).some((option) => option.value === transaction.topic)) {
    topicSelector.add(new Option(transaction.topicName, transaction.topic));
  }
  [1, 2].forEach((row) => {
    const select = document.querySelector(`#account-${row}`);
    [[transaction.debitAccount, transaction.debitName], [transaction.creditAccount, transaction.creditName]]
      .forEach(([value, name]) => {
        if (!Array.from(select.options).some((option) => option.value === value)) {
          select.add(new Option(name, value));
        }
      });
  });
});

const moneyWithPennies = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP"
});

// Sort after adjustment accounts have been added, retaining prompts at the top.
[topicSelector, document.querySelector("#account-1"), document.querySelector("#account-2")]
  .forEach((select) => {
    const selectedValue = select.value;
    const options = Array.from(select.options);
    const pinned = options.filter((option) => option.value === "" || option.value === "all");
    const choices = options.filter((option) => !pinned.includes(option));
    choices.sort((a, b) => a.text.localeCompare(b.text, "en-GB", {
      sensitivity: "base",
      numeric: true
    }));
    select.replaceChildren(...pinned, ...choices);
    select.value = selectedValue;
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
  mixedPracticeQueue = [];
  generateTransaction();
  updateTotals();
});

generateTransaction();
updateTotals();
