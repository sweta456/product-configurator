# Vercel Migration (from Railway) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the "Konfig - Product Customizer" Shopify app from its current Railway/Docker deployment to Vercel, backed by a fresh Postgres database, and repoint the live Shopify app (client_id `70dc841cdf7d1a135a1d13f63c555d71`) at the new URL.

**Architecture:** The app is a React Router 7 framework-mode app (`@react-router/dev`, SSR) using Prisma against Postgres, with Shopify OAuth/session storage via `@shopify/shopify-app-react-router` + `PrismaSessionStorage`. Vercel has zero-config support for React Router, but the official `@vercel/react-router` Vite preset is recommended for per-route function config and correct bundle splitting. Prisma needs `prisma generate` wired into the install step (Vercel doesn't run it automatically) and a serverless-friendly (pooled) Postgres connection string.

**Tech Stack:** React Router 7, Vite 6, Prisma 6 + `@prisma/client`, `@shopify/shopify-app-react-router`, Vercel (Functions + Vercel Postgres/Neon), Shopify CLI.

## Global Constraints

- Do not touch `railway.toml` or `Dockerfile` — Railway stays as a fallback until the Vercel deployment is verified working end-to-end.
- `shopify.app.toml` changes that call `shopify app deploy` affect the **live, installed** Shopify app. That step requires explicit user confirmation immediately before running it (per user's own risk-confirmation rules) — it is the point of no return for this migration.
- No code in this plan should assume a Vercel/Neon domain or connection string that doesn't exist yet — those are filled in during the manual tasks and treated as environment variables, never hardcoded.
- Steps marked **MANUAL (browser)** cannot be executed by the agent — Vercel/GitHub OAuth and the Shopify Partner Dashboard require an interactive browser session belonging to the user.

---

## Task 1: Add the Vercel preset for React Router

**Files:**
- Create: `react-router.config.ts`
- Modify: `package.json` (add `@vercel/react-router` dependency)

**Interfaces:**
- Produces: `react-router.config.ts` default-exports a `Config` object consumed by `@react-router/dev` at build time (no other task depends on its internals).

- [ ] **Step 1: Install the package**

```bash
npm install @vercel/react-router
```

- [ ] **Step 2: Create `react-router.config.ts`**

```ts
import { vercelPreset } from "@vercel/react-router/vite";
import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
  presets: [vercelPreset()],
} satisfies Config;
```

- [ ] **Step 3: Verify the app still builds locally**

Run: `npm run build`
Expected: build completes with no errors, `build/client` and `build/server` are produced same as before (the preset only adds Vercel metadata, it doesn't change output shape for non-Vercel builds).

- [ ] **Step 4: Commit**

```bash
git add react-router.config.ts package.json package-lock.json
git commit -m "build: add Vercel preset for React Router deploys"
```

---

## Task 2: Make Prisma Client generation part of `npm install`

**Why this task exists:** Vercel's build runs `npm install` then your build command. `@prisma/client` is a generated package — without a `postinstall` hook, the generated client from your local `node_modules` never ships, and the Vercel build fails on `Cannot find module '.prisma/client'` (or worse, silently uses a stale generated client baked into `node_modules` from a different Prisma version).

**Files:**
- Modify: `package.json:19-27` (`scripts` block)

**Interfaces:**
- Consumes: existing `prisma generate` CLI (already a devDependency via `prisma`).

- [ ] **Step 1: Add the `postinstall` script**

In `package.json`, inside `"scripts"`, add:

```json
"postinstall": "prisma generate"
```

Keep the existing `"setup": "prisma generate && prisma migrate deploy"` script as-is — it's still used by `docker-start` for Railway.

- [ ] **Step 2: Verify a clean install regenerates the client**

```bash
rm -rf node_modules/.prisma
npm install
```

Expected: install logs show `Generated Prisma Client` before it finishes, and `node_modules/.prisma/client/index.js` exists again.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "build: generate Prisma Client on install for Vercel"
```

---

## Task 3: Document required environment variables

**Why:** Vercel needs every env var the app reads set in its dashboard (Project Settings → Environment Variables) before the first real deploy. There's currently no `.env.example` in the repo to work from.

**Files:**
- Create: `.env.example`

- [ ] **Step 1: Create `.env.example`** listing every var the app actually reads (confirmed via grep of `process.env.*` across `app/`):

```bash
# Shopify app credentials (Partner Dashboard > App > Client credentials)
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
# Public URL of this deployment, no trailing slash (set to the Vercel domain in production)
SHOPIFY_APP_URL=

# Optional: only needed if the app is installed on a shop with a custom domain
SHOP_CUSTOM_DOMAIN=

# Postgres connection string (pooled — see Task 5)
DATABASE_URL=

# Used by app/routes/api.external-configurator.$productId.tsx to authenticate
# the public storefront-embedding API
EXTERNAL_API_KEY=

# Optional: Tawk.to live chat widget (app/routes/app.tsx)
TAWK_PROPERTY_ID=
TAWK_WIDGET_ID=

# Optional: shop to redirect to on /auth/login when no ?shop= param is given
DEFAULT_SHOP=
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: add .env.example for deployment env var reference"
```

---

## Task 4: Connect the GitHub repo to Vercel — MANUAL (browser)

**Why this can't be scripted:** Linking a GitHub repo to Vercel requires OAuth-authorizing Vercel's GitHub App in your browser. There is no CLI or API path that skips this the first time.

- [ ] **Step 1:** Go to https://vercel.com/new
- [ ] **Step 2:** Under "Import Git Repository", select `sweta456/product-configurator` (authorize the Vercel GitHub App for this repo if prompted).
- [ ] **Step 3:** Framework Preset should auto-detect as **React Router**. Leave Build Command / Output Directory as the defaults (the framework preset handles both).
- [ ] **Step 4:** Do **not** click Deploy yet — first add the environment variables from Task 3 (values TBD until Task 5 gives you `DATABASE_URL`, and Task 1's Shopify credentials come from the Partner Dashboard, same ones currently set on Railway).
- [ ] **Step 5:** Once env vars are in (DATABASE_URL can be added after Task 5), click **Deploy**. This creates a *preview* deployment on a `*.vercel.app` URL — nothing points Shopify traffic at it yet, so this is safe to do freely.

Report back the resulting `*.vercel.app` project URL before continuing to Task 6.

---

## Task 5: Provision a fresh Postgres database — MANUAL (browser)

**Why "fresh" and not reusing Railway's DB:** you chose a separate database so test traffic on the new deployment never touches production `Store`/`Configurator`/`Product` rows. Keep this in mind for Task 7 — a fresh DB means currently-installed shops have no `Store` row here, so they'll be forced through Shopify's re-auth flow on first request after cutover (the app handles this automatically via `shopify-app-react-router`'s session middleware; merchants just see a normal "reinstall/approve scopes" screen). Custom `Configurator`/`Product` data tied to the old `Store.id` will **not** carry over unless you explicitly migrate it (optional Task 8).

- [ ] **Step 1:** In the Vercel dashboard, go to your project → **Storage** tab → **Create Database** → choose **Postgres** (Neon-backed).
- [ ] **Step 2:** Once provisioned, Vercel auto-populates `DATABASE_URL` (and related `POSTGRES_*` vars) into the project's environment variables for all environments. Confirm `DATABASE_URL` uses the **pooled** connection (Neon's `-pooler` hostname) — this is the default Vercel wires up, and it's required because serverless functions open far more concurrent connections than a single Railway container did.
- [ ] **Step 3:** Pull the new env vars locally to run migrations against it:

```bash
npx vercel env pull .env.vercel
```

- [ ] **Step 4:** Apply the existing Prisma migrations to the new database:

```bash
set -a; source .env.vercel; set +a
npx prisma migrate deploy
```

Expected output: `All migrations have been successfully applied.` — this creates the `Store`, `Product`, `Configurator` etc. tables with no rows.

- [ ] **Step 5:** Verify tables exist:

```bash
npx prisma db execute --stdin <<< "select count(*) from \"Store\";"
```

Expected: returns `0` (empty table, not an error).

- [ ] **Step 6 (do not commit):** delete the local pulled env file so credentials don't linger in your working tree:

```bash
rm .env.vercel
```

---

## Task 6: Verify the Vercel preview deployment end-to-end

**Files:** none (verification only)

- [ ] **Step 1:** Open the `*.vercel.app` URL from Task 4 directly. Expected: the app responds (may show a Shopify auth error page since it's not installed anywhere yet — that's fine, it proves SSR + DB connectivity work). A 500 here means `DATABASE_URL` or Prisma Client generation is misconfigured — check Vercel's function logs.
- [ ] **Step 2:** In the Shopify Partner Dashboard, temporarily create a **development store** (or reuse an existing one) and manually visit:

```
https://<your-project>.vercel.app/auth/login?shop=<your-dev-store>.myshopify.com
```

Expected: redirects into the standard Shopify OAuth install/approve screen. This confirms `SHOPIFY_APP_URL`, `SHOPIFY_API_KEY`/`SECRET`, and the Prisma-backed session storage are all wired correctly — **without** touching the live app's `shopify.app.toml` yet.

- [ ] **Step 3:** Approve the install on the dev store and confirm the embedded admin UI loads (Polaris app home) and a `Store` row now exists:

```bash
npx prisma studio
```

(point it at the Vercel DB via `.env.vercel` pulled again temporarily, or check via `vercel env pull` — same as Task 5 Step 3-4).

If this all works, the deployment is production-ready and safe to cut the live app over to.

---

## Task 7: Cut the live Shopify app over to Vercel — requires your explicit go-ahead

**This is the point of no return for this migration.** Once `shopify app deploy` runs, every merchant with the app currently installed will hit the new URL on their next admin page load / webhook, and (per Task 5) will not have a `Store` row in the new database — they'll be walked through Shopify's normal re-auth screen automatically, but any custom `Configurator`/`Product` records tied to their old `Store.id` will not appear until Task 8 is run (if you choose to run it).

**Do not start this task until:**
1. Task 6 verification passed on a dev store, and
2. You've explicitly confirmed you want to proceed (ask me — I will not run Step 2 below without your go-ahead in this conversation).

**Files:**
- Modify: `shopify.app.toml:4` (`application_url`)
- Modify: `shopify.app.toml:20-23` (`redirect_urls`)

- [ ] **Step 1:** Update `shopify.app.toml`:

```toml
application_url = "https://<your-production-vercel-domain>"
```

```toml
[auth]
redirect_urls = [
  "https://<your-production-vercel-domain>/auth/callback",
  "https://<your-production-vercel-domain>/api/auth/callback"
]
```

Use your final production domain — either the `*.vercel.app` one or a custom domain if you've attached one in Vercel's Domains tab.

- [ ] **Step 2 — MANUAL confirmation required, then run:**

```bash
npx shopify app deploy
```

This pushes the new `application_url`/`redirect_urls` to the Partner Dashboard for the live app record. Existing installs pick this up automatically (Shopify calls the new URL directly; no per-merchant action needed beyond the automatic re-auth described above).

- [ ] **Step 3:** Set `DEFAULT_SHOP`/`EXTERNAL_API_KEY`/Tawk vars (Task 3 list) to their real production values in Vercel's env vars if you hadn't already, and promote the Vercel deployment's environment target from Preview to **Production** if it isn't already (Deployments tab → the deployment you verified in Task 6 → "Promote to Production", or just push to your default branch if you've connected auto-deploy-on-push).

- [ ] **Step 4:** Commit the `shopify.app.toml` change:

```bash
git add shopify.app.toml
git commit -m "chore: point Shopify app at Vercel production URL"
```

- [ ] **Step 5:** Monitor Vercel's function logs and a couple of merchant sessions for the first hour after cutover. If something's badly wrong, revert `shopify.app.toml` to the Railway URL and re-run `npx shopify app deploy` — Railway is still running (per Global Constraints, untouched) so this is a fast rollback.

---

## Task 8 (optional): Migrate existing Store/Product/Configurator data from Railway's Postgres

Only do this if you want existing merchants' saved configurators to survive the cutover instead of starting fresh. Skip if a clean slate is acceptable.

**Files:** none (data operation, not code)

- [ ] **Step 1:** Get Railway's current `DATABASE_URL` (Railway dashboard → Postgres plugin → Connect tab).
- [ ] **Step 2:** Dump it:

```bash
pg_dump "$RAILWAY_DATABASE_URL" --no-owner --no-acl -F c -f railway_backup.dump
```

- [ ] **Step 3:** Restore into the new Vercel/Neon database (pulled `DATABASE_URL` from Task 5):

```bash
pg_restore --no-owner --no-acl -d "$VERCEL_DATABASE_URL" railway_backup.dump
```

- [ ] **Step 4:** Verify row counts match between old and new:

```bash
psql "$RAILWAY_DATABASE_URL" -c 'select count(*) from "Store";'
psql "$VERCEL_DATABASE_URL" -c 'select count(*) from "Store";'
```

- [ ] **Step 5:** Delete `railway_backup.dump` locally — it contains merchant access tokens, don't leave it lying around or commit it.

```bash
rm railway_backup.dump
```

Run this task **before** Task 7 Step 2 (`shopify app deploy`) if you want it to happen — once merchants start hitting the new URL, new `Store` rows may already be getting created for re-authed shops, and restoring old data on top could conflict on the unique `shop` column.
