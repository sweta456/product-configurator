# Live Pricing & Draft-Order Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the existing (but currently unused) admin Pricing tab data into the customer-facing configurator, so customers see a live running total as they customize, and are actually charged that total via a Shopify Draft Order at checkout.

**Architecture:** A new shared pure function `computeConfiguratorPrice()` becomes the single source of truth for price math, used both for a live on-screen total and for the authoritative server-side charge. Products with no pricing configured are completely unaffected — this is strictly additive.

**Tech Stack:** React Router v7 (file-based routes), Prisma, `@shopify/shopify-app-react-router` (`unauthenticated.admin()` for the public checkout endpoint), Shopify Admin GraphQL API 2026-07 (`draftOrderCreate`, validated against the live schema).

## Global Constraints

- No test framework exists in this repo — do not introduce one. Verify the one new pure function with a throwaway script run via `npx tsx`; everything else is verified by running the dev server and checking real behavior.
- Deploy flow: commit → merge to `main`/`main-dev`/`fix/app-icon-toml-config` → push all 4 branches → GitHub Actions builds and pushes to `deploy` → Railway redeploys. Shopify-side config/extension changes (scopes, theme blocks) need a separate `shopify app deploy --allow-updates`.
- Adding a new access scope (`write_draft_orders`) means the merchant will need to approve updated permissions after the next `shopify app deploy` — same process already done twice today for `write_draft_orders`'s predecessors (`write_draft_orders` itself and `write_files`).
- Quantity is fixed at 1 for the customized line item, matching existing cart-add behavior.
- The current scope string in `shopify.app.toml` is: `write_products,read_products,write_orders,read_orders,read_inventory,write_inventory,read_locations,write_publications,read_publications,write_files`

---

### Task 1: Shared pricing types and price calculator

**Files:**
- Modify: `app/types/configurator.ts`

**Interfaces:**
- Produces: `export type PriceOperator = "+" | "-" | "×" | "÷"`, `export interface ExtraPrice { id, questionId, answerId, price }`, `export interface EquationLine { id, type, questionId?, numberValue? }`, `export interface Equation { id, displayCumulative, lines, operators, minResult, maxResult }`, `export interface PricingData { basePrice, displayTaxes, extraPrices, equations }`, `export const DEFAULT_PRICING: PricingData`, `export function computeConfiguratorPrice(pricing: PricingData, selectedAnswers: Record<string, string>): number`

- [ ] **Step 1: Write a throwaway verification script**

Create `C:\Users\Sweta\AppData\Local\Temp\claude\verify-pricing.mjs` (scratch, not committed) with:

```js
import { computeConfiguratorPrice } from "file:///C:/Users/Sweta/product-configurator/app/types/configurator.ts";

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    console.error(`FAIL: ${label} — expected ${expected}, got ${actual}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${label}`);
  }
}

const empty = { basePrice: 0, displayTaxes: false, extraPrices: [], equations: [] };
assertEqual(computeConfiguratorPrice(empty, {}), 0, "no pricing configured -> 0");

const withExtra = {
  basePrice: 62,
  displayTaxes: false,
  extraPrices: [{ id: "ep1", questionId: "q1", answerId: "green", price: 20 }],
  equations: [],
};
assertEqual(computeConfiguratorPrice(withExtra, { q1: "green" }), 82, "base + matching extra price");
assertEqual(computeConfiguratorPrice(withExtra, { q1: "red" }), 62, "base + non-matching extra price");
assertEqual(computeConfiguratorPrice(withExtra, {}), 62, "base + no selection");

const withEquation = {
  basePrice: 10,
  displayTaxes: false,
  extraPrices: [],
  equations: [{
    id: "eq1", displayCumulative: true,
    lines: [{ id: "l1", type: "number", numberValue: 5 }, { id: "l2", type: "number", numberValue: 2 }],
    operators: ["×"], minResult: 0, maxResult: null,
  }],
};
assertEqual(computeConfiguratorPrice(withEquation, {}), 20, "equation: 10 base + (5 x 2)");

const withClamp = {
  basePrice: 0,
  displayTaxes: false,
  extraPrices: [],
  equations: [{
    id: "eq2", displayCumulative: true,
    lines: [{ id: "l1", type: "number", numberValue: 500 }],
    operators: [], minResult: 0, maxResult: 100,
  }],
};
assertEqual(computeConfiguratorPrice(withClamp, {}), 100, "equation result clamped to maxResult");

const withDivByZero = {
  basePrice: 0,
  displayTaxes: false,
  extraPrices: [],
  equations: [{
    id: "eq3", displayCumulative: true,
    lines: [{ id: "l1", type: "number", numberValue: 42 }, { id: "l2", type: "number", numberValue: 0 }],
    operators: ["÷"], minResult: null, maxResult: null,
  }],
};
assertEqual(computeConfiguratorPrice(withDivByZero, {}), 42, "divide by zero leaves value unchanged, no NaN");

console.log(process.exitCode ? "\nSOME TESTS FAILED" : "\nALL TESTS PASSED");
```

