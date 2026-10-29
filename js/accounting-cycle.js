"use strict";

const stages = [
  {
    short: "Evidence",
    icon: "▣",
    title: "Gather source documents",
    description: "Collect evidence such as invoices, receipts, bank records, purchase orders and till rolls.",
    why: "Reliable accounting records begin with evidence of what actually happened.",
    output: "Evidence ready for analysis"
  },
  {
    short: "Analyse",
    icon: "⌕",
    title: "Analyse transactions",
    description: "Decide what happened financially and identify the accounts affected by the transaction.",
    why: "The analysis determines the correct accounting treatment before a record is made.",
    output: "A clear accounting treatment"
  },
  {
    short: "Record",
    icon: "✎",
    title: "Record in books of prime entry",
    description: "Enter the transaction in the appropriate day book, journal or cash book.",
    why: "Transactions are first recorded in date order before they are organised by account.",
    output: "A chronological transaction record"
  },
  {
    short: "Post",
    icon: "▤",
    title: "Post to ledger accounts",
    description: "Transfer entries to the relevant ledger accounts to build up each account balance.",
    why: "The ledger groups transactions by account, making account balances visible.",
    output: "Updated ledger balances"
  },
  {
    short: "Check",
    icon: "⚖",
    title: "Prepare a trial balance",
    description: "List the ledger balances and check that total debits equal total credits.",
    why: "It helps identify some errors before the accounts are adjusted and reported.",
    output: "A checked list of balances"
  },
  {
    short: "Adjust",
    icon: "⚙",
    title: "Make period-end adjustments",
    description: "Update the accounts for accruals, prepayments, depreciation, inventory and similar period-end items.",
    why: "Income and expenses must be reported in the accounting period to which they relate.",
    output: "Adjusted account balances"
  },
  {
    short: "Report",
    icon: "◔",
    title: "Prepare financial statements",
    description: "Use the adjusted figures to prepare reports about financial performance and position.",
    why: "These reports communicate useful financial information to people who need it.",
    output: "Completed financial statements"
  },
  {
    short: "Close",
    icon: "✓",
    title: "Close the period and carry balances forward",
    description: "Finish the accounting period and carry the balances that continue into the next period forward.",
    why: "This prepares the business for a clean new period while preserving ongoing balances.",
    output: "The next period is ready"
  }
];

const segmentsGroup = document.querySelector("#cycle-wheel-segments");
const wheelStageNumber = document.querySelector("#wheel-stage-number");
const wheelStagePosition = document.querySelector("#wheel-stage-position");
const wheelStageName = document.querySelector("#wheel-stage-name");
const infoStageTag = document.querySelector("#info-stage-tag");
const infoTitle = document.querySelector("#info-title");
const infoDescription = document.querySelector("#info-description");
const infoWhy = document.querySelector("#info-why");
const infoOutput = document.querySelector("#info-output");
const infoOutputSection = document.querySelector(".info-output");
const previousButton = document.querySelector("#cycle-previous");
const nextButton = document.querySelector("#cycle-next");

let currentStage = 0;
let rotation = 0;

function polarPoint(angle, radius) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: 300 + radius * Math.cos(radians),
    y: 300 + radius * Math.sin(radians)
  };
}

function wedgePath(startAngle, endAngle) {
  const outerStart = polarPoint(startAngle, 262);
  const outerEnd = polarPoint(endAngle, 262);
  const innerEnd = polarPoint(endAngle, 112);
  const innerStart = polarPoint(startAngle, 112);

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A 262 262 0 0 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A 112 112 0 0 0 ${innerStart.x} ${innerStart.y}`,
    "Z"
  ].join(" ");
}

function createWheel() {
  stages.forEach((stage, index) => {
    const startAngle = -112.5 + index * 45;
    const endAngle = startAngle + 45;
    const labelPoint = polarPoint(startAngle + 22.5, 183);
    const namespace = "http://www.w3.org/2000/svg";
    const stageGroup = document.createElementNS(namespace, "g");
    const wedge = document.createElementNS(namespace, "path");
    const label = document.createElementNS(namespace, "g");
    const icon = document.createElementNS(namespace, "text");
    const text = document.createElementNS(namespace, "text");

    stageGroup.classList.add("explorer-wheel-stage");
    stageGroup.dataset.stage = index;
    stageGroup.setAttribute("role", "button");
    stageGroup.setAttribute("tabindex", "0");
    stageGroup.setAttribute("aria-label", `View stage ${index + 1}: ${stage.title}`);

    wedge.setAttribute("d", wedgePath(startAngle, endAngle));
    wedge.classList.add("explorer-wheel-wedge");

    label.classList.add("explorer-wheel-label");
    label.dataset.x = labelPoint.x;
    label.dataset.y = labelPoint.y;

    icon.setAttribute("x", labelPoint.x);
    icon.setAttribute("y", labelPoint.y - 8);
    icon.classList.add("explorer-wheel-icon");
    icon.textContent = stage.icon;

    text.setAttribute("x", labelPoint.x);
    text.setAttribute("y", labelPoint.y + 17);
    text.classList.add("explorer-wheel-text");
    text.textContent = stage.short.toUpperCase();

    label.append(icon, text);
    stageGroup.append(wedge, label);
    segmentsGroup.append(stageGroup);

    stageGroup.addEventListener("click", () => selectStage(index));
    stageGroup.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectStage(index);
      }
    });
  });
}

function rotateWheel() {
  segmentsGroup.setAttribute("transform", `rotate(${rotation} 300 300)`);

  document.querySelectorAll(".explorer-wheel-label").forEach((label) => {
    label.setAttribute(
      "transform",
      `rotate(${-rotation} ${label.dataset.x} ${label.dataset.y})`
    );
  });
}

function updateScreen() {
  const stage = stages[currentStage];
  const stageNumber = currentStage + 1;

  wheelStageNumber.textContent = stageNumber;
  wheelStagePosition.textContent = `Stage ${stageNumber} of ${stages.length}`;
  wheelStageName.textContent = stage.title;
  infoStageTag.textContent = `Stage ${stageNumber}`;
  infoTitle.textContent = stage.title;
  infoDescription.textContent = stage.description;
  infoWhy.textContent = stage.why;
  infoOutput.textContent = stage.output;
  infoOutputSection.hidden = currentStage === stages.length - 1;
  previousButton.disabled = currentStage === 0;
  nextButton.disabled = currentStage === stages.length - 1;

  document.querySelectorAll(".explorer-wheel-stage").forEach((segment, index) => {
    segment.classList.toggle("is-current", index === currentStage);
    segment.classList.toggle("is-explored", index < currentStage);
  });
}

function selectStage(index) {
  currentStage = index;
  rotation = -currentStage * 45;
  rotateWheel();
  updateScreen();
}

previousButton.addEventListener("click", () => selectStage(currentStage - 1));
nextButton.addEventListener("click", () => selectStage(currentStage + 1));

createWheel();
selectStage(0);
