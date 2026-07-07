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
