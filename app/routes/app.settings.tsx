import { useLoaderData, useSubmit, useActionData } from "react-router";
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
  Select,
  TextField,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { type AppSettings, DEFAULT_APP_SETTINGS } from "../types/configurator";

// ─── Loader ───────────────────────────────────────────────────────────────────

export async function loader({ request }: any) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const record = await (prisma as any).appSettings.findUnique({ where: { shop } });
  const settings: AppSettings = { ...DEFAULT_APP_SETTINGS, ...((record?.settings as any) ?? {}) };
  return { shop, settings };
}

// ─── Action ───────────────────────────────────────────────────────────────────

export async function action({ request }: any) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const settings: AppSettings = JSON.parse(formData.get("settings") as string);

  await (prisma as any).appSettings.upsert({
    where: { shop },
    create: { shop, settings },
    update: { settings },
  });

  return { success: true };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AppSettingsPage() {
  const { settings: initSettings } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();

  const [s, setS] = useState<AppSettings>(initSettings);
  const set = useCallback((patch: Partial<AppSettings>) => setS((prev) => ({ ...prev, ...patch })), []);

  const handleSave = () => {
    const fd = new FormData();
    fd.append("settings", JSON.stringify(s));
    submit(fd, { method: "post" });
  };

  return (
    <Page
      title="App Settings"
      subtitle="Global defaults for all configurators"
      primaryAction={<Button variant="primary" onClick={handleSave}>Save Settings</Button>}
    >
      <BlockStack gap="500">
        {actionData && "success" in actionData && (
          <Banner tone="success" title="Settings saved successfully!" />
        )}

        <Layout>
          <Layout.Section>
            <BlockStack gap="500">

              {/* ── Styling ── */}
              <Card>
                <BlockStack gap="400">
                  <InlineStack gap="200" blockAlign="center">
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🎨</div>
                    <Text variant="headingMd" as="h2">Styling</Text>
                  </InlineStack>
                  <Divider />

                  {/* Global text color */}
                  <InlineStack gap="400" blockAlign="center">
                    <Text variant="bodyMd" as="p" fontWeight="semibold">Global text color</Text>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <input
                        type="color"
                        value={s.globalTextColor}
                        onChange={(e) => set({ globalTextColor: e.target.value })}
                        style={{ width: 40, height: 40, border: "1.5px solid #e5e7eb", borderRadius: 8, cursor: "pointer", padding: 2 }}
                      />
                      <span style={{ fontSize: 13, color: "#6b7280", fontFamily: "monospace" }}>{s.globalTextColor}</span>
                    </div>
                  </InlineStack>

                  <Divider />

                  {/* Swatches styling */}
                  <BlockStack gap="300">
                    <Text variant="bodyMd" as="p" fontWeight="semibold">Swatches styling</Text>
                    <Text variant="bodySm" tone="subdued" as="p">Choose the shape displayed to customers for color swatches</Text>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                      {SWATCH_STYLE_OPTIONS.map((opt) => (
                        <SwatchStyleCard
                          key={opt.shape + opt.size}
                          {...opt}
                          active={s.swatchShape === opt.shape && s.swatchSize === opt.size}
                          onClick={() => set({ swatchShape: opt.shape, swatchSize: opt.size })}
                        />
                      ))}
                    </div>
                  </BlockStack>
                </BlockStack>
              </Card>

              {/* ── Spacing ── */}
              <Card>
                <BlockStack gap="400">
                  <InlineStack gap="200" blockAlign="center">
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fce7f3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📐</div>
                    <Text variant="headingMd" as="h2">Spacing</Text>
                  </InlineStack>
                  <Divider />

                  <SpinnerField
                    label="Space between options"
                    value={s.spaceBetweenOptions}
                    onChange={(v) => set({ spaceBetweenOptions: v })}
                  />

                  <BlockStack gap="200">
                    <Text variant="bodyMd" as="p" fontWeight="semibold">Global Margins</Text>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <SpinnerField label="Top" value={s.marginTop} onChange={(v) => set({ marginTop: v })} />
                      <SpinnerField label="Bottom" value={s.marginBottom} onChange={(v) => set({ marginBottom: v })} />
                      <SpinnerField label="Left" value={s.marginLeft} onChange={(v) => set({ marginLeft: v })} />
                      <SpinnerField label="Right" value={s.marginRight} onChange={(v) => set({ marginRight: v })} />
                    </div>
                  </BlockStack>

                  <SpinnerField
                    label="Option Fields Left Margin"
                    value={s.optionFieldLeftMargin}
                    onChange={(v) => set({ optionFieldLeftMargin: v })}
                  />
                  <SpinnerField
                    label="Left Margin for Sub-Options"
                    value={s.subOptionLeftMargin}
                    onChange={(v) => set({ subOptionLeftMargin: v })}
                  />
                </BlockStack>
              </Card>

              {/* ── Display Effects ── */}
              <Card>
                <BlockStack gap="400">
                  <InlineStack gap="200" blockAlign="center">
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>✨</div>
                    <Text variant="headingMd" as="h2">Display Effects</Text>
                  </InlineStack>
                  <Divider />

                  <CheckboxRow
                    label="Disable Zoom effect (when product image is hovered)"
                    checked={s.disableZoom}
                    onChange={(v) => set({ disableZoom: v })}
                  />
                  <CheckboxRow
                    label="Disable Shadow effect from preview image"
                    checked={s.disableShadow}
                    onChange={(v) => set({ disableShadow: v })}
                  />
                </BlockStack>
              </Card>

              {/* ── Advanced Settings ── */}
              <Card>
                <BlockStack gap="400">
                  <InlineStack gap="200" blockAlign="center">
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚙️</div>
                    <Text variant="headingMd" as="h2">Advanced Settings</Text>
                  </InlineStack>
                  <Divider />

                  <Select
                    label="Action after a product is added to the cart"
                    options={[
                      { label: "Redirect to the cart page", value: "redirect_cart" },
                      { label: "Open cart drawer", value: "open_cart" },
                      { label: "Do nothing", value: "nothing" },
                    ]}
                    value={s.cartAction}
                    onChange={(v) => set({ cartAction: v as AppSettings["cartAction"] })}
                  />

                  <Banner tone="info">
                    <Text as="p" variant="bodySm">
                      When a product requires custom pricing and is added to the cart, the app creates a temporary copy of that product. It will be automatically deleted after the specified time.
                    </Text>
                  </Banner>

                  <Select
                    label="Temporary products lifetime"
                    options={[
                      { label: "15 minutes", value: "15min" },
                      { label: "30 minutes", value: "30min" },
                      { label: "1 hour", value: "1h" },
                      { label: "2 hours", value: "2h" },
                      { label: "4 hours", value: "4h" },
                      { label: "Never delete", value: "never" },
                    ]}
                    value={s.tempProductLifetime}
                    onChange={(v) => set({ tempProductLifetime: v as AppSettings["tempProductLifetime"] })}
                  />

                  <TextField
                    label="Temporary products prefix"
                    value={s.tempProductPrefix}
                    onChange={(v) => set({ tempProductPrefix: v })}
                    autoComplete="off"
                    helpText="This prefix is prepended to temporary product names so you can identify them."
                  />
                </BlockStack>
              </Card>

            </BlockStack>
          </Layout.Section>

          {/* ── Live swatch preview sidebar ── */}
          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Preview</Text>
                <Divider />
                <SwatchPreviewPanel settings={s} />
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
        <Box paddingBlockEnd="800" />
      </BlockStack>
    </Page>
  );
}

