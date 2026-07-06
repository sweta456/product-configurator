# Live Pricing & Draft-Order Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the existing (but currently unused) admin Pricing tab data into the customer-facing configurator, so customers see a live running total as they customize, and are actually charged that total via a Shopify Draft Order at checkout.

**Architecture:** A new shared pure function `computeConfiguratorPrice()` becomes the single source of truth for price math, used both for a live on-screen total and for the authoritative server-side charge. Products with no pricing configured are completely unaffected — this is strictly additive.

**Tech Stack:** React Router v7 (file-based routes), Prisma, `@shopify/shopify-app-react-router` (`unauthenticated.admin()` for the public checkout endpoint), Shopify Admin GraphQL API 2026-07 (`draftOrderCreate`).

## Global Constraints

- No test framework exists in this repo (no vitest/jest/mocha, no `test` script in `package.json`). Do not introduce one. Verify the one new pure function with a throwaway script run via `npx tsx` (zero-install TS runner); everything else is verified by running the dev server and checking real behavior, consistent with how the rest of this codebase has always been verified.
- This app is deployed via: `git commit` → merge to `main`/`main-dev`/`fix/app-icon-toml-config` → push all 4 branches → GitHub Actions builds and pushes to the `deploy` branch → Railway redeploys. Shopify-side config/extension changes (scopes, theme blocks) need a separate `shopify app deploy --allow-updates`.
- Adding a new access scope (`write_draft_orders`) means the merchant will need to approve updated permissions after the next `shopify app deploy` — this is expected, not a bug (learned the hard way earlier today).
- Quantity is fixed at 1 for the customized line item, matching existing cart-add behavior.

---

### Task 1: Shared pricing types and price calculator

**Files:**
- Modify: `app/types/configurator.ts`

**Interfaces:**
- Produces: `export type PriceOperator = "+" | "-" | "×" | "÷"`, `export interface ExtraPrice { id, questionId, answerId, price }`, `export interface EquationLine { id, type, questionId?, numberValue? }`, `export interface Equation { id, displayCumulative, lines, operators, minResult, maxResult }`, `export interface PricingData { basePrice, displayTaxes, extraPrices, equations }`, `export function computeConfiguratorPrice(pricing: PricingData, selectedAnswers: Record<string, string>): number`

- [ ] **Step 1: Write a throwaway verification script**

Create a temporary file at `C:\Users\Sweta\AppData\Local\Temp\claude\verify-pricing.ts` (outside the repo — this is scratch, not committed) with:

```ts
import { computeConfiguratorPrice, type PricingData } from "../../../../product-configurator/app/types/configurator";

function assertEqual(actual: number, expected: number, label: string) {
  if (actual !== expected) {
    console.error(`FAIL: ${label} — expected ${expected}, got ${actual}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${label}`);
  }
}

const empty: PricingData = { basePrice: 0, displayTaxes: false, extraPrices: [], equations: [] };
assertEqual(computeConfiguratorPrice(empty, {}), 0, "no pricing configured -> 0");

const withExtra: PricingData = {
  basePrice: 78,
  displayTaxes: false,
  extraPrices: [{ id: "ep1", questionId: "q1", answerId: "red", price: 30 }],
  equations: [],
};
assertEqual(computeConfiguratorPrice(withExtra, { q1: "red" }), 108, "base + matching extra price");
assertEqual(computeConfiguratorPrice(withExtra, { q1: "blue" }), 78, "base + non-matching extra price");
assertEqual(computeConfiguratorPrice(withExtra, {}), 78, "base + no selection");

const withEquation: PricingData = {
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

const withClamp: PricingData = {
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

const withDivByZero: PricingData = {
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

Run: `npx tsx "C:\Users\Sweta\AppData\Local\Temp\claude\verify-pricing.ts"`
Expected: module resolution error — `computeConfiguratorPrice` is not exported from `configurator.ts` yet.

- [ ] **Step 3: Add the types and function to `app/types/configurator.ts`**

Add near the end of the file, after `evaluateLogicRules` (after line 387):

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

Run: `npx tsx "C:\Users\Sweta\AppData\Local\Temp\claude\verify-pricing.ts"`
Expected: `ALL TESTS PASSED` with no `FAIL:` lines. Fix `computeConfiguratorPrice` and re-run until every line prints `PASS:`.

- [ ] **Step 5: Typecheck and commit**

Run: `npm run typecheck` — expect no new errors introduced in `app/types/configurator.ts` (pre-existing unrelated errors elsewhere are fine, e.g. `app.configurator-setup.$productId.tsx`).

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

This is a pure refactor — no behavior change. The local `ExtraPrice`/`Operator`/`EquationLine`/`Equation`/`PricingData` interfaces (lines 9–39) duplicate what Task 1 now exports from the shared file. Remove the duplicates and import instead.

- [ ] **Step 1: Replace the local type block**

In `app/routes/app.pricing.$productId.tsx`, replace lines 1–39 (from the top import through the closing brace of `interface PricingData`):

```ts
import { useLoaderData, useSubmit, useActionData, Link } from "react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { type Question, getQuestionAnswers, migrateOptions } from "../types/configurator";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExtraPrice {
  id: string;
  questionId: string;
  answerId: string;
  price: number;
}

