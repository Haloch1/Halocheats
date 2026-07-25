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
  badge: "Coming Soon",
  featured: false,
  available: false,
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
    slug: "fortnite-full",
    name: "Fortnite Full",
    priceDisplay: `From ${money(647)}`,
    summary:
      "Full Fortnite access with aim tuning, visual awareness, and loot information in one setup.",
    features: ["Aimbot tools", "ESP visuals", "Loot awareness"],
    featureGroups: [
      { title: "Combat", items: ["Aim smoothing", "FOV control", "Target selection"] },
      { title: "Visuals", items: ["Player ESP", "Loot ESP", "Distance info"] },
      { title: "Config", items: ["Profiles", "Hotkeys", "Support-guided setup"] },
    ],
    generalInfo: [
      "Check your Windows version and game build before requesting setup support.",
      "Use a support ticket if you need help with fullscreen/windowed display behavior.",
      ...universalSetupNotes,
    ],
    requirements: ["Windows 10 / 11", "Administrator access", "Stable internet connection"],
    variants: [
      keyVariant("fortnite-full", "day", "1 Day Key", 647),
      keyVariant("fortnite-full", "week", "7 Day Key", 1403),
      keyVariant("fortnite-full", "month", "30 Day Key", 2699),
    ],
  },
  {
    ...apexMeta,
    slug: "ignite-apex",
    name: "Ignite - Apex Legends",
    priceDisplay: `From ${money(799)}`,
    summary:
      "Precision aim assist for Apex Legends with triggerbot, full player and world ESP, and movement automation.",
    features: ["Aimbot suite", "Triggerbot", "Movement tools"],
    featureGroups: [
      {
        title: "Aimbot",
        items: ["Enable", "Aimbot key", "Speed", "FOV", "Max distance", "Retarget time", "Detach time", "Filter team"],
      },
      {
        title: "Player ESP",
        items: ["Enemy", "Team", "Max distance", "Box", "Head dot", "Skeleton", "Weapon", "Distance"],
      },
      {
        title: "World ESP",
        items: ["Pistols", "Shotguns", "SMG", "AR", "Snipers", "Ammo", "Meds", "Optics"],
      },
      {
        title: "Triggerbot",
        items: ["Enable", "Triggerbot key", "Detection threshold", "Magnetic", "Filter team"],
      },
      {
        title: "Misc",
        items: ["BHOP", "Tap strafe", "Wall jump"],
      },
      {
        title: "Config",
        items: ["Load", "Save", "Delete", "Clear"],
      },
    ],
    generalInfo: [
      "Streamproof and Medal.tv compatible with global support.",
      "Movement tools include BHOP, Tap Strafe, and Wall Jump automation.",
      ...universalSetupNotes,
    ],
    requirements: ["Windows 10 / 11", "Administrator access"],
    variants: [
      unavailableVariant("ignite-apex", "day", "1 Day Key", 799),
      unavailableVariant("ignite-apex", "three-day", "3 Day Key", 1499),
      unavailableVariant("ignite-apex", "week", "7 Day Key", 1999),
      unavailableVariant("ignite-apex", "month", "30 Day Key", 3999),
      unavailableVariant("ignite-apex", "lifetime", "Lifetime Key", 18000),
    ],
  },
  {
    ...apexMeta,
    slug: "ancient-apex",
    name: "Ancient - Apex Legends",
    priceDisplay: `From ${money(200)}`,
    summary:
      "Apex Legends setup with aim tools, player ESP, and configuration sharing.",
    features: ["Aim support", "Player ESP", "Config sharing"],
    featureGroups: [
      { title: "Aimbot", items: ["Aim key", "Smooth", "FOV", "Target selection"] },
      { title: "Visuals", items: ["Player ESP", "Skeleton", "Distance", "Radar"] },
      { title: "Config", items: ["Save", "Load", "Share"] },
    ],
    generalInfo: [
      "Currently being updated. Check back soon for availability.",
      ...universalSetupNotes,
    ],
    requirements: ["Windows 10 / 11", "Intel or AMD CPU"],
    variants: [
      unavailableVariant("ancient-apex", "day", "1 Day Key", 200),
      unavailableVariant("ancient-apex", "week", "7 Day Key", 1000),
      unavailableVariant("ancient-apex", "month", "30 Day Key", 2000),
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
    ...fortniteMeta,
    slug: "disconnect-fortnite-external",
    name: "Disconnect - Fortnite External",
    priceDisplay: `From ${money(972)}`,
    summary:
      "External Fortnite option with aim control, ESP, radar, item visuals, and streamproof-focused support.",
    features: ["External build", "Player and item ESP", "Radar tools"],
    featureGroups: [
      { title: "Aimbot", items: ["Prediction", "Hitbox selection", "Smoothing", "FOV"] },
      { title: "Visuals", items: ["Box", "Skeleton", "Name", "Distance", "Snaplines"] },
      { title: "Utility", items: ["Radar", "Item ESP", "Config system", "Streamproof mode"] },
    ],
    generalInfo: ["Use this if you want an external Fortnite setup with stream-friendly behavior."],
    requirements: ["CPU: Intel / AMD", "OS: Windows 10 / 11"],
    variants: [
      keyVariant("disconnect-fortnite-external", "day", "1 Day Key", 972),
      keyVariant("disconnect-fortnite-external", "three-day", "3 Days Key", 1944),
      keyVariant("disconnect-fortnite-external", "week", "7 Days Key", 3780),
      keyVariant("disconnect-fortnite-external", "month", "30 Days Key", 7020),
      keyVariant("disconnect-fortnite-external", "lifetime", "Lifetime Key", 32400),
    ],
  },
  {
    ...fortniteMeta,
    slug: "fortnite-ignite-aimbot",
    name: "Fortnite Ignite Aimbot",
    priceDisplay: `From ${money(1080)}`,
    summary:
      "Fortnite aim-focused package with customizable targeting, player visuals, world ESP, and trigger tools.",
    features: ["Custom aimbot", "World ESP", "Triggerbot"],
    featureGroups: [
      { title: "Aimbot", items: ["Speed", "FOV", "Max distance", "Prediction", "Hitbox selection"] },
      { title: "Player ESP", items: ["Box", "Skeleton", "Weapon", "Name", "Distance"] },
      { title: "Config", items: ["Load", "Save", "Delete", "Clear"] },
    ],
    generalInfo: ["A stronger Fortnite option for users who want deeper aim and visual tuning."],
    requirements: ["Windows 10 / 11", "Administrator access"],
    variants: [
      keyVariant("fortnite-ignite-aimbot", "day", "1 Day Key", 1080),
      keyVariant("fortnite-ignite-aimbot", "three-day", "3 Days Key", 2160),
      keyVariant("fortnite-ignite-aimbot", "week", "7 Days Key", 3402),
      keyVariant("fortnite-ignite-aimbot", "month", "30 Days Key", 7560),
      keyVariant("fortnite-ignite-aimbot", "lifetime", "Lifetime Key", 45360),
    ],
  },
  {
    ...rustMeta,
    slug: "rust-ignite",
    name: "Ignite - Rust External",
    priceDisplay: `From ${money(518)}`,
    summary:
      "Rust external with silent aim, player and item ESP, combat utilities, movement tools, and config handling.",
    features: ["Silent aimbot", "Item ESP", "Combat utilities"],
    featureGroups: [
      { title: "Aimbot", items: ["Speed", "FOV", "Max distance", "Hitbox selection"] },
      { title: "ESP", items: ["Players", "Items", "Prefabs", "Custom colors"] },
      { title: "Misc", items: ["Instant tools", "Movement helpers", "Config save/load"] },
    ],
    generalInfo: ["Higher-feature Rust external option with deep item and prefab controls."],
    requirements: ["Windows 10 / 11", "Administrator access"],
    variants: [
      keyVariant("rust-ignite", "day", "1 Day Key", 518),
      keyVariant("rust-ignite", "three-day", "3 Days Key", 1166),
      keyVariant("rust-ignite", "week", "7 Days Key", 1620),
      keyVariant("rust-ignite", "month", "30 Days Key", 3888),
      keyVariant("rust-ignite", "lifetime", "Lifetime Key", 23328),
    ],
  },
  {
    ...rustMeta,
    slug: "rust-krush",
    name: "Krush - Rust External",
    priceDisplay: `From ${money(324)}`,
    summary:
      "Rust external with normal and silent aim modes, detailed ESP filters, out-of-FOV arrows, and exploit toggles.",
    features: ["Normal and silent aim", "ESP filters", "OOF arrows"],
    featureGroups: [
      { title: "Aim", items: ["Silent aimbot", "Standard aimbot", "Priority modes", "Bone selection"] },
      { title: "ESP", items: ["Player", "NPC", "World", "Raid", "Ores", "Loot"] },
      { title: "Misc", items: ["No recoil", "Bright night", "Crosshair", "Config manager"] },
    ],
    generalInfo: ["Rust listing built around granular filters and readable visual controls."],
    requirements: ["Windows 10 / 11", "Administrator access"],
    variants: [
      keyVariant("rust-krush", "day", "1 Day Key", 324),
      keyVariant("rust-krush", "week", "7 Days Key", 1620),
      keyVariant("rust-krush", "month", "30 Days Key", 3240),
    ],
  },
  {
    ...rustMeta,
    slug: "rust-mek",
    name: "MEK - Rust External",
    priceDisplay: `From ${money(518)}`,
    summary:
      "Rust external package with silent and memory aim, streamproof visuals, combat utilities, and config management.",
    features: ["Streamproof external", "Silent and memory aim", "Combat tools"],
    featureGroups: [
      { title: "Misc", items: ["Fast loot", "No fall damage", "Spider-man", "Infinite jump"] },
      { title: "Aimbot", items: ["Silent aim", "Memory aim", "Hit chance", "FOV controls"] },
      { title: "Visuals", items: ["Player ESP", "Teammate ESP", "Chams", "Resources", "Crates"] },
    ],
    generalInfo: ["Rust tool for users who want a streamproof external workflow."],
    requirements: ["Windows 10 / 11", "Administrator access"],
    variants: [
      keyVariant("rust-mek", "day", "1 Day Key", 518),
      keyVariant("rust-mek", "three-day", "3 Days Key", 1037),
      keyVariant("rust-mek", "week", "7 Days Key", 1944),
      keyVariant("rust-mek", "month", "30 Days Key", 3888),
      keyVariant("rust-mek", "long", "9999 Day Key", 16200),
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