- [ ] **Step 2: Run it to confirm it fails (function doesn't exist yet)**

Run: `npx tsx "C:\Users\Sweta\AppData\Local\Temp\claude\verify-pricing.mjs"`
Expected: error — `computeConfiguratorPrice` is not exported from `configurator.ts` yet.

- [ ] **Step 3: Add the types and function to `app/types/configurator.ts`**

Add near the end of the file, after `evaluateLogicRules`:

```ts
export type PriceOperator = "+" | "-" | "×" | "÷";

export interface ExtraPrice {
  id: string;
  questionId: string;
  answerId: string;
  price: number;
}

export interface EquationLine {
  id: string;
  type: "question" | "number";
  questionId?: string;
  numberValue?: number;
}

export interface Equation {
  id: string;
  displayCumulative: boolean;
  lines: EquationLine[];
  operators: PriceOperator[];
  minResult: number | null;
  maxResult: number | null;
}

export interface PricingData {
  basePrice: number;
  displayTaxes: boolean;
  extraPrices: ExtraPrice[];
  equations: Equation[];
}

export const DEFAULT_PRICING: PricingData = {
  basePrice: 0,
  displayTaxes: false,
  extraPrices: [],
  equations: [],
};

/**
 * Single source of truth for configurator pricing math -- used both for the
 * live on-screen total and the authoritative server-side charge, so the two
 * can never drift apart.
 */
export function computeConfiguratorPrice(
  pricing: PricingData,
  selectedAnswers: Record<string, string>,
): number {
  const extraPriceForQuestion = (questionId: string): number => {
    const answerId = selectedAnswers[questionId];
    if (!answerId) return 0;
    const match = pricing.extraPrices.find(
      (ep) => ep.questionId === questionId && ep.answerId === answerId,
    );
    return match?.price ?? 0;
  };

  let total = pricing.basePrice;

  for (const ep of pricing.extraPrices) {
    if (selectedAnswers[ep.questionId] === ep.answerId) {
      total += ep.price;
    }
  }

  for (const eq of pricing.equations) {
    if (eq.lines.length === 0) continue;

    const lineValue = (line: EquationLine): number =>
      line.type === "number"
        ? (line.numberValue ?? 0)
        : extraPriceForQuestion(line.questionId ?? "");

    let result = lineValue(eq.lines[0]);
    for (let i = 1; i < eq.lines.length; i++) {
      const op = eq.operators[i - 1] ?? "+";
      const value = lineValue(eq.lines[i]);
      if (op === "+") result += value;
      else if (op === "-") result -= value;
      else if (op === "×") result *= value;
      else if (op === "÷") result = value === 0 ? result : result / value;
    }

    const min = eq.minResult ?? -Infinity;
    const max = eq.maxResult ?? Infinity;
    result = Math.min(Math.max(result, min), max);

    total += result;
  }

  return Math.round(total * 100) / 100;
}
```

- [ ] **Step 4: Run the verification script again to confirm it passes**

Run: `npx tsx "C:\Users\Sweta\AppData\Local\Temp\claude\verify-pricing.mjs"`
Expected: `ALL TESTS PASSED` with no `FAIL:` lines.

- [ ] **Step 5: Typecheck and commit**

Run: `npm run typecheck` — expect no new errors introduced in `app/types/configurator.ts`.

```bash
git add app/types/configurator.ts
git commit -m "feat: add shared configurator pricing calculator"
```

---

### Task 2: De-duplicate pricing types in the admin Pricing page

**Files:**
- Modify: `app/routes/app.pricing.$productId.tsx:1-40`

**Interfaces:**
- Consumes: `PriceOperator, ExtraPrice, EquationLine, Equation, PricingData` from `../types/configurator` (Task 1)

Pure refactor, no behavior change: the local `ExtraPrice`/`Operator`/`EquationLine`/`Equation`/`PricingData` interfaces duplicate what Task 1 now exports.

- [ ] **Step 1: Replace the local type block**

Replace the file's top import/type block (from the first `import` line through the closing brace of `interface PricingData`) with:

```ts
import { useLoaderData, useSubmit, useActionData, Link } from "react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import {
  type Question,
  type PriceOperator as Operator,
  type ExtraPrice,
  type EquationLine,
  type Equation,
  type PricingData,
  getQuestionAnswers,
  migrateOptions,
} from "../types/configurator";
```

(`PriceOperator as Operator` keeps every existing usage of the local name `Operator` elsewhere in this file working without further edits.)

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck` — expect no new errors from this file.

- [ ] **Step 3: Manually verify the Pricing page still works**

Run the dev server, open the Pricing tab for any product, add/edit an extra price, click Save. Expected: identical behavior to before.

- [ ] **Step 4: Commit**

```bash
git add app/routes/app.pricing.\$productId.tsx
git commit -m "refactor: import shared pricing types instead of duplicating them"
```

---

### Task 3: Add the `write_draft_orders` scope and pass shop currency to the configurator

**Files:**
- Modify: `shopify.app.toml`
- Modify: `extensions/product-configurator/blocks/configurator_block.liquid`
- Modify: `app/routes/configurator.$productId.tsx` (loader)

**Interfaces:**
- Produces: loader now also returns `currencyCode: string` (the loader already returns `shop` as of today's file-storage work)

- [ ] **Step 1: Add the scope**

In `shopify.app.toml`, change:

```toml
scopes = "write_products,read_products,write_orders,read_orders,read_inventory,write_inventory,read_locations,write_publications,read_publications,write_files"
```

to:

```toml
scopes = "write_products,read_products,write_orders,read_orders,read_inventory,write_inventory,read_locations,write_publications,read_publications,write_files,write_draft_orders"
```

- [ ] **Step 2: Pass shop currency from the Liquid block**

In `extensions/product-configurator/blocks/configurator_block.liquid`, find the `configurator_url` assignment:

```liquid
  assign configurator_url = ''
  if base_url != blank and product
    assign configurator_url = base_url | append: '/configurator/' | append: product.id | append: '?shop=' | append: shop.permanent_domain
  endif
```

Change to:

```liquid
  assign configurator_url = ''
  if base_url != blank and product
    assign configurator_url = base_url | append: '/configurator/' | append: product.id | append: '?shop=' | append: shop.permanent_domain | append: '&currency=' | append: shop.currency
  endif
```

- [ ] **Step 3: Return currency from the configurator loader**

In `app/routes/configurator.$productId.tsx`, the loader currently reads `shop` from the query string and already returns it (from today's file-storage work). Add a `currencyCode` read right after the `shop` line:

```ts
  const shop = url.searchParams.get("shop");
```

becomes:

```ts
  const shop = url.searchParams.get("shop");
  const currencyCode = url.searchParams.get("currency") || "USD";
```

Then add `currencyCode` alongside `shop` in both `return` statements (the `!config` early return and the main return at the end of the loader).

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck` — expect no new errors.

- [ ] **Step 5: Commit**

```bash
git add shopify.app.toml extensions/product-configurator/blocks/configurator_block.liquid app/routes/configurator.\$productId.tsx
git commit -m "feat: add write_draft_orders scope, pass shop currency to configurator"
```

**Note:** deploy this via `shopify app deploy --allow-updates` alongside Task 5, and expect the merchant to need to approve updated permissions once (see Task 5).

---

### Task 4: Live running price total and draft-order checkout wiring

**Files:**
- Modify: `app/routes/configurator.$productId.tsx` (imports, component setup, `handleAddToCart`, Add to Cart JSX)
- Create: `app/routes/configurator.$productId.checkout.tsx`

**Interfaces:**
- Consumes: `computeConfiguratorPrice`, `PricingData`, `DEFAULT_PRICING` from `../types/configurator` (Task 1); `unauthenticated` from `../shopify.server`; `prisma` from `../db.server`
- Produces: `POST /configurator/:productId/checkout?shop=...` accepting `{ selectedAnswers, customAttributes }`, returning `{ invoiceUrl }` or `{ error }`

- [ ] **Step 1: Import the new pricing utilities**

In `app/routes/configurator.$productId.tsx`, add to the existing `../types/configurator` import block: `type PricingData`, `computeConfiguratorPrice`, `DEFAULT_PRICING`. Also ensure `useMemo` is imported from `"react"` (it already is, per the existing `import { useState, useRef, useEffect, useMemo } from "react";`).

- [ ] **Step 2: Derive pricing state and the live total**

Directly after the `numViews` derivation in the component (`const numViews: number = ...`), add:

```ts
  const pricing: PricingData = { ...DEFAULT_PRICING, ...((config?.options as any)?.pricing ?? {}) };
  const pricingActive = pricing.basePrice > 0 || pricing.extraPrices.length > 0 || pricing.equations.length > 0;
  const numericProductId = productId.split("/").pop();
```

After the `selectedAnswers` state declaration, add:

```ts
  const currentTotal = useMemo(
    () => computeConfiguratorPrice(pricing, selectedAnswers),
    [pricing, selectedAnswers],
  );

  const formattedTotal = useMemo(() => {
    try {
      return new Intl.NumberFormat("en", { style: "currency", currency: currencyCode }).format(currentTotal);
    } catch {
      return `${currencyCode} ${currentTotal.toFixed(2)}`;
    }
  }, [currentTotal, currencyCode]);

  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
```

(Destructure `currencyCode` alongside `shop` from `useLoaderData()` if it isn't already, per Task 3.)

- [ ] **Step 3: Branch `handleAddToCart` on `pricingActive`**

Inside `handleAddToCart`'s `setTimeout(async () => { ... })` block, after the existing preview-image upload code and before the `window.parent.postMessage(...)` call, insert a branch: if `pricingActive`, POST to the new checkout route and redirect top-level instead of posting to the parent. The end of the function becomes:

```ts
      if (pricingActive) {
        setCheckoutLoading(true);
        try {
          const customAttributes = Object.entries(properties).map(([key, value]) => ({ key, value }));
          const resp = await fetch(`/configurator/${numericProductId}/checkout?shop=${encodeURIComponent(shop)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ selectedAnswers, customAttributes }),
          });
          const data = await resp.json();
          if (data.invoiceUrl) {
            window.top!.location.href = data.invoiceUrl;
          } else {
            setCheckoutError(data.error || "Could not start checkout. Please try again.");
            setCheckoutLoading(false);
          }
        } catch {
          setCheckoutError("Could not start checkout. Please check your connection and try again.");
          setCheckoutLoading(false);
        }
        return;
      }

      window.parent.postMessage(
        {
          type: "configurator:add-to-cart",
          properties,
          previewDataUrl,
          previewUrl,
          cartAction: appSet.cartAction,
          rawSelections: { selectedAnswers, textValues, textColors, textSizes, textFonts },
        },
        "*",
      );
    }, 80);
  };
