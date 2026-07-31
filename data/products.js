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
    badge: "Undetected",
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
    badge: "Undetected",
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
    badge: "Undetected",
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
    badge: "Undetected",
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
    badge: "Undetected",
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
    badge: "Undetected",
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
    badge: "Undetected",
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
      keyVariant("r6s-lethal", "day", "1 Day Key", 1099),
      keyVariant("r6s-lethal", "week", "7 Day Key", 3299),
      keyVariant("r6s-lethal", "month", "30 Day Key", 5299),
      keyVariant("r6s-lethal", "year", "1 Year Key", 34999),
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
    ...apexMeta,
    badge: "Undetected",
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
    badge: "Undetected",
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
    badge: "Undetected",
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
    ...categoryMeta("Counter-Strike 2"),
    badge: "Undetected",
    slug: "cs2-predator",
    name: "CS2 - Predator",
    priceDisplay: `From ${money(450)}`,
    summary:
      "Subscription-managed Counter-Strike 2 cheat with aim and visual tools handled through a dedicated panel, built for consistent long-term use.",
    features: ["Aimbot", "Player ESP", "Panel-managed subscription"],
    featureGroups: [
      { title: "Aimbot", items: ["Enable aimbot", "Aim key", "FOV control", "Smoothing"] },
      { title: "Visuals", items: ["Player ESP", "Distance info", "Skeleton"] },
      { title: "Misc", items: ["Panel-based license management", "Config save/load"] },
    ],
    generalInfo: [
      "Manage your subscription and download the loader from the Predator panel; check the instructions page before first launch.",
      ...universalSetupNotes,
    ],
    requirements: [
      "Game version: Steam",
      "CPU: Intel & AMD",
      "GPU: Nvidia & AMD",
      "OS: Windows 10, Windows 11 (21H2, 22H2, 23H2, 24H2)",
      "Full-screen mode: not supported (windowed/borderless only)",
    ],
    variants: [
      keyVariant("cs2-predator", "day", "1 Day Key", 450),
      keyVariant("cs2-predator", "week", "7 Day Key", 2250),
      keyVariant("cs2-predator", "month", "30 Day Key", 4500),
    ],
  },
  {
    ...categoryMeta("Counter-Strike 2"),
    badge: "Undetected",
    slug: "cs2-arcane",
    name: "CS2 - Arcane Cheat",
    priceDisplay: `From ${money(500)}`,
    summary:
      "Full-featured Counter-Strike 2 package with a tunable aimbot, distance-aware visuals, and stream-safe visibility checks.",
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
      keyVariant("cs2-arcane", "day", "1 Day Key", 500),
      keyVariant("cs2-arcane", "week", "7 Day Key", 2500),
      keyVariant("cs2-arcane", "month", "30 Day Key", 5000),
    ],
  },
  {
    ...categoryMeta("Counter-Strike 2"),
    badge: "Undetected",
    slug: "cs2-strikeforce",
    name: "CS2 - Strikeforce",
    priceDisplay: `From ${money(350)}`,
    summary:
      "Lightweight Counter-Strike 2 aim and visibility combo built to stay low-impact on performance while covering the essentials.",
    features: ["Aimbot", "Player ESP", "Low resource use"],
    featureGroups: [
      { title: "Aimbot", items: ["Enable aimbot", "Aim key", "FOV control"] },
      { title: "Visuals", items: ["Player ESP", "Distance info"] },
    ],
    generalInfo: [
      "Loader password is shared setup-wide; check the instructions page before first launch.",
      ...universalSetupNotes,
    ],
    requirements: [
      "Game version: Steam",
      "CPU: Intel & AMD",
      "GPU: Nvidia & AMD",
      "OS: Windows 10, Windows 11",
      "Full-screen mode: not supported (windowed/borderless only)",
      "Flashdrive required: Yes",
    ],
    variants: [
      keyVariant("cs2-strikeforce", "day", "1 Day Key", 350),
      keyVariant("cs2-strikeforce", "week", "7 Day Key", 1750),
      keyVariant("cs2-strikeforce", "month", "30 Day Key", 3500),
    ],
  },
  {
    ...categoryMeta("Counter-Strike 2"),
    badge: "Undetected",
    slug: "cs2-skinchanger",
    name: "CS2 - Skinchanger",
    priceDisplay: `From ${money(200)}`,
    summary:
      "Unlock any weapon, knife, or glove skin in Counter-Strike 2 with no FPS impact and minimal detection risk.",
    features: ["Weapon skin changer", "Knife changer", "Glove changer"],
    featureGroups: [
      { title: "Skins", items: ["Weapon skins", "Knife skins", "Glove skins", "No FPS drop"] },
    ],
    generalInfo: [
      "Loader password is shared setup-wide; check the instructions page before first launch.",
      ...universalSetupNotes,
    ],
    requirements: [
      "Game version: Steam",
      "CPU: Intel & AMD",
      "GPU: Nvidia & AMD",
      "OS: Windows 10, Windows 11",
      "Full-screen mode: not supported (windowed/borderless only)",
    ],
    variants: [
      keyVariant("cs2-skinchanger", "day", "1 Day Key", 200),
      keyVariant("cs2-skinchanger", "week", "7 Day Key", 500),
      keyVariant("cs2-skinchanger", "month", "30 Day Key", 900),
    ],
  },
  {
    ...categoryMeta("PUBG"),
    badge: "Undetected",
    slug: "pubg-arcane",
    name: "PUBG - Arcane Cheats",
    priceDisplay: `From ${money(500)}`,
    summary:
      "Full-featured PUBG package with a tunable aimbot, distance-aware visuals, and stream-safe visibility checks.",
    features: ["Aimbot suite", "Player ESP", "Anti-detection prep"],
    featureGroups: [
      { title: "Aimbot", items: ["Enable aimbot", "FOV control", "Smoothing", "Target selection"] },
      { title: "Visuals", items: ["Player ESP", "Distance", "Visibility check"] },
      { title: "Misc", items: ["HWID spoofer prompt on first launch", "Config save/load"] },
    ],
    generalInfo: [
      "This product is not compatible with laptops — a desktop PC is required.",
      "Requires the Visual C++ Redistributable and a PC restart before first launch; see the instructions page.",
      ...universalSetupNotes,
    ],
    requirements: [
      "Game version: Steam, Kakao",
      "CPU: Intel & AMD",
      "GPU: Nvidia & AMD",
      "OS: Windows 10, Windows 11",
      "Full-screen mode: not supported (windowed/borderless only)",
      "Stream-Proof: Yes",
      "Laptop compatible: No (desktop PC required)",
    ],
    variants: [
      keyVariant("pubg-arcane", "day", "1 Day Key", 500),
      keyVariant("pubg-arcane", "week", "7 Day Key", 2500),
      keyVariant("pubg-arcane", "month", "30 Day Key", 5000),
    ],
  },
  {
    ...categoryMeta("PUBG"),
    badge: "Undetected",
    slug: "pubg-shadow",
    name: "PUBG - Shadow",
    priceDisplay: `From ${money(400)}`,
    summary:
      "Regularly updated PUBG visual and aim combo built to stay lightweight and quick to set up.",
    features: ["Aimbot", "Player ESP", "Lightweight"],
    featureGroups: [
      { title: "Aimbot", items: ["Enable aimbot", "Aim key", "Smoothing"] },
      { title: "Visuals", items: ["Player ESP", "Distance info"] },
    ],
    generalInfo: [
      "Disable antivirus and Windows Defender before running the loader.",
      ...universalSetupNotes,
    ],
    requirements: [
      "Game version: Steam",
      "CPU: Intel & AMD",
      "GPU: Nvidia & AMD",
      "OS: Windows 10 (1903, 1909, 2004, 20H2, 21H1, 21H2, 22H2), Windows 11 (21H2, 22H2, 23H2)",
    ],
    variants: [
      keyVariant("pubg-shadow", "day", "1 Day Key", 400),
      keyVariant("pubg-shadow", "week", "7 Day Key", 1800),
      keyVariant("pubg-shadow", "month", "30 Day Key", 3400),
    ],
  },
  {
    ...categoryMeta("Delta Force"),
    badge: "Undetected",
    slug: "delta-force-dullwave",
    name: "Delta Force - Dullwave",
    priceDisplay: `From ${money(465)}`,
    summary:
      "Undetected Delta Force cheat pairing a precise aimbot with a strong player ESP for full tactical awareness.",
    features: ["Aimbot", "Player ESP", "Stream-friendly design"],
    featureGroups: [
      { title: "Aimbot", items: ["Enable aimbot", "Aim key", "FOV control", "Smoothing"] },
      { title: "ESP", items: ["Player ESP", "Distance info", "Box/skeleton visuals"] },
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
      "OS: Windows 10 (1903, 1909, 2004, 20H1, 20H2, 21H1, 21H2, 22H2), Windows 11 (21H2, 22H2, 23H2, 24H2, 25H2)",
      "Full-screen mode: not supported (windowed/borderless only)",
      "Flashdrive required: No",
    ],
    variants: [
      keyVariant("delta-force-dullwave", "day", "1 Day Key", 465),
      keyVariant("delta-force-dullwave", "week", "7 Day Key", 1850),
      keyVariant("delta-force-dullwave", "month", "30 Day Key", 3575),
    ],
  },
  {
    ...categoryMeta("Delta Force"),
    badge: "Undetected",
    slug: "delta-force-ancient",
    name: "Delta Force - Ancient",
    priceDisplay: `From ${money(400)}`,
    summary:
      "Delta Force setup with aim tools, player ESP, and configuration sharing.",
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
      "Game version: Steam, Garena, Epic Games, Delta Force Launcher, Global",
      "CPU: Intel & AMD",
      "GPU: Nvidia & AMD",
      "OS: Windows 10, Windows 11 (21H2, 22H2, 23H2, 24H2)",
      "Full-screen mode: not supported (windowed/borderless only)",
    ],
    variants: [
      keyVariant("delta-force-ancient", "day", "1 Day Key", 400),
      keyVariant("delta-force-ancient", "week", "7 Day Key", 2000),
      keyVariant("delta-force-ancient", "month", "30 Day Key", 4000),
    ],
  },
  {
    ...categoryMeta("Delta Force"),
    badge: "Undetected",
    slug: "delta-force-luna-chams",
    name: "Delta Force - Luna Chams",
    priceDisplay: `From ${money(2000)}`,
    summary:
      "High-end Delta Force chams package built exclusively for Intel systems, giving instant player visibility through any surface.",
    features: ["Player chams", "Intel-only build", "Instant visibility"],
    featureGroups: [
      { title: "Visuals", items: ["Player chams through walls", "Team check"] },
    ],
    generalInfo: [
      "Attention: Intel processors only — this build will not run on AMD systems. Open a Discord ticket for setup help.",
      ...universalSetupNotes,
    ],
    requirements: [
      "Game version: Steam, WeGame",
      "CPU: Intel only",
      "GPU: Nvidia & AMD",
      "OS: Windows 10, Windows 11",
      "Full-screen mode: not supported (windowed/borderless only)",
    ],
    variants: [
      keyVariant("delta-force-luna-chams", "day", "1 Day Key", 2000),
      keyVariant("delta-force-luna-chams", "week", "7 Day Key", 10000),
      keyVariant("delta-force-luna-chams", "month", "30 Day Key", 20000),
    ],
  },
  {
    ...categoryMeta("Marvel Rivals"),
    badge: "Undetected",
    slug: "marvel-rivals-dullwave",
    name: "Marvel Rivals - Dullwave",
    priceDisplay: `From ${money(465)}`,
    summary:
      "Undetected Marvel Rivals cheat pairing a precise aimbot with a strong player ESP for full tactical awareness.",
    features: ["Aimbot", "Player ESP", "Stream-friendly design"],
    featureGroups: [
      { title: "Aimbot", items: ["Enable aimbot", "Aim key", "FOV control", "Smoothing"] },
      { title: "ESP", items: ["Player ESP", "Distance info", "Box/skeleton visuals"] },
      { title: "Misc", items: ["Config save/load", "Low resource use"] },
    ],
    generalInfo: [
      "Loader password is shared setup-wide; check the instructions page before first launch.",
      ...universalSetupNotes,
    ],
    requirements: [
      "Game version: Steam, Epic Games (EGS)",
      "CPU: Intel & AMD",
      "GPU: Nvidia & AMD",
      "OS: Windows 10 (2004, 20H1, 20H2, 21H1, 21H2, 22H2), Windows 11 (21H2, 22H2, 23H2)",
      "Full-screen mode: not supported (windowed/borderless only)",
      "Flashdrive required: No",
    ],
    variants: [
      keyVariant("marvel-rivals-dullwave", "day", "1 Day Key", 465),
      keyVariant("marvel-rivals-dullwave", "week", "7 Day Key", 1850),
      keyVariant("marvel-rivals-dullwave", "month", "30 Day Key", 3575),
    ],
  },
  {
    ...categoryMeta("Marvel Rivals"),
    badge: "Undetected",
    slug: "marvel-rivals-predator",
    name: "Marvel Rivals - Predator",
    priceDisplay: `From ${money(450)}`,
    summary:
      "Subscription-managed Marvel Rivals cheat with aim and visual tools handled through a dedicated panel.",
    features: ["Aimbot", "Player ESP", "Panel-managed subscription"],
    featureGroups: [
      { title: "Aimbot", items: ["Enable aimbot", "Aim key", "FOV control", "Smoothing"] },
      { title: "Visuals", items: ["Player ESP", "Distance info", "Skeleton"] },
      { title: "Misc", items: ["Panel-based license management", "Config save/load"] },
    ],
    generalInfo: [
      "Manage your subscription and download the loader from the Predator panel; check the instructions page before first launch.",
      ...universalSetupNotes,
    ],
    requirements: [
      "Game version: Steam",
      "CPU: Intel & AMD",
      "GPU: Nvidia & AMD",
      "OS: Windows 10, Windows 11 (21H2, 22H2, 23H2, 24H2)",
      "Full-screen mode: not supported (windowed/borderless only)",
    ],
    variants: [
      keyVariant("marvel-rivals-predator", "day", "1 Day Key", 450),
      keyVariant("marvel-rivals-predator", "week", "7 Day Key", 2250),
      keyVariant("marvel-rivals-predator", "month", "30 Day Key", 4500),
    ],
  },
  {
    ...categoryMeta("Marvel Rivals"),
    badge: "Undetected",
    slug: "marvel-rivals-smg",
    name: "Marvel Rivals - SMG Cheat",
    priceDisplay: `From ${money(400)}`,
    summary:
      "Marvel Rivals aim and visibility combo with straightforward setup and reliable performance.",
    features: ["Aimbot", "Player ESP"],
    featureGroups: [
      { title: "Aimbot", items: ["Enable aimbot", "Aim key", "Smoothing"] },
      { title: "Visuals", items: ["Player ESP", "Distance info"] },
    ],
    generalInfo: [
      "Loader password is shared setup-wide; check the instructions page before first launch.",
      ...universalSetupNotes,
    ],
    requirements: [
      "Game version: Steam",
      "CPU: Intel & AMD",
      "GPU: Nvidia & AMD",
      "OS: Windows 10, Windows 11",
      "Full-screen mode: not supported (windowed/borderless only)",
    ],
    variants: [
      keyVariant("marvel-rivals-smg", "day", "1 Day Key", 400),
      keyVariant("marvel-rivals-smg", "week", "7 Day Key", 2000),
      keyVariant("marvel-rivals-smg", "month", "30 Day Key", 4000),
    ],
  },
  {
    ...categoryMeta("Marvel Rivals"),
    badge: "Undetected",
    slug: "marvel-rivals-shadow",
    name: "Marvel Rivals - Shadow",
    priceDisplay: `From ${money(400)}`,
    summary:
      "Advanced Marvel Rivals targeting and vision toolkit with discreet, safety-focused operation for professional-grade gameplay.",
    features: ["Advanced targeting", "Superior vision", "Discreet operation"],
    featureGroups: [
      { title: "Aimbot", items: ["Advanced targeting", "Smoothing", "FOV control"] },
      { title: "Visuals", items: ["Superior vision", "Player ESP"] },
    ],
    generalInfo: [
      "Loader password is shared setup-wide; check the instructions page before first launch.",
      ...universalSetupNotes,
    ],
    requirements: [
      "Game version: Steam, POE Launcher",
      "CPU: Intel & AMD",
      "GPU: Nvidia & AMD",
      "OS: Windows 10, Windows 11 (21H2, 22H2, 23H2, 24H2, 25H2)",
      "Full-screen mode: not supported (windowed/borderless only)",
    ],
    variants: [
      keyVariant("marvel-rivals-shadow", "day", "1 Day Key", 400),
      keyVariant("marvel-rivals-shadow", "week", "7 Day Key", 1900),
      keyVariant("marvel-rivals-shadow", "month", "30 Day Key", 3800),
    ],
  },
  {
    ...categoryMeta("Overwatch 2"),
    badge: "Undetected",
    slug: "overwatch2-mason",
    name: "Overwatch 2 - Mason",
    priceDisplay: `From ${money(450)}`,
    summary:
      "Full Overwatch 2 cheat with auto-tracking aimbot precision, detailed player ESP, and instant configuration switching.",
    features: ["Aimbot", "Player ESP", "Config switching"],
    featureGroups: [
      { title: "Aimbot", items: ["Auto-tracking precision", "FOV control", "Target selection"] },
      { title: "Visuals", items: ["Player ESP"] },
      { title: "Misc", items: ["Instant config switching", "HWID spoofer included"] },
    ],
    generalInfo: [
      "Loader must run from a USB flash drive; see the two-stage injection walkthrough on the instructions page.",
      ...universalSetupNotes,
    ],
    requirements: [
      "Game version: Steam, Epic Games (EGS)",
      "CPU: Intel & AMD",
      "GPU: Nvidia & AMD",
      "OS: Windows 10 (2004, 20H2, 21H1, 21H2, 22H2), Windows 11 (21H2, 22H2, 23H2)",
      "System architecture: 64-bit",
      "Full-screen mode: not supported (windowed/borderless only)",
      "Flashdrive required: Yes",
    ],
    variants: [
      keyVariant("overwatch2-mason", "day", "1 Day Key", 450),
      keyVariant("overwatch2-mason", "week", "7 Day Key", 2250),
      keyVariant("overwatch2-mason", "month", "30 Day Key", 4500),
    ],
  },
  {
    ...categoryMeta("Battlefield"),
    badge: "Undetected",
    slug: "battlefield-fecurity",
    name: "Battlefield - Fecurity",
    priceDisplay: `From ${money(450)}`,
    summary:
      "Battlefield aim and visibility combo covering the essentials with straightforward setup.",
    features: ["Aimbot", "Player ESP"],
    featureGroups: [
      { title: "Aimbot", items: ["Enable aimbot", "Aim key", "Smoothing"] },
      { title: "Visuals", items: ["Player ESP", "Distance info"] },
    ],
    generalInfo: [
      "If the loader link isn't working, contact support in Discord for a mirror.",
      ...universalSetupNotes,
    ],
    requirements: [
      "Game version: Steam, EA App, Origin, BF 2042, BF 5, BF 1",
      "CPU: Intel & AMD",
      "GPU: Nvidia & AMD",
      "OS: Windows 10, Windows 11 (21H2, 22H2, 23H2, 24H2)",
      "Full-screen mode: not supported (windowed/borderless only)",
    ],
    variants: [
      keyVariant("battlefield-fecurity", "day", "1 Day Key", 450),
      keyVariant("battlefield-fecurity", "week", "7 Day Key", 1800),
      keyVariant("battlefield-fecurity", "month", "30 Day Key", 3400),
    ],
  },
  {
    ...categoryMeta("Battlefield"),
    badge: "Undetected",
    slug: "battlefield6-ancient",
    name: "Battlefield 6 - Ancient",
    priceDisplay: `From ${money(400)}`,
    summary:
      "Fully adjustable Battlefield 6 aimbot with pixel-precise control paired with a complete ESP suite and StreamProof protection for full battlefield awareness.",
    features: ["Adjustable aimbot", "Full ESP/wallhack", "StreamProof"],
    featureGroups: [
      { title: "Aimbot", items: ["FOV control", "Smoothing", "Target bones", "Prediction", "Hotkey support"] },
      { title: "ESP", items: ["Player positions", "Names", "Health", "Distance", "Vehicles"] },
      { title: "Misc", items: ["StreamProof", "Customizable crosshair", "FPS overlay", "Instant config loading"] },
    ],
    generalInfo: [
      "Loader password is shared setup-wide; check the instructions page before first launch.",
      ...universalSetupNotes,
    ],
    requirements: [
      "Game version: Steam, EA App, Epic Games, Microsoft Store (Xbox)",
      "CPU: Intel & AMD",
      "GPU: Nvidia & AMD",
      "OS: Windows 10, Windows 11 (21H2, 22H2, 23H2, 24H2)",
      "Full-screen mode: not supported (windowed/borderless only)",
    ],
    variants: [
      keyVariant("battlefield6-ancient", "day", "1 Day Key", 400),
      keyVariant("battlefield6-ancient", "week", "7 Day Key", 2000),
      keyVariant("battlefield6-ancient", "month", "30 Day Key", 4000),
    ],
  },
  {
    ...categoryMeta("Call of Duty"),
    badge: "Undetected",
    slug: "cod-lunar",
    name: "CoD - Lunar",
    priceDisplay: `From ${money(400)}`,
    summary:
      "Call of Duty aim and visibility combo with straightforward setup and reliable performance.",
    features: ["Aimbot", "Player ESP"],
    featureGroups: [
      { title: "Aimbot", items: ["Enable aimbot", "Aim key", "Smoothing"] },
      { title: "Visuals", items: ["Player ESP", "Distance info"] },
    ],
    generalInfo: [
      "Loader link is sent via Discord after purchase; open a ticket if you don't receive it within a few minutes.",
      ...universalSetupNotes,
    ],
    requirements: [
      "Game version: Battle.net, Steam",
      "CPU: Intel & AMD",
      "GPU: Nvidia & AMD",
      "OS: Windows 10, Windows 11",
    ],
    variants: [
      keyVariant("cod-lunar", "day", "1 Day Key", 400),
      keyVariant("cod-lunar", "week", "7 Day Key", 2000),
      keyVariant("cod-lunar", "month", "30 Day Key", 4000),
    ],
  },
  {
    ...categoryMeta("Call of Duty"),
    badge: "Undetected",
    slug: "cod-dullwave",
    name: "CoD - Dullwave",
    priceDisplay: `From ${money(465)}`,
    summary:
      "Undetected Call of Duty cheat pairing a precise aimbot with a strong player ESP for full tactical awareness.",
    features: ["Aimbot", "Player ESP", "Stream-friendly design"],
    featureGroups: [
      { title: "Aimbot", items: ["Enable aimbot", "Aim key", "FOV control", "Smoothing"] },
      { title: "ESP", items: ["Player ESP", "Distance info", "Box/skeleton visuals"] },
      { title: "Misc", items: ["Config save/load", "Low resource use"] },
    ],
    generalInfo: [
      "Loader password is shared setup-wide; check the instructions page before first launch.",
      ...universalSetupNotes,
    ],
    requirements: [
      "Game version: Battle.net, Steam",
      "CPU: Intel & AMD",
      "GPU: Nvidia & AMD",
      "OS: Windows 10 (2004, 20H1, 20H2, 21H1, 21H2, 22H2), Windows 11 (21H2, 22H2, 23H2, 24H2, 25H2)",
      "Full-screen mode: not supported (windowed/borderless only)",
      "Flashdrive required: No",
    ],
    variants: [
      keyVariant("cod-dullwave", "day", "1 Day Key", 465),
      keyVariant("cod-dullwave", "week", "7 Day Key", 1850),
      keyVariant("cod-dullwave", "month", "30 Day Key", 3575),
    ],
  },
  {
    ...categoryMeta("FragPunk"),
    badge: "Undetected",
    slug: "fragpunk-dullwave",
    name: "FragPunk - Dullwave",
    priceDisplay: `From ${money(400)}`,
    summary:
      "Undetected FragPunk cheat pairing a precise aimbot with a strong player ESP for full tactical awareness.",
    features: ["Aimbot", "Player ESP", "Stream-friendly design"],
    featureGroups: [
      { title: "Aimbot", items: ["Enable aimbot", "Aim key", "FOV control", "Smoothing"] },
      { title: "ESP", items: ["Player ESP", "Distance info", "Box/skeleton visuals"] },
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
      "OS: Windows 10, Windows 11 (21H2, 22H2, 23H2)",
      "Full-screen mode: not supported (windowed/borderless only)",
      "Flashdrive required: No",
    ],
    variants: [
      keyVariant("fragpunk-dullwave", "day", "1 Day Key", 400),
      keyVariant("fragpunk-dullwave", "week", "7 Day Key", 1600),
      keyVariant("fragpunk-dullwave", "month", "30 Day Key", 3200),
    ],
  },
  {
    ...categoryMeta("Escape from Tarkov"),
    badge: "Undetected",
    slug: "eft-dullwave",
    name: "EFT - Dullwave",
    priceDisplay: `From ${money(500)}`,
    summary:
      "Undetected Escape from Tarkov cheat pairing a precise aimbot with a strong player ESP and loot awareness for full raid control.",
    features: ["Aimbot", "Player ESP", "Loot ESP"],
    featureGroups: [
      { title: "Aimbot", items: ["Enable aimbot", "Aim key", "FOV control", "Smoothing"] },
      { title: "ESP", items: ["Player ESP", "Loot filters", "Distance info", "Box/skeleton visuals"] },
      { title: "Misc", items: ["Config save/load", "Low resource use"] },
    ],
    generalInfo: [
      "Loader password is shared setup-wide; check the instructions page before first launch.",
      ...universalSetupNotes,
    ],
    requirements: [
      "Game version: Battlestate Games Launcher",
      "CPU: Intel & AMD",
      "GPU: Nvidia & AMD",
      "OS: Windows 10, Windows 11 (21H2, 22H2, 23H2, 24H2, 25H2)",
      "Full-screen mode: not supported (windowed/borderless only)",
      "Flashdrive required: No",
    ],
    variants: [
      keyVariant("eft-dullwave", "day", "1 Day Key", 500),
      keyVariant("eft-dullwave", "week", "7 Day Key", 2000),
      keyVariant("eft-dullwave", "month", "30 Day Key", 3850),
    ],
  },
  {
    ...categoryMeta("Escape from Tarkov"),
    badge: "Undetected",
    slug: "eft-crusader",
    name: "EFT - Crusader",
    priceDisplay: `From ${money(500)}`,
    summary:
      "Balanced Escape from Tarkov aimbot and full ESP package built for consistent raid performance without going overboard.",
    features: ["Balanced aimbot", "Full ESP", "Raid awareness"],
    featureGroups: [
      { title: "Aimbot", items: ["Enable aimbot", "Aim key", "FOV control", "Smoothing"] },
      { title: "ESP", items: ["Player ESP", "Loot filters", "Distance info"] },
    ],
    generalInfo: [
      "Loader password is shared setup-wide; check the instructions page before first launch.",
      ...universalSetupNotes,
    ],
    requirements: [
      "Game version: Battlestate Games Launcher",
      "CPU: Intel & AMD",
      "GPU: Nvidia & AMD",
      "OS: Windows 10, Windows 11 (21H2, 22H2, 23H2, 24H2, 25H2)",
      "Full-screen mode: not supported (windowed/borderless only)",
    ],
    variants: [
      keyVariant("eft-crusader", "day", "1 Day Key", 500),
      keyVariant("eft-crusader", "week", "7 Day Key", 2400),
      keyVariant("eft-crusader", "month", "30 Day Key", 4500),
    ],
  },
  {
    ...categoryMeta("Escape from Tarkov"),
    badge: "Undetected",
    slug: "eft-superior",
    name: "EFT - Superior",
    priceDisplay: `From ${money(640)}`,
    summary:
      "Full-featured Escape from Tarkov package covering ESP, aimbot, wallhack, and misc tools alongside an included HWID spoofer.",
    features: ["Aimbot", "ESP & wallhack", "Misc tools", "HWID spoofer"],
    featureGroups: [
      { title: "Aimbot", items: ["Enable aimbot", "Aim key", "FOV control", "Smoothing"] },
      { title: "ESP", items: ["Player ESP", "Wallhack", "Loot filters", "Distance info"] },
      { title: "Misc", items: ["Misc tools", "HWID spoofer included"] },
    ],
    generalInfo: [
      "Loader password is shared setup-wide; check the instructions page before first launch.",
      ...universalSetupNotes,
    ],
    requirements: [
      "Game version: Battlestate Games Launcher",
      "CPU: Intel & AMD",
      "GPU: Nvidia & AMD",
      "OS: Windows 10, Windows 11 (21H2, 22H2, 23H2)",
      "Full-screen mode: not supported (windowed/borderless only)",
    ],
    variants: [
      keyVariant("eft-superior", "day", "1 Day Key", 640),
      keyVariant("eft-superior", "week", "7 Day Key", 3000),
      keyVariant("eft-superior", "month", "30 Day Key", 5800),
    ],
  },
  {
    ...spooferMeta,
    badge: "Undetected",
    slug: "spoofer-lunar",
    name: "Spoofer - Lunar",
    priceDisplay: `From ${money(500)}`,
    summary:
      "Universal temp HWID & TPM spoofer built to bypass bans, stay undetected, and protect your real hardware ID across all Windows versions.",
    features: ["Temp HWID spoof", "TPM spoof", "Universal Windows support"],
    featureGroups: [
      { title: "Coverage", items: ["Temp HWID spoof", "TPM spoof", "Optional seed change (F2)"] },
      { title: "Setup", items: ["BIOS TPM & virtualization steps", "Secure Boot check", "Loader activation"] },
    ],
    generalInfo: [
      "Does not currently support Rust or Fortnite. For COD Ranked, spoof once, restart your PC, then spoof again.",
      ...universalSetupNotes,
    ],
    requirements: ["Windows 10 / 11", "BIOS/UEFI access", "TPM & virtualization support"],
    variants: [
      keyVariant("spoofer-lunar", "day", "1 Day Key", 500),
      keyVariant("spoofer-lunar", "week", "7 Day Key", 1500),
      keyVariant("spoofer-lunar", "month", "30 Day Key", 3000),
    ],
  },
  {
    ...spooferMeta,
    slug: "spoofer-shadow",
    name: "Spoofer - Shadow",
    priceDisplay: `From ${money(160)}`,
    summary:
      "Lightweight, regularly updated temp HWID spoofer that works with EAC and BattleEye. Fast and easy to use across multiple games.",
    features: ["EAC & BattleEye support", "Lightweight", "Multi-game"],
    featureGroups: [
      { title: "Coverage", items: ["EAC (EasyAntiCheat)", "BE (BattleEye AC)"] },
    ],
    generalInfo: [
      "Disable antivirus and Windows Defender before running the loader.",
      ...universalSetupNotes,
    ],
    requirements: [
      "Game version: EAC (EasyAntiCheat), BE (BattleEye AC)",
      "CPU: Intel & AMD",
      "GPU: Nvidia & AMD",
      "OS: Windows 10, Windows 11 (21H2, 22H2, 23H2, 24H2, 25H2)",
    ],
    variants: [
      keyVariant("spoofer-shadow", "day", "1 Day Key", 160),
      keyVariant("spoofer-shadow", "week", "7 Day Key", 740),
      keyVariant("spoofer-shadow", "month", "30 Day Key", 1360),
    ],
  },
  {
    ...spooferMeta,
    slug: "eac-be-spoofer",
    name: "EAC / BE Spoofer",
    priceDisplay: `From ${money(399)}`,
    summary:
      "Dedicated spoofer for EAC- and BattleEye-protected games, covering a clean hardware identity reset in one setup.",
    features: ["EAC & BattleEye coverage", "Clean identity reset"],
    featureGroups: [
      { title: "Coverage", items: ["EasyAntiCheat", "BattleEye"] },
    ],
    generalInfo: [
      "Open a support ticket if you are unsure about your Windows version compatibility.",
      ...universalSetupNotes,
    ],
    requirements: ["CPU: Intel & AMD", "OS: Windows 10 - Windows 11 (21H2, 22H2, 23H2)"],
    variants: [
      keyVariant("eac-be-spoofer", "day", "1 Day Key", 399),
      keyVariant("eac-be-spoofer", "week", "7 Day Key", 999),
      keyVariant("eac-be-spoofer", "month", "30 Day Key", 1999),
    ],
  },
  {
    ...accountsMeta,
    badge: "Coming soon",
    available: false,
    slug: "r6s-nfa-account",
    name: "R6S Ranked Ready NFA Account",
    priceDisplay: `From ${money(400)}`,
    summary:
      "Non-Full Access Rainbow Six Siege account, ranked-ready with a clean standing, instant delivery, and a 3-hour replacement guarantee.",
    features: ["Instant delivery", "Ranked-ready", "3-hour replacement guarantee"],
    featureGroups: [
      { title: "Account", items: ["Non-Full Access (NFA)", "Clean standing", "Ranked-ready inventory"] },
      { title: "Delivery", items: ["Instant delivery", "3-hour replacement guarantee", "Support handoff"] },
    ],
    generalInfo: [
      "Change any available security details immediately after receiving access.",
      ...universalSetupNotes,
    ],
    requirements: ["Valid contact method for delivery", "Support ticket for replacement requests"],
    variants: disabledVariants("r6s-nfa-account", [
      ["level-50-99", "Level 50-99", 400],
      ["level-100-plus", "Level 100+", 500],
      ["previous-platinum", "Previous Platinum", 600],
      ["black-ices-20", "+20 Black Ices", 750],
      ["previous-emerald", "Previous Emerald", 850],
    ]),
  },
];

export const products = productCatalog.map((product) => ({
  ...product,
  generalInfo: [product.generalInfo?.[0] || defaultGeneralInfo],
  instructionHref: `/instructions/#${product.slug}`,
}));