// ─── Swatch style visual options ──────────────────────────────────────────────

const SWATCH_STYLE_OPTIONS: { shape: AppSettings["swatchShape"]; size: AppSettings["swatchSize"]; label: string }[] = [
  { shape: "circle", size: "sm", label: "Small circles" },
  { shape: "circle", size: "lg", label: "Large circles" },
  { shape: "square", size: "sm", label: "Small squares" },
  { shape: "square", size: "lg", label: "Large squares" },
  { shape: "rounded", size: "sm", label: "Small rounded" },
  { shape: "rounded", size: "lg", label: "Large rounded" },
];

const DEMO_COLORS = ["#e53e3e", "#38a169", "#3182ce", "#d69e2e"];

function SwatchStyleCard({ shape, size, label, active, onClick }: {
  shape: AppSettings["swatchShape"];
  size: AppSettings["swatchSize"];
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const radius = shape === "circle" ? "50%" : shape === "square" ? "3px" : "8px";
  const px = size === "sm" ? 22 : size === "md" ? 32 : 42;

  return (
    <button
      onClick={onClick}
      style={{
        padding: "12px 8px", border: active ? "2px solid #5c6ac4" : "1.5px solid #e5e7eb",
        borderRadius: 10, background: active ? "#f0f0ff" : "#fff",
        cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        transition: "all 0.15s",
      }}
    >
      <div style={{ display: "flex", gap: 5 }}>
        {DEMO_COLORS.map((c, i) => (
          <div key={c} style={{
            width: px, height: px, borderRadius: radius, background: c,
            border: i === 0 ? "2px solid #5c6ac4" : "1.5px solid rgba(0,0,0,0.1)",
          }} />
        ))}
      </div>
      <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: active ? "#5c6ac4" : "#6b7280" }}>{label}</span>
    </button>
  );
}