```

Also add `setCheckoutError(null);` right before the existing `setSelectedId(null);` line at the top of the same handler, to clear any previous error on a fresh attempt.

- [ ] **Step 4: Render the live total, error banner, and loading state**

In the "Add to Cart" block, add the price row and error banner before the button, and disable the button while loading:

```tsx
              {pricingActive && (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "0 2px 10px", fontSize: 14, color: "var(--cf-text, #111827)",
                }}>
                  <span style={{ fontWeight: 500 }}>Total</span>
                  <span style={{ fontWeight: 700, fontSize: 17 }}>{formattedTotal}</span>
                </div>
              )}
              {checkoutError && (
                <div style={{
                  padding: "8px 12px", marginBottom: 8, borderRadius: 6,
                  background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontSize: 13,
                }}>
                  {checkoutError}
                </div>
              )}
              <button
                onClick={handleAddToCart}
                disabled={checkoutLoading}
                className="cf-add-btn"
                style={{
                  width: "100%", padding: "15px 20px",
                  color: "#fff", border: "none", borderRadius: "var(--cf-btn-radius, var(--cf-radius))",
                  fontWeight: 700, fontSize: 14, cursor: checkoutLoading ? "wait" : "pointer",
                  letterSpacing: "0.02em", opacity: checkoutLoading ? 0.7 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                }}
              >
