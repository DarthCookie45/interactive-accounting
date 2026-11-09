"use strict";

// Add approved words here to expand the name generator.
const firstWords = ["Sizzling", "Golden", "Sunny", "Toasty", "Rocket", "Copper", "Street", "Maple"];
const lastWords = ["Franks", "Buns", "Grill", "Bites", "Dogs", "Diner", "Wagon", "Kitchen"];
const names = firstWords.flatMap((first) => lastWords.map((last) => `${first} ${last}`));

const page = document.querySelector(".hot-dog-page");
const setup = document.querySelector("#van-setup");
const nameDisplay = document.querySelector("#van-name");
const sign = document.querySelector("#van-sign");
const primary = document.querySelector("#van-primary");
const accent = document.querySelector("#van-accent");
const day = document.querySelector("#van-day");
const dayName = document.querySelector("#van-day-name");
let businessName = "";

function rollName() {
  const choices = names.filter((name) => name !== businessName);
  businessName = choices[Math.floor(Math.random() * choices.length)];
  nameDisplay.textContent = businessName;
  sign.textContent = businessName;
}

function updatePaint() {
  page.style.setProperty("--van-primary", primary.value);
  page.style.setProperty("--van-accent", accent.value);
}

document.querySelector("#van-roll").addEventListener("click", rollName);
primary.addEventListener("input", updatePaint);
accent.addEventListener("input", updatePaint);

document.querySelector("#van-start").addEventListener("click", () => {
  dayName.textContent = businessName;
  setup.hidden = true;
  day.hidden = false;
  dayName.focus();
});

rollName();
updatePaint();
