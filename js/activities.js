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


const get = (id) => document.getElementById(id);
const answerButtons = document.querySelectorAll("[data-answer]");
const progress = document.querySelector(".quiz-progress");
const pounds = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
let currentQuestion = null;
let history = [];
let queue = [];
let active = false;
let deadline = 0;
let timer = null;
let inputTimes = [];
let frozenUntil = 0;
let freezes = 0;

function clearAnswerEffects() {
  answerButtons.forEach((button) => button.getAnimations().forEach((animation) => animation.cancel()));
}

function updateFreeze() {
  const remaining = Math.max(0, frozenUntil - performance.now());
  const frozen = active && remaining > 0;
  get("blitz-freeze-overlay").hidden = !frozen;
  get("blitz-freeze-warning").hidden = !frozen;
  answerButtons.forEach((button) => { button.disabled = !active || frozen; });
  if (frozen) {
    get("blitz-freeze-warning").textContent =
      "Spamming detected — answers frozen for " + Math.ceil(remaining / 1000) + "s.";
  }
}

function createQuestion() {
  if (!queue.length) {
    queue = [...accounts];
    for (let index = queue.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [queue[index], queue[other]] = [queue[other], queue[index]];
    }
    if (queue.at(-1) === currentQuestion?.account) {
      [queue[0], queue[queue.length - 1]] = [queue.at(-1), queue[0]];
    }
  }
  currentQuestion = { account: queue.pop(), amount: (Math.floor(Math.random() * 46) + 5) * 10 };
  currentQuestion.increase = Math.random() < 0.5;
  const normalSide = currentQuestion.account.answer;
  currentQuestion.answer = currentQuestion.increase
    ? normalSide : normalSide === "debit" ? "credit" : "debit";
  currentQuestion.explanation = currentQuestion.account.explanation +
    (currentQuestion.increase
      ? " This question asks for an increase, so use " + currentQuestion.answer + "."
      : " This question asks for a decrease, so use the opposite side: " + currentQuestion.answer + ".");
  get("account-name").textContent = currentQuestion.account.name;
  get("question-amount").textContent = (currentQuestion.increase ? "Increase by " : "Decrease by ") +
    pounds.format(currentQuestion.amount);
}

function updateClock() {
  const remaining = Math.max(0, deadline - performance.now());
  get("blitz-timer").textContent = Math.ceil(remaining / 1000) + "s";
  get("quiz-progress-bar").style.width = remaining / 600 + "%";
  progress.setAttribute("aria-valuenow", String(Math.ceil(remaining / 1000)));
  if (active && remaining === 0) showResults();
  updateFreeze();
  return remaining;
}

function startRound() {
  clearInterval(timer);
  history = [];
  queue = [];
  currentQuestion = null;
  inputTimes = [];
  frozenUntil = 0;
  freezes = 0;
  clearAnswerEffects();
  get("blitz-ready").hidden = true;
  get("result-screen").hidden = true;
  get("game-screen").hidden = false;
  get("question-number").textContent = "0 answered";
  get("blitz-live-score").textContent = "0 correct";
  get("blitz-celebration").hidden = true;
  get("blitz-celebration").replaceChildren();
  answerButtons.forEach((button) => { button.disabled = false; });
  createQuestion();
  active = true;
  deadline = performance.now() + 60000;
  updateClock();
  timer = setInterval(updateClock, 100);
  get("account-name").focus({ preventScroll: true });
}

function answer(selected) {
  if (!active || updateClock() <= 0) return;
  const now = performance.now();
  if (now < frozenUntil) return;
  inputTimes = inputTimes.filter((time) => now - time < 1000);
  inputTimes.push(now);
  if (inputTimes.length >= 5) {
    freezes += 1;
    frozenUntil = now + 3000;
    inputTimes = [];
    clearAnswerEffects();
    updateFreeze();
    return;
  }
  const isCorrect = selected === currentQuestion.answer;
  history.push({ ...currentQuestion, selected, isCorrect });
  if (!isCorrect) deadline -= 5000;
  const chosenButton = [...answerButtons].find((button) => button.dataset.answer === selected);
  chosenButton.getAnimations().forEach((animation) => animation.cancel());
  chosenButton.animate([
    { backgroundColor: isCorrect ? "#dff6e8" : "#ffe3e3", color: "#1f2937" },
    { backgroundColor: "#5b3cc4", color: "#ffffff" }
  ], { duration: 300, easing: "ease-out" });
  get("question-number").textContent = history.length + " answered";
  get("blitz-live-score").textContent = history.filter((item) => item.isCorrect).length + " correct";
  if (updateClock() > 0) createQuestion();
}

