import { useLoaderData, useSubmit, useActionData, Link, useFetcher } from "react-router";
import { useState, useEffect, useMemo } from "react";
import { Stage, Layer as KonvaLayer, Text as KonvaText, Rect } from "react-konva";
import ProductLayer from "../components/ProductLayer";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import {
  type LayerConfig,
  type Question,
  type ColorSwatch,
  type InputType,
  type DropdownQuestion,
  type RadioQuestion,
  type CheckboxQuestion,
  type LabelQuestion,
  type GroupQuestion,
  getLayerSrc,
  migrateOptions,
} from "../types/configurator";

const CANVAS_SIZE = 520;

// ─── Loader / Action ──────────────────────────────────────────────────────────

export async function loader({ request, params }: any) {
  const { admin } = await authenticate.admin(request);
  const decodedId = decodeURIComponent(params.productId);

  const [productResponse, config] = await Promise.all([
    admin.graphql(
      `query GetProduct($id: ID!) {
        product(id: $id) {
          id title handle
          featuredImage { url }
          variants(first: 20) { edges { node { id title price } } }
        }
      }`,
      { variables: { id: decodedId } },
    ),
    prisma.productConfig.findUnique({ where: { productId: decodedId } }),
  ]);

  const productJson = await productResponse.json();
  return { product: productJson.data.product, config };
}

export async function action({ request, params }: any) {
  const { admin } = await authenticate.admin(request);
  const decodedId = decodeURIComponent(params.productId);
  const formData = await request.formData();

  const layers = JSON.parse(formData.get("layers") as string);
  const questions = JSON.parse(formData.get("questions") as string);
  const productName = formData.get("productName") as string;
  const productImageUrl = formData.get("productImageUrl") as string;
  const productHandle = formData.get("productHandle") as string;
  const numViews = Number(formData.get("numViews") ?? 1);

  const shopResponse = await admin.graphql(`query { shop { myshopifyDomain } }`);
  const shopData = await shopResponse.json();
  const shop = shopData.data.shop.myshopifyDomain;

  await prisma.productConfig.upsert({
    where: { productId: decodedId },
    create: { productId: decodedId, productName, shop, layers, options: { questions, productImageUrl, productHandle, numViews } },
    update: { productName, shop, layers, options: { questions, productImageUrl, productHandle, numViews } },
  });

  await admin.graphql(
    `mutation AddConfiguratorTag($id: ID!, $tags: [String!]!) {
      tagsAdd(id: $id, tags: $tags) {
        node { id }
        userErrors { field message }
      }
    }`,
    { variables: { id: decodedId, tags: ["configurator-enabled"] } },
  );

  return { success: true };
}

// ─── Shared micro-styles ──────────────────────────────────────────────────────

const labelSt: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280",
  marginBottom: 4, marginTop: 14, textTransform: "uppercase", letterSpacing: "0.04em",
};

const inputSt: React.CSSProperties = {
  display: "block", width: "100%", padding: "8px 10px",
  border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13,
  boxSizing: "border-box", outline: "none",
};

const smallBtnSt: React.CSSProperties = {
  background: "#f3f4f6", border: "none", borderRadius: 4,
  padding: "3px 9px", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#374151",
};

// ─── Add Question Modal ───────────────────────────────────────────────────────

const INPUT_TYPE_CONFIG: { type: InputType; label: string; bg: string; icon: string }[] = [
  { type: "thumbnail", label: "Thumbnail", bg: "#0ea5e9", icon: "⊞" },
  { type: "dropdown", label: "Dropdown", bg: "#6366f1", icon: "▼" },
  { type: "radio", label: "Radio button", bg: "#6366f1", icon: "◉" },
  { type: "label", label: "Label", bg: "#22c55e", icon: "⊟" },
  { type: "file", label: "File upload", bg: "#ef4444", icon: "↑" },
  { type: "text", label: "Text input", bg: "#10b981", icon: "T" },
  { type: "checkbox", label: "Checkbox", bg: "#10b981", icon: "☑" },
  { type: "color", label: "Color picker", bg: "#f59e0b", icon: "◎" },
  { type: "group", label: "Group", bg: "#6b7280", icon: "◻" },
];

function AddQuestionModal({ onAdd, onClose }: {
  onAdd: (type: InputType) => void;
  onClose: () => void;
}) {
  const [selInput, setSelInput] = useState<InputType | null>(null);

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#fff", borderRadius: 14, padding: 24, width: 460, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>1. Select an input type</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6b7280", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 24 }}>
          {INPUT_TYPE_CONFIG.map(({ type, label, bg, icon }) => (
            <button
              key={type}
              onClick={() => setSelInput(type)}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
                border: selInput === type ? `2px solid ${bg}` : "1px solid #e5e7eb",
                borderRadius: 8, background: selInput === type ? `${bg}18` : "#fff",
                cursor: "pointer", fontSize: 13, fontWeight: 500, textAlign: "left",
              }}
            >
              <span style={{ width: 26, height: 26, borderRadius: 6, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#fff", flexShrink: 0, fontWeight: 700 }}>
                {icon}
              </span>
              {label}
            </button>
          ))}
        </div>

        <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: selInput ? "#111827" : "#9ca3af" }}>
            {selInput
              ? `Add ${INPUT_TYPE_CONFIG.find((t) => t.type === selInput)?.label}`
              : "Please select what you want to create"}
          </span>
          <button
            onClick={() => { if (selInput) { onAdd(selInput); onClose(); } }}
            disabled={!selInput}
            style={{
              padding: "8px 22px", background: selInput ? "#111827" : "#e5e7eb",
              color: selInput ? "#fff" : "#9ca3af", border: "none", borderRadius: 6,
              cursor: selInput ? "pointer" : "default", fontWeight: 600, fontSize: 13,
            }}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Left panel – Question row ────────────────────────────────────────────────

