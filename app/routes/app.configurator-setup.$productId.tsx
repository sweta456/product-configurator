import { useLoaderData, useSubmit, useActionData, Link, useFetcher, useNavigate, useNavigation } from "react-router";
import { useState, useEffect, useMemo, useRef } from "react";
import { Stage, Layer as KonvaLayer, Text as KonvaText, Rect, Transformer, Group } from "react-konva";
import ProductLayer from "../components/ProductLayer";
import { ModernColorPicker } from "../components/ModernColorPicker";
import { GlbPartSetup } from "../components/GlbPartSetup";
import { ThreeViewer, type PartCustomization } from "../components/ThreeViewer";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import {
  type LayerConfig,
  type LayerAnswer,
  type Question,
  type ColorSwatch,
  type InputType,
  type ThumbnailQuestion,
  type TextQuestion,
  type DropdownQuestion,
  type DropdownOption,
  type RadioQuestion,
  type CheckboxQuestion,
  type LabelQuestion,
  type LabelAnswer,
  type GroupQuestion,
  type FileQuestion,
  type LogoAnswer,
  type PrintArea,
  type LogicRule,
  type LogicAction,
  type LogicOperator,
  type LogicEffect,
  getLayerSrc,
  migrateOptions,
  getQuestionAnswers,
  DISPLAY_TYPE_MAP,
  DISPLAY_TYPE_META,
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
          id title handle status
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
  const { admin, session } = await authenticate.admin(request);
  const decodedId = decodeURIComponent(params.productId);
  const formData = await request.formData();

  const intent = formData.get("intent") as string | null;

  if (intent === "updateProductStatus") {
    const newStatus = formData.get("status") as string;

    // Step 1 — set Shopify product status (ACTIVE / DRAFT)
    await admin.graphql(
      `mutation UpdateProductStatus($id: ID!, $status: ProductStatus!) {
        productUpdate(input: { id: $id, status: $status }) {
          product { id status }
          userErrors { field message }
        }
      }`,
      { variables: { id: decodedId, status: newStatus } },
    );

    // Step 2 — publish / unpublish on Online Store channel via publishablePublish.
    // Requires write_publications + read_publications scopes.
    const pubsResp = await admin.graphql(`
      query {
        publications(first: 20) {
          edges { node { id name } }
        }
      }
    `);
    const pubsData = await pubsResp.json();
    const onlineStorePub = (pubsData.data?.publications?.edges ?? []).find(
      (e: any) => (e.node.name as string).toLowerCase().includes("online store"),
    )?.node as { id: string } | undefined;

    if (!onlineStorePub) {
      const grantedScopes = session.scope ?? "(none)";
      const hasPubScope = grantedScopes.includes("write_publications");
      return {
        statusUpdated: true,
        status: newStatus,
        publishError: hasPubScope
          ? `Online Store publication not found in response. Raw: ${JSON.stringify(pubsData.data?.publications)}`
          : `Missing write_publications scope. Granted scopes: ${grantedScopes}. → Run 'shopify app deploy' then delete the session and reopen the app.`,
      };
    }

    const mutation = newStatus === "ACTIVE"
      ? `mutation Pub($id: ID!, $input: [PublicationInput!]!) {
          publishablePublish(id: $id, input: $input) {
            publishable { ... on Product { id } }
            userErrors { field message }
          }
        }`
      : `mutation Pub($id: ID!, $input: [PublicationInput!]!) {
          publishableUnpublish(id: $id, input: $input) {
            publishable { ... on Product { id } }
            userErrors { field message }
          }
        }`;

    const pubResp = await admin.graphql(mutation, {
      variables: { id: decodedId, input: [{ publicationId: onlineStorePub.id }] },
    });
    const pubData = await pubResp.json();
    const pubErrors = (pubData.data?.publishablePublish ?? pubData.data?.publishableUnpublish)?.userErrors ?? [];
    if (pubErrors.length > 0) {
      return { statusUpdated: true, status: newStatus, publishError: pubErrors[0].message };
    }

    return { statusUpdated: true, status: newStatus };
  }

  const layers = JSON.parse(formData.get("layers") as string);
  const questions = JSON.parse(formData.get("questions") as string);
  const logicRules = JSON.parse(formData.get("logicRules") as string ?? "[]");
  const productName = formData.get("productName") as string;
  const productImageUrl = formData.get("productImageUrl") as string;
  const productHandle = formData.get("productHandle") as string;
  const numViews = Number(formData.get("numViews") ?? 1);
  const viewNames = JSON.parse((formData.get("viewNames") as string) ?? "[]");
  const canvasW = Number(formData.get("canvasW") ?? 520);
  const canvasH = Number(formData.get("canvasH") ?? 520);
  const modelMode = formData.get("modelMode") === "true";
  const glbUrl = (formData.get("glbUrl") as string) || undefined;

  const shopResponse = await admin.graphql(`query { shop { myshopifyDomain } }`);
  const shopData = await shopResponse.json();
  const shop = shopData.data.shop.myshopifyDomain;

  await prisma.productConfig.upsert({
    where: { productId: decodedId },
    create: { productId: decodedId, productName, shop, layers, options: { questions, logicRules, productImageUrl, productHandle, numViews, viewNames, canvasW, canvasH, modelMode, glbUrl } },
    update: { productName, shop, layers, options: { questions, logicRules, productImageUrl, productHandle, numViews, viewNames, canvasW, canvasH, modelMode, glbUrl } },
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

const toolbarBtnSt: React.CSSProperties = {
  width: 28, height: 28, border: "1px solid transparent", borderRadius: 4,
  background: "transparent", cursor: "pointer", fontSize: 13, color: "#374151",
  display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0,
};

const toolbarDividerSt: React.CSSProperties = {
  width: 1, height: 20, background: "#e5e7eb", flexShrink: 0, margin: "0 4px",
};

// ─── Add Question Modal (2-step) ─────────────────────────────────────────────

const INPUT_TYPE_CONFIG: { type: InputType; label: string; bg: string; icon: string }[] = [
  { type: "thumbnail", label: "Thumbnail",   bg: "#0ea5e9", icon: "⊞" },
  { type: "dropdown",  label: "Dropdown",    bg: "#6366f1", icon: "▼" },
  { type: "radio",     label: "Radio button",bg: "#6366f1", icon: "◉" },
  { type: "label",     label: "Label",       bg: "#22c55e", icon: "⊟" },
  { type: "file",      label: "File upload", bg: "#ef4444", icon: "↑" },
  { type: "text",      label: "Text input",  bg: "#10b981", icon: "T" },
  { type: "checkbox",  label: "Checkbox",    bg: "#10b981", icon: "☑" },
  { type: "color",     label: "Color picker",bg: "#f59e0b", icon: "◎" },
  { type: "none",      label: "None",        bg: "#9ca3af", icon: "⊘" },
  { type: "group",     label: "Group",       bg: "#6b7280", icon: "◻" },
];

function AddQuestionModal({ onAdd, onClose }: {
  onAdd: (type: InputType, displayType: string) => void;
  onClose: () => void;
}) {
  const [selInput, setSelInput]   = useState<InputType | null>(null);
  const [selDisplay, setSelDisplay] = useState<string | null>(null);

  const displayOptions = selInput ? DISPLAY_TYPE_MAP[selInput] : [];
  // Single-option display types (only "none") — auto-select and skip step 2
  const skipStep2 = displayOptions.length === 1 && displayOptions[0] === "none";

  const handleInputSelect = (type: InputType) => {
    setSelInput(type);
    const opts = DISPLAY_TYPE_MAP[type];
    setSelDisplay(opts.length === 1 ? opts[0] : null);
  };

  const canCreate = selInput && (skipStep2 || selDisplay);

  const descMap: Record<string, string> = {
    thumbnail: "Create a multiple choice question where each answer is a product image",
    color:     "Create a color picker question linked to a layer",
    text:      "Let customers add custom text on the product",
    file:      "Let customers upload an image on the product",
    dropdown:  "Create a dropdown select option",
    radio:     "Create radio button options",
    checkbox:  "Create a yes/no toggle option",
    label:     "Add an informational label block",
    group:     "Group questions together under a folder",
    none:      "Add a static visual element with no customer input",
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#fff", borderRadius: 14, padding: 24, width: 500, maxWidth: "92vw", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>1. Select an input type</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6b7280", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7, marginBottom: 16 }}>
          {INPUT_TYPE_CONFIG.map(({ type, label, bg, icon }) => (
            <button key={type} onClick={() => handleInputSelect(type)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 11px", border: selInput === type ? `2px solid ${bg}` : "1px solid #e5e7eb", borderRadius: 8, background: selInput === type ? `${bg}14` : "#fff", cursor: "pointer", fontSize: 12, fontWeight: 500, textAlign: "left" }}>
              <span style={{ width: 26, height: 26, borderRadius: 6, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#fff", flexShrink: 0, fontWeight: 700 }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {/* Step 2 — display types (hidden when only "none" available) */}
        {selInput && !skipStep2 && (
          <>
            <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 14, marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>2. Select a display type</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7, marginBottom: 16 }}>
              {displayOptions.map((dt) => {
                const meta = DISPLAY_TYPE_META[dt] ?? { label: dt, icon: "?" };
                return (
                  <button key={dt} onClick={() => setSelDisplay(dt)}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 11px", border: selDisplay === dt ? "2px solid #0ea5e9" : "1px solid #e5e7eb", borderRadius: 8, background: selDisplay === dt ? "#e0f2fe" : "#fff", cursor: "pointer", fontSize: 12, fontWeight: 500, textAlign: "left" }}>
                    <span style={{ width: 26, height: 26, borderRadius: 6, background: selDisplay === dt ? "#0ea5e9" : "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: selDisplay === dt ? "#fff" : "#6b7280", flexShrink: 0, fontWeight: 700 }}>{meta.icon}</span>
                    <span>
                      {meta.label}
                      {meta.desc && <span style={{ display: "block", fontSize: 10, color: "#9ca3af", fontWeight: 400 }}>{meta.desc}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            {canCreate && selInput
              ? (selInput === "thumbnail" && selDisplay === "image"
                  ? "Create a multiple choice question where each answer is a product image"
                  : descMap[selInput] ?? "")
              : "Please select what you want to create"}
          </span>
          <button
            onClick={() => { if (canCreate && selInput) { onAdd(selInput, selDisplay ?? "none"); onClose(); } }}
            disabled={!canCreate}
            style={{ padding: "8px 22px", background: canCreate ? "#111827" : "#e5e7eb", color: canCreate ? "#fff" : "#9ca3af", border: "none", borderRadius: 6, cursor: canCreate ? "pointer" : "default", fontWeight: 600, fontSize: 13 }}>
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Layer Modal ─────────────────────────────────────────────────────────

const LAYER_DISPLAY_TYPES = Object.entries(DISPLAY_TYPE_META)
  .filter(([key]) => key !== "none")
  .map(([key, meta]) => ({ key, ...meta }));

const LAYER_DISPLAY_COLORS: Record<string, string> = {
  image:          "#3b82f6",
  color:          "#06b6d4",
  logo:           "#f59e0b",
  text:           "#f59e0b",
  font:           "#f59e0b",
  "font-size":    "#f59e0b",
  "text-color":   "#f59e0b",
  "text-outline": "#f59e0b",
};

function AddLayerModal({ onAdd, onClose }: {
  onAdd: (layerType: "static" | "colorable", displayType: string) => void;
  onClose: () => void;
}) {
  const [sel, setSel] = useState<string | null>(null);

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#fff", borderRadius: 14, padding: 24, width: 500, maxWidth: "92vw", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>Select a display type</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6b7280", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7, marginBottom: 16 }}>
          {LAYER_DISPLAY_TYPES.map(({ key, label, icon }) => {
            const bg = LAYER_DISPLAY_COLORS[key] ?? "#6b7280";
            return (
              <button key={key} onClick={() => setSel(key)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 11px", border: sel === key ? `2px solid ${bg}` : "1px solid #e5e7eb", borderRadius: 8, background: sel === key ? `${bg}14` : "#fff", cursor: "pointer", fontSize: 12, fontWeight: 500, textAlign: "left" }}>
                <span style={{ width: 26, height: 26, borderRadius: 6, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#fff", flexShrink: 0, fontWeight: 700 }}>{icon}</span>
                {label}
              </button>
            );
          })}
        </div>

        <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            {sel ? `Create a ${DISPLAY_TYPE_META[sel]?.label?.toLowerCase()} layer` : "Please select a display type"}
          </span>
          <button
            onClick={() => { if (sel) { onAdd(sel === "color" ? "colorable" : "static", sel); onClose(); } }}
            disabled={!sel}
            style={{ padding: "8px 22px", background: sel ? "#111827" : "#e5e7eb", color: sel ? "#fff" : "#9ca3af", border: "none", borderRadius: 6, cursor: sel ? "pointer" : "default", fontWeight: 600, fontSize: 13 }}>
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Left panel – Question row ────────────────────────────────────────────────

function getQuestionIcon(q: Question) {
  const dt = (q as any).displayType;
  if (q.type === "thumbnail" && dt === "image") return <span style={{ fontSize: 11, color: "#0ea5e9" }}>🏔</span>;
  if (q.type === "thumbnail" && dt === "color") return <span style={{ fontSize: 11, color: "#f59e0b" }}>💧</span>;
  switch (q.type) {
    case "color":     return <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: q.swatches?.[0]?.value ?? "#888", border: "1px solid rgba(0,0,0,0.1)", flexShrink: 0 }} />;
    case "thumbnail": return <span style={{ fontSize: 11, color: "#0ea5e9", fontWeight: 700 }}>⊞</span>;
    case "text":      return <span style={{ fontWeight: 800, fontSize: 12, color: "#10b981", lineHeight: 1 }}>T</span>;
    case "file":      return <span style={{ fontSize: 11, color: "#ef4444" }}>↑</span>;
    case "dropdown":  return <span style={{ fontSize: 10, color: "#6366f1" }}>▼</span>;
    case "radio":     return <span style={{ fontSize: 10, color: "#6366f1" }}>◉</span>;
    case "checkbox":  return <span style={{ fontSize: 10, color: "#10b981" }}>☑</span>;
    case "label":     return <span style={{ fontSize: 10, color: "#22c55e" }}>⊟</span>;
    case "group":     return <span style={{ fontSize: 11, color: "#6b7280" }}>📁</span>;
    case "none":      return <span style={{ fontSize: 11, color: "#9ca3af" }}>⊘</span>;
    default:          return <span style={{ fontSize: 10, color: "#9ca3af" }}>?</span>;
  }
}

function QuestionRow({ q, selected, layerName, onSelect, onDuplicate, onDelete, isDragging, isDragOver, onDragStart, onDragOver, onDrop, onDragEnd }: {
  q: Question; selected: boolean; layerName?: string;
  onSelect: () => void; onDuplicate: () => void; onDelete: () => void;
  isDragging?: boolean; isDragOver?: boolean;
  onDragStart?: () => void; onDragOver?: (e: React.DragEvent) => void; onDrop?: () => void; onDragEnd?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      style={{ position: "relative", opacity: isDragging ? 0.35 : 1 }}
      onMouseLeave={() => setMenuOpen(false)}
    >
      <div
        onClick={onSelect}
        style={{
          display: "flex", alignItems: "center", gap: 8, padding: "8px 10px 8px 10px", cursor: "pointer",
          background: isDragOver ? "#f0f9ff" : selected ? "#eff6ff" : "transparent",
          borderLeft: `3px solid ${isDragOver ? "#0ea5e9" : selected ? "#3b82f6" : "transparent"}`,
        }}
      >
        <span style={{ cursor: "grab", color: "#d1d5db", fontSize: 12, letterSpacing: 1, flexShrink: 0, userSelect: "none" }}>⠿</span>
        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 18, flexShrink: 0 }}>
          {getQuestionIcon(q)}
        </span>
        <span style={{ flex: 1, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.name}</span>
        {(q.type === "color" || q.type === "thumbnail") && layerName && (
          <span style={{ fontSize: 10, color: "#9ca3af", flexShrink: 0 }}>→ {layerName}</span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
          style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: "2px 4px", flexShrink: 0, borderRadius: 4 }}>
          ⋮
        </button>
      </div>
      {menuOpen && (
        <div style={{ position: "absolute", right: 8, top: "100%", zIndex: 50, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", minWidth: 160, overflow: "hidden" }}>
          <button onClick={(e) => { e.stopPropagation(); onDuplicate(); setMenuOpen(false); }}
            style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#374151" }}>
            Duplicate
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); setMenuOpen(false); }}
            style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#ef4444" }}>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Left panel – Group row ──────────────────────────────────────────────────

function GroupRow({ q, selected, expanded, onToggle, onSelect, onDelete, onAddChild, isDragging, isDragOver, onDragStart, onDragOver, onDrop, onDragEnd }: {
  q: GroupQuestion; selected: boolean; expanded: boolean;
  onToggle: () => void; onSelect: () => void; onDelete: () => void; onAddChild: () => void;
  isDragging?: boolean; isDragOver?: boolean;
  onDragStart?: () => void; onDragOver?: (e: React.DragEvent) => void; onDrop?: () => void; onDragEnd?: () => void;
}) {
  const [hovering, setHovering] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div
      draggable onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} onDragEnd={onDragEnd}
      style={{ opacity: isDragging ? 0.35 : 1, position: "relative" }}
      onMouseEnter={() => setHovering(true)} onMouseLeave={() => { setHovering(false); setMenuOpen(false); }}
    >
      <div onClick={onSelect} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", cursor: "pointer", background: isDragOver ? "#dbeafe" : selected ? "#eff6ff" : "transparent", borderLeft: `3px solid ${isDragOver ? "#2563eb" : selected ? "#3b82f6" : "transparent"}`, outline: isDragOver ? "1px dashed #93c5fd" : "none", outlineOffset: -1 }}>
        <button onClick={(e) => { e.stopPropagation(); onToggle(); }}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>
            <path d="M3.5 2l4 3.5-4 3.5" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span style={{ fontSize: 15, flexShrink: 0 }}>📁</span>
        <span style={{ flex: 1, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.name}</span>
        {isDragOver && <span style={{ fontSize: 10, color: "#2563eb", fontWeight: 600, flexShrink: 0 }}>↳ drop inside</span>}
        {hovering && !isDragOver && (
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ position: "relative" }}>
              <button onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
                style={{ width: 22, height: 22, background: "none", border: "1px solid #e5e7eb", borderRadius: 4, cursor: "pointer", fontSize: 13, color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center" }}>⋮</button>
              {menuOpen && (
                <div style={{ position: "absolute", right: 0, top: "100%", zIndex: 60, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.15)", minWidth: 160, overflow: "hidden", marginTop: 2 }}>
                  <div style={{ padding: "6px 12px 4px", fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>More actions</div>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#ef4444" }}>Delete</button>
                </div>
              )}
            </div>
            <button onClick={(e) => { e.stopPropagation(); onAddChild(); }}
              style={{ width: 22, height: 22, background: "#111827", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
          </div>
        )}
      </div>
      {menuOpen && <div style={{ position: "fixed", inset: 0, zIndex: 55 }} onClick={() => setMenuOpen(false)} />}
    </div>
  );
}

// ─── Left panel – Layer row ───────────────────────────────────────────────────

function LayerRow({ layer, selected, linkedNames, onSelect, onRemove, isDragging, isDragOver, onDragStart, onDragOver, onDrop, onDragEnd }: {
  layer: LayerConfig; selected: boolean;
  linkedNames?: string[];
  onSelect: () => void; onRemove: () => void;
  isDragging?: boolean; isDragOver?: boolean;
  onDragStart?: () => void; onDragOver?: (e: React.DragEvent) => void; onDrop?: () => void; onDragEnd?: () => void;
}) {
  const dt = layer.displayType;
  const dtMeta = dt ? DISPLAY_TYPE_META[dt] : null;
  const dtBg = dt ? (LAYER_DISPLAY_COLORS[dt] ?? "#6b7280") : "#d1d5db";

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      style={{ position: "relative", opacity: isDragging ? 0.35 : 1 }}
    >
      <div
        onClick={onSelect}
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 10px 7px 10px", cursor: "pointer", background: isDragOver ? "#f0f9ff" : selected ? "#eff6ff" : "transparent", borderLeft: `3px solid ${isDragOver ? "#0ea5e9" : selected ? "#3b82f6" : "transparent"}` }}
      >
        <span style={{ cursor: "grab", color: "#d1d5db", fontSize: 12, letterSpacing: 1, flexShrink: 0, userSelect: "none" }}>⠿</span>
        {dtMeta
          ? <span style={{ width: 18, height: 18, background: dtBg, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 700, flexShrink: 0 }}>{dtMeta.icon}</span>
          : <span style={{ display: "inline-block", width: 4, height: 18, borderRadius: 2, background: layer.type === "colorable" ? "#6366f1" : "#d1d5db", flexShrink: 0 }} />
        }
        <span style={{ flex: 1, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{layer.name}</span>
        {!dtMeta && (
          <span style={{ fontSize: 10, color: "#9ca3af", textTransform: "uppercase", flexShrink: 0 }}>
            {layer.type === "colorable" ? "color" : "static"}
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          style={{ background: "none", border: "none", color: "#d1d5db", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }}
        >
          ×
        </button>
      </div>
      {linkedNames && linkedNames.length > 0 && (
        <div style={{ paddingLeft: 36, paddingBottom: 4 }}>
          {linkedNames.map((n) => (
            <span key={n} style={{ fontSize: 11, color: "#9ca3af" }}>↳ {n}</span>
          ))}
        </div>
      )}
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

// ─── Per-slot image uploader (own fetcher per slot = no race conditions) ──────

function ImageUploadSlot({ currentUrl, label, onUploaded }: {
  currentUrl: string | null | undefined;
  label: string;
  onUploaded: (url: string | null) => void;
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

  // Extract readable info from the stored URL
  const getFileInfo = (url: string): { name: string; timeAgo: string } => {
    const filename = url.split("/").pop() ?? "image.png";
    const tsMatch = filename.match(/preview-(\d+)-/);
    if (tsMatch) {
      const ts = parseInt(tsMatch[1]);
      const diff = Date.now() - ts;
      const days = Math.floor(diff / 86_400_000);
      const hours = Math.floor(diff / 3_600_000);
      const mins = Math.floor(diff / 60_000);
      const timeAgo = days > 0 ? `${days} day${days > 1 ? "s" : ""} ago` : hours > 0 ? `${hours}h ago` : mins > 0 ? `${mins}m ago` : "Just now";
      return { name: filename, timeAgo };
    }
    return { name: filename, timeAgo: "Uploaded" };
  };

  return (
    <div style={{ marginBottom: 8 }}>
      <label style={{ fontSize: 11, color: "#6b7280", display: "block", marginBottom: 4, fontWeight: 600 }}>{label}</label>

      {currentUrl ? (
        /* ── Uploaded state: filename + date (Kickflip style) ── */
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#f9fafb" }}>
          <img
            src={currentUrl} alt=""
            style={{ width: 38, height: 38, objectFit: "contain", borderRadius: 4, border: "1px solid #e5e7eb", background: "#fff", flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
              {getFileInfo(currentUrl).name}
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>
              {getFileInfo(currentUrl).timeAgo}
            </div>
          </div>
          <label style={{ fontSize: 11, color: "#2563eb", cursor: uploading ? "wait" : "pointer", flexShrink: 0, whiteSpace: "nowrap" }}>
            Replace
            <input type="file" accept="image/*" style={{ display: "none" }} disabled={uploading} onChange={handleFile} />
          </label>
          <button
            onClick={() => onUploaded(null)}
            style={{ background: "none", border: "none", color: "#d1d5db", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0, flexShrink: 0 }}>
            ×
          </button>
        </div>
      ) : (
        /* ── Empty state: dashed drop zone ── */
        <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", border: "1.5px dashed #d1d5db", borderRadius: 6, cursor: uploading ? "wait" : "pointer", color: uploading ? "#9ca3af" : "#6b7280", fontSize: 12, background: "#fafafa", transition: "border-color 0.15s" }}>
          <span style={{ fontSize: 15, opacity: 0.6 }}>{uploading ? "⏳" : "↑"}</span>
          <span style={{ color: "#374151" }}>{uploading ? "Uploading…" : "Drop image, or "}</span>
          {!uploading && <span style={{ color: "#2563eb", fontWeight: 600, textDecoration: "underline" }}>browse</span>}
          <input type="file" accept="image/*" style={{ display: "none" }} disabled={uploading} onChange={handleFile} />
        </label>
      )}

      {fetcher.data?.error && (
        <p style={{ color: "#ef4444", fontSize: 11, margin: "3px 0 0" }}>{fetcher.data.error}</p>
      )}
    </div>
  );
}

// ─── Toggle row ───────────────────────────────────────────────────────────────

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0" }}>
      <span style={{ fontSize: 13, color: "#374151" }}>{label}</span>
      <div onClick={() => onChange(!checked)}
        style={{ width: 36, height: 20, borderRadius: 10, background: checked ? "#22c55e" : "#d1d5db", cursor: "pointer", position: "relative", transition: "background 0.15s", flexShrink: 0 }}>
        <div style={{ position: "absolute", top: 2, left: checked ? 16 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
      </div>
    </div>
  );
}

// ─── Answer detail panel (shown when an answer row is clicked) ─────────────────

function AnswerDetailPanel({ swatch, numViews, displayType, onDone, onChange }: {
  swatch: ColorSwatch; numViews: number; displayType: "image" | "color" | "none";
  onDone: () => void; onChange: (updated: ColorSwatch) => void;
}) {
  const setViewImage = (vi: number, url: string | null) => {
    const views = [...(swatch.viewImages ?? Array(numViews).fill(null))];
    views[vi] = url;
    onChange({ ...swatch, viewImages: views });
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid #e5e7eb" }}>
        <span style={{ fontSize: 15, color: "#9ca3af", letterSpacing: 3 }}>⠿</span>
        <button onClick={onDone}
          style={{ padding: "5px 18px", border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, background: "#fff", color: "#374151" }}>
          Done
        </button>
      </div>

      {/* Answer title */}
      <div style={{ padding: "12px 16px 8px" }}>
        <label style={labelSt}>Title</label>
        <input value={swatch.label} onChange={(e) => onChange({ ...swatch, label: e.target.value })} style={inputSt} />
      </div>

      {/* View images — for image display type */}
      {displayType === "image" && (
        <div style={{ padding: "4px 16px 4px" }}>
          {Array.from({ length: numViews }).map((_, vi) => (
            <div key={vi} style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>
                View {vi + 1}
              </label>
              <ImageUploadSlot label="" currentUrl={swatch.viewImages?.[vi] ?? null} onUploaded={(url) => setViewImage(vi, url)} />
            </div>
          ))}
        </div>
      )}

      {/* Color picker — for color display type */}
      {displayType === "color" && (
        <div style={{ padding: "4px 16px 12px" }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 10 }}>Color</label>
          <ModernColorPicker
            value={swatch.value.startsWith("#") ? swatch.value : "#FF0000"}
            onChange={(hex) => onChange({ ...swatch, value: hex })}
          />
        </div>
      )}

      {/* Lighting controls */}
      {displayType === "color" && (
        <div style={{ padding: "4px 16px 14px", borderTop: "1px solid #f3f4f6" }}>
          {/* Lighting toggle — defaults to ON */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>Lighting</span>
            <input
              type="checkbox"
              checked={swatch.lighting ?? true}
              onChange={(e) => onChange({ ...swatch, lighting: e.target.checked })}
              style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#2563eb" }}
            />
          </div>

          {/* Lighting brightness */}
          <div style={{ marginBottom: 12, opacity: swatch.lighting === false ? 0.45 : 1, transition: "opacity 0.15s" }}>
            <span style={{ fontSize: 13, color: "#374151", display: "block", marginBottom: 8 }}>Lighting brightness</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={swatch.lightingBrightness ?? 0.6}
                disabled={swatch.lighting === false}
                onChange={(e) => onChange({ ...swatch, lightingBrightness: Number(e.target.value) })}
                style={{ flex: 1, accentColor: "#2563eb", cursor: swatch.lighting === false ? "default" : "pointer" }}
              />
              <input
                type="number"
                min={0}
                max={1}
                step={0.1}
                value={swatch.lightingBrightness ?? 0.6}
                disabled={swatch.lighting === false}
                onChange={(e) => onChange({ ...swatch, lightingBrightness: Math.max(0, Math.min(1, Number(e.target.value))) })}
                style={{ width: 56, padding: "4px 6px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13, outline: "none", textAlign: "center" }}
              />
            </div>
          </div>

          {/* Lighting intensity */}
          <div style={{ marginBottom: 14, opacity: swatch.lighting === false ? 0.45 : 1, transition: "opacity 0.15s" }}>
            <span style={{ fontSize: 13, color: "#374151", display: "block", marginBottom: 8 }}>Lighting intensity</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={swatch.lightingIntensity ?? 30}
                disabled={swatch.lighting === false}
                onChange={(e) => onChange({ ...swatch, lightingIntensity: Number(e.target.value) })}
                style={{ flex: 1, accentColor: "#2563eb", cursor: swatch.lighting === false ? "default" : "pointer" }}
              />
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={swatch.lightingIntensity ?? 30}
                disabled={swatch.lighting === false}
                onChange={(e) => onChange({ ...swatch, lightingIntensity: Math.max(0, Math.min(100, Number(e.target.value))) })}
                style={{ width: 56, padding: "4px 6px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13, outline: "none", textAlign: "center" }}
              />
            </div>
          </div>

          {/* Reset to default */}
          <button
            onClick={() => onChange({ ...swatch, lighting: true, lightingBrightness: 0.6, lightingIntensity: 30 })}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 13, color: "#9ca3af" }}
          >
            Reset to default
          </button>
        </div>
      )}

      {/* Thumbnail (picker image) */}
      <div style={{ padding: "4px 16px 10px", borderTop: "1px solid #f3f4f6" }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>Thumbnail</label>
        <ImageUploadSlot label="" currentUrl={swatch.imageUrl ?? null} onUploaded={(url) => onChange({ ...swatch, imageUrl: url ?? undefined })} />
      </div>

      {/* Description */}
      <div style={{ borderTop: "1px solid #f3f4f6" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px" }}>
          <label style={{ fontSize: 13, color: "#374151" }}>Description</label>
          <input type="checkbox" checked={swatch.description !== undefined}
            onChange={(e) => onChange({ ...swatch, description: e.target.checked ? "" : undefined })}
            style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#22c55e" }} />
        </div>
        {swatch.description !== undefined && (
          <div style={{ padding: "0 16px 10px" }}>
            <input value={swatch.description} onChange={(e) => onChange({ ...swatch, description: e.target.value })}
              placeholder="Enter description…" style={inputSt} />
          </div>
        )}
      </div>

      {/* Production code */}
      <div style={{ borderTop: "1px solid #f3f4f6" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px" }}>
          <label style={{ fontSize: 13, color: "#374151" }}>Production code</label>
          <input type="checkbox" checked={swatch.productionCode !== undefined}
            onChange={(e) => onChange({ ...swatch, productionCode: e.target.checked ? "" : undefined })}
            style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#22c55e" }} />
        </div>
        {swatch.productionCode !== undefined && (
          <div style={{ padding: "0 16px 10px" }}>
            <input value={swatch.productionCode} onChange={(e) => onChange({ ...swatch, productionCode: e.target.value })}
              placeholder="Enter production code…" style={inputSt} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Thumbnail question editor ─────────────────────────────────────────────────

function ThumbnailEditor({ q, layers, questions, numViews, onChange, onEditAnswer, editingIdx, onSwitchType, onPreview }: {
  q: ThumbnailQuestion; layers: LayerConfig[]; questions: Question[];
  numViews: number; onChange: (updated: Question) => void;
  onEditAnswer: (idx: number) => void;
  editingIdx: number | null;
  onSwitchType?: (type: InputType) => void;
  onPreview?: (value: string) => void;
}) {
  const [answerMenu, setAnswerMenu] = useState<number | null>(null);
  const [showApplyPicker, setShowApplyPicker] = useState(false);
  const [applySearchColor, setApplySearchColor] = useState("");
  const [showInputTypePicker, setShowInputTypePicker] = useState(false);
  const [showDisplayTypePicker, setShowDisplayTypePicker] = useState(false);
  const displayType = (q.displayType ?? "image") as "image" | "color" | "none";

  const addAnswer = () => {
    const swatch: ColorSwatch = displayType === "color"
      ? { value: "#ff0000", label: "Untitled answer" }
      : { value: `ans-${Date.now()}`, label: "Untitled answer", viewImages: Array(numViews).fill(null) };
    const next = [...q.swatches, swatch];
    onChange({ ...q, swatches: next });
    onEditAnswer(next.length - 1);
  };

  const duplicateAnswer = (idx: number) => {
    const copy = { ...q.swatches[idx], value: `ans-${Date.now()}`, label: `${q.swatches[idx].label} (copy)` };
    onChange({ ...q, swatches: [...q.swatches.slice(0, idx + 1), copy, ...q.swatches.slice(idx + 1)] });
  };

  const removeAnswer = (idx: number) => onChange({ ...q, swatches: q.swatches.filter((_, i) => i !== idx) });

  const [dragAnswerIdx, setDragAnswerIdx] = useState<number | null>(null);
  const [dragOverAnswerIdx, setDragOverAnswerIdx] = useState<number | null>(null);

  const handleAnswerDragStart = (idx: number) => setDragAnswerIdx(idx);
  const handleAnswerDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverAnswerIdx(idx); };
  const handleAnswerDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    if (dragAnswerIdx === null || dragAnswerIdx === toIdx) { setDragAnswerIdx(null); setDragOverAnswerIdx(null); return; }
    const next = [...q.swatches];
    const [removed] = next.splice(dragAnswerIdx, 1);
    next.splice(toIdx, 0, removed);
    onChange({ ...q, swatches: next });
    setDragAnswerIdx(null);
    setDragOverAnswerIdx(null);
  };
  const handleAnswerDragEnd = () => { setDragAnswerIdx(null); setDragOverAnswerIdx(null); };

  const linkedIds = q.applyOn ?? [];
  const allImageItems = [
    ...questions.filter((oq) => oq.id !== q.id).map((oq) => ({ id: oq.id, name: oq.name })),
    ...layers.map((l) => ({ id: l.id, name: l.name })),
  ];

  const applyPickerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showApplyPicker) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (applyPickerRef.current && !applyPickerRef.current.contains(e.target as Node)) {
        setShowApplyPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showApplyPicker]);

  return (
    <div>
      {/* Title */}
      <div style={{ padding: "12px 16px 8px" }}>
        <label style={labelSt}>Title</label>
        <input value={q.name} onChange={(e) => onChange({ ...q, name: e.target.value })} style={inputSt} />
      </div>

      {/* Answers list */}
      <div style={{ padding: "8px 16px 12px", borderBottom: "1px solid #f3f4f6" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
            {displayType === "color" ? "Color answers" : "Image answers"}
          </span>
          <div style={{ display: "flex", gap: 5 }}>
            <button title="Library" style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 5, width: 28, height: 28, cursor: "pointer", fontSize: 13, color: "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center" }}>⊞</button>
            <button onClick={addAnswer} style={{ width: 28, height: 28, background: "#111827", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer", fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
          </div>
        </div>

        {q.swatches.length === 0 && (
          <div style={{ padding: "14px", border: "2px dashed #e5e7eb", borderRadius: 8, textAlign: "center" }}>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 8px" }}>No answers yet.</p>
            <button onClick={addAnswer} style={{ padding: "6px 14px", background: "#111827", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              + Add first answer
            </button>
          </div>
        )}

        {q.swatches.map((s, idx) => (
          <div
            key={`${s.value}-${idx}`}
            draggable
            onDragStart={() => handleAnswerDragStart(idx)}
            onDragOver={(e) => handleAnswerDragOver(e, idx)}
            onDrop={(e) => handleAnswerDrop(e, idx)}
            onDragEnd={handleAnswerDragEnd}
            style={{ position: "relative", marginBottom: 5, opacity: dragAnswerIdx === idx ? 0.35 : 1 }}
            onMouseLeave={() => setAnswerMenu(null)}
          >
            <div onClick={() => { onEditAnswer(idx); if (displayType === "color") onPreview?.(s.value); }} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
              border: `1px solid ${dragOverAnswerIdx === idx && dragAnswerIdx !== idx ? "#0ea5e9" : editingIdx === idx ? "#93c5fd" : "#e5e7eb"}`,
              borderRadius: 7, cursor: "pointer",
              background: dragOverAnswerIdx === idx && dragAnswerIdx !== idx ? "#f0f9ff" : editingIdx === idx ? "#eff6ff" : "#fafafa",
            }}>
              {/* Drag handle */}
              <span style={{ cursor: "grab", color: "#d1d5db", fontSize: 13, letterSpacing: 1, flexShrink: 0, userSelect: "none" }}>⠿</span>
              {displayType === "color"
                ? <span style={{ width: 22, height: 22, borderRadius: "50%", background: s.value || "#e5e7eb", border: "1px solid rgba(0,0,0,0.1)", flexShrink: 0, display: "inline-block" }} />
                : s.imageUrl
                  ? <img src={s.imageUrl} alt="" style={{ width: 22, height: 22, borderRadius: 4, objectFit: "cover", flexShrink: 0 }} />
                  : <span style={{ width: 22, height: 22, borderRadius: 4, background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#9ca3af", flexShrink: 0 }}>img</span>
              }
              <span style={{ flex: 1, fontSize: 13 }}>{s.label || "Untitled answer"}</span>
              <button onClick={(e) => { e.stopPropagation(); setAnswerMenu(answerMenu === idx ? null : idx); }}
                style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 16, padding: "0 2px", flexShrink: 0 }}>⋮</button>
              <span style={{ color: "#22c55e", fontSize: 14, flexShrink: 0 }}>✓</span>
            </div>
            {answerMenu === idx && (
              <div style={{ position: "absolute", right: 0, top: "100%", zIndex: 50, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", minWidth: 140, overflow: "hidden" }}>
                <button onClick={(e) => { e.stopPropagation(); duplicateAnswer(idx); setAnswerMenu(null); }}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#374151" }}>Duplicate</button>
                <button onClick={(e) => { e.stopPropagation(); removeAnswer(idx); setAnswerMenu(null); }}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#ef4444" }}>Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input type */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Input type</label>
        <div style={{ position: "relative", marginBottom: 10 }}>
          <button onClick={() => { setShowInputTypePicker((v) => !v); setShowDisplayTypePicker(false); }}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#f9fafb", width: "100%", cursor: "pointer", boxSizing: "border-box" }}>
            <span style={{ width: 22, height: 22, background: "#0ea5e9", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#fff", fontWeight: 700, flexShrink: 0 }}>⊞</span>
            <span style={{ flex: 1, fontSize: 13, color: "#374151", textAlign: "left" }}>Thumbnail</span>
            <span style={{ fontSize: 10, color: "#9ca3af" }}>▼</span>
          </button>
          {showInputTypePicker && (
            <div style={{ position: "absolute", left: 0, right: 0, top: "calc(100% + 2px)", zIndex: 60, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", maxHeight: 280, overflowY: "auto" }}>
              {INPUT_TYPE_CONFIG.map(({ type, label, bg, icon }) => (
                <button key={type} onClick={() => { if (type !== "thumbnail") onSwitchType?.(type); setShowInputTypePicker(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", border: "none", background: type === "thumbnail" ? "#eff6ff" : "none", cursor: "pointer", width: "100%", boxSizing: "border-box" }}>
                  <span style={{ width: 22, height: 22, background: bg, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 700, flexShrink: 0 }}>{icon}</span>
                  <span style={{ flex: 1, fontSize: 13, color: "#374151", textAlign: "left" }}>{label}</span>
                  {type === "thumbnail" && <span style={{ color: "#22c55e", fontSize: 12 }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        <ToggleRow label="Multiple selection" checked={q.multipleSelection ?? false} onChange={(v) => onChange({ ...q, multipleSelection: v })} />
        <ToggleRow label="Large thumbnail" checked={q.largeThumbnail ?? false} onChange={(v) => onChange({ ...q, largeThumbnail: v })} />
        <ToggleRow label="Show name label" checked={q.showNameLabel ?? false} onChange={(v) => onChange({ ...q, showNameLabel: v })} />
      </div>

      {/* Display type */}
      <div style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Display type</label>
          <span style={{ fontSize: 14, color: "#9ca3af" }}>⚙</span>
        </div>
        <div style={{ position: "relative", marginBottom: 10 }}>
          <button onClick={() => { setShowDisplayTypePicker((v) => !v); setShowInputTypePicker(false); }}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#f9fafb", width: "100%", cursor: "pointer", boxSizing: "border-box" }}>
            <span style={{ width: 22, height: 22, background: "#f3f4f6", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#6b7280", flexShrink: 0 }}>
              {DISPLAY_TYPE_META[displayType]?.icon ?? "?"}
            </span>
            <span style={{ flex: 1, fontSize: 13, color: "#374151", textAlign: "left" }}>{DISPLAY_TYPE_META[displayType]?.label ?? displayType}</span>
            <span style={{ fontSize: 10, color: "#9ca3af" }}>▼</span>
          </button>
          {showDisplayTypePicker && (
            <div style={{ position: "absolute", left: 0, right: 0, top: "calc(100% + 2px)", zIndex: 60, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", overflow: "hidden" }}>
              {(["image", "color", "none"] as const).map((dt) => {
                const meta = DISPLAY_TYPE_META[dt] ?? { label: dt, icon: "?" };
                return (
                  <button key={dt} onClick={() => { onChange({ ...q, displayType: dt }); setShowDisplayTypePicker(false); }}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", border: "none", background: dt === displayType ? "#eff6ff" : "none", cursor: "pointer", width: "100%", boxSizing: "border-box" }}>
                    <span style={{ width: 22, height: 22, background: "#f3f4f6", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#374151", flexShrink: 0 }}>{meta.icon}</span>
                    <span style={{ flex: 1, fontSize: 13, color: "#374151", textAlign: "left" }}>
                      {meta.label}
                      {meta.desc && <span style={{ display: "block", fontSize: 10, color: "#9ca3af" }}>{meta.desc}</span>}
                    </span>
                    {dt === displayType && <span style={{ color: "#22c55e", fontSize: 12 }}>✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Apply on — visible only for color display type */}
        {displayType === "color" && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: "#9ca3af" }}>↳</span>
              <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>Apply on</span>
              <div ref={applyPickerRef} style={{ marginLeft: "auto", position: "relative" }}>
                <button onClick={() => { setShowApplyPicker((v) => !v); setApplySearchColor(""); }}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer", fontSize: 12, background: showApplyPicker ? "#eff6ff" : "#f9fafb", color: "#374151" }}>
                  <span>🏔</span><span>Image question</span><span style={{ fontWeight: 700 }}>+</span>
                </button>
                {showApplyPicker && (
                  <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 50, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", minWidth: 200, padding: "8px 8px 6px" }}>
                    <input
                      autoFocus
                      value={applySearchColor}
                      onChange={(e) => setApplySearchColor(e.target.value)}
                      placeholder="Search..."
                      style={{ width: "100%", padding: "5px 8px", fontSize: 12, border: "1px solid #e5e7eb", borderRadius: 5, marginBottom: 6, boxSizing: "border-box", outline: "none" }}
                    />
                    <div style={{ maxHeight: 180, overflowY: "auto" }}>
                      {allImageItems
                        .filter((item) => !linkedIds.includes(item.id) && item.name.toLowerCase().includes(applySearchColor.toLowerCase()))
                        .map((item) => (
                          <button key={item.id} onClick={() => { onChange({ ...q, applyOn: [...linkedIds, item.id] }); setShowApplyPicker(false); setApplySearchColor(""); }}
                            style={{ display: "block", width: "100%", textAlign: "left", padding: "7px 10px", border: "none", borderRadius: 5, background: "none", cursor: "pointer", fontSize: 13, color: "#374151" }}>
                            {item.name}
                          </button>
                        ))}
                      {allImageItems.filter((item) => !linkedIds.includes(item.id) && item.name.toLowerCase().includes(applySearchColor.toLowerCase())).length === 0 && (
                        <p style={{ padding: "6px 10px", fontSize: 12, color: "#9ca3af", margin: 0 }}>No matches.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {linkedIds.map((lid) => {
              const linkedQ = questions.find((oq) => oq.id === lid);
              const linkedL = !linkedQ ? layers.find((l) => l.id === lid) : null;
              const linkedName = (linkedQ || linkedL)?.name;
              if (!linkedName) return null;
              return (
                <div key={lid} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "#f9fafb", borderRadius: 6, border: "1px solid #e5e7eb", marginBottom: 4 }}>
                  <span style={{ fontSize: 13 }}>🏔</span>
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{linkedName}</span>
                  <button onClick={() => onChange({ ...q, applyOn: linkedIds.filter((id) => id !== lid) })}
                    style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 16, padding: 0, lineHeight: 1, flexShrink: 0 }}>×</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Color/Thumbnail shared swatch editor ─────────────────────────────────────

// NOTE: SwatchEditor is kept for the pure color question type only.
// All thumbnail questions now use ImageAnswerEditor above.

// ─── Color question swatch editor ─────────────────────────────────────────────
// Thumbnail questions now use ImageAnswerEditor above instead.

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

      {q.type === "color" && (q as any).displayType !== "none" && (q as any).displayType !== "text-color" && (
        <>
          <label style={labelSt}>Linked Layer</label>
          <select value={q.linkedLayerId ?? ""} onChange={(e) => onChange({ ...q, linkedLayerId: e.target.value })} style={inputSt}>
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
      <div style={{ marginBottom: 10 }}>
        <ModernColorPicker value={newColor} onChange={(hex) => setNewColor(hex)} />
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: newColor, border: "1.5px solid rgba(0,0,0,0.15)", flexShrink: 0, alignSelf: "center" }} />
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

const TEXT_CREATE_OPTIONS = [
  { key: "color",     label: "Color question",     icon: "A", bg: "#f59e0b" },
  { key: "font",      label: "Font question",       icon: "F", bg: "#f59e0b" },
  { key: "font-size", label: "Font size question",  icon: "↕", bg: "#f59e0b" },
  { key: "outline",   label: "Outline question",    icon: "Ā", bg: "#f59e0b" },
] as const;

function TextEditor({ q, layers, onChange, onSwitchType, onCreateSubQuestion, onEditPrintArea }: {
  q: TextQuestion;
  layers: LayerConfig[];
  onChange: (updated: Question) => void;
  onSwitchType?: (type: InputType) => void;
  onCreateSubQuestion?: (subType: string, parentId: string) => void;
  onEditPrintArea?: () => void;
}) {
  const [showInputTypePicker, setShowInputTypePicker] = useState(false);
  const [showDisplayTypePicker, setShowDisplayTypePicker] = useState(false);

  const displayType = q.displayType ?? "text";
  const displayMeta = DISPLAY_TYPE_META[displayType] ?? { label: "Text", icon: "T" };
  const printArea = q.printArea;

  return (
    <div>
      {/* Title */}
      <div style={{ padding: "12px 16px 8px", borderBottom: "1px solid #f3f4f6" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ width: 22, height: 22, background: "#10b981", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 700, flexShrink: 0 }}>T</span>
          <input
            value={q.name}
            onChange={(e) => onChange({ ...q, name: e.target.value })}
            placeholder="Title"
            style={{ flex: 1, border: "none", outline: "none", fontSize: 14, fontWeight: 500, color: "#111827", background: "transparent" }}
          />
        </div>
        <div style={{ paddingLeft: 30 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 4 }}>Placeholder</label>
          <input
            value={q.defaultText}
            onChange={(e) => onChange({ ...q, defaultText: e.target.value })}
            placeholder="Your text"
            style={inputSt}
          />
        </div>
      </div>

      {/* Input type */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Input type</span>
          <span style={{ fontSize: 13, color: "#9ca3af" }}>⚙</span>
        </div>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => { setShowInputTypePicker((v) => !v); setShowDisplayTypePicker(false); }}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#f9fafb", width: "100%", cursor: "pointer", boxSizing: "border-box" }}
          >
            <span style={{ width: 22, height: 22, background: "#10b981", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 700, flexShrink: 0 }}>T</span>
            <span style={{ flex: 1, fontSize: 13, color: "#374151", textAlign: "left" }}>Text input</span>
            <span style={{ fontSize: 10, color: "#9ca3af" }}>▼</span>
          </button>
          {showInputTypePicker && (
            <div style={{ position: "absolute", left: 0, right: 0, top: "calc(100% + 2px)", zIndex: 60, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", maxHeight: 280, overflowY: "auto" }}>
              {INPUT_TYPE_CONFIG.map(({ type, label, bg, icon }) => (
                <button key={type} onClick={() => { if (type !== "text") onSwitchType?.(type); setShowInputTypePicker(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", border: "none", background: type === "text" ? "#eff6ff" : "none", cursor: "pointer", width: "100%", boxSizing: "border-box" }}>
                  <span style={{ width: 22, height: 22, background: bg, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 700, flexShrink: 0 }}>{icon}</span>
                  <span style={{ flex: 1, fontSize: 13, color: "#374151", textAlign: "left" }}>{label}</span>
                  {type === "text" && <span style={{ color: "#22c55e", fontSize: 12 }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Display type — only shown when displayType === "text" */}
      {displayType === "text" && (
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Display type</span>
            <span style={{ fontSize: 13, color: "#9ca3af" }}>⚙</span>
          </div>
          <div style={{ position: "relative", marginBottom: 12 }}>
            <button
              onClick={() => { setShowDisplayTypePicker((v) => !v); setShowInputTypePicker(false); }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#f9fafb", width: "100%", cursor: "pointer", boxSizing: "border-box" }}
            >
              <span style={{ width: 22, height: 22, background: "#f59e0b", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 700, flexShrink: 0 }}>{displayMeta.icon}</span>
              <span style={{ flex: 1, fontSize: 13, color: "#374151", textAlign: "left" }}>{displayMeta.label}</span>
              <span style={{ fontSize: 10, color: "#9ca3af" }}>▼</span>
            </button>
            {showDisplayTypePicker && (
              <div style={{ position: "absolute", left: 0, right: 0, top: "calc(100% + 2px)", zIndex: 60, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", overflow: "hidden" }}>
                {DISPLAY_TYPE_MAP["text"].map((dt) => {
                  const meta = DISPLAY_TYPE_META[dt] ?? { label: dt, icon: "?" };
                  return (
                    <button key={dt} onClick={() => { onChange({ ...q, displayType: dt as "none" | "text" }); setShowDisplayTypePicker(false); }}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", border: "none", background: dt === displayType ? "#eff6ff" : "none", cursor: "pointer", width: "100%", boxSizing: "border-box" }}>
                      <span style={{ width: 22, height: 22, background: "#f3f4f6", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#374151", flexShrink: 0 }}>{meta.icon}</span>
                      <span style={{ flex: 1, fontSize: 13, color: "#374151", textAlign: "left" }}>
                        {meta.label}
                        {meta.desc && <span style={{ display: "block", fontSize: 10, color: "#9ca3af" }}>{meta.desc}</span>}
                      </span>
                      {dt === displayType && <span style={{ color: "#22c55e", fontSize: 12 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Apply on – Print area */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: printArea ? 8 : 0 }}>
            <span style={{ fontSize: 13, color: "#9ca3af" }}>↳</span>
            <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>Apply on</span>
            {!printArea && (
              <button
                onClick={() => {
                  const id = `pa-${Date.now()}`;
                  const newPA: PrintArea = {
                    id, name: `Print area 1`,
                    customerEditingView: 1, dpi: 300, units: "px",
                    width: 200, height: 80, bleedArea: 0,
                    showQualityIndicator: false, safeAreaWidth: 0, safeAreaHeight: 0,
                    outlineColor: "#3b82f6", showOutline: true,
                    visibleViews: [1], x: q.position.x, y: q.position.y,
                  };
                  onChange({ ...q, printArea: newPA });
                  onEditPrintArea?.();
                }}
                style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer", fontSize: 12, background: "#f9fafb", color: "#374151" }}
              >
                <span>🖨</span><span>Print area</span><span style={{ fontWeight: 700 }}>+</span>
              </button>
            )}
          </div>
          {printArea && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "#f9fafb", borderRadius: 6, border: "1px solid #e5e7eb" }}>
              <span style={{ fontSize: 13 }}>🖨</span>
              <span onClick={() => onEditPrintArea?.()} style={{ flex: 1, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>{printArea.name}</span>
              <button onClick={() => onChange({ ...q, printArea: undefined })}
                style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
            </div>
          )}
        </div>
      )}

      {/* Text settings — font, color, size, rotation (shown before transforms so Rotation ° is always visible) */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 10 }}>Text settings</span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <div>
            <label style={labelSt}>Font size</label>
            <input type="number" value={q.defaultFontSize} onChange={(e) => onChange({ ...q, defaultFontSize: Number(e.target.value) })} style={inputSt} />
          </div>
          <div>
            <label style={labelSt}>Rotation °</label>
            <input type="number" value={q.rotation ?? 0} onChange={(e) => onChange({ ...q, rotation: Number(e.target.value) })} style={inputSt} />
          </div>
        </div>
        <label style={labelSt}>Font family</label>
        <select value={q.defaultFontFamily} onChange={(e) => onChange({ ...q, defaultFontFamily: e.target.value })} style={{ ...inputSt, marginBottom: 8 }}>
          {["Arial", "Georgia", "Impact", "Verdana", "Courier New", "Times New Roman"].map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <label style={labelSt}>Color</label>
        <div style={{ marginBottom: 8 }}>
          <ModernColorPicker value={q.defaultColor || "#000000"} onChange={(hex) => onChange({ ...q, defaultColor: hex })} />
        </div>
      </div>

      {/* Allowed transforms — shown when print area is set */}
      {displayType === "text" && printArea && (
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
          <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 8 }}>Select allowed transforms</span>
          {(["move", "resize", "rotate"] as const).map((key) => {
            const icons: Record<string, string> = { move: "✥", resize: "↔", rotate: "↻" };
            const labels: Record<string, string> = { move: "Move", resize: "Resize", rotate: "Rotate" };
            const transforms = q.allowedTransforms ?? { move: false, resize: false, rotate: false };
            const isOn = transforms[key];
            return (
              <div key={key} style={{ display: "flex", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f9fafb" }}>
                <span style={{ fontSize: 14, marginRight: 8, color: "#9ca3af" }}>{icons[key]}</span>
                <span style={{ flex: 1, fontSize: 13, color: "#374151" }}>{labels[key]}</span>
                <button
                  onClick={() => onChange({ ...q, allowedTransforms: { ...(q.allowedTransforms ?? { move: false, resize: false, rotate: false }), [key]: !isOn } })}
                  style={{ width: 36, height: 20, borderRadius: 10, background: isOn ? "#111827" : "#d1d5db", border: "none", cursor: "pointer", position: "relative", flexShrink: 0 }}
                >
                  <span style={{ position: "absolute", top: 2, left: isOn ? 18 : 2, width: 16, height: 16, borderRadius: 8, background: "#fff", transition: "left 0.12s" }} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Create sub-questions */}
      {displayType === "text" && (
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Create</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {TEXT_CREATE_OPTIONS.map(({ key, label, icon, bg }) => (
              <button
                key={key}
                onClick={() => onCreateSubQuestion?.(key, q.id)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fafafa", cursor: "pointer", width: "100%", boxSizing: "border-box" }}
              >
                <span style={{ width: 22, height: 22, background: bg, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 700, flexShrink: 0 }}>{icon}</span>
                <span style={{ flex: 1, fontSize: 13, color: "#374151", textAlign: "left" }}>{label}</span>
                <span style={{ fontSize: 15, color: "#9ca3af", fontWeight: 700 }}>+</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Position + max chars */}
      <div style={{ padding: "12px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <div>
            <label style={labelSt}>Position X</label>
            <input type="number" value={q.position.x} onChange={(e) => onChange({ ...q, position: { ...q.position, x: Number(e.target.value) } })} style={inputSt} />
          </div>
          <div>
            <label style={labelSt}>Position Y</label>
            <input type="number" value={q.position.y} onChange={(e) => onChange({ ...q, position: { ...q.position, y: Number(e.target.value) } })} style={inputSt} />
          </div>
        </div>
        <label style={labelSt}>Max characters</label>
        <input
          type="number"
          min={1}
          max={500}
          value={q.maxChars ?? 15}
          onChange={(e) => onChange({ ...q, maxChars: Math.max(1, Number(e.target.value)) })}
          style={inputSt}
        />
      </div>
    </div>
  );
}

// ─── Logo answer detail panel ─────────────────────────────────────────────────

function LogoAnswerDetailPanel({ answer, onDone, onChange }: {
  answer: LogoAnswer;
  onDone: () => void;
  onChange: (updated: LogoAnswer) => void;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid #e5e7eb" }}>
        <span style={{ fontSize: 15, color: "#9ca3af", letterSpacing: 3 }}>⠿</span>
        <button onClick={onDone}
          style={{ padding: "5px 18px", border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, background: "#fff", color: "#374151" }}>
          Done
        </button>
      </div>
      <div style={{ padding: "12px 16px 8px" }}>
        <label style={labelSt}>Title</label>
        <input value={answer.label} onChange={(e) => onChange({ ...answer, label: e.target.value })} style={inputSt} autoFocus />
      </div>
      <div style={{ padding: "4px 16px 10px", borderTop: "1px solid #f3f4f6" }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>Image</label>
        <ImageUploadSlot label="" currentUrl={answer.imageUrl ?? null} onUploaded={(url) => onChange({ ...answer, imageUrl: url ?? undefined })} />
      </div>
      <div style={{ padding: "4px 16px 10px", borderTop: "1px solid #f3f4f6" }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>Thumbnail</label>
        <ImageUploadSlot label="" currentUrl={answer.thumbnailUrl ?? null} onUploaded={(url) => onChange({ ...answer, thumbnailUrl: url ?? undefined })} />
      </div>
      <div style={{ borderTop: "1px solid #f3f4f6" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px" }}>
          <label style={{ fontSize: 13, color: "#374151" }}>Description</label>
          <input type="checkbox" checked={answer.description !== undefined}
            onChange={(e) => onChange({ ...answer, description: e.target.checked ? "" : undefined })}
            style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#22c55e" }} />
        </div>
        {answer.description !== undefined && (
          <div style={{ padding: "0 16px 10px" }}>
            <input value={answer.description} onChange={(e) => onChange({ ...answer, description: e.target.value })}
              placeholder="Enter description…" style={inputSt} />
          </div>
        )}
      </div>
      <div style={{ borderTop: "1px solid #f3f4f6" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px" }}>
          <label style={{ fontSize: 13, color: "#374151" }}>Production code</label>
          <input type="checkbox" checked={answer.productionCode !== undefined}
            onChange={(e) => onChange({ ...answer, productionCode: e.target.checked ? "" : undefined })}
            style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#22c55e" }} />
        </div>
        {answer.productionCode !== undefined && (
          <div style={{ padding: "0 16px 10px" }}>
            <input value={answer.productionCode} onChange={(e) => onChange({ ...answer, productionCode: e.target.value })}
              placeholder="Enter production code…" style={inputSt} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── File question editor ─────────────────────────────────────────────────────

function FileEditor({ q, onChange, onSwitchType, onEditPrintArea }: {
  q: FileQuestion;
  onChange: (updated: Question) => void;
  onSwitchType: (type: InputType) => void;
  onEditPrintArea: (paId: string) => void;
}) {
  const [showInputDD, setShowInputDD] = useState(false);
  const [showDisplayDD, setShowDisplayDD] = useState(false);
  const [showPAPicker, setShowPAPicker] = useState(false);
  const [paSearch, setPaSearch] = useState("");
  const [editingAnswerIdx, setEditingAnswerIdx] = useState<number | null>(null);
  const [answerMenu, setAnswerMenu] = useState<number | null>(null);

  const displayType = q.displayType ?? "none";
  const dtMeta = DISPLAY_TYPE_META[displayType] ?? DISPLAY_TYPE_META.none;
  const dtList = DISPLAY_TYPE_MAP["file"];
  const printAreas = q.printAreas ?? [];
  const transforms = q.allowedTransforms ?? { move: true, resize: true, rotate: false };
  const fileTypeMeta = INPUT_TYPE_CONFIG.find((c) => c.type === "file")!;
  const logoAnswers = q.answers ?? [];

  const addLogoAnswer = () => {
    const newAns: LogoAnswer = { id: `logo-${Date.now()}`, label: "Untitled answer" };
    const next = [...logoAnswers, newAns];
    onChange({ ...q, answers: next });
    setEditingAnswerIdx(next.length - 1);
  };

  const updateLogoAnswer = (idx: number, updated: LogoAnswer) => {
    onChange({ ...q, answers: logoAnswers.map((a, i) => i === idx ? updated : a) });
  };

  const removeLogoAnswer = (idx: number) => {
    onChange({ ...q, answers: logoAnswers.filter((_, i) => i !== idx) });
    if (editingAnswerIdx === idx) setEditingAnswerIdx(null);
  };

  if (editingAnswerIdx !== null && logoAnswers[editingAnswerIdx]) {
    return (
      <LogoAnswerDetailPanel
        answer={logoAnswers[editingAnswerIdx]}
        onDone={() => setEditingAnswerIdx(null)}
        onChange={(updated) => updateLogoAnswer(editingAnswerIdx, updated)}
      />
    );
  }

  const addPA = () => {
    const id = `pa-${Date.now()}`;
    const newPA: PrintArea = {
      id, name: `Print area ${printAreas.length + 1}`,
      customerEditingView: 1, dpi: 300, units: "in",
      width: 12, height: 16, bleedArea: 0,
      showQualityIndicator: true,
      safeAreaWidth: 0, safeAreaHeight: 0,
      outlineColor: "#000000", showOutline: true,
      visibleViews: [1], x: 100, y: 100,
    };
    onChange({ ...q, printAreas: [...printAreas, newPA] });
    setShowPAPicker(false);
    onEditPrintArea(id);
  };

  return (
    <div>
      {/* Title */}
      <div style={{ padding: "12px 16px 8px" }}>
        <label style={labelSt}>Title</label>
        <input value={q.name} onChange={(e) => onChange({ ...q, name: e.target.value })} style={inputSt} />
      </div>

      {/* Logo answers (only when displayType === "logo") */}
      {displayType === "logo" && (
        <div style={{ padding: "8px 16px 12px", borderBottom: "1px solid #f3f4f6" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Logo answers</span>
            <div style={{ display: "flex", gap: 5 }}>
              <button title="Library" style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 5, width: 28, height: 28, cursor: "pointer", fontSize: 13, color: "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center" }}>⊞</button>
              <button onClick={addLogoAnswer} style={{ width: 28, height: 28, background: "#111827", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer", fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
            </div>
          </div>

          {logoAnswers.length === 0 && (
            <div style={{ padding: "14px", border: "2px dashed #e5e7eb", borderRadius: 8, textAlign: "center" }}>
              <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 8px" }}>No answers yet.</p>
              <button onClick={addLogoAnswer} style={{ padding: "6px 14px", background: "#111827", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>+ Add first answer</button>
            </div>
          )}

          {logoAnswers.map((ans, idx) => (
            <div key={ans.id} style={{ position: "relative", marginBottom: 5 }} onMouseLeave={() => setAnswerMenu(null)}>
              <div
                onClick={() => setEditingAnswerIdx(idx)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", border: `1px solid ${editingAnswerIdx === idx ? "#93c5fd" : "#e5e7eb"}`, borderRadius: 7, cursor: "pointer", background: editingAnswerIdx === idx ? "#eff6ff" : "#fafafa" }}
              >
                <span style={{ cursor: "grab", color: "#d1d5db", fontSize: 11, userSelect: "none" }}>⠿</span>
                {ans.thumbnailUrl || ans.imageUrl
                  ? <img src={ans.thumbnailUrl ?? ans.imageUrl} alt={ans.label} style={{ width: 28, height: 28, borderRadius: 4, objectFit: "cover", border: "1px solid #e5e7eb", flexShrink: 0 }} />
                  : <span style={{ width: 28, height: 28, borderRadius: 4, background: "#f3f4f6", border: "1px dashed #d1d5db", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#9ca3af", flexShrink: 0 }}>⭐</span>
                }
                <span style={{ flex: 1, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ans.label || "Untitled answer"}</span>
                <button onClick={(e) => { e.stopPropagation(); setAnswerMenu(answerMenu === idx ? null : idx); }}
                  style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 16, padding: "0 2px", flexShrink: 0 }}>⋮</button>
                <span style={{ color: "#22c55e", fontSize: 14, flexShrink: 0 }}>✓</span>
              </div>
              {answerMenu === idx && (
                <div style={{ position: "absolute", right: 8, top: "100%", zIndex: 50, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", minWidth: 140, overflow: "hidden" }}>
                  <button onClick={(e) => { e.stopPropagation(); setEditingAnswerIdx(idx); setAnswerMenu(null); }}
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#374151" }}>Edit</button>
                  <button onClick={(e) => { e.stopPropagation(); removeLogoAnswer(idx); setAnswerMenu(null); }}
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#ef4444" }}>Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Input type */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Input type</label>
        <div style={{ position: "relative" }}>
          <button onClick={() => { setShowInputDD((v) => !v); setShowDisplayDD(false); }}
            style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#f9fafb", cursor: "pointer", fontSize: 13, boxSizing: "border-box" }}>
            <span style={{ width: 22, height: 22, background: fileTypeMeta.bg, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 700, flexShrink: 0 }}>{fileTypeMeta.icon}</span>
            <span style={{ flex: 1, textAlign: "left", color: "#374151" }}>File uploader</span>
            <span style={{ fontSize: 10, color: "#9ca3af" }}>▼</span>
          </button>
          {showInputDD && (
            <div style={{ position: "absolute", left: 0, right: 0, top: "calc(100% + 2px)", zIndex: 60, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", maxHeight: 280, overflowY: "auto" }}>
              {INPUT_TYPE_CONFIG.map(({ type, label, bg, icon }) => (
                <button key={type} onClick={() => { if (type !== "file") onSwitchType(type); setShowInputDD(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 14px", border: "none", background: type === "file" ? "#eff6ff" : "none", cursor: "pointer", fontSize: 13, color: "#374151", boxSizing: "border-box" }}>
                  <span style={{ width: 22, height: 22, background: bg, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 700, flexShrink: 0 }}>{icon}</span>
                  <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
                  {type === "file" && <span style={{ color: "#22c55e", fontSize: 12 }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Display type */}
      <div style={{ padding: "12px 16px", borderBottom: displayType === "logo" ? "1px solid #f3f4f6" : "none" }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Display type</label>
        <div style={{ position: "relative" }}>
          <button onClick={() => { setShowDisplayDD((v) => !v); setShowInputDD(false); }}
            style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#f9fafb", cursor: "pointer", fontSize: 13, boxSizing: "border-box" }}>
            <span style={{ width: 22, height: 22, background: "#f3f4f6", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#374151", flexShrink: 0 }}>{dtMeta.icon}</span>
            <span style={{ flex: 1, textAlign: "left", color: "#374151" }}>{dtMeta.label}</span>
            <span style={{ fontSize: 10, color: "#9ca3af" }}>▼</span>
          </button>
          {showDisplayDD && (
            <div style={{ position: "absolute", left: 0, right: 0, top: "calc(100% + 2px)", zIndex: 60, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", overflow: "hidden" }}>
              {dtList.map((dt) => {
                const meta = DISPLAY_TYPE_META[dt] ?? { label: dt, icon: "?" };
                return (
                  <button key={dt} onClick={() => { onChange({ ...q, displayType: dt } as any); setShowDisplayDD(false); }}
                    style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 14px", border: "none", background: dt === displayType ? "#eff6ff" : "none", cursor: "pointer", fontSize: 13, color: "#374151", boxSizing: "border-box" }}>
                    <span style={{ width: 22, height: 22, background: "#f3f4f6", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#374151", flexShrink: 0 }}>{meta.icon}</span>
                    <span style={{ flex: 1, textAlign: "left" }}>
                      {meta.label}
                      {meta.desc && <span style={{ display: "block", fontSize: 10, color: "#9ca3af", fontWeight: 400 }}>{meta.desc}</span>}
                    </span>
                    {dt === displayType && <span style={{ color: "#22c55e", fontSize: 12 }}>✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Apply on + Transforms — only when displayType === "logo" */}
      {displayType === "logo" && (
        <>
          {/* Apply on print areas */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: "#9ca3af" }}>↳</span>
              <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>Apply on</span>
              <button onClick={() => { setShowPAPicker((v) => !v); setPaSearch(""); }}
                style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer", fontSize: 12, background: showPAPicker ? "#eff6ff" : "#f9fafb", color: "#374151" }}>
                <span>🖨</span><span>Print area</span><span style={{ fontWeight: 700 }}>+</span>
              </button>
            </div>

            {showPAPicker && (
              <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", marginTop: 8 }}>
                <button onClick={addPA}
                  style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13, color: "#374151", marginBottom: 8, boxSizing: "border-box" }}>
                  <span style={{ width: 22, height: 22, background: "#6b7280", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 700, flexShrink: 0 }}>🖨</span>
                  <span>Add print area</span>
                  <span style={{ marginLeft: "auto", fontWeight: 700, fontSize: 16 }}>+</span>
                </button>
                {printAreas.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", margin: "8px 0", borderTop: "1px solid #e5e7eb", paddingTop: 8 }}>or</div>
                    <input value={paSearch} onChange={(e) => setPaSearch(e.target.value)} placeholder="Search print areas…"
                      style={{ ...inputSt, marginBottom: 6, fontSize: 12 }} />
                    {printAreas.filter((pa) => pa.name.toLowerCase().includes(paSearch.toLowerCase())).map((pa) => (
                      <button key={pa.id} onClick={() => { onEditPrintArea(pa.id); setShowPAPicker(false); }}
                        style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "6px 8px", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#374151", borderRadius: 5 }}>
                        <span style={{ fontSize: 12 }}>🖨</span>
                        <span style={{ flex: 1, textAlign: "left" }}>{pa.name}</span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}

            {printAreas.map((pa) => (
              <div key={pa.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "#f9fafb", borderRadius: 6, border: "1px solid #e5e7eb", marginTop: 4 }}>
                <span style={{ fontSize: 12 }}>🖨</span>
                <span onClick={() => onEditPrintArea(pa.id)} style={{ flex: 1, fontSize: 12, fontWeight: 500, cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pa.name}</span>
                <button onClick={() => onChange({ ...q, printAreas: printAreas.filter((p) => p.id !== pa.id) } as any)}
                  style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 16, padding: 0, lineHeight: 1, flexShrink: 0 }}>×</button>
              </div>
            ))}
          </div>

          {/* Select allowed transforms */}
          <div style={{ padding: "12px 16px" }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 10 }}>Select allowed transforms</label>
            <ToggleRow label="Move" checked={transforms.move} onChange={(v) => onChange({ ...q, allowedTransforms: { ...transforms, move: v } } as any)} />
            <ToggleRow label="Resize" checked={transforms.resize} onChange={(v) => onChange({ ...q, allowedTransforms: { ...transforms, resize: v } } as any)} />
            <ToggleRow label="Rotate" checked={transforms.rotate} onChange={(v) => onChange({ ...q, allowedTransforms: { ...transforms, rotate: v } } as any)} />
          </div>
        </>
      )}
    </div>
  );
}

// ─── Print area panel (4th panel) ─────────────────────────────────────────────

const UNITS_LABELS = { in: "In", cm: "cm", px: "px" };

function PrintAreaPanel({ area, numViews, layers, onClose, onDelete, onChange, onViewChange }: {
  area: PrintArea;
  numViews: number;
  layers: LayerConfig[];
  onClose: () => void;
  onDelete: () => void;
  onChange: (updated: PrintArea) => void;
  onViewChange?: (view: number) => void;
}) {
  const [showClipPicker, setShowClipPicker] = useState(false);

  const toggleView = (v: number) => {
    const next = area.visibleViews.includes(v)
      ? area.visibleViews.filter((x) => x !== v)
      : [...area.visibleViews, v];
    onChange({ ...area, visibleViews: next });
  };

  return (
    <div style={{ width: 300, borderLeft: "1px solid #e5e7eb", background: "#fff", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: "1px solid #e5e7eb" }}>
        <span style={{ fontSize: 15, color: "#9ca3af", letterSpacing: 3, cursor: "grab" }}>⠿</span>
        <button onClick={onDelete} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 15, padding: "2px 4px", lineHeight: 1, borderRadius: 4 }}>🗑</button>
        <button onClick={onClose} style={{ marginLeft: "auto", padding: "5px 18px", border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, background: "#fff", color: "#374151" }}>Done</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Title */}
        <div style={{ padding: "12px 16px 8px" }}>
          <label style={labelSt}>Title</label>
          <input value={area.name} onChange={(e) => onChange({ ...area, name: e.target.value })} style={inputSt} />
        </div>

        {/* Customer editing view */}
        <div style={{ padding: "4px 16px 10px", borderBottom: "1px solid #f3f4f6" }}>
          <label style={labelSt}>Customer editing view</label>
          <select value={area.customerEditingView} onChange={(e) => {
            const v = Number(e.target.value);
            onChange({ ...area, customerEditingView: v });
            onViewChange?.(v);
          }} style={inputSt}>
            {Array.from({ length: numViews }).map((_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
          <p style={{ fontSize: 11, color: "#9ca3af", margin: "4px 0 0", lineHeight: 1.5 }}>
            The box should be placed approximately on your product.
          </p>
          {/* Preview thumbnail */}
          <div style={{ marginTop: 8, height: 80, background: "#f3f4f6", borderRadius: 6, border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 40, height: 50, border: "2px dashed #9ca3af", borderRadius: 3, background: "#fff" }} />
          </div>
        </div>

        {/* DPI + Units */}
        <div style={{ padding: "10px 16px 4px", borderBottom: "1px solid #f3f4f6" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
            <div>
              <label style={labelSt}>DPI</label>
              <input type="number" value={area.dpi} min={72} max={1200}
                onChange={(e) => onChange({ ...area, dpi: Number(e.target.value) })} style={inputSt} />
            </div>
            <div>
              <label style={labelSt}>Units</label>
              <select value={area.units} onChange={(e) => onChange({ ...area, units: e.target.value as PrintArea["units"] })} style={inputSt}>
                <option value="in">In</option>
                <option value="cm">cm</option>
                <option value="px">px</option>
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
            <div>
              <label style={labelSt}>Width</label>
              <input type="number" value={area.width} min={0.1}
                onChange={(e) => onChange({ ...area, width: Number(e.target.value) })} style={inputSt} />
            </div>
            <div>
              <label style={labelSt}>Height</label>
              <input type="number" value={area.height} min={0.1}
                onChange={(e) => onChange({ ...area, height: Number(e.target.value) })} style={inputSt} />
            </div>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={labelSt}>Rotation °</label>
            <input type="number" value={area.rotation ?? 0} min={-360} max={360}
              onChange={(e) => onChange({ ...area, rotation: Number(e.target.value) })} style={inputSt} />
          </div>
          <div>
            <label style={labelSt}>Bleed area</label>
            <input type="number" value={area.bleedArea} min={0}
              onChange={(e) => onChange({ ...area, bleedArea: Number(e.target.value) })} style={inputSt} />
          </div>
          <p style={{ fontSize: 11, color: "#9ca3af", margin: "4px 0 8px" }}>Maximum size: 225MP</p>
        </div>

        {/* Quality indicator */}
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #f3f4f6" }}>
          <ToggleRow label="Show quality indicator" checked={area.showQualityIndicator} onChange={(v) => onChange({ ...area, showQualityIndicator: v })} />
        </div>

        {/* Safe area */}
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #f3f4f6" }}>
          <label style={labelSt}>Safe area</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ ...labelSt, marginTop: 6 }}>Width</label>
              <input type="number" value={area.safeAreaWidth} min={0}
                onChange={(e) => onChange({ ...area, safeAreaWidth: Number(e.target.value) })} style={inputSt} />
            </div>
            <div>
              <label style={{ ...labelSt, marginTop: 6 }}>Height</label>
              <input type="number" value={area.safeAreaHeight} min={0}
                onChange={(e) => onChange({ ...area, safeAreaHeight: Number(e.target.value) })} style={inputSt} />
            </div>
          </div>
        </div>

        {/* Outline */}
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #f3f4f6" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <label style={{ ...labelSt, marginBottom: 0, marginTop: 0 }}>Outline color</label>
            <input type="color" value={area.outlineColor}
              onChange={(e) => onChange({ ...area, outlineColor: e.target.value })}
              style={{ width: 28, height: 28, border: "1px solid #e5e7eb", borderRadius: "50%", cursor: "pointer", padding: 2, boxSizing: "border-box" }} />
          </div>
          <ToggleRow label="Show outline" checked={area.showOutline} onChange={(v) => onChange({ ...area, showOutline: v })} />
        </div>

        {/* Clip to layer */}
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #f3f4f6", position: "relative" }}>
          <label style={labelSt}>Clip to layer</label>
          <button onClick={() => setShowClipPicker((v) => !v)}
            style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#f9fafb", cursor: "pointer", fontSize: 13, boxSizing: "border-box" }}>
            <span style={{ fontSize: 13 }}>🔗</span>
            <span style={{ flex: 1, textAlign: "left", color: area.clipToLayerId ? "#374151" : "#9ca3af" }}>
              {area.clipToLayerId ? layers.find((l) => l.id === area.clipToLayerId)?.name ?? "Unknown" : "None"}
            </span>
            <span style={{ fontSize: 10, color: "#9ca3af" }}>▼</span>
          </button>
          {showClipPicker && (
            <div style={{ position: "absolute", left: 16, right: 16, top: "calc(100% - 4px)", zIndex: 60, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", overflow: "hidden" }}>
              <button onClick={() => { onChange({ ...area, clipToLayerId: undefined }); setShowClipPicker(false); }}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 14px", border: "none", background: !area.clipToLayerId ? "#eff6ff" : "none", cursor: "pointer", fontSize: 13, color: "#374151" }}>
                None
              </button>
              {layers.map((l) => (
                <button key={l.id} onClick={() => { onChange({ ...area, clipToLayerId: l.id }); setShowClipPicker(false); }}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 14px", border: "none", background: area.clipToLayerId === l.id ? "#eff6ff" : "none", cursor: "pointer", fontSize: 13, color: "#374151" }}>
                  {l.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Views */}
        <div style={{ padding: "10px 16px" }}>
          <label style={labelSt}>Views</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {Array.from({ length: numViews }).map((_, i) => {
              const v = i + 1;
              const active = area.visibleViews.includes(v);
              return (
                <button key={v} onClick={() => toggleView(v)}
                  style={{ width: 32, height: 32, borderRadius: 6, border: active ? "2px solid #3b82f6" : "1px solid #e5e7eb", background: active ? "#eff6ff" : "#f9fafb", cursor: "pointer", fontSize: 13, fontWeight: active ? 700 : 400, color: active ? "#2563eb" : "#374151" }}>
                  {v}
                </button>
              );
            })}
          </div>
          {area.visibleViews.map((v) => (
            <p key={v} style={{ fontSize: 12, color: "#6b7280", margin: "6px 0 0" }}>Show in view {v}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Dropdown question editor ─────────────────────────────────────────────────

function DropdownEditor({ q, numViews, onChange, onEditAnswer, editingIdx }: {
  q: DropdownQuestion; numViews: number; onChange: (updated: Question) => void;
  onEditAnswer: (idx: number) => void; editingIdx: number | null;
}) {
  const displayType = q.displayType ?? "none";
  const isImage = displayType === "image";

  const [newVal, setNewVal] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [answerMenu, setAnswerMenu] = useState<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const addOption = () => {
    if (isImage) {
      const opt: DropdownOption = { value: `opt-${Date.now()}`, label: "Untitled answer", viewImages: Array(numViews).fill(null) };
      const next = [...q.options, opt];
      onChange({ ...q, options: next });
      onEditAnswer(next.length - 1);
    } else {
      if (!newVal.trim() || !newLabel.trim()) return;
      onChange({ ...q, options: [...q.options, { value: newVal.trim(), label: newLabel.trim() }] });
      setNewVal(""); setNewLabel("");
    }
  };

  const removeOption = (i: number) => onChange({ ...q, options: q.options.filter((_, idx) => idx !== i) });

  const handleDragStart = (i: number) => setDragIdx(i);
  const handleDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); setDragOverIdx(i); };
  const handleDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === toIdx) { setDragIdx(null); setDragOverIdx(null); return; }
    const next = [...q.options];
    const [removed] = next.splice(dragIdx, 1);
    next.splice(toIdx, 0, removed);
    onChange({ ...q, options: next });
    setDragIdx(null); setDragOverIdx(null);
  };
  const handleDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };

  if (isImage) {
    return (
      <div>
        {/* Title */}
        <div style={{ padding: "12px 16px 8px" }}>
          <label style={labelSt}>Title</label>
          <input value={q.name} onChange={(e) => onChange({ ...q, name: e.target.value })} style={inputSt} />
        </div>

        {/* Image answers list */}
        <div style={{ padding: "8px 16px 12px", borderBottom: "1px solid #f3f4f6" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Image answers</span>
            <button onClick={addOption} style={{ width: 28, height: 28, background: "#111827", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer", fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
          </div>

          {q.options.length === 0 && (
            <div style={{ padding: 14, border: "2px dashed #e5e7eb", borderRadius: 8, textAlign: "center" }}>
              <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 8px" }}>No answers yet.</p>
              <button onClick={addOption} style={{ padding: "6px 14px", background: "#111827", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>+ Add first answer</button>
            </div>
          )}

          {q.options.map((opt, idx) => (
            <div
              key={`${opt.value}-${idx}`}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={handleDragEnd}
              style={{ position: "relative", marginBottom: 5, opacity: dragIdx === idx ? 0.35 : 1 }}
              onMouseLeave={() => setAnswerMenu(null)}
            >
              <div
                onClick={() => onEditAnswer(idx)}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
                  border: `1px solid ${dragOverIdx === idx && dragIdx !== idx ? "#0ea5e9" : editingIdx === idx ? "#93c5fd" : "#e5e7eb"}`,
                  borderRadius: 7, cursor: "pointer",
                  background: dragOverIdx === idx && dragIdx !== idx ? "#f0f9ff" : editingIdx === idx ? "#eff6ff" : "#fafafa",
                }}
              >
                <span style={{ cursor: "grab", color: "#d1d5db", fontSize: 11, userSelect: "none" }}>⠿</span>
                {opt.thumbnailUrl || opt.viewImages?.find(Boolean) ? (
                  <img
                    src={opt.thumbnailUrl ?? opt.viewImages?.find(Boolean) ?? ""}
                    alt={opt.label}
                    style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 4, border: "1px solid #e5e7eb", flexShrink: 0 }}
                  />
                ) : (
                  <span style={{ width: 32, height: 32, background: "#f3f4f6", borderRadius: 4, border: "1px dashed #d1d5db", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#9ca3af", flexShrink: 0 }}>🏔</span>
                )}
                <span style={{ flex: 1, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{opt.label}</span>
                {editingIdx === idx && <span style={{ fontSize: 10, color: "#3b82f6", fontWeight: 700, flexShrink: 0 }}>● EDITING</span>}
                <button
                  onClick={(e) => { e.stopPropagation(); setAnswerMenu(answerMenu === idx ? null : idx); }}
                  style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 14, padding: "2px 4px", flexShrink: 0 }}>
                  ⋮
                </button>
              </div>
              {answerMenu === idx && (
                <div style={{ position: "absolute", right: 8, top: "100%", zIndex: 50, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", minWidth: 140, overflow: "hidden" }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); const copy = { ...opt, value: `opt-${Date.now()}`, label: `${opt.label} (copy)` }; onChange({ ...q, options: [...q.options.slice(0, idx + 1), copy, ...q.options.slice(idx + 1)] }); setAnswerMenu(null); }}
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#374151" }}>
                    Duplicate
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeOption(idx); setAnswerMenu(null); }}
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#ef4444" }}>
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Multiple selection toggle */}
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #f3f4f6" }}>
          <ToggleRow label="Multiple selection" checked={q.multipleSelection ?? false} onChange={(v) => onChange({ ...q, multipleSelection: v })} />
        </div>
      </div>
    );
  }

  // ── Plain (non-image) dropdown editor ────────────────────────────────────────
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
            <button onClick={() => removeOption(i)} style={{ background: "none", border: "none", color: "#d1d5db", cursor: "pointer", fontSize: 14 }}>×</button>
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

function LabelAnswerDetailPanel({ answer, numViews, displayType, onDone, onChange }: {
  answer: LabelAnswer;
  numViews: number;
  displayType: string;
  onDone: () => void;
  onChange: (updated: LabelAnswer) => void;
}) {
  const setViewImage = (vi: number, url: string | null) => {
    const views = [...(answer.viewImages ?? Array(numViews).fill(null))];
    views[vi] = url;
    onChange({ ...answer, viewImages: views, imageUrl: views[0] ?? undefined });
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #e5e7eb' }}>
        <span style={{ fontSize: 15, color: '#9ca3af', letterSpacing: 3 }}>⠿</span>
        <button onClick={onDone}
          style={{ padding: '5px 18px', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, background: '#fff', color: '#374151' }}>
          Done
        </button>
      </div>
      <div style={{ padding: '12px 16px 8px' }}>
        <label style={labelSt}>Title</label>
        <input value={answer.label} onChange={(e) => onChange({ ...answer, label: e.target.value })} style={inputSt} autoFocus />
      </div>
      {numViews > 1 ? (
        <div style={{ padding: '4px 16px 10px', borderTop: '1px solid #f3f4f6' }}>
          {Array.from({ length: numViews }).map((_, vi) => (
            <div key={vi} style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>
                View {vi + 1}
              </label>
              <ImageUploadSlot label="" currentUrl={answer.viewImages?.[vi] ?? null} onUploaded={(url) => setViewImage(vi, url)} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '4px 16px 10px', borderTop: '1px solid #f3f4f6' }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Thumbnail</label>
          <ImageUploadSlot label="" currentUrl={answer.imageUrl ?? null} onUploaded={(url) => onChange({ ...answer, imageUrl: url ?? undefined })} />
        </div>
      )}
      <div style={{ borderTop: '1px solid #f3f4f6' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px' }}>
          <label style={{ fontSize: 13, color: '#374151' }}>Description</label>
          <input type="checkbox" checked={answer.description !== undefined}
            onChange={(e) => onChange({ ...answer, description: e.target.checked ? '' : undefined })}
            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#22c55e' }} />
        </div>
        {answer.description !== undefined && (
          <div style={{ padding: '0 16px 10px' }}>
            <input value={answer.description} onChange={(e) => onChange({ ...answer, description: e.target.value })}
              placeholder="Enter description…" style={inputSt} />
          </div>
        )}
      </div>
      <div style={{ borderTop: '1px solid #f3f4f6' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px' }}>
          <label style={{ fontSize: 13, color: '#374151' }}>Production code</label>
          <input type="checkbox" checked={answer.productionCode !== undefined}
            onChange={(e) => onChange({ ...answer, productionCode: e.target.checked ? '' : undefined })}
            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#22c55e' }} />
        </div>
        {answer.productionCode !== undefined && (
          <div style={{ padding: '0 16px 10px' }}>
            <input value={answer.productionCode} onChange={(e) => onChange({ ...answer, productionCode: e.target.value })}
              placeholder="Enter production code…" style={inputSt} />
          </div>
        )}
      </div>
    </div>
  );
}

function LabelEditor({ q, numViews, onChange, onSwitchType, onAnswerPreview }: {
  q: LabelQuestion;
  numViews: number;
  onChange: (updated: Question) => void;
  onSwitchType?: (type: InputType) => void;
  onAnswerPreview?: (images: (string | null)[] | null) => void;
}) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [answerMenu, setAnswerMenu] = useState<number | null>(null);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showDisplayDropdown, setShowDisplayDropdown] = useState(false);

  const answers = q.answers ?? [];
  const displayType = q.displayType ?? "none";
  const displayMeta = DISPLAY_TYPE_META[displayType] ?? { label: "None", icon: "⊘" };
  const displayTypes = DISPLAY_TYPE_MAP["label"];

  const openAnswerDetail = (idx: number) => {
    setEditingIdx(idx);
    const ans = answers[idx];
    onAnswerPreview?.(ans?.viewImages?.some(Boolean) ? ans.viewImages! : null);
  };

  const closeAnswerDetail = () => {
    setEditingIdx(null);
    onAnswerPreview?.(null);
  };

  const addAnswer = () => {
    const newAns: LabelAnswer = numViews > 1
      ? { value: `ans-${Date.now()}`, label: "Untitled answer", viewImages: Array(numViews).fill(null) }
      : { value: `ans-${Date.now()}`, label: "Untitled answer" };
    const next = [...answers, newAns];
    onChange({ ...q, answers: next });
    openAnswerDetail(next.length - 1);
  };

  const updateAnswer = (idx: number, updated: LabelAnswer) => {
    onChange({ ...q, answers: answers.map((a, i) => i === idx ? updated : a) });
    onAnswerPreview?.(updated.viewImages?.some(Boolean) ? updated.viewImages! : null);
  };

  const removeAnswer = (idx: number) => {
    onChange({ ...q, answers: answers.filter((_, i) => i !== idx) });
    if (editingIdx === idx) setEditingIdx(null);
  };

  if (editingIdx !== null && answers[editingIdx]) {
    return (
      <LabelAnswerDetailPanel
        answer={answers[editingIdx]}
        numViews={numViews}
        displayType={displayType}
        onDone={closeAnswerDetail}
        onChange={(updated) => updateAnswer(editingIdx, updated)}
      />
    );
  }

  return (
    <div>
      {/* Title */}
      <div style={{ padding: "12px 16px 8px" }}>
        <label style={labelSt}>Title</label>
        <input value={q.name} onChange={(e) => onChange({ ...q, name: e.target.value })} style={inputSt} />
      </div>

      {/* Value answers */}
      <div style={{ padding: "8px 16px 12px", borderBottom: "1px solid #f3f4f6" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Value answers</span>
          <div style={{ display: "flex", gap: 5 }}>
            <button title="Library" style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 5, width: 28, height: 28, cursor: "pointer", fontSize: 13, color: "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center" }}>⊞</button>
            <button onClick={addAnswer} style={{ width: 28, height: 28, background: "#111827", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer", fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
          </div>
        </div>

        {answers.length === 0 && (
          <div style={{ padding: "12px", border: "2px dashed #e5e7eb", borderRadius: 8, textAlign: "center" }}>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 8px" }}>No answers yet.</p>
            <button onClick={addAnswer} style={{ padding: "5px 12px", background: "#111827", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>+ Add first answer</button>
          </div>
        )}

        {answers.map((a, idx) => (
          <div key={a.value} style={{ position: "relative", marginBottom: 5 }} onMouseLeave={() => setAnswerMenu(null)}>
            <div onClick={() => openAnswerDetail(idx)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 7, cursor: "pointer", background: "#fafafa" }}>
              {(a.imageUrl ?? a.viewImages?.find(Boolean))
                ? <img src={(a.imageUrl ?? a.viewImages?.find(Boolean)) as string} alt="" style={{ width: 22, height: 22, borderRadius: 4, objectFit: "cover", flexShrink: 0 }} />
                : <span style={{ width: 22, height: 22, borderRadius: 4, background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#9ca3af", flexShrink: 0 }}>img</span>
              }
              <span style={{ flex: 1, fontSize: 13 }}>{a.label || "Untitled answer"}</span>
              <button onClick={(e) => { e.stopPropagation(); setAnswerMenu(answerMenu === idx ? null : idx); }}
                style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 16, padding: "0 2px", flexShrink: 0 }}>⋮</button>
              <span style={{ color: "#22c55e", fontSize: 14, flexShrink: 0 }}>✓</span>
            </div>
            {answerMenu === idx && (
              <div style={{ position: "absolute", right: 8, top: "100%", zIndex: 50, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", minWidth: 140, overflow: "hidden" }}>
                <button onClick={(e) => { e.stopPropagation(); openAnswerDetail(idx); setAnswerMenu(null); }}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#374151" }}>Edit</button>
                <button onClick={(e) => { e.stopPropagation(); removeAnswer(idx); setAnswerMenu(null); }}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#ef4444" }}>Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input type */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", position: "relative" }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Input type</label>
        <div style={{ position: "relative" }} onMouseLeave={() => setShowTypeDropdown(false)}>
          <button onClick={() => setShowTypeDropdown(!showTypeDropdown)}
            style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#f9fafb", cursor: "pointer", fontSize: 13, boxSizing: "border-box" }}>
            <span style={{ width: 22, height: 22, background: "#22c55e", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 700, flexShrink: 0 }}>⊟</span>
            <span style={{ flex: 1, textAlign: "left", color: "#374151" }}>Label</span>
            <span style={{ fontSize: 10, color: "#9ca3af" }}>▼</span>
          </button>
          {showTypeDropdown && (
            <div style={{ position: "absolute", left: 0, right: 0, top: "calc(100% + 2px)", zIndex: 50, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", overflow: "hidden" }}>
              {INPUT_TYPE_CONFIG.map(({ type, label, bg, icon }) => (
                <button key={type} onClick={() => { if (type !== "label") onSwitchType?.(type); setShowTypeDropdown(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 14px", border: "none", background: type === "label" ? "#eff6ff" : "none", cursor: "pointer", fontSize: 13, color: "#374151" }}>
                  <span style={{ width: 22, height: 22, background: bg, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 700, flexShrink: 0 }}>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ marginTop: 10 }}>
          <ToggleRow label="Multiple selection" checked={q.multipleSelection ?? false} onChange={(v) => onChange({ ...q, multipleSelection: v })} />
        </div>
      </div>

      {/* Display type */}
      <div style={{ padding: "12px 16px" }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Display type</label>
        <div style={{ position: "relative" }} onMouseLeave={() => setShowDisplayDropdown(false)}>
          <button onClick={() => setShowDisplayDropdown(!showDisplayDropdown)}
            style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#f9fafb", cursor: "pointer", fontSize: 13, boxSizing: "border-box" }}>
            <span style={{ width: 22, height: 22, background: "#f3f4f6", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#6b7280", fontWeight: 700, flexShrink: 0 }}>{displayMeta.icon}</span>
            <span style={{ flex: 1, textAlign: "left", color: "#374151" }}>{displayMeta.label}</span>
            <span style={{ fontSize: 10, color: "#9ca3af" }}>▼</span>
          </button>
          {showDisplayDropdown && (
            <div style={{ position: "absolute", left: 0, right: 0, top: "calc(100% + 2px)", zIndex: 50, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", overflow: "hidden" }}>
              {displayTypes.map((dt) => {
                const meta = DISPLAY_TYPE_META[dt] ?? { label: dt, icon: "?" };
                return (
                  <button key={dt} onClick={() => { onChange({ ...q, displayType: dt }); setShowDisplayDropdown(false); }}
                    style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 14px", border: "none", background: dt === displayType ? "#eff6ff" : "none", cursor: "pointer", fontSize: 13, color: "#374151" }}>
                    <span style={{ width: 22, height: 22, background: dt === displayType ? "#0ea5e9" : "#f3f4f6", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: dt === displayType ? "#fff" : "#6b7280", fontWeight: 700, flexShrink: 0 }}>{meta.icon}</span>
                    <span style={{ textAlign: "left" }}>
                      {meta.label}
                      {meta.desc && <span style={{ display: "block", fontSize: 10, color: "#9ca3af", fontWeight: 400 }}>{meta.desc}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Group question editor ────────────────────────────────────────────────────

function GroupEditorComp({ q, questions, onChange, onAddElement }: {
  q: GroupQuestion; questions: Question[];
  onChange: (updated: Question) => void; onAddElement: () => void;
}) {
  return (
    <div>
      <div style={{ padding: "12px 16px 8px" }}>
        <label style={labelSt}>Title</label>
        <input value={q.name} onChange={(e) => onChange({ ...q, name: e.target.value })} style={inputSt} />
      </div>
      <div style={{ padding: "8px 16px 16px", borderTop: "1px solid #f3f4f6" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Group elements</span>
          <button onClick={onAddElement}
            style={{ width: 26, height: 26, background: "#111827", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
        </div>
        {q.childIds.length === 0 ? (
          <p style={{ fontSize: 12, color: "#9ca3af", margin: "20px 0", textAlign: "center" }}>There are no elements, yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {q.childIds.map((childId) => {
              const child = questions.find((oq) => oq.id === childId);
              if (!child) return null;
              return (
                <div key={childId} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "#f9fafb", borderRadius: 7, border: "1px solid #e5e7eb" }}>
                  <span style={{ display: "flex", alignItems: "center", width: 18, flexShrink: 0 }}>{getQuestionIcon(child)}</span>
                  <span style={{ flex: 1, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{child.name}</span>
                  <button onClick={() => onChange({ ...q, childIds: q.childIds.filter((id) => id !== childId) })}
                    style={{ background: "none", border: "none", color: "#d1d5db", cursor: "pointer", fontSize: 16, padding: 0, flexShrink: 0, lineHeight: 1 }}>×</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── View upload slot ─────────────────────────────────────────────────────────

const MAX_VIEWS = 20;

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

// ─── Layer editor — shared constants ─────────────────────────────────────────

const GOOGLE_FONTS = [
  "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins", "Inter", "Raleway",
  "Oswald", "Merriweather", "Playfair Display", "Ubuntu", "Nunito",
  "Noto Sans JP", "Source Sans Pro", "PT Sans", "Google Sans",
];

const LAYER_ANSWER_LABELS: Record<string, string> = {
  image: "Image answers", color: "Color answers", logo: "Logo answers",
  font: "Font answers", "font-size": "Font size answers",
  "text-color": "Color answers", "text-outline": "Outline answers",
};

const LAYER_APPLY_ON: Record<string, { label: string; targetDT: string }> = {
  color:          { label: "Image question",  targetDT: "image" },
  logo:           { label: "Print area",      targetDT: "text"  },
  text:           { label: "Print area",      targetDT: "text"  },
  font:           { label: "Text question",   targetDT: "text"  },
  "font-size":    { label: "Text question",   targetDT: "text"  },
  "text-color":   { label: "Text question",   targetDT: "text"  },
  "text-outline": { label: "Text question",   targetDT: "text"  },
};

const LAYER_CREATE: Record<string, { type: string; label: string }[]> = {
  image: [{ type: "color", label: "Color question" }],
  text: [
    { type: "text-color",   label: "Color question"     },
    { type: "font",         label: "Font question"       },
    { type: "font-size",    label: "Font size question"  },
    { type: "text-outline", label: "Outline question"    },
  ],
};

// ─── Draggable answer list ─────────────────────────────────────────────────────

function DraggableAnswerList({ answers, onReorder, onEdit, renderPreview }: {
  answers: LayerAnswer[];
  onReorder: (next: LayerAnswer[]) => void;
  onEdit: (idx: number) => void;
  renderPreview: (a: LayerAnswer) => React.ReactNode;
}) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const drop = (toIdx: number) => {
    if (dragIdx === null || dragIdx === toIdx) { setDragIdx(null); setOverIdx(null); return; }
    const next = [...answers];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(toIdx, 0, moved);
    onReorder(next);
    setDragIdx(null); setOverIdx(null);
  };

  return (
    <div>
      {answers.map((a, idx) => (
        <div key={a.id}
          draggable
          onDragStart={() => setDragIdx(idx)}
          onDragOver={(e) => { e.preventDefault(); setOverIdx(idx); }}
          onDrop={() => drop(idx)}
          onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
          onClick={() => onEdit(idx)}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 8px",
            border: overIdx === idx ? "1.5px solid #3b82f6" : "1px solid #e5e7eb",
            borderRadius: 7, cursor: "pointer",
            background: overIdx === idx ? "#eff6ff" : "#fafafa",
            marginBottom: 5, opacity: dragIdx === idx ? 0.4 : 1, userSelect: "none",
          }}>
          <span style={{ color: "#d1d5db", cursor: "grab", fontSize: 14, flexShrink: 0 }} title="Drag to reorder">⠿</span>
          {renderPreview(a)}
          <span style={{ flex: 1, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {a.label || "Untitled answer"}
          </span>
          <span style={{ color: "#22c55e", fontSize: 12, flexShrink: 0 }}>✓</span>
        </div>
      ))}
    </div>
  );
}

// ─── Font picker ──────────────────────────────────────────────────────────────

function FontPicker({ value, onChange }: { value: string; onChange: (font: string) => void }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"google" | "custom">("google");
  return (
    <div style={{ padding: "4px 16px 10px" }}>
      <label style={labelSt}>Fonts</label>
      <div style={{ position: "relative" }}>
        <button onClick={() => setOpen(!open)}
          style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 10px", border: "1px solid #3b82f6", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13, boxSizing: "border-box" }}>
          <span style={{ flex: 1, textAlign: "left" }}>{value}</span>
          <span style={{ fontSize: 10, color: "#9ca3af" }}>▼</span>
        </button>
        {open && (
          <div style={{ position: "absolute", left: 0, right: 0, top: "calc(100% + 2px)", zIndex: 100, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", overflow: "hidden" }}>
            <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb" }}>
              {(["google", "custom"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  style={{ flex: 1, padding: "8px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: tab === t ? 600 : 400, color: tab === t ? "#2563eb" : "#6b7280", borderBottom: tab === t ? "2px solid #2563eb" : "2px solid transparent" }}>
                  {t === "google" ? "Google" : "My fonts"}
                </button>
              ))}
            </div>
            {tab === "google" ? (
              <div style={{ maxHeight: 200, overflowY: "auto" }}>
                {GOOGLE_FONTS.map((font) => (
                  <button key={font} onClick={() => { onChange(font); setOpen(false); }}
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 14px", border: "none", background: font === value ? "#eff6ff" : "none", cursor: "pointer", fontSize: 13, color: font === value ? "#2563eb" : "#374151", fontWeight: font === value ? 600 : 400 }}>
                    {font}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ padding: "12px 14px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", border: "1.5px dashed #d1d5db", borderRadius: 6, cursor: "pointer", fontSize: 13, color: "#374151" }}>
                  <span>↑</span> Upload your font
                  <input type="file" accept=".ttf,.otf,.woff,.woff2" style={{ display: "none" }} />
                </label>
                <p style={{ fontSize: 12, color: "#9ca3af", margin: "8px 0 0", textAlign: "center" }}>No options</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Layer answer detail panel ────────────────────────────────────────────────

function LayerAnswerDetail({ answer, displayType, numViews, onBack, onChange }: {
  answer: LayerAnswer; displayType: string; numViews: number;
  onBack: () => void; onChange: (updated: LayerAnswer) => void;
}) {
  const isColor = displayType === "color" || displayType === "text-color";

  const setViewImage = (vi: number, url: string | null) => {
    const views = [...(answer.viewImages ?? Array(numViews).fill(null))];
    views[vi] = url;
    onChange({ ...answer, viewImages: views, imageUrl: views[0] ?? undefined });
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid #e5e7eb" }}>
        <span style={{ fontSize: 15, color: "#9ca3af", letterSpacing: 3 }}>⠿</span>
        <button onClick={onBack} style={{ padding: "5px 18px", border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, background: "#fff", color: "#374151" }}>Done</button>
      </div>

      <div style={{ padding: "12px 16px 8px" }}>
        <label style={labelSt}>Title</label>
        <input value={answer.label} onChange={(e) => onChange({ ...answer, label: e.target.value })} style={inputSt} />
      </div>

      {displayType === "image" && (
        <div style={{ padding: "4px 16px 4px" }}>
          {Array.from({ length: numViews }).map((_, vi) => (
            <div key={vi} style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>
                View {vi + 1}
              </label>
              <ImageUploadSlot label="" currentUrl={answer.viewImages?.[vi] ?? null} onUploaded={(url) => setViewImage(vi, url)} />
            </div>
          ))}
        </div>
      )}

      {isColor && (
        <div style={{ padding: "4px 16px 12px" }}>
          <label style={labelSt}>Color</label>
          <ModernColorPicker
            value={answer.value?.startsWith("#") ? answer.value : "#000000"}
            onChange={(hex) => onChange({ ...answer, value: hex })}
          />
        </div>
      )}

      {displayType === "font" && (
        <FontPicker value={answer.value || "Roboto"} onChange={(font) => onChange({ ...answer, value: font })} />
      )}

      {displayType === "font-size" && (
        <div style={{ padding: "4px 16px 10px" }}>
          <label style={labelSt}>
            Width in view
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: 3, background: "#e5e7eb", fontSize: 10, marginLeft: 5, fontWeight: 700 }}>1</span>
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="number" value={answer.fontSize ?? 32} min={1} max={500}
              onChange={(e) => onChange({ ...answer, fontSize: Number(e.target.value), value: `${e.target.value}px` })}
              style={{ flex: 1, padding: "7px 10px", border: "1px solid #3b82f6", borderRadius: 6, fontSize: 13 }} />
            <span style={{ fontSize: 12, color: "#6b7280" }}>px</span>
          </div>
        </div>
      )}

      {displayType === "text-outline" && (
        <div style={{ padding: "4px 16px 10px" }}>
          <label style={labelSt}>Outline size (px)</label>
          <input type="number" value={answer.outlineSize ?? 0} min={0} max={50}
            onChange={(e) => onChange({ ...answer, outlineSize: Number(e.target.value), value: `${e.target.value}px` })}
            style={inputSt} />
          <label style={{ ...labelSt, marginTop: 10 }}>Outline color</label>
          <ModernColorPicker
            value={answer.outlineColor || "#9CA3AF"}
            onChange={(hex) => onChange({ ...answer, outlineColor: hex })}
          />
        </div>
      )}

      <div style={{ padding: "4px 16px 10px", borderTop: "1px solid #f3f4f6" }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>Thumbnail</label>
        <ImageUploadSlot label="" currentUrl={answer.thumbnailUrl ?? null} onUploaded={(url) => onChange({ ...answer, thumbnailUrl: url ?? undefined })} />
      </div>

      <div style={{ borderTop: "1px solid #f3f4f6" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px" }}>
          <label style={{ fontSize: 13, color: "#374151" }}>Description</label>
          <input type="checkbox" checked={answer.description !== undefined}
            onChange={(e) => onChange({ ...answer, description: e.target.checked ? "" : undefined })}
            style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#22c55e" }} />
        </div>
        {answer.description !== undefined && (
          <div style={{ padding: "0 16px 10px" }}>
            <input value={answer.description} onChange={(e) => onChange({ ...answer, description: e.target.value })}
              placeholder="Enter description…" style={inputSt} />
          </div>
        )}
      </div>

      <div style={{ borderTop: "1px solid #f3f4f6" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px" }}>
          <label style={{ fontSize: 13, color: "#374151" }}>Production code</label>
          <input type="checkbox" checked={answer.productionCode !== undefined}
            onChange={(e) => onChange({ ...answer, productionCode: e.target.checked ? "" : undefined })}
            style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#22c55e" }} />
        </div>
        {answer.productionCode !== undefined && (
          <div style={{ padding: "0 16px 10px" }}>
            <input value={answer.productionCode} onChange={(e) => onChange({ ...answer, productionCode: e.target.value })}
              placeholder="Enter production code…" style={inputSt} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── New display-type layer editor ────────────────────────────────────────────

function NewLayerEditor({ layer, layers, questions, numViews, onChange, onConvertToQuestion, onCreateAndLinkQuestion, onAddLinkedLayer, onAnswerPreview }: {
  layer: LayerConfig; layers: LayerConfig[]; questions: Question[]; numViews: number;
  onChange: (updated: LayerConfig) => void;
  onConvertToQuestion: (layer: LayerConfig, inputType: InputType) => void;
  onCreateAndLinkQuestion: (inputType: InputType, layerId: string) => void;
  onAddLinkedLayer: (displayType: string, sourceId: string) => void;
  onAnswerPreview?: (idx: number | null) => void;
}) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const setEditingIdxAndNotify = (idx: number | null) => { setEditingIdx(idx); onAnswerPreview?.(idx); };
  const [showInputTypeDropdown, setShowInputTypeDropdown] = useState(false);
  const [showApplyPicker, setShowApplyPicker] = useState(false);
  const [applySearch, setApplySearch] = useState("");

  const dt = layer.displayType!;
  const answers = layer.answers ?? [];
  const displayMeta = DISPLAY_TYPE_META[dt] ?? { label: dt, icon: "?" };
  const answerLabel = LAYER_ANSWER_LABELS[dt];
  const applyConf = LAYER_APPLY_ON[dt];
  const createItems = LAYER_CREATE[dt] ?? [];
  const hasAnswers = dt !== "text";
  const iconBg = LAYER_DISPLAY_COLORS[dt] ?? "#6b7280";
  const appliedIds = layer.applyOn ?? [];

  // Apply on targets questions (not layers)
  const applyTargetInputType: InputType | null = applyConf
    ? (applyConf.targetDT === "image" ? "thumbnail" : applyConf.targetDT === "text" ? "text" : null)
    : null;
  const matchingQuestions = applyConf
    ? questions.filter((q) =>
        applyConf.targetDT === "image" ? q.type === "thumbnail"
        : applyConf.targetDT === "text" ? q.type === "text"
        : false
      )
    : [];
  const filteredApplyQuestions = matchingQuestions.filter(
    (q) => !appliedIds.includes(q.id) && q.name.toLowerCase().includes(applySearch.toLowerCase())
  );

  const addAnswer = () => {
    const id = `ans-${Date.now()}`;
    const defaults: Partial<LayerAnswer> = {};
    if (dt === "color" || dt === "text-color") defaults.value = "#000000";
    if (dt === "font") defaults.value = "Roboto";
    if (dt === "font-size") { defaults.fontSize = 32; defaults.value = "32px"; }
    if (dt === "text-outline") { defaults.outlineSize = 0; defaults.outlineColor = "#9ca3af"; defaults.value = "0px"; }
    if (dt === "image") defaults.viewImages = Array(numViews).fill(null);
    const newAns: LayerAnswer = { id, label: "Untitled answer", ...defaults };
    const next = [...answers, newAns];
    onChange({ ...layer, answers: next });
    setEditingIdxAndNotify(next.length - 1);
  };

  const renderPreview = (a: LayerAnswer) => {
    if (dt === "image") return a.imageUrl
      ? <img src={a.imageUrl} alt="" style={{ width: 22, height: 22, borderRadius: 4, objectFit: "cover", flexShrink: 0 }} />
      : <span style={{ width: 22, height: 22, background: "#e5e7eb", borderRadius: 4, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#9ca3af", flexShrink: 0 }}>img</span>;
    if (dt === "logo") return <span style={{ width: 22, height: 22, background: "#fef3c7", borderRadius: 4, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>⭐</span>;
    if (dt === "color" || dt === "text-color") return <span style={{ width: 18, height: 18, borderRadius: "50%", background: a.value || "#000", border: "1px solid rgba(0,0,0,0.15)", flexShrink: 0, display: "inline-block" }} />;
    if (dt === "font") return <span style={{ fontSize: 10, fontWeight: 700, color: "#374151", flexShrink: 0, minWidth: 22, textAlign: "center" }}>aA</span>;
    if (dt === "font-size") return <span style={{ fontSize: 10, color: "#6b7280", flexShrink: 0, minWidth: 32 }}>{a.value ?? "32px"}</span>;
    if (dt === "text-outline") return <span style={{ width: 16, height: 16, borderRadius: "50%", background: a.outlineColor || "#9ca3af", border: "2px solid rgba(0,0,0,0.1)", flexShrink: 0, display: "inline-block" }} />;
    return null;
  };

  if (editingIdx !== null && answers[editingIdx]) {
    return (
      <LayerAnswerDetail
        answer={answers[editingIdx]}
        displayType={dt}
        numViews={numViews}
        onBack={() => setEditingIdxAndNotify(null)}
        onChange={(updated) => onChange({ ...layer, answers: answers.map((a, i) => i === editingIdx ? updated : a) })}
      />
    );
  }

  return (
    <div>
      {/* Title */}
      <div style={{ padding: "12px 16px 8px" }}>
        <label style={labelSt}>Title</label>
        <input value={layer.name} onChange={(e) => onChange({ ...layer, name: e.target.value })} style={inputSt} />
      </div>

      {/* Answers */}
      {hasAnswers && (
        <div style={{ padding: "8px 16px 12px", borderBottom: "1px solid #f3f4f6" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{answerLabel}</span>
            <div style={{ display: "flex", gap: 5 }}>
              <button title="Library" style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 5, width: 28, height: 28, cursor: "pointer", fontSize: 13, color: "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center" }}>⊞</button>
              <button onClick={addAnswer} style={{ width: 28, height: 28, background: "#111827", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer", fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
            </div>
          </div>
          {answers.length === 0 && (
            <div style={{ padding: "12px", border: "2px dashed #e5e7eb", borderRadius: 8, textAlign: "center" }}>
              <button onClick={addAnswer} style={{ padding: "5px 12px", background: "#111827", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>+ Add first answer</button>
            </div>
          )}
          <DraggableAnswerList
            answers={answers}
            onReorder={(next) => onChange({ ...layer, answers: next })}
            onEdit={(idx) => setEditingIdxAndNotify(idx)}
            renderPreview={renderPreview}
          />
        </div>
      )}

      {/* Input type — functional dropdown; non-None converts layer → question */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Input type</label>
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowInputTypeDropdown(!showInputTypeDropdown)}
            style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#f9fafb", cursor: "pointer", fontSize: 13, boxSizing: "border-box" }}>
            <span style={{ width: 22, height: 22, background: "#f3f4f6", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#6b7280", flexShrink: 0 }}>⊘</span>
            <span style={{ flex: 1, textAlign: "left", color: "#374151" }}>None</span>
            <span style={{ fontSize: 10, color: "#9ca3af" }}>▼</span>
          </button>
          {showInputTypeDropdown && (
            <div style={{ position: "absolute", left: 0, right: 0, top: "calc(100% + 2px)", zIndex: 60, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.14)", maxHeight: 280, overflowY: "auto" }}>
              <button onClick={() => setShowInputTypeDropdown(false)}
                style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 14px", border: "none", background: "#eff6ff", cursor: "pointer", fontSize: 13, color: "#374151", borderBottom: "1px solid #f3f4f6" }}>
                <span style={{ width: 22, height: 22, background: "#f3f4f6", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#6b7280", flexShrink: 0 }}>⊘</span>
                None <span style={{ marginLeft: 4, fontSize: 11, color: "#9ca3af" }}>(Behind the scene)</span>
                <span style={{ marginLeft: "auto", color: "#22c55e", fontSize: 12 }}>✓</span>
              </button>
              {INPUT_TYPE_CONFIG.map(({ type, label, bg, icon }) => (
                <button key={type} onClick={() => { onConvertToQuestion(layer, type); setShowInputTypeDropdown(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#374151" }}>
                  <span style={{ width: 22, height: 22, background: bg, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 700, flexShrink: 0 }}>{icon}</span>
                  <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
                  <span style={{ fontSize: 10, color: "#9ca3af" }}>→ Questions</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Display type + Apply on + Create */}
      <div style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Display type</label>
          <span style={{ fontSize: 14, color: "#9ca3af" }}>⚙</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#f9fafb", marginBottom: applyConf ? 12 : 0 }}>
          <span style={{ width: 22, height: 22, background: iconBg, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 700, flexShrink: 0 }}>{displayMeta.icon}</span>
          <span style={{ flex: 1, fontSize: 13, color: "#374151" }}>{displayMeta.label}</span>
          <span style={{ fontSize: 10, color: "#9ca3af" }}>▼</span>
        </div>

        {/* Apply on */}
        {applyConf && (
          <div style={{ marginBottom: createItems.length > 0 ? 14 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: showApplyPicker ? 0 : 4 }}>
              <span style={{ fontSize: 13, color: "#9ca3af" }}>↳</span>
              <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>Apply on</span>
              <button onClick={() => { setShowApplyPicker((v) => !v); setApplySearch(""); }}
                style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer", fontSize: 12, background: showApplyPicker ? "#eff6ff" : "#f9fafb", color: "#374151" }}>
                <span style={{ width: 18, height: 18, background: LAYER_DISPLAY_COLORS[applyConf.targetDT] ?? "#6b7280", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", flexShrink: 0 }}>
                  {DISPLAY_TYPE_META[applyConf.targetDT]?.icon ?? "?"}
                </span>
                <span>{applyConf.label}</span>
                <span style={{ fontWeight: 700 }}>+</span>
              </button>
            </div>

            {/* Expanded apply-on picker */}
            {showApplyPicker && (
              <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", marginTop: 8, marginBottom: 8 }}>
                {/* Create new question */}
                {applyTargetInputType && (
                  <button
                    onClick={() => { onCreateAndLinkQuestion(applyTargetInputType, layer.id); setShowApplyPicker(false); }}
                    style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13, color: "#374151", marginBottom: 8, boxSizing: "border-box" }}>
                    <span style={{ width: 22, height: 22, background: LAYER_DISPLAY_COLORS[applyConf.targetDT] ?? "#6b7280", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 700, flexShrink: 0 }}>
                      {DISPLAY_TYPE_META[applyConf.targetDT]?.icon ?? "+"}
                    </span>
                    <span>New {applyConf.label}</span>
                    <span style={{ marginLeft: "auto", fontWeight: 700, fontSize: 16 }}>+</span>
                  </button>
                )}

                {/* Select existing */}
                {matchingQuestions.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", margin: "8px 0", borderTop: "1px solid #e5e7eb", paddingTop: 8 }}>or select existing</div>
                    <input
                      value={applySearch}
                      onChange={(e) => setApplySearch(e.target.value)}
                      placeholder="Search questions..."
                      style={{ ...inputSt, marginBottom: 6, fontSize: 12 }}
                    />
                    <div style={{ maxHeight: 140, overflowY: "auto" }}>
                      {filteredApplyQuestions.length === 0 && (
                        <p style={{ fontSize: 12, color: "#9ca3af", margin: "4px 0", textAlign: "center" }}>No matching questions</p>
                      )}
                      {filteredApplyQuestions.map((q) => (
                        <button key={q.id}
                          onClick={() => { onChange({ ...layer, applyOn: [...appliedIds, q.id] }); setShowApplyPicker(false); }}
                          style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "6px 8px", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#374151", borderRadius: 5 }}>
                          <span style={{ width: 20, height: 20, background: LAYER_DISPLAY_COLORS[applyConf.targetDT] ?? "#6b7280", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", flexShrink: 0 }}>
                            {DISPLAY_TYPE_META[applyConf.targetDT]?.icon ?? "?"}
                          </span>
                          <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Applied question links */}
            {appliedIds.map((qid) => {
              const linkedQ = questions.find((q) => q.id === qid);
              if (!linkedQ) return null;
              const qTypeMeta = INPUT_TYPE_CONFIG.find((c) => c.type === linkedQ.type);
              return (
                <div key={qid} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "#f9fafb", borderRadius: 6, border: "1px solid #e5e7eb", marginBottom: 4, marginTop: 4 }}>
                  <span style={{ width: 18, height: 18, background: qTypeMeta?.bg ?? "#6b7280", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", flexShrink: 0 }}>
                    {qTypeMeta?.icon ?? "?"}
                  </span>
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{linkedQ.name}</span>
                  <button onClick={() => onChange({ ...layer, applyOn: appliedIds.filter((id) => id !== qid) })}
                    style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 16, padding: 0, lineHeight: 1, flexShrink: 0 }}>×</button>
                </div>
              );
            })}
          </div>
        )}

        {/* Create */}
        {createItems.length > 0 && (
          <div style={{ borderTop: applyConf ? "1px solid #f3f4f6" : "none", paddingTop: applyConf ? 12 : 0 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Create</span>
            {createItems.map(({ type, label }) => {
              const meta = DISPLAY_TYPE_META[type] ?? { label, icon: "?" };
              const linkedQ = type === "color"
                ? questions.find((q) => q.type === "thumbnail" && (q as ThumbnailQuestion).displayType === "color" && ((q as any).applyOn ?? []).includes(layer.id))
                : null;
              return (
                <div key={type} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 6, marginBottom: 5, background: linkedQ ? "#f0fdf4" : "#fafafa" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 22, height: 22, background: LAYER_DISPLAY_COLORS[type] ?? "#6b7280", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 700, flexShrink: 0 }}>{meta.icon}</span>
                    <span style={{ fontSize: 13, color: "#374151" }}>{linkedQ ? linkedQ.name : label}</span>
                    {linkedQ && <span style={{ fontSize: 10, color: "#16a34a", fontWeight: 600 }}>linked</span>}
                  </div>
                  <button onClick={() => onAddLinkedLayer(type, layer.id)}
                    style={{ background: "none", border: "none", color: linkedQ ? "#16a34a" : "#374151", cursor: "pointer", fontSize: linkedQ ? 14 : 20, fontWeight: 700, padding: "0 4px", lineHeight: 1 }}>
                    {linkedQ ? "→" : "+"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Layer editor (dispatch + fallback for legacy layers) ────────────────────

function OldLayerEditor({ layer, numViews, onChange }: { layer: LayerConfig; numViews: number; onChange: (updated: LayerConfig) => void }) {
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

function LayerEditorComp({ layer, numViews, onChange, layers, questions, onAddLinkedLayer, onConvertToQuestion, onCreateAndLinkQuestion, onAnswerPreview }: {
  layer: LayerConfig; numViews: number;
  onChange: (updated: LayerConfig) => void;
  layers: LayerConfig[];
  questions: Question[];
  onAddLinkedLayer: (displayType: string, sourceId: string) => void;
  onConvertToQuestion: (layer: LayerConfig, inputType: InputType) => void;
  onCreateAndLinkQuestion: (inputType: InputType, layerId: string) => void;
  onAnswerPreview?: (idx: number | null) => void;
}) {
  if (!layer.displayType) return <OldLayerEditor layer={layer} numViews={numViews} onChange={onChange} />;
  return (
    <NewLayerEditor
      layer={layer} layers={layers} questions={questions} numViews={numViews}
      onChange={onChange}
      onConvertToQuestion={onConvertToQuestion}
      onCreateAndLinkQuestion={onCreateAndLinkQuestion}
      onAddLinkedLayer={onAddLinkedLayer}
      onAnswerPreview={onAnswerPreview}
    />
  );
}

// ─── Universal Input type + Display type row (for all question types) ────────

function UniversalInputDisplayRow({ q, onChange, onSwitchType }: {
  q: Question;
  onChange: (updated: Question) => void;
  onSwitchType: (type: InputType) => void;
}) {
  const [showInputDD, setShowInputDD] = useState(false);
  const [showDisplayDD, setShowDisplayDD] = useState(false);

  const dtList = DISPLAY_TYPE_MAP[q.type] ?? ["none"];
  const hasDisplayChoice = dtList.length > 1;
  const currentDT = (q as any).displayType ?? dtList[0] ?? "none";
  const currentTypeMeta = INPUT_TYPE_CONFIG.find((c) => c.type === q.type);
  const currentDTMeta = DISPLAY_TYPE_META[currentDT] ?? { label: currentDT, icon: "?" };

  return (
    <div style={{ borderTop: "1px solid #f3f4f6" }}>
      {/* Input type */}
      <div style={{ padding: "12px 16px", borderBottom: hasDisplayChoice ? "1px solid #f3f4f6" : "none" }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Input type</label>
        <div style={{ position: "relative" }}>
          <button onClick={() => { setShowInputDD((v) => !v); setShowDisplayDD(false); }}
            style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#f9fafb", cursor: "pointer", fontSize: 13, boxSizing: "border-box" }}>
            <span style={{ width: 22, height: 22, background: currentTypeMeta?.bg ?? "#6b7280", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 700, flexShrink: 0 }}>{currentTypeMeta?.icon ?? "?"}</span>
            <span style={{ flex: 1, textAlign: "left", color: "#374151" }}>{currentTypeMeta?.label ?? q.type}</span>
            <span style={{ fontSize: 10, color: "#9ca3af" }}>▼</span>
          </button>
          {showInputDD && (
            <div style={{ position: "absolute", left: 0, right: 0, top: "calc(100% + 2px)", zIndex: 60, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", maxHeight: 280, overflowY: "auto" }}>
              {INPUT_TYPE_CONFIG.map(({ type, label, bg, icon }) => (
                <button key={type} onClick={() => { if (type !== q.type) onSwitchType(type); setShowInputDD(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 14px", border: "none", background: type === q.type ? "#eff6ff" : "none", cursor: "pointer", fontSize: 13, boxSizing: "border-box" }}>
                  <span style={{ width: 22, height: 22, background: bg, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 700, flexShrink: 0 }}>{icon}</span>
                  <span style={{ flex: 1, textAlign: "left", color: "#374151" }}>{label}</span>
                  {type === q.type && <span style={{ color: "#22c55e", fontSize: 12 }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Display type */}
      {hasDisplayChoice && (
        <div style={{ padding: "12px 16px" }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Display type</label>
          <div style={{ position: "relative" }}>
            <button onClick={() => { setShowDisplayDD((v) => !v); setShowInputDD(false); }}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#f9fafb", cursor: "pointer", fontSize: 13, boxSizing: "border-box" }}>
              <span style={{ width: 22, height: 22, background: "#f3f4f6", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#374151", flexShrink: 0 }}>{currentDTMeta.icon}</span>
              <span style={{ flex: 1, textAlign: "left", color: "#374151" }}>{currentDTMeta.label}</span>
              <span style={{ fontSize: 10, color: "#9ca3af" }}>▼</span>
            </button>
            {showDisplayDD && (
              <div style={{ position: "absolute", left: 0, right: 0, top: "calc(100% + 2px)", zIndex: 60, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", maxHeight: 280, overflowY: "auto" }}>
                {dtList.map((dt) => {
                  const meta = DISPLAY_TYPE_META[dt] ?? { label: dt, icon: "?" };
                  return (
                    <button key={dt} onClick={() => { onChange({ ...q, displayType: dt } as any); setShowDisplayDD(false); }}
                      style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 14px", border: "none", background: dt === currentDT ? "#eff6ff" : "none", cursor: "pointer", fontSize: 13, boxSizing: "border-box" }}>
                      <span style={{ width: 22, height: 22, background: "#f3f4f6", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#374151", flexShrink: 0 }}>{meta.icon}</span>
                      <span style={{ flex: 1, textAlign: "left" }}>
                        {meta.label}
                        {meta.desc && <span style={{ display: "block", fontSize: 10, color: "#9ca3af" }}>{meta.desc}</span>}
                      </span>
                      {dt === currentDT && <span style={{ color: "#22c55e", fontSize: 12 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Logic Rule Components ────────────────────────────────────────────────────

const selSt: React.CSSProperties = {
  padding: "5px 8px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13,
  background: "#fff", cursor: "pointer", outline: "none",
};

function LogicRuleEditor({
  questions,
  layers,
  onSave,
  onCancel,
  initialRule,
}: {
  questions: Question[];
  layers: LayerConfig[];
  onSave: (rule: LogicRule) => void;
  onCancel: () => void;
  initialRule?: LogicRule;
}) {
  const firstCond = initialRule?.conditions[0];
  const firstAction = initialRule?.actions[0];

  const behindLayers = layers.filter((l) => l.type !== "glb-part");
  const defaultId = questions[0]?.id ?? behindLayers[0]?.id ?? "";

  const [condQId, setCondQId] = useState(firstCond?.questionId ?? defaultId);
  const [condOp, setCondOp] = useState<LogicOperator>(firstCond?.operator ?? "is");
  const [condVal, setCondVal] = useState(firstCond?.value ?? "");
  const [actionQId, setActionQId] = useState(firstAction?.questionId ?? defaultId);
  const [actionEffect, setActionEffect] = useState<LogicEffect>(firstAction?.effect ?? "should_be_unavailable");
  const [actionVal, setActionVal] = useState(firstAction?.value ?? "");
  const isEditing = !!initialRule;

  const condQ = questions.find((q) => q.id === condQId);
  const condLayer = !condQ ? behindLayers.find((l) => l.id === condQId) : undefined;
  const actionQ = questions.find((q) => q.id === actionQId);
  const condAnswers = condQ
    ? getQuestionAnswers(condQ)
    : (condLayer?.answers ?? []).map((a) => ({ value: a.id, label: a.label }));
  const actionQ2 = !actionQ ? behindLayers.find((l) => l.id === actionQId) : undefined;
  const actionAnswers = actionQ
    ? getQuestionAnswers(actionQ)
    : (actionQ2?.answers ?? []).map((a) => ({ value: a.id, label: a.label }));

  const needsActionValue = actionEffect !== "should_be_unavailable";
  const canSave = condQId && condVal && actionQId && (!needsActionValue || actionVal);

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      id: initialRule?.id ?? `rule-${Date.now()}`,
      conditions: [{ questionId: condQId, operator: condOp, value: condVal }],
      actions: [{ questionId: actionQId, effect: actionEffect, value: needsActionValue ? actionVal : undefined }],
    });
  };

  return (
    <div style={{ background: "#fff", border: "1.5px solid #2563eb", borderRadius: 8, padding: "14px 16px", margin: "0 0 12px" }}>
      {isEditing && <div style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Edit rule</div>}
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>When</span>

        <select value={condQId} onChange={(e) => { setCondQId(e.target.value); setCondVal(""); }} style={selSt}>
          <optgroup label="Questions">
            {questions.map((q) => <option key={q.id} value={q.id}>{q.name}</option>)}
          </optgroup>
          {behindLayers.length > 0 && (
            <optgroup label="Behind the Scene">
              {behindLayers.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </optgroup>
          )}
        </select>

        <select value={condOp} onChange={(e) => setCondOp(e.target.value as LogicOperator)} style={selSt}>
          <option value="is">is</option>
          <option value="is_not">is not</option>
          <option value="matches">matches</option>
          <option value="doesnt_match">doesn't match</option>
        </select>

        <select value={condVal} onChange={(e) => setCondVal(e.target.value)} style={selSt}>
          <option value="">— Answer —</option>
          {condAnswers.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>

        <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>then</span>

        <select value={actionQId} onChange={(e) => { setActionQId(e.target.value); setActionVal(""); }} style={selSt}>
          <optgroup label="Questions">
            {questions.map((q) => <option key={q.id} value={q.id}>{q.name}</option>)}
          </optgroup>
          {behindLayers.length > 0 && (
            <optgroup label="Behind the Scene">
              {behindLayers.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </optgroup>
          )}
        </select>

        <select value={actionEffect} onChange={(e) => setActionEffect(e.target.value as LogicEffect)} style={selSt}>
          <option value="should_be">should be</option>
          <option value="should_not_be">should not be</option>
          <option value="should_be_unavailable">should be unavailable</option>
          <option value="should_be_one_of">should be one of</option>
          <option value="should_not_be_one_of">should not be one of</option>
        </select>

        {needsActionValue && (
          <select value={actionVal} onChange={(e) => setActionVal(e.target.value)} style={selSt}>
            <option value="">— Answer —</option>
            {actionAnswers.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={{ ...smallBtnSt, background: "none", border: "1px solid #e5e7eb" }}>Cancel</button>
        <button
          onClick={handleSave}
          disabled={!canSave}
          style={{ background: canSave ? "#2563eb" : "#9ca3af", color: "#fff", border: "none", borderRadius: 6, padding: "6px 18px", cursor: canSave ? "pointer" : "default", fontSize: 13, fontWeight: 600 }}
        >
          {isEditing ? "Save" : "Add"}
        </button>
      </div>
    </div>
  );
}

function ruleToText(rule: LogicRule, questions: Question[], layers: LayerConfig[] = []): string {
  const getQName = (id: string) =>
    questions.find((q) => q.id === id)?.name ?? layers.find((l) => l.id === id)?.name ?? id;
  const getAnswerLabel = (qId: string, val: string) => {
    const q = questions.find((q) => q.id === qId);
    if (q) return getQuestionAnswers(q).find((a) => a.value === val)?.label ?? val;
    const l = layers.find((l) => l.id === qId);
    return l?.answers?.find((a) => a.id === val)?.label ?? val;
  };
  const EFFECT_LABELS: Record<LogicEffect, string> = {
    should_be: "should be",
    should_not_be: "should not be",
    should_be_unavailable: "should be unavailable",
    should_be_one_of: "should be one of",
    should_not_be_one_of: "should not be one of",
  };
  const OP_LABELS: Record<LogicOperator, string> = {
    is: "is", is_not: "is not", matches: "matches", doesnt_match: "doesn't match",
  };
  const condParts = rule.conditions.map(
    (c) => `${getQName(c.questionId)} ${OP_LABELS[c.operator]} ${getAnswerLabel(c.questionId, c.value)}`
  );
  const actionParts = rule.actions.map(
    (a) => `${getQName(a.questionId)} ${EFFECT_LABELS[a.effect]}${a.value ? ` ${getAnswerLabel(a.questionId, a.value)}` : ""}`
  );
  return `When ${condParts.join(" and ")} then ${actionParts.join(" and ")}`;
}

const actionIconSt: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer", padding: "7px 11px",
  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
};

function LogicPanel({
  rules,
  questions,
  layers,
  onChange,
  onBack,
}: {
  rules: LogicRule[];
  questions: Question[];
  layers: LayerConfig[];
  onChange: (rules: LogicRule[]) => void;
  onBack: () => void;
}) {
  const [addingNew, setAddingNew] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [hoveredRuleId, setHoveredRuleId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = rules.filter((r) =>
    !search || ruleToText(r, questions, layers).toLowerCase().includes(search.toLowerCase())
  );

  const handleStartAdd = () => { setAddingNew(true); setEditingRuleId(null); };
  const handleStartEdit = (id: string) => { setEditingRuleId(id); setAddingNew(false); };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fff", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ height: 44, borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", padding: "0 20px", gap: 12, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#6b7280", padding: 0, display: "flex", alignItems: "center" }}>←</button>
        <span style={{ fontWeight: 700, fontSize: 14 }}>Logic</span>
        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={handleStartAdd}
            style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, padding: "6px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
          >
            + Add rule
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ padding: "10px 20px", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search rules..."
          style={{ width: "100%", padding: "7px 12px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13, boxSizing: "border-box", outline: "none" }}
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
        {addingNew && (
          <LogicRuleEditor
            questions={questions}
            layers={layers}
            onSave={(rule) => { onChange([...rules, rule]); setAddingNew(false); }}
            onCancel={() => setAddingNew(false)}
          />
        )}

        {filtered.length === 0 && !addingNew && (
          <div style={{ textAlign: "center", color: "#9ca3af", padding: "60px 20px" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚙</div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>
              No logic rules yet. Click <strong>+ Add rule</strong> to create your first conditional rule.
            </p>
          </div>
        )}

        {filtered.map((rule) => (
          <div key={rule.id}>
            {editingRuleId === rule.id ? (
              <LogicRuleEditor
                questions={questions}
                layers={layers}
                initialRule={rule}
                onSave={(updated) => {
                  onChange(rules.map((r) => r.id === rule.id ? updated : r));
                  setEditingRuleId(null);
                }}
                onCancel={() => setEditingRuleId(null)}
              />
            ) : (
              <div
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderBottom: "1px solid #f3f4f6", position: "relative" }}
                onMouseEnter={() => setHoveredRuleId(rule.id)}
                onMouseLeave={() => setHoveredRuleId(null)}
              >
                <span style={{ flex: 1, fontSize: 13, color: "#374151", lineHeight: 1.5, paddingRight: hoveredRuleId === rule.id ? 112 : 0 }}>
                  {ruleToText(rule, questions, layers)}
                </span>

                {hoveredRuleId === rule.id && (
                  <div style={{ position: "absolute", right: 0, display: "flex", alignItems: "center", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 2px 10px rgba(0,0,0,0.1)", overflow: "hidden", flexShrink: 0 }}>
                    <button
                      onClick={() => onChange([...rules, { ...rule, id: `rule-${Date.now()}` }])}
                      style={{ ...actionIconSt, color: "#6b7280", borderRight: "1px solid #e5e7eb" }}
                      title="Duplicate"
                    >
                      ⎘
                    </button>
                    <button
                      onClick={() => handleStartEdit(rule.id)}
                      style={{ ...actionIconSt, color: "#6b7280", borderRight: "1px solid #e5e7eb" }}
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => onChange(rules.filter((r) => r.id !== rule.id))}
                      style={{ ...actionIconSt, color: "#ef4444" }}
                      title="Delete"
                    >
                      🗑
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Text canvas toolbar ─────────────────────────────────────────────────────

function AlignLeftIcon() {
  return (
    <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
      <rect x="1" y="1" width="14" height="2" rx="1" fill="currentColor"/>
      <rect x="1" y="5" width="9" height="2" rx="1" fill="currentColor"/>
      <rect x="1" y="9" width="11" height="2" rx="1" fill="currentColor"/>
    </svg>
  );
}
function AlignCenterIcon() {
  return (
    <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
      <rect x="1" y="1" width="14" height="2" rx="1" fill="currentColor"/>
      <rect x="3.5" y="5" width="9" height="2" rx="1" fill="currentColor"/>
      <rect x="2.5" y="9" width="11" height="2" rx="1" fill="currentColor"/>
    </svg>
  );
}
function AlignRightIcon() {
  return (
    <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
      <rect x="1" y="1" width="14" height="2" rx="1" fill="currentColor"/>
      <rect x="6" y="5" width="9" height="2" rx="1" fill="currentColor"/>
      <rect x="4" y="9" width="11" height="2" rx="1" fill="currentColor"/>
    </svg>
  );
}

function TextCanvasToolbar({ tq, onUpdate }: { tq: TextQuestion; onUpdate: (q: Question) => void }) {
  const pa = tq.printArea;
  const rotVal = pa ? (pa.rotation ?? 0) : (tq.rotation ?? 0);

  const handleRot = (v: number) => {
    if (pa) onUpdate({ ...tq, printArea: { ...pa, rotation: v } });
    else onUpdate({ ...tq, rotation: v });
  };

  const FONTS = ["Arial", "Georgia", "Impact", "Verdana", "Courier New", "Times New Roman"];

  return (
    <div style={{ height: 44, background: "#fff", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", padding: "0 12px", gap: 2, flexShrink: 0, overflowX: "auto" }}>

      {/* Decorative transform mode icons */}
      <button style={toolbarBtnSt} title="Move">✥</button>
      <button style={toolbarBtnSt} title="Rotate">↻</button>
      <button style={toolbarBtnSt} title="Resize">⤢</button>

      <div style={toolbarDividerSt} />

      {/* Text alignment */}
      {(["left", "center", "right"] as const).map((align) => {
        const isActive = (tq.textAlign ?? "left") === align;
        return (
          <button
            key={align}
            onClick={() => onUpdate({ ...tq, textAlign: align })}
            title={`Align ${align}`}
            style={{ ...toolbarBtnSt, background: isActive ? "#f3f4f6" : "transparent", border: isActive ? "1px solid #d1d5db" : "1px solid transparent", color: isActive ? "#111827" : "#6b7280" }}
          >
            {align === "left" && <AlignLeftIcon />}
            {align === "center" && <AlignCenterIcon />}
            {align === "right" && <AlignRightIcon />}
          </button>
        );
      })}

      <div style={toolbarDividerSt} />

      {/* Color picker */}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <button
          style={{ ...toolbarBtnSt, position: "relative", overflow: "visible" }}
          onClick={() => (document.getElementById(`tbar-color-${tq.id}`) as HTMLInputElement)?.click()}
          title="Text color"
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: tq.defaultColor || "#000", lineHeight: 1 }}>A</span>
          <span style={{ position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)", width: 14, height: 3, borderRadius: 1, background: tq.defaultColor || "#000" }} />
        </button>
        <input
          id={`tbar-color-${tq.id}`}
          type="color"
          value={tq.defaultColor || "#000000"}
          onChange={(e) => onUpdate({ ...tq, defaultColor: e.target.value })}
          style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }}
        />
      </div>

      <div style={toolbarDividerSt} />

      {/* Font family */}
      <select
        value={tq.defaultFontFamily}
        onChange={(e) => onUpdate({ ...tq, defaultFontFamily: e.target.value })}
        style={{ height: 28, border: "1px solid #e5e7eb", borderRadius: 4, fontSize: 12, padding: "0 6px", background: "#fff", cursor: "pointer", maxWidth: 130 }}
        title="Font family"
      >
        {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
      </select>

      <div style={toolbarDividerSt} />

      {/* Font size */}
      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>A</span>
        <input
          type="number"
          value={tq.defaultFontSize}
          onChange={(e) => onUpdate({ ...tq, defaultFontSize: Math.max(6, Number(e.target.value)) })}
          min={6} max={300}
          style={{ width: 48, height: 28, border: "1px solid #e5e7eb", borderRadius: 4, fontSize: 12, padding: "0 4px", textAlign: "center" }}
          title="Font size"
        />
        <span style={{ fontSize: 11, color: "#9ca3af" }}>px</span>
      </div>

      <div style={toolbarDividerSt} />

      {/* Rotation — targets pa.rotation when print area exists, tq.rotation for bare text */}
      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "#6b7280", flexShrink: 0 }}>
          <path d="M2 7a5 5 0 1 0 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M7 2 5.5 3.5 7 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <input
          type="number"
          value={rotVal}
          onChange={(e) => handleRot(Number(e.target.value))}
          min={-360} max={360}
          style={{ width: 52, height: 28, border: "1px solid #e5e7eb", borderRadius: 4, fontSize: 12, padding: "0 4px", textAlign: "center" }}
          title="Rotation °"
        />
        <span style={{ fontSize: 11, color: "#9ca3af" }}>°</span>
      </div>

    </div>
  );
}

// ─── Main builder page ────────────────────────────────────────────────────────

export default function BuilderPage() {
  const { product, config } = useLoaderData() as any;
  const actionData = useActionData() as any;
  const submit = useSubmit();
  const navigate = useNavigate();
  const navigation = useNavigation();

  const existingOptions = config?.options as any;

  const [leftTab, setLeftTab] = useState<"layers" | "settings" | "model">("layers");
  const [modelMode, setModelMode] = useState<boolean>((existingOptions?.modelMode as boolean) ?? false);
  const [glbUrl, setGlbUrl] = useState<string | undefined>(existingOptions?.glbUrl as string | undefined);
  const [customTitle, setCustomTitle] = useState<string>(product.title ?? "");
  const [productStatus, setProductStatus] = useState<string>(product.status ?? "DRAFT");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const statusFetcher = useFetcher<{ statusUpdated?: boolean; status?: string; publishError?: string }>();
  const [canvasW, setCanvasW] = useState<number>((existingOptions?.canvasW as number) ?? CANVAS_SIZE);
  const [canvasH, setCanvasH] = useState<number>((existingOptions?.canvasH as number) ?? CANVAS_SIZE);

  const [layers, setLayers] = useState<LayerConfig[]>((config?.layers as LayerConfig[]) ?? []);
  const [questions, setQuestions] = useState<Question[]>(
    () => migrateOptions(existingOptions, (config?.layers as LayerConfig[]) ?? []) || [],
  );
  const [logicRules, setLogicRules] = useState<LogicRule[]>((existingOptions?.logicRules as LogicRule[]) ?? []);
  const [showLogicPanel, setShowLogicPanel] = useState(false);

  type Sel = { kind: "question" | "layer"; id: string } | null;
  const [selected, setSelected] = useState<Sel>(null);
  const [mounted, setMounted] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const [numViews, setNumViews] = useState<number>((existingOptions?.numViews as number) ?? 1);
  const [viewNames, setViewNames] = useState<string[]>(() => {
    const saved = existingOptions?.viewNames as string[] | undefined;
    const n = (existingOptions?.numViews as number) ?? 1;
    const defaults = ["Front", "Back", "Side", "Detail"];
    return Array.from({ length: n }, (_, i) => saved?.[i] || defaults[i] || `View ${i + 1}`);
  });
  const [currentView, setCurrentView] = useState(0);
  const [answerEditState, setAnswerEditState] = useState<{ questionId: string; answerIdx: number } | null>(null);
  const [editingPrintAreaId, setEditingPrintAreaId] = useState<string | null>(null);
  const [layerPreviewAnswerIdx, setLayerPreviewAnswerIdx] = useState<Record<string, number>>({});
  const [labelPreviewImages, setLabelPreviewImages] = useState<(string | null)[] | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [addToGroupId, setAddToGroupId] = useState<string | null>(null);

  const toggleGroup = (id: string) => setExpandedGroups((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const [dragQId, setDragQId] = useState<string | null>(null);
  const [dragOverQId, setDragOverQId] = useState<string | null>(null);
  const [dragLId, setDragLId] = useState<string | null>(null);
  const [dragOverLId, setDragOverLId] = useState<string | null>(null);
  const [pendingPreview, setPendingPreview] = useState(false);

  const handleLDragStart = (id: string) => setDragLId(id);
  const handleLDragOver = (e: React.DragEvent, id: string) => { e.preventDefault(); setDragOverLId(id); };
  const handleLDrop = (targetId: string) => {
    if (!dragLId || dragLId === targetId) { setDragLId(null); setDragOverLId(null); return; }
    setLayers((prev) => {
      const from = prev.findIndex((l) => l.id === dragLId);
      const to = prev.findIndex((l) => l.id === targetId);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      const [removed] = next.splice(from, 1);
      next.splice(to, 0, removed);
      return next;
    });
    setDragLId(null); setDragOverLId(null);
  };
  const handleLDragEnd = () => { setDragLId(null); setDragOverLId(null); };

  const handleQDragStart = (id: string) => setDragQId(id);
  const handleQDragOver = (e: React.DragEvent, id: string) => { e.preventDefault(); setDragOverQId(id); };
  const handleQDrop = (targetId: string) => {
    if (!dragQId || dragQId === targetId) { setDragQId(null); setDragOverQId(null); return; }
    const targetQ = questions.find((q) => q.id === targetId);
    if (targetQ?.type === "group") {
      // Drop ON group header → add to end
      setQuestions((prev) => prev.map((q) => {
        if (q.type !== "group") return q;
        if (q.id === targetId) {
          if ((q as GroupQuestion).childIds.includes(dragQId)) return q;
          return { ...q, childIds: [...(q as GroupQuestion).childIds, dragQId] };
        }
        return { ...q, childIds: (q as GroupQuestion).childIds.filter((id) => id !== dragQId) };
      }));
      setExpandedGroups((prev) => new Set([...prev, targetId]));
    } else {
      // Check if target is a child inside a group
      const targetGroup = questions.find(
        (q): q is GroupQuestion => q.type === "group" && (q as GroupQuestion).childIds.includes(targetId)
      );
      if (targetGroup) {
        // Reorder within that group (or move into it at the target position)
        const newChildIds = [...targetGroup.childIds];
        if (newChildIds.includes(dragQId)) newChildIds.splice(newChildIds.indexOf(dragQId), 1);
        newChildIds.splice(newChildIds.indexOf(targetId), 0, dragQId);
        setQuestions((prev) => prev.map((q) => {
          if (q.type !== "group") return q;
          if (q.id === targetGroup.id) return { ...q, childIds: newChildIds };
          return { ...q, childIds: (q as GroupQuestion).childIds.filter((id) => id !== dragQId) };
        }));
        setExpandedGroups((prev) => new Set([...prev, targetGroup.id]));
      } else {
        // Target is top-level → reorder top-level, remove from any group
        const dragIdx = questions.findIndex((q) => q.id === dragQId);
        const targetIdx = questions.findIndex((q) => q.id === targetId);
        if (dragIdx === -1 || targetIdx === -1) { setDragQId(null); setDragOverQId(null); return; }
        const next = [...questions];
        const [removed] = next.splice(dragIdx, 1);
        const newTarget = next.findIndex((q) => q.id === targetId);
        next.splice(newTarget + 1, 0, removed);
        setQuestions(next.map((q) =>
          q.type === "group" ? { ...q, childIds: (q as GroupQuestion).childIds.filter((id) => id !== dragQId) } : q
        ));
      }
    }
    setDragQId(null);
    setDragOverQId(null);
  };
  const handleQDragEnd = () => { setDragQId(null); setDragOverQId(null); };

  const [showAddLayerModal, setShowAddLayerModal] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (statusFetcher.data?.statusUpdated && statusFetcher.data.status) {
      setProductStatus(statusFetcher.data.status);
    }
  }, [statusFetcher.data]);
  useEffect(() => {
    setAnswerEditState(null);
    setEditingPrintAreaId(null);
    if (selected?.kind === "question") {
      const q = questions.find((q) => q.id === selected.id);
      if (q?.type === "text") {
        const pa = (q as TextQuestion).printArea;
        if (pa && pa.visibleViews.length > 0) {
          setCurrentView(Math.min(pa.visibleViews[0] - 1, numViews - 1));
        }
      }
    }
  }, [selected?.id]);

  // Swatch preview state — starts empty so layers render their natural uploaded PNG.
  // Updated when user clicks a swatch in the right panel for a live color preview.
  const [selectedSwatches, setSelectedSwatches] = useState<Record<string, string>>({});

  const canvasColors = useMemo(() => {
    const c: Record<string, string> = {};
    for (const q of questions) {
      const isImageThumbnail = q.type === "thumbnail" && ((q as any).displayType ?? "image") === "image";
      if (isImageThumbnail) continue;
      if (q.type === "color" || q.type === "thumbnail") {
        const linkedLayerId = (q as any).linkedLayerId as string | undefined;
        const applyOn = (q as any).applyOn as string[] | undefined;
        const layerIds: string[] = linkedLayerId ? [linkedLayerId, ...(applyOn ?? [])] : (applyOn ?? []);
        if (!layerIds.length) continue;
        const picked = selectedSwatches[q.id];
        if (picked) { for (const lid of layerIds) c[lid] = picked; }
      }
    }
    return c;
  }, [questions, selectedSwatches]);

  const canvasTextures = useMemo(() => {
    const t: Record<string, string> = {};
    for (const q of questions) {
      const isImageThumbnail = q.type === "thumbnail" && ((q as any).displayType ?? "image") === "image";
      if (isImageThumbnail) continue;
      if (q.type === "color" || q.type === "thumbnail") {
        const linkedLayerId = (q as any).linkedLayerId as string | undefined;
        const applyOn = (q as any).applyOn as string[] | undefined;
        const layerIds: string[] = linkedLayerId ? [linkedLayerId, ...(applyOn ?? [])] : (applyOn ?? []);
        if (!layerIds.length) continue;
        const pickedVal = selectedSwatches[q.id];
        if (pickedVal) {
          const swatch = q.swatches.find((s) => s.value === pickedVal);
          if (swatch?.imageUrl) { for (const lid of layerIds) t[lid] = swatch.imageUrl; }
        }
      }
    }
    return t;
  }, [questions, selectedSwatches]);

  // Derives 3D preview customizations from canvasColors/canvasTextures, filtered to GLB parts only.
  const adminPreviewCustomizations = useMemo(() => {
    const glbIds = new Set(layers.filter((l) => l.type === "glb-part").map((l) => l.id));
    const result: Record<string, PartCustomization> = {};
    for (const [id, color] of Object.entries(canvasColors)) {
      if (glbIds.has(id)) result[id] = { ...result[id], color };
    }
    for (const [id, textureUrl] of Object.entries(canvasTextures)) {
      if (glbIds.has(id)) result[id] = { ...result[id], textureUrl };
    }
    return result;
  }, [layers, canvasColors, canvasTextures]);

  // Image-type thumbnail questions swap the entire layer src per selected answer.
  const canvasImageOverrides = useMemo(() => {
    const o: Record<string, string[]> = {};
    for (const q of questions) {
      if (q.type !== "thumbnail" || ((q as any).displayType ?? "image") !== "image") continue;
      const linkedLayerId = (q as any).linkedLayerId as string | undefined;
      const applyOn = (q as any).applyOn as string[] | undefined;
      const layerIds: string[] = linkedLayerId ? [linkedLayerId, ...(applyOn ?? [])] : (applyOn ?? []);
      if (!layerIds.length) continue;
      const picked = selectedSwatches[q.id];
      if (!picked) continue;
      const swatch = q.swatches.find((s) => s.value === picked);
      if (swatch?.viewImages?.length) {
        const viewArr = swatch.viewImages.map((v) => v || "");
        for (const lid of layerIds) o[lid] = viewArr;
      }
    }
    return o;
  }, [questions, selectedSwatches]);

  const textItems = useMemo(() => questions.filter((q): q is TextQuestion => q.type === "text"), [questions]);
  const filePlaceholders = useMemo(() => questions.filter((q): q is Question & { type: "file" } => q.type === "file"), [questions]);

  // Compute display dimensions that preserve the canvas aspect ratio, capped at CANVAS_SIZE
  const aspectRatio = canvasW / canvasH;
  const displayW = aspectRatio >= 1 ? CANVAS_SIZE : Math.round(CANVAS_SIZE * aspectRatio);
  const displayH = aspectRatio <= 1 ? CANVAS_SIZE : Math.round(CANVAS_SIZE / aspectRatio);
  const canvasDisplayScale = displayW / canvasW;
  // S maps text/logo positions from 800px logical space → canvas pixel space
  const S = canvasW / 800;

  // Konva refs for drag/rotate
  const textNodeRefs = useRef<Record<string, any>>({});
  const logoNodeRefs = useRef<Record<string, any>>({});
  const printAreaGroupRefs = useRef<Record<string, any>>({});
  const transformerRef = useRef<any>(null);
  const printAreaTransformerRef = useRef<any>(null);

  // Attach transformer to the selected text or logo node
  useEffect(() => {
    const selQ = selected?.kind === "question" ? questions.find((q) => q.id === selected.id) : null;
    const isTextWithPA = selQ?.type === "text" && !!(selQ as TextQuestion).printArea;
    const isTextNoPA = selQ?.type === "text" && !(selQ as TextQuestion).printArea;
    const isLogo = selQ?.type === "file" && (selQ as FileQuestion).displayType === "logo";
    if (isTextWithPA) {
      transformerRef.current?.nodes([]);
      transformerRef.current?.getLayer()?.batchDraw();
    } else if (isTextNoPA && transformerRef.current && textNodeRefs.current[selQ!.id]) {
      transformerRef.current.nodes([textNodeRefs.current[selQ!.id]]);
      transformerRef.current.getLayer()?.batchDraw();
    } else if (isLogo && transformerRef.current && logoNodeRefs.current[selQ!.id]) {
      transformerRef.current.nodes([logoNodeRefs.current[selQ!.id]]);
      transformerRef.current.getLayer()?.batchDraw();
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selected, questions]);

  // Attach print-area transformer to the active print area group
  useEffect(() => {
    if (!printAreaTransformerRef.current) return;
    const node = editingPrintAreaId ? printAreaGroupRefs.current[editingPrintAreaId] : null;
    printAreaTransformerRef.current.nodes(node ? [node] : []);
    printAreaTransformerRef.current.getLayer()?.batchDraw();
  }, [editingPrintAreaId, selected]);

  // CRUD helpers
  const updateQ = (u: Question) => setQuestions((p) => p.map((q) => (q.id === u.id ? u : q)));
  const removeQ = (id: string) => {
    setQuestions((p) => p
      .filter((q) => q.id !== id)
      .map((q) => q.type === "group" ? { ...q, childIds: (q as GroupQuestion).childIds.filter((cid) => cid !== id) } : q)
    );
    if (selected?.id === id) setSelected(null);
  };
  const duplicateQ = (id: string) => {
    const src = questions.find((q) => q.id === id);
    if (!src) return;
    const newId = `${src.type}-${Date.now()}`;
    setQuestions((p) => [...p, { ...src, id: newId, name: `${src.name} (copy)` }]);
  };

  const addQuestion = (type: InputType, displayType: string) => {
    const id = `${type}-${Date.now()}`;
    let q: Question;

    switch (type) {
      case "color": {
        if (displayType === "color") {
          const first = layers.find((l) => l.type === "colorable");
          if (!first) { alert("Add a colorable layer first."); return; }
          q = { id, name: "Color Option", type: "color", displayType: "color", linkedLayerId: first.id, swatches: [] };
        } else {
          q = { id, name: "Color Option", type: "color", displayType: displayType as "none" | "text-color", swatches: [] };
        }
        break;
      }
      case "thumbnail":
        q = { id, name: "Untitled image", type: "thumbnail", displayType: displayType as any, swatches: [] };
        break;
      case "text":
        q = { id, name: "Custom Text", type: "text", displayType: (displayType as "none" | "text") || "text", defaultText: "Your Name", defaultColor: "#ffffff", defaultFontSize: 38, defaultFontFamily: "Arial", position: { x: 200, y: 180 } };
        break;
      case "file":
        q = { id, name: "Untitled logo", type: "file", displayType: (displayType as "none" | "logo") || "logo", position: { x: 200, y: 280 }, defaultWidth: 120, defaultHeight: 120, printAreas: [], allowedTransforms: { move: true, resize: true, rotate: false } };
        break;
      case "dropdown":
        q = { id, name: "Select Option", type: "dropdown", displayType: (displayType === "image" ? "image" : "none") as "none" | "image", options: displayType === "image" ? [] : [{ value: "option-1", label: "Option 1" }] };
        break;
      case "radio":
        q = { id, name: "Choose Option", type: "radio", options: [{ value: "option-1", label: "Option 1" }] };
        break;
      case "checkbox":
        q = { id, name: "Add-on", type: "checkbox", checkedLabel: "Yes", uncheckedLabel: "No", defaultChecked: false };
        break;
      case "label":
        q = { id, name: "Type", type: "label", content: "", answers: [], displayType: displayType || "none", multipleSelection: false };
        break;
      case "group":
        q = { id, name: "Group", type: "group", childIds: [] };
        break;
      case "none":
        q = { id, name: "Static Element", type: "none", displayType: displayType || "image" };
        break;
      default:
        return;
    }

    if (addToGroupId) {
      const gid = addToGroupId;
      setQuestions((p) => {
        const updated = [...p, q];
        return updated.map((oq) => oq.id === gid ? { ...oq, childIds: [...(oq as GroupQuestion).childIds, id] } : oq);
      });
      setExpandedGroups((prev) => new Set([...prev, gid]));
    } else {
      setQuestions((p) => [...p, q]);
    }
    setSelected({ kind: "question", id });
  };

  const addTextSubQuestion = (subType: string, parentId: string) => {
    const id = `${subType}-${Date.now()}`;
    const subTypeMap: Record<string, Question> = {
      color:     { id, name: "Text color",    type: "color", displayType: "text-color", swatches: [] },
      font:      { id, name: "Font",          type: "dropdown", options: [{ value: "Arial", label: "Arial" }, { value: "Georgia", label: "Georgia" }, { value: "Impact", label: "Impact" }] },
      "font-size": { id, name: "Font size",   type: "dropdown", options: [{ value: "24", label: "24px" }, { value: "36", label: "36px" }, { value: "48", label: "48px" }, { value: "64", label: "64px" }] },
      outline:   { id, name: "Text outline",  type: "color", displayType: "text-outline" as any, swatches: [] },
    };
    const newQ = subTypeMap[subType];
    if (!newQ) return;
    setQuestions((p) => [...p, newQ]);
    setSelected({ kind: "question", id });
  };

  const switchQuestionType = (id: string, newType: InputType) => {
    const existingQ = questions.find((q) => q.id === id);
    if (!existingQ) return;
    const { name } = existingQ;
    let newQ: Question;
    switch (newType) {
      case "thumbnail": newQ = { id, name, type: "thumbnail", displayType: "image", swatches: [] }; break;
      case "dropdown":  newQ = { id, name, type: "dropdown", options: [{ value: "option-1", label: "Option 1" }] }; break;
      case "radio":     newQ = { id, name, type: "radio", options: [{ value: "option-1", label: "Option 1" }] }; break;
      case "checkbox":  newQ = { id, name, type: "checkbox", checkedLabel: "Yes", uncheckedLabel: "No", defaultChecked: false }; break;
      case "text":      newQ = { id, name, type: "text", defaultText: "Your Name", defaultColor: "#ffffff", defaultFontSize: 38, defaultFontFamily: "Arial", position: { x: 200, y: 180 } }; break;
      case "file":      newQ = { id, name, type: "file", displayType: "logo", position: { x: 200, y: 280 }, defaultWidth: 120, defaultHeight: 120, printAreas: [], allowedTransforms: { move: true, resize: true, rotate: false } }; break;
      case "color": {
        const first = layers.find((l) => l.type === "colorable");
        if (!first) { alert("Add a colorable layer first."); return; }
        newQ = { id, name, type: "color", linkedLayerId: first.id, swatches: [] }; break;
      }
      case "label": newQ = { id, name, type: "label", content: "", answers: [], displayType: "none" }; break;
      case "group": newQ = { id, name, type: "group", childIds: [] }; break;
      case "none":  newQ = { id, name, type: "none", displayType: "image" }; break;
      default: return;
    }
    setQuestions((p) => p.map((q) => (q.id === id ? newQ : q)));
  };

  const updateL = (u: LayerConfig) => setLayers((p) => p.map((l) => (l.id === u.id ? u : l)));
  const removeL = (id: string) => { setLayers((p) => p.filter((l) => l.id !== id)); if (selected?.id === id) setSelected(null); };
  const addNewLayer = (layerType: "static" | "colorable", displayType: string) => {
    const baseName = DISPLAY_TYPE_META[displayType]?.label ?? displayType;
    const id = `${displayType}-${Date.now()}`;
    setLayers((p) => [...p, { id, name: `Untitled ${baseName.toLowerCase()}`, type: layerType, src: "", displayType, answers: [] }]);
    setSelected({ kind: "layer", id });
  };

  const addLinkedLayer = (displayType: string, sourceId: string) => {
    if (displayType === "color") {
      // If a color question already references this layer, navigate to it instead of creating a duplicate
      const existing = questions.find((q) =>
        q.type === "thumbnail" &&
        (q as ThumbnailQuestion).displayType === "color" &&
        ((q as any).applyOn ?? []).includes(sourceId)
      );
      if (existing) {
        setSelected({ kind: "question", id: existing.id });
        return;
      }
      const count = questions.filter((q) => q.type === "thumbnail" && (q as ThumbnailQuestion).displayType === "color").length + 1;
      const id = `q-color-${Date.now()}`;
      const newQ: ThumbnailQuestion = {
        id,
        name: `Untitled Question ${count} colors`,
        type: "thumbnail",
        displayType: "color",
        swatches: [],
        applyOn: [sourceId],
      };
      setQuestions((p) => [...p, newQ]);
      setSelected({ kind: "question", id });
      return;
    }
    const baseName = DISPLAY_TYPE_META[displayType]?.label ?? displayType;
    const id = `${displayType}-${Date.now()}`;
    const count = layers.filter((l) => l.displayType === displayType).length + 1;
    setLayers((p) => [...p, { id, name: `Untitled ${baseName.toLowerCase()} ${count}`, type: "static", src: "", displayType, answers: [], applyOn: [sourceId] }]);
    setSelected({ kind: "layer", id });
  };

  const convertLayerToQuestion = (layer: LayerConfig, inputType: InputType) => {
    const { id, name } = layer;
    const answerOptions = (layer.answers ?? []).map((a) => ({ value: a.id, label: a.label }));
    let newQ: Question;
    switch (inputType) {
      case "thumbnail": newQ = { id, name, type: "thumbnail", displayType: (layer.displayType as any) ?? "image", swatches: (layer.answers ?? []).map((a) => ({ value: a.id, label: a.label, imageUrl: a.thumbnailUrl })) }; break;
      case "text": newQ = { id, name, type: "text", defaultText: "Your text", defaultColor: "#000000", defaultFontSize: 32, defaultFontFamily: "Roboto", position: { x: 200, y: 200 } }; break;
      case "label": newQ = { id, name, type: "label", content: "", answers: answerOptions, displayType: layer.displayType, multipleSelection: false }; break;
      case "dropdown": newQ = { id, name, type: "dropdown", options: answerOptions }; break;
      case "radio": newQ = { id, name, type: "radio", options: answerOptions }; break;
      case "checkbox": newQ = { id, name, type: "checkbox", checkedLabel: "Yes", uncheckedLabel: "No", defaultChecked: false }; break;
      case "file": newQ = { id, name, type: "file", displayType: "logo", position: { x: 200, y: 280 }, defaultWidth: 120, defaultHeight: 120, printAreas: [], allowedTransforms: { move: true, resize: true, rotate: false } }; break;
      case "color": {
        const first = layers.find((l) => l.type === "colorable" && l.id !== id);
        if (!first) { alert("Add a colorable layer first."); return; }
        newQ = { id, name, type: "color", linkedLayerId: first.id, swatches: [] }; break;
      }
      case "group": newQ = { id, name, type: "group", childIds: [] }; break;
      default: return;
    }
    setLayers((p) => p.filter((l) => l.id !== id));
    setQuestions((p) => [...p, newQ]);
    setSelected({ kind: "question", id });
  };

  const createAndLinkQuestion = (inputType: InputType, layerId: string) => {
    const id = `q-${inputType}-${Date.now()}`;
    let newQ: Question;
    switch (inputType) {
      case "thumbnail": newQ = { id, name: "Untitled image", type: "thumbnail", displayType: "image", swatches: [] }; break;
      case "text": newQ = { id, name: "Untitled text", type: "text", defaultText: "Your text", defaultColor: "#000000", defaultFontSize: 32, defaultFontFamily: "Roboto", position: { x: 200, y: 200 } }; break;
      default: return;
    }
    setQuestions((p) => [...p, newQ]);
    setLayers((p) => p.map((l) => l.id === layerId ? { ...l, applyOn: [...(l.applyOn ?? []), id] } : l));
  };

  const handleSave = () => {
    const fd = new FormData();
    fd.append("layers", JSON.stringify(layers));
    fd.append("questions", JSON.stringify(questions));
    fd.append("logicRules", JSON.stringify(logicRules));
    fd.append("productName", customTitle || product.title);
    fd.append("productImageUrl", product.featuredImage?.url || "");
    fd.append("productHandle", product.handle || "");
    fd.append("numViews", String(numViews));
    fd.append("viewNames", JSON.stringify(viewNames));
    fd.append("canvasW", String(canvasW));
    fd.append("canvasH", String(canvasH));
    fd.append("modelMode", String(modelMode));
    if (glbUrl) fd.append("glbUrl", glbUrl);
    submit(fd, { method: "post" });
  };

  useEffect(() => {
    if (pendingPreview && navigation.state === "idle") {
      setPendingPreview(false);
      navigate(`/app/configurator/${encodeURIComponent(product.id)}`);
    }
  }, [navigation.state, pendingPreview]);

  const selQ = selected?.kind === "question" ? questions.find((q) => q.id === selected.id) : null;
  const selL = selected?.kind === "layer" ? layers.find((l) => l.id === selected.id) : null;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: 14, color: "#111827" }}>

      {/* Add Question Modal */}
      {showAddModal && (
        <AddQuestionModal
          onAdd={(type, displayType) => { addQuestion(type, displayType); setAddToGroupId(null); }}
          onClose={() => { setShowAddModal(false); setAddToGroupId(null); }}
        />
      )}

      {/* Add Layer Modal */}
      {showAddLayerModal && (
        <AddLayerModal
          onAdd={(layerType, displayType) => addNewLayer(layerType, displayType)}
          onClose={() => setShowAddLayerModal(false)}
        />
      )}

      {/* ═══════════════ LEFT PANEL ══════════════════════════════════════ */}
      <div style={{ width: 268, borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", overflow: "hidden", background: "#fff" }}>

        {/* ── Row 1: breadcrumb + status ── */}
        <div style={{ padding: "8px 12px 6px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fafafa", borderBottom: "1px solid #f3f4f6" }}>
          <Link to="/app/products" style={{ fontSize: 12, color: "#6b7280", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 2L4 6l3.5 4" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Products
          </Link>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowStatusMenu((v) => !v)}
              disabled={statusFetcher.state !== "idle"}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "2px 8px", borderRadius: 10, border: "none", cursor: "pointer",
                fontSize: 11, fontWeight: 600, lineHeight: 1.6,
                background: productStatus === "ACTIVE" ? "#d1fae5" : "#f3f4f6",
                color: productStatus === "ACTIVE" ? "#065f46" : "#6b7280",
                opacity: statusFetcher.state !== "idle" ? 0.6 : 1,
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: productStatus === "ACTIVE" ? "#10b981" : "#9ca3af", display: "inline-block" }} />
              {statusFetcher.state !== "idle" ? "…" : productStatus === "ACTIVE" ? "Active" : "Draft"}
            </button>
            {showStatusMenu && (
              <div
                style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 100, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.12)", minWidth: 130, overflow: "hidden" }}
                onMouseLeave={() => setShowStatusMenu(false)}
              >
                {(["ACTIVE", "DRAFT"] as const).map((s) => (
                  <button
                    key={s}
                    disabled={productStatus === s}
                    onClick={() => {
                      setShowStatusMenu(false);
                      const fd = new FormData();
                      fd.append("intent", "updateProductStatus");
                      fd.append("status", s);
                      statusFetcher.submit(fd, { method: "post" });
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, width: "100%",
                      padding: "8px 12px", border: "none", background: productStatus === s ? "#f9fafb" : "#fff",
                      cursor: productStatus === s ? "default" : "pointer", fontSize: 12,
                      color: productStatus === s ? "#9ca3af" : "#111827", textAlign: "left",
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: s === "ACTIVE" ? "#10b981" : "#9ca3af", flexShrink: 0 }} />
                    {s === "ACTIVE" ? "Active" : "Draft"}
                    {productStatus === s && <span style={{ marginLeft: "auto", fontSize: 10, color: "#9ca3af" }}>current</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Publish error */}
        {statusFetcher.data?.publishError && (
          <div style={{ padding: "6px 12px", background: "#fef2f2", borderBottom: "1px solid #fecaca", fontSize: 11, color: "#b91c1c" }}>
            {statusFetcher.data.publishError}
          </div>
        )}

        {/* ── Row 2: product image + name ── */}
        <div style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 10 }}>
          {product.featuredImage ? (
            <img src={product.featuredImage.url} alt="" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 8, flexShrink: 0, border: "1px solid #e5e7eb" }} />
          ) : (
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#f3f4f6", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📦</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#111827" }}>{customTitle || product.title}</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.handle}</div>
          </div>
        </div>

        {/* ── Row 3: panel tab strip ── */}
        <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb" }}>
          {([
            { id: "layers", label: "Layers", icon: "≡" },
            { id: "model", label: "3D", icon: "◎" },
            { id: "settings", label: "Settings", icon: "⚙" },
          ] as const).map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => { setLeftTab(id); if (id === "model") setModelMode(true); }}
              style={{
                flex: 1, height: 38, border: "none", borderBottom: leftTab === id ? "2px solid #4f46e5" : "2px solid transparent",
                background: "none", cursor: "pointer", fontSize: 12, fontWeight: leftTab === id ? 600 : 400,
                color: leftTab === id ? "#4f46e5" : "#6b7280", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 1, transition: "color 0.12s",
                marginBottom: -1,
              }}
            >
              <span style={{ fontSize: 13, lineHeight: 1 }}>{icon}</span>
              <span style={{ fontSize: 10 }}>{label}</span>
            </button>
          ))}
        </div>

        {leftTab === "model" ? (
          /* ── 3D Model panel ──────────────────────────────────────────── */
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 20px" }}>
            <p style={{ margin: "0 0 12px", fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>
              Upload a <strong>.glb</strong> file. Detected mesh parts appear below — check which parts customers can customise, then link them to questions using the mesh name as the layer ID.
            </p>
            <GlbPartSetup
              glbUrl={glbUrl}
              parts={layers.filter((l) => l.type === "glb-part" || l.fromGlb)}
              selectedPartId={selected?.kind === "layer" ? selected.id : null}
              onPartSelect={(id) => setSelected({ kind: "layer", id })}
              onGlbUploaded={(url, detectedParts) => {
                setGlbUrl(url);
                setLayers((prev) => [
                  ...prev.filter((l) => !l.fromGlb && l.type !== "glb-part"),
                  ...detectedParts,
                ]);
              }}
              onPartsChange={(updatedParts) => {
                setLayers((prev) => [
                  ...prev.filter((l) => !l.fromGlb && l.type !== "glb-part"),
                  ...updatedParts,
                ]);
              }}
            />
          </div>
        ) : leftTab === "settings" ? (
          /* ── Settings panel ─────────────────────────────────────────── */
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 20px" }}>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Customizer title</label>
              <input value={customTitle} onChange={(e) => setCustomTitle(e.target.value)}
                style={{ display: "block", width: "100%", padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13, boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Product views</label>
                <button
                  onClick={() => {
                    const defaults = ["Front", "Back", "Side", "Detail"];
                    setViewNames((prev) => [...prev, defaults[numViews] || `View ${numViews + 1}`]);
                    setNumViews((n) => n + 1);
                    setCurrentView(numViews);
                  }}
                  style={{ background: "#4f46e5", color: "#fff", border: "none", borderRadius: 4, padding: "3px 9px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>+</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {Array.from({ length: numViews }).map((_, vi) => (
                  <div key={vi}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", background: currentView === vi ? "#eff6ff" : "#f9fafb", border: currentView === vi ? "1px solid #93c5fd" : "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer" }}
                    onClick={() => setCurrentView(vi)}
                  >
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: currentView === vi ? "#4f46e5" : "#e5e7eb", color: currentView === vi ? "#fff" : "#6b7280", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {vi + 1}
                    </div>
                    <input
                      value={viewNames[vi] ?? `View ${vi + 1}`}
                      onChange={(e) => {
                        e.stopPropagation();
                        setViewNames((prev) => { const n = [...prev]; n[vi] = e.target.value; return n; });
                      }}
                      onClick={(e) => e.stopPropagation()}
                      style={{ flex: 1, border: "none", background: "transparent", fontSize: 13, fontWeight: currentView === vi ? 600 : 400, color: "#111827", outline: "none", padding: 0, cursor: "text", minWidth: 0 }}
                      placeholder={`View ${vi + 1}`}
                    />
                    {vi === 0 && <span style={{ fontSize: 10, color: "#9ca3af", flexShrink: 0 }}>primary</span>}
                    {numViews > 1 && vi === numViews - 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewNames((prev) => prev.slice(0, -1));
                          setNumViews((n) => n - 1);
                          setCurrentView((v) => Math.min(v, numViews - 2));
                        }}
                        style={{ background: "none", border: "none", color: "#d1d5db", cursor: "pointer", fontSize: 16, padding: 0, lineHeight: 1, flexShrink: 0 }}>×</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Canvas size</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <label style={{ fontSize: 11, color: "#9ca3af", display: "block", marginBottom: 3 }}>Width</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <input type="number" value={canvasW} onChange={(e) => setCanvasW(Number(e.target.value))} min={100} max={2000}
                      style={{ flex: 1, padding: "6px 8px", border: "1px solid #e5e7eb", borderRadius: 5, fontSize: 12, boxSizing: "border-box" }} />
                    <span style={{ fontSize: 10, color: "#9ca3af" }}>px</span>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#9ca3af", display: "block", marginBottom: 3 }}>Height</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <input type="number" value={canvasH} onChange={(e) => setCanvasH(Number(e.target.value))} min={100} max={2000}
                      style={{ flex: 1, padding: "6px 8px", border: "1px solid #e5e7eb", borderRadius: 5, fontSize: 12, boxSizing: "border-box" }} />
                    <span style={{ fontSize: 10, color: "#9ca3af" }}>px</span>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 11, color: "#9ca3af", margin: "6px 0 0", lineHeight: 1.5 }}>
                Canvas size should match your image resolution.<br />Max recommended: 1200×1200 px.
              </p>
            </div>
          </div>
        ) : (
          /* ── Layers panel ───────────────────────────────────────────── */
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>

            {/* ── QUESTIONS section ── */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, borderBottom: "2px solid #e5e7eb" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px 6px", flexShrink: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280" }}>Questions</span>
              <button onClick={() => setShowAddModal(true)} title="Add question" style={{ background: "#4f46e5", color: "#fff", border: "none", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>+ Add</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>

            {questions.length === 0 && (
              <p style={{ padding: "8px 14px", fontSize: 12, color: "#9ca3af", margin: 0 }}>No questions yet. Click "Add" to create one.</p>
            )}

            {(() => {
              const childIdsInGroups = new Set(
                questions.filter((q) => q.type === "group").flatMap((q) => (q as GroupQuestion).childIds)
              );
              return questions.map((q, idx) => {
                if (childIdsInGroups.has(q.id)) return null;
                if (q.type === "group") {
                  const gq = q as GroupQuestion;
                  const isExpanded = expandedGroups.has(q.id);
                  return (
                    <div key={q.id}>
                      <GroupRow
                        q={gq} selected={selected?.id === q.id} expanded={isExpanded}
                        onToggle={() => toggleGroup(q.id)}
                        onSelect={() => setSelected({ kind: "question", id: q.id })}
                        onDelete={() => removeQ(q.id)}
                        onAddChild={() => { setAddToGroupId(q.id); setShowAddModal(true); }}
                        isDragging={dragQId === q.id} isDragOver={dragOverQId === q.id && dragQId !== q.id}
                        onDragStart={() => handleQDragStart(q.id)} onDragOver={(e) => handleQDragOver(e, q.id)}
                        onDrop={() => handleQDrop(q.id)} onDragEnd={handleQDragEnd}
                      />
                      {isExpanded && gq.childIds.map((childId) => {
                        const child = questions.find((oq) => oq.id === childId);
                        if (!child) return null;
                        return (
                          <div key={childId} style={{ paddingLeft: 18, borderLeft: "2px solid #e5e7eb", marginLeft: 18 }}>
                            <QuestionRow
                              q={child} selected={selected?.id === child.id}
                              layerName={(child.type === "color" || child.type === "thumbnail") ? layers.find((l) => l.id === (child as any).linkedLayerId)?.name : undefined}
                              onSelect={() => setSelected({ kind: "question", id: child.id })}
                              onDuplicate={() => duplicateQ(child.id)} onDelete={() => removeQ(child.id)}
                              isDragging={dragQId === child.id} isDragOver={dragOverQId === child.id && dragQId !== child.id}
                              onDragStart={() => handleQDragStart(child.id)} onDragOver={(e) => handleQDragOver(e, child.id)}
                              onDrop={() => handleQDrop(child.id)} onDragEnd={handleQDragEnd}
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                }
                return (
                  <div key={q.id}>
                    <QuestionRow
                      q={q} selected={selected?.id === q.id}
                      layerName={(q.type === "color" || q.type === "thumbnail") ? layers.find((l) => l.id === (q as any).linkedLayerId)?.name : undefined}
                      onSelect={() => { setSelected({ kind: "question", id: q.id }); setEditingPrintAreaId(null); }}
                      onDuplicate={() => duplicateQ(q.id)} onDelete={() => removeQ(q.id)}
                      isDragging={dragQId === q.id} isDragOver={dragOverQId === q.id && dragQId !== q.id}
                      onDragStart={() => handleQDragStart(q.id)} onDragOver={(e) => handleQDragOver(e, q.id)}
                      onDrop={() => handleQDrop(q.id)} onDragEnd={handleQDragEnd}
                    />
                    {q.type === "file" && ((q as FileQuestion).printAreas ?? []).map((pa) => (
                      <div key={pa.id} onClick={() => { setSelected({ kind: "question", id: q.id }); setEditingPrintAreaId(pa.id); }}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px 5px 40px", cursor: "pointer", background: editingPrintAreaId === pa.id ? "#eff6ff" : "transparent" }}>
                        <span style={{ fontSize: 11 }}>🖨</span>
                        <span style={{ fontSize: 12, color: "#6b7280" }}>↳ {pa.name}</span>
                      </div>
                    ))}
                  </div>
                );
              });
            })()}

            </div>{/* end questions scroll */}
            </div>{/* end questions section */}

            {/* ── BEHIND THE SCENE section ── */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px 6px", flexShrink: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280" }}>Behind the scene</span>
              <button onClick={() => setShowAddLayerModal(true)} style={{ background: "#f3f4f6", border: "none", borderRadius: 6, padding: "3px 9px", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#374151" }}>+</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
            {layers.filter((l) => l.type !== "glb-part").map((l, idx) => {
              const forwardNames = (l.applyOn ?? []).map((qid) => questions.find((q) => q.id === qid)?.name).filter(Boolean) as string[];
              const reverseNames = questions.filter((q) => (q as any).applyOn?.includes(l.id)).map((q) => q.name);
              const allLinkedNames = [...new Set([...forwardNames, ...reverseNames])];
              return (
                <LayerRow key={l.id} layer={l}
                  selected={selected?.id === l.id}
                  linkedNames={allLinkedNames}
                  onSelect={() => setSelected({ kind: "layer", id: l.id })}
                  onRemove={() => removeL(l.id)}
                  isDragging={dragLId === l.id} isDragOver={dragOverLId === l.id && dragLId !== l.id}
                  onDragStart={() => handleLDragStart(l.id)}
                  onDragOver={(e) => handleLDragOver(e, l.id)}
                  onDrop={() => handleLDrop(l.id)}
                  onDragEnd={handleLDragEnd}
                />
              );
            })}
            </div>{/* end layers scroll */}
            </div>{/* end layers section */}
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: "10px 14px", borderTop: "1px solid #e5e7eb", display: "flex", flexDirection: "column", gap: 6 }}>
          {config && (
            <button
              onClick={() => { handleSave(); setPendingPreview(true); }}
              disabled={pendingPreview}
              style={{ fontSize: 12, color: "#2563eb", textDecoration: "none", background: "none", border: "none", padding: 0, cursor: pendingPreview ? "wait" : "pointer" }}
            >
              {pendingPreview ? "Saving…" : "Preview customer view →"}
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════ CENTER – LIVE CANVAS ════════════════════════════ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#f3f4f6", overflow: "hidden" }}>

        {/* Top bar */}
        <div style={{ height: 46, background: "#fff", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", padding: "0 16px", gap: 0 }}>
          <button
            onClick={() => setShowLogicPanel(false)}
            style={{ height: 46, padding: "0 16px", background: "none", border: "none", borderBottom: showLogicPanel ? "2px solid transparent" : "2px solid #4f46e5", cursor: "pointer", fontSize: 13, fontWeight: 600, color: showLogicPanel ? "#9ca3af" : "#4f46e5", marginBottom: -1, whiteSpace: "nowrap" }}
          >
            Build
          </button>
          <Link
            to={`/app/pricing/${encodeURIComponent(product.id)}`}
            prefetch="intent"
            style={{ height: 46, padding: "0 16px", display: "flex", alignItems: "center", fontSize: 13, fontWeight: 400, color: "#6b7280", textDecoration: "none", borderBottom: "2px solid transparent", whiteSpace: "nowrap" }}
          >
            Pricing
          </Link>
          <Link
            to={`/app/variants/${encodeURIComponent(product.id)}`}
            prefetch="intent"
            style={{ height: 46, padding: "0 16px", display: "flex", alignItems: "center", fontSize: 13, fontWeight: 400, color: "#6b7280", textDecoration: "none", borderBottom: "2px solid transparent", whiteSpace: "nowrap" }}
          >
            Variants
          </Link>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link
              to={`/app/configurator-style/${encodeURIComponent(product.id)}`}
              style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#5c6ac4", fontSize: 12, fontWeight: 500, textDecoration: "none", padding: "5px 12px", borderRadius: 6, border: "1px solid #e0d9ff", background: "#f5f3ff", whiteSpace: "nowrap" }}
            >
              Style
            </Link>
            <button
              onClick={() => setShowLogicPanel((v) => !v)}
              style={{ display: "inline-flex", alignItems: "center", gap: 5, background: showLogicPanel ? "#4f46e5" : "#f3f4f6", color: showLogicPanel ? "#fff" : "#374151", border: "none", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}
            >
              Logic {logicRules.length > 0 && (
                <span style={{ background: showLogicPanel ? "rgba(255,255,255,0.3)" : "#4f46e5", color: "#fff", borderRadius: 10, fontSize: 11, padding: "0 5px", minWidth: 16, textAlign: "center" }}>{logicRules.length}</span>
              )}
            </button>
            {actionData?.success && (
              <span style={{ background: "#d1fae5", color: "#065f46", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>✓ Saved</span>
            )}
          </div>
        </div>

        {/* Text canvas toolbar — appears when a text question is selected */}
        {!showLogicPanel && selQ?.type === "text" && (
          <TextCanvasToolbar tq={selQ as TextQuestion} onUpdate={updateQ} />
        )}

        {/* Logic panel — shown instead of canvas when Logic tab active */}
        {showLogicPanel && (
          <LogicPanel
            rules={logicRules}
            questions={questions}
            layers={layers}
            onChange={setLogicRules}
            onBack={() => setShowLogicPanel(false)}
          />
        )}

        {/* Canvas area */}
        {!showLogicPanel && <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "auto", padding: 24, position: "relative" }}>

          {/* Left navigation arrow */}
          {numViews > 1 && (
            <button onClick={() => setCurrentView((v) => Math.max(0, v - 1))} disabled={currentView === 0}
              style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", zIndex: 10, width: 34, height: 34, borderRadius: "50%", border: "1px solid #e5e7eb", background: currentView === 0 ? "#f3f4f6" : "#fff", cursor: currentView === 0 ? "default" : "pointer", fontSize: 20, color: currentView === 0 ? "#d1d5db" : "#374151", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
              ‹
            </button>
          )}

          {mounted ? (
            <div style={{ position: "relative", borderRadius: 6, overflow: "hidden" }}>

              {/* ── 3D preview ── */}
              {modelMode && glbUrl ? (
                <ThreeViewer
                  glbUrl={glbUrl}
                  parts={layers}
                  customizations={adminPreviewCustomizations}
                  width={displayW}
                  height={displayH}
                  selectedPartId={selected?.kind === "layer" ? selected.id : null}
                  onPartClick={(meshName) => setSelected({ kind: "layer", id: meshName })}
                />
              ) : (

              <>
              {layers.length === 0 && (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, color: "#9ca3af", zIndex: 1, pointerEvents: "none" }}>
                  <div style={{ fontSize: 40 }}>🎨</div>
                  <p style={{ margin: 0, fontSize: 13, textAlign: "center", lineHeight: 1.5, padding: "0 20px" }}>Add layers using the <strong>+</strong> button in the left panel.</p>
                </div>
              )}
              <Stage width={displayW} height={displayH} style={{ display: "block" }}>
                <KonvaLayer scaleX={canvasDisplayScale} scaleY={canvasDisplayScale}>
                  {/* Label answer preview — shows while editing a label answer with viewImages */}
                  {labelPreviewImages && (() => {
                    const src = labelPreviewImages[currentView] || labelPreviewImages.find(Boolean) || "";
                    return src ? <ProductLayer src={src} width={canvasW} height={canvasH} /> : null;
                  })()}
                  {layers.map((layer) => {
                    const imgOverride = canvasImageOverrides[layer.id];
                    let layerSrc: string;
                    if (imgOverride) {
                      const slot = imgOverride[currentView];
                      layerSrc = (slot != null && slot !== "")
                        ? slot
                        : (imgOverride.find((s) => s !== "" && s != null) ?? getLayerSrc(layer, currentView, layerPreviewAnswerIdx[layer.id] ?? 0));
                    } else {
                      layerSrc = getLayerSrc(layer, currentView, layerPreviewAnswerIdx[layer.id] ?? 0);
                    }
                    return (
                      <ProductLayer
                        key={layer.id}
                        src={layerSrc}
                        color={canvasColors[layer.id]}
                        textureUrl={canvasTextures[layer.id]}
                        width={canvasW}
                        height={canvasH}
                      />
                    );
                  })}
                  {/* Text questions WITH a printArea → single draggable Group (rect + text preview).
                      Text questions WITHOUT a printArea → plain draggable KonvaText (existing behaviour). */}
                  {textItems.filter((q) => !q.printArea && q.displayType !== "none").map((q) => (
                    <KonvaText
                      key={q.id}
                      ref={(node) => { textNodeRefs.current[q.id] = node; }}
                      text={q.defaultText}
                      x={q.position.x * S}
                      y={q.position.y * S}
                      fontSize={q.defaultFontSize * S}
                      fontFamily={q.defaultFontFamily}
                      fill={q.defaultColor}
                      align={q.textAlign ?? "left"}
                      rotation={q.rotation ?? 0}
                      draggable
                      onClick={() => setSelected({ kind: "question", id: q.id })}
                      onDragEnd={(e) => {
                        updateQ({ ...q, position: { x: Math.round(e.target.x() / S), y: Math.round(e.target.y() / S) } });
                      }}
                      onTransformEnd={(e) => {
                        updateQ({ ...q, position: { x: Math.round(e.target.x() / S), y: Math.round(e.target.y() / S) }, rotation: Math.round(e.target.rotation()) });
                      }}
                    />
                  ))}
                  {/* Print area groups — text questions with printArea + file question print areas */}
                  {(() => {
                    if (selected?.kind !== "question") return null;
                    const selQuestion = questions.find((q) => q.id === selected.id);
                    if (!selQuestion) return null;

                    if (selQuestion.type === "text") {
                      const tq = selQuestion as TextQuestion;
                      if (tq.displayType === "none") return null;
                      const pa = tq.printArea;
                      if (!pa || !pa.visibleViews.includes(currentView + 1)) return null;
                      const isActive = editingPrintAreaId === pa.id;
                      return (
                        <Group
                          key={pa.id}
                          ref={(node) => { printAreaGroupRefs.current[pa.id] = node; }}
                          x={pa.x * S}
                          y={pa.y * S}
                          rotation={pa.rotation ?? 0}
                          draggable
                          onClick={() => { setSelected({ kind: "question", id: tq.id }); setEditingPrintAreaId(pa.id); }}
                          onDragEnd={(e) => {
                            const nx = Math.round(e.target.x() / S);
                            const ny = Math.round(e.target.y() / S);
                            updateQ({ ...tq, position: { x: nx, y: ny }, printArea: { ...pa, x: nx, y: ny } });
                          }}
                          onTransformEnd={(e) => {
                            const node = e.target;
                            const sx = node.scaleX();
                            const sy = node.scaleY();
                            node.scaleX(1);
                            node.scaleY(1);
                            const newW = Math.max(20, Math.round(pa.width * Math.abs(sx)));
                            const newH = Math.max(10, Math.round(pa.height * Math.abs(sy)));
                            const newX = Math.round(node.x() / S);
                            const newY = Math.round(node.y() / S);
                            const newRot = Math.round(node.rotation());
                            const newFontSize = Math.max(6, Math.round(tq.defaultFontSize * Math.abs(sx)));
                            updateQ({
                              ...tq,
                              defaultFontSize: newFontSize,
                              position: { x: newX, y: newY },
                              printArea: { ...pa, x: newX, y: newY, width: newW, height: newH, rotation: newRot },
                            });
                          }}
                        >
                          <Rect
                            width={pa.width * S}
                            height={pa.height * S}
                            fill={isActive ? "rgba(59,130,246,0.08)" : "rgba(59,130,246,0.03)"}
                            stroke={pa.showOutline ? pa.outlineColor : "#3b82f6"}
                            strokeWidth={isActive ? 2 : 1.5}
                            dash={[6, 3]}
                          />
                          <KonvaText
                            text={tq.defaultText || tq.name}
                            x={4}
                            y={Math.max(4, (pa.height * S - tq.defaultFontSize * S) / 2)}
                            width={pa.width * S - 8}
                            fontSize={tq.defaultFontSize * S}
                            fontFamily={tq.defaultFontFamily}
                            fill={tq.defaultColor}
                            align={tq.textAlign ?? "left"}
                            wrap="none"
                            listening={false}
                          />
                        </Group>
                      );
                    }

                    if (selQuestion.type === "file") {
                      const fq = selQuestion as FileQuestion;
                      return (fq.printAreas ?? [])
                        .filter((pa) => pa.visibleViews.includes(currentView + 1))
                        .map((pa) => (
                          <Rect
                            key={pa.id}
                            x={pa.x * S}
                            y={pa.y * S}
                            width={pa.width * S}
                            height={pa.height * S}
                            rotation={pa.rotation ?? 0}
                            fill={editingPrintAreaId === pa.id ? "rgba(59,130,246,0.08)" : "rgba(59,130,246,0.03)"}
                            stroke={pa.showOutline ? pa.outlineColor : "#3b82f6"}
                            strokeWidth={editingPrintAreaId === pa.id ? 2 : 1.5}
                            dash={[6, 3]}
                            listening={false}
                          />
                        ));
                    }

                    return null;
                  })()}
                  {filePlaceholders.map((fq) => {
                    const fqTyped = fq as FileQuestion;
                    const fqAreas = fqTyped.printAreas ?? [];
                    const visibleOnView = fqAreas.length === 0 || fqAreas.some((pa) => pa.visibleViews.includes(currentView + 1));
                    if (!visibleOnView) return null;
                    if (fqTyped.displayType === "logo") {
                      const t = fqTyped.allowedTransforms ?? { move: true, resize: true, rotate: false };
                      const w = fqTyped.defaultWidth * S;
                      const h = fqTyped.defaultHeight * S;
                      return (
                        <Group
                          key={fqTyped.id}
                          ref={(node) => { logoNodeRefs.current[fqTyped.id] = node; }}
                          x={fqTyped.position.x * S}
                          y={fqTyped.position.y * S}
                          rotation={(fqTyped as any).rotation ?? 0}
                          draggable={t.move}
                          onClick={() => setSelected({ kind: "question", id: fqTyped.id })}
                          onDragEnd={(e) => {
                            updateQ({ ...fqTyped, position: { x: Math.round(e.target.x() / S), y: Math.round(e.target.y() / S) } });
                          }}
                          onTransformEnd={(e) => {
                            const node = logoNodeRefs.current[fqTyped.id];
                            if (!node) return;
                            const sx = node.scaleX();
                            const sy = node.scaleY();
                            node.scaleX(1);
                            node.scaleY(1);
                            updateQ({
                              ...fqTyped,
                              position: { x: Math.round(node.x() / S), y: Math.round(node.y() / S) },
                              defaultWidth: Math.max(20, Math.round(fqTyped.defaultWidth * sx)),
                              defaultHeight: Math.max(20, Math.round(fqTyped.defaultHeight * sy)),
                              rotation: Math.round(node.rotation()),
                            } as any);
                          }}
                        >
                          <Rect width={w} height={h} fill="rgba(59,130,246,0.08)" stroke="#3b82f6" strokeWidth={1.5} dash={[6, 3]} />
                          <KonvaText text="LOGO" width={w} height={h} align="center" verticalAlign="middle" fontSize={13} fill="#3b82f6" fontStyle="bold" listening={false} />
                        </Group>
                      );
                    }
                    return <Rect key={fq.id} x={fq.position.x * S} y={fq.position.y * S} width={fq.defaultWidth * S} height={fq.defaultHeight * S} fill="#f3f4f6" stroke="#9ca3af" strokeWidth={1} dash={[5, 3]} listening={false} />;
                  })}
                  {(() => {
                    const selQ = selected?.kind === "question" ? questions.find((q) => q.id === selected.id) : null;
                    const isLogo = selQ?.type === "file" && (selQ as FileQuestion).displayType === "logo";
                    const logoT = isLogo ? ((selQ as FileQuestion).allowedTransforms ?? { move: true, resize: true, rotate: false }) : null;
                    return (
                      <>
                        <Transformer
                          ref={transformerRef}
                          rotateEnabled={isLogo ? (logoT?.rotate ?? false) : true}
                          resizeEnabled={isLogo ? (logoT?.resize ?? true) : false}
                          keepRatio={false}
                          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
                          anchorSize={8}
                          borderDash={[4, 4]}
                          borderStroke="#3b82f6"
                          anchorFill="#fff"
                          anchorStroke="#3b82f6"
                        />
                        <Transformer
                          ref={printAreaTransformerRef}
                          rotateEnabled={false}
                          resizeEnabled={true}
                          keepRatio={false}
                          anchorSize={9}
                          borderDash={[4, 4]}
                          borderStroke="#2563eb"
                          anchorFill="#fff"
                          anchorStroke="#2563eb"
                          anchorCornerRadius={2}
                          boundBoxFunc={(old, nw) => (nw.width < 20 || nw.height < 10 ? old : nw)}
                        />
                      </>
                    );
                  })()}
                </KonvaLayer>
              </Stage>
              </>
              )} {/* end 3D / 2D branch */}

            </div>
          ) : (
            <div style={{ width: displayW, height: displayH, background: "#e5e7eb", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 14 }}>Loading canvas…</div>
          )}

          {/* Right navigation arrow */}
          {numViews > 1 && (
            <button onClick={() => setCurrentView((v) => Math.min(numViews - 1, v + 1))} disabled={currentView === numViews - 1}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", zIndex: 10, width: 34, height: 34, borderRadius: "50%", border: "1px solid #e5e7eb", background: currentView === numViews - 1 ? "#f3f4f6" : "#fff", cursor: currentView === numViews - 1 ? "default" : "pointer", fontSize: 20, color: currentView === numViews - 1 ? "#d1d5db" : "#374151", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
              ›
            </button>
          )}
        </div>}

        {/* View navigation tabs — hidden in Logic panel mode */}
        {!showLogicPanel && (
          <div style={{ background: "#f3f4f6", borderTop: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "6px 12px", overflowX: "auto" }}>
            {Array.from({ length: numViews }).map((_, vi) => (
              <button key={vi} onClick={() => setCurrentView(vi)}
                style={{
                  height: 28, padding: "0 12px", borderRadius: 6, border: "none",
                  background: vi === currentView ? "#4f46e5" : "#fff",
                  color: vi === currentView ? "#fff" : "#6b7280",
                  cursor: "pointer", fontSize: 12, fontWeight: vi === currentView ? 600 : 400,
                  whiteSpace: "nowrap", boxShadow: vi === currentView ? "0 1px 4px rgba(79,70,229,0.3)" : "0 1px 2px rgba(0,0,0,0.06)",
                  transition: "background 0.12s",
                }}
              >
                {viewNames[vi] || `View ${vi + 1}`}
              </button>
            ))}
            <button
              onClick={() => {
                const defaults = ["Front", "Back", "Side", "Detail"];
                setViewNames((prev) => [...prev, defaults[numViews] || `View ${numViews + 1}`]);
                setNumViews((n) => n + 1);
                setCurrentView(numViews);
              }}
              style={{ height: 28, width: 28, borderRadius: 6, border: "1px dashed #d1d5db", background: "none", cursor: "pointer", fontSize: 16, color: "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0 }}
              title="Add view"
            >+</button>
            {numViews > 1 && (
              <button
                onClick={() => {
                  setViewNames((prev) => prev.slice(0, -1));
                  setNumViews((n) => n - 1);
                  setCurrentView((v) => Math.min(v, numViews - 2));
                }}
                style={{ height: 28, width: 28, borderRadius: 6, border: "1px dashed #fca5a5", background: "none", cursor: "pointer", fontSize: 14, color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0 }}
                title="Remove last view"
              >−</button>
            )}
          </div>
        )}

        {/* Bottom bar */}
        <div style={{ height: 58, background: "#fff", borderTop: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <button onClick={handleSave} style={{ padding: "10px 40px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14, letterSpacing: "0.01em", boxShadow: "0 1px 6px rgba(79,70,229,0.35)" }}>
            Save Configuration
          </button>
        </div>
      </div>

      {/* ═══════════════ ANSWER DETAIL PANEL (4th panel) ════════════════ */}
      {answerEditState && selQ?.type === "thumbnail" && (() => {
        const tq = selQ as ThumbnailQuestion;
        const swatch = tq.swatches[answerEditState.answerIdx];
        if (!swatch) return null;
        return (
          <div style={{ width: 300, borderLeft: "1px solid #e5e7eb", background: "#fff", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>
            <AnswerDetailPanel
              swatch={swatch}
              numViews={numViews}
              displayType={(tq.displayType ?? "image") as "image" | "color" | "none"}
              onDone={() => setAnswerEditState(null)}
              onChange={(updated) => {
                updateQ({ ...tq, swatches: tq.swatches.map((s, i) => i === answerEditState.answerIdx ? updated : s) });
                if ((tq.displayType ?? "image") === "color") {
                  setSelectedSwatches((p) => ({ ...p, [tq.id]: updated.value }));
                }
              }}
            />
          </div>
        );
      })()}

      {/* ═══════════════ DROPDOWN ANSWER DETAIL PANEL (4th panel) ════════ */}
      {answerEditState && selQ?.type === "dropdown" && (selQ as DropdownQuestion).displayType === "image" && (() => {
        const dq = selQ as DropdownQuestion;
        const opt = dq.options[answerEditState.answerIdx];
        if (!opt) return null;
        // Map DropdownOption → ColorSwatch to reuse AnswerDetailPanel
        const asSwatch: ColorSwatch = { value: opt.value, label: opt.label, imageUrl: opt.thumbnailUrl, viewImages: opt.viewImages, description: opt.description, productionCode: opt.productionCode };
        return (
          <div style={{ width: 300, borderLeft: "1px solid #e5e7eb", background: "#fff", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>
            <AnswerDetailPanel
              swatch={asSwatch}
              numViews={numViews}
              displayType="image"
              onDone={() => setAnswerEditState(null)}
              onChange={(updated) => {
                // Use first non-null viewImage as the list thumbnail if no explicit imageUrl
                const firstViewImg = updated.viewImages?.find(Boolean) ?? null;
                const updatedOpt: DropdownOption = {
                  value: updated.value,
                  label: updated.label,
                  thumbnailUrl: updated.imageUrl ?? firstViewImg ?? undefined,
                  viewImages: updated.viewImages,
                  description: updated.description,
                  productionCode: updated.productionCode,
                };
                updateQ({ ...dq, options: dq.options.map((o, i) => i === answerEditState.answerIdx ? updatedOpt : o) });
              }}
            />
          </div>
        );
      })()}

      {/* ═══════════════ PRINT AREA PANEL (4th panel) ═══════════════════ */}
      {(() => {
        if (!editingPrintAreaId) return null;

        if (selQ?.type === "text") {
          const tq = selQ as TextQuestion;
          if (!tq.printArea || tq.printArea.id !== editingPrintAreaId) return null;
          return (
            <PrintAreaPanel
              area={tq.printArea}
              numViews={numViews}
              layers={layers}
              onClose={() => setEditingPrintAreaId(null)}
              onDelete={() => { updateQ({ ...tq, printArea: undefined }); setEditingPrintAreaId(null); }}
              onChange={(updated) => updateQ({ ...tq, printArea: updated })}
              onViewChange={(v) => setCurrentView(Math.min(v - 1, numViews - 1))}
            />
          );
        }

        if (selQ?.type !== "file") return null;
        const fq = selQ as FileQuestion;
        const pa = (fq.printAreas ?? []).find((p) => p.id === editingPrintAreaId);
        if (!pa) return null;
        return (
          <PrintAreaPanel
            area={pa}
            numViews={numViews}
            layers={layers}
            onClose={() => setEditingPrintAreaId(null)}
            onDelete={() => {
              updateQ({ ...fq, printAreas: (fq.printAreas ?? []).filter((p) => p.id !== editingPrintAreaId) });
              setEditingPrintAreaId(null);
            }}
            onChange={(updated) => updateQ({ ...fq, printAreas: (fq.printAreas ?? []).map((p) => p.id === updated.id ? updated : p) })}
            onViewChange={(v) => setCurrentView(Math.min(v - 1, numViews - 1))}
          />
        );
      })()}

      {/* ═══════════════ RIGHT PANEL – EDITOR ════════════════════════════ */}
      <div style={{ width: 300, borderLeft: "1px solid #e5e7eb", background: "#fff", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {selQ?.type === "thumbnail" ? (
          <div style={{ padding: "11px 16px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 8, background: "#fafafa" }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: "#4f46e5", borderBottom: "2px solid #4f46e5", paddingBottom: 2 }}>Question</span>
            <button onClick={() => removeQ(selQ.id)}
              style={{ marginLeft: "auto", background: "none", border: "1px solid #fca5a5", color: "#ef4444", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 12, fontWeight: 500 }}>
              Remove
            </button>
          </div>
        ) : (
          <div style={{ padding: "11px 16px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 10, background: "#fafafa" }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: "#111827" }}>{selQ ? "Question" : selL ? "Layer" : "Properties"}</span>
            {(selQ || selL) && (
              <button
                onClick={() => { if (selQ) removeQ(selQ.id); else if (selL) removeL(selL.id); }}
                style={{ marginLeft: "auto", background: "none", border: "1px solid #fca5a5", color: "#ef4444", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 12, fontWeight: 500 }}
              >
                Remove
              </button>
            )}
          </div>
        )}

        <div style={{ flex: 1, overflowY: "auto" }}>
          {!selected && (
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 22 }}>🎛️</div>
              <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 600, color: "#374151" }}>No selection</p>
              <p style={{ margin: 0, fontSize: 13, color: "#9ca3af", lineHeight: 1.6 }}>Select a <strong style={{ color: "#4f46e5" }}>question</strong> or <strong style={{ color: "#4f46e5" }}>layer</strong> in the left panel to configure it here.</p>
            </div>
          )}

          {selQ && selQ.type === "thumbnail" && (
            <ThumbnailEditor
              q={selQ as ThumbnailQuestion}
              layers={layers}
              questions={questions}
              numViews={numViews}
              onChange={updateQ}
              onEditAnswer={(idx) => setAnswerEditState({ questionId: selQ.id, answerIdx: idx })}
              editingIdx={answerEditState?.questionId === selQ.id ? (answerEditState?.answerIdx ?? null) : null}
              onSwitchType={(t) => switchQuestionType(selQ.id, t)}
              onPreview={(value) => setSelectedSwatches((p) => ({ ...p, [selQ.id]: value }))}
            />
          )}
          {/* Pure color picker questions → SwatchEditor */}
          {selQ && selQ.type === "color" && (
            <SwatchEditor
              q={selQ as any}
              layers={layers}
              onChange={updateQ}
              previewValue={selectedSwatches[selQ.id]}
              onPreview={(value) => setSelectedSwatches((p) => ({ ...p, [selQ.id]: value }))}
            />
          )}
          {selQ && selQ.type === "text" && (
            <TextEditor
              q={selQ as TextQuestion}
              layers={layers}
              onChange={updateQ}
              onSwitchType={(t) => switchQuestionType(selQ.id, t)}
              onCreateSubQuestion={addTextSubQuestion}
              onEditPrintArea={() => {
                const pa = (selQ as TextQuestion).printArea;
                if (pa) setEditingPrintAreaId(pa.id);
              }}
            />
          )}
          {selQ && selQ.type === "file" && (
            <FileEditor
              q={selQ as FileQuestion}
              onChange={updateQ}
              onSwitchType={(t) => switchQuestionType(selQ.id, t)}
              onEditPrintArea={(paId) => setEditingPrintAreaId(paId)}
            />
          )}
          {selQ && selQ.type === "dropdown" && (
            <DropdownEditor
              q={selQ as DropdownQuestion}
              numViews={numViews}
              onChange={updateQ}
              onEditAnswer={(idx) => setAnswerEditState({ questionId: selQ.id, answerIdx: idx })}
              editingIdx={answerEditState?.questionId === selQ.id ? (answerEditState?.answerIdx ?? null) : null}
            />
          )}
          {selQ && selQ.type === "radio" && <RadioEditor q={selQ as RadioQuestion} onChange={updateQ} />}
          {selQ && selQ.type === "checkbox" && <CheckboxEditor q={selQ as CheckboxQuestion} onChange={updateQ} />}
          {selQ && selQ.type === "label" && (
            <LabelEditor
              q={selQ as LabelQuestion}
              numViews={numViews}
              onChange={updateQ}
              onSwitchType={(newType) => switchQuestionType(selQ.id, newType)}
              onAnswerPreview={(images) => setLabelPreviewImages(images)}
            />
          )}
          {selQ && selQ.type === "group" && (
            <GroupEditorComp
              q={selQ as GroupQuestion} questions={questions} onChange={updateQ}
              onAddElement={() => { setAddToGroupId(selQ.id); setShowAddModal(true); }}
            />
          )}
          {selQ && selQ.type === "none" && (
            <div style={{ padding: "12px 16px 8px" }}>
              <label style={labelSt}>Title</label>
              <input value={selQ.name} onChange={(e) => updateQ({ ...selQ, name: e.target.value })} style={inputSt} />
            </div>
          )}
          {/* Universal Input type + Display type for all types except thumbnail & label (which have their own) */}
          {selQ && !["thumbnail", "label", "file"].includes(selQ.type) && (
            <UniversalInputDisplayRow
              q={selQ}
              onChange={updateQ}
              onSwitchType={(t) => switchQuestionType(selQ.id, t)}
            />
          )}
          {selL && selL.type === "glb-part" ? (
            /* GLB part — show mesh info instead of image upload */
            <div style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelSt}>Mesh ID (use as Layer ID in questions)</label>
                <div style={{ ...inputSt, background: "#f3f4f6", userSelect: "all", fontFamily: "monospace", fontSize: 12 }}>
                  {selL.id}
                </div>
              </div>
              <div>
                <label style={labelSt}>Display name</label>
                <input
                  style={inputSt}
                  value={selL.name}
                  onChange={(e) => updateL({ ...selL, name: e.target.value })}
                />
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>
                This is a 3D mesh part. To customise it, create a <strong>Color</strong> or <strong>Thumbnail</strong> question and set its layer ID to <code style={{ background: "#f3f4f6", padding: "1px 4px", borderRadius: 3 }}>{selL.id}</code>.
              </p>
            </div>
          ) : selL ? (
            <LayerEditorComp
              layer={selL} numViews={numViews} onChange={updateL}
              layers={layers} questions={questions}
              onAddLinkedLayer={addLinkedLayer}
              onConvertToQuestion={convertLayerToQuestion}
              onCreateAndLinkQuestion={createAndLinkQuestion}
              onAnswerPreview={(idx) =>
                setLayerPreviewAnswerIdx((p) => ({ ...p, [selL.id]: idx ?? 0 }))
              }
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
