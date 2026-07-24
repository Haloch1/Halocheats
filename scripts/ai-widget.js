/* ═══ XENCHEATS — Floating AI support widget (bottom-right) ═══
   Replaces the old standalone /desk page. Reuses the existing live-desk
   backend as-is: POST /api/live-desk opens a thread and fires an AI
   auto-reply (Groq) server-side; a human can jump in from Discord any
   time after. This file only adds the UI + polling. */

import { getCurrentSession } from "./supabase-client.js";

const SKIP_PATH_PREFIXES = ["/admin", "/desk-admin"];
const POLL_MS = 4500;

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
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
  let lastMessageCount = 0;
  let pollTimer = null;
  let isOpen = false;

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

  function renderThread(thread) {
    const msgs = thread?.messages || [];
    messagesEl.innerHTML = msgs
      .map(
        (m) => `
        <div class="ai-widget-msg ai-widget-msg-${m.senderType === "user" ? "self" : m.senderType}">
          <span>${esc(senderLabel(m.senderType))}</span>
          <p>${esc(m.body)}</p>
        </div>`
      )
      .join("");

    if (thread?.staffTyping) {
      messagesEl.insertAdjacentHTML(
        "beforeend",
        `<div class="ai-widget-typing"><i></i><i></i><i></i></div>`
      );
    }

    if (msgs.length > lastMessageCount) {
      if (!isOpen) {
        dot.hidden = false;
      }
      lastMessageCount = msgs.length;
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

  function startPolling() {
    stopPolling();
    pollTimer = window.setInterval(pollThread, POLL_MS);
  }

  function stopPolling() {
    if (pollTimer) window.clearInterval(pollTimer);
    pollTimer = null;
  }

  async function loadExistingThread() {
    if (!session) return;
    try {
      const res = await fetch("/api/live-desk/mine", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const open = (data.threads || []).find((t) => t.status === "open") || data.threads?.[0];
      if (open) {
        threadId = open.id;
        renderThread(open);
        startPolling();
      } else {
        renderStarter();
      }
    } catch {
      renderStarter();
    }
  }

  async function openPanel() {
    isOpen = true;
    panel.hidden = false;
    bubble.classList.add("is-open");
    bubble.setAttribute("aria-expanded", "true");
    dot.hidden = true;

    // First open after a fresh page load (no session checked yet): show a
    // brief loading state instead of a blank flash while we resume the
    // conversation, so it feels like a continuous chat session, not a reset.
    const firstOpenThisLoad = session === null;
    if (firstOpenThisLoad) {
      messagesEl.innerHTML = `<div class="ai-widget-greet">Loading your conversation&hellip;</div>`;
    }

    session = await getCurrentSession();

    if (!session?.access_token) {
      renderGate();
      return;
    }

    if (threadId) {
      startPolling();
      pollThread();
    } else {
      await loadExistingThread();
    }

    textarea.focus();
  }

  function closePanel() {
    isOpen = false;
    panel.hidden = true;
    bubble.classList.remove("is-open");
    bubble.setAttribute("aria-expanded", "false");
    stopPolling();
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
        startPolling();
      } else {
        const res = await fetch("/api/live-desk/reply", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ threadId, body }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unable to send message.");
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
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
