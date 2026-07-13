/* NOX — product detail (/product/?id=<slug>).
   This is the page that takes money, so the checkout paths here are the same
   ones the old products page used: /api/create-checkout-session (card),
   /api/create-crypto-checkout, /api/purchase-with-balance, and the shared cart.
   Variants come straight from /api/products, including live key-stock state. */

import { initNoxUI, revealIn, spotlight } from "./nox-shared.js";
import { initNoxCart } from "./nox-cart.js";
import { getCurrentSession } from "./supabase-client.js";
import {
  loadCatalog,
  bySlug,
  byCategorySlug,
  monogram,
  statusLabel,
  money,
  parseMoney,
  coverInner,
  artworkFor,
} from "./nox-catalog.js";

const main = document.getElementById("productMain");
const STAR =
  '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.2l-4.94 2.6.94-5.5-4-3.9 5.53-.8z"/></svg>';

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value ?? "");
  return div.innerHTML;
}

const slug = (new URLSearchParams(location.search).get("id") || "").toLowerCase();

let product = null;
let variant = null;
let promoEnabled = false;
let activePromo = null;

/* ---------- helpers ---------- */
function notice(text, tone = "warn") {
  const el = document.querySelector("[data-pg-msg]");
  if (!el) return;
  el.textContent = text;
  el.className = `nox-msg ${tone}`;
  el.hidden = false;
}

function clearNotice() {
  const el = document.querySelector("[data-pg-msg]");
  if (el) el.hidden = true;
}

function termsAccepted() {
  const box = document.querySelector("[data-terms]");
  return Boolean(box?.checked);
}

/* Promo discount is applied server-side too; this is display only. */
function discounted(amount) {
  if (!activePromo) return amount;
  return amount * (1 - activePromo.discountPercent / 100);
}

function priceOf(v) {
  return discounted(parseMoney(v.priceDisplay));
}

function signInRedirect() {
  const next = `/product/?id=${encodeURIComponent(product.slug)}`;
  window.location.href = `/account/?next=${encodeURIComponent(next)}&intent=checkout&product=${
    product.slug
  }&variant=${variant.slug}`;
}

/* ---------- rendering ---------- */
function variantsHTML() {
  return (product.variants || [])
    .map((v, index) => {
      const ready = v.checkoutReady;
      const selected = variant && v.slug === variant.slug;
      const was = v.originalPrice
        ? `<span class="dur-was">${escapeHtml(v.originalPrice)}</span>`
        : "";
      return `
        <button type="button"
                class="dur${selected ? " on" : ""}${ready ? "" : " out"}"
                data-variant="${escapeHtml(v.slug)}"
                ${ready ? "" : "disabled"}>
          <span class="dur-label">${escapeHtml(v.name)}</span>
          <span class="dur-price">${money(priceOf(v))}${was}</span>
          <span class="dur-stock">${escapeHtml(v.stockLabel)}</span>
        </button>`;
    })
    .join("");
}

function featuresHTML() {
  const groups =
    product.featureGroups?.length > 0
      ? product.featureGroups
      : product.features?.length
        ? [{ title: "Features", items: product.features }]
        : [];

  if (!groups.length) return "";

  const blocks = groups
    .map((group, index) => {
      const items = (group.items || group.features || [])
        .map(
          (item) =>
            `<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>${escapeHtml(
              item
            )}</li>`
        )
        .join("");

      return `
        <article class="feat-block reveal ${index % 2 ? "d1" : ""}">
          <div class="feat-visual ${product.cover}">
            <span class="cover-mono">${monogram(group.title || product.name)}</span>
            <span class="feat-visual-label">${escapeHtml(
              (group.title || "Features").toUpperCase()
            )}</span>
          </div>
          <div class="feat-detail">
            <h3>${escapeHtml(group.title || "Features")}</h3>
            ${group.description ? `<p>${escapeHtml(group.description)}</p>` : ""}
            <ul class="feat-list">${items}</ul>
          </div>
        </article>`;
    })
    .join("");

  return `
    <section class="section pg-inside">
      <div class="container">
        <div class="section-head reveal">
          <span class="kicker">What's inside</span>
          <h2>Inside ${escapeHtml(product.name)}</h2>
          <p>Every feature is configurable from the in-game menu.</p>
        </div>
        <div class="feat-blocks">${blocks}</div>
      </div>
    </section>`;
}

