import { getCurrentSession } from "./supabase-client.js";
import { initReveal, renderMessage } from "./site.js";

initReveal();

const REFRESH_INTERVAL_MS = 10_000;
const SLOW_REFRESH_INTERVAL_MS = 60_000;

const messageBox = document.querySelector("[data-analytics-message]");
const accessForm = document.querySelector("[data-analytics-access-form]");
const accessCard = accessForm?.closest(".admin-access-card");
const analyticsShell = document.querySelector("[data-analytics-shell]");
const activeVisitors = document.querySelector("[data-active-visitors]");
const activeWindow = document.querySelector("[data-active-window]");
const updatedAt = document.querySelector("[data-analytics-updated]");
const pageActivityList = document.querySelector("[data-page-activity-list]");
const visitorViewList = document.querySelector("[data-visitor-view-list]");

const funnelUpdated = document.querySelector("[data-funnel-updated]");
const funnelNote = document.querySelector("[data-funnel-note]");
const exitPagesList = document.querySelector("[data-exit-pages-list]");
const abandonmentTable = document.querySelector("[data-abandonment-table]");
const abandonmentEmpty = document.querySelector("[data-abandonment-empty]");
const funnelStat = {
  total: document.querySelector("[data-funnel-total]"),
  viewedProduct: document.querySelector("[data-funnel-viewed-product]"),
  abandoned: document.querySelector("[data-funnel-abandoned]"),
  bounced: document.querySelector("[data-funnel-bounced]"),
  active: document.querySelector("[data-funnel-active]"),
  converted: document.querySelector("[data-funnel-converted]"),
};

const churnUpdated = document.querySelector("[data-churn-updated]");
const departuresTable = document.querySelector("[data-departures-table]");
const departuresEmpty = document.querySelector("[data-departures-empty]");
const churnStat = {
  total: document.querySelector("[data-churn-total]"),
  avgDays: document.querySelector("[data-churn-avg-days]"),
  medianDays: document.querySelector("[data-churn-median-days]"),
  d7: document.querySelector("[data-churn-7d]"),
  d30: document.querySelector("[data-churn-30d]"),
  verified: document.querySelector("[data-churn-verified]"),
};

let refreshTimer = null;
let slowRefreshTimer = null;

