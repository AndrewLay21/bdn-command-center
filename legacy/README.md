# Legacy: ChatGPT Sites / Cloudflare version

Everything in this folder is the recovered Command Center code from November 18, 2026, kept exactly as it was.
It ran on ChatGPT Sites (vinext + Cloudflare Workers + D1) and used ChatGPT sign-in headers and Cloudflare connector bindings,
so it cannot run on Netlify as-is. It is excluded from the Netlify build (see `tsconfig.json` "exclude").

- `chatgpt-sites/` – the old app, API routes, components, scripts, tests and build config.
- `public-docs/` – markdown reports and probe files that used to sit in `public/` (moved so they are not served publicly).

Nothing here was deleted. Pieces can be ported into the Netlify app one at a time when needed.