function notesHTML() {
  const blocks = [];

  if (product.requirements?.length) {
    blocks.push(`
      <div class="pg-note">
        <h4>Requirements</h4>
        <ul>${product.requirements.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>
      </div>`);
  }

  if (product.generalInfo?.length) {
    blocks.push(`
      <div class="pg-note">
        <h4>Before you buy</h4>
        <ul>${product.generalInfo.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>
      </div>`);
  }

  if (!blocks.length) return "";
  return `<div class="pg-notes">${blocks.join("")}</div>`;
}

function relatedHTML(products) {
  const related = byCategorySlug(products, product.categorySlug)
    .filter((entry) => entry.slug !== product.slug)
    .slice(0, 3);

  if (!related.length) return "";

  const cards = related
    .map((entry) => {
      const status = statusLabel(entry.status);
      const art = artworkFor(entry.slug);
      return `
        <a class="rel-card ${entry.cover}" href="/product/?id=${encodeURIComponent(entry.slug)}">
          ${
            art
              ? `<img class="cover-img" src="${art}" alt="" loading="lazy">`
              : `<span class="cover-mono">${monogram(entry.name)}</span>`
          }
          <span class="status-badge ${status.cls}"><i></i>${status.label}</span>
          <span class="cover-shine"></span>
          <div class="rel-info">
            <h4>${escapeHtml(entry.name)}</h4>
            <div class="rel-meta">
              <span class="stars sm">${STAR.repeat(5)}</span>
              <b>${entry.from ? `from ${money(entry.from)}` : "—"}</b>
            </div>
          </div>
        </a>`;
    })
    .join("");

  return `
    <section class="section pg-related" style="padding-top:0">
      <div class="container">
        <div class="section-head between reveal">
          <div>
            <span class="kicker">More builds</span>
            <h2>More ${escapeHtml(product.category)} cheats</h2>
          </div>
          <a class="btn btn-ghost" href="/collection/?game=${product.categorySlug}">
            All ${escapeHtml(product.category)} →
          </a>
        </div>
        <div class="rel-grid">${cards}</div>
      </div>
    </section>`;
}

