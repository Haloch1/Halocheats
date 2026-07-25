function stripeEnvKey(productSlug, variantSlug) {
  return `STRIPE_PRICE_${productSlug}_${variantSlug}`
    .replace(/-/g, "_")
    .toUpperCase();
}

function money(amount) {
  return `$${(amount / 100).toFixed(2)}`;
}

function adjustAmount(amount, multiplier) {
  return Math.round(amount * multiplier);
}

function keyVariant(productSlug, slug, name, amount, options = {}) {
  const result = {
    slug,
    name,
    stockLabel: options.stockLabel || "In Stock",
    priceDisplay: options.priceDisplay || money(amount),
    amount,
    inventorySlug: `${productSlug}-${slug}`,
    stripeEnvKey: options.stripeEnvKey || stripeEnvKey(productSlug, slug),
    checkoutBlocked: Boolean(options.checkoutBlocked),
    checkoutError: options.checkoutError || "",
  };
  if (options.originalAmount) {
    result.originalPrice = money(options.originalAmount);
  }
  return result;
}

function saleVariant(productSlug, slug, name, originalAmount, salePercent, options = {}) {
  const saleAmount = Math.round(originalAmount * (1 - salePercent / 100));
  return keyVariant(productSlug, slug, name, saleAmount, {
    ...options,
    originalAmount,
  });
}

