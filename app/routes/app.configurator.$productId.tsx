import { useLoaderData, Link } from "react-router";
import { useState, useRef, useEffect } from "react";
import { Stage, Layer as KonvaLayer, Text as KonvaText, Image as KonvaImage, Transformer } from "react-konva";
import ProductLayer from "../components/ProductLayer";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import {
  type LayerConfig,
  type Question,
  type ColorQuestion,
  type ThumbnailQuestion,
  getLayerSrc,
  migrateOptions,
} from "../types/configurator";

const CANVAS_SIZE = 800;
// Positions are stored in 800-coordinate space; admin preview uses 800px so scale = 1
const COORD_SCALE = CANVAS_SIZE / 800;

// ─── Loader ───────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isVisible(q: Question, selectedAnswers: Record<string, string>): boolean {
  if (!q.conditions?.length) return true;
  return q.conditions.every((c) => selectedAnswers[c.questionId] === c.value);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConfiguratorPage() {
  const { product, config } = useLoaderData() as any;

  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const [nodeRefs] = useState<Record<string, any>>({});

  const layers: LayerConfig[] = (config?.layers as LayerConfig[]) ?? [];
  const questions: Question[] = migrateOptions(config?.options, layers);
  const numViews: number = (config?.options as any)?.numViews ?? 1;

  const [currentView, setCurrentView] = useState(0);

  // selectedAnswers drives conditional logic
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

  const handleSwatchClick = (q: ColorQuestion | ThumbnailQuestion, swatchValue: string, imageUrl?: string) => {
    setSelectedAnswers((p) => ({ ...p, [q.id]: swatchValue }));
    if (q.linkedLayerId) {
      setLayerColors((p) => ({ ...p, [q.linkedLayerId!]: swatchValue }));
      setLayerTextures((p) => {
        const next = { ...p };
        if (imageUrl) next[q.linkedLayerId!] = imageUrl;
        else delete next[q.linkedLayerId!];
        return next;
      });
    }
  };

  const exportDesign = () => {
    setSelectedId(null);
    setTimeout(() => {
      const uri = stageRef.current.toDataURL({ pixelRatio: 3 });
      const a = document.createElement("a");
      a.download = `${product.handle ?? "design"}.png`;
      a.href = uri;
      a.click();
    }, 80);
  };

  // ── no config ──────────────────────────────────────────────────────────────
  if (!config) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "70vh", fontFamily: "sans-serif", gap: 14 }}>
        <div style={{ fontSize: 52 }}>🎨</div>
        <h2 style={{ margin: 0 }}>{product.title}</h2>
        <p style={{ margin: 0, color: "#6b7280" }}>No configurator has been set up for this product yet.</p>
        <Link
          to={`/app/configurator-setup/${encodeURIComponent(product.id)}`}
          style={{ padding: "12px 24px", background: "#111827", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}
        >
          Open Builder →
        </Link>
      </div>
    );
  }

  // Canvas-only question lists (used for Konva rendering below)
  const textQuestions = questions.filter((q): q is Question & { type: "text" } => q.type === "text" && isVisible(q, selectedAnswers));
  const fileQuestions = questions.filter((q): q is Question & { type: "file" } => q.type === "file" && isVisible(q, selectedAnswers));
  const visibleQuestions = questions.filter((q) => isVisible(q, selectedAnswers));

  const qLabel: React.CSSProperties = { fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6b7280", marginBottom: 8 };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "290px 1fr", height: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ── Left panel ────────────────────────────────────────────────── */}
      <div style={{ borderRight: "1px solid #e5e7eb", background: "#fff", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid #f3f4f6" }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700 }}>{product.title}</h2>
          <Link to={`/app/configurator-setup/${encodeURIComponent(product.id)}`} style={{ fontSize: 12, color: "#6b7280", textDecoration: "none" }}>Edit setup →</Link>
        </div>

        {/* Questions rendered in ORIGINAL ORDER (preserves merchant-configured sequence) */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 18px 24px" }}>
          {visibleQuestions.map((q) => {
            if (q.type === "label") {
              return (
                <div key={q.id} style={{ marginTop: 22 }}>
                  <div style={qLabel}>{q.name}</div>
                  <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{q.content}</p>
                </div>
              );
            }

            if (q.type === "color") {
              const activeVal = selectedAnswers[q.id];
              return (
                <div key={q.id} style={{ marginTop: 22 }}>
                  <div style={qLabel}>{q.name}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {q.swatches.map((s) => {
                      const isActive = activeVal === s.value;
                      return (
                        <button
                          key={s.value} title={s.label}
                          onClick={() => handleSwatchClick(q as ColorQuestion, s.value, s.imageUrl)}
                          style={{
                            width: 36, height: 36,
                            borderRadius: s.imageUrl ? 6 : "50%",
                            background: s.imageUrl ? "none" : s.value,
                            backgroundImage: s.imageUrl ? `url(${s.imageUrl})` : "none",
                            backgroundSize: "cover",
                            border: isActive ? "3px solid #111827" : "2px solid #e5e7eb",
                            outline: isActive ? "2px solid #fff" : "none",
                            outlineOffset: -3, cursor: "pointer", padding: 0, overflow: "hidden",
                          }}
                        />
                      );
                    })}
                    <input
                      type="color" value={activeVal || "#000000"}
                      onChange={(e) => handleSwatchClick(q as ColorQuestion, e.target.value)}
                      title="Custom"
                      style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid #e5e7eb", padding: 2, cursor: "pointer" }}
                    />
                  </div>
                </div>
              );
            }

            if (q.type === "thumbnail") {
              const activeVal = selectedAnswers[q.id];
              return (
                <div key={q.id} style={{ marginTop: 22 }}>
                  <div style={qLabel}>{q.name}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {q.swatches.map((s) => {
                      const isActive = activeVal === s.value;
                      return (
                        <button
                          key={s.value} title={s.label}
                          onClick={() => handleSwatchClick(q as ThumbnailQuestion, s.value, s.imageUrl)}
                          style={{
                            width: 56, height: 56, borderRadius: 8, overflow: "hidden", padding: 0, cursor: "pointer",
                            border: isActive ? "3px solid #111827" : "2px solid #e5e7eb",
                            outline: isActive ? "2px solid #fff" : "none", outlineOffset: -3,
                            background: s.imageUrl ? "none" : s.value,
                          }}
                        >
                          {s.imageUrl
                            ? <img src={s.imageUrl} alt={s.label} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                            : <span style={{ display: "block", width: "100%", height: "100%", background: s.value }} />
                          }
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }

            if (q.type === "dropdown") {
              return (
                <div key={q.id} style={{ marginTop: 22 }}>
                  <div style={qLabel}>{q.name}</div>
                  <select
                    value={selectedAnswers[q.id] || ""}
                    onChange={(e) => setSelectedAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }}
                  >
                    <option value="">— select —</option>
                    {q.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              );
            }

            if (q.type === "radio") {
              return (
                <div key={q.id} style={{ marginTop: 22 }}>
                  <div style={qLabel}>{q.name}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {q.options.map((o) => (
                      <label key={o.value} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "9px 12px", borderRadius: 7, border: selectedAnswers[q.id] === o.value ? "2px solid #111827" : "1px solid #e5e7eb", background: selectedAnswers[q.id] === o.value ? "#f9fafb" : "#fff" }}>
                        <input type="radio" name={q.id} value={o.value} checked={selectedAnswers[q.id] === o.value} onChange={() => setSelectedAnswers((p) => ({ ...p, [q.id]: o.value }))} style={{ accentColor: "#111827" }} />
                        <span style={{ fontSize: 14 }}>{o.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            }

            if (q.type === "checkbox") {
              return (
                <div key={q.id} style={{ marginTop: 22 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 12px", borderRadius: 7, border: "1px solid #e5e7eb", background: "#fff" }}>
                    <input
                      type="checkbox"
                      checked={selectedAnswers[q.id] === "true"}
                      onChange={(e) => setSelectedAnswers((p) => ({ ...p, [q.id]: e.target.checked ? "true" : "false" }))}
                      style={{ accentColor: "#111827", width: 16, height: 16 }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 500 }}>
                      {selectedAnswers[q.id] === "true" ? q.checkedLabel : q.uncheckedLabel}
                    </span>
                  </label>
                </div>
              );
            }

            if (q.type === "text") {
              return (
                <div key={q.id} style={{ marginTop: 22 }}>
                  <div style={qLabel}>{q.name}</div>
                  <input
                    value={textValues[q.id] ?? q.defaultText}
                    onChange={(e) => setTextValues((p) => ({ ...p, [q.id]: e.target.value }))}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }}
                  />
                  <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "flex-end" }}>
                    <div>
                      <label style={{ fontSize: 11, color: "#9ca3af", display: "block", marginBottom: 3 }}>Colour</label>
                      <input type="color" value={textColors[q.id] ?? q.defaultColor} onChange={(e) => setTextColors((p) => ({ ...p, [q.id]: e.target.value }))} style={{ width: 34, height: 30, borderRadius: 4, border: "1px solid #e5e7eb" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, color: "#9ca3af", display: "block", marginBottom: 3 }}>Size: {textSizes[q.id] ?? q.defaultFontSize}px</label>
                      <input type="range" min={14} max={120} value={textSizes[q.id] ?? q.defaultFontSize} onChange={(e) => setTextSizes((p) => ({ ...p, [q.id]: Number(e.target.value) }))} style={{ width: "100%" }} />
                    </div>
                  </div>
                  <select value={textFonts[q.id] ?? q.defaultFontFamily} onChange={(e) => setTextFonts((p) => ({ ...p, [q.id]: e.target.value }))} style={{ width: "100%", marginTop: 8, padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13 }}>
                    {["Arial", "Georgia", "Impact", "Verdana", "Courier New", "Times New Roman"].map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              );
            }

            if (q.type === "file") {
              return (
                <div key={q.id} style={{ marginTop: 22 }}>
                  <div style={qLabel}>{q.name}</div>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", border: "2px dashed #e5e7eb", borderRadius: 8, cursor: "pointer", color: "#6b7280", fontSize: 13 }}>
                    <span>📁</span>
                    <span>{uploadedImages[q.id] ? "Image uploaded — change" : "Choose file"}</span>
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(q.id, f); }} />
                  </label>
                </div>
              );
            }

            return null;
          })}
        </div>

        <div style={{ padding: "12px 18px", borderTop: "1px solid #e5e7eb" }}>
          <button onClick={exportDesign} style={{ width: "100%", padding: 12, background: "#111827", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            Export Design
          </button>
          <Link to="/app/products" style={{ display: "block", textAlign: "center", marginTop: 8, fontSize: 12, color: "#9ca3af", textDecoration: "none" }}>← Back to products</Link>
        </div>
      </div>

      {/* ── Canvas ──────────────────────────────────────────────────────── */}
      <div
        style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f3f4f6", gap: 12 }}
        onClick={(e) => { if ((e.target as HTMLElement) === e.currentTarget) setSelectedId(null); }}
      >
        <Stage
          width={CANVAS_SIZE} height={CANVAS_SIZE}
          ref={stageRef}
          onMouseDown={(e) => { if (e.target === e.target.getStage()) setSelectedId(null); }}
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.1)", borderRadius: 4 }}
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

            <Transformer ref={transformerRef} boundBoxFunc={(old, nw) => (nw.width < 20 || nw.height < 20 ? old : nw)} />
          </KonvaLayer>
        </Stage>

        {/* View navigation dots */}
        {numViews > 1 && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {Array.from({ length: numViews }).map((_, vi) => (
              <button
                key={vi}
                onClick={() => setCurrentView(vi)}
                style={{ width: vi === currentView ? 22 : 10, height: 10, borderRadius: 5, background: vi === currentView ? "#111827" : "#d1d5db", border: "none", cursor: "pointer", padding: 0, transition: "width 0.15s" }}
                title={`View ${vi + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
