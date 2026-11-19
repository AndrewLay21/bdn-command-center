# Deploying the Big Dreams Command Center to Netlify

The live app is a Next.js (App Router) + TypeScript + Tailwind + Drizzle app, hosted on Netlify with
`@netlify/plugin-nextjs` and Netlify DB (Neon Postgres). Every page is behind one owner password.

## What runs where

| Piece | Where |
| --- | --- |
| Pages: Today (`/`), `/tasks`, `/tickets`, `/portfolio`, detail pages, `/login` | `app/` |
| Login lock on every request | `proxy.ts` (plus a second check in `app/(app)/layout.tsx`) |
| Session + password check | `lib/session.ts`, `app/login/actions.ts`, `lib/rate-limit.ts` |
| Database tables (Drizzle) | `db/schema.ts`, `db/index.ts`, `netlify/database/migrations/` |
| Starting records (81 tasks, 246 portfolio items, 10 tickets) | `data/records.json` (made from `data/command-center-records-2026-11-18.xlsx`) |
| Old ChatGPT Sites / Cloudflare code (not built) | `legacy/` |

## Environment variables (set in Netlify, never in git)

| Name | What it is |
| --- | --- |
| `COMMAND_CENTER_PASSWORD` | The one owner password. Long and random. Changing it signs everyone out. |
| `NETLIFY_DATABASE_URL` | Set by Netlify DB (`netlify db init`). Some sites get `NETLIFY_DB_URL`; the app reads either. Do not set by hand. |
| `SESSION_SECRET` | Optional. If set, sessions are signed with it instead of a key made from the password. |

## First-time setup

```bash
npm install
npx netlify login                      # or export NETLIFY_AUTH_TOKEN=<your token>
npx netlify sites:create --name bdn-command-center
npx netlify link --id <site-id>
npx netlify db init                    # creates the Neon Postgres database and NETLIFY_DATABASE_URL
npx netlify env:set COMMAND_CENTER_PASSWORD "<long-random-password>" --secret
npx netlify deploy --build --prod
```

On its first request the site creates its tables and loads `data/records.json` into them.
It only loads into **empty** tables, so it never overwrites real data. To do it by hand instead:

```bash
NETLIFY_DATABASE_URL="<postgres-url>" npm run db:seed
```

## Everyday updates

- Code change: push to GitHub, then `npx netlify deploy --build --prod` (or connect the repo in Netlify for auto-deploys).
- Change the password: `npx netlify env:set COMMAND_CENTER_PASSWORD "<new-password>" --secret`, then redeploy.
- New records spreadsheet: put it in `data/`, run `npm run records:import -- data/<file>.xlsx`
  (needs Python + openpyxl). The site only seeds empty tables, so to replace live data you must clear the tables first. Ask before doing that.

## Local preview

```bash
npm install
COMMAND_CENTER_PASSWORD="<any-local-password>" npm run dev
```

Without a database URL the app reads `data/records.json` directly (read-only preview mode, shown on the Today page).

## Security notes

- Whole site requires login; `/login` is the only open page. `robots.txt` blocks everything, and every response sends `X-Robots-Tag: noindex`.
- Password check hashes both sides and compares in constant time. Session cookie is `httpOnly`, `secure`, `SameSite=Lax`, signed with HMAC-SHA256, 14-day expiry.
- Login rate limit: 5 wrong tries per IP (and 40 overall) in 15 minutes, stored in the `login_attempts` table.
