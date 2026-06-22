# Halo Cheats Storefront

This site now includes:

- A landing page at `/`
- A products page at `/products/`
- A member account page at `/account/`
- Supabase email/password auth
- Server-side member verification for checkout
- Stripe Checkout session creation
- Order tracking in Supabase
- License-key delivery after paid webhooks

## Run locally

1. Install packages:

```powershell
npm install
```

2. Start the API and frontend together:

```powershell
npm run dev
```

3. Open:

- `http://localhost:3000/`
- `http://localhost:3000/products/`
- `http://localhost:3000/account/`

## Deploy on Render

Create a Render Web Service, not a Static Site. This project needs the Node server
for Stripe, Supabase auth checks, live desk APIs, and webhooks.

Render settings:

```text
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm start
Health Check Path: /api/health
```

After Render gives you a public URL, set:

```env
BASE_URL=https://your-render-service.onrender.com
```

Add every value from `.env.example` in Render's Environment tab. Do not upload
your local `.env` file.

Then update external services:

- Supabase Auth Site URL: `https://your-render-service.onrender.com`
- Supabase Auth Redirect URLs: `https://your-render-service.onrender.com/**`
- Stripe webhook endpoint: `https://your-render-service.onrender.com/api/stripe-webhook`
- Discord webhook can stay the same if the channel is correct.

## Env values

The app expects these values in `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_key
SUPABASE_SECRET_KEY=your_supabase_secret_key

STRIPE_SECRET_KEY=sk_test_replace_me
STRIPE_WEBHOOK_SECRET=whsec_replace_me
BASE_URL=http://localhost:3000

STRIPE_PRICE_CRUSADER_R6_DAY=price_replace_me
STRIPE_PRICE_CRUSADER_R6_WEEK=price_replace_me
STRIPE_PRICE_APTITUDE_AI_SCRIPT_R6_MONTH=price_replace_me
# Add the rest of the Rainbow Six Siege STRIPE_PRICE_* values from .env.example

DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/replace_me
DISCORD_LIVE_DESK_MENTION=@everyone
```

## What still needs your input

### 1. Stripe

You still need to create:

- one Stripe product + price for each catalog item
- a webhook endpoint for `checkout.session.completed`

The catalog setup script can create the Stripe products/prices from `data/products.js`:

```powershell
npm run stripe:setup
```

Copy the returned `priceId` values into the matching `STRIPE_PRICE_*` entries in `.env`.

For local testing, use the Stripe CLI:

```powershell
stripe listen --forward-to http://localhost:4242/api/stripe-webhook
```

Then copy the webhook signing secret into:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 2. Product price IDs

After you create Stripe Prices, paste the IDs into the matching `STRIPE_PRICE_*`
entries listed in `.env.example`.

### 3. License-key stock

Paid orders can only be fulfilled automatically if `public.license_keys` has unused rows for the matching `product_slug`.

Example inserts:

```sql
insert into public.license_keys (product_slug, key_value)
values
  ('crusader-r6-day', 'YOUR-FIRST-DAY-KEY'),
  ('crusader-r6-week', 'YOUR-FIRST-WEEK-KEY'),
  ('aptitude-ai-script-r6-month', 'YOUR-FIRST-MONTH-KEY');
```

### 4. Discord live desk

Create a Discord webhook in the channel where you want support alerts, then paste it into:

```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_LIVE_DESK_MENTION=<@YOUR_USER_ID>
ADMIN_ACCESS_KEY=change_this_admin_key
```

You can also use `@everyone` or a role mention if you want channel-wide alerts.
The hidden admin reply page is `/desk-admin/` and uses `ADMIN_ACCESS_KEY`.

## Current flow

1. User signs in on `/account/`
2. User opens `/products/`
3. User clicks `Pay Now`
4. Server verifies the member token and creates a pending order
5. Stripe Checkout opens
6. Stripe webhook marks the order paid
7. Server assigns the oldest unused key for that product
8. The key appears on `/account/`

The homepage also includes a live desk request form that posts to `/api/live-desk`, creates a support thread, and sends the request to your Discord webhook.
Signed-in users can read replies on `/desk/`.
Admin replies can be sent from `/desk-admin/`.

## Useful Supabase tables

- `public.profiles`
- `public.orders`
- `public.license_keys`

## Notes

- If a paid order has no available key, the order stays `paid` until you add stock and fulfill it.
- The account page reads live orders and keys from the API using the signed-in Supabase session.
- The server uses `SUPABASE_SECRET_KEY`, so keep `.env` private and never ship it to the browser.