function getQuestionIcon(q: Question) {
  switch (q.type) {
    case "color":
      return <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: q.swatches?.[0]?.value ?? "#888", border: "1px solid rgba(0,0,0,0.1)", flexShrink: 0 }} />;
    case "thumbnail":
      return <span style={{ fontSize: 11, color: "#0ea5e9", fontWeight: 700 }}>⊞</span>;
    case "text":
      return <span style={{ fontWeight: 800, fontSize: 12, color: "#10b981", lineHeight: 1 }}>T</span>;
    case "file":
      return <span style={{ fontSize: 11, color: "#ef4444" }}>↑</span>;
    case "dropdown":
      return <span style={{ fontSize: 10, color: "#6366f1" }}>▼</span>;
    case "radio":
      return <span style={{ fontSize: 10, color: "#6366f1" }}>◉</span>;
    case "checkbox":
      return <span style={{ fontSize: 10, color: "#10b981" }}>☑</span>;
    case "label":
      return <span style={{ fontSize: 10, color: "#22c55e" }}>⊟</span>;
    case "group":
      return <span style={{ fontSize: 10, color: "#6b7280" }}>◻</span>;
    default:
      return <span style={{ fontSize: 10, color: "#9ca3af" }}>?</span>;
  }
}

function QuestionRow({ q, selected, layerName, onSelect, onRemove }: {
  q: Question; selected: boolean; layerName?: string; onSelect: () => void; onRemove: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", cursor: "pointer", background: selected ? "#eff6ff" : "transparent", borderLeft: `3px solid ${selected ? "#3b82f6" : "transparent"}` }}
    >
      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 18, flexShrink: 0 }}>
        {getQuestionIcon(q)}
      </span>
      <span style={{ flex: 1, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.name}</span>
      {(q.type === "color" || q.type === "thumbnail") && layerName && (
        <span style={{ fontSize: 10, color: "#9ca3af", flexShrink: 0 }}>→ {layerName}</span>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        style={{ background: "none", border: "none", color: "#d1d5db", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0, flexShrink: 0 }}
      >
        ×
      </button>
    </div>
  );
}

// ─── Left panel – Layer row ───────────────────────────────────────────────────

function LayerRow({ layer, selected, onSelect, onRemove }: {
  layer: LayerConfig; selected: boolean; onSelect: () => void; onRemove: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", cursor: "pointer", background: selected ? "#eff6ff" : "transparent", borderLeft: `3px solid ${selected ? "#3b82f6" : "transparent"}` }}
    >
      <span style={{ display: "inline-block", width: 4, height: 18, borderRadius: 2, background: layer.type === "colorable" ? "#6366f1" : "#d1d5db", flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{layer.name}</span>
      <span style={{ fontSize: 10, color: "#9ca3af", textTransform: "uppercase", flexShrink: 0 }}>
        {layer.type === "colorable" ? "color" : "static"}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        style={{ background: "none", border: "none", color: "#d1d5db", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }}
      >
        ×
      </button>
    </div>
  );
}

// ─── Standard color palette ───────────────────────────────────────────────────

const STANDARD_PALETTE: ColorSwatch[] = [
  { value: "#FFFFFF", label: "White" }, { value: "#000000", label: "Black" },
  { value: "#808080", label: "Gray" }, { value: "#C8A96E", label: "Blonde" },
  { value: "#D2B48C", label: "Tan" }, { value: "#8B4513", label: "Brown" },
  { value: "#800000", label: "Maroon" }, { value: "#003087", label: "Navy Blue" },
  { value: "#FF0000", label: "Red" }, { value: "#6A0DAD", label: "Purple" },
  { value: "#0044FF", label: "Royal Blue" }, { value: "#87CEEB", label: "Sky Blue" },
  { value: "#98FFB3", label: "Mint" }, { value: "#228B22", label: "Forest Green" },
  { value: "#ADD8E6", label: "Light Blue" }, { value: "#FF8C00", label: "Orange" },
  { value: "#FF69B4", label: "Pink" }, { value: "#FFD700", label: "Yellow" },
  { value: "#556B2F", label: "Army Green" }, { value: "#00CED1", label: "Teal" },
];

// ─── Swatch row ───────────────────────────────────────────────────────────────

function SwatchRow({ swatch, isActive, onSelect, onRemove, onImageUpload }: {
  swatch: ColorSwatch; isActive?: boolean; onSelect?: () => void;
  onRemove: () => void; onImageUpload: (url: string) => void;
}) {
  const fetcher = useFetcher<{ url?: string; error?: string }>();
  const uploading = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.data?.url) onImageUpload(fetcher.data.url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.data?.url]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fetcher.submit(fd, { method: "post", action: "/app/upload-image", encType: "multipart/form-data" });
    e.target.value = "";
  };

  return (
    <div
      onClick={onSelect}
      style={{
        display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", borderRadius: 6,
        background: isActive ? "#eff6ff" : "#f9fafb",
        border: isActive ? "1px solid #93c5fd" : "1px solid #f3f4f6", cursor: "pointer",
      }}
    >
      {swatch.imageUrl ? (
        <img src={swatch.imageUrl} alt={swatch.label} style={{ width: 28, height: 28, borderRadius: 4, objectFit: "cover", flexShrink: 0, outline: isActive ? "2px solid #3b82f6" : "none", outlineOffset: 1 }} />
      ) : (
        <span style={{ width: 22, height: 22, borderRadius: "50%", background: swatch.value, border: isActive ? "2px solid #3b82f6" : "1px solid rgba(0,0,0,0.15)", flexShrink: 0, display: "inline-block" }} />
      )}
      <span style={{ flex: 1, fontSize: 13, fontWeight: isActive ? 600 : 400 }}>{swatch.label}</span>
      {isActive && <span style={{ fontSize: 10, color: "#3b82f6", fontWeight: 700 }}>● PREVIEW</span>}
      <span style={{ fontSize: 11, color: "#9ca3af" }}>{swatch.value}</span>
      <label title={swatch.imageUrl ? "Replace image" : "Add texture image"} style={{ cursor: uploading ? "wait" : "pointer", fontSize: 13, color: "#9ca3af" }}>
        {uploading ? "⏳" : swatch.imageUrl ? "🔄" : "🖼"}
        <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} disabled={uploading} />
      </label>
      <button onClick={onRemove} style={{ background: "none", border: "none", color: "#d1d5db", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
    </div>
  );
}

// ─── Color/Thumbnail shared swatch editor ─────────────────────────────────────

function SwatchEditor({ q, layers, onChange, previewValue, onPreview }: {
  q: (Question & { type: "color" }) | (Question & { type: "thumbnail" });
  layers: LayerConfig[];
  onChange: (updated: Question) => void;
  previewValue?: string;
  onPreview: (value: string) => void;
}) {
  const [newColor, setNewColor] = useState("#ff0000");
  const [newLabel, setNewLabel] = useState("");
  const [showPalette, setShowPalette] = useState(false);

  const addSwatch = (swatch: ColorSwatch) => {
    if (q.swatches.some((s) => s.value.toLowerCase() === swatch.value.toLowerCase())) return;
    onChange({ ...q, swatches: [...q.swatches, swatch] });
  };

  return (
    <div style={{ padding: 16 }}>
      <label style={labelSt}>Title</label>
      <input value={q.name} onChange={(e) => onChange({ ...q, name: e.target.value })} style={inputSt} />

      {q.type === "color" && (
        <>
          <label style={labelSt}>Linked Layer</label>
          <select value={q.linkedLayerId} onChange={(e) => onChange({ ...q, linkedLayerId: e.target.value })} style={inputSt}>
            {layers.filter((l) => l.type === "colorable").map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </>
      )}

      {q.type === "thumbnail" && (
        <>
          <label style={labelSt}>Linked Layer (optional)</label>
          <select value={q.linkedLayerId || ""} onChange={(e) => onChange({ ...q, linkedLayerId: e.target.value || undefined })} style={inputSt}>
            <option value="">— none —</option>
            {layers.filter((l) => l.type === "colorable").map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </>
      )}

      <label style={labelSt}>{q.type === "thumbnail" ? "Thumbnail Options" : "Color Answers"}</label>
      {q.swatches.length === 0 && (
        <p style={{ fontSize: 12, color: "#9ca3af", margin: "4px 0 8px" }}>No options yet. Add from palette or add custom below.</p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
        {q.swatches.map((s, i) => (
          <SwatchRow
            key={i}
            swatch={s}
            isActive={previewValue === s.value}
            onSelect={() => onPreview(s.value)}
            onRemove={() => onChange({ ...q, swatches: q.swatches.filter((_, idx) => idx !== i) })}
            onImageUpload={(imageUrl) => onChange({ ...q, swatches: q.swatches.map((sw, idx) => idx === i ? { ...sw, imageUrl } : sw) })}
          />
        ))}
      </div>

      <button
        onClick={() => setShowPalette((p) => !p)}
        style={{ width: "100%", padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#f9fafb", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#374151", textAlign: "left", marginBottom: 6 }}
      >
        {showPalette ? "▲ Hide standard palette" : "▼ Add from standard palette"}
      </button>
      {showPalette && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 5, marginBottom: 10, padding: "8px", background: "#f9fafb", borderRadius: 6, border: "1px solid #e5e7eb" }}>
          {STANDARD_PALETTE.map((s) => {
            const already = q.swatches.some((sw) => sw.value.toLowerCase() === s.value.toLowerCase());
            return (
              <button key={s.value} title={s.label} onClick={() => addSwatch(s)} disabled={already}
                style={{ width: "100%", aspectRatio: "1", borderRadius: "50%", background: s.value, border: already ? "3px solid #3b82f6" : "2px solid rgba(0,0,0,0.1)", cursor: already ? "default" : "pointer", opacity: already ? 0.5 : 1, outline: "none" }}
              />
            );
          })}
        </div>
      )}

      <label style={labelSt}>Custom Color</label>
      <div style={{ display: "flex", gap: 6 }}>
        <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} style={{ width: 36, height: 32, borderRadius: 4, border: "1px solid #e5e7eb", padding: 1, flexShrink: 0 }} />
        <input
          placeholder="Label (e.g. Crimson Red)" value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && newLabel.trim()) { addSwatch({ value: newColor, label: newLabel.trim() }); setNewLabel(""); } }}
          style={{ flex: 1, padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13 }}
        />
        <button onClick={() => { if (!newLabel.trim()) return; addSwatch({ value: newColor, label: newLabel.trim() }); setNewLabel(""); }}
          style={{ padding: "6px 12px", background: "#111827", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}
        >+</button>
      </div>
    </div>
  );
}

// ─── Text question editor ─────────────────────────────────────────────────────

function TextEditor({ q, onChange }: { q: Question & { type: "text" }; onChange: (updated: Question) => void }) {
  return (
    <div style={{ padding: 16 }}>
      <label style={labelSt}>Title</label>
      <input value={q.name} onChange={(e) => onChange({ ...q, name: e.target.value })} style={inputSt} />
      <label style={labelSt}>Default Text</label>
      <input value={q.defaultText} onChange={(e) => onChange({ ...q, defaultText: e.target.value })} style={inputSt} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
        <div>
          <label style={labelSt}>Default Color</label>
          <input type="color" value={q.defaultColor} onChange={(e) => onChange({ ...q, defaultColor: e.target.value })} style={{ display: "block", width: "100%", height: 34, border: "1px solid #e5e7eb", borderRadius: 6 }} />
        </div>
        <div>
          <label style={labelSt}>Font Size</label>
          <input type="number" value={q.defaultFontSize} onChange={(e) => onChange({ ...q, defaultFontSize: Number(e.target.value) })} style={inputSt} />
        </div>
      </div>
      <label style={labelSt}>Font Family</label>
      <select value={q.defaultFontFamily} onChange={(e) => onChange({ ...q, defaultFontFamily: e.target.value })} style={inputSt}>
        {["Arial", "Georgia", "Impact", "Verdana", "Courier New", "Times New Roman"].map((f) => (
          <option key={f} value={f}>{f}</option>
        ))}
      </select>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
        <div>
          <label style={labelSt}>Position X</label>
          <input type="number" value={q.position.x} onChange={(e) => onChange({ ...q, position: { ...q.position, x: Number(e.target.value) } })} style={inputSt} />
        </div>
        <div>
          <label style={labelSt}>Position Y</label>
          <input type="number" value={q.position.y} onChange={(e) => onChange({ ...q, position: { ...q.position, y: Number(e.target.value) } })} style={inputSt} />
        </div>
      </div>
    </div>
  );
}

// ─── File question editor ─────────────────────────────────────────────────────

function FileEditor({ q, onChange }: { q: Question & { type: "file" }; onChange: (updated: Question) => void }) {
  return (
    <div style={{ padding: 16 }}>
      <label style={labelSt}>Title</label>
      <input value={q.name} onChange={(e) => onChange({ ...q, name: e.target.value })} style={inputSt} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
        {[
          { label: "Position X", key: "x", isPos: true },
          { label: "Position Y", key: "y", isPos: true },
          { label: "Default Width", key: "defaultWidth", isPos: false },
          { label: "Default Height", key: "defaultHeight", isPos: false },
        ].map(({ label, key, isPos }) => (
          <div key={key}>
            <label style={labelSt}>{label}</label>
            <input
              type="number"
              value={isPos ? (q.position as any)[key] : (q as any)[key]}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (isPos) onChange({ ...q, position: { ...q.position, [key]: val } });
                else onChange({ ...q, [key]: val });
              }}
              style={inputSt}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Dropdown question editor ─────────────────────────────────────────────────

function DropdownEditor({ q, onChange }: { q: DropdownQuestion; onChange: (updated: Question) => void }) {
  const [newVal, setNewVal] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const addOption = () => {
    if (!newVal.trim() || !newLabel.trim()) return;
    onChange({ ...q, options: [...q.options, { value: newVal.trim(), label: newLabel.trim() }] });
    setNewVal(""); setNewLabel("");
  };

  return (
    <div style={{ padding: 16 }}>
      <label style={labelSt}>Title</label>
      <input value={q.name} onChange={(e) => onChange({ ...q, name: e.target.value })} style={inputSt} />
      <label style={labelSt}>Default Value</label>
      <select value={q.defaultValue || ""} onChange={(e) => onChange({ ...q, defaultValue: e.target.value })} style={inputSt}>
        <option value="">— none —</option>
        {q.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <label style={labelSt}>Options</label>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
        {q.options.map((o, i) => (
          <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", padding: "5px 8px", background: "#f9fafb", borderRadius: 5, border: "1px solid #e5e7eb" }}>
            <span style={{ flex: 1, fontSize: 13 }}>{o.label}</span>
            <span style={{ fontSize: 11, color: "#9ca3af" }}>{o.value}</span>
            <button onClick={() => onChange({ ...q, options: q.options.filter((_, idx) => idx !== i) })} style={{ background: "none", border: "none", color: "#d1d5db", cursor: "pointer", fontSize: 14 }}>×</button>
          </div>
        ))}
        {q.options.length === 0 && <p style={{ fontSize: 12, color: "#9ca3af", margin: "4px 0" }}>No options yet.</p>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 5 }}>
        <input placeholder="value" value={newVal} onChange={(e) => setNewVal(e.target.value)} style={inputSt} />
        <input placeholder="Label" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addOption(); }} style={inputSt} />
        <button onClick={addOption} style={{ padding: "8px 12px", background: "#111827", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>+</button>
      </div>
    </div>
  );
}

// ─── Radio question editor ────────────────────────────────────────────────────

function RadioEditor({ q, onChange }: { q: RadioQuestion; onChange: (updated: Question) => void }) {
  const [newVal, setNewVal] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const addOption = () => {
    if (!newVal.trim() || !newLabel.trim()) return;
    onChange({ ...q, options: [...q.options, { value: newVal.trim(), label: newLabel.trim() }] });
    setNewVal(""); setNewLabel("");
  };

  return (
    <div style={{ padding: 16 }}>
      <label style={labelSt}>Title</label>
      <input value={q.name} onChange={(e) => onChange({ ...q, name: e.target.value })} style={inputSt} />
      <label style={labelSt}>Default Value</label>
      <select value={q.defaultValue || ""} onChange={(e) => onChange({ ...q, defaultValue: e.target.value })} style={inputSt}>
        <option value="">— none —</option>
        {q.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <label style={labelSt}>Options</label>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
        {q.options.map((o, i) => (
          <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", padding: "5px 8px", background: "#f9fafb", borderRadius: 5, border: "1px solid #e5e7eb" }}>
            <span style={{ flex: 1, fontSize: 13 }}>{o.label}</span>
            <button onClick={() => onChange({ ...q, options: q.options.filter((_, idx) => idx !== i) })} style={{ background: "none", border: "none", color: "#d1d5db", cursor: "pointer", fontSize: 14 }}>×</button>
          </div>
        ))}
        {q.options.length === 0 && <p style={{ fontSize: 12, color: "#9ca3af", margin: "4px 0" }}>No options yet.</p>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 5 }}>
        <input placeholder="value" value={newVal} onChange={(e) => setNewVal(e.target.value)} style={inputSt} />
        <input placeholder="Label" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addOption(); }} style={inputSt} />
        <button onClick={addOption} style={{ padding: "8px 12px", background: "#111827", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>+</button>
      </div>
    </div>
  );
}

// ─── Checkbox question editor ─────────────────────────────────────────────────

function CheckboxEditor({ q, onChange }: { q: CheckboxQuestion; onChange: (updated: Question) => void }) {
  return (
    <div style={{ padding: 16 }}>
      <label style={labelSt}>Title</label>
      <input value={q.name} onChange={(e) => onChange({ ...q, name: e.target.value })} style={inputSt} />
      <label style={labelSt}>Checked Label</label>
      <input value={q.checkedLabel} onChange={(e) => onChange({ ...q, checkedLabel: e.target.value })} style={inputSt} />
      <label style={labelSt}>Unchecked Label</label>
      <input value={q.uncheckedLabel} onChange={(e) => onChange({ ...q, uncheckedLabel: e.target.value })} style={inputSt} />
      <label style={{ ...labelSt, marginTop: 14, display: "flex", alignItems: "center", gap: 8, textTransform: "none", cursor: "pointer" }}>
        <input type="checkbox" checked={q.defaultChecked} onChange={(e) => onChange({ ...q, defaultChecked: e.target.checked })} />
        Default checked
      </label>
    </div>
  );
}

// ─── Label question editor ────────────────────────────────────────────────────

function LabelEditor({ q, onChange }: { q: LabelQuestion; onChange: (updated: Question) => void }) {
  return (
    <div style={{ padding: 16 }}>
      <label style={labelSt}>Display Name</label>
      <input value={q.name} onChange={(e) => onChange({ ...q, name: e.target.value })} style={inputSt} />
      <label style={labelSt}>Content</label>
      <textarea
        value={q.content}
        onChange={(e) => onChange({ ...q, content: e.target.value })}
        style={{ ...inputSt, minHeight: 80, resize: "vertical" }}
      />
    </div>
  );
}

// ─── Group question editor ────────────────────────────────────────────────────

function GroupEditorComp({ q, questions, onChange }: { q: GroupQuestion; questions: Question[]; onChange: (updated: Question) => void }) {
  const candidates = questions.filter((oq) => oq.id !== q.id && oq.type !== "group");

  return (
    <div style={{ padding: 16 }}>
      <label style={labelSt}>Group Name</label>
      <input value={q.name} onChange={(e) => onChange({ ...q, name: e.target.value })} style={inputSt} />
      <label style={labelSt}>Child Questions</label>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {candidates.map((oq) => (
          <label key={oq.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", padding: "6px 8px", borderRadius: 6, background: q.childIds.includes(oq.id) ? "#eff6ff" : "#f9fafb", border: q.childIds.includes(oq.id) ? "1px solid #93c5fd" : "1px solid #e5e7eb" }}>
            <input
              type="checkbox"
              checked={q.childIds.includes(oq.id)}
              onChange={(e) => {
                const next = e.target.checked ? [...q.childIds, oq.id] : q.childIds.filter((cid) => cid !== oq.id);
                onChange({ ...q, childIds: next });
              }}
            />
            <span style={{ fontWeight: 500 }}>{oq.name}</span>
            <span style={{ fontSize: 11, color: "#9ca3af" }}>({oq.type})</span>
          </label>
        ))}
        {candidates.length === 0 && <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Add other questions first, then group them here.</p>}
      </div>
    </div>
  );
}

// ─── View upload slot ─────────────────────────────────────────────────────────

const MAX_VIEWS = 4;

function ViewUploadSlot({ viewIndex, currentUrl, onUploaded, onUrlChange }: {
  viewIndex: number; currentUrl: string; onUploaded: (url: string) => void; onUrlChange: (url: string) => void;
}) {
  const fetcher = useFetcher<{ url?: string; error?: string }>();
  const uploading = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.data?.url) onUploaded(fetcher.data.url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.data?.url]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fetcher.submit(fd, { method: "post", action: "/app/upload-image", encType: "multipart/form-data" });
    e.target.value = "";
  };

  return (
    <div style={{ marginBottom: 10, padding: 10, border: "1px solid #e5e7eb", borderRadius: 8, background: "#fafafa" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
        View {viewIndex + 1}{viewIndex === 0 && <span style={{ fontWeight: 400, textTransform: "none", color: "#9ca3af", marginLeft: 4 }}>(primary)</span>}
      </div>
      {currentUrl && (
        <div style={{ marginBottom: 6, textAlign: "center" }}>
          <img src={currentUrl} alt={`View ${viewIndex + 1}`} style={{ maxWidth: "100%", maxHeight: 80, objectFit: "contain", borderRadius: 4 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </div>
      )}
      <label style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 10px", border: "2px dashed #d1d5db", borderRadius: 6, cursor: uploading ? "wait" : "pointer", color: "#6b7280", fontSize: 12, background: uploading ? "#f3f4f6" : "#fff", marginBottom: 4 }}>
        <span>{uploading ? "⏳" : "📁"}</span>
        <span>{uploading ? "Uploading…" : currentUrl ? "Replace image" : "Upload PNG"}</span>
        <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display: "none" }} onChange={handleFile} disabled={uploading} />
      </label>
      {fetcher.data?.error && <p style={{ color: "#ef4444", fontSize: 11, margin: "2px 0" }}>{fetcher.data.error}</p>}
      <input value={currentUrl} onChange={(e) => onUrlChange(e.target.value)} placeholder="or paste URL…" style={{ ...inputSt, fontSize: 11, padding: "5px 8px" }} />
    </div>
  );
}

// ─── Layer editor ─────────────────────────────────────────────────────────────

function LayerEditorComp({ layer, numViews, onChange }: { layer: LayerConfig; numViews: number; onChange: (updated: LayerConfig) => void }) {
  const setViewUrl = (viewIndex: number, url: string) => {
    if (viewIndex === 0) { onChange({ ...layer, src: url }); return; }
    const ev = [...(layer.extraViews ?? [])];
    ev[viewIndex - 1] = url;
    onChange({ ...layer, extraViews: ev });
  };

  const getViewUrl = (viewIndex: number): string => {
    if (viewIndex === 0) return layer.src;
    return layer.extraViews?.[viewIndex - 1] ?? "";
  };

  return (
    <div style={{ padding: 16 }}>
      <label style={labelSt}>Layer Name</label>
      <input value={layer.name} onChange={(e) => onChange({ ...layer, name: e.target.value })} style={inputSt} />
      <label style={labelSt}>Type</label>
      <select value={layer.type} onChange={(e) => onChange({ ...layer, type: e.target.value as "static" | "colorable" })} style={inputSt}>
        <option value="static">Static (fixed image)</option>
        <option value="colorable">Colorable (mask PNG)</option>
      </select>
      <label style={{ ...labelSt, marginTop: 16 }}>Images ({numViews} view{numViews !== 1 ? "s" : ""})</label>
      {Array.from({ length: numViews }).map((_, vi) => (
        <ViewUploadSlot key={vi} viewIndex={vi} currentUrl={getViewUrl(vi)} onUploaded={(url) => setViewUrl(vi, url)} onUrlChange={(url) => setViewUrl(vi, url)} />
      ))}
      {layer.type === "colorable" && (
        <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 6, lineHeight: 1.5 }}>
          Use a white/grayscale PNG on a transparent background for accurate coloring.
        </p>
      )}
    </div>
  );
}

// ─── Main builder page ────────────────────────────────────────────────────────

export default function BuilderPage() {
  const { product, config } = useLoaderData() as any;
  const actionData = useActionData() as any;
  const submit = useSubmit();

  const existingOptions = config?.options as any;

  const [layers, setLayers] = useState<LayerConfig[]>((config?.layers as LayerConfig[]) ?? []);
  const [questions, setQuestions] = useState<Question[]>(
    () => migrateOptions(existingOptions, (config?.layers as LayerConfig[]) ?? []) || [],
  );

  type Sel = { kind: "question" | "layer"; id: string } | null;
  const [selected, setSelected] = useState<Sel>(null);
  const [mounted, setMounted] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const [numViews, setNumViews] = useState<number>((existingOptions?.numViews as number) ?? 1);
  const [currentView, setCurrentView] = useState(0);

  // New layer form
  const [showNewLayer, setShowNewLayer] = useState(false);
  const [nlName, setNlName] = useState("");
  const [nlType, setNlType] = useState<"static" | "colorable">("colorable");
  const [nlColor, setNlColor] = useState("#ff0000");

  useEffect(() => { setMounted(true); }, []);

  // Swatch preview — initialize with first swatch so builder matches customer view default
  const [selectedSwatches, setSelectedSwatches] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const q of questions) {
      if ((q.type === "color" || q.type === "thumbnail") && q.swatches.length > 0) {
        init[q.id] = q.swatches[0].value;
      }
    }
    return init;
  });

  const canvasColors = useMemo(() => {
    const c: Record<string, string> = {};
    for (const q of questions) {
      if ((q.type === "color" || q.type === "thumbnail") && q.linkedLayerId) {
        const picked = selectedSwatches[q.id];
        if (picked) c[q.linkedLayerId] = picked;
      }
    }
    return c;
  }, [questions, selectedSwatches]);

  // Texture images for canvas preview (when a swatch with imageUrl is selected)
  const canvasTextures = useMemo(() => {
    const t: Record<string, string> = {};
    for (const q of questions) {
      if ((q.type === "color" || q.type === "thumbnail") && q.linkedLayerId) {
        const pickedVal = selectedSwatches[q.id];
        if (pickedVal) {
          const swatch = q.swatches.find((s) => s.value === pickedVal);
          if (swatch?.imageUrl) t[q.linkedLayerId] = swatch.imageUrl;
        }
      }
    }
    return t;
  }, [questions, selectedSwatches]);

  const textItems = useMemo(() => questions.filter((q): q is Question & { type: "text" } => q.type === "text"), [questions]);
  const filePlaceholders = useMemo(() => questions.filter((q): q is Question & { type: "file" } => q.type === "file"), [questions]);

  const S = CANVAS_SIZE / 800;

  // CRUD helpers
  const updateQ = (u: Question) => setQuestions((p) => p.map((q) => (q.id === u.id ? u : q)));
  const removeQ = (id: string) => { setQuestions((p) => p.filter((q) => q.id !== id)); if (selected?.id === id) setSelected(null); };

  const addQuestion = (type: InputType) => {
    const id = `${type}-${Date.now()}`;
    let q: Question;

    switch (type) {
      case "color": {
        const first = layers.find((l) => l.type === "colorable");
        if (!first) { alert("Add a colorable layer first."); return; }
        q = { id, name: "Color Option", type: "color", linkedLayerId: first.id, swatches: [] };
        break;
      }
      case "thumbnail":
        q = { id, name: "Thumbnail Option", type: "thumbnail", swatches: [] };
        break;
      case "text":
        q = { id, name: "Custom Text", type: "text", defaultText: "Your Name", defaultColor: "#ffffff", defaultFontSize: 48, defaultFontFamily: "Arial", position: { x: 200, y: 180 } };
        break;
      case "file":
        q = { id, name: "Upload Image", type: "file", position: { x: 200, y: 280 }, defaultWidth: 120, defaultHeight: 120 };
        break;
      case "dropdown":
        q = { id, name: "Select Option", type: "dropdown", options: [{ value: "option-1", label: "Option 1" }] };
        break;
      case "radio":
        q = { id, name: "Choose Option", type: "radio", options: [{ value: "option-1", label: "Option 1" }] };
        break;
      case "checkbox":
        q = { id, name: "Add-on", type: "checkbox", checkedLabel: "Yes", uncheckedLabel: "No", defaultChecked: false };
        break;
      case "label":
        q = { id, name: "Info", type: "label", content: "Enter your label text here." };
        break;
      case "group":
        q = { id, name: "Group", type: "group", childIds: [] };
        break;
      default:
        return;
    }

    setQuestions((p) => [...p, q]);
    setSelected({ kind: "question", id });
  };

  const updateL = (u: LayerConfig) => setLayers((p) => p.map((l) => (l.id === u.id ? u : l)));
  const removeL = (id: string) => { setLayers((p) => p.filter((l) => l.id !== id)); if (selected?.id === id) setSelected(null); };
  const addNewLayer = () => {
    if (!nlName.trim()) return;
    const id = nlName.trim().toLowerCase().replace(/\s+/g, "-");
    setLayers((p) => [...p, { id, name: nlName.trim(), type: nlType, src: "", ...(nlType === "colorable" ? { defaultColor: nlColor } : {}) }]);
    setNlName("");
    setShowNewLayer(false);
    setSelected({ kind: "layer", id });
  };

  const handleSave = () => {
    const fd = new FormData();
    fd.append("layers", JSON.stringify(layers));
    fd.append("questions", JSON.stringify(questions));
    fd.append("productName", product.title);
    fd.append("productImageUrl", product.featuredImage?.url || "");
    fd.append("productHandle", product.handle || "");
    fd.append("numViews", String(numViews));
    submit(fd, { method: "post" });
  };

  const selQ = selected?.kind === "question" ? questions.find((q) => q.id === selected.id) : null;
  const selL = selected?.kind === "layer" ? layers.find((l) => l.id === selected.id) : null;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: 14, color: "#111827" }}>

      {/* Add Question Modal */}
      {showAddModal && (
        <AddQuestionModal
          onAdd={(type) => addQuestion(type)}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* ═══════════════ LEFT PANEL ══════════════════════════════════════ */}
      <div style={{ width: 260, borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", overflow: "hidden", background: "#fff" }}>

        {/* Product header */}
        <div style={{ padding: "10px 14px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 10 }}>
          {product.featuredImage && (
            <img src={product.featuredImage.url} alt="" style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 5, flexShrink: 0 }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.title}</div>
            <Link to="/app/products" style={{ fontSize: 11, color: "#9ca3af", textDecoration: "none" }}>← Products</Link>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>

          {/* QUESTIONS */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px 4px" }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9ca3af" }}>Questions</span>
            <button onClick={() => setShowAddModal(true)} title="Add question" style={{ ...smallBtnSt, background: "#111827", color: "#fff", borderRadius: 6, padding: "3px 10px" }}>+ Add</button>
          </div>

          {questions.length === 0 && (
            <p style={{ padding: "8px 14px", fontSize: 12, color: "#9ca3af", margin: 0 }}>No questions yet. Click "Add" to create one.</p>
          )}

          {questions.map((q) => (
            <QuestionRow
              key={q.id} q={q}
              selected={selected?.id === q.id}
              layerName={(q.type === "color" || q.type === "thumbnail") ? layers.find((l) => l.id === q.linkedLayerId)?.name : undefined}
              onSelect={() => setSelected({ kind: "question", id: q.id })}
              onRemove={() => removeQ(q.id)}
            />
          ))}

          {/* LAYERS (Behind the scene) */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px 4px", borderTop: "1px solid #f3f4f6", marginTop: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9ca3af" }}>Behind the scene</span>
            <button onClick={() => setShowNewLayer(!showNewLayer)} style={smallBtnSt}>+</button>
          </div>

          {showNewLayer && (
            <div style={{ margin: "4px 10px 8px", padding: "10px", background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
              <input placeholder="Layer name (e.g. Barrel)" value={nlName} onChange={(e) => setNlName(e.target.value)} style={{ ...inputSt, marginBottom: 5 }} />
              <div style={{ display: "flex", gap: 5 }}>
                <select value={nlType} onChange={(e) => setNlType(e.target.value as any)} style={{ flex: 1, padding: "5px 8px", border: "1px solid #e5e7eb", borderRadius: 5, fontSize: 12 }}>
                  <option value="static">Static</option>
                  <option value="colorable">Colorable</option>
                </select>
                {nlType === "colorable" && (
                  <input type="color" value={nlColor} onChange={(e) => setNlColor(e.target.value)} style={{ width: 30, border: "1px solid #e5e7eb", borderRadius: 4 }} />
                )}
                <button onClick={addNewLayer} style={{ padding: "5px 12px", background: "#111827", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer", fontSize: 12 }}>Add</button>
              </div>
            </div>
          )}

          {layers.map((l) => (
            <LayerRow key={l.id} layer={l} selected={selected?.id === l.id} onSelect={() => setSelected({ kind: "layer", id: l.id })} onRemove={() => removeL(l.id)} />
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: "10px 14px", borderTop: "1px solid #e5e7eb", display: "flex", flexDirection: "column", gap: 6 }}>
          {config && (
            <Link to={`/app/configurator/${encodeURIComponent(product.id)}`} style={{ fontSize: 12, color: "#2563eb", textDecoration: "none" }}>
              Preview customer view →
            </Link>
          )}
          <span style={{ fontSize: 11, color: "#9ca3af" }}>Add to cart →</span>
        </div>
      </div>

      {/* ═══════════════ CENTER – LIVE CANVAS ════════════════════════════ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#f3f4f6", overflow: "hidden" }}>

        {/* Top bar */}
        <div style={{ height: 44, background: "#fff", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", padding: "0 20px", gap: 16 }}>
          <span style={{ fontWeight: 700, fontSize: 13, borderBottom: "2px solid #111827", paddingBottom: 2 }}>Build</span>
          <span style={{ color: "#9ca3af", fontSize: 13 }}>Pricing</span>
          <span style={{ color: "#9ca3af", fontSize: 13 }}>Variants</span>
          {actionData?.success && (
            <span style={{ marginLeft: "auto", background: "#d1fae5", color: "#065f46", padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>✓ Saved</span>
          )}
        </div>

        {/* Canvas area */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "auto", padding: 24 }}>
          {mounted ? (
            <div style={{ position: "relative", boxShadow: "0 8px 32px rgba(0,0,0,0.14)", borderRadius: 6, overflow: "hidden", background: "#fff" }}>
              {layers.length === 0 && (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, color: "#9ca3af", zIndex: 1, pointerEvents: "none" }}>
                  <div style={{ fontSize: 40 }}>🎨</div>
                  <p style={{ margin: 0, fontSize: 13, textAlign: "center", lineHeight: 1.5, padding: "0 20px" }}>Add layers using the <strong>+</strong> button in the left panel.</p>
                </div>
              )}
              <Stage width={CANVAS_SIZE} height={CANVAS_SIZE}>
                <KonvaLayer>
                  {layers.map((layer) => (
                    <ProductLayer
                      key={layer.id}
                      src={getLayerSrc(layer, currentView)}
                      color={layer.type === "colorable" ? canvasColors[layer.id] : undefined}
                      textureUrl={layer.type === "colorable" ? canvasTextures[layer.id] : undefined}
                      width={CANVAS_SIZE}
                      height={CANVAS_SIZE}
                    />
                  ))}
                  {textItems.map((q) => (
                    <KonvaText key={q.id} text={q.defaultText} x={q.position.x * S} y={q.position.y * S} fontSize={q.defaultFontSize * S} fontFamily={q.defaultFontFamily} fill={q.defaultColor} listening={false} />
                  ))}
                  {filePlaceholders.map((q) => (
                    <Rect key={q.id} x={q.position.x * S} y={q.position.y * S} width={q.defaultWidth * S} height={q.defaultHeight * S} fill="#f3f4f6" stroke="#9ca3af" strokeWidth={1} dash={[5, 3]} listening={false} />
                  ))}
                </KonvaLayer>
              </Stage>
            </div>
          ) : (
            <div style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, background: "#e5e7eb", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 14 }}>Loading canvas…</div>
          )}
        </div>

        {/* View navigation dots */}
        <div style={{ padding: "10px 0 0", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {Array.from({ length: numViews }).map((_, vi) => (
            <button key={vi} onClick={() => setCurrentView(vi)}
              style={{ width: vi === currentView ? 22 : 10, height: 10, borderRadius: 5, background: vi === currentView ? "#111827" : "#d1d5db", border: "none", cursor: "pointer", padding: 0, transition: "width 0.15s" }}
              title={`View ${vi + 1}`}
            />
          ))}
          {numViews < MAX_VIEWS && (
            <button onClick={() => { setNumViews((n) => Math.min(n + 1, MAX_VIEWS)); setCurrentView(numViews); }}
              style={{ background: "none", border: "1px dashed #d1d5db", borderRadius: 5, width: 22, height: 22, cursor: "pointer", fontSize: 14, color: "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
              title="Add view"
            >+</button>
          )}
          {numViews > 1 && (
            <button onClick={() => { setNumViews((n) => n - 1); setCurrentView((v) => Math.min(v, numViews - 2)); }}
              style={{ background: "none", border: "1px dashed #fca5a5", borderRadius: 5, width: 22, height: 22, cursor: "pointer", fontSize: 12, color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
              title="Remove last view"
            >−</button>
          )}
        </div>

        {/* Bottom bar */}
        <div style={{ height: 58, background: "#fff", borderTop: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <button onClick={handleSave} style={{ padding: "10px 36px", background: "#111827", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
            Save Configuration
          </button>
        </div>
      </div>

      {/* ═══════════════ RIGHT PANEL – EDITOR ════════════════════════════ */}
      <div style={{ width: 300, borderLeft: "1px solid #e5e7eb", background: "#fff", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>{selQ ? "Question" : selL ? "Layer" : "Properties"}</span>
          {(selQ || selL) && (
            <button
              onClick={() => { if (selQ) removeQ(selQ.id); else if (selL) removeL(selL.id); }}
              style={{ marginLeft: "auto", background: "none", border: "1px solid #fca5a5", color: "#ef4444", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 12 }}
            >
              Remove
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {!selected && (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#9ca3af" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>👈</div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>Select a <strong>question</strong> or <strong>layer</strong> in the left panel to configure it here.</p>
            </div>
          )}

          {selQ && (selQ.type === "color" || selQ.type === "thumbnail") && (
            <SwatchEditor
              q={selQ as any}
              layers={layers}
              onChange={updateQ}
              previewValue={selectedSwatches[selQ.id]}
              onPreview={(value) => setSelectedSwatches((p) => ({ ...p, [selQ.id]: value }))}
            />
          )}
          {selQ && selQ.type === "text" && <TextEditor q={selQ as Question & { type: "text" }} onChange={updateQ} />}
          {selQ && selQ.type === "file" && <FileEditor q={selQ as Question & { type: "file" }} onChange={updateQ} />}
          {selQ && selQ.type === "dropdown" && <DropdownEditor q={selQ as DropdownQuestion} onChange={updateQ} />}
          {selQ && selQ.type === "radio" && <RadioEditor q={selQ as RadioQuestion} onChange={updateQ} />}
          {selQ && selQ.type === "checkbox" && <CheckboxEditor q={selQ as CheckboxQuestion} onChange={updateQ} />}
          {selQ && selQ.type === "label" && <LabelEditor q={selQ as LabelQuestion} onChange={updateQ} />}
          {selQ && selQ.type === "group" && <GroupEditorComp q={selQ as GroupQuestion} questions={questions} onChange={updateQ} />}
          {selL && <LayerEditorComp layer={selL} numViews={numViews} onChange={updateL} />}
        </div>
      </div>
    </div>
  );
}
