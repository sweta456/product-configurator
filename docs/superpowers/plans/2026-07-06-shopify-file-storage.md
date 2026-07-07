# Move Uploads to Shopify Files API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace local-disk file uploads (which get wiped on every Railway redeploy) with Shopify's own Files API, so uploaded 3D models, Builder images, and customer preview screenshots persist permanently.

**Architecture:** A single shared server-side helper performs Shopify's 3-step upload process (stage → upload bytes → register → poll until ready) and returns the same `{ url }` shape the three existing upload routes already return, so no calling UI code changes.

**Tech Stack:** React Router v7 route actions, `@shopify/shopify-app-react-router` (`authenticate.admin`, `unauthenticated.admin`), Shopify Admin GraphQL API 2026-07 (`stagedUploadsCreate`, `fileCreate`).

## Global Constraints

- No test framework exists in this repo — do not introduce one. The shared upload helper does real network I/O against Shopify and can't be meaningfully unit-tested without a live shop session, so verification is manual (run the dev server, perform a real upload, confirm the returned URL is a working `cdn.shopify.com` link).
- Deploy flow: commit → merge to `main`/`main-dev`/`fix/app-icon-toml-config` → push all 4 branches → GitHub Actions builds and pushes to `deploy` → Railway redeploys.
- Adding the `write_files` scope requires `shopify app deploy --allow-updates` and the merchant approving updated permissions afterward (same process already done today for `write_draft_orders`).
- All three upload routes must keep returning `{ url: string }` on success and `{ error: string }` (with the same HTTP status conventions each already uses) on failure — this is what the existing calling UI code depends on.

---

### Task 1: Shared Shopify file upload helper

**Files:**
- Create: `app/utils/shopifyFiles.server.ts`
- Modify: `shopify.app.toml`

**Interfaces:**
- Produces: `export type ShopifyResourceType = "MODEL_3D" | "IMAGE"`, `export async function uploadFileToShopify(admin: any, params: { buffer: Buffer; filename: string; mimeType: string; resourceType: ShopifyResourceType }): Promise<{ url: string } | { error: string }>`

- [ ] **Step 1: Add the `write_files` scope**

In `shopify.app.toml`, under `[access_scopes]`, change:

```toml
scopes = "write_products,read_products,write_orders,read_orders,read_inventory,write_inventory,read_locations,write_publications,read_publications"
```

to:

```toml
scopes = "write_products,read_products,write_orders,read_orders,read_inventory,write_inventory,read_locations,write_publications,read_publications,write_files"
```

- [ ] **Step 2: Create the shared upload helper**

Create `app/utils/shopifyFiles.server.ts`:

