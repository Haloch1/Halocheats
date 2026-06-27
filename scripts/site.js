export function initReveal() {
  const revealItems = document.querySelectorAll(".reveal");

  if (!revealItems.length) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries, activeObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const delay = entry.target.dataset.delay || "0";
        entry.target.style.setProperty("--reveal-delay", `${delay}ms`);
        entry.target.classList.add("is-visible");
        activeObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -10% 0px",
    }
  );

  revealItems.forEach((item) => observer.observe(item));
}

export function renderMessage(target, message, tone = "info") {
  if (!target) {
    return;
  }

  target.hidden = false;
  target.textContent = message;
  target.className = `inline-message ${tone}`;
}

export function currencyLabel(value) {
  return typeof value === "number" ? `$${value.toFixed(2)}` : value;
}

const VISITOR_ID_STORAGE = "halo-anonymous-visitor-id";
const VISITOR_HEARTBEAT_MS = 30_000;
let fallbackVisitorId = "";

function createVisitorId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 18)}`;
}

function getVisitorId() {
  try {
    const existingId = window.localStorage.getItem(VISITOR_ID_STORAGE);

    if (existingId) {
      return existingId;
    }

    const visitorId = createVisitorId();
    window.localStorage.setItem(VISITOR_ID_STORAGE, visitorId);
    return visitorId;
  } catch {
    fallbackVisitorId ||= createVisitorId();
    return fallbackVisitorId;
  }
}

function sendVisitorHeartbeat() {
  if (document.visibilityState === "hidden") {
    return;
  }

  window
    .fetch("/api/visitors/heartbeat", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        visitorId: getVisitorId(),
        pagePath: `${window.location.pathname}${window.location.search}`,
        referrer: document.referrer,
      }),
      keepalive: true,
    })
    .catch(() => {});
}

sendVisitorHeartbeat();
window.setInterval(sendVisitorHeartbeat, VISITOR_HEARTBEAT_MS);
document.addEventListener("visibilitychange", sendVisitorHeartbeat);

/* ── Mobile hamburger menu ── */
function initMobileNav() {
  const shell = document.querySelector(".topbar-shell");
  if (!shell) return;

  const nav = shell.querySelector(".nav");
  const cta = shell.querySelector(".nav-cta");
  if (!nav) return;

  // Create hamburger button
  const btn = document.createElement("button");
  btn.className = "hamburger";
  btn.setAttribute("aria-label", "Menu");
  btn.setAttribute("aria-expanded", "false");
  btn.innerHTML = '<span></span><span></span><span></span>';

  // Insert before nav
  shell.insertBefore(btn, nav);

  // Toggle menu
  btn.addEventListener("click", () => {
    const open = shell.classList.toggle("nav-open");
    btn.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("menu-open", open);
  });

  // Close on link click
  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) {
      shell.classList.remove("nav-open");
      btn.setAttribute("aria-expanded", "false");
      document.body.classList.remove("menu-open");
    }
  });

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (shell.classList.contains("nav-open") && !e.target.closest(".topbar-shell")) {
      shell.classList.remove("nav-open");
      btn.setAttribute("aria-expanded", "false");
      document.body.classList.remove("menu-open");
    }
  });
}

initMobileNav();