function renderReview(id, answers, detailed) {
  const list = get(id);
  list.replaceChildren();
  for (const item of answers) {
    const row = document.createElement("li");
    const heading = document.createElement("strong");
    heading.textContent = item.account.name + (item.increase ? " increased by " : " decreased by ") + pounds.format(item.amount);
    const detail = document.createElement("p");
    const chosen = document.createElement("p");
    chosen.className = "mb-1";
    chosen.textContent = "Your answer: " + item.selected;
    const correct = document.createElement("p");
    correct.className = "mb-2 fw-bold";
    correct.textContent = "Correct answer: " + item.answer;
    detail.textContent = item.explanation +
      (detailed ? " Check both the account category and whether the question asks for an increase or decrease." : "");
    row.append(heading, chosen, correct, detail);
    list.append(row);
  }
}

function celebrate() {
  const container = get("blitz-celebration");
  container.hidden = false;
  for (let index = 0; index < 20; index++) {
    const piece = document.createElement("span");
    piece.textContent = index % 5 === 0 ? "🎈" : "🎉";
    piece.style.setProperty("--party-left", (index * 5) + "%");
    piece.style.setProperty("--party-delay", (index % 5) * 0.15 + "s");
    container.append(piece);
  }
}

function showResults() {
  if (!active) return;
  active = false;
  clearInterval(timer);
  timer = null;
  clearAnswerEffects();
  answerButtons.forEach((button) => { button.disabled = true; });
  get("game-screen").hidden = true;
  get("result-screen").hidden = false;
  const right = history.filter((item) => item.isCorrect);
  const wrong = history.filter((item) => !item.isCorrect);
  const percentage = history.length ? Math.round(right.length / history.length * 100) : 0;
  get("score-display").textContent = right.length + " correct / " + history.length + " answered";
  get("score-percentage").textContent = percentage + "%";
  get("blitz-freeze-count").textContent = "Answer freezes: " + freezes;
  const perfect = history.length > 0 && wrong.length === 0;
  get("result-title").textContent = perfect ? "🏆 Perfect accuracy!" : percentage >= 70 ? "🌟 Well done!" : "💪 Keep practising!";
  get("result-message").textContent = !history.length
    ? "No answers this time. Start another round when you’re ready."
    : perfect ? "Every answer was correct! Outstanding concentration — try another round and see how many you can answer."
      : percentage >= 70 ? "You’re building speed and confidence. Use the review below to strengthen your next round."
        : "Every attempt helps you learn. Read the explanations below, then give it another go.";
  get("blitz-right-message").textContent = right.length
    ? "These are the normal-balance rules you applied successfully."
    : "Your correct answers will appear here after your next round.";
  get("blitz-wrong-message").textContent = wrong.length
    ? "Compare your choice with the correct answer and its account category. Each mistake removed five seconds."
    : "No incorrect answers to review.";
  renderReview("blitz-right-list", right, false);
  renderReview("blitz-wrong-list", wrong, true);
  if (perfect) celebrate();
  get("result-title").focus();
}

answerButtons.forEach((button) => button.addEventListener("click", (event) => {
  answer(button.dataset.answer);
}));
document.addEventListener("keydown", (event) => {
  if (!active || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (["INPUT", "SELECT", "TEXTAREA"].includes(event.target.tagName) || event.target.isContentEditable) return;
  const key = event.key.toLowerCase();
  if (key === "arrowleft" || key === "a") {
    event.preventDefault();
    answer("debit");
  } else if (key === "arrowright" || key === "d") {
    event.preventDefault();
    answer("credit");
  }
});
get("blitz-start").addEventListener("click", startRound);
get("play-again-button").addEventListener("click", startRound);
document.addEventListener("visibilitychange", () => { if (active) updateClock(); });
