# Big Dreams Network Command Center

This is the Big Dreams Network Command Center app. It is the recovered master copy of the code.

It was recovered on November 18, 2026 from the ChatGPT Command Center project, after the live copy could not be opened from there.

The recovered records spreadsheet is at `data/command-center-records-2026-11-18.xlsx`:

- 81 tasks
- 246 portfolio items
- 10 tickets

The image files under `public/images/` (team portraits and platform logos) and the records spreadsheet were added on November 18, 2026, so this copy is complete.

**Rule going forward:** all code lives in this GitHub repository. All records (tasks, portfolio, tickets, and day-to-day lists) live in Google Drive and Sheets.

## Now on Netlify (November 19, 2026)

The app now runs on Netlify with a "Paper" look: Next.js App Router, TypeScript, Tailwind, Drizzle and Netlify DB (Postgres).
The whole site is behind one owner password. See `DEPLOY.md` for setup, environment variables and updates.

The old ChatGPT Sites / Cloudflare code is kept, unchanged, in `legacy/` (see `legacy/README.md`).
