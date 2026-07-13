/* NOX — per-category product list (/collection/?game=<slug>).
   Shows the real products in a category, with live stock status and pricing. */

import { initNoxUI, revealIn, spotlight } from "./nox-shared.js";
import { initNoxCart } from "./nox-cart.js";
import { initNoxAnalytics } from "./nox-analytics.js";
import {
  loadCatalog,
  byCategorySlug,
  collections,
  monogram,
  statusLabel,
  money,
  coverInner,
} from "./nox-catalog.js";

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value ?? "");
  return div.innerHTML;
}

const STAR =
  '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.2l-4.94 2.6.94-5.5-4-3.9 5.53-.8z"/></svg>';

const grid = document.getElementById("prodGrid");
const countEl = document.getElementById("prodCount");
const searchEl = document.getElementById("prodSearch");
const emptyEl = document.getElementById("prodEmpty");

const slug = (new URLSearchParams(location.search).get("game") || "").toLowerCase();

function cardHTML(product, index) {
  const status = statusLabel(product.status);
  const delay = ["", "d1", "d2"][index % 3];
  const href = `/product/?id=${encodeURIComponent(product.slug)}`;
  const variantCount = (product.variants || []).length;

  let ribbon = "";
  if (product.featured) ribbon = '<span class="ribbon featured">Featured</span>';
  if (product.sale) ribbon = '<span class="ribbon new">Sale</span>';
  if (product.status === "down") ribbon = '<span class="ribbon out">Out of stock</span>';

  const price = product.from
    ? `<span class="price"><span class="from">From</span> <b>${money(product.from)}</b></span>`
    : `<span class="price"><b>—</b></span>`;

  return `
    <article class="prod-card reveal ${delay}" data-name="${escapeHtml(
      product.name.toLowerCase()
    )}">
      <a class="prod-cover ${product.cover}" href="${href}">
        ${coverInner(product)}
        ${ribbon}
        <span class="cover-tag">${escapeHtml(
          (product.category || "").split(" ")[0].toUpperCase()
        )}</span>
        <div class="prod-cover-title">${escapeHtml(product.name)}</div>
        <span class="cover-shine"></span>
      </a>
      <div class="prod-info">
        <div class="prod-row1">
          <a class="prod-name" href="${href}">${escapeHtml(product.name)}</a>
          <span class="status-badge ${status.cls}"><i></i>${status.label}</span>
        </div>
        <div class="prod-row2">
          <span class="variants">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
            ${variantCount} ${variantCount === 1 ? "variant" : "variants"}
          </span>
          <span class="stars">${STAR.repeat(5)}</span>
        </div>
        <div class="prod-row3">
          ${price}
          <a class="game-btn" href="${href}">View <span>→</span></a>
        </div>
      </div>
    </article>`;
}

async function render() {
  if (!grid) return;

  try {
    const { products } = await loadCatalog();
    const group = collections(products).find((entry) => entry.slug === slug);
    const list = byCategorySlug(products, slug);

    if (!group || !list.length) {
      document.getElementById("collTitle").textContent = "Category not found";
      document.getElementById("collDesc").textContent =
        "That game doesn't exist or has no products right now.";
      grid.innerHTML = `<div class="nox-state">Nothing here yet. <a href="/products/">Browse all games →</a></div>`;
      if (countEl) countEl.textContent = "0";
      return;
    }

    document.title = `${group.category} — Nox Cheats`;
    document.getElementById("collTitle").textContent = group.category;
    document.getElementById("collDesc").textContent =
      `Every ${group.category} build is tested against the live patch and delivered the second your payment clears.`;

    grid.innerHTML = list.map(cardHTML).join("");
    if (countEl) countEl.textContent = String(list.length);

    revealIn(grid);
    spotlight(grid);
  } catch {
    grid.innerHTML = `<div class="nox-state error">Couldn't load these products. Refresh to try again.</div>`;
  }
}

searchEl?.addEventListener("input", () => {
  const query = searchEl.value.trim().toLowerCase();
  let shown = 0;
  grid.querySelectorAll(".prod-card").forEach((card) => {
    const match = !query || (card.getAttribute("data-name") || "").includes(query);
    card.classList.toggle("hidden", !match);
    if (match) shown += 1;
  });
  if (countEl) countEl.textContent = String(shown);
  if (emptyEl) emptyEl.classList.toggle("show", shown === 0);
});

initNoxUI();
initNoxCart();
initNoxAnalytics();
render();
