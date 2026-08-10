# Welcome Onboarding Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a welcome modal (with a video slot) the first time a merchant opens the app after install, remember that per-shop in the database, and let them reopen it anytime via a persistent "Watch demo" button.

**Architecture:** `app/routes/app._index.tsx` gains a `loader` (reads `Store.hasSeenWelcome`) and an `action` (sets it to `true`). A new `WelcomeModal` component renders as a fixed-position overlay — matching this codebase's existing hand-rolled modal pattern (see `DeleteConfirmModal` in `app/routes/app.pricing.$productId.tsx:332-385`), not Polaris's `<Modal>` component, which isn't used anywhere else in this app. Dismissal is a `useFetcher` POST to the route's own `action`; reopening via "Watch demo" only flips local component state.

**Tech Stack:** React Router 7 loader/action, Prisma, no new dependencies.

## Global Constraints

- Follow the existing hand-rolled modal visual style (see Task 2) — do not introduce Polaris's `<Modal>` component.
- The Prisma migration must be applied to **both** Postgres databases this app now runs against: Railway's and the Vercel/Neon one (see `docs/superpowers/plans/2026-08-10-vercel-migration.md`). Task 4 covers both.
- No test suite exists in this codebase; verification is manual (build + local run), per the design spec.

---

## Task 1: Add `hasSeenWelcome` to the `Store` model

**Files:**
- Modify: `prisma/schema.prisma`
- Creates: a new file under `prisma/migrations/`

**Interfaces:**
- Produces: `Store.hasSeenWelcome: boolean`, consumed by Task 3's loader/action.

- [ ] **Step 1: Add the field**

In `prisma/schema.prisma`, in the `Store` model:

```prisma
model Store {
  id            String         @id @default(cuid())
  shop          String         @unique
  accessToken   String
  hasSeenWelcome Boolean       @default(false)
  createdAt     DateTime       @default(now())
  configurators Configurator[]
  products      Product[]
}
```

- [ ] **Step 2: Generate the migration locally**

```bash
npx prisma migrate dev --name add_has_seen_welcome
```

Expected: creates `prisma/migrations/<timestamp>_add_has_seen_welcome/migration.sql` containing `ALTER TABLE "Store" ADD COLUMN "hasSeenWelcome" BOOLEAN NOT NULL DEFAULT false;`, and applies it to whichever database your local `DATABASE_URL` points at.

