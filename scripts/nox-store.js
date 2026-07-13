/* NOX — store page. Renders one card per real product category, with filter
   chips and search derived from the live catalog (no hardcoded game list). */

import { initNoxUI, revealIn, spotlight } from "./nox-shared.js";
import { initNoxCart } from "./nox-cart.js";
import { loadCatalog, collections, monogram, statusLabel } from "./nox-catalog.js";

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value ?? "");
  return div.innerHTML;
}

const grid = document.getElementById("gameGrid");
const chipsWrap = document.querySelector("[data-filter-chips]");
const countEl = document.getElementById("storeCount");
const searchEl = document.getElementById("storeSearch");
const emptyEl = document.getElementById("storeEmpty");
const titlesEl = document.querySelector("[data-supported-count]");

let activeFilter = "all";
let query = "";

function apply() {
  if (!grid) return;
  const cards = grid.querySelectorAll(".game-card");
  let shown = 0;

  cards.forEach((card) => {
    const category = card.getAttribute("data-cat") || "";
    const name = card.getAttribute("data-name") || "";
    const matchesFilter = activeFilter === "all" || category === activeFilter;
    const matchesQuery = !query || name.includes(query);
    const match = matchesFilter && matchesQuery;
    card.classList.toggle("hidden", !match);
    if (match) shown += 1;
  });

  if (countEl) countEl.textContent = String(shown);
  if (emptyEl) emptyEl.classList.toggle("show", shown === 0);
}

function cardHTML(group, index) {
  const status = statusLabel(group.status);
  const delay = ["", "d1", "d2"][index % 3];
  const popular = index === 0 ? " featured" : "";
  const href = `/collection/?game=${group.slug}`;

  return `
    <article class="game-card collection reveal ${delay}${popular}"
             data-cat="${group.slug}" data-name="${escapeHtml(group.category.toLowerCase())}">
      <a class="game-cover ${group.cover}" href="${href}">
        <span class="cover-mono">${monogram(group.category)}</span>
        ${index === 0 ? '<span class="popular-flag">★ Most popular</span>' : ""}
        <span class="status-badge ${status.cls}"><i></i>${status.label}</span>
        <div>
          <div class="cover-title">${escapeHtml(group.category)}</div>
          <div class="cover-count">${group.count} ${group.count === 1 ? "product" : "products"}</div>
        </div>
        <span class="cover-shine"></span>
      </a>
      <div class="coll-foot">
        <span class="browse-label">${escapeHtml(group.tagline)}</span>
        <a class="game-btn" href="${href}">View <span>→</span></a>
      </div>
    </article>`;
}

async function render() {
  if (!grid) return;

  try {
    const { products } = await loadCatalog();
    /* Largest collections first, so the busiest games lead the grid. */
    const groups = collections(products).sort((a, b) => b.count - a.count);

    if (!groups.length) {
      grid.innerHTML = `<div class="nox-state">No products are listed right now.</div>`;
      return;
    }

    grid.innerHTML = groups.map(cardHTML).join("");

    if (chipsWrap) {
      chipsWrap.innerHTML = [
        '<button class="filter-chip on" data-filter="all">All</button>',
        ...groups.map(
          (group) =>
            `<button class="filter-chip" data-filter="${group.slug}">${escapeHtml(
              group.category
            )}</button>`
        ),
      ].join("");

      chipsWrap.querySelectorAll(".filter-chip").forEach((chip) => {
        chip.addEventListener("click", () => {
          chipsWrap.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("on"));
          chip.classList.add("on");
          activeFilter = chip.getAttribute("data-filter");
          apply();
        });
      });
    }

    if (titlesEl) titlesEl.textContent = String(groups.length);
    if (countEl) countEl.textContent = String(groups.length);

    revealIn(grid);
    spotlight(grid);
  } catch {
    grid.innerHTML = `<div class="nox-state error">Couldn't load the store. Refresh to try again.</div>`;
  }
}

searchEl?.addEventListener("input", () => {
  query = searchEl.value.trim().toLowerCase();
  apply();
});

initNoxUI();
initNoxCart();
render();