type Operator = "+" | "-" | "×" | "÷";

interface EquationLine {
  id: string;
  type: "question" | "number";
  questionId?: string;
  numberValue?: number;
}

interface Equation {
  id: string;
  displayCumulative: boolean;
  lines: EquationLine[];
  operators: Operator[];
  minResult: number | null;
  maxResult: number | null;
}

interface PricingData {
  basePrice: number;
  displayTaxes: boolean;
  extraPrices: ExtraPrice[];
  equations: Equation[];
}
```

with:

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

Run: `npm run typecheck`
Expected: no new errors from this file. If any type mismatch appears, compare field-by-field against the Task 1 definitions and fix the call site (not the shared type).

- [ ] **Step 3: Manually verify the Pricing page still works**

Run the dev server (`npm run dev`), open the app's Pricing tab for any product, add/edit an extra price, click Save. Expected: identical behavior to before this change (this step only moved type declarations).

- [ ] **Step 4: Commit**

```bash
git add app/routes/app.pricing.\$productId.tsx
git commit -m "refactor: import shared pricing types instead of duplicating them"
```

---

### Task 3: Add the `write_draft_orders` scope and pass shop currency to the configurator

**Files:**
- Modify: `shopify.app.toml`
- Modify: `extensions/product-configurator/blocks/configurator_block.liquid:1-9`
- Modify: `app/routes/configurator.$productId.tsx:41-75`

**Interfaces:**
- Produces: loader now also returns `shop: string` and `currencyCode: string` for the client component to consume in Task 4.

- [ ] **Step 1: Add the scope**

In `shopify.app.toml`, under `[access_scopes]`, change:

```toml
scopes = "write_products,read_products,write_orders,read_orders,read_inventory,write_inventory,read_locations,write_publications,read_publications"
```

to:

```toml
scopes = "write_products,read_products,write_orders,read_orders,read_inventory,write_inventory,read_locations,write_publications,read_publications,write_draft_orders"
```

- [ ] **Step 2: Pass shop currency from the Liquid block**

In `extensions/product-configurator/blocks/configurator_block.liquid`, change the `configurator_url` assignment (lines 6-9):

```liquid
  assign configurator_url = ''
  if base_url != blank and product
    assign configurator_url = base_url | append: '/configurator/' | append: product.id | append: '?shop=' | append: shop.permanent_domain
  endif
```

to:

```liquid
  assign configurator_url = ''
  if base_url != blank and product
    assign configurator_url = base_url | append: '/configurator/' | append: product.id | append: '?shop=' | append: shop.permanent_domain | append: '&currency=' | append: shop.currency
  endif
