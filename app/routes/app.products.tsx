import { useLoaderData, Link, useFetcher } from "react-router";
import { useState } from "react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import type { LayerConfig } from "../types/configurator";

// ─── Loader ───────────────────────────────────────────────────────────────────

export async function loader({ request }: any) {
  const { admin } = await authenticate.admin(request);

  const configs = await prisma.productConfig.findMany({
    select: { productId: true, productName: true, layers: true, updatedAt: true },
  });

  if (configs.length === 0) return { products: [] };

  const resp = await admin.graphql(
    `query GetNodes($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on Product {
          id title handle status tags
          featuredImage { url }
          priceRangeV2 { minVariantPrice { amount currencyCode } }
        }
      }
    }`,
    { variables: { ids: configs.map((c: any) => c.productId) } },
  );

  const json = await resp.json();
  const nodeMap = new Map<string, any>(
    ((json.data.nodes as any[]) ?? []).filter(Boolean).map((n: any) => [n.id, n]),
  );

  const products = configs
    .map((c: any) => ({ ...c, shopify: nodeMap.get(c.productId) }))
    .filter((c: any) => c.shopify);

  // Auto-sync: ensure every configured product has the storefront tag
  const untagged = products.filter((p: any) => !((p.shopify.tags ?? []) as string[]).includes("configurator-enabled"));
  if (untagged.length > 0) {
    await Promise.all(
      untagged.map((p: any) =>
        admin.graphql(
          `mutation AddTag($id: ID!, $tags: [String!]!) {
            tagsAdd(id: $id, tags: $tags) {
              node { id }
              userErrors { field message }
            }
          }`,
          { variables: { id: p.productId, tags: ["configurator-enabled"] } },
        ),
      ),
    );
  }

  return { products };
}

// ─── Action — publish/unpublish a product ─────────────────────────────────────