```ts
export type ShopifyResourceType = "MODEL_3D" | "IMAGE";

interface UploadParams {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  resourceType: ShopifyResourceType;
}

/**
 * Uploads a file to Shopify's own CDN via the Files API, so it persists
 * permanently instead of living on the app server's disk (which is wiped
 * on every redeploy). Performs Shopify's 3-step process: stage the upload,
 * send the bytes, register the file, then poll until Shopify finishes
 * processing it before returning the final CDN URL.
 */
export async function uploadFileToShopify(
  admin: any,
  { buffer, filename, mimeType, resourceType }: UploadParams,
): Promise<{ url: string } | { error: string }> {
  const stagedResp = await admin.graphql(
    `#graphql
    mutation StageUpload($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets { url resourceUrl parameters { name value } }
        userErrors { field message }
      }
    }`,
    {
      variables: {
        input: [{
          filename,
          mimeType,
          fileSize: String(buffer.length),
          resource: resourceType,
          httpMethod: "POST",
        }],
      },
    },
  );
  const stagedData = await stagedResp.json();
  const stagedErrors = stagedData.data?.stagedUploadsCreate?.userErrors ?? [];
  if (stagedErrors.length > 0) {
    return { error: stagedErrors[0].message };
  }

  const target = stagedData.data?.stagedUploadsCreate?.stagedTargets?.[0];
  if (!target) {
    return { error: "Could not create an upload target" };
  }

  const uploadForm = new FormData();
  for (const p of target.parameters as { name: string; value: string }[]) {
    uploadForm.append(p.name, p.value);
  }
  uploadForm.append("file", new Blob([buffer], { type: mimeType }), filename);

  const uploadResp = await fetch(target.url, { method: "POST", body: uploadForm });
  if (!uploadResp.ok) {
    return { error: "File upload to Shopify storage failed" };
  }

  const createResp = await admin.graphql(
    `#graphql
    mutation CreateFile($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files { id fileStatus }
        userErrors { field message }
      }
    }`,
    {
      variables: {
        files: [{
          originalSource: target.resourceUrl,
          contentType: resourceType,
        }],
      },
    },
  );
  const createData = await createResp.json();
  const createErrors = createData.data?.fileCreate?.userErrors ?? [];
  if (createErrors.length > 0) {
    return { error: createErrors[0].message };
  }

  const fileId = createData.data?.fileCreate?.files?.[0]?.id;
  if (!fileId) {
    return { error: "File creation did not return an id" };
  }

  const fragment = resourceType === "MODEL_3D"
    ? `... on Model3d { fileStatus sources { url format } }`
    : `... on MediaImage { fileStatus image { url } }`;

  for (let attempt = 0; attempt < 20; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const pollResp = await admin.graphql(
      `#graphql
      query PollFile($id: ID!) {
        node(id: $id) { ${fragment} }
      }`,
      { variables: { id: fileId } },
    );
    const pollData = await pollResp.json();
    const node = pollData.data?.node;
    if (!node) continue;

    if (node.fileStatus === "READY") {
      if (resourceType === "MODEL_3D") {
        const glbSource = (node.sources ?? []).find((s: any) => s.format === "glb");
        if (glbSource?.url) return { url: glbSource.url };
        return { error: "Model processed but no GLB source was returned" };
      }
      if (node.image?.url) return { url: node.image.url };
      return { error: "Image processed but no URL was returned" };
    }

    if (node.fileStatus === "FAILED") {
      return { error: "Shopify failed to process the uploaded file" };
    }
  }

  return { error: "Timed out waiting for the file to finish processing" };
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck` — expect no new errors.

- [ ] **Step 4: Commit**

```bash
git add app/utils/shopifyFiles.server.ts shopify.app.toml
git commit -m "feat: add shared Shopify Files API upload helper, write_files scope"
```

---

### Task 2: Migrate the admin GLB upload route

**Files:**
- Modify: `app/routes/app.upload-glb.tsx` (entire file)

**Interfaces:**
- Consumes: `uploadFileToShopify` from `../utils/shopifyFiles.server` (Task 1)

- [ ] **Step 1: Replace the file's contents**

Replace the entire contents of `app/routes/app.upload-glb.tsx` with:

```ts
import { authenticate } from "../shopify.server";
import { uploadFileToShopify } from "../utils/shopifyFiles.server";

export async function action({ request }: any) {
  const { admin } = await authenticate.admin(request);

  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file || file.size === 0) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext !== "glb") {
    return Response.json({ error: "Only .glb files are accepted" }, { status: 400 });
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await uploadFileToShopify(admin, {
      buffer,
      filename: file.name,
      mimeType: "model/gltf-binary",
      resourceType: "MODEL_3D",
    });

    if ("error" in result) {
      return Response.json({ error: result.error }, { status: 502 });
    }

    return Response.json({ url: result.url });
  } catch (err: any) {
    return Response.json({ error: err.message ?? "Upload failed" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck` — expect no new errors.

- [ ] **Step 3: Manually verify**

Run the dev server, open the Builder for any product, go to the 3D tab, upload a `.glb` file. Expected: after a few seconds (Shopify processing the upload), "3D model uploaded" appears with a URL that starts with `https://cdn.shopify.com/...` (not `/uploads/...`), and the mesh-parts list populates normally, exactly as before.

- [ ] **Step 4: Commit**

```bash
git add app/routes/app.upload-glb.tsx
git commit -m "feat: upload GLB models to Shopify Files API instead of local disk"
```

---

### Task 3: Migrate the admin image upload route

**Files:**
- Modify: `app/routes/app.upload-image.tsx` (entire file)

**Interfaces:**
- Consumes: `uploadFileToShopify` from `../utils/shopifyFiles.server` (Task 1)

- [ ] **Step 1: Replace the file's contents**

Replace the entire contents of `app/routes/app.upload-image.tsx` with:

```ts
import { authenticate } from "../shopify.server";
import { uploadFileToShopify } from "../utils/shopifyFiles.server";

export async function action({ request }: any) {
  // Verify the request is from an authenticated admin session
  const { admin } = await authenticate.admin(request);

  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file || file.size === 0) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || "image/png";

    const result = await uploadFileToShopify(admin, {
      buffer,
      filename: file.name,
      mimeType,
      resourceType: "IMAGE",
    });

    if ("error" in result) {
      return Response.json({ error: result.error }, { status: 502 });
    }

    return Response.json({ url: result.url });
  } catch (err: any) {
    return Response.json(
      { error: err.message ?? "Upload failed" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck` — expect no new errors.

- [ ] **Step 3: Manually verify**

Run the dev server, open the Builder, upload a logo/image in any image-upload field (there are three call sites in `app.configurator-setup.$productId.tsx`, all posting to `/app/upload-image` — any one confirms the route works). Expected: after a few seconds, the image preview shows correctly, backed by a `cdn.shopify.com` URL.

- [ ] **Step 4: Commit**

```bash
git add app/routes/app.upload-image.tsx
git commit -m "feat: upload Builder images to Shopify Files API instead of local disk"
```

---

### Task 4: Migrate the public preview-screenshot route and its caller

This task ships the route rewrite and its caller's changes together in one
commit — splitting them would leave an intermediate state where the client
sends absolute-URL-shaped code against a route that still returns relative
paths (or vice versa).

**Files:**
- Modify: `app/routes/configurator.$productId.tsx:41-75` (loader), `:409-411` (component data destructure), `:773-806` (`handleAddToCart`'s preview upload)
- Modify: `app/routes/upload-preview.tsx` (entire file)

**Interfaces:**
- Consumes: `uploadFileToShopify` from `../utils/shopifyFiles.server` (Task 1), `unauthenticated` from `../shopify.server`
- Produces: loader now also returns `shop: string` for the client to use when calling `/upload-preview`; `/upload-preview` now requires a `?shop=` query param and returns an absolute `cdn.shopify.com` URL instead of a relative `/uploads/...` path

- [ ] **Step 1: Return `shop` from the loader**

The loader already reads `shop` from the query string (line 43) for its own Prisma queries but doesn't return it. Change both `return` statements:

```ts
  if (!config) {
    return { config: null, productName: "Product", productId, appSettings };
  }
```

to:

```ts
  if (!config) {
    return { config: null, productName: "Product", productId, appSettings, shop };
  }
```

and:

```ts
  return {
    config,
    productName: (config as any).productName ?? "Product",
    productId,
    configuratorStyle,
    modelMode,
    glbUrl,
    appSettings,
  };
```

to:

```ts
  return {
    config,
    productName: (config as any).productName ?? "Product",
    productId,
    configuratorStyle,
    modelMode,
    glbUrl,
    appSettings,
    shop,
  };
```

- [ ] **Step 2: Destructure `shop` in the component**

Change (line 410):

```ts
  const { config, productName, configuratorStyle, modelMode, glbUrl, appSettings } = useLoaderData() as any;
```

to:

```ts
  const { config, productName, configuratorStyle, modelMode, glbUrl, appSettings, shop } = useLoaderData() as any;
```

- [ ] **Step 3: Send `shop` with the preview upload, and fix the URL-prefixing bug**

The preview upload's URL will now be an absolute `cdn.shopify.com` link (Step 5 below rewrites the route to return one), so prepending `window.location.origin` to it (as the current code does for the old relative `/uploads/...` path) would silently produce a broken, double-prefixed URL. Change (lines 778-793):

```ts
      let previewUrl = "";
      if (previewDataUrl) {
        try {
          const resp = await fetch("/upload-preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dataUrl: previewDataUrl }),
          });
          const data = await resp.json();
          if (data.url) {
            previewUrl = window.location.origin + data.url;
            properties["Preview Image"] = previewUrl;
            properties["_preview"] = previewUrl;
          }
        } catch {
          // Non-fatal
        }
      }
```

to:

```ts
      let previewUrl = "";
      if (previewDataUrl) {
        try {
          const resp = await fetch(`/upload-preview?shop=${encodeURIComponent(shop)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dataUrl: previewDataUrl }),
          });
          const data = await resp.json();
          if (data.url) {
            previewUrl = data.url;
            properties["Preview Image"] = previewUrl;
            properties["_preview"] = previewUrl;
          }
        } catch {
          // Non-fatal
        }
      }
