# XenCheats Operations Setup

## Backups

Supabase's managed backups are the primary recovery layer. In Supabase, enable daily
backups/PITR on a plan that supports it. For an independent copy, install PostgreSQL
tools on a secure machine and run:

```powershell
$env:SUPABASE_DB_URL = "postgresql://..."
node scripts/backup-supabase.mjs
```

Copy each generated `.dump` file to private offsite storage (for example R2, S3, or an
encrypted drive). Render's filesystem is ephemeral, so do not treat a Render disk as a
backup destination. Test a restore in a separate Supabase project before relying on it.

## Error Monitoring

Set `DISCORD_ERROR_CHANNEL_ID=1530317219337076837` in Render. The server reports
unhandled failures there, with repeated identical failures limited to one alert every
five minutes. It redacts long token-like strings before posting.

## Google Sign-in

1. In Google Cloud Console, create or select a project and enable the Google OAuth
   consent screen as **External**. Use `XenCheats` as the app name.
2. Add `xencheats.wtf` as an authorized domain and add yourself as a test user while
   the consent screen remains in testing.
3. Create an OAuth client of type **Web application**. Add this exact redirect URI:
   `https://xencheats.wtf/api/auth/google/callback`.
4. In Render, add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, and verify
   `PUBLIC_SITE_URL` and `BASE_URL` are both `https://xencheats.wtf`.
5. Redeploy, then test in a private browser window. Once public users need access,
   publish the consent screen. This project only requests `openid`, `email`, and
   `profile`; do not add sensitive scopes unless they are genuinely needed.

## Apple Sign-in

Apple requires an Apple Developer membership. Create a Services ID for the website,
add `https://xencheats.wtf/api/auth/apple/callback` as its return URL, then generate a
Sign in with Apple key. Store its values only in Render as `APPLE_CLIENT_ID`,
`APPLE_TEAM_ID`, `APPLE_KEY_ID`, and `APPLE_PRIVATE_KEY`. Do not enable an Apple button
until the callback route is deployed and tested.

## Admin 2FA

Use app-based TOTP rather than emailed codes. Generate an encryption key with:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Store it as `ADMIN_TOTP_ENCRYPTION_KEY` in Render. Set `ADMIN_TOTP_REQUIRED=true` only
after the admin 2FA migration and enrollment flow are deployed; otherwise admins could
be locked out. Never put this key in Git or Discord.
