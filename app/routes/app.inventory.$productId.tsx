import { useLoaderData, useActionData, useNavigation, useSubmit, Link } from "react-router";
import { authenticate } from "../shopify.server";

// ─── Loader — fetch product variant + inventory levels ────────────────────────

export async function loader({ request, params }: any) {
  const { admin } = await authenticate.admin(request);
  const decodedId = decodeURIComponent(params.productId);

  const resp = await admin.graphql(
    `query GetProductInventory($id: ID!) {
      product(id: $id) {
        id title status
        variants(first: 20) {
          edges {
            node {
              id title price sku
              inventoryItem {
                id tracked
                inventoryLevels(first: 10) {
                  edges {
                    node {
                      id quantities(names: ["available", "on_hand", "reserved"]) { name quantity }
                      location { id name }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }`,
    { variables: { id: decodedId } },
  );

  const data = await resp.json();
  const product = data.data?.product;
  if (!product) throw new Response("Product not found", { status: 404 });

  return { product, productId: decodedId };
}

// ─── Action — enable tracking or adjust inventory quantity ────────────────────

export async function action({ request }: any) {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "enableTracking") {
    const inventoryItemId = formData.get("inventoryItemId") as string;
    const numericItemId = inventoryItemId.replace("gid://shopify/InventoryItem/", "");

    await fetch(
      `https://${session.shop}/admin/api/2024-01/inventory_items/${numericItemId}.json`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": session.accessToken as string,
        },
        body: JSON.stringify({
          inventory_item: { id: parseInt(numericItemId, 10), tracked: true },
        }),
      },
    );

    return { success: true, message: "Inventory tracking enabled." };
  }

  const inventoryItemId = formData.get("inventoryItemId") as string;
  const locationId = formData.get("locationId") as string;
  const currentQty = parseInt(formData.get("currentQty") as string, 10);
  const newQty = parseInt(formData.get("newQty") as string, 10);

  if (isNaN(newQty) || newQty < 0) {
    return { error: "Invalid quantity. Must be 0 or greater." };
  }

  const delta = newQty - currentQty;
  if (delta === 0) return { success: true, message: "No change needed." };

  const resp = await admin.graphql(
    `mutation AdjustInventory($input: InventoryAdjustQuantitiesInput!) {
      inventoryAdjustQuantities(input: $input) {
        userErrors { field message }
        inventoryAdjustmentGroup {
          changes { name delta quantityAfterChange }
        }
      }
    }`,
    {
      variables: {
        input: {
          name: "available",
          reason: "correction",
          changes: [{ inventoryItemId, locationId, delta }],
        },
      },
    },
  );

  const data = await resp.json();
  const errs = data.data?.inventoryAdjustQuantities?.userErrors ?? [];
  if (errs.length > 0) return { error: errs[0].message };

  return { success: true, message: `Stock updated to ${newQty} units.` };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const { product, productId } = useLoaderData() as any;
  const actionData = useActionData() as any;
  const navigation = useNavigation();
  const submit = useSubmit();
  const saving = navigation.state === "submitting";

  const variants = (product.variants?.edges ?? []).map((e: any) => e.node);

  const inputSt: React.CSSProperties = {
    padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6,
    fontSize: 13, outline: "none", width: 100, boxSizing: "border-box",
  };

  const handleAdjust = (inventoryItemId: string, locationId: string, currentQty: number, input: HTMLInputElement) => {
    const newQty = parseInt(input.value, 10);
    if (isNaN(newQty) || newQty === currentQty) return;
    const fd = new FormData();
    fd.append("inventoryItemId", inventoryItemId);
    fd.append("locationId", locationId);
    fd.append("currentQty", String(currentQty));
    fd.append("newQty", String(newQty));
    submit(fd, { method: "post" });
  };

  return (
    <div style={{ padding: 24, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", maxWidth: 900, margin: "0 auto" }}>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Link to="/app/products" style={{ color: "#6b7280", textDecoration: "none", fontSize: 13 }}>← Products</Link>
        <span style={{ color: "#d1d5db" }}>/</span>
        <span style={{ fontSize: 13, color: "#374151" }}>{product.title}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700 }}>Inventory — {product.title}</h1>
          <span style={{ fontSize: 13, color: product.status === "ACTIVE" ? "#059669" : "#9ca3af", fontWeight: 600 }}>
            {product.status}
          </span>
        </div>
        <Link
          to={`/app/configurator-setup/${encodeURIComponent(productId)}`}
          style={{ padding: "8px 16px", background: "#111827", color: "#fff", borderRadius: 7, textDecoration: "none", fontSize: 13, fontWeight: 600 }}
        >
          Edit Builder
        </Link>
      </div>

      {actionData?.error && (
        <div style={{ marginBottom: 16, padding: "12px 16px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, color: "#b91c1c", fontSize: 14 }}>
          {actionData.error}
        </div>
      )}
      {actionData?.success && (
        <div style={{ marginBottom: 16, padding: "12px 16px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, color: "#15803d", fontSize: 14, fontWeight: 600 }}>
          ✓ {actionData.message}
        </div>
      )}

      {variants.map((variant: any) => {
        const item = variant.inventoryItem;
        const levels = (item?.inventoryLevels?.edges ?? []).map((e: any) => e.node);

        return (
          <div key={variant.id} style={{ marginBottom: 20, border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "12px 18px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{variant.title === "Default Title" ? "Default Variant" : variant.title}</span>
                {variant.sku && <span style={{ marginLeft: 10, fontSize: 12, color: "#9ca3af" }}>SKU: {variant.sku}</span>}
              </div>
              <span style={{ fontWeight: 700, fontSize: 14 }}>${parseFloat(variant.price).toFixed(2)}</span>
            </div>

            {!item?.tracked && (
              <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <span style={{ color: "#9ca3af", fontSize: 13 }}>Inventory tracking is disabled for this variant.</span>
                <button
                  disabled={saving}
                  onClick={() => {
                    const fd = new FormData();
                    fd.append("intent", "enableTracking");
                    fd.append("inventoryItemId", item.id);
                    submit(fd, { method: "post" });
                  }}
                  style={{ padding: "7px 14px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 6, cursor: saving ? "wait" : "pointer", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}
                >
                  Enable Tracking
                </button>
              </div>
            )}

            {item?.tracked && levels.length === 0 && (
              <div style={{ padding: "14px 18px", color: "#9ca3af", fontSize: 13 }}>
                No locations found. Add a location in your Shopify admin settings.
              </div>
            )}

            {item?.tracked && levels.map((level: any) => {
              const available = level.quantities?.find((q: any) => q.name === "available")?.quantity ?? 0;
              const onHand = level.quantities?.find((q: any) => q.name === "on_hand")?.quantity ?? 0;
              const reserved = level.quantities?.find((q: any) => q.name === "reserved")?.quantity ?? 0;

              return (
                <div key={level.id} style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{level.location?.name}</div>
                    <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Location</div>
                  </div>

                  {[
                    { label: "Available", value: available, highlight: true },
                    { label: "On Hand", value: onHand },
                    { label: "Reserved", value: reserved },
                  ].map(({ label, value, highlight }) => (
                    <div key={label} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: highlight ? (available < 10 ? "#ef4444" : "#111827") : "#6b7280" }}>{value}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{label}</div>
                    </div>
                  ))}

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>Set available:</label>
                    <input
                      id={`qty-${level.id}`}
                      type="number"
                      defaultValue={available}
                      min="0"
                      step="1"
                      style={inputSt}
                      disabled={saving}
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById(`qty-${level.id}`) as HTMLInputElement;
                        handleAdjust(item.id, level.location.id, available, input);
                      }}
                      disabled={saving}
                      style={{ padding: "8px 14px", background: "#111827", color: "#fff", border: "none", borderRadius: 6, cursor: saving ? "wait" : "pointer", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}
                    >
                      {saving ? "Saving…" : "Update"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      <div style={{ padding: "16px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, fontSize: 13, color: "#0369a1" }}>
        <strong>Tip:</strong> Stock decrements automatically when orders are placed in your Shopify store. Use this page to manually correct inventory after returns, damage, or stock counts.
      </div>
    </div>
  );
}
