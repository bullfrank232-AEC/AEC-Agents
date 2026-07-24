# Bid Tracker

A local web app for tracking your bidding process across departments (Estimating, Project
Management, Engineering, Procurement/Purchasing, Business Development), integrated with
Microsoft 365 (optional Microsoft sign-in, SharePoint document links, Outlook reminders/calendar,
Teams notifications). Everything works with no Microsoft 365 admin rights required — see
[SETUP.md](./SETUP.md).

Built with Next.js (App Router), Prisma + SQLite, and NextAuth (Azure AD / Microsoft Entra ID).

## Quick start

```bash
npm install
npx prisma migrate dev   # creates prisma/dev.db and applies the schema
npx prisma db seed       # loads the 5 departments + a couple of demo bids
npm run dev
```

Open http://localhost:3000. Without any Microsoft 365 configuration, you'll land on a sign-in
page with a "Sign in as (dev only)" picker — pick one of the seeded users to explore the app.

For full setup, including connecting Microsoft 365 and running this for your whole office, see
**[SETUP.md](./SETUP.md)**.

## What's here

- **Dashboard** (`/`) — bids grouped by status, filterable by department
- **Bid detail** (`/bids/[id]`) — status changes, activity/notes log, assigned users, linked
  document URLs, email/calendar reminders
- **New / edit bid** (`/bids/new`, `/bids/[id]/edit`)
- **Settings** (`/settings`) — shows which optional Microsoft 365 integrations are connected
- **Sign-in** (`/signin`) — Microsoft sign-in (if configured), plus a local dev-only fallback

## Project structure

- `prisma/schema.prisma` — data model (Department, User, Bid, BidDocument, BidActivity,
  BidAssignment)
- `prisma/seed.ts` — seed script (departments + demo data)
- `src/lib/auth.ts` — NextAuth config (Azure AD provider + local dev fallback)
- `src/lib/graph/` — `teams.ts` (webhook notifications), `outlook.ts` (mailto/.ics builders),
  `sharepoint.ts` (document link storage), `config.ts` (connection-status checks)
- `src/app/` — pages, layout, and server actions (`actions.ts`)

## Replacing your Access database

This ships with a default schema based on common AEC bidding fields, not your actual Access
tables (I couldn't read your local Access file from this environment). See the "Importing your
Access data" section in [SETUP.md](./SETUP.md) once you're ready to bring your real data over —
you may also want to adjust `prisma/schema.prisma` first if your fields differ meaningfully from
the default model.

## Common commands

```bash
npm run dev        # start the app locally
npm run build       # production build
npm run lint         # lint
npx prisma studio    # browse/edit the database in a GUI
npx prisma migrate dev --name <change>   # after editing schema.prisma
```