function unavailableVariant(productSlug, slug, name, amount) {
  return keyVariant(productSlug, slug, name, amount, {
    stockLabel: "Unavailable",
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

function adjustedUnavailableVariant(productSlug, slug, name, baseAmount, multiplier) {
  return unavailableVariant(productSlug, slug, name, adjustAmount(baseAmount, multiplier));
}

function adjustedBlockedVariant(productSlug, slug, name, baseAmount, stockCount, multiplier) {
  return stockedButBlockedVariant(productSlug, slug, name, adjustAmount(baseAmount, multiplier), stockCount);
}

function disabledVariants(productSlug, rows) {
  return rows.map(([slug, name, amount]) => unavailableVariant(productSlug, slug, name, amount));
}

function categoryMeta(category) {
  return {
    vendor: category,
    game: category,
    category,
    badge: "Online",
    featured: false,
    available: true,
  };
}

const r6Multiplier = 1;
const newProductMultiplier = 1;
const defaultGeneralInfo = "Open the setup instructions before using this product.";
const universalSetupNotes = [];

const r6Meta = {
  vendor: "Rainbow Six Siege",
  game: "Rainbow Six Siege",
  category: "Rainbow Six Siege",
  badge: "Online",
  featured: false,
  available: true,
};

const fortniteMeta = {
  vendor: "Fortnite",
  game: "Fortnite",
  category: "Fortnite",
  badge: "Online",
  featured: false,
  available: true,
};

const spooferMeta = {
  vendor: "Spoofer",
  game: "Spoofer",
  category: "Spoofer",
  badge: "Online",
  featured: false,
  available: true,
};

const accountsMeta = {
  vendor: "Accounts",
  game: "Accounts",
  category: "Accounts",
  badge: "Online",
  featured: false,
  available: true,
};

const apexMeta = {
  vendor: "Apex Legends",
  game: "Apex Legends",
  category: "Apex Legends",
  badge: "Online",
  featured: false,
  available: true,
};

const eftMeta = {
  vendor: "Escape From Tarkov",
  game: "Escape From Tarkov",
  category: "Escape From Tarkov",
  badge: "Coming Soon",
  featured: false,
  available: false,
};

const rustMeta = {
  vendor: "Rust",
  game: "Rust",
  category: "Rust",
  badge: "Online",
  featured: false,
  available: true,
};

const productCatalog = [
  {
    ...r6Meta,
    badge: "Undetected",
    slug: "r6s-ancient",
    name: "R6S Ancient",
    priceDisplay: `From ${money(300)}`,
    summary:
      "Full-featured Rainbow Six Siege loadout combining a tunable aimbot, layered player ESP, and gadget control for both attackers and defenders.",
    features: ["Aimbot suite", "Player ESP", "Gadget control"],
    featureGroups: [
      {
        title: "Aimbot",
        items: [
          "Enable aimbot",
          "Aim key",
          "Draw FOV",
          "FOV slider",
          "Aim smoothness",
          "Aim sensitivity",
          "Target bones",
          "Nearest bone",
          "Target lock",
        ],
      },
      {
        title: "Player ESP",
        items: [
          "Draw box",
          "Draw skeleton",
          "Skeleton thickness slider",
          "Draw health",
          "Draw lines",
          "Lines thickness slider",
          "Draw operator icon",
        ],
      },
      {
        title: "Gadget Abilities",
        items: [
          "Enable all attackers",
          "Breach hammer",
          "Breaching rounds",
          "Shock drone",
          "Cluster charges",
          "Rifle shield",
          "Exothermic chargers",
          "Enable all defenders",
          "Gas grenades",
          "Armor panels",
          "Cardiac sensor",
          "Stim pistols",
          "Black eye",
          "Silent step",
        ],
      },
      {
        title: "Config",
        items: ["Create new config", "Import config", "Abilities icon size slider"],
      },
    ],
    generalInfo: [
      "Covers both attacker and defender gadgets alongside the aim and ESP tools.",
      "Includes a built-in spoofer, though results can vary by system.",
      ...universalSetupNotes,
    ],
    requirements: [
      "Game version: UPlay (Ubisoft Connect), Steam, Epic Games",
      "CPU: Intel & AMD",
      "GPU: Nvidia & AMD",
      "OS: Windows 10, Windows 11 (21H2, 22H2, 23H2, 24H2, 25H2)",
      "Full-screen mode: not supported (windowed/borderless only)",
      "Built-in spoofer included (may not work on all systems)",
    ],
    variants: [
      keyVariant("r6s-ancient", "day", "1 Day Key", 300),
      keyVariant("r6s-ancient", "week", "7 Day Key", 1500),
      keyVariant("r6s-ancient", "month", "30 Day Key", 3000),
    ],
  },
  {
    ...r6Meta,
    slug: "r6s-crusader",
    name: "Crusader R6S",
    priceDisplay: `From ${money(400)}`,
    summary:
      "Aim- and ESP-focused Rainbow Six Siege tool built around clean target reads and adjustable aim assist.",
    features: ["Player ESP", "Aimbot"],
    featureGroups: [
      {
        title: "Player ESP",
        items: [
          "Player ESP",
          "ESP box",
          "ESP line (top, center, bottom)",
          "Player distance",
          "Skeleton",
          "Name",
          "Head hitbox",
          "Health (bar/text)",
          "Team check",
          "Max distance",
        ],
      },
      {
        title: "Aimbot",
        items: [
          "Active aimbot",
          "Two bindable aimbot keys",
          "FOV size",
          "Draw FOV",
          "Hitbox selection",
          "Mark target",
          "Sensitivity",
          "Static crosshair",
        ],
      },
    ],
    generalInfo: [
      "Keeps to the two core categories, aim and visuals, without extra add-ons.",
      ...universalSetupNotes,
    ],
    requirements: [
      "Game version: UPlay (Ubisoft Connect), Steam, Epic Games",
      "CPU: Intel & AMD",
      "GPU: Nvidia & AMD",
      "OS: Windows 10, Windows 11",
      "Full-screen mode: not supported (windowed/borderless only)",
    ],
    variants: [
      keyVariant("r6s-crusader", "day", "1 Day Key", 400),
      keyVariant("r6s-crusader", "week", "7 Day Key", 2000),
      keyVariant("r6s-crusader", "month", "30 Day Key", 4000),
    ],
  },
  {
    ...r6Meta,
    badge: "Updating",
    slug: "r6s-vega",
    name: "R6S Vega",
    priceDisplay: `From ${money(400)}`,
    summary:
      "Adaptive Rainbow Six Siege X toolkit pairing a real-time aimbot with map-wide visuals and stream-safe overlays.",
    features: ["Adaptive aimbot", "Full visuals", "Streamproof"],
    featureGroups: [
      {
        title: "Aimbot",
        items: ["Aim filter (crosshair & distance)", "Smoothing", "FOV", "Distance check", "Multipoint bones", "Filter team"],
      },
      {
        title: "Visuals",
        items: ["Skeleton", "Box", "Head marker", "Names", "Distance", "Filter team", "Radar", "FOV circle"],
      },
      {
        title: "Misc",
        items: ["FPS lock", "Save & export configs", "Streamproof (GeForce, OBS, Medal, and other capture software)"],
      },
    ],
    generalInfo: [
      "Aim behavior adjusts on the fly rather than sticking to one fixed setting.",
      "Alienware PCs are not supported.",
      ...universalSetupNotes,
    ],
    requirements: [
      "Game version: UPlay (Ubisoft Connect), Steam, Epic Games",
      "CPU: Intel & AMD",
      "GPU: Nvidia & AMD",
      "OS: Windows 10, Windows 11 (up to 25H2)",
      "Full-screen mode: supported",
      "Streamproof: not compatible with Alienware PCs",
    ],
    variants: [
      keyVariant("r6s-vega", "day", "1 Day Key", 400),
      keyVariant("r6s-vega", "three-day", "3 Day Key", 800),
      keyVariant("r6s-vega", "week", "7 Day Key", 1600),
      keyVariant("r6s-vega", "month", "30 Day Key", 3000),
    ],
  },
  {
    ...r6Meta,
    slug: "r6s-chams",
    name: "R6S Chams Wallhack",
    priceDisplay: `From ${money(350)}`,
    summary:
      "Lightweight Rainbow Six Siege wallhack focused purely on chams-based visibility through walls, built to stay low-impact on performance.",
    features: ["Chams wallhack", "Low performance impact"],
    featureGroups: [
      {
        title: "Visuals",
        items: ["Chams-based wallhack", "Enemy visibility through walls"],
      },
    ],
    generalInfo: [
      "A stripped-back option for players who only want wall visibility without a full feature set.",
      "Requires a USB flash drive as part of the NVIDIA-only setup path.",
      ...universalSetupNotes,
    ],
    requirements: [
      "Game version: UPlay (Ubisoft Connect), Steam, Epic Games",
      "CPU: Intel & AMD",
      "GPU: Nvidia only",
      "OS: Windows 10 (22H2), Windows 11 (22H2, 23H2, 24H2, 25H2)",
      "Full-screen mode: not supported (windowed/borderless only)",
      "Requires a USB flash drive; Nvidia GPU only",
    ],
    variants: [
      keyVariant("r6s-chams", "day", "1 Day Key", 350),
      keyVariant("r6s-chams", "week", "7 Day Key", 1500),
      keyVariant("r6s-chams", "month", "30 Day Key", 3000),
    ],
  },
  {
    ...r6Meta,
    badge: "Updating",
    slug: "r6s-lethal",
    name: "R6S Lethal (Full)",
    priceDisplay: `From ${money(1099)}`,
    summary:
      "The most complete Rainbow Six Siege package in the lineup, combining full ESP coverage, an aim suite, and utility tools in one internal build.",
    features: ["Full ESP suite", "Aimbot + misc aim tools", "Utility features"],
    featureGroups: [
      {
        title: "ESP",
        items: [
          "Player ESP",
          "Box ESP",
          "Skeleton ESP",
          "Line ESP (top, center, bottom)",
          "Distance ESP",
          "Name ESP",
          "Head dot ESP",
          "Health ESP (bar & text)",
          "Operator name ESP",
          "Operator icon ESP",
          "Team check",
          "Visibility check",
          "World ESP",
          "Grenade ESP",
          "Smoke ESP",
          "Stun ESP",
          "Drone ESP",
          "Barrier ESP",
          "Trap ESP",
          "Max distance filter",
        ],
      },
      {
        title: "Aimbot & Misc Aim",
        items: [
          "Active aimbot",
          "Anti-recoil",
          "View angle aim",
          "Distance limiter",
          "Aimbot smoothing",
          "Aim bone selection",
          "Aim key selection",
          "Shift head",
          "Targeting FOV",
          "Mark target",
          "Visibility check",
          "Force fire",
          "Target drones",
          "Draw FOV",
          "Static crosshair",
        ],
      },
      {
        title: "Misc",
        items: [
          "Display local coordinates",
          "No recoil",
          "Auto-save config",
          "Streamproof",
          "Internal cheat (no FPS drops)",
          "Full DX12 support",
          "Borderless & windowed support",
        ],
      },
    ],
    generalInfo: [
      "The full version of the lineup, built for players who want everything in one package.",
      "A few misc entries (spread reduction, skip reload animation, unlock all operators) are temporarily disabled.",
      ...universalSetupNotes,
    ],
    requirements: [
      "Game version: UPlay (Ubisoft Connect), Steam, Epic Games",
      "CPU: Intel & AMD",
      "GPU: Nvidia & AMD",
      "OS: Windows 10, Windows 11",
      "Full-screen mode: not supported (windowed/borderless only)",
    ],
    variants: [
      keyVariant("r6s-lethal", "day", "1 Day Key", 1099, { stockLabel: "Backorder" }),
      keyVariant("r6s-lethal", "week", "7 Day Key", 3299, { stockLabel: "Backorder" }),
      keyVariant("r6s-lethal", "month", "30 Day Key", 5299, { stockLabel: "Backorder" }),
      keyVariant("r6s-lethal", "year", "1 Year Key", 34999, { stockLabel: "Backorder" }),
    ],
  },
  {
    ...r6Meta,
    badge: "Undetected",
    slug: "r6s-no-recoil",
    name: "R6S No Recoil Script",
    priceDisplay: `From ${money(300)}`,
    summary:
      "External no-recoil tool for Rainbow Six Siege with per-operator profiles and a live toggle overlay, built to run alongside any aim or ESP tool.",
    features: ["Recoil removal", "Per-operator profiles", "Toggle overlay"],
    featureGroups: [
      {
        title: "Key Features",
        items: [
          "Advanced recoil removal (vertical & horizontal)",
          "Real-time toggle",
          "Operator-based profiles",
          "In-game overlay",
          "External design",
          "Immediate license delivery",
          "Multi-language support (English, German, Russian)",
          "Low resource use",
        ],
      },
      {
        title: "Compatibility",
        items: [
          "Included setup tutorial",
          "Works alongside ESP, radar, and aimbots",
          "Custom hotkeys",
          "Runs silently",
          "Frequent updates",
          "Runs outside game memory space",
          "Adjustable recoil strength and sensitivity",
          "Instant profile switching mid-game",
        ],
      },
    ],
    generalInfo: [
      "A dedicated recoil tool meant to run alongside whatever cheat suite you're already using.",
      "Setup takes a few minutes with the included walkthrough.",
      ...universalSetupNotes,
    ],
    requirements: [
      "Game version: UPlay (Ubisoft Connect), Steam, Epic Games",
      "CPU: Intel & AMD",
      "GPU: Nvidia & AMD",
      "OS: Windows 10, Windows 11",
      "Full-screen mode: not supported (windowed/borderless only)",
    ],
    variants: [
      keyVariant("r6s-no-recoil", "day", "1 Day Key", 300),
      keyVariant("r6s-no-recoil", "week", "7 Day Key", 1000),
      keyVariant("r6s-no-recoil", "month", "30 Day Key", 2000),
      keyVariant("r6s-no-recoil", "three-month", "90 Day Key", 3500),
    ],
  },
  {
    ...fortniteMeta,
    badge: "Undetected",
    slug: "fortnite-dullwave",
    name: "Fortnite - Dullwave",
    priceDisplay: `From ${money(465)}`,
    summary:
      "Undetected Fortnite cheat built for total arena control, pairing a precise aimbot with a strong Fortnite ESP for full tactical awareness.",
    features: ["Aimbot", "Player ESP", "Stream-friendly design"],
    featureGroups: [
      { title: "Aimbot", items: ["Enable aimbot", "Aim key", "FOV control", "Smoothing", "Target selection"] },
      { title: "ESP", items: ["Player ESP", "Distance info", "Box/skeleton visuals"] },
      { title: "Misc", items: ["Config save/load", "Low resource use"] },
    ],
    generalInfo: [
      "Loader password is shared setup-wide; check the instructions page before first launch.",
      ...universalSetupNotes,
    ],
    requirements: [
      "Game version: Epic Games",
      "CPU: Intel & AMD",
      "GPU: Nvidia & AMD",
      "OS: Windows 10 (1903-22H2), Windows 11 (21H2-25H2)",
      "Full-screen mode: not supported (windowed/borderless only)",
      "Flashdrive required: No",
    ],
    variants: [
      keyVariant("fortnite-dullwave", "day", "1 Day Key", 465),
      keyVariant("fortnite-dullwave", "three-day", "3 Day Key", 930),
      keyVariant("fortnite-dullwave", "week", "7 Day Key", 1850),
      keyVariant("fortnite-dullwave", "month", "30 Day Key", 3575),
    ],
  },
  {
    ...fortniteMeta,
    slug: "fortnite-ancient",
    name: "Fortnite Ancient",
    priceDisplay: `From ${money(400)}`,
    summary:
      "Fortnite setup with aim tools, player ESP, and configuration sharing built for Epic Games Store.",
    features: ["Aim support", "Player ESP", "Config sharing"],
    featureGroups: [
      { title: "Aimbot", items: ["Aim key", "Smooth", "FOV", "Target selection"] },
      { title: "Visuals", items: ["Player ESP", "Skeleton", "Distance", "Radar"] },
      { title: "Config", items: ["Save", "Load", "Share"] },
    ],
    generalInfo: [
      "Follow the full preparation and injection walkthrough on the instructions page before first launch.",
      ...universalSetupNotes,
    ],
    requirements: [
      "Game version: Epic Games Store (EGS)",
      "CPU: Intel & AMD",
      "GPU: Nvidia & AMD",
      "OS: Windows 10, Windows 11 (21H2, 22H2, 23H2, 24H2, 25H2)",
      "Full-screen mode: not supported (windowed/borderless only)",
    ],
    variants: [
      keyVariant("fortnite-ancient", "day", "1 Day Key", 400),
      keyVariant("fortnite-ancient", "week", "7 Day Key", 2000),
      keyVariant("fortnite-ancient", "month", "30 Day Key", 4000),
    ],
  },
  {
    ...fortniteMeta,
    slug: "fortnite-arcane",
    name: "Fortnite - Arcane",
    priceDisplay: `From ${money(700)}`,
    summary:
      "Full-featured Fortnite package with a tunable aimbot, distance-aware visuals, and stream-safe visibility checks.",
    features: ["Aimbot suite", "Player ESP", "Anti-detection prep"],
    featureGroups: [
      { title: "Aimbot", items: ["Enable aimbot", "FOV control", "Smoothing", "Target selection"] },
      { title: "Visuals", items: ["Player ESP", "Distance", "Visibility check"] },
      { title: "Misc", items: ["HWID spoofer prompt on first launch", "Config save/load"] },
    ],
    generalInfo: [
      "Requires the Visual C++ Redistributable and a PC restart before first launch; see the instructions page.",
      ...universalSetupNotes,
    ],
    requirements: [
      "Game version: Epic Games Store (EGS)",
      "CPU: Intel & AMD",
      "GPU: Nvidia & AMD",
      "OS: Windows 10, Windows 11 (21H2, 22H2, 23H2, 24H2)",
      "Full-screen mode: not supported (windowed/borderless only)",
      "Stream-Proof: No",
    ],
    variants: [
      keyVariant("fortnite-arcane", "day", "1 Day Key", 700),
      keyVariant("fortnite-arcane", "week", "7 Day Key", 3500),
      keyVariant("fortnite-arcane", "month", "30 Day Key", 6000),
    ],
  },
  {
    ...apexMeta,
    slug: "apex-mason",
    name: "Apex - Mason",
    priceDisplay: `From ${money(400)}`,
    summary:
      "Full Apex Legends cheat with auto-tracking aimbot precision, detailed player and loot ESP, and instant configuration switching.",
    features: ["Aimbot", "Player & loot ESP", "Config switching"],
    featureGroups: [
      { title: "Aimbot", items: ["Auto-tracking precision", "FOV control", "Target selection"] },
      { title: "Visuals", items: ["Player ESP", "Loot ESP"] },
      { title: "Misc", items: ["Instant config switching", "HWID spoofer included"] },
    ],
    generalInfo: [
      "Loader must run from a USB flash drive; see the two-stage injection walkthrough on the instructions page.",
      ...universalSetupNotes,
    ],
    requirements: [
      "Cheat type: Full Apex Legends cheat (aimbot, ESP, loot)",
      "Game: Apex Legends (Steam)",
      "OS: Windows 10 & 11 x64 (up to 25H2)",
      "Anti-cheat: Easy Anti-Cheat",
      "Stream-Proof: Yes (screenshots & recordings)",
      "Flashdrive required: Yes",
    ],
    variants: [
      keyVariant("apex-mason", "day", "1 Day Key", 400),
      keyVariant("apex-mason", "week", "7 Day Key", 2500),
      keyVariant("apex-mason", "month", "30 Day Key", 3280),
    ],
  },
  {
    ...apexMeta,
    slug: "apex-ancient",
    name: "Apex Ancient",
    priceDisplay: `From ${money(300)}`,
    summary:
      "Apex Legends setup with aim tools, player ESP, and configuration sharing.",
    features: ["Aim support", "Player ESP", "Config sharing"],
    featureGroups: [
      { title: "Aimbot", items: ["Aim key", "Smooth", "FOV", "Target selection"] },
      { title: "Visuals", items: ["Player ESP", "Skeleton", "Distance", "Radar"] },
      { title: "Config", items: ["Save", "Load", "Share"] },
    ],
    generalInfo: [
      "Follow the full preparation and injection walkthrough on the instructions page before first launch.",
      ...universalSetupNotes,
    ],
    requirements: [
      "Game version: Steam, EA App, Origin",
      "CPU: Intel & AMD",
      "GPU: Nvidia & AMD",
      "OS: Windows 10, Windows 11 (21H2, 22H2, 23H2, 24H2)",
      "Full-screen mode: not supported (windowed/borderless only)",
    ],
    variants: [
      keyVariant("apex-ancient", "day", "1 Day Key", 300),
      keyVariant("apex-ancient", "week", "7 Day Key", 1500),
      keyVariant("apex-ancient", "month", "30 Day Key", 3000),
    ],
  },
  {
    ...apexMeta,
    badge: "Undetected",
    slug: "apex-dullwave",
    name: "Apex - Dullwave",
    priceDisplay: `From ${money(390)}`,
    summary:
      "Undetected Apex Legends cheat with smooth aim assist and full player ESP, built for reliable ranked and pubs performance.",
    features: ["Aimbot", "Player ESP", "Low resource use"],
    featureGroups: [
      { title: "Aimbot", items: ["Enable aimbot", "Aim key", "FOV control", "Smoothing"] },
      { title: "ESP", items: ["Player ESP", "Distance info"] },
      { title: "Misc", items: ["Config save/load"] },
    ],
    generalInfo: [
      "Loader password is shared setup-wide; check the instructions page before first launch.",
      ...universalSetupNotes,
    ],
    requirements: [
      "Game version: Steam",
      "CPU: Intel & AMD",
      "GPU: Nvidia & AMD",
      "OS: Windows 10 (1903-22H2), Windows 11 (21H2-25H2)",
      "Full-screen mode: not supported (windowed/borderless only)",
    ],
    variants: [
      keyVariant("apex-dullwave", "day", "1 Day Key", 390),
      keyVariant("apex-dullwave", "week", "7 Day Key", 1585),
      keyVariant("apex-dullwave", "month", "30 Day Key", 3000),
    ],
  },
  {
    ...apexMeta,
    slug: "apex-arcane",
    name: "Apex - Arcane",
    priceDisplay: `From ${money(500)}`,
    summary:
      "Full-featured Apex Legends package with a tunable aimbot, distance-aware visuals, and stream-safe visibility checks.",
    features: ["Aimbot suite", "Player ESP", "Anti-detection prep"],
    featureGroups: [
      { title: "Aimbot", items: ["Enable aimbot", "FOV control", "Smoothing", "Target selection"] },
      { title: "Visuals", items: ["Player ESP", "Distance", "Visibility check"] },
      { title: "Misc", items: ["HWID spoofer prompt on first launch", "Config save/load"] },
    ],
    generalInfo: [
      "Requires the Visual C++ Redistributable and a PC restart before first launch; see the instructions page.",
      ...universalSetupNotes,
    ],
    requirements: [
      "Game version: Steam",
      "CPU: Intel & AMD",
      "GPU: Nvidia & AMD",
      "OS: Windows 10, Windows 11",
      "Full-screen mode: not supported (windowed/borderless only)",
      "Stream-Proof: No",
    ],
    variants: [
      keyVariant("apex-arcane", "day", "1 Day Key", 500),
      keyVariant("apex-arcane", "week", "7 Day Key", 2000),
      keyVariant("apex-arcane", "month", "30 Day Key", 4000),
    ],
  },
  {
    ...eftMeta,
    slug: "eft-coffee-chams",
    name: "Coffee Chams - EFT",
    priceDisplay: `From ${money(750)}`,
    summary:
      "Chams-focused EFT tool with loot-through-walls, recoil and stamina modifications, and FOV controls.",
    features: ["Chams visuals", "Loot through walls", "Recoil control"],
    featureGroups: [
      {
        title: "Misc",
        items: ["Infinite stamina", "No sway", "No recoil", "Modify recoil", "No visor", "Recoil percent selector", "No pain effects", "No sprint inertia"],
      },
      {
        title: "Visuals",
        items: ["Enemy chams", "Local player chams", "Loot item chams", "Corpse chams", "Visibility check", "Zoom helper", "Normal FOV selector", "Aiming FOV selector"],
      },
    ],
    generalInfo: [
      "Chams-focused with loot through walls and recoil customization.",
      "Built for visual clarity over feature overload.",
      ...universalSetupNotes,
    ],
    requirements: ["Windows 10 / 11", "Escape From Tarkov installed"],
    variants: [
      unavailableVariant("eft-coffee-chams", "week", "7 Day Key", 750),
      unavailableVariant("eft-coffee-chams", "month", "30 Day Key", 1500),
    ],
  },
  {
    ...eftMeta,
    slug: "eft-coffee-lite",
    name: "Coffee Lite - EFT",
    priceDisplay: `From ${money(400)}`,
    summary:
      "Full-featured EFT suite with silent aimbot, deep exploits, loot and player ESP, and customizable loot filtering.",
    features: ["Silent aimbot", "Loot ESP", "Exploit tools"],
    featureGroups: [
      {
        title: "Aimbot",
        items: ["Silent aimbot", "Aimkey selection", "Show aimline", "Crosshair", "Aim FOV", "Aimbone selection", "Modify recoil", "Grenade aim"],
      },
      {
        title: "Exploits",
        items: ["Debug camera", "Anti AFK", "Session ID spoof", "Long jump", "Keep gun steady", "Instant plant"],
      },
      {
        title: "Loot ESP",
        items: ["Top loot list", "Active quest items", "Price per slot", "Loot chams", "Loot list size", "Default distance cap"],
      },
      {
        title: "Player ESP",
        items: ["Box settings", "Skeleton", "Draw distance", "Pink chams", "Look direction ray"],
      },
      {
        title: "Loot Filtering",
        items: ["Add items by name", "Ignore distance cap", "Ignore min price", "Override name", "Override color"],
      },
    ],
    generalInfo: [
      "Full EFT suite with silent aim, loot through walls, radar, and thermal.",
      "Deep loot filtering lets you customize exactly what shows up.",
      ...universalSetupNotes,
    ],
    requirements: ["Windows 10 / 11", "Escape From Tarkov installed"],
    variants: [
      unavailableVariant("eft-coffee-lite", "day", "1 Day Key", 400),
      unavailableVariant("eft-coffee-lite", "week", "7 Day Key", 2250),
      unavailableVariant("eft-coffee-lite", "month", "30 Day Key", 4500),
    ],
  },
  {
    ...eftMeta,
    slug: "ancient-eft",
    name: "Ancient - EFT External",
    priceDisplay: `From ${money(300)}`,
    summary:
      "External EFT setup with aim tools, player ESP, and loot awareness.",
    features: ["Aim support", "Player ESP", "Loot visuals"],
    featureGroups: [
      { title: "Aimbot", items: ["Smooth", "FOV", "Bone selection"] },
      { title: "Visuals", items: ["Players", "Loot", "Distance", "Skeleton"] },
      { title: "Misc", items: ["Config support", "Streamproof"] },
    ],
    generalInfo: [
      "Currently being updated. Check back soon for availability.",
      ...universalSetupNotes,
    ],
    requirements: ["Windows 10 / 11", "Escape From Tarkov installed"],
    variants: [
      unavailableVariant("ancient-eft", "day", "1 Day Key", 300),
      unavailableVariant("ancient-eft", "week", "7 Day Key", 1250),
      unavailableVariant("ancient-eft", "month", "30 Day Key", 2500),
    ],
  },
  {
    ...spooferMeta,
    slug: "xim-spoofer",
    name: "Xim Spoofer",
    priceDisplay: `From ${money(539)}`,
    summary:
      "Hardware reset support for users who need a clean device-identity setup path across supported games.",
    features: ["Hardware reset support", "Multi-game support", "Guided setup"],
    featureGroups: [
      { title: "Coverage", items: ["Device reset flow", "Temporary and longer options", "Desk-assisted setup"] },
      { title: "Setup", items: ["Check Windows build", "Confirm motherboard mode", "Follow support notes"] },
      { title: "Aftercare", items: ["Restart guidance", "Status checks", "Ticket follow-up"] },
    ],
    generalInfo: [
      "This category can require careful system checks before use.",
      "Open a ticket before setup if you are unsure about your Windows or motherboard configuration.",
      ...universalSetupNotes,
    ],
    requirements: ["Windows 10 / 11", "UEFI motherboard preferred", "Administrator access"],
    variants: [
      keyVariant("xim-spoofer", "day", "1 Day Key", 539),
      keyVariant("xim-spoofer", "three-day", "3 Days Key", 878),
      keyVariant("xim-spoofer", "week", "1 Week Key", 1858),
      keyVariant("xim-spoofer", "month", "1 Month Key", 3815),
      keyVariant("xim-spoofer", "lifetime", "Lifetime Key", 12380),
    ],
  },
  {
    ...accountsMeta,
    available: false,
    badge: "Coming Soon",
    slug: "linked-nfa",
    name: "Linked NFA",
    priceDisplay: `From ${money(647)}`,
    summary:
      "Not full-access ranked-ready account option for users who want a quick account handoff.",
    features: ["NFA account", "Ranked-ready option", "Ticket delivery"],
    featureGroups: [
      { title: "Account", items: ["Linked account details", "NFA access", "Support handoff"] },
      { title: "Delivery", items: ["Ticket confirmation", "Account notes", "Follow-up support"] },
    ],
    generalInfo: [
      "Account products are delivered through support after review.",
      "Change any available security details immediately after receiving access.",
      ...universalSetupNotes,
    ],
    requirements: ["Member account", "Valid contact method", "Support ticket required"],
    variants: [
      unavailableVariant("linked-nfa", "account", "1 NFA Account", 647),
    ],
  },
  {
    ...accountsMeta,
    available: false,
    badge: "Coming Soon",
    slug: "stacked-pc-account",
    name: "Stacked PC Account",
    priceDisplay: `From ${money(2159)}`,
    summary:
      "Stacked linked Rainbow Six Siege PC account with ranked-ready inventory and account notes.",
    features: ["Stacked PC account", "Loaded inventory", "Ranked-ready"],
    featureGroups: [
      { title: "Account", items: ["Linked PC account", "Loaded inventory", "Ranked-ready status"] },
      { title: "Delivery", items: ["Ticket confirmation", "Account notes", "Follow-up support"] },
    ],
    generalInfo: [
      "Account products are delivered manually so support can verify the exact handoff details.",
      "Review all account notes before changing details or opening a follow-up ticket.",
      ...universalSetupNotes,
    ],
    requirements: ["Member account", "Valid contact method", "Support ticket required"],
    variants: [
      unavailableVariant("stacked-pc-account", "account", "1 NFA Stacked Linked Account", 2159),
    ],
  },
  {
    ...rustMeta,
    badge: "Undetected",
    slug: "rust-dullwave",
    name: "Rust - Dullwave",
    priceDisplay: `From ${money(730)}`,
    summary:
      "Premium undetected Rust cheat built for tactical domination, pairing precision aim tools with a strong Rust ESP for total raid awareness.",
    features: ["Aimbot", "Player ESP", "Loot ESP"],
    featureGroups: [
      { title: "Aimbot", items: ["Enable aimbot", "Aim key", "FOV control", "Smoothing"] },
      { title: "ESP", items: ["Player ESP", "Loot filters", "Distance info"] },
      { title: "Misc", items: ["Config save/load", "Low resource use"] },
    ],
    generalInfo: [
      "Loader password is shared setup-wide; check the instructions page before first launch.",
      ...universalSetupNotes,
    ],
    requirements: [
      "Game version: Steam",
      "CPU: Intel & AMD",
      "GPU: Nvidia & AMD",
      "OS: Windows 10, Windows 11 (21H2, 22H2, 23H2, 24H2, 25H2)",
      "Full-screen mode: not supported (windowed/borderless only)",
      "Flashdrive required: No",
    ],
    variants: [
      keyVariant("rust-dullwave", "day", "1 Day Key", 730),
      keyVariant("rust-dullwave", "week", "7 Day Key", 3310),
      keyVariant("rust-dullwave", "month", "30 Day Key", 4640),
    ],
  },
  {
    ...rustMeta,
    slug: "rust-mason-lite",
    name: "Rust Mason Lite",
    priceDisplay: `From ${money(270)}`,
    summary:
      "Lite Rust ESP with automatic player boxes and zero configuration. Launch it, join the game, and get instant visual awareness.",
    features: ["Auto player ESP", "Zero setup", "USB loader flow"],
    featureGroups: [
      { title: "ESP", items: ["Automatic player box ESP", "No menus or config required"] },
    ],
    generalInfo: [
      "USB-only loader; full injection steps are on the instructions page.",
      ...universalSetupNotes,
    ],
    requirements: [
      "Cheat type: Lite Rust ESP (auto player box)",
      "Game: Rust (Steam)",
      "OS: Windows 10 x64 (2004, 20H2, 21H1, 21H2, 22H2), Windows 11 (21H2, 22H2, 23H2 up to build 3880)",
      "Anti-cheat: Easy Anti-Cheat",
      "Stream-Proof: No",
      "Flashdrive required: Yes",
    ],
    variants: [
      keyVariant("rust-mason-lite", "day", "1 Day Key", 270),
      keyVariant("rust-mason-lite", "week", "7 Day Key", 1110),
      keyVariant("rust-mason-lite", "month", "30 Day Key", 2085),
    ],
  },
  {
    ...rustMeta,
    slug: "rust-mason-full",
    name: "Rust Mason Full",
    priceDisplay: `From ${money(555)}`,
    summary:
      "Full Rust cheat with advanced aimbot precision, deep ESP visuals, and full configuration control for total map awareness.",
    features: ["Aimbot", "Full ESP", "Config control"],
    featureGroups: [
      { title: "Aimbot", items: ["Advanced aim precision", "FOV control", "Target selection"] },
      { title: "Visuals", items: ["Player ESP", "Loot ESP", "Resource ESP"] },
      { title: "Misc", items: ["Full config save/load", "HWID spoofer included"] },
    ],
    generalInfo: [
      "Loader must run from a USB flash drive; see the two-stage injection walkthrough on the instructions page.",
      ...universalSetupNotes,
    ],
    requirements: [
      "Game version: Rust (Steam)",
      "OS: Windows 10 & 11 x64 (up to 25H2)",
      "Anti-cheat: Easy Anti-Cheat",
      "Stream-Proof: Yes (screenshots & recordings)",
      "Flashdrive required: Yes",
    ],
    variants: [
      keyVariant("rust-mason-full", "day", "1 Day Key", 555),
      keyVariant("rust-mason-full", "week", "7 Day Key", 2225),
      keyVariant("rust-mason-full", "month", "30 Day Key", 5000),
    ],
  },
  {
    ...rustMeta,
    slug: "rust-mrpro",
    name: "Rust - MrPro",
    priceDisplay: `From ${money(640)}`,
    summary:
      "Rust cheat built for Intel systems, covering aim and visual tools in one setup. Intel processors only.",
    features: ["Aimbot", "Player ESP", "Intel-only build"],
    featureGroups: [
      { title: "Aimbot", items: ["Aim controls", "FOV settings"] },
      { title: "Visuals", items: ["Player ESP", "Distance info"] },
    ],
    generalInfo: [
      "Attention: Intel processors only. Open a Discord ticket for setup help.",
      ...universalSetupNotes,
    ],
    requirements: [
      "Game version: Steam",
      "CPU: Intel only",
      "GPU: Nvidia & AMD",
      "OS: Windows 10 (21H2, 22H2), Windows 11 (21H2, 22H2, 23H2, 24H2)",
      "Full-screen mode: not supported (windowed/borderless only)",
    ],
    variants: [
      keyVariant("rust-mrpro", "day", "1 Day Key", 640),
      keyVariant("rust-mrpro", "week", "7 Day Key", 3220),
      keyVariant("rust-mrpro", "month", "30 Day Key", 6440),
    ],
  },
  {
    ...spooferMeta,
    slug: "spoofer-verse-perm",
    name: "Verse - Perm Spoofer",
    priceDisplay: `From ${money(2159)}`,
    summary:
      "Permanent spoofing option for supported games and motherboard brands, with setup checks before purchase.",
    features: ["Permanent spoofing", "Motherboard coverage", "Setup checks"],
    featureGroups: [
      { title: "Supported games", items: ["League of Legends", "Fortnite", "Apex Legends", "Rust"] },
      { title: "Motherboards", items: ["ASUS", "Gigabyte", "MSI", "ASRock", "HP"] },
      { title: "Notes", items: ["Open a ticket for Lenovo, Acer, or Dell", "TPM bypass not included"] },
    ],
    generalInfo: ["Open a support ticket first if your motherboard brand is not listed."],
    requirements: ["Windows 10 / 11", "Supported motherboard"],
    variants: [
      keyVariant("spoofer-verse-perm", "one-time", "One Time Key", 2159),
      keyVariant("spoofer-verse-perm", "lifetime", "Lifetime Key", 5399),
    ],
  },
];

export const products = productCatalog.map((product) => ({
  ...product,
  generalInfo: [product.generalInfo?.[0] || defaultGeneralInfo],
  instructionHref: `/instructions/#${product.slug}`,
}));