function render(products) {
  const status = statusLabel(product.status);
  const soldOut = product.status === "down";

  main.innerHTML = `
    <section class="pg-hero">
      <div class="container">
        <a class="back-link" href="/collection/?game=${product.categorySlug}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          ${escapeHtml(product.category)}
        </a>

        <div class="pg-grid">
          <div class="pg-media reveal">
            <div class="pg-stage ${product.cover}">
              ${coverInner(product)}
              <span class="cover-shine"></span>
              <div class="pg-stage-title">${escapeHtml(product.name)}</div>
            </div>
            ${notesHTML()}
          </div>

          <div class="pg-buy reveal d1">
            <div class="pg-buy-head">
              <span class="status-badge ${status.cls}"><i></i>${status.label}</span>
              <span class="pg-crypto">Card · Crypto · Balance</span>
            </div>

            <h1>${escapeHtml(product.name)}</h1>
            <p class="pg-desc">${escapeHtml(product.summary || "")}</p>

            <div class="pg-label">Choose your option</div>
            <div class="pg-durations" data-variants>${variantsHTML()}</div>

            ${
              promoEnabled
                ? `<div class="pg-promo">
                     <input type="text" placeholder="Promo code" data-promo-input aria-label="Promo code">
                     <button type="button" data-promo-apply>Apply</button>
                   </div>`
                : ""
            }

            <div class="pg-cta">
              <div class="pg-total">
                <span>Total</span>
                <b data-total>${variant ? money(priceOf(variant)) : "—"}</b>
              </div>
            </div>

            <label class="pg-terms">
              <input type="checkbox" data-terms>
              <span>I agree to the <a href="/terms/" target="_blank" rel="noopener">Terms of Service</a> and understand all sales are for digital licence keys.</span>
            </label>

            <p class="nox-msg" data-pg-msg hidden></p>

            <div class="pg-actions">
              <button type="button" class="btn btn-primary btn-lg" data-pay-card ${
                soldOut ? "disabled" : ""
              }>
                ${soldOut ? "Out of stock" : "Pay with card"} <span class="arrow">→</span>
              </button>
              <div class="pg-pay-row">
                <button type="button" class="btn btn-ghost" data-pay-crypto ${
                  soldOut ? "disabled" : ""
                }>Pay with crypto</button>
                <button type="button" class="btn btn-ghost" data-pay-balance ${
                  soldOut ? "disabled" : ""
                }>Pay with balance</button>
              </div>
              <button type="button" class="btn btn-ghost" data-add-cart ${
                soldOut ? "disabled" : ""
              }>Add to cart</button>
            </div>

            <div class="pg-assure">
              <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>Instant delivery</span>
              <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>Undetected</span>
              ${
                product.instructionHref
                  ? `<a href="${product.instructionHref}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6v12M6 12h12"/></svg>Setup guide</a>`
                  : ""
              }
            </div>
          </div>
        </div>
      </div>
    </section>

    ${featuresHTML()}
    ${relatedHTML(products)}
  `;

  bind();
  revealIn(main);
  spotlight(main);
}

/* ---------- interactions ---------- */
function refreshTotal() {
  const totalEl = main.querySelector("[data-total]");
  if (totalEl) totalEl.textContent = variant ? money(priceOf(variant)) : "—";
}

function bind() {
  main.querySelector("[data-variants]")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-variant]");
    if (!button || button.disabled) return;

    variant = product.variants.find((v) => v.slug === button.dataset.variant) || variant;
    main.querySelectorAll(".dur").forEach((el) => el.classList.remove("on"));
    button.classList.add("on");
    clearNotice();
    refreshTotal();
  });

  main.querySelector("[data-promo-apply]")?.addEventListener("click", async (event) => {
    const input = main.querySelector("[data-promo-input]");
    const code = (input?.value || "").trim();
    const button = event.currentTarget;

    if (!code) {
      activePromo = null;
      refreshTotal();
      main.querySelector("[data-variants]").innerHTML = variantsHTML();
      return;
    }

    button.disabled = true;
    try {
      const response = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.valid) {
        activePromo = null;
        notice("Invalid promo code.", "error");
      } else {
        activePromo = { code: payload.code, discountPercent: payload.percent };
        notice(`${payload.code} applied: ${payload.percent}% off.`, "success");
      }
    } catch {
      activePromo = null;
      notice("Could not validate that code. Try again.", "error");
    } finally {
      button.disabled = false;
      main.querySelector("[data-variants]").innerHTML = variantsHTML();
      refreshTotal();
    }
  });

  main.querySelector("[data-pay-card]")?.addEventListener("click", (event) =>
    pay(event.currentTarget, "/api/create-checkout-session", "Opening checkout…")
  );
  main.querySelector("[data-pay-crypto]")?.addEventListener("click", (event) =>
    pay(event.currentTarget, "/api/create-crypto-checkout", "Opening crypto checkout…")
  );
  main.querySelector("[data-pay-balance]")?.addEventListener("click", (event) =>
    payWithBalance(event.currentTarget)
  );
  main.querySelector("[data-add-cart]")?.addEventListener("click", (event) =>
    addToCart(event.currentTarget)
  );
}

/* Shared guard for every purchase path. */
function ready() {
  if (!variant) {
    notice("Pick an option before checkout.");
    return false;
  }
  if (!termsAccepted()) {
    notice("Agree to the Terms of Service before continuing.");
    return false;
  }
  if (!variant.checkoutReady) {
    notice(
      variant.checkoutBlocked
        ? variant.checkoutError
        : "That option is unavailable right now.",
      variant.checkoutBlocked ? "error" : "warn"
    );
    return false;
  }
  return true;
}

