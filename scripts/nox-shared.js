/* NOX — shared UI behaviour, ported from the static mockup's main.js into an
   ES module so Vite can bundle it alongside the app's real code.
   Pure presentation: nav, reveals, the hero cheat-menu mock, hardware readout,
   ESP compare slider, aim-smoothing curve, stat counters. No store logic here. */

/* ---------- nav ---------- */
function initNav() {
  const nav = document.querySelector(".nav");
  if (nav) {
    const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  const burger = document.querySelector(".nav-burger");
  const mobile = document.querySelector(".mobile-menu");
  if (burger && mobile) {
    burger.addEventListener("click", () => mobile.classList.toggle("open"));
    mobile.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => mobile.classList.remove("open"));
    });
  }
}

/* ---------- reveal on scroll ---------- */
/* Exported so pages can re-run it over content injected after load. */
export function revealIn(root = document) {
  const targets = root.querySelectorAll(".reveal:not(.visible)");
  if (!targets.length) return;

  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  targets.forEach((el) => observer.observe(el));
}

/* ---------- cursor spotlight on cards ---------- */
export function spotlight(root = document) {
  root
    .querySelectorAll(".game-card, .review-card, .u-card, .faq-item, .prod-card, .rel-card, .pop-card")
    .forEach((card) => {
      if (card.dataset.noxGlow) return;
      card.dataset.noxGlow = "1";
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${((event.clientX - rect.left) / rect.width) * 100}%`);
        card.style.setProperty("--my", `${((event.clientY - rect.top) / rect.height) * 100}%`);
      });
      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--mx", "50%");
        card.style.setProperty("--my", "50%");
      });
    });
}

/* ---------- hero cheat-menu mock ---------- */
function initMenuMock() {
  const tabsEl = document.getElementById("noxTabs");
  const panelEl = document.getElementById("noxPanel");
  if (!tabsEl || !panelEl) return;

  const pct = (v) => `${v}%`;
  const deg = (v) => `${v}°`;
  const dec = (v) => (v / 10).toFixed(1);

  const DEFAULTS = {
    Aimbot: [
      { id: "aim_on", type: "toggle", label: "Enable aimbot", value: true },
      { id: "aim_key", type: "select", label: "Aim key", options: ["Right mouse", "Left alt", "Always on"], value: 0 },
      { id: "aim_bone", type: "select", label: "Target bone", options: ["Head", "Neck", "Chest", "Nearest"], value: 0 },
      { id: "aim_smooth", type: "slider", label: "Smoothing", value: 42, format: dec },
      { id: "aim_fov", type: "slider", label: "FOV radius", value: 65, format: deg },
      { id: "aim_vis", type: "toggle", label: "Visibility check", value: true },
      { id: "aim_trig", type: "toggle", label: "Triggerbot", value: false },
      { id: "aim_recoil", type: "slider", label: "Recoil control", value: 88, format: pct },
    ],
    Visuals: [
      { id: "esp_box", type: "toggle", label: "Player boxes", value: true },
      { id: "esp_skel", type: "toggle", label: "Skeleton", value: false },
      { id: "esp_hp", type: "toggle", label: "Health bars", value: true },
      { id: "esp_name", type: "toggle", label: "Name tags", value: true },
      { id: "esp_dist", type: "toggle", label: "Distance", value: true },
      { id: "esp_loot", type: "select", label: "Loot filter", options: ["Rare+", "Epic+", "All items", "Off"], value: 0 },
      { id: "esp_range", type: "slider", label: "Render range", value: 70, format: (v) => `${v * 4}m` },
      { id: "esp_glow", type: "slider", label: "Chams opacity", value: 55, format: pct },
    ],
    Radar: [
      { id: "rad_on", type: "toggle", label: "Enable radar", value: true },
      { id: "rad_size", type: "slider", label: "Radar size", value: 60, format: (v) => `${100 + v * 2}px` },
      { id: "rad_zoom", type: "slider", label: "Zoom", value: 45, format: (v) => `${(v / 20 + 0.5).toFixed(1)}x` },
      { id: "rad_teams", type: "toggle", label: "Show teammates", value: false },
      { id: "rad_arrow", type: "toggle", label: "View cones", value: true },
      { id: "rad_pos", type: "select", label: "Position", options: ["Top left", "Top right", "Center"], value: 0 },
    ],
    Misc: [
      { id: "misc_stream", type: "toggle", label: "Stream proof", value: true },
      { id: "misc_spoof", type: "toggle", label: "HWID spoofer", value: true },
      { id: "misc_speed", type: "toggle", label: "Speed hack", value: false },
      { id: "misc_noflash", type: "toggle", label: "No flash", value: true },
      { id: "misc_fov", type: "slider", label: "Custom FOV", value: 50, format: (v) => `${70 + Math.round(v * 0.5)}°` },
      { id: "misc_fps", type: "toggle", label: "FPS overlay", value: false },
    ],
    Config: [
      { id: "cfg_preset", type: "select", label: "Preset", options: ["Legit", "Balanced", "Rage"], value: 1 },
      { id: "cfg_menu", type: "select", label: "Menu key", options: ["INS", "F1", "END"], value: 0 },
      { id: "cfg_accent", type: "select", label: "Accent colour", options: ["Nox blue", "Cyan", "White"], value: 0 },
      { id: "cfg_save", type: "toggle", label: "Autosave config", value: true },
      { id: "cfg_watermark", type: "toggle", label: "Watermark", value: true },
      { id: "cfg_opacity", type: "slider", label: "Menu opacity", value: 92, format: pct },
    ],
  };

  const TAB_NAMES = Object.keys(DEFAULTS);
  /* structuredClone drops the format functions, so look them up from DEFAULTS */
  const clone = () =>
    Object.fromEntries(
      Object.entries(DEFAULTS).map(([tab, rows]) => [tab, rows.map((row) => ({ ...row }))])
    );

  let state = clone();
  let active = TAB_NAMES[0];

  const statusEl = document.getElementById("noxStatus");
  let pulseTimer;
  function pulse() {
    if (!statusEl) return;
    statusEl.classList.add("saved");
    clearTimeout(pulseTimer);
    pulseTimer = setTimeout(() => statusEl.classList.remove("saved"), 900);
  }

  function buildTabs() {
    tabsEl.innerHTML = "";
    TAB_NAMES.forEach((name) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = name;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", String(name === active));
      if (name === active) button.classList.add("on");
      button.addEventListener("click", () => {
        active = name;
        buildTabs();
        buildPanel();
      });
      tabsEl.appendChild(button);
    });
  }

  function buildPanel() {
    panelEl.innerHTML = "";
    state[active].forEach((row) => {
      const wrap = document.createElement("div");
      wrap.className = "menu-row";

      const label = document.createElement("label");
      label.textContent = row.label;
      wrap.appendChild(label);

      if (row.type === "toggle") {
        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = `toggle${row.value ? " on" : ""}`;
        toggle.setAttribute("role", "switch");
        toggle.setAttribute("aria-checked", String(!!row.value));
        toggle.setAttribute("aria-label", row.label);
        toggle.addEventListener("click", () => {
          row.value = !row.value;
          toggle.classList.toggle("on", row.value);
          toggle.setAttribute("aria-checked", String(row.value));
          pulse();
        });
        wrap.appendChild(toggle);
      }

      if (row.type === "slider") {
        const format = row.format || ((v) => v);
        const slider = document.createElement("input");
        slider.type = "range";
        slider.min = 0;
        slider.max = 100;
        slider.value = row.value;
        slider.className = "menu-range";
        slider.setAttribute("aria-label", row.label);
        slider.style.setProperty("--fill", `${row.value}%`);

        const value = document.createElement("span");
        value.className = "menu-val";
        value.textContent = format(row.value);

        slider.addEventListener("input", () => {
          row.value = Number(slider.value);
          slider.style.setProperty("--fill", `${row.value}%`);
          value.textContent = format(row.value);
        });
        slider.addEventListener("change", pulse);

        wrap.appendChild(slider);
        wrap.appendChild(value);
      }

      if (row.type === "select") {
        const select = document.createElement("button");
        select.type = "button";
        select.className = "menu-select";
        select.setAttribute("aria-label", row.label);
        select.innerHTML =
          '<span></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';
        const text = select.querySelector("span");
        text.textContent = row.options[row.value];
        select.addEventListener("click", () => {
          row.value = (row.value + 1) % row.options.length;
          text.textContent = row.options[row.value];
          select.classList.remove("bump");
          void select.offsetWidth;
          select.classList.add("bump");
          pulse();
        });
        wrap.appendChild(select);
      }

      panelEl.appendChild(wrap);
    });
  }

  document.getElementById("noxReset")?.addEventListener("click", () => {
    state = clone();
    buildPanel();
    pulse();
  });

  buildTabs();
  buildPanel();
}

/* ---------- hardware readout ---------- */
function initHardware() {
  const mini = document.getElementById("miniCompat");
  if (!mini) return;

  /* Windows 11 still reports "Windows NT 10.0" in the UA string; the
     platformVersion client hint is the only way to tell 10 from 11. */
  let winVersion = null;
  if (navigator.userAgentData?.getHighEntropyValues) {
    navigator.userAgentData
      .getHighEntropyValues(["platformVersion"])
      .then((data) => {
        const major = parseInt((data.platformVersion || "0").split(".")[0], 10);
        if (major > 0) winVersion = major >= 13 ? "11" : "10";
      })
      .catch(() => {});
  }

  const CHECKS = {
    os() {
      const ua = navigator.userAgent;
      if (/Windows NT 10/.test(ua)) {
        return { value: winVersion ? `Windows ${winVersion}` : "Windows 10 / 11", ok: true };
      }
      if (/Windows/.test(ua)) return { value: "Windows (legacy)", ok: true };
      if (/Mac OS X/.test(ua)) return { value: "macOS · unsupported", ok: false };
      if (/Linux|X11/.test(ua)) return { value: "Linux · unsupported", ok: false };
      if (/Android|iPhone|iPad/.test(ua)) return { value: "Mobile · desktop only", ok: false };
      return { value: "Unknown", ok: false };
    },
    cpu() {
      const cores = navigator.hardwareConcurrency || 0;
      if (!cores) return { value: "Multi-core", ok: true };
      return { value: `${cores} cores`, ok: cores >= 2 };
    },
    ram() {
      const gb = navigator.deviceMemory;
      if (!gb) return { value: "8 GB+", ok: true };
      return { value: gb >= 8 ? `${gb} GB+` : `${gb} GB`, ok: gb >= 4 };
    },
    gpu() {
      try {
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        if (!gl) return { value: "No WebGL — integrated", ok: true };
        const debug = gl.getExtension("WEBGL_debug_renderer_info");
        let renderer = (debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : "") || "";

        /* Chrome wraps the real GPU in an ANGLE(...) string */
        const angle = renderer.match(/^ANGLE\s*\(([^)]*)\)/i);
        if (angle) {
          const parts = angle[1].split(",");
          renderer = (parts[1] || parts[0] || "").trim();
        }
        renderer = renderer
          .replace(/\(0x[0-9a-f]+\)/gi, "")
          .replace(/Direct3D.*$/i, "")
          .replace(/vs_\d.*$/i, "")
          .replace(/\s{2,}/g, " ")
          .trim()
          .replace(/^(NVIDIA|AMD|Intel|ATI)\s+/i, "");
        if (!renderer || /^ANGLE$/i.test(renderer)) renderer = "Graphics adapter";
        if (renderer.length > 22) renderer = `${renderer.slice(0, 22).trim()}…`;
        return { value: renderer, ok: true };
      } catch {
        return { value: "Graphics adapter", ok: true };
      }
    },
  };

  const rows = [...mini.querySelectorAll("[data-mini]")];
  const statusEl = document.getElementById("miniStatus");
  const barEl = document.getElementById("sysBar");

  const run = () => {
    if (statusEl) statusEl.textContent = "SCANNING";
    let index = 0;

    const next = () => {
      if (index >= rows.length) {
        if (statusEl) {
          statusEl.textContent = "COMPATIBLE";
          statusEl.classList.add("done");
        }
        return;
      }

      const row = rows[index];
      const valueEl = row.querySelector(".sys-val");
      row.classList.add("scanning");
      valueEl.textContent = "scanning…";

      setTimeout(() => {
        const check = CHECKS[row.getAttribute("data-mini")];
        const result = check ? check() : { value: "—", ok: true };
        row.classList.remove("scanning");
        row.classList.add(result.ok ? "done" : "bad");
        valueEl.textContent = result.value;
        index += 1;
        if (barEl) barEl.style.width = `${Math.round((index / rows.length) * 100)}%`;
        next();
      }, 650);
    };

    next();
  };

  if (!("IntersectionObserver" in window)) {
    run();
    return;
  }
  let started = false;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !started) {
          started = true;
          observer.disconnect();
          run();
        }
      });
    },
    { threshold: 0.4 }
  );
  observer.observe(mini);
}

/* ---------- aim smoothing curve ---------- */
function initCurve() {
  const range = document.querySelector(".u-media .nox-range");
  if (!range) return;

  const out = document.getElementById("smoothVal");
  const chip = document.getElementById("smoothChip");
  const path = document.getElementById("curvePath");
  const area = document.getElementById("curveArea");
  const dot = document.getElementById("curveDot");
  const modes = document.querySelectorAll(".u-media .modes span");
  if (!path || !area || !dot) return;

  const W = 240;
  const H = 90;

  /* s = 0 -> instant snap (sharp elbow); s = 1 -> long smooth ease */
  const pointAt = (t, s) => {
    const ease = Math.pow(t, 1 + s * 3);
    return [t * W, H - 8 - ease * (H - 22)];
  };

  const render = () => {
    const value = Number(range.value);
    const s = value / 100;

    let d = "";
    const points = [];
    for (let i = 0; i <= 40; i += 1) {
      const point = pointAt(i / 40, s);
      points.push(point);
      d += `${i === 0 ? "M" : "L"}${point[0].toFixed(1)} ${point[1].toFixed(1)}`;
    }
    path.setAttribute("d", d);
    area.setAttribute("d", `${d}L${W} ${H}L0 ${H}Z`);

    const mid = points[Math.round(points.length * 0.62)];
    dot.setAttribute("cx", mid[0]);
    dot.setAttribute("cy", mid[1]);

    range.style.setProperty("--fill", `${value}%`);
    if (out) out.textContent = value;

    /* low smoothing = snappy = rage; high smoothing = human = legit */
    const mode = value < 34 ? "rage" : value < 70 ? "balanced" : "legit";
    if (chip) chip.textContent = mode.toUpperCase();
    modes.forEach((el) => el.classList.toggle("on", el.getAttribute("data-mode") === mode));
  };

  range.addEventListener("input", render);
  render();
}

/* ---------- ESP compare slider ---------- */
function initCompare() {
  const compare = document.querySelector(".compare");
  if (!compare) return;

  let dragging = false;
  const setCut = (clientX) => {
    const rect = compare.getBoundingClientRect();
    const percent = Math.max(4, Math.min(96, ((clientX - rect.left) / rect.width) * 100));
    compare.style.setProperty("--cut", `${percent}%`);
  };

  compare.addEventListener("pointerdown", (event) => {
    dragging = true;
    setCut(event.clientX);
    compare.setPointerCapture(event.pointerId);
  });
  compare.addEventListener("pointermove", (event) => {
    if (dragging) setCut(event.clientX);
  });
  window.addEventListener("pointerup", () => {
    dragging = false;
  });
}

/* ---------- stat count-up ---------- */
function initCounters() {
  const band = document.getElementById("statsBand");
  if (!band) return;

  const counters = band.querySelectorAll(".count");
  const run = () => {
    counters.forEach((el, i) => {
      const to = parseFloat(el.getAttribute("data-to"));
      const decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      const prefix = el.getAttribute("data-prefix") || "";
      const suffix = el.getAttribute("data-suffix") || "";
      const duration = 1400;

      setTimeout(() => {
        const start = Date.now();
        const frame = () => {
          const progress = Math.min((Date.now() - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
          el.textContent = prefix + (to * eased).toFixed(decimals) + suffix;
          if (progress < 1) requestAnimationFrame(frame);
          else el.textContent = prefix + to.toFixed(decimals) + suffix;
        };
        frame();
      }, i * 500);
    });
  };

  if (!("IntersectionObserver" in window)) {
    run();
    return;
  }
  let counted = false;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !counted) {
          counted = true;
          observer.disconnect();
          run();
        }
      });
    },
    { threshold: 0.4 }
  );
  observer.observe(band);
}

/* ---------- footer year ---------- */
function initYear() {
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
}

export function initNoxUI() {
  initNav();
  revealIn();
  spotlight();
  initMenuMock();
  initHardware();
  initCurve();
  initCompare();
  initCounters();
  initYear();
}