```

- [ ] **Step 3: Return shop and currency from the configurator loader**

In `app/routes/configurator.$productId.tsx`, the loader currently reads (lines 41-75):

```ts
export async function loader({ request, params }: any) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const numericId = params.productId;

  if (!shop) throw new Response("Missing shop parameter", { status: 400 });

  const productId = `gid://shopify/Product/${numericId}`;

  const [config, appSettingsRecord] = await Promise.all([
    prisma.productConfig.findFirst({ where: { productId, shop } }),
    (prisma as any).appSettings.findUnique({ where: { shop } }),
  ]);

  const appSettings: AppSettings = { ...DEFAULT_APP_SETTINGS, ...((appSettingsRecord?.settings as any) ?? {}) };

  if (!config) {
    return { config: null, productName: "Product", productId, appSettings };
  }

  const opts = (config as any).options ?? {};
  const configuratorStyle: ConfiguratorStyle = { ...DEFAULT_STYLE, ...(opts.configuratorStyle ?? {}) };
  const modelMode: boolean = opts.modelMode === true;
  const glbUrl: string | undefined = opts.glbUrl as string | undefined;

  return {
    config,
    productName: (config as any).productName ?? "Product",
    productId,
    configuratorStyle,
    modelMode,
    glbUrl,
    appSettings,
  };
}
```

Change the two `return` statements to also include `shop` and `currencyCode`:

```ts
export async function loader({ request, params }: any) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const currencyCode = url.searchParams.get("currency") || "USD";
  const numericId = params.productId;

  if (!shop) throw new Response("Missing shop parameter", { status: 400 });

  const productId = `gid://shopify/Product/${numericId}`;

  const [config, appSettingsRecord] = await Promise.all([
    prisma.productConfig.findFirst({ where: { productId, shop } }),
    (prisma as any).appSettings.findUnique({ where: { shop } }),
  ]);

  const appSettings: AppSettings = { ...DEFAULT_APP_SETTINGS, ...((appSettingsRecord?.settings as any) ?? {}) };

  if (!config) {
    return { config: null, productName: "Product", productId, appSettings, shop, currencyCode };
  }

  const opts = (config as any).options ?? {};
  const configuratorStyle: ConfiguratorStyle = { ...DEFAULT_STYLE, ...(opts.configuratorStyle ?? {}) };
  const modelMode: boolean = opts.modelMode === true;
  const glbUrl: string | undefined = opts.glbUrl as string | undefined;

  return {
    config,
    productName: (config as any).productName ?? "Product",
    productId,
    configuratorStyle,
    modelMode,
    glbUrl,
    appSettings,
    shop,
    currencyCode,
  };
}
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck` — expect no new errors.

- [ ] **Step 5: Commit**

```bash
git add shopify.app.toml extensions/product-configurator/blocks/configurator_block.liquid app/routes/configurator.\$productId.tsx
git commit -m "feat: add write_draft_orders scope, pass shop currency to configurator"
```

**Note:** this scope change needs `shopify app deploy --allow-updates` after this task is deployed, and the merchant will need to approve the updated permissions (see Task 7).

---

### Task 4: Live running price total on the customer-facing configurator

**Files:**
- Modify: `app/routes/configurator.$productId.tsx:1-30` (imports), `:409-419` (component setup)

**Interfaces:**
- Consumes: `computeConfiguratorPrice`, `PricingData`, `DEFAULT_PRICING` from `../types/configurator` (Task 1); `shop`, `currencyCode` from the loader (Task 3)
- Produces: `pricing: PricingData`, `pricingActive: boolean`, `currentTotal: number` available to later tasks in this same component

- [ ] **Step 1: Import the new pricing utilities**

In `app/routes/configurator.$productId.tsx`, change the import block (lines 13-28):

```ts
import {
  type LayerConfig,
  type Question,
  type ColorQuestion,
  type ThumbnailQuestion,
  type DropdownQuestion,
  type GroupQuestion,
  type ConfiguratorStyle,
  type AppSettings,
  type LogicRule,
  getLayerSrc,
  migrateOptions,
  evaluateLogicRules,
  DEFAULT_STYLE,
  DEFAULT_APP_SETTINGS,
} from "../types/configurator";
```

to:

```ts
import {
  type LayerConfig,
  type Question,
  type ColorQuestion,
  type ThumbnailQuestion,
  type DropdownQuestion,
  type GroupQuestion,
  type ConfiguratorStyle,
  type AppSettings,
  type LogicRule,
  type PricingData,
  getLayerSrc,
  migrateOptions,
  evaluateLogicRules,
  computeConfiguratorPrice,
  DEFAULT_STYLE,
  DEFAULT_APP_SETTINGS,
  DEFAULT_PRICING,
} from "../types/configurator";
```

- [ ] **Step 2: Destructure the new loader fields and derive pricing state**

Change the component's data destructure (line 410):

```ts
  const { config, productName, configuratorStyle, modelMode, glbUrl, appSettings } = useLoaderData() as any;
