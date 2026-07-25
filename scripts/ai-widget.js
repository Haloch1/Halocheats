/* ═══ XENCHEATS — Floating AI support widget (bottom-right) ═══
   Replaces the old standalone /desk page. Reuses the existing live-desk
   backend as-is: POST /api/live-desk opens a thread and fires an AI
   auto-reply (Groq/Gemini) server-side; a human can jump in from Discord
   any time after. This file only adds the UI + polling. */

import { getCurrentSession } from "./supabase-client.js";

const SKIP_PATH_PREFIXES = ["/admin", "/desk-admin"];
const POLL_MS_OPEN = 4000;
const POLL_MS_BACKGROUND = 10000;
const AI_THINKING_TIMEOUT_MS = 25000;

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

// AI replies are stored as plain text. Escape first, then allow only the few
// presentation features the support assistant uses; never render raw HTML.
function formatMessage(v) {
  return esc(v)
    .replace(/`([^`\n]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(https:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\n/g, "<br>");
}

function shouldSkip() {
  const path = window.location.pathname;
  return SKIP_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

function senderLabel(type) {
  if (type === "bot") return "Nox AI";
  if (type === "admin") return "Support";
  return "You";
}

function buildWidget() {
  const root = document.createElement("div");
  root.className = "ai-widget";
  root.innerHTML = `
    <button class="ai-widget-bubble" type="button" aria-label="Open support chat" aria-expanded="false">
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="ai-widget-icon-chat"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="ai-widget-icon-close"><path d="M18 6 6 18M6 6l12 12"/></svg>
      <span class="ai-widget-dot" hidden></span>
    </button>
    <div class="ai-widget-panel" hidden>
      <div class="ai-widget-head">
        <div>
          <strong>Nox Support</strong>
          <span class="ai-widget-status"><i></i>AI + live team</span>
        </div>
        <button type="button" class="ai-widget-close" aria-label="Close chat">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="ai-widget-body">
        <div class="ai-widget-messages"></div>
      </div>
      <form class="ai-widget-form">
        <textarea rows="1" maxlength="900" placeholder="Ask about a product, order, or key..." required></textarea>
        <button type="submit" aria-label="Send">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
        </button>
      </form>
    </div>
  `;
  document.body.appendChild(root);
  return root;
}

async function init() {
  if (shouldSkip()) return;

  const root = buildWidget();
  const bubble = root.querySelector(".ai-widget-bubble");
  const panel = root.querySelector(".ai-widget-panel");
  const closeBtn = root.querySelector(".ai-widget-close");
  const messagesEl = root.querySelector(".ai-widget-messages");
  const form = root.querySelector(".ai-widget-form");
  const textarea = form.querySelector("textarea");
  const dot = root.querySelector(".ai-widget-dot");

  let session = null;
  let threadId = null;
  let knownMessageIds = new Set();
  let pollTimer = null;
  let pollIntervalMs = POLL_MS_BACKGROUND;
  let isOpen = false;
  let aiThinking = false;
  let aiThinkingTimer = null;
  let resumePromise = null;
  let activeThread = null;
  let restoreAttempts = 0;

  function scrollToEnd() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function renderGate() {
    messagesEl.innerHTML = `
      <div class="ai-widget-gate">
        <p>Sign in to chat with our AI assistant and the support team.</p>
        <a class="button button-primary" href="/account/">Sign in</a>
      </div>`;
  }

  function renderStarter() {
    messagesEl.innerHTML = `
      <div class="ai-widget-greet">
        <p>Hey! I'm the Nox AI assistant. Ask me about products, orders, or key delivery &mdash; a human can jump in any time.</p>
      </div>`;
  }

  function startAiThinking() {
    aiThinking = true;
    if (aiThinkingTimer) window.clearTimeout(aiThinkingTimer);
    // Safety net: if the backend AI call fails silently, don't leave the
    // "..." indicator spinning forever.
    aiThinkingTimer = window.setTimeout(() => {
      aiThinking = false;
      if (activeThread) renderThread(activeThread, { isBaseline: true });
    }, AI_THINKING_TIMEOUT_MS);
    renderTypingState();
  }

  function stopAiThinking() {
    aiThinking = false;
    if (aiThinkingTimer) {
      window.clearTimeout(aiThinkingTimer);
      aiThinkingTimer = null;
    }
    renderTypingState();
  }

  function renderTypingState() {
    if (!activeThread) {
      messagesEl.querySelector(".ai-widget-typing")?.remove();
      if (aiThinking) {
        messagesEl.insertAdjacentHTML(
          "beforeend",
          `<div class="ai-widget-typing"><span>Xen AI is thinking</span><i></i><i></i><i></i></div>`
        );
        scrollToEnd();
      }
      return;
    }
    renderThread(activeThread, { isBaseline: true });
  }

  /* isBaseline: true when this is the first time we're hydrating a thread
     (page load resume, or opening the panel for the first time). Baseline
     renders must not flag the unread dot for the whole history — only
     messages that arrive *after* the baseline should light it up. */
  function renderThread(thread, { isBaseline = false } = {}) {
    activeThread = thread || activeThread;
    const msgs = thread?.messages || [];

    const newIncoming = msgs.filter(
      (m) => m.senderType !== "user" && !knownMessageIds.has(m.id)
    );

    if (!isBaseline && newIncoming.some((m) => m.senderType === "bot")) {
      stopAiThinking();
    }

    knownMessageIds = new Set(msgs.map((m) => m.id));

    messagesEl.innerHTML = msgs
      .map(
        (m) => `
        <div class="ai-widget-msg ai-widget-msg-${m.senderType === "user" ? "self" : m.senderType}">
          <span>${esc(senderLabel(m.senderType))}</span>
          <p>${formatMessage(m.body)}</p>
        </div>`
      )
      .join("");

    if (thread?.staffTyping) {
      messagesEl.insertAdjacentHTML(
        "beforeend",
        `<div class="ai-widget-typing"><span>Support is typing</span><i></i><i></i><i></i></div>`
      );
    } else if (aiThinking) {
      messagesEl.insertAdjacentHTML(
        "beforeend",
        `<div class="ai-widget-typing"><span>Nox AI is thinking</span><i></i><i></i><i></i></div>`
      );
    }

    if (!isBaseline && newIncoming.length && !isOpen) {
      dot.hidden = false;
    }

    scrollToEnd();
  }

  async function pollThread() {
    if (!session || !threadId) return;
    try {
      const res = await fetch("/api/live-desk/mine", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const thread = (data.threads || []).find((t) => t.id === threadId);
      if (thread) renderThread(thread);
    } catch {
      /* silent — retry on next tick */
    }
  }

  function startPolling(intervalMs) {
    pollIntervalMs = intervalMs;
    stopPolling();
    pollTimer = window.setInterval(pollThread, pollIntervalMs);
  }

  function stopPolling() {
    if (pollTimer) window.clearInterval(pollTimer);
    pollTimer = null;
  }

  /* Runs once on page load (not just when the bubble is clicked) so an
     existing conversation "renews" after a refresh: the unread dot can
     light up and polling is already running by the time you open the panel. */
  async function resumeOnLoad() {
    session = await getCurrentSession();
    if (!session?.access_token) return;

    try {
      const res = await fetch("/api/live-desk/mine", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const open = (data.threads || []).find((t) => t.status === "open") || data.threads?.[0];
      if (open) {
        threadId = open.id;
        renderThread(open, { isBaseline: true });
        startPolling(POLL_MS_BACKGROUND);
      }
    } catch {
      // A refreshed server cookie can arrive a moment after the page. Retry a
      // couple of times so an existing support session reliably resumes.
      if (restoreAttempts < 2) {
        restoreAttempts += 1;
        await new Promise((resolve) => window.setTimeout(resolve, 1200 * restoreAttempts));
        return resumeOnLoad();
      }
    }
  }

  async function openPanel() {
    isOpen = true;
    panel.hidden = false;
    bubble.classList.add("is-open");
    bubble.setAttribute("aria-expanded", "true");
    dot.hidden = true;

    // If the page just loaded, resumeOnLoad() may still be in flight — wait
    // for it instead of racing it, otherwise a fast click right after load
    // could flash "start a new chat" even though a thread already exists.
    if (resumePromise) {
      await resumePromise;
    } else if (!session) {
      session = await getCurrentSession();
    }

    if (!session?.access_token) {
      renderGate();
      return;
    }

    if (threadId) {
      // Already resumed in the background — speed the poll up while open.
      startPolling(POLL_MS_OPEN);
      pollThread();
    } else if (!messagesEl.childElementCount) {
      renderStarter();
    }

    textarea.focus();
  }

  function closePanel() {
    isOpen = false;
    panel.hidden = true;
    bubble.classList.remove("is-open");
    bubble.setAttribute("aria-expanded", "false");
    // Keep a slower background poll alive so the unread dot still works,
    // instead of stopping entirely.
    if (threadId) {
      startPolling(POLL_MS_BACKGROUND);
    } else {
      stopPolling();
    }
  }

  bubble.addEventListener("click", () => (isOpen ? closePanel() : openPanel()));
  closeBtn.addEventListener("click", closePanel);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) closePanel();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = textarea.value.trim();
    if (!body || !session?.access_token) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    textarea.value = "";

    try {
      if (!threadId) {
        const username = session.user?.user_metadata?.username || "Member";
        const email = session.user?.email || "unknown";
        const res = await fetch("/api/live-desk", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ name: username, contact: email, topic: "Live chat", details: body }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unable to send message.");
        threadId = data.threadId;
        startAiThinking();
        startPolling(POLL_MS_OPEN);
      } else {
        const res = await fetch("/api/live-desk/reply", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ threadId, body }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unable to send message.");
        startAiThinking();
      }
      pollThread();
    } catch (error) {
      messagesEl.insertAdjacentHTML(
        "beforeend",
        `<div class="ai-widget-msg ai-widget-msg-error"><p>${esc(error.message)}</p></div>`
      );
      scrollToEnd();
    } finally {
      submitBtn.disabled = false;
    }
  });

  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  /* Any link on the site can open the widget via data-open-support */
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-open-support]");
    if (!trigger) return;
    e.preventDefault();
    openPanel();
  });

  // Renew the current support session after a reload, a return to this tab,
  // or a completed sign-in flow without making the member reopen the widget.
  window.addEventListener("focus", () => {
    if (!threadId) resumePromise = resumeOnLoad();
    else pollThread();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      if (!threadId) resumePromise = resumeOnLoad();
      else pollThread();
    }
  });

  resumePromise = resumeOnLoad();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
