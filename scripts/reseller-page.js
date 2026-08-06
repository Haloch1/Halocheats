import { getCurrentSession } from "./supabase-client.js";
import { initReveal, renderMessage, currencyLabel } from "./site.js";

initReveal();

const messageBox = document.querySelector("[data-reseller-message]");
const guestView = document.querySelector("[data-reseller-guest]");
const noneView = document.querySelector("[data-reseller-none]");
const pendingView = document.querySelector("[data-reseller-pending]");
const deniedView = document.querySelector("[data-reseller-denied]");
const approvedView = document.querySelector("[data-reseller-approved]");

const tierLabel = document.querySelector("[data-reseller-tier]");
const balanceLabel = document.querySelector("[data-reseller-balance]");
const discountLabel = document.querySelector("[data-reseller-discount]");
const keyLast4Label = document.querySelector("[data-reseller-key-last4]");
const websiteLabel = document.querySelector("[data-reseller-website]");
const discordServerLabel = document.querySelector("[data-reseller-discord-server]");
const volumeLabel = document.querySelector("[data-reseller-volume]");

const progressWrap = document.querySelector("[data-reseller-progress-wrap]");
const progressFill = document.querySelector("[data-reseller-progress-fill]");
const progressLabel = document.querySelector("[data-reseller-progress-label]");

const tabButtons = document.querySelectorAll("[data-reseller-tab]");
const tabPanes = document.querySelectorAll("[data-reseller-pane]");

const topupMessage = document.querySelector("[data-reseller-topup-message]");
const topupPresetWrap = document.querySelector("[data-reseller-topup-presets]");
const topupCustomInput = document.querySelector("[data-reseller-topup-custom]");
const topupSubmitButton = document.querySelector("[data-reseller-topup-submit]");

const productsBody = document.querySelector("[data-reseller-products-body]");
const productSearchInput = document.querySelector("[data-reseller-search]");
const buyMessage = document.querySelector("[data-reseller-buy-message]");
const keyReveal = document.querySelector("[data-reseller-key-reveal]");
const keyRevealValue = document.querySelector("[data-reseller-key-reveal-value]");

let latestCatalog = [];
let latestReseller = null;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return entities[character];
  });
}

function hideAll() {
  [guestView, noneView, pendingView, deniedView, approvedView].forEach((view) => {
    if (view) {
      view.hidden = true;
    }
  });
}

function centsToLabel(cents) {
  const value = Number(cents || 0) / 100;
  return currencyLabel(Number(value.toFixed(2)));
}

/* ── Tab switching ── */
tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.resellerTab;
    tabButtons.forEach((b) => b.classList.toggle("is-active", b === button));
    tabPanes.forEach((pane) => {
      const isTarget = pane.dataset.resellerPane === target;
      pane.hidden = !isTarget;
      pane.classList.toggle("is-active", isTarget);
    });
  });
});

/* ── Overview: tier progress bar ── */
function renderProgress(reseller) {
  if (!progressWrap || !progressFill || !progressLabel) {
    return;
  }
  const nextTier = reseller?.next_tier;
  if (!nextTier) {
    progressWrap.hidden = reseller?.tier !== "gold";
    if (reseller?.tier === "gold") {
      progressFill.style.width = "100%";
      progressLabel.textContent = "You're at the top tier — 35% off, as good as it gets.";
    }
    return;
  }
  progressWrap.hidden = false;
  const lifetime = reseller?.lifetime_purchased_cents || 0;
  const currentFloor = reseller?.current_tier_min_volume_cents || 0;
  const span = Math.max(1, nextTier.min_volume_cents - currentFloor);
  const progressed = Math.min(1, Math.max(0, (lifetime - currentFloor) / span));
  progressFill.style.width = `${Math.round(progressed * 100)}%`;
  progressLabel.textContent =
    `${centsToLabel(nextTier.cents_to_next_tier)} more in lifetime purchases to reach ` +
    `${nextTier.tier.charAt(0).toUpperCase() + nextTier.tier.slice(1)} (${nextTier.discount_percent}% off).`;
}

