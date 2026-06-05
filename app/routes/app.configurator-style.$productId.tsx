import { useLoaderData, useSubmit, useActionData, Link } from "react-router";
import { useState, useCallback } from "react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Divider,
  Box,
  Banner,
  Badge,
} from "@shopify/polaris";
import { PaintBrushFlatIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import {
  type ConfiguratorStyle,
  DEFAULT_STYLE,
} from "../types/configurator";

// ─── Loader ───────────────────────────────────────────────────────────────────

export async function loader({ request, params }: any) {
  await authenticate.admin(request);
  const decodedId = decodeURIComponent(params.productId);
  const config = await prisma.productConfig.findUnique({ where: { productId: decodedId } });
  const opts = config?.options as any ?? {};
  return {
    productId: decodedId,
    productName: config?.productName ?? "Product",
    style: { ...DEFAULT_STYLE, ...(opts.configuratorStyle ?? {}) } as ConfiguratorStyle,
  };
}

// ─── Action ───────────────────────────────────────────────────────────────────

export async function action({ request, params }: any) {
  await authenticate.admin(request);
  const decodedId = decodeURIComponent(params.productId);
  const formData = await request.formData();
  const style: ConfiguratorStyle = JSON.parse(formData.get("style") as string);

  const config = await prisma.productConfig.findUnique({ where: { productId: decodedId } });
  if (!config) return { error: "Config not found" };

  const existingOpts = (config.options as any) ?? {};
  await prisma.productConfig.update({
    where: { productId: decodedId },
    data: { options: { ...existingOpts, configuratorStyle: style } },
  });

  return { success: true };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConfiguratorStylePage() {
  const { productId, productName, style: initStyle } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();

  const [style, setStyle] = useState<ConfiguratorStyle>(initStyle);
  const update = useCallback((patch: Partial<ConfiguratorStyle>) => setStyle((s) => ({ ...s, ...patch })), []);

  const handleSave = () => {
    const fd = new FormData();
    fd.append("style", JSON.stringify(style));
    submit(fd, { method: "post" });
  };

  return (
    <Page
      title="Configurator Style"
      subtitle={productName}
      backAction={{ content: "Setup", url: `/app/configurator-setup/${encodeURIComponent(productId)}` }}
      primaryAction={<Button variant="primary" onClick={handleSave}>Save Style</Button>}
      secondaryActions={[
        {
          content: "Preview",
          url: `/app/configurator/${encodeURIComponent(productId)}`,
        },
      ]}
    >
      <BlockStack gap="500">
        {actionData && "success" in actionData && (
          <Banner tone="success" title="Style saved successfully!" />
        )}
        {actionData && "error" in actionData && (
          <Banner tone="critical" title={(actionData as any).error} />
        )}

        <Layout>
          {/* Live Mini Preview */}
          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Live Preview</Text>
                <Divider />
                <StylePreview style={style} />
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* Settings */}
          <Layout.Section>
            <BlockStack gap="400">

              {/* Color Swatches */}
              <Card>
                <BlockStack gap="400">
                  <InlineStack gap="200" blockAlign="center">
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      🎨
                    </div>
                    <Text variant="headingMd" as="h3">Color Swatches</Text>
                  </InlineStack>
                  <Divider />

                  <BlockStack gap="300">
                    <Text variant="bodyMd" fontWeight="semibold" as="p">Shape</Text>
                    <div style={{ display: "flex", gap: 12 }}>
                      {([
                        { value: "circle", label: "Circle", preview: "50%" },
                        { value: "rounded", label: "Rounded", preview: "8px" },
                        { value: "square", label: "Square", preview: "3px" },
                      ] as const).map(({ value, label, preview }) => (
                        <ShapeOption
                          key={value}
                          active={style.swatchShape === value}
                          label={label}
                          onClick={() => update({ swatchShape: value })}
                          shape={preview}
                          color="#5c6ac4"
                          size={36}
                        />
                      ))}
                    </div>
                  </BlockStack>

                  <BlockStack gap="300">
                    <Text variant="bodyMd" fontWeight="semibold" as="p">Size</Text>
                    <div style={{ display: "flex", gap: 12 }}>
                      {([
                        { value: "sm", label: "Small", px: 26 },
                        { value: "md", label: "Medium", px: 36 },
                        { value: "lg", label: "Large", px: 46 },
                      ] as const).map(({ value, label, px }) => (
                        <SizeOption
                          key={value}
                          active={style.swatchSize === value}
                          label={label}
                          onClick={() => update({ swatchSize: value })}
                          size={px}
                          shape={style.swatchShape === "circle" ? "50%" : style.swatchShape === "square" ? "3px" : "8px"}
                          color="#5c6ac4"
                        />
                      ))}
                    </div>
                  </BlockStack>
                </BlockStack>
              </Card>

              {/* Thumbnail Swatches */}
              <Card>
                <BlockStack gap="400">
                  <InlineStack gap="200" blockAlign="center">
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      🖼️
                    </div>
                    <Text variant="headingMd" as="h3">Thumbnail Swatches</Text>
                  </InlineStack>
                  <Divider />

                  <BlockStack gap="300">
                    <Text variant="bodyMd" fontWeight="semibold" as="p">Shape</Text>
                    <div style={{ display: "flex", gap: 12 }}>
                      {([
                        { value: "circle", label: "Circle", preview: "50%" },
                        { value: "rounded", label: "Rounded", preview: "10px" },
                        { value: "square", label: "Square", preview: "3px" },
                      ] as const).map(({ value, label, preview }) => (
                        <ShapeOption
                          key={value}
                          active={style.thumbnailShape === value}
                          label={label}
                          onClick={() => update({ thumbnailShape: value })}
                          shape={preview}
                          color="#8b5cf6"
                          size={48}
                          isThumb
                        />
                      ))}
                    </div>
                  </BlockStack>

                  <BlockStack gap="300">
                    <Text variant="bodyMd" fontWeight="semibold" as="p">Size</Text>
                    <div style={{ display: "flex", gap: 12 }}>
                      {([
                        { value: "sm", label: "Small", px: 44 },
                        { value: "md", label: "Medium", px: 56 },
                        { value: "lg", label: "Large", px: 70 },
                      ] as const).map(({ value, label, px }) => (
                        <SizeOption
                          key={value}
                          active={style.thumbnailSize === value}
                          label={label}
                          onClick={() => update({ thumbnailSize: value })}
                          size={px}
                          shape={style.thumbnailShape === "circle" ? "50%" : style.thumbnailShape === "square" ? "3px" : "10px"}
                          color="#8b5cf6"
                        />
                      ))}
                    </div>
                  </BlockStack>

                  <BlockStack gap="200">
                    <InlineStack gap="200" blockAlign="center">
                      <input
                        type="checkbox"
                        id="showLabels"
                        checked={style.showLabels}
                        onChange={(e) => update({ showLabels: e.target.checked })}
                        style={{ width: 16, height: 16, accentColor: "#5c6ac4", cursor: "pointer" }}
                      />
                      <label htmlFor="showLabels" style={{ fontSize: 14, cursor: "pointer", color: "#374151" }}>
                        Show name label under thumbnail
                      </label>
                    </InlineStack>
                  </BlockStack>
                </BlockStack>
              </Card>

              {/* Choice / Radio / Pill style */}
              <Card>
                <BlockStack gap="400">
                  <InlineStack gap="200" blockAlign="center">
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      ☑️
                    </div>
                    <Text variant="headingMd" as="h3">Choice Buttons (Radio / Label)</Text>
                  </InlineStack>
                  <Divider />
                  <div style={{ display: "flex", gap: 12 }}>
                    {([
                      { value: "pill", label: "Pill", desc: "Rounded badge style" },
                      { value: "card", label: "Card", desc: "Box card with border" },
                      { value: "classic", label: "Classic", desc: "Radio dot + label" },
                    ] as const).map(({ value, label, desc }) => (
                      <ChoiceStyleOption
                        key={value}
                        active={style.choiceStyle === value}
                        label={label}
                        desc={desc}
                        value={value}
                        onClick={() => update({ choiceStyle: value })}
                        accentColor={style.accentColor}
                      />
                    ))}
                  </div>
                </BlockStack>
              </Card>

              {/* Add to Cart button */}
              <Card>
                <BlockStack gap="400">
                  <InlineStack gap="200" blockAlign="center">
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      🛒
                    </div>
                    <Text variant="headingMd" as="h3">Add to Cart Button</Text>
                  </InlineStack>
                  <Divider />
                  <div style={{ display: "flex", gap: 12 }}>
                    {([
                      { value: "default", label: "Default", radius: "10px" },
                      { value: "pill", label: "Pill", radius: "50px" },
                      { value: "square", label: "Square", radius: "4px" },
                    ] as const).map(({ value, label, radius }) => (
                      <button
                        key={value}
                        onClick={() => update({ buttonRadius: value })}
                        style={{
                          flex: 1, padding: "10px 0", cursor: "pointer",
                          borderRadius: radius,
                          background: style.buttonRadius === value
                            ? `linear-gradient(135deg, ${style.accentColor}, ${adjustColor(style.accentColor, -20)})`
                            : "#f3f4f6",
                          color: style.buttonRadius === value ? "#fff" : "#6b7280",
                          border: style.buttonRadius === value ? "none" : "1.5px solid #e5e7eb",
                          fontWeight: 600, fontSize: 13,
                          transition: "all 0.15s",
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </BlockStack>
              </Card>

              {/* Accent Color */}
              <Card>
                <BlockStack gap="400">
                  <InlineStack gap="200" blockAlign="center">
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: style.accentColor + "22", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      🎨
                    </div>
                    <Text variant="headingMd" as="h3">Accent Color</Text>
                    <Box paddingInlineStart="200">
                      <Badge tone="info">Selected state color</Badge>
                    </Box>
                  </InlineStack>
                  <Divider />
                  <BlockStack gap="300">
                    <Text variant="bodySm" tone="subdued" as="p">
                      Used for selected borders, radio dots, checked states, and the Add to Cart button gradient.
                    </Text>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <input
                        type="color"
                        value={style.accentColor}
                        onChange={(e) => update({ accentColor: e.target.value })}
                        style={{ width: 48, height: 48, border: "1.5px solid #e5e7eb", borderRadius: 8, cursor: "pointer", padding: 2 }}
                      />
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {["#5c6ac4", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#111827"].map((c) => (
                          <button
                            key={c}
                            onClick={() => update({ accentColor: c })}
                            title={c}
                            style={{
                              width: 28, height: 28, borderRadius: "50%", background: c, border: "none",
                              cursor: "pointer", outline: style.accentColor === c ? `3px solid ${c}` : "none",
                              outlineOffset: 2, transition: "outline 0.1s",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
                      <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>Hex:</span>
                      <input
                        value={style.accentColor}
                        onChange={(e) => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) update({ accentColor: e.target.value }); }}
                        style={{ border: "none", background: "transparent", fontSize: 13, fontFamily: "monospace", outline: "none", flex: 1, color: "#111827" }}
                        maxLength={7}
                      />
                    </div>
                  </BlockStack>
                </BlockStack>
              </Card>

            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}

// ─── Helper: darken/lighten hex ──────────────────────────────────────────────

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
  return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
}

// ─── Live Preview Component ───────────────────────────────────────────────────

function StylePreview({ style }: { style: ConfiguratorStyle }) {
  const swatchRadius = style.swatchShape === "circle" ? "50%" : style.swatchShape === "square" ? "4px" : "8px";
  const swatchPx = style.swatchSize === "sm" ? 26 : style.swatchSize === "md" ? 36 : 46;
  const thumbRadius = style.thumbnailShape === "circle" ? "50%" : style.thumbnailShape === "square" ? "4px" : "10px";
  const thumbPx = style.thumbnailSize === "sm" ? 44 : style.thumbnailSize === "md" ? 56 : 70;
  const btnRadius = style.buttonRadius === "pill" ? "50px" : style.buttonRadius === "square" ? "4px" : "10px";

  const colors = ["#f9f9f9", "#1a1a1a", "#9ca3af", "#d4a27a", "#f97316", "#ec4899", "#eab308"];
  const thumbColors = ["#e0e7ff", "#bfdbfe", "#a7f3d0", "#fde68a"];

  return (
    <BlockStack gap="400">
      {/* Color swatches preview */}
      <BlockStack gap="200">
        <Text variant="bodySm" tone="subdued" as="p">COLOR SWATCHES</Text>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {colors.map((c, i) => (
            <div
              key={c}
              style={{
                width: swatchPx, height: swatchPx, borderRadius: swatchRadius,
                background: c,
                border: i === 0 ? `3px solid ${style.accentColor}` : "2px solid #e5e7eb",
                outline: i === 0 ? `3px solid ${style.accentColor}22` : "none",
                outlineOffset: 1,
                transition: "all 0.15s",
              }}
            />
          ))}
        </div>
      </BlockStack>

      <Divider />

      {/* Thumbnail swatches preview */}
      <BlockStack gap="200">
        <Text variant="bodySm" tone="subdued" as="p">THUMBNAIL SWATCHES</Text>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {thumbColors.map((c, i) => (
            <BlockStack key={c} gap="100">
              <div
                style={{
                  width: thumbPx, height: thumbPx, borderRadius: thumbRadius,
                  background: c,
                  border: i === 0 ? `3px solid ${style.accentColor}` : "2px solid #e5e7eb",
                  outline: i === 0 ? `3px solid ${style.accentColor}22` : "none",
                  outlineOffset: 1,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                <span style={{ fontSize: thumbPx > 50 ? 18 : 14 }}>🎨</span>
              </div>
              {style.showLabels && <Text variant="bodySm" tone="subdued" as="p" alignment="center">Opt {i + 1}</Text>}
            </BlockStack>
          ))}
        </div>
      </BlockStack>

      <Divider />

      {/* Choice style preview */}
      <BlockStack gap="200">
        <Text variant="bodySm" tone="subdued" as="p">CHOICES</Text>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {["None", "Finger Pad", "Finger Hood"].map((label, i) => (
            <ChoicePreviewItem
              key={label}
              label={label}
              active={i === 0}
              style={style.choiceStyle}
              accentColor={style.accentColor}
            />
          ))}
        </div>
      </BlockStack>

      <Divider />

      {/* Button preview */}
      <BlockStack gap="200">
        <Text variant="bodySm" tone="subdued" as="p">ADD TO CART</Text>
        <button style={{
          width: "100%", padding: "12px",
          background: `linear-gradient(135deg, ${style.accentColor}, ${adjustColor(style.accentColor, -20)})`,
          color: "#fff", border: "none", borderRadius: btnRadius,
          fontWeight: 700, fontSize: 14, cursor: "default",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          🛒 Add to Cart
        </button>
      </BlockStack>
    </BlockStack>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ShapeOption({ active, label, onClick, shape, color, size, isThumb = false }: {
  active: boolean; label: string; onClick: () => void;
  shape: string; color: string; size: number; isThumb?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        padding: "14px 8px", border: active ? `2px solid ${color}` : "1.5px solid #e5e7eb",
        borderRadius: 10, background: active ? color + "0f" : "#fff",
        cursor: "pointer", transition: "all 0.15s",
      }}
    >
      <div style={{
        width: size, height: size, borderRadius: shape,
        background: isThumb ? color + "30" : color,
        border: isThumb ? `2px solid ${color}` : "none",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {isThumb && <span style={{ fontSize: 14 }}>🎨</span>}
      </div>
      <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? color : "#6b7280" }}>{label}</span>
    </button>
  );
}

function SizeOption({ active, label, onClick, size, shape, color }: {
  active: boolean; label: string; onClick: () => void;
  size: number; shape: string; color: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
        padding: "14px 8px", border: active ? `2px solid ${color}` : "1.5px solid #e5e7eb",
        borderRadius: 10, background: active ? color + "0f" : "#fff",
        cursor: "pointer", transition: "all 0.15s",
      }}
    >
      <div style={{ width: size, height: size, borderRadius: shape, background: color }} />
      <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? color : "#6b7280" }}>{label}</span>
    </button>
  );
}

function ChoiceStyleOption({ active, label, desc, value, onClick, accentColor }: {
  active: boolean; label: string; desc: string; value: string; onClick: () => void; accentColor: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, display: "flex", flexDirection: "column", gap: 10,
        padding: "14px 10px", border: active ? `2px solid ${accentColor}` : "1.5px solid #e5e7eb",
        borderRadius: 10, background: active ? accentColor + "0f" : "#fff",
        cursor: "pointer", transition: "all 0.15s", textAlign: "left",
      }}
    >
      <ChoicePreviewItem label="Option" active={true} style={value as any} accentColor={accentColor} compact />
      <div>
        <div style={{ fontSize: 12, fontWeight: active ? 700 : 600, color: active ? accentColor : "#374151" }}>{label}</div>
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{desc}</div>
      </div>
    </button>
  );
}

function ChoicePreviewItem({ label, active, style: choiceStyle, accentColor, compact = false }: {
  label: string; active: boolean;
  style: "pill" | "card" | "classic"; accentColor: string; compact?: boolean;
}) {
  if (choiceStyle === "classic") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: compact ? "4px 0" : "8px 0" }}>
        <div style={{
          width: 18, height: 18, borderRadius: "50%", border: `2px solid ${active ? accentColor : "#d1d5db"}`,
          background: active ? accentColor : "transparent", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {active && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
        </div>
        <span style={{ fontSize: compact ? 12 : 13, fontWeight: active ? 600 : 400, color: active ? accentColor : "#374151" }}>{label}</span>
      </div>
    );
  }
  if (choiceStyle === "card") {
    return (
      <div style={{
        padding: compact ? "6px 10px" : "9px 14px",
        borderRadius: 8,
        border: `${active ? 2 : 1.5}px solid ${active ? accentColor : "#e5e7eb"}`,
        background: active ? accentColor + "12" : "#fff",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ fontSize: compact ? 12 : 13, fontWeight: active ? 600 : 400, color: active ? accentColor : "#374151" }}>{label}</span>
      </div>
    );
  }
  // pill
  return (
    <div style={{
      display: "inline-flex", alignItems: "center",
      padding: compact ? "5px 12px" : "8px 18px",
      borderRadius: 20,
      border: `${active ? 2 : 1.5}px solid ${active ? accentColor : "#d1d5db"}`,
      background: active ? accentColor + "12" : "#fff",
    }}>
      <span style={{ fontSize: compact ? 12 : 13, fontWeight: active ? 600 : 500, color: active ? accentColor : "#374151" }}>{label}</span>
    </div>
  );
}
