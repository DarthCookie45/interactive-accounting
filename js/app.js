"use strict";

const quickThinkQuestions = [
  ["A business pays this month’s electricity bill from Bank. Which two accounts change?", "Electricity expense and Bank. Debit the expense and credit Bank."],
  ["The owner invests money into the business bank account. Which two accounts change?", "Bank and Owner’s capital. Debit Bank and credit Owner’s capital."],
  ["A business buys a van and pays from Bank. Which two accounts change?", "Motor vehicles and Bank. Debit Motor vehicles and credit Bank."],
  ["A customer pays immediately for services provided. Which two accounts change?", "Bank and Sales. Debit Bank and credit Sales."],
  ["The owner takes business money for personal use. Which two accounts change?", "Drawings and Bank. Debit Drawings and credit Bank."],
  ["A business receives a bank loan. Which two accounts change?", "Bank and Bank loan. Debit Bank and credit Bank loan."],
  ["A business repays loan principal from Bank. Which two accounts change?", "Bank loan and Bank. Debit Bank loan and credit Bank."],
  ["A business buys equipment on credit. Which two accounts change?", "Equipment and Trade payables. Debit Equipment and credit Trade payables."],
  ["A business pays a supplier it already owes. Which two accounts change?", "Trade payables and Bank. Debit Trade payables and credit Bank."],
  ["A customer settles an outstanding invoice. Which two accounts change?", "Bank and Trade receivables. Debit Bank and credit Trade receivables."],
  ["In DEADCLIC, what does the first D stand for?", "Debit. Debits normally increase expenses, assets and drawings."],
  ["In DEADCLIC, what does E stand for?", "Expenses."],
  ["In DEADCLIC, what does A stand for?", "Assets."],
  ["In DEADCLIC, what does the second D stand for?", "Drawings."],
  ["In DEADCLIC, what does the first C stand for?", "Credit. Credits normally increase liabilities, income and capital."],
  ["In DEADCLIC, what does L stand for?", "Liabilities."],
  ["In DEADCLIC, what does I stand for?", "Income."],
  ["In DEADCLIC, what does the final C stand for?", "Capital."],
  ["In D.E.A.L.E.R., what does A stand for?", "Assets. Their normal balance is a debit."],
  ["In D.E.A.L.E.R., what does L stand for?", "Liabilities. Their normal balance is a credit."],
  ["In D.E.A.L.E.R., what does R stand for?", "Revenue. Its normal balance is a credit."],
  ["In D.E.A.L.E.R., what does the E after L stand for?", "Equity, including the owner’s capital. Its normal balance is a credit."],
  ["Which core report summarises income, costs and expenses over a period to show a profit or loss?", "The statement of profit or loss, also called a profit and loss statement or P&L."],
  ["Which statement shows assets, liabilities and capital at a particular date?", "The statement of financial position, also called the balance sheet."],
  ["What is a list of account balances used to check that total debits equal total credits?", "A trial balance."],
  ["What is the name for amounts owed to a business by its customers?", "Trade receivables."],
  ["What is the name for amounts a business owes its suppliers?", "Trade payables."],
  ["What do we call an expense incurred this period that has not yet been paid?", "An accrued expense. The unpaid amount is a liability."],
  ["What do we call an expense paid in advance for a future period?", "A prepaid expense or prepayment. It is an asset."],
  ["What do we call income received before the related service has been provided?", "Deferred income, also called income received in advance or prepaid income. It is a liability."],
  ["What do we call income earned but not yet received?", "Accrued income. It is an asset."],
  ["What allocates an asset’s depreciable amount over its useful life?", "Depreciation."],
  ["Does a bank loan increase sales income?", "No. It increases Bank and a loan liability."],
  ["Do drawings reduce the business’s profit?", "No. Drawings reduce the owner’s capital."],
  ["Do equal trial balance totals prove that every transaction is correct?", "No. Some errors, such as using the wrong account, can leave the trial balance balanced."],
  ["What is the accounting equation?", "Assets = Liabilities + Capital."],
  ["How do you calculate gross profit?", "Sales revenue minus cost of sales."],
  ["How do you calculate closing capital for a sole trader?", "Opening capital + additional investment + profit − drawings. A loss reduces capital."],
  ["Which documents can provide evidence for recording transactions?", "Examples include invoices, receipts and bank statements."],
  ["What do the two sides of a T-account represent?", "Debit on the left and credit on the right."]
];

