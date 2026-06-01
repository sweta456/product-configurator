import { useActionData, Link, useNavigation, useNavigate } from "react-router";
import { useEffect } from "react";
import { authenticate } from "../shopify.server";

// ─── Action ───────────────────────────────────────────────────────────────────

export async function action({ request }: any) {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const title = (formData.get("title") as string)?.trim();
  const price = (formData.get("price") as string)?.trim() || "0.00";
  const description = (formData.get("description") as string)?.trim() || "";
  const stock = parseInt((formData.get("stock") as string)?.trim() || "0", 10);

  if (!title) return { error: "Product name is required." };

  // Step 1 — create product as ACTIVE so it's immediately purchasable
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
          status: "ACTIVE",
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

  // Step 2 — set price on the default variant
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

  // Step 3 — set inventory quantity at the primary location
  if (inventoryItemId && stock > 0) {
    const locResp = await admin.graphql(
      `query { locations(first: 1) { edges { node { id name } } } }`,
    );
    const locData = await locResp.json();
    const locationId = locData.data?.locations?.edges?.[0]?.node?.id;

    if (locationId) {
      await admin.graphql(
        `mutation SetInventory($input: InventoryAdjustQuantitiesInput!) {
          inventoryAdjustQuantities(input: $input) {
            userErrors { field message }
          }
        }`,
        {
          variables: {
            input: {
              name: "available",
              reason: "correction",
              changes: [{ inventoryItemId, locationId, delta: stock }],
            },
          },
        },
      );
    }
  }

  return { productId: product.id };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CreateProductPage() {
  const actionData = useActionData() as any;
  const navigation = useNavigation();
  const navigate = useNavigate();
  const saving = navigation.state === "submitting";

  useEffect(() => {
    if (actionData?.productId) {
      navigate(`/app/configurator-setup/${encodeURIComponent(actionData.productId)}`);
    }
  }, [actionData?.productId]);

  const field: React.CSSProperties = {
    display: "block", width: "100%", padding: "11px 14px",
    border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14,
    boxSizing: "border-box", outline: "none",
  };
  const label: React.CSSProperties = {
    display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6,
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 520, background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: "36px 40px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>

        <Link to="/app/products" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: "#6b7280", textDecoration: "none", marginBottom: 24 }}>
          ← My Products
        </Link>

        <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700, color: "#111827" }}>Create New Product</h1>
        <p style={{ margin: "0 0 28px", fontSize: 14, color: "#6b7280" }}>
          A new product will be created in your Shopify store and immediately published. Then you'll go straight to the builder.
        </p>

        {actionData?.error && (
          <div style={{ marginBottom: 20, padding: "12px 14px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, color: "#b91c1c", fontSize: 14 }}>
            {actionData.error}
          </div>
        )}

        <form method="post">
          <div style={{ marginBottom: 18 }}>
            <label htmlFor="title" style={label}>Product Name *</label>
            <input id="title" name="title" type="text" required placeholder="e.g. Custom Baseball Bat" style={field} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
            <div>
              <label htmlFor="price" style={label}>Price (USD)</label>
              <input id="price" name="price" type="number" min="0" step="0.01" placeholder="0.00" defaultValue="" style={field} />
            </div>
            <div>
              <label htmlFor="stock" style={label}>
                Starting Stock
                <span style={{ fontWeight: 400, color: "#9ca3af", marginLeft: 4 }}>(units)</span>
              </label>
              <input id="stock" name="stock" type="number" min="0" step="1" placeholder="100" defaultValue="100" style={field} />
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <label htmlFor="description" style={label}>
              Description <span style={{ fontWeight: 400, color: "#9ca3af" }}>(optional)</span>
            </label>
            <textarea
              id="description" name="description" rows={3} placeholder="Product description…"
              style={{ ...field, resize: "vertical", fontFamily: "inherit" }}
            />
          </div>

          <button
            type="submit" disabled={saving}
            style={{ display: "block", width: "100%", padding: "13px 0", background: saving ? "#6b7280" : "#111827", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: saving ? "wait" : "pointer", letterSpacing: "0.01em" }}
          >
            {saving ? "Creating product…" : "Create & Open Builder →"}
          </button>
        </form>

        <p style={{ margin: "16px 0 0", fontSize: 12, color: "#9ca3af", textAlign: "center", lineHeight: 1.5 }}>
          Product is published as <strong>Active</strong> with stock set.
          <br />
          You can adjust inventory anytime from your Shopify admin.
        </p>
      </div>
    </div>
  );
}
