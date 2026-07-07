# Move Uploads to Shopify Files API — Design

## Problem

The app currently saves uploaded files (3D models, Builder logos/images, and customer preview screenshots) directly to local disk on the Railway container (`process.cwd()/public/uploads`). Railway's container filesystem is ephemeral — every redeploy wipes it. This has already caused repeated real 404s in production today (a merchant's uploaded `.glb` model disappearing after unrelated code deploys), and is a business-blocking reliability issue: any merchant using this app can have a customer's uploaded file vanish the next time the app is redeployed for any reason, unrelated to their own action.

A Railway persistent volume was considered as a stopgap but was never successfully attached (confirmed: no "Volumes" section existed in the service's Settings). Rather than depend on correctly configuring and maintaining Railway infrastructure, this design moves file storage to **Shopify's own Files API** — permanent, CDN-hosted storage tied to the merchant's own store, requiring no server-side disk or infrastructure management at all.

## Scope

All three existing upload routes move to Shopify Files API:

1. `app/routes/app.upload-glb.tsx` — admin-authenticated, uploads the 3D model (`.glb`)
2. `app/routes/app.upload-image.tsx` — admin-authenticated, uploads Builder logos/textures
3. `app/routes/upload-preview.tsx` — public/unauthenticated, uploads a screenshot of what the customer configured, attached to their cart line item

No migration of already-broken references is needed or possible — files already lost to the ephemeral disk are simply gone; merchants re-upload once after this ships, same as they'd have to with any other fix.

## Architecture

### Shared upload helper

`app/utils/shopifyFiles.server.ts` exports:

```ts
type ShopifyResourceType = "MODEL_3D" | "IMAGE";

async function uploadFileToShopify(
  admin: any,
  params: { buffer: Buffer; filename: string; mimeType: string; resourceType: ShopifyResourceType },
): Promise<{ url: string } | { error: string }>
```

This performs Shopify's standard 3-step upload process, validated against the live Admin GraphQL schema (2026-07):

1. **`stagedUploadsCreate`** — request a temporary upload target for the given `resource` (`MODEL_3D` or `IMAGE`), `filename`, `mimeType`, and `fileSize`. Returns a `stagedTargets[0]` with `url`, `resourceUrl`, and `parameters` (form fields required by the upload target).
2. **Upload the raw bytes** — POST a `multipart/form-data` body (the returned `parameters` as fields, plus the file itself) directly to `stagedTargets[0].url`.
3. **`fileCreate`** — register the uploaded file as a permanent Shopify asset, using `stagedTargets[0].resourceUrl` as `originalSource` and the matching `contentType` (`MODEL_3D` or `IMAGE`). Returns a file `id` and initial `fileStatus`.
4. **Poll for readiness** — Shopify processes files asynchronously. Poll `node(id) { ... on Model3d { fileStatus sources { url format } } }` (or the `MediaImage` equivalent for images) once per second, up to 20 attempts (~20 seconds). On `fileStatus: "READY"`, return the real CDN URL (for `MODEL_3D`, the source whose `format` is `"glb"` specifically, not the auto-converted `usdz`). On `"FAILED"` or timeout, return `{ error: ... }`.

Because this helper returns the exact same `{ url: string }` shape the routes already return today, **no calling UI code changes** — `GlbPartSetup.tsx` and the Builder's image upload buttons keep working unmodified; only the three route files' internals change.

### Public preview-screenshot route

`upload-preview.tsx` has no `shop` context today. The customer-facing configurator (`configurator.$productId.tsx`) already extracts `shop` from its own query string for its Prisma queries but doesn't expose it to the client component — this design adds `shop` to that loader's return value, and the client includes it when POSTing a screenshot. The route then calls `unauthenticated.admin(shop)` (the same mechanism used for today's draft-order/metafield work) to get an Admin API client for that specific store, with no interactive session required.

### Access scope

`fileCreate` requires the `write_files` access scope (confirmed via schema validation), which isn't currently granted. This is added to `shopify.app.toml`, requiring a fresh `shopify app deploy` and the merchant approving updated permissions once — the same process already gone through today for `write_draft_orders`.

## Error handling

- Any `userErrors` from `stagedUploadsCreate` or `fileCreate`: the route returns `{ error: message }` in its JSON response (matching the existing error-response shape each route already uses), so the calling UI's existing error-display logic (e.g. `GlbPartSetup.tsx`'s `extractError` state) continues to work without changes.
- Upload-to-staged-target HTTP failure: returns a generic `{ error: "File upload to Shopify storage failed" }`.
- Processing timeout (20s) or `fileStatus: "FAILED"`: returns a clear error rather than hanging indefinitely.

## Known tradeoffs (explicitly out of scope for this pass)

- Uploads take a few seconds longer than the previous instant local write, since the server waits for Shopify's asynchronous processing to complete before responding. Confirmed acceptable in exchange for permanent reliability.
- No migration of already-broken file references on existing products — those were already lost to the ephemeral disk regardless of this fix; merchants re-upload once.
- No deletion of superseded files when a merchant replaces a GLB/image (matches today's existing behavior, which never deleted old local files either).