// ─── Spinner field ─────────────────────────────────────────────────────────────

function SpinnerField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <InlineStack gap="300" blockAlign="center" wrap={false}>
      <Box minWidth="220px">
        <Text variant="bodyMd" as="p">{label}</Text>
      </Box>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          style={{ width: 28, height: 28, border: "1px solid #e5e7eb", borderRadius: 4, background: "#f9fafb", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#374151", display: "flex", alignItems: "center", justifyContent: "center" }}
        >−</button>
        <input
          type="number"
          value={value}
          min={0}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
          style={{ width: 56, padding: "4px 8px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13, textAlign: "center", outline: "none" }}
        />
        <button
          onClick={() => onChange(value + 1)}
          style={{ width: 28, height: 28, border: "1px solid #e5e7eb", borderRadius: 4, background: "#f9fafb", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#374151", display: "flex", alignItems: "center", justifyContent: "center" }}
        >+</button>
        <span style={{ fontSize: 12, color: "#9ca3af" }}>px</span>
      </div>
    </InlineStack>
  );
}

// ─── Checkbox row ─────────────────────────────────────────────────────────────

function CheckboxRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <InlineStack gap="300" blockAlign="center">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#5c6ac4", flexShrink: 0 }}
      />
      <Text variant="bodyMd" as="p">{label}</Text>
    </InlineStack>
  );
}

// ─── Live preview panel ───────────────────────────────────────────────────────

function SwatchPreviewPanel({ settings: s }: { settings: AppSettings }) {
  const radius = s.swatchShape === "circle" ? "50%" : s.swatchShape === "square" ? "4px" : "8px";
  const px = s.swatchSize === "sm" ? 26 : s.swatchSize === "md" ? 36 : 46;
  const colors = ["#e53e3e", "#38a169", "#3182ce", "#d69e2e", "#805ad5", "#dd6b20"];

  return (
    <BlockStack gap="400">
      <BlockStack gap="200">
        <Text variant="bodySm" tone="subdued" as="p">COLOR SWATCHES</Text>
        <div style={{ display: "flex", gap: s.spaceBetweenOptions, flexWrap: "wrap" }}>
          {colors.map((c, i) => (
            <div key={c} style={{
              width: px, height: px, borderRadius: radius, background: c,
              border: i === 0 ? "2.5px solid #5c6ac4" : "1.5px solid rgba(0,0,0,0.12)",
            }} />
          ))}
        </div>
      </BlockStack>

      <Divider />

      <BlockStack gap="200">
        <Text variant="bodySm" tone="subdued" as="p">SAMPLE OPTION</Text>
        <div style={{
          padding: `${s.marginTop}px ${s.marginRight}px ${s.marginBottom}px ${s.marginLeft}px`,
          border: "1px dashed #e5e7eb", borderRadius: 6,
        }}>
          <p style={{ margin: 0, fontSize: 13, color: s.globalTextColor, fontWeight: 500 }}>Select a Color</p>
          <div style={{ display: "flex", gap: s.spaceBetweenOptions, marginTop: 8, flexWrap: "wrap" }}>
            {colors.slice(0, 4).map((c, i) => (
              <div key={c} style={{
                width: px, height: px, borderRadius: radius, background: c,
                border: i === 0 ? "2.5px solid #5c6ac4" : "1.5px solid rgba(0,0,0,0.12)",
                boxShadow: s.disableShadow ? "none" : "0 1px 4px rgba(0,0,0,0.1)",
              }} />
            ))}
          </div>
        </div>
      </BlockStack>
    </BlockStack>
  );
}
