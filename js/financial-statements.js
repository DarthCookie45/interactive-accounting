"use strict";

// Statement destinations describe the named account, not its matching journal entry.
const accountRows = [
  ["Sales", "income", "profit-loss", "Income", "Sales earned this period contribute to profit.", "£8,000 earned sales are income in the SPL."],
  ["Rent expense", "expense", "profit-loss", "Expense", "Rent used this period reduces profit.", "£1,200 rent is an expense in the SPL."],
  ["Wages expense", "expense", "profit-loss", "Expense", "Staff costs for this period reduce profit.", "£2,400 wages are an expense."],
  ["Electricity expense", "expense", "profit-loss", "Expense", "Electricity used is an expense, including the unpaid portion.", "£300 paid plus £50 accrued gives £350 expense."],
  ["Insurance expense", "expense", "profit-loss", "Expense", "Only insurance relating to this period is an expense.", "£1,200 paid less £200 prepaid gives £1,000 expense."],
  ["Depreciation expense", "expense", "profit-loss", "Expense", "Depreciation allocates an asset’s depreciable amount over its useful life.", "A £600 annual charge reduces profit by £600."],
  ["Allowance adjustment — increase (SPL)", "expense", "profit-loss", "Expense increase", "An increase in the receivables allowance is a debit expense adjustment.", "An allowance rising from £200 to £350 gives a £150 SPL debit."],
  ["Allowance adjustment — decrease (SPL)", "expense", "profit-loss", "Expense reduction (credit)", "A decrease credits the SPL adjustment to reduce expense; it is not sales income.", "An allowance falling from £350 to £200 gives a £150 SPL credit."],
  ["Irrecoverable debts expense", "expense", "profit-loss", "Expense", "A receivable written off creates an expense in this simplified treatment.", "Writing off £100 debits expense and credits trade receivables."],
  ["Cost of sales", "expense", "profit-loss", "Expense", "The cost of inventory sold is deducted from revenue.", "Opening inventory £500 + purchases £2,000 − closing inventory £700 = £1,800."],
  ["Closing inventory adjustment (SPL)", "expense", "profit-loss", "Cost of sales reduction (credit)", "Under periodic inventory accounting the closing inventory credit reduces cost of sales, not sales revenue.", "£700 closing inventory produces a £700 credit adjustment to cost of sales."],
  ["Loan interest expense", "expense", "profit-loss", "Expense", "Interest is a borrowing cost; repayment of loan principal is not an expense.", "£80 interest is an expense; £500 principal repaid reduces the loan."],
  ["Equipment", "asset", "financial-position", "Non-current asset", "Equipment is reported net of accumulated depreciation.", "£3,000 cost less £600 depreciation gives £2,400 carrying amount."],
  ["Motor vehicles", "asset", "financial-position", "Non-current asset", "Vehicles used by the business are reported net of depreciation.", "£10,000 cost less £2,000 depreciation gives £8,000."],
  ["Bank (positive balance)", "asset", "financial-position", "Current asset", "Money held in the bank is an asset. An overdraft is treated separately as a liability.", "A positive £950 balance is a current asset."],
  ["Trade receivables", "asset", "financial-position", "Current asset", "Amounts owed by customers are shown net of any allowance.", "£4,000 receivables less £200 allowance gives £3,800."],
  ["Accrued income", "asset", "financial-position", "Current asset", "Income earned but not yet received creates an asset receivable.", "£250 earned but not received is an accrued income asset."],
  ["Prepaid expense", "asset", "financial-position", "Current asset", "Payments for future periods represent future benefits.", "£200 insurance for next period is a prepayment asset."],
  ["Closing inventory (SFP)", "asset", "financial-position", "Current asset", "Inventory is reported at the lower of cost and net realisable value.", "£700 cost with £650 net realisable value is reported at £650."],
  ["Accumulated depreciation", "asset", "financial-position", "Contra-asset (credit balance)", "This credit balance reduces the related asset; it is not a liability or the SPL expense account.", "£3,000 equipment less £600 accumulated depreciation gives £2,400."],
  ["Allowance for doubtful receivables", "asset", "financial-position", "Contra-asset (credit balance)", "This allowance reduces trade receivables in the SFP. Only its movement is adjusted in the SPL.", "£4,000 gross receivables less £200 allowance gives £3,800."],
  ["Bank loan", "liability", "financial-position", "Liability", "Classification depends on repayment terms and the right to defer settlement.", "£1,000 due within twelve months is current; £4,000 due later may be non-current."],
  ["Trade payables", "liability", "financial-position", "Current liability", "Amounts owed to suppliers are obligations.", "£900 due to suppliers is a current liability."],
  ["Accrued expense", "liability", "financial-position", "Current liability", "Costs incurred but unpaid create a liability. The expense itself appears separately in the SPL.", "£150 unpaid electricity creates an accrued expense liability."],
  ["Prepaid income (deferred income)", "liability", "financial-position", "Current liability in this example", "Money received for next period’s services is an obligation, not yet earned income.", "£500 received for next month’s services is deferred income."],
  ["Bank overdraft", "liability", "financial-position", "Current liability", "An overdrawn bank balance is owed to the bank.", "A £300 overdraft is normally a current liability."],
  ["Drawings", "drawings", "financial-position", "Deduction from capital", "Personal withdrawals reduce closing capital, not business profit.", "£5,000 opening capital + £2,000 profit − £500 drawings = £6,500."],
  ["Owner’s capital", "capital", "financial-position", "Capital", "Closing capital reflects investment, profit or loss, and drawings.", "£5,000 opening + £1,000 investment + £2,000 profit − £500 drawings = £7,500."],
  ["Commission income", "income", "profit-loss", "Income", "Commission earned this period contributes to profit, whether received or accrued.", "£400 commission earned is income in the SPL."],
  ["Rent income", "income", "profit-loss", "Income", "Earned rent contributes to profit; receipts for future periods are deferred.", "£800 received less £100 for next period gives £700 earned income."]
];
const accounts = accountRows.map(([name, group, destination, category, explanation, example]) => ({name, group, destination, category, explanation, example}));
const groups = [
  ["D", "Debit", "debit", "Debits normally increase expenses, assets and drawings. A debit does not always mean money received."],
  ["E", "Expenses", "expense", "Expenses normally increase with a debit. Some adjustments credit an expense to reduce it."],
  ["A", "Assets", "asset", "Assets normally increase with a debit. Contra-assets such as accumulated depreciation and allowances normally have credit balances and reduce assets."],
  ["D", "Drawings", "drawings", "Drawings increase with a debit and reduce closing capital; they are not expenses."],
  ["C", "Credit", "credit", "Credits normally increase liabilities, income and capital. A credit does not always mean money paid."],
  ["L", "Liabilities", "liability", "Liabilities normally increase with a credit and decrease with a debit."],
  ["I", "Income", "income", "Income normally increases with a credit and contributes to profit."],
  ["C", "Capital", "capital", "The owner’s investment increases capital with a credit. Profit increases closing capital and drawings reduce it."]
];
const $ = (selector) => document.querySelector(selector);
const detailHeading = $("#statement-detail-heading");
const categorySelect = $("#statement-category-accounts");
let groupAccounts = [];

