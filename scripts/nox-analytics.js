/* NOX — visitor heartbeat for the Nox-styled pages.
   The legacy site.js isn't loaded on these pages, so without this the admin
   analytics panel would stop counting storefront traffic.
   Uses the SAME localStorage key as site.js, so a returning visitor keeps the
   same anonymous ID across old and new pages and isn't double-counted. */

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
    const existing = window.localStorage.getItem(VISITOR_ID_STORAGE);
    if (existing) return existing;

    const visitorId = createVisitorId();
    window.localStorage.setItem(VISITOR_ID_STORAGE, visitorId);
    return visitorId;
  } catch {
    fallbackVisitorId ||= createVisitorId();
    return fallbackVisitorId;
  }
}

function sendHeartbeat() {
  if (document.visibilityState === "hidden") return;

  window
    .fetch("/api/visitors/heartbeat", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitorId: getVisitorId(),
        pagePath: `${window.location.pathname}${window.location.search}`,
        referrer: document.referrer,
      }),
      keepalive: true,
    })
    .catch(() => {});
}

export function initNoxAnalytics() {
  sendHeartbeat();
  window.setInterval(sendHeartbeat, VISITOR_HEARTBEAT_MS);
}