```

to:

```ts
  const { config, productName, configuratorStyle, modelMode, glbUrl, appSettings, shop, currencyCode } = useLoaderData() as any;
```

Then, directly after the `questions`/`logicRules`/`numViews` derivation (after line 436, `const numViews: number = ...`), add:

```ts
  const pricing: PricingData = { ...DEFAULT_PRICING, ...((config?.options as any)?.pricing ?? {}) };
  const pricingActive = pricing.basePrice > 0 || pricing.extraPrices.length > 0 || pricing.equations.length > 0;
```

- [ ] **Step 3: Compute the live total**

After `selectedAnswers` state is declared (after line 452, the closing `});` of the `useState<Record<string, string>>` initializer), add:

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
```

(`useMemo` is already imported at the top of the file per line 2: `import { useState, useRef, useEffect, useMemo } from "react";` — confirm this import exists; if not, add `useMemo` to it.)

- [ ] **Step 4: Render the live total above the Add to Cart button**

Find the "Add to Cart" block (around line 1314-1339):

```tsx
            {/* ── Add to Cart ── */}
            <div style={{
              padding: isMobile ? "0" : "14px 16px 16px",
              borderTop: isMobile ? "none" : `1px solid var(--cf-border)`,
              background: isMobile ? "transparent" : "linear-gradient(180deg, var(--cf-surface) 0%, #f8f9ff 100%)",
              flexShrink: 0,
            }}>
              <button
                onClick={handleAddToCart}
```

Add a price row directly above the `<button>`, inside the same wrapping `<div>`:

```tsx
            {/* ── Add to Cart ── */}
            <div style={{
              padding: isMobile ? "0" : "14px 16px 16px",
              borderTop: isMobile ? "none" : `1px solid var(--cf-border)`,
              background: isMobile ? "transparent" : "linear-gradient(180deg, var(--cf-surface) 0%, #f8f9ff 100%)",
              flexShrink: 0,
            }}>
              {pricingActive && (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "0 2px 10px", fontSize: 14, color: "var(--cf-text, #111827)",
                }}>
                  <span style={{ fontWeight: 500 }}>Total</span>
                  <span style={{ fontWeight: 700, fontSize: 17 }}>{formattedTotal}</span>
                </div>
              )}
              <button
                onClick={handleAddToCart}
```

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck` — expect no new errors.

- [ ] **Step 6: Manually verify**

Run the dev server, open a product's configurator with pricing configured (e.g. the "Tesrt" product with a $78 base + $30 "red" extra price used earlier today). Confirm: selecting the "red" option updates the displayed total to $108.00 live, with no page reload. Confirm a product with no pricing configured shows no price row at all (unchanged from before this task).

- [ ] **Step 7: Commit**

```bash
git add app/routes/configurator.\$productId.tsx
git commit -m "feat: show live running price total in customer configurator"
```

---

### Task 5: Server-side draft-order checkout endpoint

**Files:**
- Create: `app/routes/configurator.$productId.checkout.tsx`

**Interfaces:**
- Consumes: `computeConfiguratorPrice`, `PricingData`, `DEFAULT_PRICING` from `../types/configurator`; `unauthenticated` from `../shopify.server`; `prisma` from `../db.server`
- Produces: `POST /configurator/:productId/checkout?shop=...` accepting JSON body `{ selectedAnswers: Record<string,string>, customAttributes: {key: string, value: string}[] }`, returning `{ invoiceUrl: string }` on success or `{ error: string }` (400/404/502) on failure

- [ ] **Step 1: Create the route file**

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

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck` — expect no new errors.

- [ ] **Step 3: Manually verify with a direct request**

With the dev server running and a real installed shop/session available, run (adjust `productId` and `shop` to a real configured product):

```bash
curl -X POST "http://localhost:3000/configurator/<numericProductId>/checkout?shop=<shop>.myshopify.com" \
  -H "Content-Type: application/json" \
  -d '{"selectedAnswers":{"q1":"red"},"customAttributes":[{"key":"Untitled image","value":"red"}]}'
```

Expected: JSON response containing `invoiceUrl` pointing to a `myshopify.com` checkout link. Open that URL in a browser and confirm the draft order's total matches the expected computed price (base + matching extra prices).

- [ ] **Step 4: Commit**

```bash
git add app/routes/configurator.\$productId.checkout.tsx
git commit -m "feat: add draft-order checkout endpoint for priced configurator products"
```