function selectAccount(index) {
  const account = groupAccounts[index];
  $("#statement-account-category").textContent = `${account.name} · ${account.category}`;
  $("#statement-account-explanation").textContent = account.explanation;
  $("#statement-account-example").textContent = account.example;
  $("#statement-example-panel").hidden = true;
  $("#toggle-statement-example").textContent = "Show example";
  $("#toggle-statement-example").setAttribute("aria-expanded", "false");
  document.querySelectorAll(".statement-destination").forEach((panel) => {
    const match = panel.id === `destination-${account.destination}`;
    panel.classList.toggle("is-highlighted", match);
    panel.querySelector(".statement-match").hidden = !match;
    panel.querySelector(".statement-match").textContent = account.group === "drawings"
      ? "Drawings reduce the closing capital shown here." : "This account contributes here.";
  });
}
function selectGroup(index) {
  const [letter, name, key, explanation] = groups[index];
  detailHeading.textContent = `${letter} — ${name}`;
  $("#statement-account-description").textContent = explanation;
  groupAccounts = accounts.filter((account) => {
    if (key === "debit") return ["expense", "asset", "drawings"].includes(account.group);
    if (key === "credit") return ["liability", "income", "capital"].includes(account.group);
    return account.group === key;
  });
  groupAccounts.sort((a, b) => a.name.localeCompare(b.name, "en-GB", { sensitivity: "base", numeric: true }));
  categorySelect.replaceChildren();
  groupAccounts.forEach((account, i) => categorySelect.add(new Option(account.name, i)));
  document.querySelectorAll(".deadclic-button").forEach((button, i) => {
    button.classList.toggle("is-selected", index === i);
    button.setAttribute("aria-pressed", String(index === i));
  });
  selectAccount(0);
}
groups.forEach(([letter, name], index) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "statement-account-button deadclic-button";
  const initial = document.createElement("strong");
  initial.textContent = letter;
  const label = document.createElement("span");
  label.textContent = name;
  button.append(initial, label);
  button.addEventListener("click", () => selectGroup(index));
  $("#statement-account-list").append(button);
});
categorySelect.addEventListener("change", () => selectAccount(Number(categorySelect.value)));
$("#toggle-statement-example").addEventListener("click", () => {
  const show = $("#statement-example-panel").hidden;
  $("#statement-example-panel").hidden = !show;
  $("#toggle-statement-example").textContent = show ? "Hide example" : "Show example";
  $("#toggle-statement-example").setAttribute("aria-expanded", String(show));
});
selectGroup(0);

