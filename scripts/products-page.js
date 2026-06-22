import { getCurrentSession, authConfigured } from "./supabase-client.js";
import { initReveal, renderMessage } from "./site.js";

initReveal();

const grid = document.querySelector("[data-products-grid]");
const notice = document.querySelector("[data-products-message]");
const accountLink = document.querySelector("[data-account-link]");
const categoryStrip = document.querySelector("[data-category-strip]");
const gamesStat = document.querySelector("[data-catalog-games]");
const productsStat = document.querySelector("[data-catalog-products]");
const lowestStat = document.querySelector("[data-catalog-lowest]");
let catalogProducts = [];
let activeProduct = null;
let activeVariant = null;

if (accountLink) {
  accountLink.textContent = "Account";
}

if (!authConfigured) {
  renderMessage(
    notice,
    "Account login is still being configured, so checkout is not available yet.",
    "warn"
  );
}

async function loadProducts() {
  const response = await fetch("/api/products");

  if (!response.ok) {
    throw new Error("Unable to load products.");
  }

  const { products } = await response.json();
  return products;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function groupProducts(products) {
  return products.reduce((groups, product) => {
    const category = product.category || product.game || "Catalog";

    if (!groups.has(category)) {
      groups.set(category, []);
    }

    groups.get(category).push(product);
    return groups;
  }, new Map());
}

function getStartingPrice(product) {
  const match = product.priceDisplay.match(/\$([0-9]+(?:\.[0-9]{2})?)/);
  return match ? Number(match[1]) : Infinity;
}

function renderCategoryStrip(groups) {
  if (!categoryStrip) {
    return;
  }

  const links = [...groups.keys()].map((category) => {
    const link = document.createElement("a");
    link.href = `#${slugify(category)}`;
    link.textContent = category;
    return link;
  });

  categoryStrip.replaceChildren(...links);
}

function renderProductCard(product, index) {
  const item = document.createElement("article");
  const statusClass = product.available ? "live" : "unavailable";
  item.className = `product-card product-card-page catalog-product${
    product.featured ? " featured" : ""
  }`;
  item.dataset.delay = String(30 + (index % 4) * 35);
  item.innerHTML = `
    <div class="product-top">
      <span class="product-status ${product.featured ? "pulse" : statusClass}">${product.badge}</span>
      <span class="product-tier">${product.vendor}</span>
    </div>
    <h3>${product.name}</h3>
    <p>${product.summary}</p>
    <ul class="feature-list">
      ${product.features.map((feature) => `<li>${feature}</li>`).join("")}
    </ul>
    <div class="product-footer">
      <strong>${product.priceDisplay}</strong>
      <button class="button button-primary pay-button" data-product-slug="${product.slug}" ${
        product.available ? "" : "disabled"
      }>
        ${product.available ? "Buy Now" : "Testing"}
      </button>
    </div>
  `;

  return item;
}

function ensureVariantModal() {
  let modal = document.querySelector("[data-variant-modal]");

  if (modal) {
    return modal;
  }

  modal = document.createElement("div");
  modal.className = "variant-modal";
  modal.hidden = true;
  modal.dataset.variantModal = "";
  modal.innerHTML = `
    <div class="variant-backdrop" data-variant-close></div>
    <section class="variant-dialog" role="dialog" aria-modal="true" aria-labelledby="variant-title">
      <button class="variant-close" type="button" data-variant-close aria-label="Close variant selector">×</button>
      <div class="variant-art">
        <div class="variant-art-card">
          <div class="variant-logo-mark">HC</div>
          <div class="variant-art-copy">
            <span>Rainbow Six Siege</span>
            <strong data-variant-art-title>Access Key</strong>
            <small>Instant member delivery</small>
          </div>
          <div class="variant-card-strip">
            <span>01</span>
            <span>Verified Route</span>
          </div>
        </div>
      </div>
      <div class="variant-details">
        <p class="eyebrow">Select Variant</p>
        <h3 id="variant-title" data-variant-title></h3>
        <div class="variant-status-row">
          <span class="variant-dot"></span>
          <strong data-variant-status></strong>
          <span data-variant-price></span>
          <em>In Stock</em>
        </div>
        <p data-variant-summary></p>
        <label class="variant-label">Variant</label>
        <div class="variant-options" data-variant-options></div>
        <div class="variant-quantity">
          <label>Quantity</label>
          <div>
            <button type="button" disabled>-</button>
            <span>1</span>
            <button type="button" disabled>+</button>
          </div>
        </div>
        <div class="variant-actions">
          <button class="button button-secondary" type="button" data-variant-close>Cancel</button>
          <button class="button button-primary" type="button" data-variant-checkout>Buy Now</button>
        </div>
      </div>
    </section>
  `;
  document.body.append(modal);

  modal.addEventListener("click", async (event) => {
    const closeButton = event.target.closest("[data-variant-close]");
    const option = event.target.closest("[data-variant-option]");
    const checkoutButton = event.target.closest("[data-variant-checkout]");

    if (closeButton) {
      closeVariantModal();
      return;
    }

    if (option) {
      selectVariant(option.dataset.variantSlug);
      return;
    }

    if (checkoutButton) {
      await checkoutSelectedVariant(checkoutButton);
    }
  });

  return modal;
}

function openVariantModal(product) {
  if (!product) {
    renderMessage(notice, "That product could not be loaded. Refresh and try again.", "error");
    return;
  }

  if (!product.available) {
    renderMessage(notice, "This listing is unavailable right now.", "warn");
    return;
  }

  activeProduct = product;
  activeVariant = product.variants?.find((variant) => variant.checkoutReady) || product.variants?.[0] || null;

  const modal = ensureVariantModal();
  modal.querySelector("[data-variant-title]").textContent = product.name;
  modal.querySelector("[data-variant-art-title]").textContent = product.name;
  modal.querySelector("[data-variant-status]").textContent = product.badge;
  modal.querySelector("[data-variant-summary]").textContent = product.summary;

  const options = modal.querySelector("[data-variant-options]");
  options.replaceChildren(
    ...(product.variants || []).map((variant) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "variant-option";
      button.dataset.variantOption = "";
      button.dataset.variantSlug = variant.slug;
      button.disabled = !variant.checkoutReady;
      button.innerHTML = `
        <span>
          <strong>${variant.name}</strong>
          <small>${variant.checkoutReady ? variant.stockLabel : "Payment setup needed"}</small>
        </span>
        <em>${variant.priceDisplay}</em>
      `;
      return button;
    })
  );

  modal.hidden = false;
  document.body.classList.add("modal-open");
  selectVariant(activeVariant?.slug);
}