---

### Task 6: Wire "Add to Cart" to the new checkout flow when pricing is active

**Files:**
- Modify: `app/routes/configurator.$productId.tsx:709-807` (`handleAddToCart`), plus new local state for the error banner

**Interfaces:**
- Consumes: `pricingActive`, `selectedAnswers`, `shop` (all already available in this component after Tasks 3-4); `POST /configurator/:productId/checkout` (Task 5)

- [ ] **Step 1: Add error-banner state**

Directly after the `currentTotal`/`formattedTotal` block added in Task 4, add:

```ts
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
```

- [ ] **Step 2: Derive `numericProductId` for the checkout fetch URL**

Directly after the `pricingActive` line added in Task 4, add:

```ts
  const numericProductId = productId.split("/").pop();
```

- [ ] **Step 3: Extract the existing properties-building logic and branch on `pricingActive`**

The current `handleAddToCart` (lines 709-807) builds a `properties` object, then always uploads a preview image and posts a `configurator:add-to-cart` message to the parent. Change the end of that function (the `setTimeout(async () => { ... }, 80);` block, lines 773-806) from:

```ts
    setSelectedId(null);

    setTimeout(async () => {
      const previewDataUrl = stageRef.current?.toDataURL({ pixelRatio: 2 });

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

to:

```ts
    setSelectedId(null);
    setCheckoutError(null);

    setTimeout(async () => {
      const previewDataUrl = stageRef.current?.toDataURL({ pixelRatio: 2 });

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

- [ ] **Step 4: Render the error banner and loading state**

In the same "Add to Cart" block edited in Task 4, change:

```tsx
              <button
                onClick={handleAddToCart}
                className="cf-add-btn"
                style={{
                  width: "100%", padding: "15px 20px",
                  color: "#fff", border: "none", borderRadius: "var(--cf-btn-radius, var(--cf-radius))",
                  fontWeight: 700, fontSize: 14, cursor: "pointer",
                  letterSpacing: "0.02em",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                }}
              >
```

to:

```tsx
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

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck` — expect no new errors.

- [ ] **Step 6: Manually verify end-to-end**

Run the dev server, open the storefront product page for a product with pricing configured, select options, confirm the live total (Task 4) updates, click "Add to Cart". Expected: the page navigates out of the iframe to a real Shopify checkout page showing the correct total. For a product with no pricing configured, confirm behavior is completely unchanged (still uses the normal cart-add flow).

- [ ] **Step 7: Commit**

```bash
git add app/routes/configurator.\$productId.tsx
git commit -m "feat: route Add to Cart through draft-order checkout for priced products"
```

---

### Task 7: Deploy and verify in the real store

**Files:** none (deployment + manual verification only)

- [ ] **Step 1: Commit, merge to all branches, and push**

```bash
git checkout main && git merge deploy --no-edit
git checkout main-dev && git merge deploy --no-edit
git checkout fix/app-icon-toml-config && git merge deploy --no-edit
git checkout deploy
git push origin deploy main main-dev fix/app-icon-toml-config
```

- [ ] **Step 2: Wait for the GitHub Actions build-and-deploy workflow to succeed**, confirming Railway has the new backend code (same verification approach used earlier today — poll `https://api.github.com/repos/sweta456/product-configurator/actions/runs` for the commit's run status).

- [ ] **Step 3: Deploy the Shopify-side scope change**

```bash
npx shopify app deploy --allow-updates --message "Add write_draft_orders scope for priced checkout"
```

- [ ] **Step 4: Approve the updated access**

Since this adds a new scope, the shop will need to approve updated permissions before draft orders can be created (the exact banner encountered earlier today under Settings → Apps and sales channels → Konfig - Product Customizer). Click through it.

- [ ] **Step 5: End-to-end verification in the real store**

1. Configure a base price and at least one extra price for a real test product's Pricing tab, Save.
2. Open that product's live storefront page (not a `shopifypreview.com` preview link — a real `myshopify.com` URL, per today's earlier finding that preview links block real checkout).
3. Click "Customize This Product", select the option with an extra price, confirm the live total updates correctly.
4. Click "Add to Cart", confirm the browser navigates to a Shopify checkout page showing the correct total (base + extra price).
5. Confirm a product with **no** pricing configured still adds to cart normally with no behavior change.
