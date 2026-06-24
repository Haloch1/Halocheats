function stripeEnvKey(productSlug, variantSlug) {
  return `STRIPE_PRICE_${productSlug}_${variantSlug}`
    .replace(/-/g, "_")
    .toUpperCase();
}

function keyVariant(productSlug, slug, name, amount, options = {}) {
  return {
    slug,
    name,
    stockLabel: options.stockLabel || "In Stock",
    priceDisplay: options.priceDisplay || `$${(amount / 100).toFixed(2)}`,
    amount,
    inventorySlug: `${productSlug}-${slug}`,
    stripeEnvKey: options.stripeEnvKey || stripeEnvKey(productSlug, slug),
    checkoutBlocked: Boolean(options.checkoutBlocked),
    checkoutError: options.checkoutError || "",
  };
}

function unavailableVariant(productSlug, slug, name) {
  return keyVariant(productSlug, slug, name, 0, {
    stockLabel: "0 In Stock",
    priceDisplay: "Unavailable",
    stripeEnvKey: `DISABLED_${stripeEnvKey(productSlug, slug)}`,
  });
}

function stockedButBlockedVariant(productSlug, slug, name, amount, stockCount) {
  return keyVariant(productSlug, slug, name, amount, {
    stockLabel: `${stockCount} ${stockCount === 1 ? "Key" : "Keys"} Available`,
    stripeEnvKey: `BLOCKED_${stripeEnvKey(productSlug, slug)}`,
    checkoutBlocked: true,
    checkoutError:
      "Error occurred. Please open a ticket in Discord so support can help you with this item.",
  });
}

const r6Meta = {
  vendor: "Rainbow Six Siege",
  game: "Rainbow Six Siege",
  category: "Rainbow Six Siege",
  badge: "Unavailable",
  featured: false,
  available: false,
};

const productCatalog = [
  {
    ...r6Meta,
    slug: "crusader-r6",
    name: "Crusader R6",
    priceDisplay: "From $4.79",
    summary:
      "Top-tier R6 Siege access with trigger tools, clean player info, and fast visual awareness.",
    features: ["Trigger support", "Player info overlay", "Config profiles"],
    featureGroups: [
      {
        title: "Misc",
        items: ["Gadget ESP", "Hit damage effect", "Crosshair"],
      },
      {
        title: "Aimbot",
        items: ["Active aimbot", "Aimbot keys", "FOV size", "Hitboxes", "Sensitivity", "Mark target"],
      },
      {
        title: "Visuals",
        items: [
          "Player ESP",
          "ESP box",
          "ESP line",
          "Player distance",
          "Skeleton",
          "Player names",
          "Head hitbox selection",
          "Health bar",
        ],
      },
    ],
    generalInfo: ["Great for legit-rage playstyles", "Fast setup through support", "Built for R6 awareness and aim control"],
    requirements: ["CPU: Intel / AMD", "OS: Windows 10 / 11"],
    badge: "Available",
    available: true,
    variants: [
      stockedButBlockedVariant("crusader-r6", "day", "1 Day Key", 479, 2),
      unavailableVariant("crusader-r6", "week", "1 Week Key"),
      unavailableVariant("crusader-r6", "month", "1 Month Key"),
    ],
  },
  {
    ...r6Meta,
    slug: "vega-r6-external",
    name: "Vega R6 External",
    priceDisplay: "From $4.79",
    summary:
      "External R6 setup with aim assistance, visual tools, and stream-friendly support.",
    features: ["External build", "Aim assistance", "Visual support"],
    badge: "Available",
    available: true,
    variants: [
      stockedButBlockedVariant("vega-r6-external", "day", "1 Day Key", 479, 1),
      unavailableVariant("vega-r6-external", "three-day", "3 Day Key"),
      unavailableVariant("vega-r6-external", "week", "1 Week Key"),
      unavailableVariant("vega-r6-external", "month", "1 Month Key"),
    ],
  },
  {
    ...r6Meta,
    slug: "r6-frost",
    name: "R6 Frost",
    priceDisplay: "From $9.59",
    summary:
      "Smooth Rainbow Six Siege tool focused on optimized visuals, aim control, and clean in-game information.",
    features: ["Optimized visuals", "Aim control", "Clean ESP"],
    variants: [
      unavailableVariant("r6-frost", "day", "1 Day Key"),
      unavailableVariant("r6-frost", "week", "1 Week Key"),
      unavailableVariant("r6-frost", "month", "1 Month Key"),
    ],
  },
  {
    ...r6Meta,
    slug: "r6-ancient",
    name: "R6 Ancient",
    priceDisplay: "From $3.35",
    summary:
      "Ancient R6 access with aim tools, visual awareness, ability support, and full config control.",
    features: ["Aim tools", "Visual awareness", "Full config"],
    variants: [
      unavailableVariant("r6-ancient", "day", "1 Day Key"),
      unavailableVariant("r6-ancient", "week", "7 Day Key"),
      unavailableVariant("r6-ancient", "month", "30 Day Key"),
      unavailableVariant("r6-ancient", "lifetime", "Lifetime Key"),
    ],
  },
  {
    ...r6Meta,
    slug: "r6-recoil-private",
    name: "R6 Recoil Private",
    priceDisplay: "From $1.91",
    summary:
      "Private Rainbow Six Siege access with recoil support, ESP tools, and streamlined setup.",
    features: ["Recoil support", "ESP tools", "Private setup"],
    badge: "Available",
    available: true,
    variants: [
      stockedButBlockedVariant("r6-recoil-private", "day", "1 Day Key", 191, 1),
      unavailableVariant("r6-recoil-private", "week", "7 Day Key"),
      unavailableVariant("r6-recoil-private", "month", "30 Day Key"),
      unavailableVariant("r6-recoil-private", "lifetime", "Lifetime Key"),
    ],
  },
  {
    ...r6Meta,
    slug: "exodus-r6",
    name: "Exodus R6",
    priceDisplay: "From $2.87",
    badge: "Available",
    summary:
      "Exodus Rainbow Six Siege access with aim support, ESP, and HWID spoofer support.",
    features: ["Aim support", "ESP support", "HWID support"],
    available: true,
    variants: [
      stockedButBlockedVariant("exodus-r6", "day", "1 Day Key", 287, 1),
      unavailableVariant("exodus-r6", "three-day", "3 Day Key"),
      unavailableVariant("exodus-r6", "week", "7 Day Key"),
      unavailableVariant("exodus-r6", "month", "30 Day Key"),
    ],
  },
  {
    ...r6Meta,
    slug: "invision-chams",
    name: "Invision Chams",
    priceDisplay: "From $2.87",
    summary:
      "Clean visual chams built for clarity, awareness, and quicker response time.",
    features: ["Visual chams", "Cleaner awareness", "Fast response"],
    variants: [
      unavailableVariant("invision-chams", "day", "1 Day Key"),
      unavailableVariant("invision-chams", "week", "7 Day Key"),
      unavailableVariant("invision-chams", "month", "1 Month Key"),
    ],
  },
];

export const products = productCatalog;
