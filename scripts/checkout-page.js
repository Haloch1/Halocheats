import { renderMessage } from "./site.js";

const box = document.querySelector("[data-checkout-message]");
const params = new URLSearchParams(window.location.search);
const sessionId = params.get("session_id");

if (sessionId) {
  renderMessage(
    box,
    `Payment completed. Stripe session: ${sessionId}. Your order is now linked to your account, and any available key will show up on the account page automatically.`,
    "success"
  );
} else {
  renderMessage(
    box,
    "Payment flow returned without a session id. Check Stripe logs if this wasn't expected.",
    "warn"
  );
}
