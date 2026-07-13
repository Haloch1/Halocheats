/* NOX — home page. Static hero/undetectability sections come from the markup;
   the popular-games grid and the review wall are filled from the live API. */

import { initNoxUI, revealIn, spotlight } from "./nox-shared.js";
import { initNoxCart } from "./nox-cart.js";
import { initNoxAnalytics } from "./nox-analytics.js";
import { loadCatalog, collections, statusLabel, collectionCover } from "./nox-catalog.js";

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value ?? "");
  return div.innerHTML;
}

function stars(rating) {
  const filled = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return "★".repeat(filled) + "☆".repeat(5 - filled);
}

function timeAgo(iso) {
  const then = new Date(iso).getTime();
  if (!then) return "";
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

/* ---------- popular games ---------- */
async function renderPopular() {
  const grid = document.querySelector("[data-pop-grid]");
  if (!grid) return;

  try {
    const { products } = await loadCatalog();
    /* Biggest collections first — that's a fair proxy for "most popular". */
    const groups = collections(products)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    if (!groups.length) {
      grid.innerHTML = `<div class="nox-state">No products are listed right now.</div>`;
      return;
    }

    grid.innerHTML = groups
      .map((group, index) => {
        const status = statusLabel(group.status);
        const delay = ["", "d1", "d2"][index % 3];
        const featured = index === 0 ? " featured" : "";
        const flag = index === 0 ? '<span class="pop-flag">★ Most popular</span>' : "";
        return `
          <a class="pop-card reveal ${delay}${featured} ${group.cover}" href="/collection/?game=${group.slug}">
            ${flag}
            <span class="status-badge ${status.cls}"><i></i>${status.label}</span>
            ${collectionCover(group)}
            <span class="cover-shine"></span>
            <div class="pop-info">
              <h3>${escapeHtml(group.category)}</h3>
              <span>${group.count} ${group.count === 1 ? "product" : "products"}</span>
            </div>
          </a>`;
      })
      .join("");

    revealIn(grid);
    spotlight(grid);
  } catch {
    grid.innerHTML = `<div class="nox-state error">Couldn't load the lineup. Refresh to try again.</div>`;
  }
}

/* ---------- reviews ---------- */
async function renderReviews() {
  const grid = document.querySelector("[data-home-reviews]");
  const section = document.getElementById("reviews");
  if (!grid) return;

  try {
    const response = await fetch("/api/reviews");
    if (!response.ok) throw new Error("reviews unavailable");
    const data = await response.json();
    const reviews = (data.reviews || []).slice(0, 3);

    if (!reviews.length) {
      if (section) section.style.display = "none";
      return;
    }

    grid.innerHTML = reviews
      .map((review, index) => {
        const verified = review.source === "discord" ? "Discord review" : "Verified customer";
        const product = escapeHtml(review.product_name || review.product_slug || "");
        return `
          <article class="review-card reveal ${["", "d1", "d2"][index % 3]}">
            <div class="review-head">
              <span class="review-stars">${stars(review.rating)}</span>
              <span class="review-game">${product}</span>
            </div>
            <p>${escapeHtml(review.review_text)}</p>
            <span class="review-user">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              ${escapeHtml(review.username || "Anonymous")} · ${verified}
              <em>${timeAgo(review.created_at)}</em>
            </span>
          </article>`;
      })
      .join("");

    /* Average across what we actually have, rather than a hardcoded 4.8. */
    const all = data.reviews || [];
    const average = all.length
      ? all.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) / all.length
      : 0;
    const scoreEl = document.querySelector("[data-review-score]");
    const metaEl = document.querySelector("[data-review-meta]");
    if (scoreEl && average) scoreEl.textContent = average.toFixed(1);
    if (metaEl) {
      metaEl.innerHTML = `Based on <b>${all.length} verified review${
        all.length === 1 ? "" : "s"
      }</b> from real purchases`;
    }

    revealIn(grid);
    spotlight(grid);
  } catch {
    if (section) section.style.display = "none";
  }
}

initNoxUI();
initNoxCart();
initNoxAnalytics();
renderPopular();
renderReviews();