If your local `DATABASE_URL` is unreachable (this repo's local `.env` currently points at a stale Supabase host), generate the SQL without applying it instead:

```bash
npx prisma migrate dev --name add_has_seen_welcome --create-only
```

then apply it explicitly in Task 4 against a reachable database.

- [ ] **Step 3: Regenerate the Prisma Client**

```bash
npx prisma generate
```

Expected: no errors; `Store` now has `hasSeenWelcome` in its generated TypeScript type.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add hasSeenWelcome flag to Store model"
```

---

## Task 2: `WelcomeModal` component

**Files:**
- Create: `app/components/WelcomeModal.tsx`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `export default function WelcomeModal(props: { open: boolean; onClose: () => void; videoUrl: string | null }): JSX.Element | null` — consumed by Task 3.

- [ ] **Step 1: Write the component**

```tsx
export default function WelcomeModal({
  open,
  onClose,
  videoUrl,
}: {
  open: boolean;
  onClose: () => void;
  videoUrl: string | null;
}) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#fff", borderRadius: 14, width: 460,
          maxWidth: "90vw", boxShadow: "0 24px 60px rgba(0,0,0,0.24)",
          overflow: "hidden",
        }}
      >
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: "1px solid #e3e3e3",
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#1a1d23" }}>Welcome to Konfig</span>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6d7175", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: 20 }}>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6d7175", lineHeight: 1.55 }}>
            Here's a quick look at what you can do.
          </p>

          {videoUrl ? (
            <div style={{ aspectRatio: "16 / 9", borderRadius: 10, overflow: "hidden", marginBottom: 18 }}>
              <iframe
                src={videoUrl}
                title="Welcome to Konfig"
                style={{ width: "100%", height: "100%", border: "none" }}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div style={{
              aspectRatio: "16 / 9", borderRadius: 10,
              background: "linear-gradient(155deg, #f1f2fb 0%, #e6e8fb 100%)",
              border: "1px dashed #c7cbf5",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 8, marginBottom: 18,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%", background: "#4f46e5",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{
                  width: 0, height: 0, marginLeft: 3,
                  borderTop: "7px solid transparent", borderBottom: "7px solid transparent",
                  borderLeft: "11px solid #fff",
                }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#6355e8" }}>Demo video coming soon</span>
            </div>
          )}
        </div>

        <div style={{ padding: "0 20px 20px" }}>
          <button
            onClick={onClose}
            style={{
              width: "100%", background: "#4f46e5", color: "#fff", border: "none",
              borderRadius: 9, padding: "11px 0", fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no new errors referencing `WelcomeModal.tsx` (this repo has some pre-existing unrelated errors — see `git diff` shows nothing there before comparing).

- [ ] **Step 3: Commit**

```bash
git add app/components/WelcomeModal.tsx
git commit -m "feat: add WelcomeModal component"
```

---

## Task 3: Wire the modal into the Home page

**Files:**
- Modify: `app/routes/app._index.tsx`

**Interfaces:**
- Consumes: `WelcomeModal` from Task 2 (`import WelcomeModal from "../components/WelcomeModal"`), `Store.hasSeenWelcome` from Task 1.
- Consumes: `authenticate` from `../shopify.server`, `prisma` from `../db.server` (both already used elsewhere in this codebase, e.g. `app/routes/app.products.tsx:32-33`).

- [ ] **Step 1: Add the loader and action**

At the top of `app/routes/app._index.tsx`, add these imports alongside the existing ones:

```tsx
import { useLoaderData, useFetcher } from "react-router";
import { useState } from "react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import WelcomeModal from "../components/WelcomeModal";
```

Add, before `export default function HomePage()`:

```tsx
export async function loader({ request }: any) {
  const { session } = await authenticate.admin(request);
  const store = await prisma.store.findUnique({ where: { shop: session.shop } });
  return {
    hasSeenWelcome: store?.hasSeenWelcome ?? true,
    videoUrl: process.env.WELCOME_VIDEO_URL || null,
  };
}

export async function action({ request }: any) {
  const { session } = await authenticate.admin(request);
  await prisma.store.update({ where: { shop: session.shop }, data: { hasSeenWelcome: true } });
  return null;
}
```

`hasSeenWelcome` defaults to `true` when no `Store` row is found, so the modal fails safe rather than auto-showing on a missing/broken record.

- [ ] **Step 2: Wire state in the component**

At the top of `export default function HomePage()`, replace the empty function body's start with:

```tsx
export default function HomePage() {
  const { hasSeenWelcome, videoUrl } = useLoaderData<typeof loader>();
  const dismissFetcher = useFetcher();
  const [modalOpen, setModalOpen] = useState(!hasSeenWelcome);

  const closeModal = () => {
    setModalOpen(false);
    if (!hasSeenWelcome) {
      dismissFetcher.submit({}, { method: "post" });
    }
  };

  return (
    <Page
```

(keep everything from the existing `<Page ...>` onward unchanged).

- [ ] **Step 3: Render the modal and the "Watch demo" button**

Immediately after the opening `<Page ...>` tag's `<BlockStack gap="600">`, add the modal render (it renders `null` when closed, so placement doesn't affect layout):

```tsx
<WelcomeModal open={modalOpen} onClose={closeModal} videoUrl={videoUrl} />
```

For the "Watch demo" button, use Polaris `Page`'s built-in `secondaryActions` prop (confirmed present on `HeaderProps` in `node_modules/@shopify/polaris/build/ts/src/components/Page/components/Header/Header.d.ts:24`) rather than a hand-built button row. Change the existing `<Page title=... subtitle=...>` opening tag to:

```tsx
<Page
  title="Product Configurator"
  subtitle="Let customers personalise your products with custom colors, text & logos"
  secondaryActions={[{ content: "Watch demo", onAction: () => setModalOpen(true) }]}
>
```

- [ ] **Step 4: Typecheck and build**

```bash
npx tsc --noEmit
npm run build
```

Expected: no new errors; build succeeds.

- [ ] **Step 5: Commit**

```bash
git add app/routes/app._index.tsx
git commit -m "feat: wire welcome modal into the Home page"
```

---

## Task 4: Apply the migration to both databases and verify

**Files:** none (operational task)

- [ ] **Step 1: Apply to the Vercel/Neon database**

```bash
npx vercel env pull .env.vercel --environment=production
set -a; source .env.vercel; set +a
npx prisma migrate deploy
rm .env.vercel
```

Expected: `add_has_seen_welcome` listed as newly applied.

- [ ] **Step 2: Apply to Railway's database**

Get Railway's `DATABASE_URL` from its dashboard (Postgres plugin → Connect tab), then:

```bash
DATABASE_URL="<railway-connection-string>" npx prisma migrate deploy
```

Expected: same migration applied there too. (Do this once Railway's plan/billing issue is resolved and the service is reachable again — the migration itself doesn't depend on the app being up, only on the database being reachable.)

- [ ] **Step 3: Push and verify on Vercel**

```bash
git push origin main
```

Wait for the new deployment (`npx vercel ls` shows `Ready`), then in Shopify admin, open the app on a store whose `Store.hasSeenWelcome` is `false` (or reset one: connect to the Neon DB and run `UPDATE "Store" SET "hasSeenWelcome" = false WHERE shop = '<test-shop>.myshopify.com';`). Confirm:
- Modal appears automatically on load, showing the "Demo video coming soon" placeholder.
- Clicking "Get Started" closes it.
- Reloading the page does **not** show it again.
- The "Watch demo" button reopens it.