/* Card and crypto both POST the same body and redirect to a payment URL. */
async function pay(button, endpoint, pendingLabel) {
  clearNotice();
  if (!ready()) return;

  const session = await getCurrentSession();
  if (!session?.access_token) {
    signInRedirect();
    return;
  }

  const original = button.innerHTML;
  button.disabled = true;
  button.textContent = pendingLabel;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        productSlug: product.slug,
        variantSlug: variant.slug,
        promoCode: activePromo?.code || undefined,
      }),
    });

    const payload = await response.json();
    if (!response.ok || !payload.url) {
      throw new Error(payload.error || "Unable to start checkout.");
    }
    window.location.href = payload.url;
  } catch (error) {
    notice(error instanceof Error ? error.message : "Checkout failed.", "error");
    button.disabled = false;
    button.innerHTML = original;
  }
}

async function payWithBalance(button) {
  clearNotice();
  if (!ready()) return;

  const session = await getCurrentSession();
  if (!session?.access_token) {
    signInRedirect();
    return;
  }

  const original = button.textContent;
  button.disabled = true;
  button.textContent = "Processing…";

  try {
    const response = await fetch("/api/purchase-with-balance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        productSlug: product.slug,
        variantSlug: variant.slug,
        promoCode: activePromo?.code || undefined,
      }),
    });

    const payload = await response.json();

    if (response.status === 402) {
      notice("Not enough balance. Add funds on your account page, then try again.");
      button.disabled = false;
      button.textContent = original;
      return;
    }

    if (!response.ok) throw new Error(payload.error || "Unable to complete the purchase.");

    window.haloCart?.refreshBalance?.();
    notice("Purchased. Your key is on your account page and in your Discord DMs.", "success");
    button.textContent = "Purchased";
    setTimeout(() => {
      window.location.href = "/account/";
    }, 1400);
  } catch (error) {
    notice(error instanceof Error ? error.message : "Purchase failed.", "error");
    button.disabled = false;
    button.textContent = original;
  }
}

function addToCart(button) {
  clearNotice();
  if (!variant) {
    notice("Pick an option first.");
    return;
  }
  if (!variant.checkoutReady) {
    notice("That option is unavailable right now.");
    return;
  }
  if (!window.haloCart?.add) {
    notice("Cart is unavailable right now.", "error");
    return;
  }

  window.haloCart.add({
    productSlug: product.slug,
    variantSlug: variant.slug,
    productName: product.name,
    variantName: variant.name,
    cover: product.cover,
    priceCents: Math.round(parseMoney(variant.priceDisplay) * 100),
    qty: 1,
  });

  const original = button.textContent;
  button.textContent = "Added ✓";
  window.haloCart.open?.();
  setTimeout(() => {
    button.textContent = original;
  }, 1200);
}

/* ---------- boot ---------- */
async function boot() {
  if (!main) return;

  try {
    const { products, promoEnabled: promos } = await loadCatalog();
    promoEnabled = promos;
    product = bySlug(products, slug);

    if (!product) {
      main.innerHTML = `
        <section class="pg-hero"><div class="container">
          <div class="nox-state">
            <h1>Product not found</h1>
            <p>That product doesn't exist or is no longer listed.</p>
            <a class="btn btn-primary" href="/products/">Browse the store</a>
          </div>
        </div></section>`;
      return;
    }

    document.title = `${product.name} — Nox Cheats`;
    /* Preselect the first option a customer can actually buy. */
    variant =
      (product.variants || []).find((v) => v.checkoutReady) || product.variants?.[0] || null;

    render(products);
  } catch {
    main.innerHTML = `
      <section class="pg-hero"><div class="container">
        <div class="nox-state error">Couldn't load this product. Refresh to try again.</div>
      </div></section>`;
  }
}

initNoxUI();
initNoxCart();
boot();
