import { useLoaderData, type HeadersFunction } from "react-router";
import { useState, useRef, useEffect, useMemo } from "react";
import {
  Stage,
  Layer as KonvaLayer,
  Text as KonvaText,
  Image as KonvaImage,
  Transformer,
} from "react-konva";
import ProductLayer from "../components/ProductLayer";
import { ThreeViewer, type PartCustomization } from "../components/ThreeViewer";
import prisma from "../db.server";
import {
  type LayerConfig,
  type Question,
  type ColorQuestion,
  type ThumbnailQuestion,
  type DropdownQuestion,
  type GroupQuestion,
  type ConfiguratorStyle,
  type AppSettings,
  type LogicRule,
  getLayerSrc,
  migrateOptions,
  evaluateLogicRules,
  DEFAULT_STYLE,
  DEFAULT_APP_SETTINGS,
} from "../types/configurator";

export const headers: HeadersFunction = () => ({
  "Content-Security-Policy": "frame-ancestors *",
  "X-Frame-Options": "ALLOWALL",
  "ngrok-skip-browser-warning": "true",
});

const CANVAS_SIZE = 560;
const COORD_SCALE = CANVAS_SIZE / 800;

// ─── Loader ───────────────────────────────────────────────────────────────────

export async function loader({ request, params }: any) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const numericId = params.productId;

  if (!shop) throw new Response("Missing shop parameter", { status: 400 });

  const productId = `gid://shopify/Product/${numericId}`;

  const [config, appSettingsRecord] = await Promise.all([
    prisma.productConfig.findFirst({ where: { productId, shop } }),
    (prisma as any).appSettings.findUnique({ where: { shop } }),
  ]);

  const appSettings: AppSettings = { ...DEFAULT_APP_SETTINGS, ...((appSettingsRecord?.settings as any) ?? {}) };

  if (!config) {
    return { config: null, productName: "Product", productId, appSettings };
  }

  const opts = (config as any).options ?? {};
  const configuratorStyle: ConfiguratorStyle = { ...DEFAULT_STYLE, ...(opts.configuratorStyle ?? {}) };
  const modelMode: boolean = opts.modelMode === true;
  const glbUrl: string | undefined = opts.glbUrl as string | undefined;

  return {
    config,
    productName: (config as any).productName ?? "Product",
    productId,
    configuratorStyle,
    modelMode,
    glbUrl,
    appSettings,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isVisible(q: Question, selectedAnswers: Record<string, string>, hiddenQuestions?: Set<string>): boolean {
  if (hiddenQuestions?.has(q.id)) return false;
  if (!q.conditions?.length) return true;
  return q.conditions.every((c) => selectedAnswers[c.questionId] === c.value);
}

function getEffectiveLayerIds(q: ColorQuestion | ThumbnailQuestion): string[] {
  const linkedLayerId = q.linkedLayerId;
  const applyOn: string[] = (q as any).applyOn ?? [];
  if (linkedLayerId) return [linkedLayerId, ...applyOn];
  return applyOn;
}

// ─── Design Tokens (CSS custom properties injected once) ─────────────────────

const CSS_TOKENS = `
  :root {
    --cf-bg: #f4f6fb;
    --cf-surface: #ffffff;
    --cf-border: #e8eaed;
    --cf-border-hover: #c4c9d4;
    --cf-accent: #5c6ac4;
    --cf-accent-dark: #3b4ab0;
    --cf-accent-light: #eef0fb;
    --cf-text: #1a1d23;
    --cf-text-sub: #6b7280;
    --cf-text-muted: #9ca3af;
    --cf-radius-sm: 6px;
    --cf-radius: 10px;
    --cf-radius-lg: 14px;
    --cf-shadow-sm: 0 1px 4px rgba(0,0,0,0.07);
    --cf-shadow: 0 4px 16px rgba(0,0,0,0.10);
    --cf-shadow-lg: 0 8px 32px rgba(0,0,0,0.14);
    --cf-transition: 0.15s ease;
    --cf-swatch-gap: 8px;
    --cf-global-text-color: var(--cf-text-muted);
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; overflow: hidden; }
  button { font-family: inherit; }
  input, select, textarea { font-family: inherit; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
  ::-webkit-scrollbar-thumb:hover { background: #9ca3af; }

  /* ── Layout classes ─────────────────── */
  .cf-body {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: 320px 1fr;
    grid-template-rows: minmax(0, 1fr);
    overflow: hidden;
  }
  .cf-sidebar {
    height: 100%;
    border-right: 1px solid var(--cf-border);
    background: var(--cf-surface);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .cf-canvas-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--cf-bg);
    gap: 16px;
    padding: 24px;
    overflow: auto;
  }
  .cf-canvas-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    transform-origin: top center;
  }

  /* ── Mobile: image on top, tabs + options below ── */
  @media (max-width: 680px) {
    .cf-body {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .cf-canvas-area {
      order: 1;
      flex: 0 0 auto;
      height: 46vw;
      min-height: 190px;
      max-height: 46vh;
      padding: 8px;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      background: var(--cf-bg);
    }
    .cf-canvas-wrap { transform-origin: top center; }
    .cf-sidebar {
      order: 2;
      flex: 1;
      min-height: 0;
      border-right: none;
      border-top: 1px solid var(--cf-border);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .cf-mobile-tabs {
      display: flex;
      overflow-x: auto;
      scrollbar-width: none;
      border-bottom: 1px solid var(--cf-border);
      flex-shrink: 0;
      background: var(--cf-surface);
    }
    .cf-mobile-tabs::-webkit-scrollbar { display: none; }
    .cf-tab-btn {
      padding: 11px 14px;
      border: none;
      background: none;
      cursor: pointer;
      font-size: 11px;
      white-space: nowrap;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      flex-shrink: 0;
      transition: all 0.15s;
    }
  }

  .cf-swatch {
    transition: transform var(--cf-transition), box-shadow var(--cf-transition);
    cursor: pointer;
  }
  .cf-swatch:hover { transform: scale(1.08); box-shadow: 0 2px 8px rgba(0,0,0,0.18); }

  .cf-thumb-swatch {
    transition: transform var(--cf-transition), border-color var(--cf-transition);
    cursor: pointer;
  }
  .cf-thumb-swatch:hover { transform: scale(1.05); }

  .cf-pill-btn {
    transition: border-color var(--cf-transition), background var(--cf-transition), color var(--cf-transition);
  }
  .cf-pill-btn:hover:not(.active) {
    border-color: var(--cf-border-hover) !important;
    background: #f9fafb !important;
  }

  .cf-radio-label:hover:not(.active) {
    border-color: var(--cf-border-hover) !important;
    background: #f9fafb !important;
  }

  .cf-add-btn {
    background: linear-gradient(135deg, var(--cf-accent) 0%, var(--cf-accent-dark) 100%);
    transition: opacity var(--cf-transition), transform var(--cf-transition), box-shadow var(--cf-transition);
    box-shadow: 0 4px 14px rgba(92,106,196,0.4);
  }
  .cf-add-btn:hover { opacity: 0.93; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(92,106,196,0.5); }
  .cf-add-btn:active { transform: translateY(0); box-shadow: 0 2px 8px rgba(92,106,196,0.3); }

  @media (max-width: 680px) {
    .cf-add-btn {
      background: #111827;
      border-radius: 0 !important;
      box-shadow: none;
      padding: 17px 20px !important;
      font-size: 15px !important;
      letter-spacing: 0.04em;
    }
    .cf-add-btn:hover { box-shadow: none; transform: none; }
  }

  .cf-section-label {
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--cf-global-text-color);
    margin-bottom: 10px;
  }

  @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
  .cf-dropdown-menu { animation: fadeIn 0.12s ease; }
`;

// ─── Style → CSS vars ────────────────────────────────────────────────────────

function buildStyleVars(s: ConfiguratorStyle, a: AppSettings): string {
  const swatchRadius = s.swatchShape === "circle" ? "50%" : s.swatchShape === "square" ? "4px" : "8px";
  const swatchSize = s.swatchSize === "sm" ? "28px" : s.swatchSize === "md" ? "36px" : "46px";
  const thumbRadius = s.thumbnailShape === "circle" ? "50%" : s.thumbnailShape === "square" ? "4px" : "10px";
  const thumbSize = s.thumbnailSize === "sm" ? "44px" : s.thumbnailSize === "md" ? "56px" : "70px";
  const btnRadius = s.buttonRadius === "pill" ? "50px" : s.buttonRadius === "square" ? "4px" : "var(--cf-radius)";
  return `
    :root {
      --cf-accent: ${s.accentColor};
      --cf-accent-dark: ${adjustHex(s.accentColor, -20)};
      --cf-accent-light: ${adjustHex(s.accentColor, 180)}22;
      --cf-swatch-size: ${swatchSize};
      --cf-swatch-radius: ${swatchRadius};
      --cf-thumb-size: ${thumbSize};
      --cf-thumb-radius: ${thumbRadius};
      --cf-btn-radius: ${btnRadius};
      --cf-swatch-gap: ${a.spaceBetweenOptions}px;
      --cf-global-text-color: ${a.globalTextColor};
      --cf-opt-pad-top: ${a.marginTop}px;
      --cf-opt-pad-right: ${a.marginRight}px;
      --cf-opt-pad-bottom: ${a.marginBottom}px;
      --cf-opt-pad-left: ${a.marginLeft}px;
      --cf-opt-field-left: ${a.optionFieldLeftMargin}px;
    }
    ${a.disableZoom ? ".cf-swatch:hover { transform: none !important; }" : ""}
    ${a.disableShadow ? ".cf-swatch { box-shadow: none !important; } .cf-thumb-swatch { box-shadow: none !important; }" : ""}
  `;
}

function adjustHex(hex: string, amount: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (n & 0xff) + amount));
  return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
}

