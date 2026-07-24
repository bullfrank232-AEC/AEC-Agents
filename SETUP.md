# Setup guide

## 1. Run it locally

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Visit http://localhost:3000. Without Microsoft 365 configured (below), you can still use the
whole app — sign in via the "Sign in as (dev only)" picker on `/signin`, which lets you pick any
seeded user with no password. This fallback is controlled by `ALLOW_LOCAL_LOGIN` (see `.env`) and
is meant for testing before Azure AD is wired up, or for local development.

## 2. Run it for your office

This app is a single Node process — anyone on your office network can use it once it's running on
a shared PC or small server:

```bash
npm run build
npm run start   # serves on port 3000 by default; set PORT to change it
```

Then point coworkers at `http://<that machine's hostname or IP>:3000`. A few things to set for a
shared deployment:

- Set `NEXTAUTH_URL` (or `AUTH_URL`) to that machine's actual address, e.g.
  `http://bidserver.office.local:3000` — Azure AD sign-in redirects need to match this exactly.
- Generate a real `AUTH_SECRET` (don't reuse the one from `.env` in this repo):
  `openssl rand -base64 32`
- The SQLite database lives at `dev.db` in the project root — back this up regularly (it's just a
  file, so a scheduled copy to another drive/share is enough).
- Once your Azure AD app is registered (below), set `ALLOW_LOCAL_LOGIN=false` so the dev-only
  sign-in picker isn't available to your whole office.

## 3. Connect Microsoft 365

All of this is optional — the app works without it, just without the M365 features. Check
`/settings` in the running app to see what's connected.

### 3a. Register an app in Microsoft Entra ID

You'll need a Microsoft 365 admin (or Application Administrator role) for this part.

1. Go to [entra.microsoft.com](https://entra.microsoft.com) → **Applications** → **App
   registrations** → **New registration**.
2. Name it (e.g. "Bid Tracker"), leave the default account type (single tenant) unless you know
   you need otherwise, and set the **Redirect URI** to a **Web** platform:
   `http://<your-server>:3000/api/auth/callback/microsoft-entra-id`
   (use `http://localhost:3000/...` while testing locally).
3. After creation, note the **Application (client) ID** and **Directory (tenant) ID** from the
   Overview page.
4. Go to **Certificates & secrets** → **New client secret**. Copy the secret **value**
   immediately (it's hidden after you leave the page).
5. Go to **API permissions** → **Add a permission** → **Microsoft Graph** → **Delegated
   permissions**, and add:
   - `User.Read` (usually added by default)
   - `Sites.ReadWrite.All` (SharePoint documents) — or the narrower `Files.ReadWrite.All` if you
     prefer per-drive access
   - `Mail.Send` (Outlook reminder emails)
   - `Calendars.ReadWrite` (Outlook calendar events)
   - `offline_access` (keeps users signed in / lets the app refresh tokens)
   Click **Grant admin consent** for your organization.

6. Set these in `.env`:
   ```
   AZURE_AD_CLIENT_ID="<Application (client) ID>"
   AZURE_AD_CLIENT_SECRET="<the secret value>"
   AZURE_AD_TENANT_ID="<Directory (tenant) ID>"
   ```

Restart the app. `/settings` should now show "Sign-in with Microsoft" and "Outlook email &
calendar" as connected, and the sign-in page will show a "Sign in with Microsoft" button.

### 3b. SharePoint documents

Bid documents are linked (not copied) from a SharePoint document library you choose.

1. Find your **Site ID**: with an admin account, visit
   `https://graph.microsoft.com/v1.0/sites/<yourtenant>.sharepoint.com:/sites/<sitename>` in a
   browser while signed in, or use the [Graph Explorer](https://developer.microsoft.com/graph/graph-explorer)
   to run `GET /sites/<yourtenant>.sharepoint.com:/sites/<sitename>` and copy the `id` field.
2. Find your **Drive ID** (the document library): `GET /sites/<siteId>/drives` and copy the `id`
   of the library you want (usually "Documents").
3. Set:
   ```
   SHAREPOINT_SITE_ID="<site id>"
   SHAREPOINT_DRIVE_ID="<drive id>"
   ```

Restart the app. Bid detail pages will now show a document picker for anyone signed in with
Microsoft.

### 3c. Teams notifications

1. In the Teams channel you want notifications posted to, go to **⋯** → **Workflows** (or
   **Connectors** on older tenants) → set up an **Incoming Webhook**. Name it, optionally give it
   an icon, and copy the webhook URL it gives you.
2. Set `TEAMS_WEBHOOK_URL="<that url>"` in `.env`.

This one doesn't need the Azure AD app registration — it works independently, as soon as the
webhook URL is set.

## 4. Importing your Access data

This app ships with a starter schema (`prisma/schema.prisma`) based on common AEC bidding fields
— it isn't a copy of your Access tables, since I couldn't read your local `.accdb` file from this
environment. To bring your real data over:

1. In Access, export each table you want to migrate to CSV (**External Data** → **Export** →
   **Text File**, CSV format).
2. Compare your exported columns to `prisma/schema.prisma`. If your Access schema has meaningfully
   different fields (e.g. extra bid stages, custom department names, additional tracked fields),
   edit `schema.prisma` first and run `npx prisma migrate dev --name match_access_schema`.
3. Write a one-off import script (in `prisma/`) that reads each CSV (e.g. with a small CSV parser
   or `String.split(",")` for simple files) and calls `prisma.<model>.createMany(...)`, mapping
   your old column names to the new field names. This is specific enough to your actual data that
   it's best done once we can see the real export — happy to write this script directly if you
   share the exported CSVs or the table/column list.

## Environment variable reference

See `.env.example` for the full list with comments.
