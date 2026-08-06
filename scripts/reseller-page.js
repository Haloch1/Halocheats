import { getCurrentSession } from "./supabase-client.js";
import { initReveal, renderMessage, currencyLabel } from "./site.js";

initReveal();

const messageBox = document.querySelector("[data-reseller-message]");
const guestView = document.querySelector("[data-reseller-guest]");
const noneView = document.querySelector("[data-reseller-none]");
const pendingView = document.querySelector("[data-reseller-pending]");
const deniedView = document.querySelector("[data-reseller-denied]");
const approvedView = document.querySelector("[data-reseller-approved]");

const tierLabel = document.querySelector("[data-reseller-tier]");
const balanceLabel = document.querySelector("[data-reseller-balance]");
const discountLabel = document.querySelector("[data-reseller-discount]");
const keyLast4Label = document.querySelector("[data-reseller-key-last4]");
const websiteLabel = document.querySelector("[data-reseller-website]");
const discordServerLabel = document.querySelector("[data-reseller-discord-server]");
const volumeLabel = document.querySelector("[data-reseller-volume]");

function hideAll() {
  [guestView, noneView, pendingView, deniedView, approvedView].forEach((view) => {
    if (view) {
      view.hidden = true;
    }
  });
}

function centsToLabel(cents) {
  const value = Number(cents || 0) / 100;
  return currencyLabel(Number(value.toFixed(2)));
}

async function loadResellerStatus() {
  const session = await getCurrentSession();

  if (!session?.access_token) {
    hideAll();
    if (guestView) {
      guestView.hidden = false;
    }
    return;
  }

  try {
    const response = await fetch("/api/reseller/me", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      credentials: "same-origin",
    });

    if (!response.ok) {
      throw new Error("Unable to load reseller status.");
    }

    const data = await response.json();
    hideAll();

    if (data.status === "none" || !data.reseller) {
      if (noneView) {
        noneView.hidden = false;
      }
      return;
    }

    if (data.status === "pending") {
      if (pendingView) {
        pendingView.hidden = false;
      }
      return;
    }

    if (data.status === "denied") {
      if (deniedView) {
        deniedView.hidden = false;
      }
      return;
    }

    if (data.status === "approved") {
      const reseller = data.reseller;
      if (tierLabel) {
        tierLabel.textContent = (reseller.tier || "new").toUpperCase();
      }
      if (balanceLabel) {
        balanceLabel.textContent = centsToLabel(reseller.balance_cents);
      }
      if (discountLabel) {
        discountLabel.textContent = `${reseller.discount_percent ?? 0}% off catalog`;
      }
      if (keyLast4Label) {
        keyLast4Label.textContent = reseller.api_key_last4 ? `...${reseller.api_key_last4}` : "not issued yet";
      }
      if (websiteLabel) {
        websiteLabel.textContent = `Website: ${reseller.website || "—"}`;
      }
      if (discordServerLabel) {
        discordServerLabel.textContent = `Discord: ${reseller.discord_server || "—"}`;
      }
      if (volumeLabel) {
        volumeLabel.textContent = `Lifetime purchased: ${centsToLabel(reseller.lifetime_purchased_cents)}`;
      }
      if (approvedView) {
        approvedView.hidden = false;
      }
      return;
    }

    if (noneView) {
      noneView.hidden = false;
    }
  } catch (error) {
    renderMessage(messageBox, error.message || "Unable to load your reseller status right now.", "error");
  }
}

loadResellerStatus();
