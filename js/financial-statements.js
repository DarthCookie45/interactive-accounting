"use strict";

const accounts = [
  {
    name: "Sales",
    category: "Income",
    destination: "profit-loss",
    description: "Income earned from selling goods or providing services.",
    explanation:
      "Sales contributes to the profit or loss for the period. It is reported as income in the statement of profit or loss."
  },
  {
    name: "Rent expense",
    category: "Expense",
    destination: "profit-loss",
    description: "The cost of using rented premises during the period.",
    explanation:
      "Rent expense reduces the profit for the period. It belongs in the statement of profit or loss."
  },
  {
    name: "Equipment",
    category: "Non-current asset",
    destination: "financial-position",
    description: "Items the business uses over more than one accounting period.",
    explanation:
      "Equipment is a resource used by the business. Its carrying amount appears as a non-current asset in the statement of financial position."
  },
  {
    name: "Bank",
    category: "Current asset",
    destination: "financial-position",
    description: "Money held in the business bank account.",
    explanation:
      "A positive bank balance is a current asset in the statement of financial position. A bank overdraft would usually be shown as a current liability."
  },
  {
    name: "Bank loan",
    category: "Liability",
    destination: "financial-position",
    description: "Money the business owes to a lender.",
    explanation:
      "The outstanding loan appears in the statement of financial position. Amounts due within twelve months are normally current liabilities; longer-term amounts are normally non-current liabilities."
  },
  {
    name: "Owner’s capital",
    category: "Capital",
    destination: "financial-position",
    description: "The owner’s interest in the sole trader’s business.",
    explanation:
      "Closing capital appears in the statement of financial position. It reflects the owner’s investment, profit or loss, and drawings."
  },
  {
    name: "Drawings",
    category: "Deduction from capital",
    destination: "financial-position",
    description:
        "Money or other assets taken from the business by its owner for personal use.",
    explanation:
        "Drawings reduce the owner’s capital. They are included when calculating closing capital, which appears in the statement of financial position. Drawings are not an expense in the statement of profit or loss."
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

selectAccount(0);