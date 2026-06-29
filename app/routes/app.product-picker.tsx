import { apiVersion } from "../shopify.server"; // add to imports
import { useActionData, useNavigation, useSubmit, useNavigate } from "react-router";
import { useState, useCallback, useEffect } from "react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Button,
  Banner,
  BlockStack,
  InlineStack,
  Text,
  Box,
  Divider,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

// ─── Action ───────────────────────────────────────────────────────────────────

export async function action({ request }: any) {
  // Catch auth redirects (bounce page / OAuth) that happen when the session token
  // is missing from the POST request. These occur when App Bridge hasn't patched
  // window.fetch yet, or when SHOPIFY_API_KEY in Railway is wrong.
  let admin: any, session: any;
  try {
    ({ admin, session } = await authenticate.admin(request));
  } catch (e) {
    if (e instanceof Response && (e.status === 301 || e.status === 302)) {
      return { error: "Session expired — please reload the page and try again." };
    }
    throw e;
  }
  const formData = await request.formData();

  const title = (formData.get("title") as string)?.trim();
  const price = (formData.get("price") as string)?.trim() || "0.00";
  const description = (formData.get("description") as string)?.trim() || "";
  const stock = parseInt((formData.get("stock") as string)?.trim() || "0", 10);

  if (!title) return { error: "Product name is required." };

  // Create product as DRAFT — not publicly visible until explicitly published
  const createResp = await admin.graphql(
    `mutation ProductCreate($input: ProductInput!) {
      productCreate(input: $input) {
        product {
          id title handle
          variants(first: 1) {
            edges { node { id inventoryItem { id } } }
          }
        }
        userErrors { field message }
      }
    }`,
    {
      variables: {
        input: {
          title,
          descriptionHtml: description,
          status: "DRAFT",
        },
      },
    },
  );

  const createData = await createResp.json();
  const errs = createData.data?.productCreate?.userErrors ?? [];
  if (errs.length > 0) return { error: errs[0].message };

  const product = createData.data?.productCreate?.product;
  if (!product) return { error: "Failed to create product. Please try again." };

  const variantId = product.variants?.edges?.[0]?.node?.id;
  const inventoryItemId = product.variants?.edges?.[0]?.node?.inventoryItem?.id;

  if (variantId && parseFloat(price) > 0) {
    await admin.graphql(
      `mutation VariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
          userErrors { field message }
        }
      }`,
      {
        variables: {
          productId: product.id,
          variants: [{ id: variantId, price }],
        },
      },
    );
  }

  if (inventoryItemId) {
    const locResp = await admin.graphql(
      `query { locations(first: 1) { edges { node { id } } } }`,
    );
    const locData = await locResp.json();
    const locationGid: string = locData.data?.locations?.edges?.[0]?.node?.id ?? "";

    if (locationGid) {
      const numericItemId = inventoryItemId.replace("gid://shopify/InventoryItem/", "");
      const numericLocId = locationGid.replace("gid://shopify/Location/", "");
      const baseUrl = `https://${session.shop}/admin/api/${apiVersion}`;
      const restHeaders = {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": session.accessToken as string,
      };

      // Step 1: Enable tracking via REST — inventory_levels/set.json returns
      // 422 if tracking is off, so this must come first.
      await fetch(`${baseUrl}/inventory_items/${numericItemId}.json`, {
        method: "PUT",
        headers: restHeaders,
        body: JSON.stringify({
          inventory_item: { id: parseInt(numericItemId, 10), tracked: true },
        }),
      });

      // Step 2: Set quantity (only if user specified stock)
      if (stock > 0) {
        await fetch(`${baseUrl}/inventory_levels/set.json`, {
          method: "POST",
          headers: restHeaders,
          body: JSON.stringify({
            location_id: parseInt(numericLocId, 10),
            inventory_item_id: parseInt(numericItemId, 10),
            available: stock,
          }),
        });
      }
    }
  }

  return { success: true, redirectTo: `/app/configurator-setup/${encodeURIComponent(product.id)}` };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CreateProductPage() {
  const actionData = useActionData() as any;
  const navigation = useNavigation();
  const submit = useSubmit();
  const navigate = useNavigate();

  useEffect(() => {
    if (actionData?.redirectTo) {
      navigate(actionData.redirectTo);
    }
  }, [actionData, navigate]);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("100");
  const [description, setDescription] = useState("");
  const [titleError, setTitleError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const saving = navigation.state !== "idle" || submitting;

  // Reset submitting if navigation resolves or action returns an error
  useEffect(() => {
    if (navigation.state === "idle") setSubmitting(false);
  }, [navigation.state]);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      setTitleError("Product name is required.");
      return;
    }
    setTitleError("");
    setSubmitting(true);
    const fd = new FormData();
<<<<<<< HEAD
fd.set("title", title.trim());
fd.set("price", price || "0.00");
fd.set("stock", stock || "0");
fd.set("description", description);

submit(fd, { method: "post" });
=======
    fd.set("title", title.trim());
    fd.set("price", price || "0.00");
    fd.set("stock", stock || "0");
    fd.set("description", description);

    // Explicitly include the Shopify session token in the action URL so the
    // server can authenticate without relying on App Bridge patching window.fetch.
    let action: string | undefined;
    try {
      const shopify = (window as any).shopify;
      if (typeof shopify?.idToken === "function") {
        const idToken = await shopify.idToken();
        const params = new URLSearchParams(window.location.search);
        const shop = params.get("shop");
        const host = params.get("host");
        if (idToken && shop && host) {
          action = `/app/product-picker?id_token=${encodeURIComponent(idToken)}&shop=${encodeURIComponent(shop)}&host=${encodeURIComponent(host)}&embedded=1`;
        }
      }
    } catch {
      // Ignore — fall back to regular submit (App Bridge will add Authorization header)
    }

    submit(fd, { method: "post", action });
>>>>>>> origin
  }, [title, price, stock, description, submit]);

  return (
    <Page
      title="New Product"
      subtitle="Create a product in your Shopify store to start building a configurator"
      backAction={{ content: "Products", onAction: () => navigate("/app/products") }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              {actionData?.error && (
                <Banner tone="critical" title="Could not create product">
                  <Text as="p" variant="bodyMd">{actionData.error}</Text>
                </Banner>
              )}

              <Banner tone="info" title="Saved as Draft">
                <Text as="p" variant="bodySm">
                  This product won't appear in your store until you publish it from the Products page.
                </Text>
              </Banner>

              <FormLayout>
                <TextField
                  label="Product Name"
                  value={title}
                  onChange={(v) => { setTitle(v); if (v.trim()) setTitleError(""); }}
                  requiredIndicator
                  placeholder="e.g. Custom Baseball Bat"
                  autoComplete="off"
                  error={titleError}
                />
                <FormLayout.Group>
                  <TextField
                    label="Price"
                    type="number"
                    value={price}
                    onChange={setPrice}
                    prefix="$"
                    placeholder="0.00"
                    autoComplete="off"
                    min={0}
                  />
                  <TextField
                    label="Starting Stock"
                    type="number"
                    value={stock}
                    onChange={setStock}
                    suffix="units"
                    placeholder="100"
                    autoComplete="off"
                    min={0}
                  />
                </FormLayout.Group>
                <TextField
                  label="Description"
                  value={description}
                  onChange={setDescription}
                  multiline={4}
                  placeholder="Describe this product to your customers..."
                  autoComplete="off"
                  helpText="Optional — can be updated anytime in Shopify Admin."
                />
              </FormLayout>

              <Box paddingBlockStart="100">
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  loading={saving}
                  size="large"
                  fullWidth
                >
                  Create & Open Builder
                </Button>
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">How it works</Text>
              <Divider />
              <BlockStack gap="400">
                {HOW_IT_WORKS.map(({ n, title: t, desc }) => (
                  <InlineStack key={n} gap="300" blockAlign="start" wrap={false}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: "#4f46e5",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <Text variant="bodySm" fontWeight="bold" as="span" tone="text-inverse">{n}</Text>
                    </div>
                    <BlockStack gap="050">
                      <Text variant="bodyMd" fontWeight="semibold" as="p">{t}</Text>
                      <Text variant="bodySm" tone="subdued" as="p">{desc}</Text>
                    </BlockStack>
                  </InlineStack>
                ))}
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

const HOW_IT_WORKS = [
  { n: "1", title: "Create the product", desc: "Fill in the name, price, and stock. The product is saved as Draft immediately." },
  { n: "2", title: "Build the configurator", desc: "Add layers, swatches, text fields, and logo upload options in the Builder." },
  { n: "3", title: "Preview & Publish", desc: "Test the configurator experience, then publish when it's ready for customers." },
];