```

- [ ] **Step 4: Replace the preview-screenshot route's contents**

Replace the entire contents of `app/routes/upload-preview.tsx` with:

```ts
import { unauthenticated } from "../shopify.server";
import { uploadFileToShopify } from "../utils/shopifyFiles.server";

// Public (no admin session) endpoint -- the storefront iframe POSTs the
// canvas screenshot here to get a URL stored as a Shopify line item
// property. Uses the app's stored offline access token for the given shop
// (via unauthenticated.admin) since there's no interactive admin session
// on a customer-facing request.
export async function action({ request }: any) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  if (!shop) {
    return Response.json({ error: "Missing shop parameter" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { dataUrl } = body as { dataUrl?: string };

    if (!dataUrl || !dataUrl.startsWith("data:image/")) {
      return Response.json({ error: "Invalid image data" }, { status: 400 });
    }

    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // 5 MB limit (canvas screenshots are typically 200-800 KB at 2x pixel ratio)
    if (buffer.length > 5 * 1024 * 1024) {
      return Response.json({ error: "Image too large" }, { status: 413 });
    }

    let admin;
    try {
      ({ admin } = await unauthenticated.admin(shop));
    } catch {
      return Response.json({ error: "Unable to process this store's request" }, { status: 502 });
    }

    const filename = `preview-${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
    const result = await uploadFileToShopify(admin, {
      buffer,
      filename,
      mimeType: "image/png",
      resourceType: "IMAGE",
    });

    if ("error" in result) {
      return Response.json({ error: result.error }, { status: 502 });
    }

    return Response.json({ url: result.url });
  } catch (err: any) {
    return Response.json({ error: err.message ?? "Upload failed" }, { status: 500 });
  }
}
```

(The old file's `cleanupOldPreviews` local-disk pruning is removed entirely — it no longer applies once these live on Shopify's own CDN rather than local disk.)

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck` — expect no new errors.

- [ ] **Step 6: Manually verify**

With the dev server running, open the storefront product page for a configured product, customize it, click "Add to Cart". Expected: the request to `/cart/add.js` succeeds, and inspecting the cart's line item properties shows a "Preview Image" value that is a working `cdn.shopify.com` URL (open it directly in a browser tab to confirm the screenshot loads).

- [ ] **Step 7: Commit**

```bash
git add app/routes/configurator.\$productId.tsx app/routes/upload-preview.tsx
git commit -m "feat: upload preview screenshots to Shopify Files API, fix stale origin-prefix on CDN URLs"
```

---

### Task 5: Deploy and verify in the real store

**Files:** none (deployment + manual verification only)

- [ ] **Step 1: Commit, merge to all branches, and push**

```bash
git checkout main && git merge deploy --no-edit
git checkout main-dev && git merge deploy --no-edit
git checkout fix/app-icon-toml-config && git merge deploy --no-edit
git checkout deploy
git push origin deploy main main-dev fix/app-icon-toml-config
```

- [ ] **Step 2: Wait for the GitHub Actions build-and-deploy workflow to succeed**, confirming Railway has the new backend code (poll `https://api.github.com/repos/sweta456/product-configurator/actions/runs` for the commit's run status, same approach used earlier today).

- [ ] **Step 3: Deploy the Shopify-side scope change**

```bash
npx shopify app deploy --allow-updates --message "Add write_files scope for Shopify-hosted uploads"
```

- [ ] **Step 4: Approve the updated access**

Since this adds a new scope, the shop needs to approve updated permissions before file uploads work (the same banner encountered earlier today under Settings → Apps and sales channels → Konfig - Product Customizer). Click through it.

- [ ] **Step 5: End-to-end verification in the real store**

1. In the Builder, upload a fresh `.glb` model for a test product. Confirm the resulting URL is a `cdn.shopify.com` link and the 3D preview renders.
2. Upload a logo/image in the same Builder. Confirm the same.
3. On the live storefront (a real `myshopify.com` URL, not a `shopifypreview.com` preview link), customize the product and add it to cart. Confirm the cart's "Preview Image" property is a working `cdn.shopify.com` link.
4. **The real test**: trigger another deploy (any trivial change, or just re-run Task 5 Step 1's push again) and confirm all three uploaded assets from steps 1-3 are still reachable afterward — this is the actual bug being fixed.