// ─── Image Dropdown ───────────────────────────────────────────────────────────

function ImageDropdown({ q, selectedVals, onToggle, onHoverImages }: {
  q: DropdownQuestion;
  selectedVals: string[];
  onToggle: (val: string) => void;
  onHoverImages?: (imgs: (string | null)[] | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedOpts = q.options.filter((o) => selectedVals.includes(o.value));
  const getThumb = (o: { thumbnailUrl?: string; viewImages?: (string | null)[] }) =>
    o.thumbnailUrl ?? o.viewImages?.find(Boolean) ?? null;

  return (
    <div style={{ position: "relative" }}>
      <div className="cf-section-label">{q.name}</div>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8,
          padding: "10px 12px", border: `1px solid var(--cf-border)`,
          borderRadius: "var(--cf-radius)", background: "var(--cf-surface)",
          cursor: "pointer", fontSize: 13, textAlign: "left",
          boxShadow: "var(--cf-shadow-sm)", transition: "border-color var(--cf-transition)",
        }}
      >
        {selectedOpts.length === 0 ? (
          <span style={{ color: "var(--cf-text-muted)", flex: 1 }}>Select an option…</span>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, flexWrap: "wrap" }}>
            {selectedOpts.map((o) => {
              const thumb = getThumb(o);
              return (
                <div key={o.value} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  {thumb && <img src={thumb} alt={o.label} style={{ width: 22, height: 22, objectFit: "cover", borderRadius: 4, border: "1px solid var(--cf-border)" }} />}
                  <span style={{ fontSize: 13, color: "var(--cf-text)" }}>{o.label}</span>
                </div>
              );
            })}
          </div>
        )}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
          <path d="M2 4l4 4 4-4" stroke="var(--cf-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && <div style={{ position: "fixed", inset: 0, zIndex: 98 }} onClick={() => { setOpen(false); onHoverImages?.(null); }} />}

      {open && (
        <div
          className="cf-dropdown-menu"
          style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 99,
            background: "var(--cf-surface)", border: `1px solid var(--cf-border)`,
            borderRadius: "var(--cf-radius)", boxShadow: "var(--cf-shadow)",
            overflow: "hidden", maxHeight: 240, overflowY: "auto",
          }}
        >
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
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "10px 12px", border: "none", cursor: "pointer", fontSize: 13,
                  background: isSelected ? "var(--cf-accent-light)" : "var(--cf-surface)",
                  textAlign: "left", borderBottom: `1px solid var(--cf-border)`,
                  color: isSelected ? "var(--cf-accent)" : "var(--cf-text)",
                }}
              >
                {thumb ? (
                  <img src={thumb} alt={o.label} style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 6, border: `2px solid ${isSelected ? "var(--cf-accent)" : "var(--cf-border)"}`, flexShrink: 0 }} />
                ) : (
                  <span style={{ width: 36, height: 36, background: "var(--cf-bg)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🏔</span>
                )}
                <span style={{ flex: 1, fontWeight: isSelected ? 600 : 400 }}>{o.label}</span>
                {isSelected && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7l3.5 3.5 5.5-6" stroke="var(--cf-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
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
  const { config, productName, configuratorStyle, modelMode, glbUrl, appSettings } = useLoaderData() as any;
  const appSet: AppSettings = { ...DEFAULT_APP_SETTINGS, ...(appSettings ?? {}) };
  // appSet provides global defaults; per-product configuratorStyle overrides them
  const cfStyle: ConfiguratorStyle = {
    ...DEFAULT_STYLE,
    swatchShape: appSet.swatchShape,
    swatchSize: appSet.swatchSize,
    ...(configuratorStyle ?? {}),
  };
  const dynamicCss = buildStyleVars(cfStyle, appSet);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    window.parent.postMessage({ type: 'configurator:ready' }, '*');
  }, []);

  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const [nodeRefs] = useState<Record<string, any>>({});
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const [canvasScale, setCanvasScale] = useState(1);

  const layers: LayerConfig[] = (config?.layers as LayerConfig[]) ?? [];
  const questions: Question[] = migrateOptions(config?.options, layers);
  const logicRules: LogicRule[] = (config?.options as any)?.logicRules ?? [];
  const numViews: number = (config?.options as any)?.numViews ?? 1;

  const [currentView, setCurrentView] = useState(0);

  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const q of questions) {
      if (q.type === "thumbnail" && (q as any).displayType === "image" && q.swatches.length > 0)
        init[q.id] = q.swatches[0].value;
      if (q.type === "dropdown") { const v = q.defaultValue || q.options[0]?.value; if (v) init[q.id] = v; }
      if (q.type === "radio") { const v = q.defaultValue || q.options[0]?.value; if (v) init[q.id] = v; }
      if (q.type === "checkbox") init[q.id] = q.defaultChecked ? "true" : "false";
      if (q.type === "label" && q.answers?.length) init[q.id] = q.answers[0].value;
      if (q.type === "color" && q.swatches.length > 0) init[q.id] = q.swatches[0].value;
    }
    return init;
  });

  const [layerColors, setLayerColors] = useState<Record<string, string>>({});

  const [layerImageOverrides, setLayerImageOverrides] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    for (const q of questions) {
      if (q.type !== "thumbnail" || (q as any).displayType !== "image") continue;
      const layerIds = getEffectiveLayerIds(q as ThumbnailQuestion);
      if (!layerIds.length || !q.swatches.length) continue;
      const first = q.swatches[0];
      if (first.viewImages?.length) {
        for (const lid of layerIds) init[lid] = first.viewImages.map((v) => v || "");
      }
    }
    return init;
  });

  const [labelAnswerImages, setLabelAnswerImages] = useState<Record<string, (string | null)[]>>(() => {
    const init: Record<string, (string | null)[]> = {};
    // Pre-load viewImages for dropdown/image questions that have a defaultValue or first option
    for (const q of questions) {
      if (q.type === "dropdown" && (q as DropdownQuestion).displayType === "image") {
        const dq = q as DropdownQuestion;
        const defaultVal = dq.defaultValue || dq.options[0]?.value;
        if (!defaultVal) continue;
        const opt = dq.options.find((o) => o.value === defaultVal);
        if (opt?.viewImages?.some(Boolean)) {
          init[q.id] = opt.viewImages!;
        }
      }
    }
    return init;
  });
  const [hoverViewImages, setHoverViewImages] = useState<(string | null)[] | null>(null);

  const [layerTextures, setLayerTextures] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const q of questions) {
      if ((q.type === "color" || q.type === "thumbnail") && q.swatches.length > 0) {
        const isImageWithViews = q.type === "thumbnail" && (q as any).displayType === "image" && q.swatches[0].viewImages?.some(Boolean);
        if (isImageWithViews) continue;
        const first = q.swatches[0];
        if (!(first as any).imageUrl) continue;
        const allIds = getEffectiveLayerIds(q as any);
        const layerIds = allIds.filter((id) => !questions.some((tq) => tq.id === id && tq.type === "text"));
        for (const lid of layerIds) init[lid] = (first as any).imageUrl;
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
      if ((q.type === "color" || q.type === "thumbnail") && q.swatches.length > 0) {
        const isImageWithViews = q.type === "thumbnail" && (q as any).displayType === "image" && q.swatches[0].viewImages?.some(Boolean);
        if (isImageWithViews) continue;
        const allIds = getEffectiveLayerIds(q as any);
        for (const id of allIds) {
          if (questions.some((tq) => tq.id === id && tq.type === "text")) init[id] = q.swatches[0].value;
        }
      }
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
  const [hoveredPartIds, setHoveredPartIds] = useState<string[]>([]);

  // Build 3D customizations from layerColors/layerTextures, filtered to glb-part layers only
  const glbCustomizations = useMemo<Record<string, PartCustomization>>(() => {
    const glbIds = new Set(layers.filter((l: any) => l.type === "glb-part").map((l: any) => l.id));
    const result: Record<string, PartCustomization> = {};
    for (const [id, color] of Object.entries(layerColors)) {
      if (glbIds.has(id)) result[id] = { ...result[id], color: color as string };
    }
    for (const [id, textureUrl] of Object.entries(layerTextures)) {
      if (glbIds.has(id)) result[id] = { ...result[id], textureUrl: textureUrl as string };
    }
    return result;
  }, [layers, layerColors, layerTextures]);
  const allGroupQuestionsInit = questions.filter((q) => q.type === "group") as GroupQuestion[];
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(
    allGroupQuestionsInit.length > 0 ? allGroupQuestionsInit[0].id : null,
  );

  const [isMobile, setIsMobile] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<string | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 680);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!event.data || event.data.type !== 'configurator:load-selections') return;
      const sel = event.data.selections;
      if (!sel) return;
      if (sel.selectedAnswers) {
        setSelectedAnswers(sel.selectedAnswers);
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

  useEffect(() => {
    if (!canvasAreaRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      const available = Math.min(width - 48, height - 56);
      setCanvasScale(Math.min(1, Math.max(0.3, available / CANVAS_SIZE)));
    });
    ro.observe(canvasAreaRef.current);
    return () => ro.disconnect();
  }, []);

  const handleFileUpload = (questionId: string, file: File) => {
    const fq = (questions as any[]).find((q) => q.id === questionId);
    const areas = fq?.printAreas as { visibleViews: number[] }[] | undefined;
    if (areas?.length) {
      const targetView = areas[0].visibleViews[0];
      if (targetView) setCurrentView(Math.min(targetView - 1, numViews - 1));
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.src = reader.result as string;
      img.onload = () => setUploadedImages({ [questionId]: img });
    };
    reader.readAsDataURL(file);
  };

  const handleColorSwatchClick = (q: ColorQuestion | ThumbnailQuestion, swatchValue: string, swatchImageUrl?: string) => {
    setSelectedAnswers((p) => ({ ...p, [q.id]: swatchValue }));
    const allIds = getEffectiveLayerIds(q);
    if (!allIds.length) return;

    const dt = (q as any).displayType ?? "color";

    if (dt === "image") {
      const swatch = q.swatches.find((s) => s.value === swatchValue);
      const viewImages = (swatch?.viewImages ?? []).map((v) => v || "");
      setLayerImageOverrides((p) => {
        const next = { ...p };
        for (const lid of allIds) next[lid] = viewImages;
        return next;
      });
      setLayerColors((p) => {
        const next = { ...p };
        for (const lid of allIds) delete next[lid];
        return next;
      });
      setLayerTextures((p) => {
        const next = { ...p };
        for (const lid of allIds) delete next[lid];
        return next;
      });
    } else {
      // Separate text-question IDs (color → textColors) from layer IDs (color → layerColors)
      const textIds = allIds.filter((id) => questions.some((tq) => tq.id === id && tq.type === "text"));
      const layerIds = allIds.filter((id) => !textIds.includes(id));

      if (textIds.length > 0) {
        setTextColors((p) => {
          const next = { ...p };
          for (const tid of textIds) next[tid] = swatchValue;
          return next;
        });
      }

      setLayerImageOverrides((p) => {
        const next = { ...p };
        for (const lid of layerIds) delete next[lid];
        return next;
      });
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
    const properties: Record<string, string> = {};

    for (const q of questions) {
      if (!isVisible(q, selectedAnswers)) continue;

      if (q.type === "color" || q.type === "thumbnail") {
        const selectedVal = selectedAnswers[q.id] || q.swatches[0]?.value;
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

    setTimeout(async () => {
      const previewDataUrl = stageRef.current?.toDataURL({ pixelRatio: 2 });

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
            properties["Preview Image"] = previewUrl;
            properties["_preview"] = previewUrl;
          }
        } catch {
          // Non-fatal
        }
      }

      window.parent.postMessage(
        {
          type: "configurator:add-to-cart",
          properties,
          previewDataUrl,
          previewUrl,
          cartAction: appSet.cartAction,
          rawSelections: { selectedAnswers, textValues, textColors, textSizes, textFonts },
        },
        "*",
      );
    }, 80);
  };

  // Evaluate logic rules to determine which questions are hidden
  const { hiddenQuestions } = evaluateLogicRules(logicRules, selectedAnswers);

  const visibleQuestions = questions.filter((q) => {
    if (!isVisible(q, selectedAnswers, hiddenQuestions)) return false;
    if ((q.type === "radio" || q.type === "dropdown") && !(q as any).options?.length) return false;
    if ((q.type === "color" || q.type === "thumbnail") && !(q as any).swatches?.length) return false;
    return true;
  });

  const textQuestions = visibleQuestions.filter((q) => q.type === "text") as any[];
  const fileQuestions = visibleQuestions.filter((q) => q.type === "file") as any[];

  // ── Group structure ──────────────────────────────────────────────────────────
  const questionById = Object.fromEntries(questions.map((q) => [q.id, q]));
  const allGroupQuestions = questions.filter((q) => q.type === "group") as GroupQuestion[];
  const groupedChildIds = new Set(allGroupQuestions.flatMap((g) => g.childIds));

  const sidebarGroups = allGroupQuestions
    .filter((g) => isVisible(g, selectedAnswers, hiddenQuestions))
    .map((g) => ({
      group: g,
      children: g.childIds
        .map((id) => questionById[id])
        .filter((q): q is Question => !!q && visibleQuestions.includes(q)),
    }))
    .filter((g) => g.children.length > 0);

  const ungroupedQuestions = visibleQuestions.filter(
    (q) => q.type !== "group" && !groupedChildIds.has(q.id),
  );

  const hasGroups = sidebarGroups.length > 0;

  const mobileTabs: { id: string; label: string }[] = hasGroups
    ? sidebarGroups.map((sg) => ({ id: sg.group.id, label: sg.group.name }))
    : ungroupedQuestions.map((q) => ({ id: q.id, label: q.name }));

  const activeTabId = mobileActiveTab ?? mobileTabs[0]?.id ?? null;

  if (!config) {
    return (
      <>
        <style>{CSS_TOKENS + dynamicCss}</style>
        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--cf-bg)" }}>
          <div style={{ textAlign: "center", padding: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎨</div>
            <p style={{ color: "var(--cf-text-sub)", fontSize: 15, fontWeight: 500 }}>Configurator not set up for this product yet.</p>
          </div>
        </div>
      </>
    );
  }

  const renderOneQuestion = (q: Question, qi: number): React.ReactNode => {
    // ── Label (info or pill answers) ──
    if (q.type === "label") {
      const labelAnswers = q.answers ?? [];
      if (labelAnswers.length > 0) {
        const activeVals = (selectedAnswers[q.id] ?? "").split(",").filter(Boolean);
        const toggleAnswer = (val: string) => {
          if (q.multipleSelection) {
            const next = activeVals.includes(val) ? activeVals.filter((v) => v !== val) : [...activeVals, val];
            setSelectedAnswers((p) => ({ ...p, [q.id]: next.join(",") }));
          } else {
            const newVal = activeVals[0] === val ? "" : val;
            setSelectedAnswers((p) => ({ ...p, [q.id]: newVal }));
            if (newVal) {
              const ans = q.answers?.find((a: any) => a.value === newVal);
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
          <QuestionBlock key={q.id} label={q.name} isFirst={qi === 0}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {labelAnswers.map((a: any) => {
                const isAct = activeVals.includes(a.value);
                const hasViewImages = a.viewImages?.some(Boolean);
                return (
                  <button
                    key={a.value}
                    className={`cf-pill-btn${isAct ? " active" : ""}`}
                    onClick={() => toggleAnswer(a.value)}
                    onMouseEnter={() => hasViewImages ? setHoverViewImages(a.viewImages) : undefined}
                    onMouseLeave={() => setHoverViewImages(null)}
                    style={choiceButtonStyle(cfStyle.choiceStyle, isAct)}
                  >
                    {a.imageUrl && <img src={a.imageUrl} alt={a.label} style={{ width: 20, height: 20, borderRadius: 3, objectFit: "cover" }} />}
                    {a.label}
                  </button>
                );
              })}
            </div>
          </QuestionBlock>
        );
      }
      return (
        <QuestionBlock key={q.id} label={q.name} isFirst={qi === 0}>
          {q.content && <p style={{ fontSize: 13, color: "var(--cf-text-sub)", lineHeight: 1.6 }}>{q.content}</p>}
        </QuestionBlock>
      );
    }

    // ── Color swatches ──
    if (q.type === "color") {
      const activeVal = selectedAnswers[q.id];
      return (
        <QuestionBlock key={q.id} label={q.name} isFirst={qi === 0}>
          <div style={{ display: "flex", gap: "var(--cf-swatch-gap)", flexWrap: "wrap" }}>
            {q.swatches.map((s: any) => {
              const isAct = activeVal === s.value;
              return (
                <button
                  key={s.value}
                  title={s.label}
                  className="cf-swatch"
                  onClick={() => handleColorSwatchClick(q as ColorQuestion, s.value, s.imageUrl)}
                  onMouseEnter={() => { if (modelMode) setHoveredPartIds(getEffectiveLayerIds(q as ColorQuestion)); }}
                  onMouseLeave={() => { if (modelMode) setHoveredPartIds([]); }}
                  style={{
                    width: "var(--cf-swatch-size)", height: "var(--cf-swatch-size)",
                    borderRadius: s.imageUrl ? "var(--cf-swatch-radius, 8px)" : "var(--cf-swatch-radius)",
                    background: s.imageUrl ? "none" : s.value,
                    backgroundImage: s.imageUrl ? `url(${s.imageUrl})` : "none",
                    backgroundSize: "cover",
                    border: isAct ? "3px solid var(--cf-accent)" : "2px solid var(--cf-border)",
                    outline: isAct ? "3px solid var(--cf-accent-light)" : "none",
                    outlineOffset: 1,
                    cursor: "pointer",
                    padding: 0,
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                />
              );
            })}
          </div>
        </QuestionBlock>
      );
    }

    // ── Thumbnail swatches ──
    if (q.type === "thumbnail") {
      const activeVal = selectedAnswers[q.id];
      return (
        <QuestionBlock key={q.id} label={q.name} isFirst={qi === 0}>
          <div style={{ display: "flex", gap: "var(--cf-swatch-gap)", flexWrap: "wrap" }}>
            {q.swatches.map((s: any) => {
              const isAct = activeVal === s.value;
              return (
                <div key={s.value} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <button
                    title={s.label}
                    className="cf-thumb-swatch"
                    onClick={() => handleColorSwatchClick(q as ThumbnailQuestion, s.value, s.imageUrl)}
                    style={{
                      width: "var(--cf-thumb-size)", height: "var(--cf-thumb-size)",
                      borderRadius: "var(--cf-thumb-radius)", overflow: "hidden", padding: 0,
                      cursor: "pointer",
                      border: isAct ? "3px solid var(--cf-accent)" : "2px solid var(--cf-border)",
                      outline: isAct ? "3px solid var(--cf-accent-light)" : "none",
                      outlineOffset: 1,
                      background: s.imageUrl ? "none" : s.value,
                      boxShadow: isAct ? `0 2px 8px var(--cf-accent-light)` : "var(--cf-shadow-sm)",
                      flexShrink: 0,
                    }}
                  >
                    {s.imageUrl
                      ? <img src={s.imageUrl} alt={s.label} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      : <span style={{ display: "block", width: "100%", height: "100%", background: s.value }} />}
                  </button>
                  {cfStyle.showLabels && (
                    <span style={{ fontSize: 10, color: isAct ? "var(--cf-accent)" : "var(--cf-text-muted)", textAlign: "center", maxWidth: "var(--cf-thumb-size)", display: "block", wordBreak: "break-word", fontWeight: isAct ? 600 : 400 }}>
                      {s.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </QuestionBlock>
      );
    }

    // ── Dropdown ──
    if (q.type === "dropdown") {
      const dq = q as DropdownQuestion;
      const isImageDrop = dq.displayType === "image";
      const selectedVals = dq.multipleSelection
        ? (selectedAnswers[q.id] ?? "").split(",").filter(Boolean)
        : [selectedAnswers[q.id] ?? ""].filter(Boolean);

      const toggleVal = (val: string) => {
        if (dq.multipleSelection) {
          const cur = (selectedAnswers[q.id] ?? "").split(",").filter(Boolean);
          const isRemoving = cur.includes(val);
          const next = isRemoving ? cur.filter((v) => v !== val) : [...cur, val];
          setSelectedAnswers((p) => ({ ...p, [q.id]: next.join(",") }));
          const opt = dq.options.find((o) => o.value === val);
          if (!isRemoving && (opt as any)?.viewImages?.some(Boolean)) {
            setLabelAnswerImages((p) => ({ ...p, [q.id]: (opt as any).viewImages }));
          } else if (isRemoving && next.length === 0) {
            setLabelAnswerImages((p) => { const n = { ...p }; delete n[q.id]; return n; });
          }
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
          <QuestionBlock key={q.id} label="" isFirst={qi === 0}>
            <ImageDropdown q={dq} selectedVals={selectedVals} onToggle={toggleVal} onHoverImages={setHoverViewImages} />
          </QuestionBlock>
        );
      }

      return (
        <QuestionBlock key={q.id} label={q.name} isFirst={qi === 0}>
          <div style={{ position: "relative" }}>
            <select
              value={selectedAnswers[q.id] || ""}
              onChange={(e) => setSelectedAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
              style={{
                width: "100%", padding: "10px 36px 10px 12px",
                border: `1.5px solid var(--cf-border)`,
                borderRadius: "var(--cf-radius)",
                fontSize: 13, appearance: "none",
                background: "var(--cf-surface)",
                color: "var(--cf-text)",
                cursor: "pointer",
                boxShadow: "var(--cf-shadow-sm)",
                outline: "none",
              }}
            >
              <option value="">Select an option…</option>
              {(q.options ?? []).map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <path d="M2 4l4 4 4-4" stroke="var(--cf-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </QuestionBlock>
      );
    }

    // ── Radio ──
    if (q.type === "radio") return (
      <QuestionBlock key={q.id} label={q.name} isFirst={qi === 0}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(q.options ?? []).map((o: any) => {
            const isAct = selectedAnswers[q.id] === o.value;
            return (
              <label key={o.value} className={`cf-radio-label${isAct ? " active" : ""}`} style={radioLabelStyle(cfStyle.choiceStyle, isAct)}>
                {cfStyle.choiceStyle !== "pill" && (
                  <div style={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, border: `2px solid ${isAct ? "var(--cf-accent)" : "var(--cf-border)"}`, background: isAct ? "var(--cf-accent)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all var(--cf-transition)" }}>
                    {isAct && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                  </div>
                )}
                <input type="radio" name={q.id} value={o.value} checked={isAct} onChange={() => setSelectedAnswers((p) => ({ ...p, [q.id]: o.value }))} style={{ display: "none" }} />
                <span style={{ fontSize: 13, fontWeight: isAct ? 600 : 400, color: isAct ? "var(--cf-accent)" : "var(--cf-text)" }}>{o.label}</span>
              </label>
            );
          })}
        </div>
      </QuestionBlock>
    );

    // ── Checkbox ──
    if (q.type === "checkbox") return (
      <QuestionBlock key={q.id} label="" isFirst={qi === 0}>
        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 12px", borderRadius: "var(--cf-radius)", border: `1.5px solid var(--cf-border)`, background: "var(--cf-surface)", boxShadow: "var(--cf-shadow-sm)" }}>
          <div
            onClick={() => setSelectedAnswers((p) => ({ ...p, [q.id]: p[q.id] === "true" ? "false" : "true" }))}
            style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0, border: `2px solid ${selectedAnswers[q.id] === "true" ? "var(--cf-accent)" : "var(--cf-border)"}`, background: selectedAnswers[q.id] === "true" ? "var(--cf-accent)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all var(--cf-transition)" }}
          >
            {selectedAnswers[q.id] === "true" && (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1.5 5l2.5 2.5 5-5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <input type="checkbox" checked={selectedAnswers[q.id] === "true"} onChange={(e) => setSelectedAnswers((p) => ({ ...p, [q.id]: e.target.checked ? "true" : "false" }))} style={{ display: "none" }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--cf-text)" }}>
            {selectedAnswers[q.id] === "true" ? q.checkedLabel : q.uncheckedLabel}
          </span>
        </label>
      </QuestionBlock>
    );

    // ── Text input ──
    if (q.type === "text") {
      const maxChars = (q as any).maxChars ?? 15;
      const currentLen = (textValues[q.id] ?? q.defaultText ?? "").length;
      const atLimit = currentLen >= maxChars;
      const pa = (q as any).printArea;
      return (
        <QuestionBlock key={q.id} label={q.name} isFirst={qi === 0}>
          <div style={{ position: "relative" }}>
            <textarea
              value={textValues[q.id] ?? q.defaultText}
              onChange={(e) => setTextValues((p) => ({ ...p, [q.id]: e.target.value }))}
              placeholder={q.defaultText || "Enter text…"}
              maxLength={maxChars}
              rows={3}
              style={{ width: "100%", padding: "10px 12px", border: `1.5px solid var(--cf-border)`, borderRadius: "var(--cf-radius)", fontSize: 13, boxSizing: "border-box", background: "var(--cf-surface)", color: "var(--cf-text)", outline: "none", boxShadow: "var(--cf-shadow-sm)", transition: "border-color var(--cf-transition)", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--cf-accent)";
                if (pa?.visibleViews?.length > 0)
                  setCurrentView(Math.min(pa.visibleViews[0] - 1, numViews - 1));
              }}
              onBlur={(e) => (e.target.style.borderColor = "var(--cf-border)")}
            />
            <span style={{ position: "absolute", bottom: 6, right: 8, fontSize: 11, color: atLimit ? "#ef4444" : "var(--cf-text-muted)", fontWeight: atLimit ? 600 : 400, pointerEvents: "none" }}>
              {currentLen}/{maxChars}
            </span>
          </div>
        </QuestionBlock>
      );
    }

    // ── File upload ──
    if (q.type === "file") return (
      <QuestionBlock key={q.id} label={q.name} isFirst={qi === 0}>
        <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px", border: `2px dashed ${uploadedImages[q.id] ? "var(--cf-accent)" : "var(--cf-border)"}`, borderRadius: "var(--cf-radius)", cursor: "pointer", background: uploadedImages[q.id] ? "var(--cf-accent-light)" : "var(--cf-bg)", color: uploadedImages[q.id] ? "var(--cf-accent)" : "var(--cf-text-sub)", fontSize: 13, fontWeight: 500, transition: "all var(--cf-transition)" }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: uploadedImages[q.id] ? "var(--cf-accent)" : "var(--cf-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v8M5 5l3-3 3 3M3 12h10" stroke={uploadedImages[q.id] ? "#fff" : "var(--cf-text-sub)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span>{uploadedImages[q.id] ? "Image uploaded — change" : "Upload your image"}</span>
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(q.id, f); }} />
        </label>
      </QuestionBlock>
    );

    return null;
  };

  return (
    <>
      <style>{CSS_TOKENS + dynamicCss}</style>
      <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: "var(--cf-bg)", overflow: "hidden" }}>

        {/* ── Header ── */}
        <div style={{
          padding: "0 20px",
          borderBottom: `1px solid var(--cf-border)`,
          background: "linear-gradient(135deg, #f8f9ff 0%, var(--cf-surface) 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 56,
          flexShrink: 0,
          boxShadow: "var(--cf-shadow-sm)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32,
              background: "linear-gradient(135deg, var(--cf-accent) 0%, var(--cf-accent-dark) 100%)",
              borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 6px rgba(92,106,196,0.35)", flexShrink: 0,
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                <circle cx="13.5" cy="6.5" r="2.5"/>
                <path d="M14.622 17.897L19.5 12.5 20 7l-5.5.5-4.897 4.878M8.891 12.84 4.5 17.5l-1 3.5 3.5-1 4.66-4.391"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--cf-text)", letterSpacing: "-0.01em", lineHeight: 1.2 }}>{productName}</div>
              <div style={{ fontSize: 10, color: "var(--cf-text-muted)", fontWeight: 500, marginTop: 1 }}>Personalise your product</div>
            </div>
          </div>
          <button
            onClick={() => window.parent.postMessage({ type: 'configurator:close' }, '*')}
            aria-label="Close configurator"
            style={{
              width: 32, height: 32,
              border: `1.5px solid var(--cf-border)`,
              borderRadius: "50%",
              background: "var(--cf-surface)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              transition: "background var(--cf-transition), border-color var(--cf-transition)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#f3f4f6"; (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--cf-border-hover)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--cf-surface)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--cf-border)"; }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="var(--cf-text)" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className="cf-body">

          {/* ── Sidebar ── */}
          <div className="cf-sidebar">

            {/* Mobile horizontal tab bar */}
            {isMobile && mobileTabs.length > 0 && (
              <div className="cf-mobile-tabs">
                {mobileTabs.map((tab) => (
                  <button
                    key={tab.id}
                    className="cf-tab-btn"
                    onClick={() => setMobileActiveTab(tab.id)}
                    style={{
                      fontWeight: activeTabId === tab.id ? 700 : 500,
                      color: activeTabId === tab.id ? "var(--cf-accent)" : "var(--cf-text-sub)",
                      borderBottom: activeTabId === tab.id
                        ? "2px solid var(--cf-accent)"
                        : "2px solid transparent",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: hasGroups ? "0" : "16px 16px 8px" }}>
              {visibleQuestions.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--cf-text-muted)" }}>
                  <p style={{ fontSize: 13 }}>No options configured.</p>
                </div>
              )}

              {/* ── Grouped view ── */}
              {hasGroups && (
                <div>
                  {sidebarGroups.map((sg) => {
                    // Mobile: tabs handle navigation — skip accordion header, hide inactive groups
                    if (isMobile) {
                      if (activeTabId !== sg.group.id) return null;
                      return (
                        <div key={sg.group.id} style={{ padding: "8px 16px 16px" }}>
                          {sg.children.map((q, qi) => renderOneQuestion(q, qi))}
                        </div>
                      );
                    }
                    const isExpanded = expandedGroupId === sg.group.id;
                    return (
                      <div key={sg.group.id} style={{ borderBottom: `1px solid var(--cf-border)` }}>
                        <button
                          onClick={() => setExpandedGroupId(isExpanded ? null : sg.group.id)}
                          style={{
                            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "14px 16px", border: "none", background: isExpanded ? "var(--cf-accent-light)" : "var(--cf-surface)",
                            cursor: "pointer", textAlign: "left",
                            transition: "background var(--cf-transition)",
                          }}
                        >
                          <span style={{
                            fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
                            textTransform: "uppercase", color: isExpanded ? "var(--cf-accent)" : "var(--cf-text)",
                          }}>
                            {sg.group.name}
                          </span>
                          <svg
                            width="12" height="12" viewBox="0 0 12 12" fill="none"
                            style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s ease", flexShrink: 0 }}
                          >
                            <path d="M2 4l4 4 4-4" stroke={isExpanded ? "var(--cf-accent)" : "var(--cf-text-muted)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        {isExpanded && (
                          <div style={{ padding: "8px 16px 16px", background: "var(--cf-surface)" }}>
                            {sg.children.map((q, qi) => renderOneQuestion(q, qi))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {ungroupedQuestions.length > 0 && (
                    <div style={{ padding: "8px 16px 16px" }}>
                      {ungroupedQuestions.map((q, qi) => renderOneQuestion(q, qi))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Flat (no-group) view ── */}
              {!hasGroups && visibleQuestions
                .filter((q) => !isMobile || !activeTabId || activeTabId === q.id)
                .map((q, qi) => renderOneQuestion(q, qi))}
            </div>

            {/* ── Add to Cart ── */}
            <div style={{
              padding: isMobile ? "0" : "14px 16px 16px",
              borderTop: isMobile ? "none" : `1px solid var(--cf-border)`,
              background: isMobile ? "transparent" : "linear-gradient(180deg, var(--cf-surface) 0%, #f8f9ff 100%)",
              flexShrink: 0,
            }}>
              <button
                onClick={handleAddToCart}
                className="cf-add-btn"
                style={{
                  width: "100%", padding: "15px 20px",
                  color: "#fff", border: "none", borderRadius: "var(--cf-btn-radius, var(--cf-radius))",
                  fontWeight: 700, fontSize: 14, cursor: "pointer",
                  letterSpacing: "0.02em",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                }}
              >
                <svg width="17" height="17" viewBox="0 0 16 16" fill="none">
                  <path d="M1 1h2l2 8h7l1.5-5H5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="8" cy="13.5" r="1.5" fill="currentColor"/>
                  <circle cx="12" cy="13.5" r="1.5" fill="currentColor"/>
                </svg>
                Add to Cart
              </button>
            </div>
          </div>

          {/* ── Canvas area ── */}
          <div ref={canvasAreaRef} className="cf-canvas-area">
            <div className="cf-canvas-wrap" style={{ transform: `scale(${canvasScale})`, marginBottom: -(CANVAS_SIZE * (1 - canvasScale)) }}>
            <div
              onClick={(e) => { if ((e.target as HTMLElement) === e.currentTarget) setSelectedId(null); }}
              style={{ position: "relative" }}
            >
              {mounted && modelMode && glbUrl ? (
                <ThreeViewer
                  glbUrl={glbUrl}
                  parts={layers.filter((l: any) => l.type === "glb-part")}
                  customizations={glbCustomizations}
                  width={CANVAS_SIZE}
                  height={CANVAS_SIZE}
                  hoveredPartIds={hoveredPartIds}
                />
              ) : mounted && (
                <Stage
                  width={CANVAS_SIZE}
                  height={CANVAS_SIZE}
                  ref={stageRef}
                  onMouseDown={(e) => { if (e.target === e.target.getStage()) setSelectedId(null); }}
                  style={{
                    boxShadow: "0 12px 48px rgba(0,0,0,0.13), 0 2px 10px rgba(0,0,0,0.07)",
                    borderRadius: 14,
                    background: "#fff",
                    display: "block",
                  }}
                >
                  <KonvaLayer>
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
                    {layers.map((layer: any) => {
                      if (layer.type === "glb-part") return null;
                      const overrideImages = layerImageOverrides[layer.id];
                      let src: string;
                      if (overrideImages) {
                        const slot = overrideImages[currentView];
                        const baseSrc = getLayerSrc(layer, currentView);
                        src = (slot != null && slot !== "") ? slot : (baseSrc || overrideImages.find((s: string) => s !== "" && s != null) || "");
                      } else {
                        src = getLayerSrc(layer, currentView);
                      }
                      return (
                        <ProductLayer
                          key={layer.id}
                          src={src}
                          color={layerColors[layer.id]}
                          textureUrl={layerTextures[layer.id]}
                          width={CANVAS_SIZE}
                          height={CANVAS_SIZE}
                        />
                      );
                    })}

                    {textQuestions
                      .filter((q) => {
                        const pa = (q as any).printArea;
                        return !pa || pa.visibleViews.includes(currentView + 1);
                      })
                      .map((q) => {
                        const pa = (q as any).printArea;
                        return (
                          <KonvaText
                            key={q.id}
                            ref={(node: any) => { if (node) nodeRefs[q.id] = node; }}
                            text={textValues[q.id] ?? q.defaultText}
                            x={(pa?.x ?? q.position.x) * COORD_SCALE}
                            y={(pa?.y ?? q.position.y) * COORD_SCALE}
                            rotation={pa?.rotation ?? (q as any).rotation ?? 0}
                            width={pa ? pa.width * COORD_SCALE : undefined}
                            fontSize={(textSizes[q.id] ?? q.defaultFontSize) * COORD_SCALE}
                            fontFamily={textFonts[q.id] ?? q.defaultFontFamily}
                            fill={textColors[q.id] ?? q.defaultColor}
                            wrap="word"
                            draggable
                            onClick={() => setSelectedId(q.id)}
                            onTap={() => setSelectedId(q.id)}
                          />
                        );
                      })}

                    {fileQuestions
                      .filter((q) => {
                        const areas = q.printAreas as { visibleViews: number[] }[] | undefined;
                        if (!areas || areas.length === 0) return true;
                        return areas.some((pa) => pa.visibleViews.includes(currentView + 1));
                      })
                      .map((q) => {
                        const img = uploadedImages[q.id];
                        if (!img) return null;
                        return (
                          <KonvaImage
                            key={q.id}
                            image={img}
                            x={(q.position?.x ?? 100) * COORD_SCALE}
                            y={(q.position?.y ?? 100) * COORD_SCALE}
                            width={(q.defaultWidth ?? 120) * COORD_SCALE}
                            height={(q.defaultHeight ?? 120) * COORD_SCALE}
                            listening={false}
                          />
                        );
                      })}

                    <Transformer ref={transformerRef} rotateEnabled />
                  </KonvaLayer>
                </Stage>
              )}
            </div>

            {/* View navigation */}
            {numViews > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--cf-surface)", borderRadius: 32, padding: "8px 14px", boxShadow: "var(--cf-shadow-sm)", border: `1px solid var(--cf-border)` }}>
                <button
                  onClick={() => setCurrentView((v) => Math.max(0, v - 1))}
                  disabled={currentView === 0}
                  style={{
                    width: 30, height: 30, borderRadius: "50%",
                    border: `1.5px solid ${currentView === 0 ? "var(--cf-border)" : "var(--cf-border-hover)"}`,
                    background: "transparent", cursor: currentView === 0 ? "default" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    opacity: currentView === 0 ? 0.35 : 1, transition: "opacity var(--cf-transition)",
                  }}
                  aria-label="Previous view"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M8 2L4 6l4 4" stroke="var(--cf-text)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {Array.from({ length: numViews }).map((_, vi) => (
                    <button
                      key={vi}
                      onClick={() => setCurrentView(vi)}
                      style={{
                        width: vi === currentView ? 24 : 8, height: 8, borderRadius: 4,
                        background: vi === currentView ? "var(--cf-accent)" : "var(--cf-border)",
                        border: "none", cursor: "pointer", padding: 0,
                        transition: "width 0.2s ease, background 0.15s",
                      }}
                      title={`View ${vi + 1}`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setCurrentView((v) => Math.min(numViews - 1, v + 1))}
                  disabled={currentView === numViews - 1}
                  style={{
                    width: 30, height: 30, borderRadius: "50%",
                    border: `1.5px solid ${currentView === numViews - 1 ? "var(--cf-border)" : "var(--cf-border-hover)"}`,
                    background: "transparent", cursor: currentView === numViews - 1 ? "default" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    opacity: currentView === numViews - 1 ? 0.35 : 1, transition: "opacity var(--cf-transition)",
                  }}
                  aria-label="Next view"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M4 2l4 4-4 4" stroke="var(--cf-text)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            )}
            </div>{/* cf-canvas-wrap */}
          </div>{/* cf-canvas-area */}
        </div>{/* cf-body */}
      </div>
    </>
  );
}

// ─── Choice style helpers ─────────────────────────────────────────────────────

function choiceButtonStyle(choiceStyle: string, active: boolean): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 6,
    cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 500,
    color: active ? "var(--cf-accent)" : "var(--cf-text)",
    border: active ? "2px solid var(--cf-accent)" : "1.5px solid var(--cf-border)",
    background: active ? "var(--cf-accent-light)" : "var(--cf-surface)",
    transition: "all var(--cf-transition)",
  };
  if (choiceStyle === "pill") return { ...base, padding: "8px 18px", borderRadius: 20 };
  if (choiceStyle === "card") return { ...base, padding: "10px 16px", borderRadius: "var(--cf-radius)", width: "100%" };
  return { ...base, padding: "9px 14px", borderRadius: "var(--cf-radius-sm)" };
}

function radioLabelStyle(choiceStyle: string, active: boolean): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
    color: active ? "var(--cf-accent)" : "var(--cf-text)",
    border: active ? "2px solid var(--cf-accent)" : "1.5px solid var(--cf-border)",
    background: active ? "var(--cf-accent-light)" : "var(--cf-surface)",
    transition: "all var(--cf-transition)",
  };
  if (choiceStyle === "pill") return { ...base, padding: "8px 18px", borderRadius: 20, display: "inline-flex", width: "auto" };
  if (choiceStyle === "card") return { ...base, padding: "10px 16px", borderRadius: "var(--cf-radius)" };
  return { ...base, padding: "9px 12px", borderRadius: "var(--cf-radius)" };
}

// ─── QuestionBlock wrapper ────────────────────────────────────────────────────

function QuestionBlock({ label, children, isFirst }: { label: string; children: React.ReactNode; isFirst?: boolean }) {
  return (
    <div style={{
      paddingTop: isFirst ? 4 : 18,
      paddingBottom: 4,
      paddingLeft: "var(--cf-opt-field-left, 0px)",
      marginTop: "var(--cf-opt-pad-top, 0px)" as any,
      marginBottom: "var(--cf-opt-pad-bottom, 0px)" as any,
    }}>
      {label && <div className="cf-section-label">{label}</div>}
      {children}
    </div>
  );
}
