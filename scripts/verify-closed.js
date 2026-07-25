const heading = document.getElementById("closedHeading");
const subtext = document.getElementById("closedSubtext");
const statusBox = document.getElementById("closedStatus");
const discordLink = document.getElementById("closedDiscordLink");

/* Browsers only allow window.close() on tabs opened by script - a tab a user
   navigated to directly (which is what Discord's link button opens) usually
   can't be closed this way, and there's no way to detect that in advance.
   So: try it, and always show a clear fallback shortly after in case it
   didn't work, rather than leaving the tab stuck on a blank "closing..."
   screen forever. */
try {
  window.close();
} catch {
  // ignored - fallback below covers this
}

setTimeout(() => {
  if (heading) heading.textContent = "Verification not allowed";
  if (subtext) subtext.textContent = "Check your Discord DMs for details. You can close this tab and go back to Discord.";
  if (statusBox) {
    statusBox.textContent = "You can close this tab now.";
    statusBox.className = "inline-message warn";
  }
  if (discordLink) discordLink.hidden = false;
}, 500);
