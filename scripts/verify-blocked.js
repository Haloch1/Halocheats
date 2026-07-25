import { initReveal } from "./site.js";

initReveal();

// Show the same short reason the Discord DM gave, so the site and the bot
// message never contradict each other.
const reason = new URLSearchParams(window.location.search).get("reason");
const heading = document.getElementById("blockedHeading");
if (reason && heading) {
  heading.textContent = reason;
}