/* ── Products tab: render catalog table ── */
function renderProducts(filterText = "") {
  if (!productsBody) {
    return;
  }
  const query = filterText.trim().toLowerCase();
  const rows = [];
  latestCatalog.forEach((product) => {
    product.variants.forEach((variant) => {
      const label = `${product.name} - ${variant.name}`;
      if (query && !label.toLowerCase().includes(query)) {
        return;
      }
      const discountPercent = variant.list_amount_cents
        ? Math.round((1 - variant.your_amount_cents / variant.list_amount_cents) * 100)
        : 0;
      rows.push(`
        <tr>
          <td>${escapeHtml(label)}</td>
          <td><span class="reseller-price-list">${centsToLabel(variant.list_amount_cents)}</span></td>
          <td>
            <span class="reseller-price-yours">${centsToLabel(variant.your_amount_cents)}</span>
            ${discountPercent ? `<span class="reseller-discount-pill">-${discountPercent}%</span>` : ""}
          </td>
          <td>
            <span class="reseller-stock-pill ${variant.in_stock ? "in-stock" : "out-of-stock"}">
              ${variant.in_stock ? "In stock" : "Out of stock"}
            </span>
          </td>
          <td><input type="number" class="reseller-qty-input" min="1" max="10" value="1" data-qty-input /></td>
          <td>
            <button
              type="button"
              class="button button-primary reseller-buy-button"
              data-buy-button
              data-inventory-slug="${escapeHtml(variant.inventory_slug)}"
              ${variant.in_stock ? "" : "disabled"}
            >Buy</button>
          </td>
        </tr>
      `);
    });
  });

  productsBody.innerHTML = rows.length
    ? rows.join("")
    : `<tr><td colspan="6">${query ? "No products match your search." : "No products available right now."}</td></tr>`;
}

async function handleBuyClick(event) {
  const button = event.target.closest("[data-buy-button]");
  if (!button) {
    return;
  }
  const row = button.closest("tr");
  const qtyInput = row?.querySelector("[data-qty-input]");
  const quantity = Math.min(Math.max(parseInt(qtyInput?.value, 10) || 1, 1), 10);
  const inventorySlug = button.dataset.inventorySlug;

  const session = await getCurrentSession();
  if (!session?.access_token) {
    renderMessage(buyMessage, "Sign in again to make a purchase.", "warn");
    return;
  }

  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = "Buying...";

  try {
    const response = await fetch("/api/reseller/purchase", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ inventory_slug: inventorySlug, quantity }),
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Unable to complete the purchase.");
    }

    if (keyReveal && keyRevealValue) {
      keyRevealValue.textContent = (data.license_keys || [data.license_key]).filter(Boolean).join("\n");
      keyReveal.hidden = false;
    }
    renderMessage(buyMessage, `Purchased ${quantity} key${quantity > 1 ? "s" : ""} — order ${data.order_number}.`, "success");

    await loadCatalog();
  } catch (error) {
    renderMessage(buyMessage, error instanceof Error ? error.message : "Unable to complete the purchase.", "error");
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

productsBody?.addEventListener("click", handleBuyClick);
productSearchInput?.addEventListener("input", () => renderProducts(productSearchInput.value));

/* ── Top up ── */
function readTopupAmountCents() {
  const cents = Math.round(parseFloat(topupCustomInput?.value) * 100);
  if (!Number.isFinite(cents) || cents < 500 || cents > 200_000) {
    return null;
  }
  return cents;
}

topupPresetWrap?.querySelectorAll(".topup-preset").forEach((button) => {
  button.addEventListener("click", () => {
    topupPresetWrap.querySelectorAll(".topup-preset").forEach((b) => b.classList.remove("is-active"));
    button.classList.add("is-active");
    if (topupCustomInput) {
      topupCustomInput.value = (Number(button.dataset.amount) / 100).toString();
    }
  });
});

topupCustomInput?.addEventListener("input", () => {
  topupPresetWrap?.querySelectorAll(".topup-preset").forEach((b) => b.classList.remove("is-active"));
});

topupSubmitButton?.addEventListener("click", async () => {
  const amountCents = readTopupAmountCents();
  if (!amountCents) {
    renderMessage(topupMessage, "Enter an amount between $5 and $2,000.", "warn");
    return;
  }
  const session = await getCurrentSession();
  if (!session?.access_token) {
    renderMessage(topupMessage, "Sign in first to add funds.", "warn");
    return;
  }
  topupSubmitButton.disabled = true;
  const original = topupSubmitButton.textContent;
  topupSubmitButton.textContent = "Redirecting...";
  try {
    const response = await fetch("/api/reseller/topup/create-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ amountCents }),
    });
    const data = await response.json();
    if (!response.ok || !data.url) {
      throw new Error(data.error || "Unable to start the top-up.");
    }
    window.location.href = data.url;
  } catch (error) {
    renderMessage(topupMessage, error instanceof Error ? error.message : "Unable to start the top-up.", "error");
    topupSubmitButton.disabled = false;
    topupSubmitButton.textContent = original;
  }
});

