"use strict";

const accounts = [
  {
    name: "Cash",
    answer: "debit",
    explanation: "Cash is an asset. Assets normally increase on the debit side."
  },
  {
    name: "Inventory",
    answer: "debit",
    explanation: "Inventory is an asset. Assets normally increase on the debit side."
  },
  {
    name: "Trade receivables",
    answer: "debit",
    explanation: "Trade receivables are an asset. Assets normally increase on the debit side."
  },
  {
    name: "Rent expense",
    answer: "debit",
    explanation: "Rent expense is an expense. Expenses normally increase on the debit side."
  },
  {
    name: "Wages expense",
    answer: "debit",
    explanation: "Wages expense is an expense. Expenses normally increase on the debit side."
  },
  {
    name: "Electricity expense",
    answer: "debit",
    explanation: "Electricity expense is an expense. Expenses normally increase on the debit side."
  },
  {
    name: "Trade payables",
    answer: "credit",
    explanation: "Trade payables are a liability. Liabilities normally increase on the credit side."
  },
  {
    name: "Bank loan",
    answer: "credit",
    explanation: "A bank loan is a liability. Liabilities normally increase on the credit side."
  },
  {
    name: "Owner's capital",
    answer: "credit",
    explanation: "Owner's capital is equity. Equity normally increases on the credit side."
  },
  {
    name: "Sales revenue",
    answer: "credit",
    explanation: "Sales revenue is income. Income normally increases on the credit side."
  }
];

const accountName = document.querySelector("#account-name");
const questionAmount = document.querySelector("#question-amount");
const answerButtons = document.querySelectorAll(".answer-button");
const feedbackMessage = document.querySelector("#feedback-message");
const feedbackText = document.querySelector("#feedback-text");
const newQuestionButton = document.querySelector("#new-question-button");

let currentQuestion;

function getRandomAmount() {
  const minimumAmount = 50;
  const maximumAmount = 500;
  const increment = 10;

  const numberOfPossibleAmounts =
    (maximumAmount - minimumAmount) / increment + 1;

  return (
    Math.floor(Math.random() * numberOfPossibleAmounts) * increment +
    minimumAmount
  );
}

function createQuestion() {
  const randomIndex = Math.floor(Math.random() * accounts.length);

  currentQuestion = {
    account: accounts[randomIndex],
    amount: getRandomAmount()
  };

  accountName.textContent = currentQuestion.account.name;
  questionAmount.textContent = `Increase: £${currentQuestion.amount}`;

  feedbackMessage.hidden = true;

  answerButtons.forEach((button) => {
    button.disabled = false;
    button.classList.remove("correct-answer", "incorrect-answer");
  });
}

function checkAnswer(event) {
  const selectedAnswer = event.target.dataset.answer;
  const isCorrect = selectedAnswer === currentQuestion.account.answer;

  answerButtons.forEach((button) => {
    button.disabled = true;

    if (button.dataset.answer === currentQuestion.account.answer) {
      button.classList.add("correct-answer");
    }

    if (
      button.dataset.answer === selectedAnswer &&
      !isCorrect
    ) {
      button.classList.add("incorrect-answer");
    }
  });

  if (isCorrect) {
    feedbackText.textContent =
      `Correct! ${currentQuestion.account.explanation}`;
  } else {
    feedbackText.textContent =
      `Not quite. ${currentQuestion.account.explanation}`;
  }

  feedbackMessage.hidden = false;
}

answerButtons.forEach((button) => {
  button.addEventListener("click", checkAnswer);
});

newQuestionButton.addEventListener("click", createQuestion);

createQuestion();