function closeVariantModal() {
  const modal = document.querySelector("[data-variant-modal]");

  if (!modal) {
    return;
  }

  modal.hidden = true;
  document.body.classList.remove("modal-open");
}

function selectVariant(variantSlug) {
  if (!activeProduct) {
    return;
  }

  activeVariant = activeProduct.variants?.find((variant) => variant.slug === variantSlug) || null;
  const modal = ensureVariantModal();
  const checkoutButton = modal.querySelector("[data-variant-checkout]");

  modal.querySelectorAll("[data-variant-option]").forEach((option) => {
    option.classList.toggle("is-selected", option.dataset.variantSlug === activeVariant?.slug);
  });

  modal.querySelector("[data-variant-price]").textContent = activeVariant?.priceDisplay || "";
  checkoutButton.disabled = !activeVariant?.checkoutReady;
  checkoutButton.textContent = activeVariant?.checkoutReady ? "Buy Now" : "Payment Setup Needed";
}

function renderProductGroups(products) {
  const groups = groupProducts(products);
  renderCategoryStrip(groups);

  const sections = [...groups.entries()].map(([category, categoryProducts], groupIndex) => {
    const section = document.createElement("section");
    section.className = "catalog-group";
    section.id = slugify(category);
    section.innerHTML = `
      <div class="catalog-group-heading">
        <div>
          <span>${String(categoryProducts.length).padStart(2, "0")} listings</span>
          <h3>${category}</h3>
        </div>
        <p>${categoryProducts.some((product) => product.available) ? "Available now" : "Stock watch"}</p>
      </div>
    `;

    const list = document.createElement("div");
    list.className = "product-grid page-product-grid catalog-grid";
    list.replaceChildren(...categoryProducts.map(renderProductCard));
    section.append(list);
    return section;
  });

  grid.replaceChildren(...sections);
}

function updateStats(products) {
  const categories = new Set(products.map((product) => product.category || product.game));
  const lowest = products.reduce((best, product) => Math.min(best, getStartingPrice(product)), Infinity);

  if (gamesStat) {
    gamesStat.textContent = categories.size;
  }

  if (productsStat) {
    productsStat.textContent = products.length;
  }

  if (lowestStat) {
    lowestStat.textContent = Number.isFinite(lowest) ? `$${lowest.toFixed(2)}` : "$0";
  }
}

async function startCheckout(productSlug, variantSlug) {
  const session = await getCurrentSession();

  if (!session) {
    window.location.href = `/account/?next=/products/&intent=checkout&product=${productSlug}&variant=${variantSlug}`;
    return;
  }

  const response = await fetch("/api/create-checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      productSlug,
      variantSlug,
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Unable to start checkout.");
  }

  window.location.href = payload.url;
}

async function checkoutSelectedVariant(button) {
  if (!activeProduct || !activeVariant) {
    renderMessage(notice, "Pick a variant before checkout.", "warn");
    return;
  }

  if (!activeVariant.checkoutReady) {
    renderMessage(notice, "This variant needs a Stripe Price ID before checkout.", "warn");
    return;
  }

  button.disabled = true;
  button.textContent = "Opening Checkout...";

  try {
    await startCheckout(activeProduct.slug, activeVariant.slug);
  } catch (error) {
    renderMessage(notice, error.message, "error");
    button.disabled = false;
    button.textContent = "Buy Now";
  }
}

try {
  catalogProducts = await loadProducts();
  updateStats(catalogProducts);
  renderProductGroups(catalogProducts);
  initReveal();
} catch (error) {
  renderMessage(notice, error.message, "error");
}

grid?.addEventListener("click", async (event) => {
  const button = event.target.closest(".pay-button");

  if (!button) {
    return;
  }

  const product = catalogProducts.find((item) => item.slug === button.dataset.productSlug);
  openVariantModal(product);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeVariantModal();
  }
});
