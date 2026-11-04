"use strict";

const accounts = [
  {
    name: "Sales",
    category: "Income",
    destination: "profit-loss",
    description: "Income earned from selling goods or providing services.",
    explanation:
      "Sales contributes to the profit or loss for the period. It is reported as income in the statement of profit or loss.",
    example:
    "Sales income of £8,000 is reported in the statement of profit or loss for the period.",
  },
  {
    name: "Rent expense",
    category: "Expense",
    destination: "profit-loss",
    description: "The cost of using rented premises during the period.",
    explanation:
      "Rent expense reduces the profit for the period. It belongs in the statement of profit or loss.",
    example:
    "Rent expense of £1,200 is deducted when calculating profit or loss for the period.",
  },
  {
    name: "Equipment",
    category: "Non-current asset",
    destination: "financial-position",
    description: "Items the business uses over more than one accounting period.",
    explanation:
      "Equipment is a resource used by the business. Its carrying amount appears as a non-current asset in the statement of financial position.",
    example:
    "Equipment costing £3,000 with accumulated depreciation of £600 has a carrying amount of £2,400 in the statement of financial position.",
  },
  {
    name: "Bank",
    category: "Current asset",
    destination: "financial-position",
    description: "Money held in the business bank account.",
    explanation:
      "A positive bank balance is a current asset in the statement of financial position. A bank overdraft would usually be shown as a current liability.",
    example:
    "A positive bank balance of £950 at the reporting date is shown as a current asset.",
  },
  {
    name: "Bank loan",
    category: "Liability",
    destination: "financial-position",
    description: "Money the business owes to a lender.",
    explanation:
      "The outstanding loan appears in the statement of financial position. Amounts due within twelve months are normally current liabilities; longer-term amounts are normally non-current liabilities.",
    example:
    "A £5,000 loan with £1,000 due within twelve months and £4,000 due later is split between current and non-current liabilities, assuming the business has the right to defer the later repayment.",
  },
  {
    name: "Owner’s capital",
    category: "Capital",
    destination: "financial-position",
    description: "The owner’s interest in the sole trader’s business.",
    explanation:
      "Closing capital appears in the statement of financial position. It reflects the owner’s investment, profit or loss, and drawings.",
    example:
    "Opening capital of £5,000 plus profit of £2,000, less drawings of £500, gives closing capital of £6,500, assuming no additional investment.",
  },
  {
    name: "Drawings",
    category: "Deduction from capital",
    destination: "financial-position",
    description:
        "Money or other assets taken from the business by its owner for personal use.",
    explanation:
        "Drawings reduce the owner’s capital. They are included when calculating closing capital, which appears in the statement of financial position. Drawings are not an expense in the statement of profit or loss.",
    example:
    "If the owner withdraws £500 for personal use, that £500 is deducted when calculating closing capital. It does not reduce the business’s profit.",
}
];

const accountList = document.querySelector("#statement-account-list");
const detailHeading = document.querySelector("#statement-detail-heading");
const accountDescription = document.querySelector(
  "#statement-account-description"
);
const accountCategory = document.querySelector(
  "#statement-account-category"
);
const accountExplanation = document.querySelector(
  "#statement-account-explanation"
);
const accountExample = document.querySelector(
  "#statement-account-example"
);

const exampleButton = document.querySelector(
  "#toggle-statement-example"
);

const examplePanel = document.querySelector(
  "#statement-example-panel"
);

const destinations = document.querySelectorAll(".statement-destination");

function selectAccount(index) {
  const account = accounts[index];

  detailHeading.textContent = account.name;
  accountDescription.textContent = account.description;
  accountCategory.textContent = `Category: ${account.category}`;

  const destinationName = account.destination === "profit-loss"
    ? "Statement of profit or loss"
    : "Statement of financial position";

  accountExplanation.textContent =
    `${destinationName}. ${account.explanation}`;
    accountExample.textContent = account.example;
    examplePanel.hidden = true;
    exampleButton.textContent = "Show example";
    exampleButton.setAttribute("aria-expanded", "false");

  accountList.querySelectorAll("button").forEach((button, buttonIndex) => {
    const isSelected = buttonIndex === index;

    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });

  destinations.forEach((destination) => {
    const isMatch = destination.id === `destination-${account.destination}`;

    destination.classList.toggle("is-highlighted", isMatch);
    const matchLabel = destination.querySelector(".statement-match");
    
    matchLabel.hidden = !isMatch;
    matchLabel.textContent = account.name === "Drawings"
    ? "This account reduces the closing capital shown here."
    : "This account belongs here.";
    });
}

