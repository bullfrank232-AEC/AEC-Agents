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

Everything here is optional and designed for **no admin/IT involvement** — you don't need to be a
Microsoft 365 admin for any of it. If you don't have admin rights, skip straight to 3b, or just
use the local dev-login picker indefinitely (it's a fully supported way to run this).

### 3a. Sign-in with Microsoft (optional)

Documents, reminders, and calendar all work without this — it only affects how people log in
(their Microsoft account vs. the local picker). Most Microsoft 365 tenants let any user register
an app (it's a tenant-wide default setting, not an admin role), and this app only requests the
default sign-in scopes (name/email), which don't need admin consent.

1. Go to [entra.microsoft.com](https://entra.microsoft.com) → **Applications** → **App
   registrations** → **New registration**. If you get an "insufficient privileges" error here,
   your org has disabled self-service app registration — ask IT to do just this one step for you,
   or skip this section entirely and keep using the local login picker.
2. Name it (e.g. "Bid Tracker"), leave the default account type (single tenant) unless you know
   you need otherwise, and set the **Redirect URI** to a **Web** platform:
   `http://<your-server>:3000/api/auth/callback/microsoft-entra-id`
   (use `http://localhost:3000/...` while testing locally).
3. After creation, note the **Application (client) ID** and **Directory (tenant) ID** from the
   Overview page.
4. Go to **Certificates & secrets** → **New client secret**. Copy the secret **value**
   immediately (it's hidden after you leave the page).
5. That's it — no API permissions to add, no admin consent to request. Set these in `.env`:
   ```
   AZURE_AD_CLIENT_ID="<Application (client) ID>"
   AZURE_AD_CLIENT_SECRET="<the secret value>"
   AZURE_AD_TENANT_ID="<Directory (tenant) ID>"
   ```

Restart the app. `/settings` should now show "Sign-in with Microsoft" as connected, and the
sign-in page will show a "Sign in with Microsoft" button alongside the local picker.

### 3b. Documents, reminders, and calendar — zero setup

These don't use the Microsoft Graph API at all, so there's nothing to configure and nothing that
can be locked down by IT policy:

- **Documents**: paste a SharePoint/OneDrive share link directly into the bid page (copy the link
  the normal way — right-click the file → Copy link). It's just stored as a URL.
- **Deadline reminders**: click "Email deadline reminder to me" on a bid — it opens a pre-filled
  draft in whatever mail app you already have set up (Outlook, browser Outlook, anything
  registered as your `mailto:` handler).
- **Calendar**: click "Add due date to my calendar" — downloads a standard `.ics` file that
  double-clicks straight into Outlook (or any calendar app).

### 3c. Teams notifications (optional)

1. In the Teams channel you want notifications posted to, go to **⋯** → **Workflows** (or
   **Connectors** on older tenants) → set up an **Incoming Webhook**. This is usually available to
   any channel member, not just admins/owners — try it before assuming you need help.
2. Set `TEAMS_WEBHOOK_URL="<that url>"` in `.env`.

If your channel doesn't allow adding connectors, skip this — nothing else depends on it.

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