export async function action({ request }: any) {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const productId = formData.get("productId") as string;
  const intent = (formData.get("intent") as string) || "publish";

  // Delete config
  if (intent === "delete") {
    await prisma.productConfig.deleteMany({ where: { productId } });
    return { success: true, deleted: true };
  }

  // Duplicate config
  if (intent === "duplicate") {
    const src = await prisma.productConfig.findUnique({ where: { productId } });
    if (!src) return { error: "Config not found" };
    // Create a Shopify product copy via GraphQL
    const copyResp = await admin.graphql(
      `mutation ProductDuplicate($productId: ID!, $newTitle: String!) {
        productDuplicate(productId: $productId, newTitle: $newTitle) {
          newProduct { id title }
          userErrors { field message }
        }
      }`,
      { variables: { productId, newTitle: `${src.productName} (copy)` } },
    );
    const copyData = await copyResp.json();
    const newProduct = copyData.data?.productDuplicate?.newProduct;
    if (!newProduct) return { error: copyData.data?.productDuplicate?.userErrors?.[0]?.message ?? "Duplicate failed" };
    await prisma.productConfig.create({
      data: {
        productId: newProduct.id,
        productName: newProduct.title,
        shop: src.shop,
        layers: src.layers as any,
        options: src.options as any,
      },
    });
    return { success: true, duplicated: true };
  }

  const newStatus = formData.get("status") as "ACTIVE" | "DRAFT";

  // Step 1: set ACTIVE / DRAFT status via GraphQL (uses write_products scope)
  const statusResp = await admin.graphql(
    `mutation UpdateProductStatus($id: ID!, $status: ProductStatus!) {
      productUpdate(input: { id: $id, status: $status }) {
        product { id status }
        userErrors { field message }
      }
    }`,
    { variables: { id: productId, status: newStatus } },
  );
  const statusData = await statusResp.json();
  const errs = statusData.data?.productUpdate?.userErrors ?? [];
  if (errs.length > 0) return { error: errs[0].message };

  // Step 2: publish / unpublish to Online Store via REST using published_at.
  // This uses write_products scope only — no read_publications needed.
  const numericId = productId.replace("gid://shopify/Product/", "");
  await fetch(
    `https://${session.shop}/admin/api/2024-01/products/${numericId}.json`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": session.accessToken as string,
      },
      body: JSON.stringify({
        product: {
          id: numericId,
          published_at: newStatus === "ACTIVE" ? new Date().toISOString() : null,
        },
      }),
    }
  );

  return { success: true, productId, status: newStatus };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const { products } = useLoaderData() as any;

  return (
    <div style={{ padding: "28px 32px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", maxWidth: 1200 }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>My Products</h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
            {products.length} product{products.length !== 1 ? "s" : ""} configured
          </p>
        </div>
        <Link
          to="/app/product-picker"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 22px", background: "#111827", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: 14 }}
        >
          + Product
        </Link>
      </div>

      {products.length === 0 ? (
        <div style={{ textAlign: "center", padding: "90px 0", color: "#6b7280" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎨</div>
          <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: "#111827" }}>No products yet</h2>
          <p style={{ margin: "0 0 28px", fontSize: 15 }}>Add a product to start building your configurator.</p>
          <Link to="/app/product-picker" style={{ padding: "13px 32px", background: "#111827", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: 15 }}>
            + Add First Product
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
          {products.map((item: any) => (
            <ProductCard key={item.productId} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ item }: { item: any }) {
  const { shopify, layers } = item;
  const fetcher = useFetcher<any>();
  const [menuOpen, setMenuOpen] = useState(false);

  const price = shopify?.priceRangeV2?.minVariantPrice;
  const layerCount = Array.isArray(layers) ? (layers as LayerConfig[]).length : 0;
  const isActive = shopify?.status === "ACTIVE";

  // Use Shopify featuredImage, or fall back to the first layer's image from config
  const firstLayerSrc = Array.isArray(layers) && layers.length > 0
    ? (layers as LayerConfig[])[0]?.src
    : null;
  const thumbSrc = shopify?.featuredImage?.url || firstLayerSrc;

  const saving = fetcher.state !== "idle";

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", background: "#fff", display: "flex", flexDirection: "column" }}
      onMouseLeave={() => setMenuOpen(false)}>

      {/* Thumbnail */}
      <div style={{ background: "#f3f4f6", height: 180, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
        {thumbSrc ? (
          <img
            src={thumbSrc}
            alt={shopify?.title}
            style={{ width: "100%", height: "100%", objectFit: "contain", padding: 8, boxSizing: "border-box" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <span style={{ fontSize: 48, filter: "grayscale(1)", opacity: 0.3 }}>🎨</span>
        )}

        {/* Status pill */}
        <span style={{
          position: "absolute", top: 10, left: 10, fontSize: 11, fontWeight: 700,
          padding: "3px 9px", borderRadius: 20,
          background: isActive ? "#d1fae5" : "#fef3c7",
          color: isActive ? "#065f46" : "#92400e",
        }}>
          {isActive ? "● Active" : "○ Draft"}
        </span>

        {/* ⋮ context menu */}
        <div style={{ position: "absolute", top: 8, right: 8 }}>
          <button onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
            style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.9)", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }}>
            ⋮
          </button>
          {menuOpen && (
            <div style={{ position: "absolute", right: 0, top: "110%", zIndex: 50, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", minWidth: 170, overflow: "hidden" }}>
              <Link to={`/app/configurator/${encodeURIComponent(item.productId)}`}
                style={{ display: "block", padding: "9px 14px", fontSize: 13, color: "#374151", textDecoration: "none" }}
                onClick={() => setMenuOpen(false)}>
                Preview
              </Link>
              <fetcher.Form method="post" onSubmit={() => setMenuOpen(false)}>
                <input type="hidden" name="productId" value={item.productId} />
                <input type="hidden" name="intent" value="duplicate" />
                <button type="submit" style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#374151" }}>
                  Duplicate
                </button>
              </fetcher.Form>
              <fetcher.Form method="post" onSubmit={(e) => { if (!confirm(`Delete "${shopify?.title}"? This cannot be undone.`)) e.preventDefault(); else setMenuOpen(false); }}>
                <input type="hidden" name="productId" value={item.productId} />
                <input type="hidden" name="intent" value="delete" />
                <button type="submit" style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#ef4444" }}>
                  Delete
                </button>
              </fetcher.Form>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "14px 16px", flex: 1 }}>
        <h3 style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 600 }}>{shopify?.title ?? item.productName}</h3>
        <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>{shopify?.handle}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
          {price && (
            <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
              {price.currencyCode} {Number(price.amount).toFixed(2)}
            </span>
          )}
          <span style={{ fontSize: 12, color: "#9ca3af" }}>{layerCount} layer{layerCount !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Publish / Unpublish action */}
      <div style={{ padding: "0 16px 12px" }}>
        <fetcher.Form method="post">
          <input type="hidden" name="productId" value={item.productId} />
          <input type="hidden" name="status" value={isActive ? "DRAFT" : "ACTIVE"} />
          <button
            type="submit"
            disabled={saving}
            style={{
              width: "100%",
              padding: "9px 0",
              background: isActive ? "#fff" : "#059669",
              color: isActive ? "#6b7280" : "#fff",
              border: isActive ? "1px solid #e5e7eb" : "none",
              borderRadius: 7,
              fontSize: 13,
              fontWeight: 600,
              cursor: saving ? "wait" : "pointer",
            }}
          >
            {saving ? "Updating…" : isActive ? "Unpublish" : "Publish → Make Active"}
          </button>
        </fetcher.Form>
      </div>

      {/* Navigation actions */}
      <div style={{ padding: "0 16px 16px", display: "flex", gap: 8 }}>
        <Link
          to={`/app/configurator-setup/${encodeURIComponent(item.productId)}`}
          style={{ flex: 1, padding: "8px 0", textAlign: "center", border: "1px solid #e5e7eb", borderRadius: 7, color: "#374151", textDecoration: "none", fontSize: 13, fontWeight: 500 }}
        >
          Builder
        </Link>
        <Link
          to={`/app/inventory/${encodeURIComponent(item.productId)}`}
          style={{ flex: 1, padding: "8px 0", textAlign: "center", border: "1px solid #e5e7eb", borderRadius: 7, color: "#374151", textDecoration: "none", fontSize: 13, fontWeight: 500 }}
        >
          Inventory
        </Link>
        <Link
          to={`/app/configurator/${encodeURIComponent(item.productId)}`}
          style={{ flex: 1, padding: "8px 0", textAlign: "center", background: "#111827", borderRadius: 7, color: "#fff", textDecoration: "none", fontSize: 13, fontWeight: 500 }}
        >
          Preview
        </Link>
      </div>
    </div>
  );
}
