# KMFRI Commercial & Enterprise Services Hub

The Enterprise Services Hub for the Kenya Marine and Fisheries Research Institute,
built as a **Drupal 10.3+ / 11 module and theme** (PHP 8.1+) in the kmfri.go.ke design.
It publishes the commercial service catalogue, tariffs, research stations and
laboratory services, and records quotation requests in the MySQL/MariaDB database
`kmfri_services_db`.

| Path | Purpose |
| --- | --- |
| `drupal/modules/kmfri_enterprise/` | Module: routes, controllers, Twig templates, quotation form, header/footer blocks, main-menu links, JSON API, Drush commands |
| `drupal/modules/kmfri_enterprise/sql/` | `001_kmfri_services_db.sql` (schema, seed data, views, stored procedures), `002_hub_display_content.sql` (station descriptions, service photos), `003_admin_workflow.sql` (inquiry status procedure), `004_service_catalogue.sql` (the Service Catalogue as tables — generated, see *Rebuilding the assets*) and `005_catalogue_tariffs.sql` (catalogue tariffs as pricing tiers, charter fee summaries, `v_catalogue_tariffs`) |
| `drupal/modules/kmfri_enterprise/data/` | `catalogue.json` (the Service Catalogue — generated, see *Rebuilding the assets*), editorial content `hub.yml` (hero slides, homepage sections, contacts), `laboratories.yml` (Laboratory Services, from kmfri.go.ke), `fallback.yml` (read-only portfolio data if the database is down) |
| `drupal/themes/kmfri_hub/` | Theme: page layout, block placements, logo |
| `drupal/build/` | Asset build (CSS + icon sprite); outputs are committed |
| `drupal/settings.kmfri.example.php` | `settings.php` snippet for the database connection |

## Pages

| URL | Page |
| --- | --- |
| `/enterprise` | Home (brief): hero slider, catalogue divisions, ready-to-order prices, how it works, request banner |
| `/enterprise/catalogue[/{division}[/{group}[/{subgroup}]]]` | Service Catalogue — every level has its own address, e.g. `/enterprise/catalogue/laboratory/biota/proximate`. Division pages carry the portfolio (scope, who it is for, how to apply, contacts, fleet, datasets). `?q=` and `?channel=online\|priced` filter |
| `/enterprise/services`, `/enterprise/services/{slug}` | Former directory and portfolio pages: 301 redirects into the catalogue |
| `/enterprise/laboratories`, `/enterprise/laboratories/{ocean-coastal\|freshwater\|aquaculture}` | Laboratory Services |
| `/enterprise/stations` | Research stations directory (one card per station) |
| `/enterprise/stations/{station}` | One station, e.g. `/enterprise/stations/mombasa`: overview, contacts, every catalogue service offered there, booking (quotation links carry `?station=` so the form preselects the centre). A station id redirects to its slug |
| `/enterprise/charter` | Tariffs & Charter: the complete tariff schedule (every catalogue service with its price, plus the standard rates of vessel charter, conference halls, datasets, consultancy …), service delivery standards and charter commitments. `?q=` filters the schedule |
| `/enterprise/request-quote?service={slug}[&item={register no.}|&tier={id}]` | Quotation request (Form API, AJAX tariffs, flood control). Every "Get a quote" button passes `item`, which preselects that service's tariff |
| `/api/kmfri/{health,services,services/{slug},stations,charter}` | Read-only JSON |
| `/admin/config/services/kmfri-enterprise` | Settings: connection key, flood limits, reload catalogue |

## Administration dashboard

