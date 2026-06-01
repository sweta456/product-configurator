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
import prisma from "../db.server";
import {
  type LayerConfig,
  type Question,
  type ColorQuestion,
  type ThumbnailQuestion,
  getLayerSrc,
  migrateOptions,
} from "../types/configurator";

export const headers: HeadersFunction = () => ({
  "Content-Security-Policy": "frame-ancestors *",
  "X-Frame-Options": "ALLOWALL",
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
      if ((q.type === "color" || q.type === "thumbnail") && q.linkedLayerId && q.swatches.length > 0) {
        init[q.linkedLayerId] = q.swatches[0].value;
      }
    }
    return init;
  });

  // Per-layer texture images (override flat color)
  const [layerTextures, setLayerTextures] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const q of questions) {
      if ((q.type === "color" || q.type === "thumbnail") && q.linkedLayerId && q.swatches.length > 0 && q.swatches[0].imageUrl) {
        init[q.linkedLayerId] = q.swatches[0].imageUrl;
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
          if ((q.type === 'color' || q.type === 'thumbnail') && q.linkedLayerId) {
            const val = sel.selectedAnswers[q.id];
            if (val) {
              const swatch = (q as any).swatches?.find((s: any) => s.value === val);
              if (swatch?.imageUrl) newTextures[q.linkedLayerId!] = swatch.imageUrl;
              newColors[q.linkedLayerId!] = val;
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
    if (q.linkedLayerId) {
      setLayerColors((p) => ({ ...p, [q.linkedLayerId!]: swatchValue }));
      setLayerTextures((p) => {
        const next = { ...p };
        if (swatchImageUrl) next[q.linkedLayerId!] = swatchImageUrl;
        else delete next[q.linkedLayerId!];
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
      } else if (q.type === "dropdown" || q.type === "radio") {
        const selectedVal = selectedAnswers[q.id];
        if (selectedVal) {
          const opt = q.options.find((o) => o.value === selectedVal);
          properties[q.name] = opt ? opt.label : selectedVal;
        }
      } else if (q.type === "checkbox") {
        properties[q.name] = selectedAnswers[q.id] === "true" ? q.checkedLabel : q.uncheckedLabel;
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
            // _preview is underscore-prefixed: visible to merchant in orders, hidden from customer in cart
            properties["_preview"] = previewUrl;
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
  const visibleQuestions = questions.filter((q) => isVisible(q, selectedAnswers));
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
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "260px 1fr", overflow: "hidden" }}>

        {/* Left controls — rendered in ORIGINAL question order */}
        <div style={{ borderRight: "1px solid #e5e7eb", background: "#fff", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 20px" }}>
            {visibleQuestions.map((q) => {
              if (q.type === "label") return (
                <div key={q.id} style={{ marginTop: 20 }}>
                  <div style={qLabel}>{q.name}</div>
                  <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{q.content}</p>
                </div>
              );

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
                      <input type="color" value={activeVal || "#000000"} onChange={(e) => handleColorSwatchClick(q as ColorQuestion, e.target.value)} title="Custom colour" style={{ width: 34, height: 34, borderRadius: "50%", border: "2px solid #e5e7eb", padding: 2, cursor: "pointer" }} />
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

              if (q.type === "dropdown") return (
                <div key={q.id} style={{ marginTop: 20 }}>
                  <div style={qLabel}>{q.name}</div>
                  <select value={selectedAnswers[q.id] || ""} onChange={(e) => setSelectedAnswers((p) => ({ ...p, [q.id]: e.target.value }))} style={{ width: "100%", padding: "9px 10px", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 13, boxSizing: "border-box" }}>
                    <option value="">— select —</option>
                    {q.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              );

              if (q.type === "radio") return (
                <div key={q.id} style={{ marginTop: 20 }}>
                  <div style={qLabel}>{q.name}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {q.options.map((o) => (
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
                      <input type="color" value={textColors[q.id] ?? q.defaultColor} onChange={(e) => setTextColors((p) => ({ ...p, [q.id]: e.target.value }))} style={{ width: 32, height: 28, borderRadius: 4, border: "1px solid #e5e7eb" }} />
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
                  {layers.map((layer) => (
                    <ProductLayer
                      key={layer.id}
                      src={getLayerSrc(layer, currentView)}
                      color={layer.type === "colorable" ? layerColors[layer.id] : undefined}
                      textureUrl={layer.type === "colorable" ? layerTextures[layer.id] : undefined}
                      width={CANVAS_SIZE}
                      height={CANVAS_SIZE}
                    />
                  ))}

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
