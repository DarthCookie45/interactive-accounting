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

const totalQuestions = 10;

const gameScreen = document.querySelector("#game-screen");
const resultScreen = document.querySelector("#result-screen");
const questionNumber = document.querySelector("#question-number");
const quizProgress = document.querySelector(".quiz-progress");
const quizProgressBar = document.querySelector("#quiz-progress-bar");
const accountName = document.querySelector("#account-name");
const questionAmount = document.querySelector("#question-amount");
const answerButtons = document.querySelectorAll(".answer-button");
const feedbackMessage = document.querySelector("#feedback-message");
const feedbackText = document.querySelector("#feedback-text");
const nextQuestionButton = document.querySelector("#next-question-button");
const scoreDisplay = document.querySelector("#score-display");
const scorePercentage = document.querySelector("#score-percentage");
const resultTitle = document.querySelector("#result-title");
const resultMessage = document.querySelector("#result-message");
const playAgainButton = document.querySelector("#play-again-button");

let currentQuestion;
let currentQuestionNumber;
let score;
let roundAccounts;

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

function shuffleAccounts() {
  const shuffledAccounts = [...accounts];

  for (let index = shuffledAccounts.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));

    [shuffledAccounts[index], shuffledAccounts[randomIndex]] =
      [shuffledAccounts[randomIndex], shuffledAccounts[index]];
  }

  return shuffledAccounts;
}

function updateProgress(answeredQuestions) {
  const progressPercentage = (answeredQuestions / totalQuestions) * 100;

  quizProgressBar.style.width = `${progressPercentage}%`;
  quizProgress.setAttribute("aria-valuenow", answeredQuestions);
}

function createQuestion() {
  currentQuestion = {
    account: roundAccounts[currentQuestionNumber - 1],
    amount: getRandomAmount()
  };

  questionNumber.textContent =
    `${currentQuestionNumber} / ${totalQuestions}`;

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

  if (isCorrect) {
    score++;
  }

  answerButtons.forEach((button) => {
    button.disabled = true;

    if (button.dataset.answer === currentQuestion.account.answer) {
      button.classList.add("correct-answer");
    }

    if (button.dataset.answer === selectedAnswer && !isCorrect) {
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

  if (currentQuestionNumber === totalQuestions) {
    nextQuestionButton.textContent = "View results";
  } else {
    nextQuestionButton.textContent = "Next question";
  }

  updateProgress(currentQuestionNumber);
  feedbackMessage.hidden = false;
}

function showResults() {
  const percentage = Math.round((score / totalQuestions) * 100);

  gameScreen.hidden = true;
  resultScreen.hidden = false;

  scoreDisplay.textContent = `${score} / ${totalQuestions}`;
  scorePercentage.textContent = `${percentage}%`;

  if (percentage >= 70) {
    resultTitle.textContent = "Brilliant work!";
    resultMessage.textContent =
      "You passed the Blitz. You are building a strong understanding of normal balances.";
  } else {
    resultTitle.textContent = "Keep practising!";
    resultMessage.textContent =
      "You are making progress. Review the feedback, then try another fresh round.";
  }
}

function moveToNextQuestion() {
  if (currentQuestionNumber === totalQuestions) {
    showResults();
    return;
  }

  currentQuestionNumber++;
  createQuestion();
}

function startRound() {
  currentQuestionNumber = 1;
  score = 0;
  roundAccounts = shuffleAccounts();

  resultScreen.hidden = true;
  gameScreen.hidden = false;

  updateProgress(0);
  createQuestion();
}

answerButtons.forEach((button) => {
  button.addEventListener("click", checkAnswer);
});

nextQuestionButton.addEventListener("click", moveToNextQuestion);
playAgainButton.addEventListener("click", startRound);

startRound();