const answerButtons = document.querySelectorAll("[data-statement-answer]");
let practiceAccount = null;
let practiceAnswered = false;
let active = false;
let finished = false;
let correct = 0;
let answered = 0;
let streak = 0;
let bestStreak = 0;
let gameMode = "10";
let queue = [];

function updateTracker() {
  const percentage = answered ? Math.round(correct / answered * 100) : 0;
  $("#stat-correct").textContent = correct;
  $("#stat-percentage").textContent = `(${percentage}%)`;
  $("#stat-answered").textContent = answered;
  $("#stat-streak").textContent = streak;
  $("#stat-best").textContent = bestStreak;
  $("#practice-goal").textContent = gameMode === "streak"
    ? "Goal: 10 correct answers in a row. A mistake resets the streak, not your total score."
    : gameMode === "unlimited" ? "Unlimited practice — continue at your own pace." : `Goal: ${gameMode} answered questions.`;
}
function nextPracticeAccount() {
  if (!active || finished) return;
  if (!queue.length) {
    queue = [...accounts];
    for (let index = queue.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [queue[index], queue[other]] = [queue[other], queue[index]];
    }
    if (queue.length > 1 && queue[queue.length - 1] === practiceAccount) {
      [queue[0], queue[queue.length - 1]] = [queue[queue.length - 1], queue[0]];
    }
  }
  practiceAccount = queue.pop();
  practiceAnswered = false;
  $("#practice-account").textContent = practiceAccount.name;
  $("#statements-practice-feedback").hidden = true;
  $("#statements-next-account").hidden = true;
  answerButtons.forEach((button) => { button.disabled = false; });
}
function startPractice() {
  gameMode = $("#practice-length").value;
  correct = answered = streak = bestStreak = 0;
  active = true;
  finished = false;
  queue = [];
  $("#practice-length").disabled = false;
  $("#practice-start").hidden = true;
  $("#practice-play-area").hidden = false;
  $("#practice-ready").hidden = true;
  $("#practice-results").hidden = true;
  $("#practice-finish").hidden = gameMode !== "unlimited";
  updateTracker();
  nextPracticeAccount();
  $("#practice-account").focus();
}
function finishPractice() {
  finished = true;
  active = false;
  $("#statements-next-account").hidden = true;
  $("#practice-length").disabled = false;
  $("#practice-finish").hidden = true;
  answerButtons.forEach((button) => { button.disabled = true; });
  $("#practice-start").hidden = false;
  $("#practice-start").textContent = "Start another practice";
  $("#practice-results").hidden = false;
  $("#practice-results-heading").textContent = gameMode === "streak" ? "You reached 10 correct in a row!" : "Practice complete";
  $("#practice-results-message").textContent = `You answered ${correct} of ${answered} correctly (${answered ? Math.round(correct / answered * 100) : 0}%). ` +
    (gameMode === "streak" ? "Your persistence paid off. " : "Well done for completing your practice. ") +
    "Try another practice when you’re ready, or visit Explore to build your understanding.";
  $("#practice-results-heading").focus();
}
answerButtons.forEach((button) => button.addEventListener("click", () => {
  if (!active || finished || practiceAnswered) return;
  practiceAnswered = true;
  const isCorrect = button.dataset.statementAnswer === practiceAccount.destination;
  answered += 1;
  if (isCorrect) { correct += 1; streak += 1; } else { streak = 0; }
  bestStreak = Math.max(bestStreak, streak);
  updateTracker();
  const destination = practiceAccount.destination === "profit-loss" ? "statement of profit or loss" : "statement of financial position";
  const feedback = $("#statements-practice-feedback");
  feedback.textContent = (isCorrect ? "Correct! " : `This account contributes to the ${destination}. `) + practiceAccount.explanation;
  feedback.className = isCorrect ? "alert alert-success mt-3" : "alert alert-info mt-3";
  feedback.hidden = false;
  answerButtons.forEach((answer) => { answer.disabled = true; });
  if ((gameMode === "streak" && streak === 10) || (["10", "20"].includes(gameMode) && answered === Number(gameMode))) {
    finishPractice();
  } else {
    $("#statements-next-account").hidden = false;
    $("#statements-next-account").focus();
  }
}));
function setPracticeMode(practice) {
  $(".statements-layout").hidden = practice;
  $("#statements-practice").hidden = !practice;
  [["#statements-explore-mode", !practice], ["#statements-practice-mode", practice]].forEach(([id, selected]) => {
    $(id).setAttribute("aria-pressed", String(selected));
    $(id).className = selected ? "btn btn-primary" : "btn btn-outline-primary";
  });
  (practice ? $("#practice-heading") : detailHeading).focus();
}
$("#statements-explore-mode").addEventListener("click", () => setPracticeMode(false));
$("#statements-practice-mode").addEventListener("click", () => setPracticeMode(true));
$("#practice-start").addEventListener("click", startPractice);
$("#practice-length").addEventListener("change", () => {
  if (active || finished) startPractice();
});
$("#practice-finish").addEventListener("click", () => { if (active) finishPractice(); });
$("#statements-next-account").addEventListener("click", () => {
  nextPracticeAccount();
  $("#practice-account").focus();
});

document.addEventListener("keydown", (event) => {
  if (!active || finished || practiceAnswered || $("#statements-practice").hidden ||
      event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (["SELECT", "INPUT", "TEXTAREA"].includes(event.target.tagName) || event.target.isContentEditable) return;
  const key = event.key.toLowerCase();
  const index = key === "arrowleft" || key === "a" ? 0 : key === "arrowright" || key === "d" ? 1 : -1;
  if (index < 0) return;
  event.preventDefault();
  answerButtons[index].click();
});
