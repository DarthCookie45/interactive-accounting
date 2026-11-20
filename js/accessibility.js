"use strict";

// One preference for this browser tab, shared by all activities and page visits.
(() => {
  const key = "interactive-accounting-text-size";
  const choices = ["standard", "14", "16", "18", "20", "24"];
  const root = document.documentElement;
  let selected = "standard";
  try {
    const saved = sessionStorage.getItem(key);
    if (choices.includes(saved)) selected = saved;
  } catch (_) { /* The control still works when browser storage is blocked. */ }

  function apply(value) {
    root.dataset.textSize = value;
    if (value === "standard") {
      root.style.removeProperty("font-size");
      root.style.removeProperty("--reading-min");
    } else {
      root.style.setProperty("font-size", value + "pt");
      root.style.setProperty("--reading-min", value + "pt");
    }
  }
  apply(selected);

  document.addEventListener("DOMContentLoaded", () => {
    const navbar = document.querySelector(".navbar > .container");
    if (!navbar) return;
    const control = document.createElement("div");
    control.className = "text-size-control";
    const label = document.createElement("label");
    label.htmlFor = "site-text-size";
    label.textContent = "Text size";
    const select = document.createElement("select");
    select.id = "site-text-size";
    select.className = "form-select";
    for (const value of choices) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value === "standard" ? "Standard" : value + " pt";
      select.append(option);
    }
    select.value = selected;
    select.addEventListener("change", () => {
      if (!choices.includes(select.value)) return;
      apply(select.value);
      try { sessionStorage.setItem(key, select.value); } catch (_) { /* Optional storage. */ }
    });
    control.append(label, select);
    // Outside collapsed navigation, so it remains available on mobile too.
    const brand = navbar.querySelector(".navbar-brand");
    navbar.insertBefore(control, brand ? brand.nextElementSibling : null);
  });
})();
