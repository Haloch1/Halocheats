/* NOX — cart, balance and staff pills for the Nox-styled pages.
   Deliberately reuses the SAME localStorage key ("hc_cart"), the same item
   shape and the same server endpoints as the legacy topbar cart, so a cart
   started on an old page still works on a new one (and vice versa).
   Exposes window.haloCart with the legacy API for compatibility. */

import { getCurrentSession } from "./supabase-client.js";
import { monogram, money } from "./nox-catalog.js";

const CART_KEY = "hc_cart";

let balanceCents = 0;

/* Cart contents come out of localStorage, so never trust them in innerHTML. */
function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value ?? "");
  return div.innerHTML;
}

function readCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeCart(items) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    /* storage full or blocked — cart just won't persist */
  }
}

function cartCount(items = readCart()) {
  return items.reduce((total, item) => total + (Number(item.qty) || 1), 0);
}

function cartTotalCents(items = readCart()) {
  return items.reduce(
    (total, item) => total + (Number(item.priceCents) || 0) * (Number(item.qty) || 1),
    0
  );
}

async function fetchBalance() {
  try {
    const session = await getCurrentSession();
    if (!session?.access_token) return null;
    const response = await fetch("/api/balance", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return Number(data.balanceCents) || 0;
  } catch {
    return null;
  }
}

async function fetchRole() {
  try {
    const session = await getCurrentSession();
    if (!session?.access_token) return null;
    const response = await fetch("/api/auth/role", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.role || null;
  } catch {
    return null;
  }
}

export function initNoxCart() {
  const drawer = document.querySelector(".cart-drawer");
  const countEl = document.querySelector("[data-cart-open] .count");
  const navActions = document.querySelector(".nav-actions");
  if (!drawer) return;

  const emptyEl = drawer.querySelector(".cart-empty");

  /* The static mockup only shipped an empty state — build the live parts. */
  const body = document.createElement("div");
  body.className = "cart-body";
  body.hidden = true;
  body.innerHTML = `<div class="cart-list" data-cart-list></div>`;

  const foot = document.createElement("div");
  foot.className = "cart-foot";
  foot.hidden = true;
  foot.innerHTML = `
    <div class="cart-row"><span>Balance</span><strong data-cart-balance>$0.00</strong></div>
    <div class="cart-row total"><span>Total</span><strong data-cart-total>$0.00</strong></div>
    <p class="nox-msg" data-cart-msg hidden></p>
    <div class="cart-actions">
      <button type="button" class="btn btn-primary" data-cart-stripe>Checkout with card</button>
      <button type="button" class="btn btn-ghost" data-cart-balance-checkout>Pay with balance</button>
      <a class="btn btn-ghost" href="/account/">Add funds</a>
    </div>
  `;

  drawer.appendChild(body);
  drawer.appendChild(foot);

  const listEl = body.querySelector("[data-cart-list]");
  const totalEl = foot.querySelector("[data-cart-total]");
  const balanceEl = foot.querySelector("[data-cart-balance]");
  const msgEl = foot.querySelector("[data-cart-msg]");
  const stripeBtn = foot.querySelector("[data-cart-stripe]");
  const balanceBtn = foot.querySelector("[data-cart-balance-checkout]");

  function showMessage(text, tone = "warn") {
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.className = `nox-msg ${tone}`;
    msgEl.hidden = false;
  }

  function clearMessage() {
    if (msgEl) msgEl.hidden = true;
  }

  /* ---- balance + staff pills injected into the Nox nav ---- */
  let balancePill = null;
  if (navActions) {
    balancePill = document.createElement("a");
    balancePill.className = "nav-pill balance";
    balancePill.href = "/account/";
    balancePill.hidden = true;
    balancePill.setAttribute("aria-label", "Your balance");
    balancePill.textContent = "$0.00";
    navActions.prepend(balancePill);

    fetchRole().then((role) => {
      if (role !== "admin" && role !== "staff") return;
      const staffPill = document.createElement("a");
      staffPill.className = "nav-pill staff";
      staffPill.href = role === "admin" ? "/admin/" : "/desk-admin/";
      staffPill.textContent = role === "admin" ? "Admin" : "Staff";
      navActions.prepend(staffPill);
    });
  }

  function paintBalance() {
    const text = money(balanceCents / 100);
    if (balanceEl) balanceEl.textContent = text;
    if (balancePill) {
      balancePill.textContent = text;
      balancePill.hidden = false;
    }
  }

  function render() {
    const items = readCart();
    const count = cartCount(items);

    if (countEl) {
      countEl.textContent = String(count);
      countEl.style.display = count ? "" : "none";
    }

    const hasItems = items.length > 0;
    if (emptyEl) emptyEl.hidden = hasItems;
    body.hidden = !hasItems;
    foot.hidden = !hasItems;

    if (!hasItems) {
      listEl.innerHTML = "";
      if (totalEl) totalEl.textContent = money(0);
      return;
    }

    listEl.innerHTML = items
      .map(
        (item, index) => `
        <div class="cart-item">
          <span class="cart-item-cover ${escapeHtml(
            item.cover || "cover-generic"
          )}">${monogram(item.productName)}</span>
          <div class="cart-item-main">
            <div class="cart-item-name">${escapeHtml(item.productName)}</div>
            <div class="cart-item-variant">${escapeHtml(item.variantName)}</div>
            <div class="cart-qty">
              <button type="button" data-qty="-1" data-index="${index}" aria-label="Decrease quantity">−</button>
              <span>${Number(item.qty) || 1}</span>
              <button type="button" data-qty="1" data-index="${index}" aria-label="Increase quantity">+</button>
            </div>
          </div>
          <div class="cart-item-right">
            <span class="cart-item-price">${money(
              ((Number(item.priceCents) || 0) * (Number(item.qty) || 1)) / 100
            )}</span>
            <button type="button" class="cart-remove" data-remove="${index}">Remove</button>
          </div>
        </div>`
      )
      .join("");

    if (totalEl) totalEl.textContent = money(cartTotalCents(items) / 100);
  }

  listEl.addEventListener("click", (event) => {
    const qtyBtn = event.target.closest("[data-qty]");
    const removeBtn = event.target.closest("[data-remove]");
    const items = readCart();

    if (qtyBtn) {
      const index = Number(qtyBtn.dataset.index);
      const delta = Number(qtyBtn.dataset.qty);
      const next = (Number(items[index]?.qty) || 1) + delta;
      if (next < 1) {
        items.splice(index, 1);
      } else {
        items[index].qty = next;
      }
      writeCart(items);
      clearMessage();
      render();
      return;
    }

    if (removeBtn) {
      items.splice(Number(removeBtn.dataset.remove), 1);
      writeCart(items);
      clearMessage();
      render();
    }
  });

  /* ---- drawer open/close ---- */
  const open = () => {
    document.body.classList.add("cart-open");
    render();
  };
  const close = () => document.body.classList.remove("cart-open");

  document.querySelectorAll("[data-cart-open]").forEach((el) => el.addEventListener("click", open));
  document
    .querySelectorAll("[data-cart-close]")
    .forEach((el) => el.addEventListener("click", close));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });

  /* ---- checkout: same endpoints the legacy cart used ---- */
  async function requireSession() {
    const session = await getCurrentSession();
    if (!session?.access_token) {
      showMessage("Sign in first, then check out.");
      setTimeout(() => {
        window.location.href = `/account/?next=${encodeURIComponent(window.location.pathname)}`;
      }, 900);
      return null;
    }
    return session;
  }

  function payload(items) {
    return {
      items: items.map((item) => ({
        productSlug: item.productSlug,
        variantSlug: item.variantSlug,
        quantity: Number(item.qty) || 1,
      })),
    };
  }

  stripeBtn?.addEventListener("click", async () => {
    const items = readCart();
    if (!items.length) return;
    clearMessage();

    const session = await requireSession();
    if (!session) return;

    stripeBtn.disabled = true;
    const original = stripeBtn.textContent;
    stripeBtn.textContent = "Redirecting…";

    try {
      const response = await fetch("/api/cart/create-stripe-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload(items)),
      });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || "Unable to start checkout.");
      window.location.href = data.url;
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Checkout failed.", "error");
      stripeBtn.disabled = false;
      stripeBtn.textContent = original;
    }
  });

  balanceBtn?.addEventListener("click", async () => {
    const items = readCart();
    if (!items.length) return;
    clearMessage();

    const session = await requireSession();
    if (!session) return;

    balanceBtn.disabled = true;
    const original = balanceBtn.textContent;
    balanceBtn.textContent = "Processing…";

    try {
      const response = await fetch("/api/cart/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload(items)),
      });
      const data = await response.json();

      if (response.status === 402) {
        balanceCents = Number(data.balanceCents) || balanceCents;
        paintBalance();
        showMessage("Not enough balance. Add funds to your account first.", "error");
        balanceBtn.disabled = false;
        balanceBtn.textContent = original;
        return;
      }

      if (!response.ok && response.status !== 207) {
        throw new Error(data.error || "Checkout failed.");
      }

      writeCart([]);
      render();
      balanceCents = Number(data.balanceCents) || 0;
      paintBalance();
      const delivered = (data.delivered || []).length;
      showMessage(
        `${delivered} key${delivered === 1 ? "" : "s"} delivered — view them on your account page.`,
        "success"
      );
      balanceBtn.textContent = original;
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Checkout failed.", "error");
      balanceBtn.disabled = false;
      balanceBtn.textContent = original;
    }
  });

  /* ---- legacy-compatible public API ---- */
  window.haloCart = {
    add(item) {
      const items = readCart();
      const index = items.findIndex(
        (entry) =>
          entry.productSlug === item.productSlug && entry.variantSlug === item.variantSlug
      );
      if (index >= 0) {
        items[index].qty = (Number(items[index].qty) || 1) + (Number(item.qty) || 1);
      } else {
        items.push({ ...item, qty: Number(item.qty) || 1 });
      }
      writeCart(items);
      render();
    },
    open,
    count: cartCount,
    async refreshBalance() {
      const cents = await fetchBalance();
      if (cents !== null) {
        balanceCents = cents;
        paintBalance();
      }
      return cents;
    },
  };

  render();
  fetchBalance().then((cents) => {
    if (cents !== null) {
      balanceCents = cents;
      paintBalance();
    }
  });
}
