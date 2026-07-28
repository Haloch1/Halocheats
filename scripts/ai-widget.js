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
        <div class="ai-widget-headactions">
          <button type="button" class="ai-widget-headbtn ai-widget-newchat" hidden>New chat</button>
          <button type="button" class="ai-widget-headbtn ai-widget-endchat" hidden>Close</button>
          <button type="button" class="ai-widget-close" aria-label="Close chat">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
      <div class="ai-widget-body">
        <div class="ai-widget-messages"></div>
        <button type="button" class="ai-widget-scrollbtn" aria-label="Jump to latest message" hidden>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
        </button>
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
  const newChatBtn = root.querySelector(".ai-widget-newchat");
  const endChatBtn = root.querySelector(".ai-widget-endchat");
  const messagesEl = root.querySelector(".ai-widget-messages");
  const scrollBody = root.querySelector(".ai-widget-body");
  const scrollBtn = root.querySelector(".ai-widget-scrollbtn");
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

  /* NOTE: the element that actually scrolls is .ai-widget-body (it has
     overflow-y: auto) — .ai-widget-messages is just a plain flex column
     that grows to fit its content, so its own scrollTop/scrollHeight never
     change. Scroll math has to target scrollBody, not messagesEl, or every
     "how far from the bottom" check silently reads as "always at the
     bottom" and the jump button never has a reason to appear. */

  /* Little "jump to latest" button: shows once the member has scrolled up
     to read earlier messages, so they don't have to manually swipe/scroll
     all the way back down to see new replies come in. Tracked as an
     explicit flag (not re-derived from geometry on every render) so it
     stays visible/sticky the whole time the member is scrolled up, instead
     of a background poll or AI-thinking re-render silently snapping the
     view back down and hiding it mid-read. */
  let userScrolledUp = false;

  function isNearBottom() {
    return scrollBody.scrollHeight - scrollBody.scrollTop - scrollBody.clientHeight < 48;
  }

  function scrollToEnd() {
    scrollBody.scrollTop = scrollBody.scrollHeight;
    userScrolledUp = false;
    scrollBtn.hidden = true;
  }

  function updateScrollBtn() {
    var canScroll = scrollBody.scrollHeight > scrollBody.clientHeight + 20;
    scrollBtn.hidden = !canScroll || !userScrolledUp;
  }

  scrollBody.addEventListener(
    "scroll",
    function () {
      userScrolledUp = !isNearBottom();
      updateScrollBtn();
    },
    { passive: true }
  );
  scrollBtn.addEventListener("click", function () {
    scrollBody.scrollTo({ top: scrollBody.scrollHeight, behavior: "smooth" });
    userScrolledUp = false;
    scrollBtn.hidden = true;
  });

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

  /* "New chat" only makes sense once a conversation exists; "Close" only
     makes sense while one is active. Keep both hidden otherwise. */
  function updateHeadActions() {
    newChatBtn.hidden = !threadId;
    endChatBtn.hidden = !threadId;
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
    const shouldStickToBottom = isBaseline || !userScrolledUp;

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

    /* Only auto-snap to the newest message if the member was already at (or
       near) the bottom — otherwise a poll landing mid-read would yank them
       away from what they're reading. If they've scrolled up, leave them be
       and let the "jump to latest" button do its job instead. */
    if (shouldStickToBottom) {
      scrollToEnd();
    } else {
      updateScrollBtn();
    }

    updateHeadActions();
  }

  /* Resets the widget to a blank slate, ready for a new conversation.
     Called both when the member closes/starts a new chat locally, and when
     a poll finds the thread was closed from the admin panel/Discord side. */
  function resetToFreshConversation({ notice } = {}) {
    threadId = null;
    activeThread = null;
    knownMessageIds = new Set();
    userScrolledUp = false;
    stopPolling();
    if (notice) {
      messagesEl.innerHTML = `<div class="ai-widget-greet"><p>${esc(notice)}</p></div>`;
    } else {
      renderStarter();
    }
    updateHeadActions();
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
      if (!thread) return;
      if (thread.status === "closed") {
        // Closed from the admin panel/Discord side — drop back to a fresh
        // conversation instead of continuing to poll a dead thread.
        resetToFreshConversation({ notice: "This conversation was closed by support. Send a message to start a new one." });
        return;
      }
      renderThread(thread);
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
      // Only auto-resume a thread that's still OPEN. A closed conversation
      // (member closed it, or staff did) should not be silently re-adopted
      // as "the" conversation — the member starts fresh instead.
      const open = (data.threads || []).find((t) => t.status === "open");
      if (open) {
        threadId = open.id;
        renderThread(open, { isBaseline: true });
        startPolling(POLL_MS_BACKGROUND);
      } else {
        updateHeadActions();
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
    updateHeadActions();

    // Don't auto-focus on touch devices — it pops the on-screen keyboard
    // immediately on open, which is jarring on mobile. Desktop/mouse users
    // still get the convenience of landing in the input.
    if (!window.matchMedia("(pointer: coarse)").matches) {
      textarea.focus();
    }
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

  /* Ends the current conversation server-side so it stops showing as the
     account's "open" thread. Shared by both the Close and New chat
     buttons — a new chat is just "close the old one, then start blank". */
  async function endCurrentConversation() {
    if (!threadId || !session?.access_token) return;
    const closingId = threadId;
    try {
      await fetch("/api/live-desk/close", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ threadId: closingId }),
      });
    } catch {
      /* If the request fails the thread just stays open server-side; the
         member can try again. Reset the local view regardless so they're
         not stuck. */
    }
  }

  endChatBtn.addEventListener("click", async () => {
    if (!threadId) return;
    if (!window.confirm("Close this conversation? You can start a new one any time.")) return;
    endChatBtn.disabled = true;
    await endCurrentConversation();
    endChatBtn.disabled = false;
    resetToFreshConversation({ notice: "Conversation closed. Send a message any time to start a new one." });
  });

  newChatBtn.addEventListener("click", async () => {
    if (!threadId) return;
    newChatBtn.disabled = true;
    await endCurrentConversation();
    newChatBtn.disabled = false;
    resetToFreshConversation();
    textarea.focus();
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
        updateHeadActions();
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