function formatTimestamp(value) {
  if (!value) {
    return "Not loaded yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    timeStyle: "medium",
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

function lockAnalyticsPanel() {
  analyticsShell.hidden = true;
  analyticsShell.classList.remove("is-visible");

  if (accessCard) {
    accessCard.hidden = false;
  }

  window.clearInterval(refreshTimer);
  refreshTimer = null;
}

function unlockAnalyticsPanel() {
  analyticsShell.hidden = false;
  analyticsShell.classList.add("is-visible");

  if (accessCard) {
    accessCard.hidden = true;
  }
}

async function checkAdminRole() {
  const response = await fetch("/api/auth/role", { credentials: "same-origin" });
  const payload = await response.json();
  if (payload.role !== "admin") {
    throw new Error(payload.role ? "Staff accounts cannot access analytics." : "Sign in with an admin account.");
  }
}

function renderPages(pages) {
  if (!pages.length) {
    pageActivityList.innerHTML = '<div class="member-empty">No live visitors yet.</div>';
    return;
  }

  pageActivityList.innerHTML = pages
    .map(
      (page) => `
        <article class="analytics-page-row">
          <span>${escapeHtml(page.pagePath)}</span>
          <strong>${Number(page.count || 0)}</strong>
        </article>
      `
    )
    .join("");
}

function renderRecentViews(views) {
  if (!views.length) {
    visitorViewList.innerHTML = '<div class="member-empty">No page views logged yet.</div>';
    return;
  }

  visitorViewList.innerHTML = views
    .map(
      (view) => `
        <article class="analytics-view-row">
          <div>
            <strong>${escapeHtml(view.pagePath)}</strong>
            <span>${escapeHtml(view.referrer || "Direct")}</span>
          </div>
          <small>
            ${escapeHtml(view.userLabel ? `User ${view.userLabel}` : "Guest")} - IP ${escapeHtml(
        view.ipAddress || "unknown"
      )} - ${escapeHtml(
        view.visitorLabel || "anonymous"
      )} - ${formatTimestamp(view.viewedAt)}
          </small>
        </article>
      `
    )
    .join("");
}

function formatMoney(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

function formatDays(value) {
  if (value === null || value === undefined) return "-";
  return `${value}d`;
}

function formatDate(value) {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value));
}

function renderExitPages(pages) {
  if (!exitPagesList) return;
  if (!pages.length) {
    exitPagesList.innerHTML = '<div class="member-empty">No data yet.</div>';
    return;
  }
  exitPagesList.innerHTML = pages
    .map(
      (page) => `
        <article class="analytics-page-row">
          <span>${escapeHtml(page.pagePath)}</span>
          <strong>${Number(page.exits || 0)}</strong>
        </article>
      `
    )
    .join("");
}

function renderAbandonment(rows) {
  if (!abandonmentTable) return;
  const body = rows
    .map(
      (row) => `
        <div class="analytics-table-row">
          <span>${escapeHtml(row.productSlug)}</span>
          <span>${Number(row.abandonedCount || 0)}</span>
          <span>${formatMoney(row.abandonedValueCents)}</span>
          <span>${Number(row.completedCount || 0)}</span>
        </div>
      `
    )
    .join("");
  abandonmentTable.querySelectorAll(".analytics-table-row:not(.analytics-table-head)").forEach((el) => el.remove());
  if (abandonmentEmpty) abandonmentEmpty.hidden = rows.length > 0;
  abandonmentTable.insertAdjacentHTML("beforeend", body);
}

function renderFunnelStats(summary) {
  if (!funnelStat.total) return;
  funnelStat.total.textContent = String(summary.totalVisitors || 0);
  funnelStat.viewedProduct.textContent = String(summary.viewedProduct || 0);
  funnelStat.abandoned.textContent = String(summary.abandonedAfterProductView || 0);
  funnelStat.bounced.textContent = String(summary.bouncedNoProductView || 0);
  funnelStat.active.textContent = String(summary.stillActive || 0);
  funnelStat.converted.textContent = String(summary.converted || 0);

  if (funnelNote) {
    const showNote = summary.converted === 0 && summary.cancelledAtCheckout === 0 && summary.abandonedAfterProductView > 0;
    funnelNote.hidden = !showNote;
    if (showNote) {
      funnelNote.textContent =
        "No checkout-success or checkout-cancel page views tracked yet in this window — tracking on those two pages just went live, so this number fills in over the next few days.";
    }
  }
}

async function loadFunnelAnalytics() {
  const response = await fetch("/api/admin/analytics/funnel?days=30&idleHours=2", {
    credentials: "same-origin",
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Unable to load funnel analytics.");
  }
  renderFunnelStats(payload.summary || {});
  renderExitPages(payload.exitPages || []);
  renderAbandonment(payload.checkoutAbandonment || []);
  if (funnelUpdated) funnelUpdated.textContent = `Updated ${formatTimestamp(payload.updatedAt)} · last 30 days`;
}

function renderDepartures(rows) {
  if (!departuresTable) return;
  const body = rows
    .map(
      (row) => `
        <div class="analytics-table-row analytics-table-row-5col">
          <span>${escapeHtml(row.tag || row.username || row.discordId)}</span>
          <span>${formatDate(row.joinedAt)}</span>
          <span>${formatDate(row.leftAt)}</span>
          <span>${formatDays(row.membershipDays)}</span>
          <span>${row.wasVerified ? "Yes" : "No"}</span>
        </div>
      `
    )
    .join("");
  departuresTable.querySelectorAll(".analytics-table-row:not(.analytics-table-head)").forEach((el) => el.remove());
  if (departuresEmpty) departuresEmpty.hidden = rows.length > 0;
  departuresTable.insertAdjacentHTML("beforeend", body);
}

function renderChurnStats(summary) {
  if (!churnStat.total) return;
  churnStat.total.textContent = String(summary.totalDepartures || 0);
  churnStat.avgDays.textContent = formatDays(summary.avgMembershipDays);
  churnStat.medianDays.textContent = formatDays(summary.medianMembershipDays);
  churnStat.d7.textContent = String(summary.leftWithin7Days || 0);
  churnStat.d30.textContent = String(summary.leftWithin30Days || 0);
  churnStat.verified.textContent = String(summary.wasVerifiedCount || 0);
}

async function loadChurnAnalytics() {
  const response = await fetch("/api/admin/analytics/churn?days=90", {
    credentials: "same-origin",
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Unable to load churn analytics.");
  }
  renderChurnStats(payload.summary || {});
  renderDepartures(payload.recent || []);
  if (churnUpdated) churnUpdated.textContent = `Updated ${formatTimestamp(payload.updatedAt)} · last 90 days`;
}

async function loadAnalytics() {
  const session = await getCurrentSession();

  if (!session) {
    lockAnalyticsPanel();
    renderMessage(messageBox, "Sign in required.", "warn");
    return;
  }

  const response = await fetch("/api/admin/visitors", {
    credentials: "same-origin",
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Unable to load panel.");
  }

  unlockAnalyticsPanel();
  activeVisitors.textContent = String(payload.activeVisitors || 0);
  activeWindow.textContent = `Active in the last ${payload.activeWindowSeconds || 75} seconds`;
  updatedAt.textContent = `Updated ${formatTimestamp(payload.updatedAt)}`;
  renderPages(payload.pages || []);
  renderRecentViews(payload.recentViews || []);
  renderMessage(messageBox, "Panel unlocked.", "success");
}

// Funnel/churn are heavier aggregate queries than the live-visitor panel, so
// they load independently and don't block it — one failing doesn't take
// down the rest of the page.
async function loadSlowAnalytics() {
  const results = await Promise.allSettled([loadFunnelAnalytics(), loadChurnAnalytics()]);
  for (const result of results) {
    if (result.status === "rejected") console.error("[Analytics]", result.reason);
  }
}

function startRefreshLoop() {
  window.clearInterval(refreshTimer);
  refreshTimer = window.setInterval(() => {
    loadAnalytics().catch((error) => {
      renderMessage(
        messageBox,
        error instanceof Error ? error.message : "Unable to refresh panel.",
        "error"
      );
    });
  }, REFRESH_INTERVAL_MS);

  window.clearInterval(slowRefreshTimer);
  slowRefreshTimer = window.setInterval(loadSlowAnalytics, SLOW_REFRESH_INTERVAL_MS);
}

// Auto-check role and load if admin
(async () => {
  try {
    await checkAdminRole();
    await loadAnalytics();
    startRefreshLoop();
  } catch (error) {
    renderMessage(
      messageBox,
      error instanceof Error ? error.message : "Sign in with an admin account.",
      "error"
    );
  }
})();