const quickQuestion = document.querySelector("#quick-think-question");
const quickAnswer = document.querySelector("#quick-think-answer");
const quickReveal = document.querySelector("#quick-think-reveal");
const quickPrevious = document.querySelector("#quick-think-previous");
const quickNext = document.querySelector("#quick-think-next");
let quickRound = [];
let quickIndex = 0;
let revealedAnswers = new Set();

function startQuickThink() {
  const shuffled = [...quickThinkQuestions];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
  }
  quickRound = shuffled.slice(0, 5);
  quickIndex = 0;
  revealedAnswers = new Set();
  renderQuickThink();
}

function renderQuickThink() {
  const position = quickIndex + 1;
  const revealed = revealedAnswers.has(quickIndex);
  document.querySelector("#quick-think-position").textContent =
    "QUICK THINK · " + String(position).padStart(2, "0") + " / 05";
  quickQuestion.textContent = quickRound[quickIndex][0];
  quickAnswer.textContent = revealed ? quickRound[quickIndex][1] : "";
  quickAnswer.hidden = !revealed;
  quickReveal.hidden = revealed;
  quickPrevious.disabled = quickIndex === 0;
  quickNext.disabled = quickIndex === 4;
  const progress = document.querySelector("#quick-think-progress");
  progress.setAttribute("aria-valuenow", String(position));
  progress.setAttribute("aria-valuetext", "Question " + position + " of 5");
  progress.querySelector(".progress-bar").style.width = position * 20 + "%";
}

quickReveal.addEventListener("click", () => {
  revealedAnswers.add(quickIndex);
  renderQuickThink();
});
quickPrevious.addEventListener("click", () => {
  if (quickIndex > 0) quickIndex--;
  renderQuickThink();
  quickQuestion.focus({ preventScroll: true });
});
quickNext.addEventListener("click", () => {
  if (quickIndex === 4) return;
  quickIndex++;
  renderQuickThink();
  quickQuestion.focus({ preventScroll: true });
});

document.querySelectorAll(".activity-link").forEach((link) => {
  const label = document.createElement("span");
  label.textContent = "Start Activity";
  const arrows = document.createElement("span");
  arrows.className = "activity-chevrons";
  arrows.setAttribute("aria-hidden", "true");
  for (let index = 0; index < 10; index++) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 56 40");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("focusable", "false");
    svg.style.setProperty("--chevron-index", index);
    const shape = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    shape.setAttribute("points", "3,3 28,3 53,20 28,37 3,37 22,20");
    svg.append(shape);
    arrows.append(svg);
  }
  link.replaceChildren(label, arrows);
});

startQuickThink();

// Reserve enough space for every question and answer at the current text width.
function sizeQuickThink() {
  const preview = document.querySelector(".question-preview");
  const probe = preview.cloneNode(true);
  probe.removeAttribute("id");
  probe.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));
  probe.setAttribute("aria-hidden", "true");
  probe.inert = true;
  Object.assign(probe.style, {
    position: "fixed", visibility: "hidden", pointerEvents: "none",
    width: preview.getBoundingClientRect().width + "px", left: "-10000px", top: "0"
  });
  document.body.append(probe);
  const questionProbe = probe.querySelector("h2");
  const answerProbe = probe.querySelector(".quick-think-answer");
  const questionStyle = getComputedStyle(quickQuestion);
  questionProbe.style.font = questionStyle.font;
  questionProbe.style.lineHeight = questionStyle.lineHeight;
  questionProbe.style.height = "auto";
  answerProbe.style.height = "auto";
  let questionHeight = 0;
  let answerHeight = 0;
  for (const [question, answer] of quickThinkQuestions) {
    questionProbe.textContent = question;
    answerProbe.textContent = answer;
    questionHeight = Math.max(questionHeight, questionProbe.getBoundingClientRect().height);
    answerHeight = Math.max(answerHeight, answerProbe.getBoundingClientRect().height);
  }
  quickQuestion.style.height = Math.ceil(questionHeight) + "px";
  quickAnswer.parentElement.style.height = Math.ceil(answerHeight) + "px";
  probe.remove();
}

let quickThinkWidth = 0;
const quickThinkResize = new ResizeObserver(([entry]) => {
  if (entry.contentRect.width === quickThinkWidth) return;
  quickThinkWidth = entry.contentRect.width;
  sizeQuickThink();
});
quickThinkResize.observe(document.querySelector(".question-preview"));
document.fonts.ready.then(sizeQuickThink);
