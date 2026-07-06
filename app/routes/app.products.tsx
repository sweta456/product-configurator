import { apiVersion } from "../shopify.server";
import { useLoaderData, Link, useFetcher, useNavigate } from "react-router";
import { useState, useCallback } from "react";
import {
  Page,
  Layout,
  Card,
  IndexTable,
  useIndexResourceState,
  Thumbnail,
  Badge,
  Button,
  ButtonGroup,
  Text,
  BlockStack,
  InlineStack,
  Box,
  EmptyState,
  Popover,
  ActionList,
  Spinner,
  Divider,
  Banner,
} from "@shopify/polaris";
import { MenuHorizontalIcon, ProductIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import type { LayerConfig } from "../types/configurator";

// ─── Loader ───────────────────────────────────────────────────────────────────

export async function loader({ request }: any) {
  const { admin } = await authenticate.admin(request);

  const configs = await prisma.productConfig.findMany({
    select: { productId: true, productName: true, layers: true, options: true, updatedAt: true },
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

// ─── Action ───────────────────────────────────────────────────────────────────

export async function action({ request }: any) {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const productId = formData.get("productId") as string;
  const intent = (formData.get("intent") as string) || "publish";

  if (intent === "bulkDelete") {
    const ids = (formData.get("productIds") as string).split(",").filter(Boolean);
    await Promise.all(
      ids.map((id) =>
        Promise.all([
          prisma.productConfig.deleteMany({ where: { productId: id } }),
          admin.graphql(
            `mutation DeleteProduct($id: ID!) {
              productDelete(input: { id: $id }) {
                deletedProductId
                userErrors { field message }
              }
            }`,
            { variables: { id } },
          ),
        ]),
      ),
    );
    return { success: true, deleted: true };
  }

  if (intent === "delete") {
    await Promise.all([
      prisma.productConfig.deleteMany({ where: { productId } }),
      admin.graphql(
        `mutation DeleteProduct($id: ID!) {
          productDelete(input: { id: $id }) {
            deletedProductId
            userErrors { field message }
          }
        }`,
        { variables: { id: productId } },
      ),
    ]);
    return { success: true, deleted: true };
  }

  if (intent === "duplicate") {
    const src = await prisma.productConfig.findUnique({ where: { productId } });
    if (!src) return { error: "Config not found" };
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

  const statusResp = await admin.graphql(
    `mutation UpdateProductStatus($id: ID!, $status: ProductStatus!) {
      productUpdate(input: { id: $id, status: $status }) {
        product {
          id status
          variants(first: 100) { edges { node { id } } }
        }
        userErrors { field message }
      }
    }`,
    { variables: { id: productId, status: newStatus } },
  );
  const statusData = await statusResp.json();
  const errs = statusData.data?.productUpdate?.userErrors ?? [];
  if (errs.length > 0) return { error: errs[0].message };

  // When publishing, force inventoryPolicy: CONTINUE on all variants so the
  // product always shows "Add to cart" regardless of stock/location settings.
  if (newStatus === "ACTIVE") {
    const variantIds: string[] = (
      statusData.data?.productUpdate?.product?.variants?.edges ?? []
    ).map((e: any) => e.node.id);

    if (variantIds.length > 0) {
      await admin.graphql(
        `mutation SetInventoryPolicy($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
          productVariantsBulkUpdate(productId: $productId, variants: $variants) {
            userErrors { field message }
          }
        }`,
        {
          variables: {
            productId,
            variants: variantIds.map((id) => ({ id, inventoryPolicy: "CONTINUE" })),
          },
        },
      );
    }
  }

  // Use REST to set published: true/false on the Online Store channel.
  // This is simpler and requires no publication scope — just write_products.
  const numericProductId = productId.replace("gid://shopify/Product/", "");
  const restResp = await fetch(
    `https://${session.shop}/admin/api/${apiVersion}/products/${numericProductId}.json`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": session.accessToken as string,
      },
      body: JSON.stringify({
        product: { id: parseInt(numericProductId, 10), published: newStatus === "ACTIVE" },
      }),
    },
  );

  if (!restResp.ok) {
    const errBody = await restResp.json().catch(() => ({}));
    return { error: String(errBody.errors ?? "Failed to update Online Store visibility") };
  }

  return { success: true, productId, status: newStatus };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const { products } = useLoaderData() as any;
  const bulkFetcher = useFetcher<any>();
  const navigate = useNavigate();

  const resourceItems = products.map((p: any) => ({ ...p, id: p.productId }));
  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(resourceItems);

  const handleBulkDelete = useCallback(() => {
    if (selectedResources.length === 0) return;
    const names = products
      .filter((p: any) => selectedResources.includes(p.productId))
      .map((p: any) => p.shopify?.title ?? p.productName)
      .join(", ");
    if (confirm(`Delete ${selectedResources.length} product${selectedResources.length !== 1 ? "s" : ""}?\n\n${names}\n\nThis cannot be undone.`)) {
      const form = new FormData();
      form.set("intent", "bulkDelete");
      form.set("productIds", selectedResources.join(","));
      bulkFetcher.submit(form, { method: "post" });
    }
  }, [selectedResources, products, bulkFetcher]);

  const resourceName = { singular: "product", plural: "products" };

  const rowMarkup = products.map((item: any, index: number) => (
    <ProductRow key={item.productId} item={item} index={index} selected={selectedResources.includes(item.productId)} />
  ));

  return (
    <Page
      title="Products"
      subtitle={`${products.length} product${products.length !== 1 ? "s" : ""} configured`}
      primaryAction={
        <Link to="/app/product-picker" style={{ textDecoration: "none" }}>
          <Button variant="primary">Add Product</Button>
        </Link>
      }
    >
      <Layout>
        <Layout.Section>
          {products.length === 0 ? (
            <Card>
              <EmptyState
                heading="No products configured yet"
                action={{
                  content: "Add your first product",
                  onAction: () => navigate("/app/product-picker"),
                }}
                secondaryAction={{
                  content: "Learn more",
                  onAction: () => navigate("/app"),
                }}
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>Add a product to start building your customisation configurator.</p>
              </EmptyState>
            </Card>
          ) : (
            <Card padding="0">
              <IndexTable
                resourceName={resourceName}
                itemCount={products.length}
                selectedItemsCount={allResourcesSelected ? "All" : selectedResources.length}
                onSelectionChange={handleSelectionChange}
                promotedBulkActions={[
                  {
                    content: `Delete ${selectedResources.length} selected`,
                    onAction: handleBulkDelete,
                  },
                ]}
                headings={[
                  { title: "Product" },
                  { title: "Status" },
                  { title: "Actions", alignment: "end" },
                ]}
              >
                {rowMarkup}
              </IndexTable>
            </Card>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}

// ─── Product Row ──────────────────────────────────────────────────────────────

function ProductRow({ item, index, selected }: { item: any; index: number; selected: boolean }) {
  const { shopify, layers, options } = item;
  const fetcher = useFetcher<any>();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = useCallback(() => setMenuOpen((v) => !v), []);

  const price = shopify?.priceRangeV2?.minVariantPrice;
  const viewNames: string[] = (options as any)?.viewNames ?? [];
  const viewCount = viewNames.length || 1;
  const isActive = shopify?.status === "ACTIVE";
  const firstLayerSrc = Array.isArray(layers) && layers.length > 0 ? (layers as LayerConfig[])[0]?.src : null;
  const thumbSrc = shopify?.featuredImage?.url || firstLayerSrc;
  const saving = fetcher.state !== "idle";
  const rowError = fetcher.data?.error as string | undefined;

  const menuActivator = (
    <Button
      variant="plain"
      icon={MenuHorizontalIcon}
      onClick={(e: any) => { e.stopPropagation(); toggleMenu(); }}
      accessibilityLabel="More actions"
    />
  );

  return (
    <IndexTable.Row id={item.productId} key={item.productId} position={index} selected={selected}>
      {/* Product — includes price + layer count as secondary info */}
      <IndexTable.Cell>
        <InlineStack gap="300" blockAlign="center" wrap={false}>
          <Thumbnail
            source={thumbSrc || ProductIcon}
            alt={shopify?.title ?? item.productName}
            size="small"
          />
          <BlockStack gap="050">
            <Text variant="bodyMd" fontWeight="semibold" as="span">
              {shopify?.title ?? item.productName}
            </Text>
            <Text variant="bodySm" tone="subdued" as="span">
              {shopify?.handle}
              {price ? ` · ${price.currencyCode} ${Number(price.amount).toFixed(2)}` : ""}
              {` · ${viewCount} view${viewCount !== 1 ? "s" : ""}`}
            </Text>
          </BlockStack>
        </InlineStack>
      </IndexTable.Cell>

      {/* Status */}
      <IndexTable.Cell>
        <div onClick={(e) => e.stopPropagation()}>
          <fetcher.Form method="post" style={{ display: "inline" }}>
            <input type="hidden" name="productId" value={item.productId} />
            <input type="hidden" name="status" value={isActive ? "DRAFT" : "ACTIVE"} />
            <InlineStack gap="200" blockAlign="center">
              <Badge tone={isActive ? "success" : "attention"}>
                {isActive ? "Active" : "Draft"}
              </Badge>
              {saving ? (
                <Spinner size="small" />
              ) : (
                <Button variant="plain" submit size="slim" tone={isActive ? "critical" : undefined}>
                  {isActive ? "Unpublish" : "Publish"}
                </Button>
              )}
            </InlineStack>
            {rowError && (
              <Text variant="bodySm" tone="critical" as="p">{rowError}</Text>
            )}
          </fetcher.Form>
        </div>
      </IndexTable.Cell>

      {/* Actions */}
      <IndexTable.Cell>
        <div onClick={(e) => e.stopPropagation()}>
          <InlineStack gap="200" align="end" blockAlign="center" wrap={false}>
            <Link to={`/app/configurator-setup/${encodeURIComponent(item.productId)}`} style={{ textDecoration: "none" }}>
              <Button size="slim" variant="secondary">Builder</Button>
            </Link>
            <Link to={`/app/configurator/${encodeURIComponent(item.productId)}`} style={{ textDecoration: "none" }}>
              <Button size="slim" variant="primary">Preview</Button>
            </Link>
            <Popover
              active={menuOpen}
              activator={menuActivator}
              autofocusTarget="first-node"
              onClose={toggleMenu}
            >
              <ActionList
                actionRole="menuitem"
                items={[
                  {
                    content: "Pricing",
                    onAction: () => { setMenuOpen(false); navigate(`/app/pricing/${encodeURIComponent(item.productId)}`); },
                  },
                  {
                    content: "Style",
                    onAction: () => { setMenuOpen(false); navigate(`/app/configurator-style/${encodeURIComponent(item.productId)}`); },
                  },
                  {
                    content: "Inventory",
                    onAction: () => { setMenuOpen(false); navigate(`/app/inventory/${encodeURIComponent(item.productId)}`); },
                  },
                  {
                    content: "Duplicate",
                    onAction: () => {
                      setMenuOpen(false);
                      const form = new FormData();
                      form.set("productId", item.productId);
                      form.set("intent", "duplicate");
                      fetcher.submit(form, { method: "post" });
                    },
                  },
                  {
                    content: "Delete",
                    destructive: true,
                    onAction: () => {
                      setMenuOpen(false);
                      if (confirm(`Delete "${shopify?.title}"? This cannot be undone.`)) {
                        const form = new FormData();
                        form.set("productId", item.productId);
                        form.set("intent", "delete");
                        fetcher.submit(form, { method: "post" });
                      }
                    },
                  },
                ]}
              />
            </Popover>
          </InlineStack>
        </div>
      </IndexTable.Cell>
    </IndexTable.Row>
  );
}
