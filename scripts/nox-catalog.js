/* NOX — real catalog access layer.
   Wraps GET /api/products (the live Supabase-backed catalog with Stripe
   pricing and key-stock counts) and adapts it to the shapes the Nox UI wants.
   This is the ONLY place that knows about the API response format. */

/* Real product categories -> url slug + cover gradient class. */
const CATEGORY_META = {
  "Rainbow Six Siege": { slug: "r6", cover: "cover-siege", tagline: "Ring 1 · Private · Lite" },
  "Apex Legends": { slug: "apex", cover: "cover-apex", tagline: "Aimbot · ESP suites" },
  Fortnite: { slug: "fortnite", cover: "cover-fortnite", tagline: "Full · Lite builds" },
  Rust: { slug: "rust", cover: "cover-rust", tagline: "Full · ESP only" },
  Spoofer: { slug: "spoofer", cover: "cover-spoofer", tagline: "Permanent · All anti-cheats" },
  "Escape From Tarkov": { slug: "tarkov", cover: "cover-tarkov", tagline: "Loot · Radar · Aim" },
  Accounts: { slug: "accounts", cover: "cover-accounts", tagline: "Ready-to-play accounts" },
};

/* Real product artwork: assets/product-<slug>.webp, collected at build time so
   we don't have to import and maintain 30 separate image bindings by hand. */
const ARTWORK = {};
for (const [path, url] of Object.entries(
  import.meta.glob("../assets/product-*.webp", { eager: true, query: "?url", import: "default" })
)) {
  const match = path.match(/product-(.+)\.webp$/);
  if (match) ARTWORK[match[1]] = url;
}

export function artworkFor(slug) {
  return ARTWORK[slug] || null;
}

/* Cover markup: real artwork when we have it, gradient + monogram when we don't. */
export function coverInner(product) {
  const art = artworkFor(product.slug);
  if (art) {
    return `<img class="cover-img" src="${art}" alt="" loading="lazy" decoding="async">`;
  }
  return `<span class="cover-mono">${monogram(product.name)}</span>`;
}

export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function categoryMeta(category) {
  return (
    CATEGORY_META[category] || {
      slug: slugify(category),
      cover: "cover-generic",
      tagline: "Undetected builds",
    }
  );
}

/* "$12.99" -> 12.99 */
export function parseMoney(text) {
  const match = String(text || "").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

export function money(amount) {
  return `$${Number(amount || 0).toFixed(2)}`;
}

export function monogram(name) {
  const words = String(name || "")
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return "NX";
  const raw = words.length >= 2 ? words[0][0] + words[1][0] : words[0].slice(0, 2);
  return raw.toUpperCase();
}

/* A product is buyable if any of its variants is checkoutReady. */
export function inStock(product) {
  return (product.variants || []).some((variant) => variant.checkoutReady);
}

/* Map real availability/badge/stock onto the Nox status badge vocabulary. */
export function productStatus(product) {
  if (product.available === false || product.badge === "Offline") return "down";
  if (product.badge === "Coming Soon") return "updating";
  if (!inStock(product)) return "down";
  return "undetected";
}

/* Cheapest live variant price, for "from $x" labels. */
export function fromPrice(product) {
  const prices = (product.variants || [])
    .map((variant) => parseMoney(variant.priceDisplay))
    .filter((price) => price > 0);
  if (!prices.length) return 0;
  return Math.min(...prices);
}

export function statusLabel(status) {
  if (status === "updating") return { label: "Updating", cls: "updating" };
  if (status === "down") return { label: "Out of stock", cls: "down" };
  return { label: "Undetected", cls: "" };
}

let catalogPromise = null;

/* Fetched once per page load, then shared between callers. */
export function loadCatalog() {
  if (!catalogPromise) {
    catalogPromise = fetch("/api/products")
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load products.");
        const data = await response.json();
        const products = (data.products || []).map((product) => {
          const meta = categoryMeta(product.category);
          return {
            ...product,
            categorySlug: meta.slug,
            cover: meta.cover,
            status: productStatus(product),
            from: fromPrice(product),
          };
        });
        return { products, promoEnabled: Boolean(data.promoEnabled) };
      })
      .catch((error) => {
        catalogPromise = null;
        throw error;
      });
  }
  return catalogPromise;
}

/* Group products into the "collections" the store page renders as game cards. */
export function collections(products) {
  const groups = new Map();

  products.forEach((product) => {
    const category = product.category || product.game || "Other";
    if (!groups.has(category)) {
      const meta = categoryMeta(category);
      groups.set(category, {
        category,
        slug: meta.slug,
        cover: meta.cover,
        tagline: meta.tagline,
        products: [],
      });
    }
    groups.get(category).products.push(product);
  });

  return [...groups.values()].map((group) => {
    /* A collection is only "down" when nothing inside it can be bought. */
    const anyLive = group.products.some((product) => product.status === "undetected");
    const anyUpdating = group.products.some((product) => product.status === "updating");
    return {
      ...group,
      count: group.products.length,
      status: anyLive ? "undetected" : anyUpdating ? "updating" : "down",
    };
  });
}

export function byCategorySlug(products, slug) {
  return products.filter((product) => product.categorySlug === slug);
}

export function bySlug(products, slug) {
  return products.find((product) => product.slug === slug) || null;
}
