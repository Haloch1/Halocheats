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

function unavailableVariant(productSlug, slug, name, amount) {
  return keyVariant(productSlug, slug, name, amount, {
    stockLabel: "0 In Stock",
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
  badge: "Online",
  featured: false,
  available: true,
};

const productCatalog = [
  {
    ...r6Meta,
    slug: "crusader-r6",
    name: "Crusader R6",
    priceDisplay: "From $4.99",
    summary:
      "Top-tier R6 Siege solution with advanced trigger support, clean visuals, and player info overlay.",
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
    generalInfo: ["Great for legit-rage playstyles"],
    requirements: ["CPU: Intel / AMD", "OS: Windows 10 / 11"],
    variants: [
      stockedButBlockedVariant("crusader-r6", "day", "1 Day Key", 499, 2),
      unavailableVariant("crusader-r6", "week", "1 Week Key", 1999),
      unavailableVariant("crusader-r6", "month", "1 Month Key", 3999),
    ],
  },
  {
    ...r6Meta,
    slug: "vega-r6-external",
    name: "Vega R6 External",
    priceDisplay: "From $4.99",
    summary:
      "Premium R6 Siege external with full aimbot, advanced visuals, and streamproof support.",
    features: ["External build", "Aimbot suite", "Streamproof support"],
    featureGroups: [
      {
        title: "Misc",
        items: [
          "FPS lock",
          "Save and export configs",
          "Streamproof for GeForce",
          "OBS support",
          "Medal support",
          "Game-capture software support",
        ],
      },
      {
        title: "Aimbot",
        items: [
          "Aim filter by crosshair and distance",
          "Smoothing",
          "FOV",
          "Distance check",
          "Multipoint bones",
          "Filter team",
        ],
      },
      {
        title: "Visuals",
        items: ["Skeleton", "Box", "Head marker", "Names", "Distance", "Filter team", "Radar", "FOV circle"],
      },
    ],
    requirements: ["Windows 10", "Windows 11 21H2 - 25H2", "UEFI based motherboard"],
    variants: [
      stockedButBlockedVariant("vega-r6-external", "day", "1 Day Key", 499, 1),
      unavailableVariant("vega-r6-external", "three-day", "3 Day Key", 999),
      unavailableVariant("vega-r6-external", "week", "1 Week Key", 2499),
      unavailableVariant("vega-r6-external", "month", "1 Month Key", 4999),
    ],
  },
  {
    ...r6Meta,
    slug: "r6-frost",
    name: "R6 Frost",
    priceDisplay: "From $9.99",
    summary:
      "Powerful Rainbow Six Siege cheat with clean information and full control. Smooth, optimized ESP highlights enemies, gadgets, and map details in real time.",
    features: ["Optimized ESP", "Aim control", "Streamable setup"],
    featureGroups: [
      { title: "Memory aim" },
      { title: "Aimbot smoothing" },
      { title: "Closest bone to crosshair" },
      { title: "No recoil" },
      { title: "Player ESP" },
      { title: "World ESP" },
      { title: "Custom chams" },
      { title: "Streamable" },
    ],
    requirements: ["Windows 10: 20H2 to 22H2", "Windows 11: 21H2 to 25H2"],
    variants: [
      unavailableVariant("r6-frost", "day", "1 Day Key", 999),
      unavailableVariant("r6-frost", "week", "1 Week Key", 2999),
      unavailableVariant("r6-frost", "month", "1 Month Key", 5500),
    ],
  },
  {
    ...r6Meta,
    slug: "r6-ancient",
    name: "R6 Ancient",
    priceDisplay: "From $3.49",
    summary:
      "Ancient R6 cheat with aimbot, visuals, abilities, and full config controls.",
    features: ["Aim control", "Character abilities", "Full config"],
    featureGroups: [
      {
        title: "Aimbot",
        items: ["Enable", "Aim key", "FOV", "Smooth", "Sensitivity", "Target bone", "Nearest bone", "Target lock"],
      },
      {
        title: "Config",
        items: ["Save", "Load", "Delete", "Share"],
      },
      {
        title: "Visuals",
        items: ["Box", "Skeleton", "Skeleton thickness", "Lines", "Line thickness", "Health"],
      },
      {
        title: "Abilities",
        items: ["All characters", "Icon size control"],
      },
    ],
    requirements: [
      "Intel + AMD CPU",
      "Windows 10 - 11 | 1909 - 25H2",
      "SVM [AMD] / VT-X [INTEL] enabled in BIOS",
      "16GB RAM or more",
      "Hyper-V disabled for AMD CPU only",
      "Hyper-V enabled for Intel CPU only",
      "Firmware in UEFI mode only for Intel CPU",
      "GPT disk format only for Intel CPU",
      "Secure Boot disabled",
    ],
    variants: [
      unavailableVariant("r6-ancient", "day", "1 Day Key", 349),
      unavailableVariant("r6-ancient", "week", "7 Day Key", 1299),
      unavailableVariant("r6-ancient", "month", "30 Day Key", 2799),
      unavailableVariant("r6-ancient", "lifetime", "Lifetime Key", 29999),
    ],
  },
  {
    ...r6Meta,
    slug: "r6-recoil-private",
    name: "R6 Recoil Private",
    priceDisplay: "From $1.99",
    summary:
      "Private Rainbow Six Siege cheat with aimbot, ESP, and streamproof support.",
    features: ["Private build", "ESP support", "Streamproof support"],
    featureGroups: [
      {
        title: "Aimbot",
        items: ["Smoothing", "FOV", "Distance check", "Bone selection"],
      },
      {
        title: "Visuals",
        items: ["Skeleton", "Box", "Health", "Distance", "Names"],
      },
      {
        title: "Misc",
        items: ["Streamproof", "Save and export configs"],
      },
    ],
    requirements: ["Windows 10", "Windows 11 21H2 - 25H2", "UEFI based motherboard"],
    variants: [
      stockedButBlockedVariant("r6-recoil-private", "day", "1 Day Key", 199, 1),
      unavailableVariant("r6-recoil-private", "week", "7 Day Key", 599),
      unavailableVariant("r6-recoil-private", "month", "30 Day Key", 1999),
      unavailableVariant("r6-recoil-private", "lifetime", "Lifetime Key", 2999),
    ],
  },
  {
    ...r6Meta,
    slug: "exodus-r6",
    name: "Exodus R6",
    priceDisplay: "From $2.99",
    summary:
      "Exodus Rainbow Six Siege cheat with aimbot, ESP, and HWID spoofer support.",
    features: ["Aim support", "ESP support", "HWID support"],
    variants: [
      stockedButBlockedVariant("exodus-r6", "day", "1 Day Key", 299, 1),
      unavailableVariant("exodus-r6", "three-day", "3 Day Key", 599),
      unavailableVariant("exodus-r6", "week", "7 Day Key", 1299),
      unavailableVariant("exodus-r6", "month", "30 Day Key", 1999),
    ],
    featureGroups: [
      {
        title: "Aimbot",
        items: ["Smoothing", "FOV", "Distance check"],
      },
      {
        title: "Visuals",
        items: ["Skeleton", "Box", "Health", "Distance", "Names"],
      },
      {
        title: "Misc",
        items: ["HWID spoofer support", "Save and export configs"],
      },
    ],
    requirements: ["Windows 10", "Windows 11 21H2 - 25H2", "UEFI based motherboard"],
  },
  {
    ...r6Meta,
    slug: "invision-chams",
    name: "Invision Chams",
    priceDisplay: "From $2.99",
    summary:
      "Clean visual chams for improved clarity, awareness, and faster response time. NVIDIA only.",
    features: ["Visual clarity", "Low impact", "NVIDIA only"],
    featureGroups: [
      { title: "Clean visual enhancements for improved clarity" },
      { title: "Smooth performance with low system impact" },
      { title: "Updated often for stability and reliability" },
      { title: "Built to help with awareness, visibility, and faster response time" },
    ],
    requirements: [
      "Requires a physical USB device or properly configured virtual USB",
      "Windows 11: 23H2 (22631), 24H2 (26100), 25H2 (26200)",
      "Windows 10: 22H2, limited build dependent",
      "Not supported: Windows 10 21H1 / 21H2",
      "NVIDIA GPUs only",
    ],
    variants: [
      unavailableVariant("invision-chams", "day", "1 Day Key", 299),
      unavailableVariant("invision-chams", "week", "7 Day Key", 1299),
      unavailableVariant("invision-chams", "month", "1 Month Key", 2499),
    ],
  },
];

export const products = productCatalog;
