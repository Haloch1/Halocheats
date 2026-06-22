import { initReveal, renderMessage } from "./site.js";

initReveal();

const ADMIN_KEY_STORAGE = "halo-admin-desk-key";
const REFRESH_INTERVAL_MS = 15000;

const messageBox = document.querySelector("[data-admin-message]");
const accessForm = document.querySelector("[data-admin-access-form]");
const deskShell = document.querySelector("[data-admin-desk]");
const threadList = document.querySelector("[data-admin-thread-list]");
const threadTitle = document.querySelector("[data-admin-thread-title]");
const threadMeta = document.querySelector("[data-admin-thread-meta]");
const threadMessages = document.querySelector("[data-admin-thread-messages]");
const replyForm = document.querySelector("[data-admin-reply-form]");

let activeThreads = [];
let activeThreadId = null;

function formatTimestamp(value) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getAdminKey() {
  return window.localStorage.getItem(ADMIN_KEY_STORAGE) || "";
}

function setAdminKey(value) {
  window.localStorage.setItem(ADMIN_KEY_STORAGE, value);
}

function shouldPauseRefresh() {
  const activeElement = document.activeElement;
  const replyDraft = String(replyForm?.elements?.body?.value || "").trim();

  return Boolean(
    activeElement &&
      replyForm?.contains(activeElement) &&
      (activeElement.tagName === "TEXTAREA" || replyDraft.length)
  );
}

function renderActiveThread(thread) {
  activeThreadId = thread.id;
  threadTitle.textContent = thread.subject;
  threadMeta.textContent = `${thread.contactName || "Unknown"} | ${
    thread.contactMethod || "No contact"
  } | ${thread.status.toUpperCase()}`;
  replyForm.hidden = false;
  replyForm.elements.status.value = thread.status;

  threadMessages.innerHTML = thread.messages
    .map(
      (message) => `
        <article class="desk-message-bubble desk-message-bubble-${message.senderType}">
          <span>${message.senderType === "admin" ? "Support" : "Member"}</span>
          <p>${message.body}</p>
          <small>${formatTimestamp(message.createdAt)}</small>
        </article>
      `
    )
    .join("");

  threadList.querySelectorAll(".desk-thread-item").forEach((item) => {
    item.classList.toggle("is-active", item.dataset.threadId === thread.id);
  });
}

function renderThreads(threads) {
  activeThreads = threads;

  if (!threads.length) {
    threadList.innerHTML = '<div class="member-empty">No support threads yet.</div>';
    threadTitle.textContent = "Select a thread";
    threadMeta.textContent = "Pick a thread from the left to review the conversation and send a reply.";
    threadMessages.innerHTML = '<div class="member-empty">No thread selected.</div>';
    replyForm.hidden = true;
    return;
  }

  threadList.innerHTML = threads
    .map(
      (thread) => `
        <button class="desk-thread-item" type="button" data-thread-id="${thread.id}">
          <div class="desk-thread-item-top">
            <strong>${thread.subject}</strong>
            <span class="member-chip member-chip-${thread.status}">${thread.status}</span>
          </div>
          <p>${thread.contactName || "Unknown"} | ${thread.contactMethod || "No contact"}</p>
          <small>${formatTimestamp(thread.lastMessageAt || thread.updatedAt || thread.createdAt)}</small>
        </button>
      `
    )
    .join("");

  const nextThread = threads.find((thread) => thread.id === activeThreadId) || threads[0];
  renderActiveThread(nextThread);
}

async function loadThreads() {
  const adminKey = getAdminKey();

  if (!adminKey) {
    renderMessage(messageBox, "Enter the admin desk key to load support threads.", "info");
    deskShell.hidden = true;
    return;
  }

  const response = await fetch("/api/admin/live-desk", {
    headers: {
      "x-admin-key": adminKey,
    },
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Unable to load admin desk threads.");
  }

  deskShell.hidden = false;
  renderMessage(
    messageBox,
    "Admin desk unlocked. Replies from here show up in the member inbox.",
    "success"
  );
  renderThreads(payload.threads || []);
}

threadList?.addEventListener("click", (event) => {
  const button = event.target.closest(".desk-thread-item");

  if (!button) {
    return;
  }

  const thread = activeThreads.find((item) => item.id === button.dataset.threadId);

  if (thread) {
    renderActiveThread(thread);
  }
});

accessForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(accessForm);
  const adminKey = String(formData.get("adminKey") || "").trim();

  if (!adminKey) {
    return;
  }

  setAdminKey(adminKey);

  try {
    await loadThreads();
  } catch (error) {
    renderMessage(
      messageBox,
      error instanceof Error ? error.message : "Unable to unlock the admin desk.",
      "error"
    );
  }
});

replyForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!activeThreadId) {
    return;
  }

  const adminKey = getAdminKey();
  const formData = new FormData(replyForm);
  const body = String(formData.get("body") || "").trim();
  const status = String(formData.get("status") || "pending");

  if (!body) {
    return;
  }

  const submitButton = replyForm.querySelector('button[type="submit"]');

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Sending Reply...";
  }

  try {
    const response = await fetch("/api/admin/live-desk/reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey,
      },
      body: JSON.stringify({
        threadId: activeThreadId,
        body,
        status,
      }),
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Unable to send the reply.");
    }

    replyForm.reset();
    await loadThreads();
    renderMessage(messageBox, "Reply sent. The member can now see it in their desk inbox.", "success");
  } catch (error) {
    renderMessage(
      messageBox,
      error instanceof Error ? error.message : "Unable to send the reply.",
      "error"
    );
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Send Reply";
    }
  }
});

try {
  await loadThreads();
} catch (error) {
  renderMessage(
    messageBox,
    error instanceof Error ? error.message : "Unable to load admin desk threads.",
    "error"
  );
}

window.setInterval(() => {
  if (shouldPauseRefresh()) {
    return;
  }

  loadThreads().catch(() => {});
}, REFRESH_INTERVAL_MS);