`/admin/kmfri` (also linked from Drupal's *Administration* menu) is a staff dashboard in the
hub design with its own sidebar, top bar (inquiry search, pending-requests bell, user menu)
and responsive layout:

| Page | What it does |
| --- | --- |
| Overview | KPIs (inquiries, awaiting review, open pipeline value, paid & fulfilled, satisfaction, catalogue), inquiries per month, pipeline by status, most-requested services, latest inquiries, recent activity |
| Inquiries | Search, status / service / date filters, sortable columns, pager, CSV export; detail page with workflow progress, client particulars, audit trail and status update |
| Catalogue | Database sync check (website catalogue vs `kmfri_services_db`), service areas, every catalogue service with its tariff, quotable tier and requests (searchable), standard rates, portfolios and stations; reload from the database |
| Users | Account search and role / status filters, bulk block, unblock, add or remove roles |
| Activity log | Inquiry workflow audit trail (kmfri_services_db) and hub/account events (Drupal dblog) |
| Settings | Database connection key, quotation flood limits, links to related Drupal configuration |

Status changes go through `sp_update_inquiry_status` (`sql/003_admin_workflow.sql`), which
enforces the workflow *pending → under review → quote issued → invoice generated → paid →
fulfilled* (or *cancelled*, which requires a reason) and writes the audit row in one
transaction; the application account still has no direct write access to tables.

| Permission | Granted by role | Allows |
| --- | --- | --- |
| `access kmfri dashboard` | Hub viewer, Hub manager | Overview, inquiries (read-only), catalogue, activity log |
| `manage kmfri inquiries` | Hub manager | Status changes and CSV export (client contact data) |
| `administer users` (core) | — | The Users page |
| `administer kmfri enterprise hub` | — | Settings and catalogue reload |

The *Hub viewer* and *Hub manager* roles are installed with the module. Sites that installed
the module before the dashboard existed get them with
`drush php:eval "\Drupal::service('config.installer')->installDefaultConfig('module', 'kmfri_enterprise');"`
and apply the new procedure by re-running `drush kmfri:db-setup` (resets data) or by running
`sql/003_admin_workflow.sql` as an admin and granting `EXECUTE` on it to `kmfri_hub`.

## Tariffs and search

The catalogue (`src/data/serviceCatalogue.ts`) is the single source of prices. `004_service_catalogue.sql`
loads it into `catalogue_nodes` / `catalogue_items`; `005_catalogue_tariffs.sql` publishes every priced
service as a pricing tier of its portfolio (`pricing_tiers.register_no`), retires the portfolio rates
it supersedes (laboratory, aquaculture and educational visits; kept for inquiry history) and recomputes
the charter fee summaries. Portfolio tiers without a register number (vessel charter, conference halls,
datasets, consultancy …) are shown as *standard rates*. Laboratory tests carry no unit in the register
and are charged *per test*.

The header search (Ctrl/⌘ + K) finds pages, service areas, groups, all catalogue services with their
prices, standard rates, laboratories and stations. All searches on the site (header, catalogue, tariff
schedule, dashboard) match every word in any order and ignore words such as *price* or *how much*
(`Catalogue::matches()`, `kmfriTokens`/`kmfriScore` in `js/hub.js`, `src/data/tariffs.ts`).

**Existing databases** built before the catalogue tables: add the tariff link column, then run 004 and 005
(inquiries are kept):

```sql
ALTER TABLE kmfri_services_db.pricing_tiers
  ADD COLUMN register_no SMALLINT UNSIGNED NULL AFTER service_id,
  ADD UNIQUE KEY uq_register_no (register_no);
```

## Main navigation

The main navigation is the Drupal **Main navigation** menu, in this order:
**Home · Service Catalogue · Laboratory Services · Research Stations · Tariffs & Charter**.
The catalogue, laboratory and station dropdown items are generated from the catalogue data;
editors can reorder, rename or add links at *Structure › Menus › Main navigation*
(requires the core Menu UI module).

## Install

**Requirements:** Drupal 10.3+ or 11, PHP 8.1+ with `pdo_mysql`, MySQL 8.0+ or MariaDB 10.4+, Drush 12+.

1. Copy (or symlink) `drupal/modules/kmfri_enterprise` to `web/modules/custom/` and
   `drupal/themes/kmfri_hub` to `web/themes/custom/`.
2. Add the `kmfri_services` connection from `drupal/settings.kmfri.example.php` to
   `sites/default/settings.php` and choose a password for the `kmfri_hub` account.
3. Enable and configure:
   ```sh
   drush en kmfri_enterprise -y
   drush theme:enable kmfri_hub && drush cset system.theme default kmfri_hub -y
   drush cset system.site page.front /enterprise -y          # optional: hub as front page
   drush role:perm:add anonymous 'submit kmfri quotation requests'
   drush role:perm:add authenticated 'submit kmfri quotation requests'
   ```
4. Build the services database and the least-privilege application account
   (SELECT + EXECUTE only):
   ```sh
   drush kmfri:db-setup --admin-user=root --admin-password=...
   ```
   **This drops and recreates every table** — re-running it resets all inquiries to the seed data.

The catalogue is cached for 15 minutes. After editing `kmfri_services_db` directly, run
`drush kmfri:refresh` (or *Reload catalogue* on the settings page) to rebuild pages and
the generated menu links at once.

If the database is unreachable, every page still renders from `data/fallback.yml`,
the quotation form is disabled, and visitors are shown the inquiries hotline.

### Using the module inside another theme

The module's pages, header and footer blocks carry their own stylesheet
(`kmfri_enterprise/hub`), so they can be placed in another theme such as `kmfri_theme`.
That stylesheet includes Tailwind's base reset. Drupal core's `.hidden` class is
unlayered and overrides responsive utilities such as `hidden xl:block`; `kmfri_hub`
fixes this with a `libraries-override` (see `css/hidden.css`), and any other host theme
needs the same override.

## Rebuilding the assets

`css/hub.css` and `images/icons.svg` are generated from `src/index.css` (design tokens and
components), `drupal/build/drupal.css` (Drupal-specific rules) and the classes and icon
names used in the module's templates.

`data/catalogue.json` and `sql/004_service_catalogue.sql` are exported from `src/data/serviceCatalogue.ts` (with the service
descriptions in `src/data/catalogueBlurbs.ts`) — the single source for the catalogue's
divisions, groups, services, tariffs and web-address slugs, shared with the React prototype.
The build also copies the catalogue's images from `public/images` into the module.
After changing the catalogue, templates or styles:

```sh
npm install --legacy-peer-deps   # once
node drupal/build/build.mjs      # or: npm run drupal:build
```

## Legacy React prototype

`src/`, `server/`, `index.html` and `vite.config.ts` hold the original React + Express
version the Drupal build was ported from. It still runs (`npm run dev` with
`npm run server`; it reads the SQL from the module's `sql/` folder) but is no longer the
primary implementation.

> On this machine the project path contains `&`, which breaks npm's command shims on
> Windows. Run the tools directly, e.g. `node node_modules/tsx/dist/cli.mjs server/setup.ts`.