/* ── Load catalog + pricing ── */
async function loadCatalog() {
  const session = await getCurrentSession();
  if (!session?.access_token) {
    return;
  }
  try {
    const response = await fetch("/api/reseller/catalog", {
      headers: { Authorization: `Bearer ${session.access_token}` },
      credentials: "same-origin",
    });
    if (!response.ok) {
      return;
    }
    const data = await response.json();
    latestCatalog = data.products || [];
    latestReseller = data;
    renderProducts(productSearchInput?.value || "");
    renderProgress(data);
    if (balanceLabel) {
      balanceLabel.textContent = centsToLabel(data.balance_cents);
    }
  } catch {
    // Leave the last-known catalog rendered.
  }
}

/* ── Load reseller application/account status ── */
async function loadResellerStatus() {
  const session = await getCurrentSession();

  if (!session?.access_token) {
    hideAll();
    if (guestView) {
      guestView.hidden = false;
    }
    return;
  }

  try {
    const response = await fetch("/api/reseller/me", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      credentials: "same-origin",
    });

    if (!response.ok) {
      throw new Error("Unable to load reseller status.");
    }

    const data = await response.json();
    hideAll();

    if (data.status === "none" || !data.reseller) {
      if (noneView) {
        noneView.hidden = false;
      }
      return;
    }

    if (data.status === "pending") {
      if (pendingView) {
        pendingView.hidden = false;
      }
      return;
    }

    if (data.status === "denied" || data.status === "revoked") {
      if (deniedView) {
        deniedView.hidden = false;
      }
      return;
    }

    if (data.status === "approved") {
      const reseller = data.reseller;
      if (tierLabel) {
        tierLabel.textContent = (reseller.tier || "new").toUpperCase();
      }
      if (balanceLabel) {
        balanceLabel.textContent = centsToLabel(reseller.balance_cents);
      }
      if (discountLabel) {
        discountLabel.textContent = `${reseller.discount_percent ?? 0}% off catalog`;
      }
      if (keyLast4Label) {
        keyLast4Label.textContent = reseller.api_key_last4 ? `...${reseller.api_key_last4}` : "not issued yet";
      }
      if (websiteLabel) {
        websiteLabel.textContent = `Website: ${reseller.website || "—"}`;
      }
      if (discordServerLabel) {
        discordServerLabel.textContent = `Discord: ${reseller.discord_server || "—"}`;
      }
      if (volumeLabel) {
        volumeLabel.textContent = `Lifetime purchased: ${centsToLabel(reseller.lifetime_purchased_cents)}`;
      }
      if (approvedView) {
        approvedView.hidden = false;
      }
      await loadCatalog();
      return;
    }

    if (noneView) {
      noneView.hidden = false;
    }
  } catch (error) {
    renderMessage(messageBox, error.message || "Unable to load your reseller status right now.", "error");
  }
}

const topupParam = new URLSearchParams(window.location.search).get("topup");
if (topupParam === "success") {
  renderMessage(topupMessage, "Payment received. Your balance updates within a moment.", "success");
  window.setTimeout(loadCatalog, 1500);
  window.setTimeout(loadCatalog, 4500);
  window.history.replaceState({}, "", window.location.pathname);
} else if (topupParam === "cancel") {
  renderMessage(topupMessage, "Top-up canceled.", "warn");
  window.history.replaceState({}, "", window.location.pathname);
}

loadResellerStatus();