```

- [ ] **Step 5: Create the checkout route**

Create `app/routes/configurator.$productId.checkout.tsx`:

```ts
import { unauthenticated } from "../shopify.server";
import prisma from "../db.server";
import { type PricingData, DEFAULT_PRICING, computeConfiguratorPrice } from "../types/configurator";

// Public (no Shopify admin auth) endpoint -- the storefront iframe POSTs here
// when the product has pricing configured, to get a real Shopify checkout
// link charging the computed total. Never trust a price from the client:
// only the customer's *selections* are read here; the price is always
// recomputed from the product's own stored pricing config.
export async function action({ request, params }: any) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const numericId = params.productId;

  if (!shop || !numericId) {
    return Response.json({ error: "Missing shop or product" }, { status: 400 });
  }

  const productId = `gid://shopify/Product/${numericId}`;

  let body: { selectedAnswers?: Record<string, string>; customAttributes?: { key: string; value: string }[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const selectedAnswers = body.selectedAnswers ?? {};
  const customAttributes = body.customAttributes ?? [];

  const config = await prisma.productConfig.findFirst({ where: { productId, shop } });
  if (!config) {
    return Response.json({ error: "Product configuration not found" }, { status: 404 });
  }

  const pricing: PricingData = { ...DEFAULT_PRICING, ...((config.options as any)?.pricing ?? {}) };
  const total = computeConfiguratorPrice(pricing, selectedAnswers);

  let admin;
  try {
    ({ admin } = await unauthenticated.admin(shop));
  } catch {
    return Response.json(
      { error: "Unable to process checkout for this store right now. Please contact the store." },
      { status: 502 },
    );
  }

  const productName = (config as any).productName ?? "Customized product";

  const resp = await admin.graphql(
    `#graphql
    mutation CreateConfiguratorDraftOrder($input: DraftOrderInput!) {
      draftOrderCreate(input: $input) {
        draftOrder { id invoiceUrl }
        userErrors { field message }
      }
    }`,
    {
      variables: {
        input: {
          lineItems: [
            {
              title: `${productName} (Customized)`,
              originalUnitPrice: total.toFixed(2),
              quantity: 1,
              taxable: pricing.displayTaxes,
              requiresShipping: true,
              customAttributes,
            },
          ],
        },
      },
    },
  );

  const data = await resp.json();
  const userErrors = data.data?.draftOrderCreate?.userErrors ?? [];
  if (userErrors.length > 0) {
    return Response.json({ error: userErrors[0].message }, { status: 502 });
  }

  const invoiceUrl = data.data?.draftOrderCreate?.draftOrder?.invoiceUrl;
  if (!invoiceUrl) {
    return Response.json({ error: "Checkout could not be created. Please try again." }, { status: 502 });
  }

  return Response.json({ invoiceUrl });
}
```

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck` — expect no new errors.

- [ ] **Step 7: Commit**

```bash
git add app/routes/configurator.\$productId.tsx app/routes/configurator.\$productId.checkout.tsx
git commit -m "feat: live price total and draft-order checkout for priced products"
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

- [ ] **Step 2: Wait for the GitHub Actions build-and-deploy workflow to succeed**, confirming Railway has the new backend code (poll `https://api.github.com/repos/sweta456/product-configurator/actions/runs` for the commit's run status).

- [ ] **Step 3: Deploy the Shopify-side scope and extension change**

```bash
npx shopify app deploy --allow-updates --message "Add write_draft_orders scope, live pricing checkout"
```

- [ ] **Step 4: Approve the updated access**

Since this adds a new scope, the shop will need to approve updated permissions before draft orders can be created (Settings → Apps and sales channels → Konfig - Product Customizer).

- [ ] **Step 5: End-to-end verification in the real store**

1. Confirm a product's Pricing tab has a base price and at least one extra price configured (e.g. "TEST123": $62 base + $20 "Green").
2. Open that product's live storefront page (a real `myshopify.com` URL, not a `shopifypreview.com` preview link).
3. Click "Customize This Product", select the priced option, confirm the live total updates to reflect base + extra (e.g. $82.00).
4. Click "Add to Cart", confirm the browser navigates to a Shopify checkout page showing the correct total.
5. Confirm a product with **no** pricing configured still adds to cart normally with no behavior change.
