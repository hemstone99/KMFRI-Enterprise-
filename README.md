<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/2c6cafcb-458d-4975-bfc1-ce8f74b9935b

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Database & API

The site reads its catalogue (services, tariffs, capabilities, requirements, stations,
research fleet, KeNODC datasets, service charter) from the MySQL database
`kmfri_services_db`, and quotation requests are stored there via
`sp_register_service_inquiry`.

| Path | Purpose |
| --- | --- |
| `db/001_kmfri_services_db.sql` | Schema, seed data, views, stored procedures |
| `db/002_hub_display_content.sql` | Station descriptions + service photos used by the site |
| `server/` | Express API (`/api/services`, `/api/stations`, `/api/charter`, `POST /api/inquiries`) |

**Requirements:** MySQL 8.0+ or MariaDB 10.4+, Node.js 20+.

1. Copy `.env.example` to `.env.local` and set `DB_PASSWORD` (the app account) and
   `DB_ADMIN_USER` / `DB_ADMIN_PASSWORD` (an account that can create databases and users).
2. `npm run db:setup` — builds the database and creates the least-privilege `kmfri_hub`
   account (SELECT + EXECUTE only). **Re-running it resets all data to the seed.**
3. Development: `npm run server` (API on port 4000) and `npm run dev` (Vite proxies `/api`).
4. Production: `npm run build` then `npm start` — serves `dist/` and the API on `API_PORT`.

If the API is unreachable the site falls back to the bundled catalogue and disables
online quotation requests (visitors are shown the inquiries hotline instead).

> On this machine the project path contains `&`, which breaks npm's command shims on
> Windows. Run the tools directly, e.g. `node node_modules/tsx/dist/cli.mjs server/setup.ts`.
