# Codex Prompt: Fix Meta (Instagram/Facebook/Threads) Upload Integration

## Context

This is a Node.js Express + Vite storefront (`server.js`, ~6800 lines) for a game mod license key business. It has a Discord bot with a `/upload` slash command that uploads videos to multiple platforms in parallel using `Promise.allSettled()`.

**Working platforms:**
- YouTube (googleapis with OAuth2 refresh token)
- Bluesky (AT Protocol direct API)
- X/Twitter (manual OAuth 1.0a signing with native `crypto`, chunked media upload)

**Broken platforms (just added, need debugging):**
- Instagram Reels
- Facebook Page Video
- Threads

## Current Errors

When running `/upload`, the three Meta platforms fail:

1. **Instagram:** `Failed - Invalid OAuth access token - Cannot parse access token`
2. **Facebook:** `Failed - (#100) No permission to publish the video`
3. **Threads:** `Failed - Invalid OAuth access token - Cannot parse access token`

## What Was Done

1. Created a Meta developer app (App ID: `3889668658008080`)
2. Linked an Instagram Business Account (ID: `17841413800641840`) to a Facebook Page "Halo CC" (Page ID: `1181724485025042`)
3. Enabled permissions: `instagram_basic`, `instagram_content_publish`, `pages_read_engagement`, `pages_show_list`, `threads_basic`, `threads_content_publish`. The permission `pages_manage_posts` was NOT available in the dashboard.
4. Generated a short-lived user token from Graph API Explorer
5. Exchanged it for a long-lived user token via: `GET https://graph.facebook.com/v25.0/oauth/access_token?grant_type=fb_exchange_token&client_id={app_id}&client_secret={app_secret}&fb_exchange_token={short_lived_token}`
6. Queried `me/accounts` with the long-lived user token to get a permanent (non-expiring) Page Access Token
7. Stored that page token as `META_PAGE_TOKEN` env var

## Env Vars (on Render)

```
META_PAGE_TOKEN=<permanent page access token from me/accounts>
META_PAGE_ID=1181724485025042
META_IG_ACCOUNT_ID=17841413800641840
```

## Current Code (in server.js /upload handler)

The upload handler is inside a Discord `interactionCreate` listener. It downloads the video attachment to a buffer, then runs all platform uploads in parallel. The relevant Meta blocks are:

### Instagram Reels (~line 2270)
```javascript
if (metaPageToken && metaIgAccountId) {
  tasks.push((async () => {
    try {
      const containerRes = await fetch(`https://graph.instagram.com/v25.0/${metaIgAccountId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          media_type: "REELS",
          video_url: attachment.url,  // Discord CDN URL
          caption: socialCaption,
          access_token: metaPageToken,
        }),
      });
      const containerData = await containerRes.json();
      if (containerData.error) throw new Error(containerData.error.message);
      const containerId = containerData.id;

      // Poll until container is ready (FINISHED) - up to 5 minutes
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const statusRes = await fetch(`https://graph.instagram.com/v25.0/${containerId}?fields=status_code,status&access_token=${metaPageToken}`);
        const statusData = await statusRes.json();
        if (statusData.status_code === "FINISHED") break;
        if (statusData.status_code === "ERROR") throw new Error(statusData.status || "Container processing failed");
      }

      const pubRes = await fetch(`https://graph.instagram.com/v25.0/${metaIgAccountId}/media_publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creation_id: containerId, access_token: metaPageToken }),
      });
      const pubData = await pubRes.json();
      if (pubData.error) throw new Error(pubData.error.message);
      return `**Instagram:** Posted (ID: ${pubData.id})`;
    } catch (err) {
      console.error("[Instagram]", err.message);
      return `**Instagram:** Failed - ${err.message}`;
    }
  })());
}
```

### Facebook Page Video (~line 2310)
```javascript
if (metaPageToken && metaPageId) {
  tasks.push((async () => {
    try {
      const fbForm = new FormData();
      fbForm.append("source", new Blob([videoBuffer], { type: attachment.contentType }), attachment.name);
      fbForm.append("description", socialCaption);
      fbForm.append("access_token", metaPageToken);
      const fbRes = await fetch(`https://graph-video.facebook.com/v25.0/${metaPageId}/videos`, {
        method: "POST",
        body: fbForm,
      });
      const fbData = await fbRes.json();
      if (fbData.error) throw new Error(fbData.error.message);
      return `**Facebook:** Posted (ID: ${fbData.id})`;
    } catch (err) {
      console.error("[Facebook]", err.message);
      return `**Facebook:** Failed - ${err.message}`;
    }
  })());
}
```

### Threads (~line 2330)
```javascript
if (metaPageToken && metaIgAccountId) {
  tasks.push((async () => {
    try {
      const tContainerRes = await fetch(`https://graph.threads.net/v1.0/${metaIgAccountId}/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          media_type: "VIDEO",
          video_url: attachment.url,  // Discord CDN URL
          text: socialCaption,
          access_token: metaPageToken,
        }),
      });
      const tContainerData = await tContainerRes.json();
      if (tContainerData.error) throw new Error(tContainerData.error.message);
      const tContainerId = tContainerData.id;

      // Poll until ready - up to 5 minutes
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const tStatusRes = await fetch(`https://graph.threads.net/v1.0/${tContainerId}?fields=status,error_message&access_token=${metaPageToken}`);
        const tStatusData = await tStatusRes.json();
        if (tStatusData.status === "FINISHED") break;
        if (tStatusData.status === "ERROR") throw new Error(tStatusData.error_message || "Processing failed");
      }

      const tPubRes = await fetch(`https://graph.threads.net/v1.0/${metaIgAccountId}/threads_publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creation_id: tContainerId, access_token: metaPageToken }),
      });
      const tPubData = await tPubRes.json();
      if (tPubData.error) throw new Error(tPubData.error.message);
      return `**Threads:** Posted (ID: ${tPubData.id})`;
    } catch (err) {
      console.error("[Threads]", err.message);
      return `**Threads:** Failed - ${err.message}`;
    }
  })());
}
```

## Available Variables in Scope

- `attachment` - Discord attachment object with `.url` (CDN URL), `.contentType`, `.name`
- `videoBuffer` - Downloaded video as a Buffer
- `socialCaption` - Caption text with hashtags
- `metaPageToken` - Permanent page access token from env
- `metaPageId` - Facebook Page ID from env
- `metaIgAccountId` - Instagram Business Account ID from env
- `fetch`, `FormData`, `Blob` - From `node-fetch`

## Known Issues to Investigate

1. **Token issue:** "Cannot parse access token" on Instagram and Threads suggests the page token may not be the right token type for these APIs. Instagram Graph API uses page tokens, but Threads API requires a separate Threads-specific user token obtained via Threads OAuth (`https://graph.threads.net/oauth/access_token`). Investigate whether:
   - The page token from `me/accounts` works for Instagram content publishing
   - Threads needs its own separate token flow
   - The token might have been pasted incorrectly into Render (extra whitespace/newlines)

2. **Facebook permission:** `pages_manage_posts` is required to post videos to a Facebook Page but was not available in the Meta app dashboard. The app is in Development mode. Check if `pages_read_engagement` alone is sufficient, or if there's an alternative permission, or if the app needs to go through App Review first.

3. **Threads API differences:** The Threads API uses `graph.threads.net` not `graph.instagram.com`. It may need a different user ID (Threads user ID vs Instagram account ID) and a different access token obtained through the Threads-specific OAuth flow.

## Task

Debug and fix all three Meta platform integrations so they successfully post videos. Make the minimum necessary code changes. After every code change, `git add -A && git commit -m "description" && git push origin master` to trigger Render auto-deploy.

## Tech Stack
- Node.js (ESM, `"type": "module"`)
- Express 5
- discord.js 14
- node-fetch 3
- Deployed on Render (auto-deploys on push to master)
- GitHub repo: Haloch1/Halocheats
