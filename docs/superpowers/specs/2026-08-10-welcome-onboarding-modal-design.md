# Welcome Onboarding Modal — Design

## Purpose

When a merchant installs the app and opens it for the first time, show a welcome modal explaining what the app does (with a video slot), so they understand the app before diving into the Home page's "Getting Started" steps. The modal should not reappear on later visits, but a merchant should be able to rewatch it on demand.

## Scope

- One new modal component shown on `app/routes/app._index.tsx` (the app's Home page).
- One new boolean field on the `Store` model to persist "already seen" state per shop.
- A "Watch demo" button on the Home page that reopens the same modal at any time (no persistence change).
- A video slot that reads from an env var, falling back to a placeholder if unset.

Out of scope: recording/hosting the actual video, editing the existing "Getting Started" step content, any onboarding flow beyond this single modal.

## Data model

Add to `prisma/schema.prisma`:

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

Rationale: onboarding state describes the installation itself, not configurator display settings (which already live in the separate `AppSettings.settings` JSON blob) — keeping it on `Store` avoids conflating the two.

A migration is required: `npx prisma migrate dev --name add_has_seen_welcome` locally, then `prisma migrate deploy` against both the Railway and Vercel/Neon databases (this app runs against two separate Postgres instances currently — see `docs/superpowers/plans/2026-08-10-vercel-migration.md`).

## Route changes — `app/routes/app._index.tsx`

Currently this route has no `loader`/`action`. Add:

**`loader`**
```ts
export async function loader({ request }: any) {
  const { session } = await authenticate.admin(request);
  const store = await prisma.store.findUnique({ where: { shop: session.shop } });
  return { hasSeenWelcome: store?.hasSeenWelcome ?? true, videoUrl: process.env.WELCOME_VIDEO_URL || null };
}
```
`hasSeenWelcome` defaults to `true` (not `false`) when no `Store` row is found, so the modal fails safe (never auto-shown) rather than risking a crash-loop if the row is somehow missing for an installed shop.

**`action`**
```ts
export async function action({ request }: any) {
  const { session } = await authenticate.admin(request);
  await prisma.store.update({ where: { shop: session.shop }, data: { hasSeenWelcome: true } });
  return null;
}
```
Called via a `useFetcher()` `<fetcher.Form method="post">` when the modal's "Get Started" button or close (X) is clicked — fire-and-forget, no need to block the UI on the response.

## Component: `WelcomeModal`

New file: `app/components/WelcomeModal.tsx`

Props:
```ts
{
  open: boolean;
  onClose: () => void;   // closes the modal locally AND triggers the dismiss fetcher
  videoUrl: string | null;
}
```

Renders a Polaris `Modal` (`title="Welcome to Konfig"`, no primary/secondary action footer — footer is just the one "Get Started" button per the approved design) containing:
- A heading/intro line ("Here's a quick look at what you can do.")
- If `videoUrl` is set: an `<iframe>` embed (16:9, responsive) pointed at it.
- If not set: a placeholder box — centered play-icon glyph + "Demo video coming soon" text, styled consistently with the existing `Card`/`Box` patterns already used in `app._index.tsx`.
- A single "Get Started" `Button` (`variant="primary"`) that calls `onClose`.

## Home page wiring — `app._index.tsx`

- `useState` for `modalOpen`, initialized from loader's `hasSeenWelcome === false`.
- A `useFetcher()` posting to the route's own `action` when the modal closes for the *first* time (guard with the loader's original `hasSeenWelcome` value, not the local state, so reopening via "Watch demo" never re-fires the dismiss mutation redundantly — harmless if it did since it's idempotent, but avoids an unnecessary write).
- A small "Watch demo" `Button` (`variant="tertiary"` or plain, placed near the page title) that sets `modalOpen = true` — this path does NOT call the fetcher, since `hasSeenWelcome` is already `true` by then.

## Error handling

- If `WELCOME_VIDEO_URL` is set but unreachable/invalid, the `<iframe>` will simply show its own embed error — no special handling needed (matches how any broken embed link behaves elsewhere).
- If the dismiss `action` fails (network blip), the modal still closes locally (`onClose` isn't gated on the fetcher's response) — worst case it reappears once more on a later visit, which is an acceptable, non-destructive failure mode.

## Testing

- Manual verification only (no existing test suite in this codebase to extend): run the migration, seed/reset a test `Store` row's `hasSeenWelcome` to `false`, load the Home page, confirm the modal appears, confirm dismissing it sets the flag (reload should not re-show it), confirm "Watch demo" reopens it.
