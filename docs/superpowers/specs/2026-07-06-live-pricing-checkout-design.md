# Live Pricing & Draft-Order Checkout — Design

## Problem

The admin Pricing tab (`app/routes/app.pricing.$productId.tsx`) already lets a merchant configure a base price, per-answer "extra prices," and equations — but none of this data is connected to anything customer-facing. The customer-facing configurator (`app/routes/configurator.$productId.tsx`) loads the same `productConfig.options.pricing` object today but never reads it. The storefront's "Add to Cart" flow (`extensions/product-configurator/blocks/configurator_block.liquid`) always adds the product's plain Shopify variant at its listed price, regardless of what the customer picked. Confirmed live: a product with a $62 base price and a $20 "Green" extra price checks out at exactly $62 no matter what the customer selects.

This design closes that gap: the pricing the merchant configures becomes both a live, visible running total while the customer is customizing, and the actual amount they're charged at checkout.

## Scope

- Applies only to products where pricing is actually configured (`pricing.basePrice > 0`, or `pricing.extraPrices.length > 0`, or `pricing.equations.length > 0`). Products without any pricing configuration keep today's exact behavior (plain `/cart/add.js` at the product's Shopify price) — zero behavior change for them.
- Quantity stays fixed at 1, matching the existing add-to-cart behavior.
- The "Add to Cart" button label stays as "Add to Cart" even though its behavior becomes an immediate checkout redirect for priced products (confirmed preference).
- Out of scope: combining a customized item with other items in one cart/checkout; discount codes on the draft-order checkout; abuse/rate-limiting protection beyond basic shop/product validation.

## Architecture

### Shared price calculator

A new pure function in `app/types/configurator.ts`:

```ts
function computeConfiguratorPrice(
  pricing: PricingData,
  selectedAnswers: Record<string, string>,
): number
```

Logic: start at `pricing.basePrice`. For every entry in `pricing.extraPrices` whose `(questionId, answerId)` matches the current `selectedAnswers`, add its `price`. For every entry in `pricing.equations`, resolve each line (a literal `numberValue`, or the extra-price total contributed by that question's current selection) and combine them left-to-right using that equation's `operators` (`+ - × ÷`), then clamp the result to `[minResult, maxResult ?? Infinity]` before adding it to the running total.

This function is the single source of truth: it's used both to render the live on-screen total and to compute the authoritative charge server-side. No price value is ever trusted from the client for the actual charge.

### Customer-facing configurator (`configurator.$productId.tsx`)

- On load, determine `pricingActive = pricing.basePrice > 0 || pricing.extraPrices.length > 0 || pricing.equations.length > 0`.
- If `pricingActive`, render a live total near the Add to Cart button, recomputed via `useMemo(() => computeConfiguratorPrice(pricing, selectedAnswers), [pricing, selectedAnswers])`, formatted with the shop's currency.
- Currency: sourced from a new `currency` query param on `configurator_url`, set from Liquid's `shop.currency` in `configurator_block.liquid` — the same pattern already used for the existing `shop` param.
- **Add to Cart button behavior branches on `pricingActive`:**
  - `false` (unchanged): `postMessage({type: 'configurator:add-to-cart', properties})` to the parent page, which does the existing `/cart/add.js` flow.
  - `true` (new): the iframe calls its own backend directly — `POST /configurator/$productId/checkout?shop=...` with `{ selectedAnswers, customAttributes }` — then, on success, sets `window.top.location.href = invoiceUrl` to navigate the whole page out of the iframe to Shopify's hosted checkout for the resulting draft order.

### Server action (`configurator.$productId.checkout.tsx`, new route)

1. Parse the POST body for `selectedAnswers` and `customAttributes`.
2. Look up `prisma.productConfig` for the product to get the canonical `pricing` config and product title — never trust a price sent by the client, only trust their *selections*.
3. Recompute the authoritative total via `computeConfiguratorPrice`.
4. Get an admin client for the shop via `unauthenticated.admin(shop)` (the same mechanism already used for the file-upload and metafield work today).
5. Call `draftOrderCreate` with one custom line item: `title` = product name, `originalUnitPrice` = computed total, `quantity` = 1, `customAttributes` = the same property list already built for the normal cart-add flow, `taxable` = `pricing.displayTaxes`.
6. Return `{ invoiceUrl: draftOrder.invoiceUrl }` on success.

## Error handling

- No valid stored session for the shop (app not installed / token missing): return `{ error: "..." }`; the iframe shows an inline error banner in its own React UI (not a bare `alert()`, not a redirect) with a retry option.
- `draftOrderCreate` returns `userErrors`: same inline-error treatment.
- Network/unexpected failure calling the action: same inline-error treatment.

## Known limitations (explicitly out of scope for this pass)

- A draft-order checkout is a separate, single-item checkout — it cannot be combined with other items in a normal cart.
- Discount codes are not guaranteed to behave the same as on a normal cart checkout.
- No rate-limiting beyond confirming the shop/product are real and pricing is configured for that product.
- `pricing.displayTaxes` only toggles the draft order's `taxable` flag; Shopify's own tax engine computes the actual amount — this app does not calculate tax itself.