accounts.forEach((account, index) => {
  const button = document.createElement("button");

  button.type = "button";
  button.className = "statement-account-button";
  button.textContent = account.name;
  button.setAttribute("aria-pressed", "false");

  button.addEventListener("click", () => selectAccount(index));

  accountList.append(button);
});

exampleButton.addEventListener("click", () => {
  const showExample = examplePanel.hidden;

  examplePanel.hidden = !showExample;
  exampleButton.textContent = showExample
    ? "Hide example"
    : "Show example";

  exampleButton.setAttribute("aria-expanded", String(showExample));
});

selectAccount(0);

const exploreModeButton = document.querySelector(
  "#statements-explore-mode"
);
const practiceModeButton = document.querySelector(
  "#statements-practice-mode"
);
const exploreLayout = document.querySelector(".statements-layout");
const practicePanel = document.querySelector("#statements-practice");
const practiceHeading = document.querySelector("#practice-heading");
const practiceAccountName = document.querySelector("#practice-account");
const practiceFeedback = document.querySelector(
  "#statements-practice-feedback"
);
const nextAccountButton = document.querySelector(
  "#statements-next-account"
);
const answerButtons = document.querySelectorAll(
  "[data-statement-answer]"
);

let practiceAccount = null;
let practiceAnswered = false;

function nextPracticeAccount() {
  // Avoid showing the same account twice in succession.
  const availableAccounts = accounts.filter((account) => {
    return account !== practiceAccount;
  });

  const randomIndex = Math.floor(
    Math.random() * availableAccounts.length
  );

  practiceAccount = availableAccounts[randomIndex];
  practiceAnswered = false;

  practiceAccountName.textContent = practiceAccount.name;
  practiceFeedback.hidden = true;
  practiceFeedback.textContent = "";
  nextAccountButton.hidden = true;

  answerButtons.forEach((button) => {
    button.disabled = false;
  });
}

function setPracticeMode(isPractice) {
  exploreLayout.hidden = isPractice;
  practicePanel.hidden = !isPractice;

  exploreModeButton.setAttribute(
    "aria-pressed",
    String(!isPractice)
  );
  practiceModeButton.setAttribute(
    "aria-pressed",
    String(isPractice)
  );

  exploreModeButton.className = isPractice
    ? "btn btn-outline-primary"
    : "btn btn-primary";

  practiceModeButton.className = isPractice
    ? "btn btn-primary"
    : "btn btn-outline-primary";

  if (isPractice) {
    nextPracticeAccount();
    practiceHeading.focus();
  } else {
    detailHeading.focus();
  }
}

answerButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (practiceAnswered) return;

    const isCorrect =
      button.dataset.statementAnswer === practiceAccount.destination;

    const destinationName =
      practiceAccount.destination === "profit-loss"
        ? "statement of profit or loss"
        : "statement of financial position";

    practiceFeedback.textContent = isCorrect
      ? `Correct! ${practiceAccount.explanation}`
      : `This account contributes to the ${destinationName}. ` +
        practiceAccount.explanation;

    practiceFeedback.className = isCorrect
      ? "alert alert-success mt-3"
      : "alert alert-info mt-3";

    practiceFeedback.hidden = false;
    practiceAnswered = true;

    answerButtons.forEach((answerButton) => {
      answerButton.disabled = true;
    });

    nextAccountButton.hidden = false;
    nextAccountButton.focus();
  });
});

exploreModeButton.addEventListener("click", () => {
  setPracticeMode(false);
});

practiceModeButton.addEventListener("click", () => {
  setPracticeMode(true);
});

nextAccountButton.addEventListener("click", () => {
  nextPracticeAccount();
  practiceHeading.focus();
});