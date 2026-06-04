import { useLoaderData, type HeadersFunction } from "react-router";
import { useState, useRef, useEffect } from "react";
import {
  Stage,
  Layer as KonvaLayer,
  Text as KonvaText,
  Image as KonvaImage,
  Transformer,
} from "react-konva";
import ProductLayer from "../components/ProductLayer";
import { ColorPickerPopup } from "../components/ModernColorPicker";
import prisma from "../db.server";
import {
  type LayerConfig,
  type Question,
  type ColorQuestion,
  type ThumbnailQuestion,
  type DropdownQuestion,
  getLayerSrc,
  migrateOptions,
} from "../types/configurator";

export const headers: HeadersFunction = () => ({
  "Content-Security-Policy": "frame-ancestors *",
  "X-Frame-Options": "ALLOWALL",
  "ngrok-skip-browser-warning": "true",
});

const CANVAS_SIZE = 560;
// All positions/sizes are stored in 800-coordinate space; scale down to CANVAS_SIZE
const COORD_SCALE = CANVAS_SIZE / 800;

// ─── Loader ───────────────────────────────────────────────────────────────────

export async function loader({ request, params }: any) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const numericId = params.productId;

  if (!shop) throw new Response("Missing shop parameter", { status: 400 });

  const productId = `gid://shopify/Product/${numericId}`;

  const config = await prisma.productConfig.findFirst({
    where: { productId, shop },
  });

  if (!config) {
    return { config: null, productName: "Product", productId };
  }

  return {
    config,
    productName: (config as any).productName ?? "Product",
    productId,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isVisible(q: Question, selectedAnswers: Record<string, string>): boolean {
  if (!q.conditions?.length) return true;
  return q.conditions.every((c) => selectedAnswers[c.questionId] === c.value);
}

// Questions created via "CREATE → Color question +" store target layers in
// applyOn instead of linkedLayerId. Returns ALL linked layer IDs.
function getEffectiveLayerIds(q: ColorQuestion | ThumbnailQuestion): string[] {
  if (q.linkedLayerId) return [q.linkedLayerId];
  const applyOn: string[] = (q as any).applyOn ?? [];
  return applyOn;
}

// ─── Image Dropdown (custom select with image thumbnails) ────────────────────

function ImageDropdown({ q, selectedVals, onToggle, onHoverImages, qLabel }: {
  q: DropdownQuestion;
  selectedVals: string[];
  onToggle: (val: string) => void;
  onHoverImages?: (imgs: (string | null)[] | null) => void;
  qLabel: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const selectedOpts = q.options.filter((o) => selectedVals.includes(o.value));
  const getThumb = (o: { thumbnailUrl?: string; viewImages?: (string | null)[] }) =>
    o.thumbnailUrl ?? o.viewImages?.find(Boolean) ?? null;

  return (
    <div style={{ marginTop: 20, position: "relative" }}>
      <div style={qLabel}>{q.name}</div>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 7, background: "#fff", cursor: "pointer", fontSize: 13, textAlign: "left" }}
      >
        {selectedOpts.length === 0 ? (
          <span style={{ color: "#9ca3af", flex: 1 }}>— select —</span>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, flexWrap: "wrap" }}>
            {selectedOpts.map((o) => {
              const thumb = getThumb(o);
              return (
                <div key={o.value} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  {thumb && <img src={thumb} alt={o.label} style={{ width: 24, height: 24, objectFit: "cover", borderRadius: 3, border: "1px solid #e5e7eb" }} />}
                  <span>{o.label}</span>
                </div>
              );
            })}
          </div>
        )}
        <span style={{ color: "#9ca3af", fontSize: 10 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && <div style={{ position: "fixed", inset: 0, zIndex: 98 }} onClick={() => { setOpen(false); onHoverImages?.(null); }} />}

      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 99, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", overflow: "hidden", marginTop: 4 }}>
          {q.options.map((o) => {
            const thumb = getThumb(o);
            const isSelected = selectedVals.includes(o.value);
            const hasViewImages = (o as any).viewImages?.some(Boolean);
            return (
              <button
                key={o.value}
                onClick={() => { onToggle(o.value); if (!q.multipleSelection) setOpen(false); }}
                onMouseEnter={() => hasViewImages ? onHoverImages?.((o as any).viewImages) : undefined}
                onMouseLeave={() => onHoverImages?.(null)}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 12px", border: "none", cursor: "pointer", fontSize: 13, background: isSelected ? "#eff6ff" : "#fff", textAlign: "left", borderBottom: "1px solid #f3f4f6" }}
              >
                {thumb ? (
                  <img src={thumb} alt={o.label} style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 5, border: `2px solid ${isSelected ? "#3b82f6" : "#e5e7eb"}`, flexShrink: 0 }} />
                ) : (
                  <span style={{ width: 36, height: 36, background: "#f3f4f6", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🏔</span>
                )}
                <span style={{ flex: 1, fontWeight: isSelected ? 600 : 400 }}>{o.label}</span>
                {isSelected && <span style={{ color: "#3b82f6", fontSize: 14 }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StorefrontConfiguratorPage() {
  const { config, productName } = useLoaderData() as any;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    window.parent.postMessage({ type: 'configurator:ready' }, '*');
  }, []);

  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const [nodeRefs] = useState<Record<string, any>>({});

  const layers: LayerConfig[] = (config?.layers as LayerConfig[]) ?? [];
  const questions: Question[] = migrateOptions(config?.options, layers);
  const numViews: number = (config?.options as any)?.numViews ?? 1;

  // View navigation
  const [currentView, setCurrentView] = useState(0);

  // selectedAnswers drives conditional logic — tracks the currently chosen "value" per question
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const q of questions) {
      if (q.type === "color" && q.swatches.length > 0) init[q.id] = q.swatches[0].value;
      if (q.type === "thumbnail" && q.swatches.length > 0) init[q.id] = q.swatches[0].value;
      if (q.type === "dropdown" && q.defaultValue) init[q.id] = q.defaultValue;
      if (q.type === "radio" && q.defaultValue) init[q.id] = q.defaultValue;
      if (q.type === "checkbox") init[q.id] = q.defaultChecked ? "true" : "false";
    }
    return init;
  });

  // Per-layer colors (hex) — initialized from first swatch of each color/thumbnail question
  const [layerColors, setLayerColors] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const l of layers) {
      if (l.type === "colorable") init[l.id] = l.defaultColor || "#888";
    }
    for (const q of questions) {
      if ((q.type === "color" || (q.type === "thumbnail" && (q as any).displayType !== "image")) && q.swatches.length > 0) {
        for (const layerId of getEffectiveLayerIds(q as ColorQuestion | ThumbnailQuestion)) {
          init[layerId] = q.swatches[0].value;
        }
      }
    }
    return init;
  });

  // Layer image overrides — when a thumbnail+image answer is selected, this
  // replaces the layer's base src so the correct image shows per view.
  const [layerImageOverrides, setLayerImageOverrides] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    for (const q of questions) {
      if (q.type === "thumbnail" && (q as any).displayType === "image" && q.swatches.length > 0) {
        const first = q.swatches[0];
        if (!first.viewImages?.length) continue;
        const views = first.viewImages.map((v) => v || "");
        for (const layerId of getEffectiveLayerIds(q as ThumbnailQuestion)) {
          init[layerId] = views;
        }
      }
    }
    return init;
  });

  // Per-question canvas background images (label / dropdown / etc with viewImages).
  // Keyed by question ID. Empty on init — only populated when user actively selects.
  const [labelAnswerImages, setLabelAnswerImages] = useState<Record<string, (string | null)[]>>({});

  // Transient hover preview — overrides labelAnswerImages on canvas while user is hovering.
  const [hoverViewImages, setHoverViewImages] = useState<(string | null)[] | null>(null);

  // Per-layer texture images (override flat color) — exclude image-type thumbnails
  // since their swatch imageUrl is the picker thumbnail, not a colorization texture.
  const [layerTextures, setLayerTextures] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const q of questions) {
      const isImageThumbnail = q.type === "thumbnail" && ((q as any).displayType ?? "image") === "image";
      if (isImageThumbnail) continue;
      if ((q.type === "color" || q.type === "thumbnail") && q.swatches.length > 0 && q.swatches[0].imageUrl) {
        for (const layerId of getEffectiveLayerIds(q as ColorQuestion | ThumbnailQuestion)) {
          init[layerId] = q.swatches[0].imageUrl!;
        }
      }
    }
    return init;
  });

  const [textValues, setTextValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const q of questions) {
      if (q.type === "text") init[q.id] = q.defaultText;
    }
    return init;
  });

  const [textColors, setTextColors] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const q of questions) {
      if (q.type === "text") init[q.id] = q.defaultColor;
    }
    return init;
  });

  const [textSizes, setTextSizes] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const q of questions) {
      if (q.type === "text") init[q.id] = q.defaultFontSize;
    }
    return init;
  });

  const [textFonts, setTextFonts] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const q of questions) {
      if (q.type === "text") init[q.id] = q.defaultFontFamily;
    }
    return init;
  });

  const [uploadedImages, setUploadedImages] = useState<Record<string, HTMLImageElement>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Listen for pre-filled selections from the parent when editing
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!event.data || event.data.type !== 'configurator:load-selections') return;
      const sel = event.data.selections;
      if (!sel) return;
      if (sel.selectedAnswers) {
        setSelectedAnswers(sel.selectedAnswers);
        // Rebuild layer colors and textures from restored selections
        const newColors: Record<string, string> = {};
        const newTextures: Record<string, string> = {};
        for (const q of questions) {
          if (q.type === 'color' || q.type === 'thumbnail') {
            const layerIds = getEffectiveLayerIds(q as ColorQuestion | ThumbnailQuestion);
            if (!layerIds.length) continue;
            const val = sel.selectedAnswers[q.id];
            if (val) {
              const swatch = (q as any).swatches?.find((s: any) => s.value === val);
              for (const layerId of layerIds) {
                if (swatch?.imageUrl) newTextures[layerId] = swatch.imageUrl;
                newColors[layerId] = val;
              }
            }
          }
        }
        if (Object.keys(newColors).length) setLayerColors(lc => ({ ...lc, ...newColors }));
        if (Object.keys(newTextures).length) setLayerTextures(lt => ({ ...lt, ...newTextures }));
      }
      if (sel.textValues) setTextValues(sel.textValues);
      if (sel.textColors) setTextColors(sel.textColors);
      if (sel.textSizes) setTextSizes(sel.textSizes);
      if (sel.textFonts) setTextFonts(sel.textFonts);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [questions]);

  useEffect(() => {
    if (!transformerRef.current) return;
    const node = selectedId ? nodeRefs[selectedId] : null;
    transformerRef.current.nodes(node ? [node] : []);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedId, nodeRefs]);

  const handleFileUpload = (questionId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.src = reader.result as string;
      img.onload = () => setUploadedImages((p) => ({ ...p, [questionId]: img }));
    };
    reader.readAsDataURL(file);
  };

  const handleColorSwatchClick = (q: ColorQuestion | ThumbnailQuestion, swatchValue: string, swatchImageUrl?: string) => {
    setSelectedAnswers((p) => ({ ...p, [q.id]: swatchValue }));
    const layerIds = getEffectiveLayerIds(q);
    if (!layerIds.length) return;

    const dt = (q as any).displayType ?? "color";
    if (dt === "image") {
      const swatch = q.swatches.find((s) => s.value === swatchValue);
      const views = swatch?.viewImages ?? [];
      setLayerImageOverrides((p) => {
        const next = { ...p };
        for (const lid of layerIds) next[lid] = views.map((v) => v || "");
        return next;
      });
    } else {
      setLayerColors((p) => {
        const next = { ...p };
        for (const lid of layerIds) next[lid] = swatchValue;
        return next;
      });
      setLayerTextures((p) => {
        const next = { ...p };
        for (const lid of layerIds) {
          if (swatchImageUrl) next[lid] = swatchImageUrl;
          else delete next[lid];
        }
        return next;
      });
    }
  };

  const handleAddToCart = () => {
    // Build human-readable line item properties (labels, not raw hex values)
    const properties: Record<string, string> = {};

    for (const q of questions) {
      if (!isVisible(q, selectedAnswers)) continue;

      if (q.type === "color" || q.type === "thumbnail") {
        const selectedVal = selectedAnswers[q.id];
        if (selectedVal) {
          const swatch = q.swatches.find((s) => s.value === selectedVal);
          properties[q.name] = swatch ? swatch.label : selectedVal;
        }
      } else if (q.type === "text") {
        const val = textValues[q.id];
        if (val) properties[q.name] = val;
      } else if (q.type === "dropdown") {
        const dq = q as DropdownQuestion;
        if (dq.multipleSelection) {
          const vals = (selectedAnswers[q.id] ?? "").split(",").filter(Boolean);
          if (vals.length > 0) {
            const labels = vals.map((v) => dq.options.find((o) => o.value === v)?.label ?? v);
            properties[q.name] = labels.join(", ");
          }
        } else {
          const selectedVal = selectedAnswers[q.id];
          if (selectedVal) {
            const opt = dq.options.find((o) => o.value === selectedVal);
            properties[q.name] = opt ? opt.label : selectedVal;
          }
        }
      } else if (q.type === "radio") {
        const selectedVal = selectedAnswers[q.id];
        if (selectedVal) {
          const opt = q.options.find((o) => o.value === selectedVal);
          properties[q.name] = opt ? opt.label : selectedVal;
        }
      } else if (q.type === "checkbox") {
        properties[q.name] = selectedAnswers[q.id] === "true" ? q.checkedLabel : q.uncheckedLabel;
      } else if (q.type === "label" && (q.answers ?? []).length > 0) {
        const selectedVals = (selectedAnswers[q.id] ?? "").split(",").filter(Boolean);
        if (selectedVals.length > 0) {
          const labels = selectedVals.map((v) => q.answers!.find((a) => a.value === v)?.label ?? v);
          properties[q.name] = labels.join(", ");
        }
      }
    }

    setSelectedId(null);

    // Wait for the transformer to disappear from canvas before screenshotting
    setTimeout(async () => {
      const previewDataUrl = stageRef.current?.toDataURL({ pixelRatio: 2 });

      // Upload the canvas screenshot to get a short persistent URL
      // that can be stored as a Shopify line item property (max 255 chars)
      let previewUrl = "";
      if (previewDataUrl) {
        try {
          const resp = await fetch("/upload-preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dataUrl: previewDataUrl }),
          });
          const data = await resp.json();
          if (data.url) {
            previewUrl = window.location.origin + data.url;
            properties["Preview Image"] = previewUrl; // visible in cart + customer email
            properties["_preview"] = previewUrl;      // visible in admin orders
          }
        } catch {
          // Non-fatal — order still goes through, just without the image link
        }
      }

      window.parent.postMessage(
        {
          type: "configurator:add-to-cart",
          properties,
          previewDataUrl,
          previewUrl,
          rawSelections: { selectedAnswers, textValues, textColors, textSizes, textFonts },
        },
        "*",
      );
    }, 80);
  };

  // Only need these for canvas rendering (Konva elements)
  const visibleQuestions = questions.filter((q) => {
    if (!isVisible(q, selectedAnswers)) return false;
    // Skip questions with no selectable content (undefined OR empty) — prevents orphaned labels
    if ((q.type === "radio" || q.type === "dropdown") && !(q as any).options?.length) return false;
    if ((q.type === "color" || q.type === "thumbnail") && !(q as any).swatches?.length) return false;
    return true;
  });
  const textQuestions = visibleQuestions.filter((q): q is Question & { type: "text" } => q.type === "text");
  const fileQuestions = visibleQuestions.filter((q): q is Question & { type: "file" } => q.type === "file");

  const qLabel: React.CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6b7280", marginBottom: 8 };

  // ── no config ────────────────────────────────────────────────────────────────
  if (!config) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif", gap: 12, background: "#f9fafb" }}>
        <div style={{ fontSize: 48 }}>🎨</div>
        <p style={{ color: "#6b7280", margin: 0 }}>Configurator not set up for this product yet.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f9fafb", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", overflow: "hidden" }}>

      {/* Header */}
      <div style={{ padding: "12px 20px", borderBottom: "1px solid #e5e7eb", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{productName}</h2>
        <span style={{ fontSize: 12, color: "#9ca3af" }}>Customize your product</span>
      </div>

      {/* Body: left controls + canvas */}
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "260px 1fr", gridTemplateRows: "1fr", overflow: "hidden" }}>

        {/* Left controls — rendered in ORIGINAL question order */}
        <div style={{ borderRight: "1px solid #e5e7eb", background: "#fff", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 20px" }}>
            {visibleQuestions.map((q) => {
              if (q.type === "label") {
                const labelAnswers = q.answers ?? [];
                if (labelAnswers.length > 0) {
                  const activeVals = (selectedAnswers[q.id] ?? "").split(",").filter(Boolean);
                  const toggleAnswer = (val: string) => {
                    if (q.multipleSelection) {
                      const next = activeVals.includes(val)
                        ? activeVals.filter((v) => v !== val)
                        : [...activeVals, val];
                      setSelectedAnswers((p) => ({ ...p, [q.id]: next.join(",") }));
                    } else {
                      const newVal = activeVals[0] === val ? "" : val;
                      setSelectedAnswers((p) => ({ ...p, [q.id]: newVal }));
                      if (newVal) {
                        const ans = q.answers?.find((a) => a.value === newVal);
                        if (ans?.viewImages?.some(Boolean)) {
                          setLabelAnswerImages((p) => ({ ...p, [q.id]: ans.viewImages! }));
                        } else {
                          setLabelAnswerImages((p) => { const n = { ...p }; delete n[q.id]; return n; });
                        }
                      } else {
                        setLabelAnswerImages((p) => { const n = { ...p }; delete n[q.id]; return n; });
                      }
                    }
                  };
                  return (
                    <div key={q.id} style={{ marginTop: 20 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 10 }}>{q.name}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {labelAnswers.map((a) => {
                          const isActive = activeVals.includes(a.value);
                          const hasViewImages = a.viewImages?.some(Boolean);
                          return (
                            <button key={a.value}
                              onClick={() => toggleAnswer(a.value)}
                              onMouseEnter={() => hasViewImages ? setHoverViewImages(a.viewImages!) : undefined}
                              onMouseLeave={() => setHoverViewImages(null)}
                              style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 7, border: isActive ? "2px solid #2563eb" : "1px solid #d1d5db", background: isActive ? "#eff6ff" : "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500, color: isActive ? "#2563eb" : "#374151", transition: "border-color 0.12s, background 0.12s" }}>
                              {a.imageUrl && <img src={a.imageUrl} alt={a.label} style={{ width: 22, height: 22, borderRadius: 3, objectFit: "cover", flexShrink: 0 }} />}
                              {a.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={q.id} style={{ marginTop: 20 }}>
                    <div style={qLabel}>{q.name}</div>
                    {q.content && <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{q.content}</p>}
                  </div>
                );
              }

              if (q.type === "color") {
                const activeVal = selectedAnswers[q.id];
                return (
                  <div key={q.id} style={{ marginTop: 20 }}>
                    <div style={{ ...qLabel, marginBottom: 10 }}>{q.name}</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {q.swatches.map((s) => {
                        const isActive = activeVal === s.value;
                        return (
                          <button key={s.value} title={s.label}
                            onClick={() => handleColorSwatchClick(q as ColorQuestion, s.value, s.imageUrl)}
                            style={{ width: 34, height: 34, borderRadius: s.imageUrl ? 6 : "50%", background: s.imageUrl ? "none" : s.value, backgroundImage: s.imageUrl ? `url(${s.imageUrl})` : "none", backgroundSize: "cover", border: isActive ? "3px solid #111827" : "2px solid #e5e7eb", outline: isActive ? "2px solid #fff" : "none", outlineOffset: -3, cursor: "pointer", padding: 0, overflow: "hidden" }}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              }

              if (q.type === "thumbnail") {
                const activeVal = selectedAnswers[q.id];
                return (
                  <div key={q.id} style={{ marginTop: 20 }}>
                    <div style={{ ...qLabel, marginBottom: 10 }}>{q.name}</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {q.swatches.map((s) => {
                        const isActive = activeVal === s.value;
                        return (
                          <button key={s.value} title={s.label}
                            onClick={() => handleColorSwatchClick(q as ThumbnailQuestion, s.value, s.imageUrl)}
                            style={{ width: 52, height: 52, borderRadius: 8, overflow: "hidden", padding: 0, cursor: "pointer", border: isActive ? "3px solid #111827" : "2px solid #e5e7eb", outline: isActive ? "2px solid #fff" : "none", outlineOffset: -3, background: s.imageUrl ? "none" : s.value }}
                          >
                            {s.imageUrl ? <img src={s.imageUrl} alt={s.label} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : <span style={{ display: "block", width: "100%", height: "100%", background: s.value }} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              if (q.type === "dropdown") {
                const dq = q as DropdownQuestion;
                const isImageDrop = dq.displayType === "image";
                const selectedVals = dq.multipleSelection
                  ? (selectedAnswers[q.id] ?? "").split(",").filter(Boolean)
                  : [selectedAnswers[q.id] ?? ""].filter(Boolean);

                const toggleVal = (val: string) => {
                  if (dq.multipleSelection) {
                    const cur = (selectedAnswers[q.id] ?? "").split(",").filter(Boolean);
                    const next = cur.includes(val) ? cur.filter((v) => v !== val) : [...cur, val];
                    setSelectedAnswers((p) => ({ ...p, [q.id]: next.join(",") }));
                  } else {
                    setSelectedAnswers((p) => ({ ...p, [q.id]: val }));
                    const opt = dq.options.find((o) => o.value === val);
                    if ((opt as any)?.viewImages?.some(Boolean)) {
                      setLabelAnswerImages((p) => ({ ...p, [q.id]: (opt as any).viewImages }));
                    } else {
                      setLabelAnswerImages((p) => { const n = { ...p }; delete n[q.id]; return n; });
                    }
                  }
                };

                if (isImageDrop) {
                  return (
                    <ImageDropdown
                      key={q.id}
                      q={dq}
                      selectedVals={selectedVals}
                      onToggle={toggleVal}
                      onHoverImages={setHoverViewImages}
                      qLabel={qLabel}
                    />
                  );
                }

                return (
                  <div key={q.id} style={{ marginTop: 20 }}>
                    <div style={qLabel}>{q.name}</div>
                    <select value={selectedAnswers[q.id] || ""} onChange={(e) => setSelectedAnswers((p) => ({ ...p, [q.id]: e.target.value }))} style={{ width: "100%", padding: "9px 10px", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 13, boxSizing: "border-box" }}>
                      <option value="">— select —</option>
                      {(q.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                );
              }

              if (q.type === "radio") return (
                <div key={q.id} style={{ marginTop: 20 }}>
                  <div style={qLabel}>{q.name}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {(q.options ?? []).map((o) => (
                      <label key={o.value} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "8px 12px", borderRadius: 7, border: selectedAnswers[q.id] === o.value ? "2px solid #111827" : "1px solid #e5e7eb", background: selectedAnswers[q.id] === o.value ? "#f9fafb" : "#fff" }}>
                        <input type="radio" name={q.id} value={o.value} checked={selectedAnswers[q.id] === o.value} onChange={() => setSelectedAnswers((p) => ({ ...p, [q.id]: o.value }))} style={{ accentColor: "#111827" }} />
                        <span style={{ fontSize: 13 }}>{o.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );

              if (q.type === "checkbox") return (
                <div key={q.id} style={{ marginTop: 20 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 12px", borderRadius: 7, border: "1px solid #e5e7eb", background: "#fff" }}>
                    <input type="checkbox" checked={selectedAnswers[q.id] === "true"} onChange={(e) => setSelectedAnswers((p) => ({ ...p, [q.id]: e.target.checked ? "true" : "false" }))} style={{ accentColor: "#111827", width: 16, height: 16 }} />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{selectedAnswers[q.id] === "true" ? q.checkedLabel : q.uncheckedLabel}</span>
                  </label>
                </div>
              );

              if (q.type === "text") return (
                <div key={q.id} style={{ marginTop: 20 }}>
                  <div style={qLabel}>{q.name}</div>
                  <input value={textValues[q.id] ?? q.defaultText} onChange={(e) => setTextValues((p) => ({ ...p, [q.id]: e.target.value }))} placeholder={q.defaultText} style={{ width: "100%", padding: "9px 10px", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 13, boxSizing: "border-box" }} />
                  <div style={{ display: "flex", gap: 10, marginTop: 8, alignItems: "flex-end" }}>
                    <div>
                      <label style={{ fontSize: 11, color: "#9ca3af", display: "block", marginBottom: 3 }}>Colour</label>
                      <ColorPickerPopup value={textColors[q.id] ?? q.defaultColor} onChange={(hex) => setTextColors((p) => ({ ...p, [q.id]: hex }))} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, color: "#9ca3af", display: "block", marginBottom: 3 }}>Size: {textSizes[q.id] ?? q.defaultFontSize}px</label>
                      <input type="range" min={14} max={120} value={textSizes[q.id] ?? q.defaultFontSize} onChange={(e) => setTextSizes((p) => ({ ...p, [q.id]: Number(e.target.value) }))} style={{ width: "100%" }} />
                    </div>
                  </div>
                  <select value={textFonts[q.id] ?? q.defaultFontFamily} onChange={(e) => setTextFonts((p) => ({ ...p, [q.id]: e.target.value }))} style={{ width: "100%", marginTop: 7, padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12 }}>
                    {["Arial", "Georgia", "Impact", "Verdana", "Courier New", "Times New Roman"].map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              );

              if (q.type === "file") return (
                <div key={q.id} style={{ marginTop: 20 }}>
                  <div style={qLabel}>{q.name}</div>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", border: "2px dashed #e5e7eb", borderRadius: 8, cursor: "pointer", color: "#6b7280", fontSize: 12 }}>
                    <span>📁</span>
                    <span>{uploadedImages[q.id] ? "Uploaded — change" : "Choose image"}</span>
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(q.id, f); }} />
                  </label>
                </div>
              );

              return null;
            })}
          </div>

          {/* Add to Cart */}
          <div style={{ padding: "12px 16px", borderTop: "1px solid #e5e7eb" }}>
            <button
              onClick={handleAddToCart}
              style={{ width: "100%", padding: 13, background: "#111827", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer", letterSpacing: "0.01em" }}
            >
              Add to Cart
            </button>
          </div>
        </div>

        {/* Canvas area */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f3f4f6", gap: 12 }}>
          <div
            onClick={(e) => { if ((e.target as HTMLElement) === e.currentTarget) setSelectedId(null); }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {mounted && (
              <Stage
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                ref={stageRef}
                onMouseDown={(e) => { if (e.target === e.target.getStage()) setSelectedId(null); }}
                style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.10)", borderRadius: 6, background: "#fff" }}
              >
                <KonvaLayer>
                  {/* Hover preview takes full priority; otherwise show per-question selected images */}
                  {hoverViewImages ? (
                    (() => {
                      const src = hoverViewImages[currentView] || hoverViewImages.find(Boolean) || "";
                      return src ? <ProductLayer key="hover-bg" src={src} width={CANVAS_SIZE} height={CANVAS_SIZE} /> : null;
                    })()
                  ) : (
                    Object.entries(labelAnswerImages).map(([qId, images]) => {
                      const src = images[currentView] || images.find(Boolean) || "";
                      return src ? <ProductLayer key={`q-bg-${qId}`} src={src} width={CANVAS_SIZE} height={CANVAS_SIZE} /> : null;
                    })
                  )}
                  {layers.map((layer) => {
                    const overrideImages = layerImageOverrides[layer.id];
                    // Pick the right view image: prefer overrideImages (from thumbnail swatch),
                    // fall back to layer's own src/extraViews/answers for the current view.
                    // Use explicit null check so an empty-string slot doesn't incorrectly
                    // collapse to view-0 — we want the slot's own value (even if empty).
                    let src: string;
                    if (overrideImages) {
                      const slot = overrideImages[currentView];
                      src = (slot != null && slot !== "") ? slot : (overrideImages.find((s) => s !== "" && s != null) ?? getLayerSrc(layer, currentView));
                    } else {
                      src = getLayerSrc(layer, currentView);
                    }
                    const isColorable = layer.type === "colorable";
                    return (
                      <ProductLayer
                        key={layer.id}
                        src={src}
                        color={isColorable ? layerColors[layer.id] : undefined}
                        textureUrl={isColorable ? layerTextures[layer.id] : undefined}
                        width={CANVAS_SIZE}
                        height={CANVAS_SIZE}
                      />
                    );
                  })}

                  {textQuestions.map((q) => (
                    <KonvaText
                      key={q.id}
                      ref={(node) => { if (node) nodeRefs[q.id] = node; }}
                      text={textValues[q.id] ?? q.defaultText}
                      x={q.position.x * COORD_SCALE}
                      y={q.position.y * COORD_SCALE}
                      fontSize={(textSizes[q.id] ?? q.defaultFontSize) * COORD_SCALE}
                      fontFamily={textFonts[q.id] ?? q.defaultFontFamily}
                      fill={textColors[q.id] ?? q.defaultColor}
                      draggable
                      onClick={() => setSelectedId(q.id)}
                      onTap={() => setSelectedId(q.id)}
                    />
                  ))}

                  {fileQuestions.map((q) =>
                    uploadedImages[q.id] ? (
                      <KonvaImage
                        key={q.id}
                        ref={(node) => { if (node) nodeRefs[q.id] = node; }}
                        image={uploadedImages[q.id]}
                        x={q.position.x * COORD_SCALE}
                        y={q.position.y * COORD_SCALE}
                        width={q.defaultWidth * COORD_SCALE}
                        height={q.defaultHeight * COORD_SCALE}
                        draggable
                        onClick={() => setSelectedId(q.id)}
                        onTap={() => setSelectedId(q.id)}
                      />
                    ) : null,
                  )}

                  <Transformer
                    ref={transformerRef}
                    boundBoxFunc={(old, nw) => (nw.width < 20 || nw.height < 20 ? old : nw)}
                  />
                </KonvaLayer>
              </Stage>
            )}
          </div>

          {/* View navigation dots */}
          {numViews > 1 && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {Array.from({ length: numViews }).map((_, vi) => (
                <button
                  key={vi}
                  onClick={() => setCurrentView(vi)}
                  style={{
                    width: vi === currentView ? 22 : 10,
                    height: 10,
                    borderRadius: 5,
                    background: vi === currentView ? "#111827" : "#d1d5db",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    transition: "width 0.15s",
                  }}
                  title={`View ${vi + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
