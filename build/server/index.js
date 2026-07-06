import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "stream";
import { renderToPipeableStream } from "react-dom/server";
import { ServerRouter, UNSAFE_withComponentProps, Meta, Links, Outlet, ScrollRestoration, Scripts, useLoaderData, useActionData, useSearchParams, Form, redirect, UNSAFE_withErrorBoundaryProps, useRouteError, useFetcher, useSubmit, useNavigate, useNavigation, Link } from "react-router";
import { createReadableStreamFromReadable } from "@react-router/node";
import { isbot } from "isbot";
import "@shopify/shopify-app-react-router/adapters/node";
import { shopifyApp, AppDistribution, ApiVersion, LoginErrorType, boundary } from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { PrismaClient } from "@prisma/client";
import { useState, useEffect, forwardRef, useRef, useImperativeHandle, Suspense, useMemo, useCallback } from "react";
import { Image, Stage, Layer, Text, Transformer, Group, Rect } from "react-konva";
import useImage from "use-image";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Bounds, useBounds } from "@react-three/drei";
import * as THREE from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { existsSync, mkdirSync, writeFileSync, readdirSync, statSync, unlinkSync } from "fs";
import { join } from "path";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { AppProvider as AppProvider$1, Page, BlockStack, Banner, Layout, Card, Text as Text$1, Divider, InlineStack, Box, Badge, Button, FormLayout, TextField, useIndexResourceState, EmptyState, IndexTable, Thumbnail, Spinner, Popover, ActionList, Select, Icon } from "@shopify/polaris";
import { ProductIcon, MenuHorizontalIcon, PaintBrushFlatIcon, ViewIcon, StarFilledIcon, ChevronRightIcon } from "@shopify/polaris-icons";
const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October25,
  scopes: "write_products,read_products,write_orders,read_orders,read_inventory,write_inventory,read_locations,write_publications,read_publications",
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {},
  ...process.env.SHOP_CUSTOM_DOMAIN ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] } : {},
  hooks: {
    afterAuth: async ({ admin }) => {
      const shopResponse = await admin.graphql(`#graphql
        query { shop { id } }
      `);
      const { data } = await shopResponse.json();
      await admin.graphql(
        `#graphql
        mutation SetConfiguratorAppUrl($ownerId: ID!, $value: String!) {
          metafieldsSet(metafields: [{
            ownerId: $ownerId
            namespace: "$app"
            key: "configurator_app_url"
            type: "single_line_text_field"
            value: $value
          }]) {
            userErrors { field message }
          }
        }`,
        {
          variables: {
            ownerId: data.shop.id,
            value: process.env.SHOPIFY_APP_URL || ""
          }
        }
      );
    }
  }
});
const apiVersion = ApiVersion.October25;
const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
const authenticate = shopify.authenticate;
shopify.unauthenticated;
const login = shopify.login;
shopify.registerWebhooks;
shopify.sessionStorage;
const streamTimeout = 5e3;
async function handleRequest(request, responseStatusCode, responseHeaders, reactRouterContext) {
  addDocumentResponseHeaders(request, responseHeaders);
  const userAgent = request.headers.get("user-agent");
  const callbackName = isbot(userAgent ?? "") ? "onAllReady" : "onShellReady";
  return new Promise((resolve, reject) => {
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        ServerRouter,
        {
          context: reactRouterContext,
          url: request.url
        }
      ),
      {
        [callbackName]: () => {
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          console.error(error);
        }
      }
    );
    setTimeout(abort, streamTimeout + 1e3);
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest,
  streamTimeout
}, Symbol.toStringTag, { value: "Module" }));
const polarisStyles = "/assets/styles-x1cbIzLV.css";
const links = () => [{
  rel: "preconnect",
  href: "https://cdn.shopify.com/"
}, {
  rel: "stylesheet",
  href: "https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
}, {
  rel: "stylesheet",
  href: polarisStyles
}, {
  rel: "icon",
  type: "image/svg+xml",
  href: "/logo.svg"
}];
const root = UNSAFE_withComponentProps(function App() {
  return /* @__PURE__ */ jsxs("html", {
    lang: "en",
    children: [/* @__PURE__ */ jsxs("head", {
      children: [/* @__PURE__ */ jsx("meta", {
        charSet: "utf-8"
      }), /* @__PURE__ */ jsx("meta", {
        name: "viewport",
        content: "width=device-width,initial-scale=1"
      }), /* @__PURE__ */ jsx("title", {
        children: "Konfig ‑ Product Customizer"
      }), /* @__PURE__ */ jsx("meta", {
        name: "description",
        content: "Let customers personalise products with colors, text & logos. Real-time live preview canvas for Shopify stores."
      }), /* @__PURE__ */ jsx(Meta, {}), /* @__PURE__ */ jsx(Links, {})]
    }), /* @__PURE__ */ jsxs("body", {
      children: [/* @__PURE__ */ jsx(Outlet, {}), /* @__PURE__ */ jsx(ScrollRestoration, {}), /* @__PURE__ */ jsx(Scripts, {})]
    })]
  });
});
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: root,
  links
}, Symbol.toStringTag, { value: "Module" }));
const action$g = async ({
  request
}) => {
  const {
    topic,
    shop,
    payload
  } = await authenticate.webhook(request);
  console.log(`${topic} for shop ${shop}`, JSON.stringify(payload));
  return new Response();
};
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$g
}, Symbol.toStringTag, { value: "Module" }));
async function loader$d({
  request
}) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const productId = url.searchParams.get("productId");
  if (!shop || !productId) {
    return Response.json({
      error: "Missing shop or productId"
    }, {
      status: 400
    });
  }
  const config = await prisma.productConfig.findFirst({
    where: {
      productId,
      shop
    }
  });
  return Response.json({
    config
  });
}
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$d
}, Symbol.toStringTag, { value: "Module" }));
const action$f = async ({
  request
}) => {
  const {
    payload,
    session,
    topic,
    shop
  } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);
  const current = payload.current;
  if (session) {
    await prisma.session.update({
      where: {
        id: session.id
      },
      data: {
        scope: current.toString()
      }
    });
  }
  return new Response();
};
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$f
}, Symbol.toStringTag, { value: "Module" }));
const action$e = async ({
  request
}) => {
  const {
    topic,
    shop
  } = await authenticate.webhook(request);
  console.log(`${topic} for shop ${shop} — no customer PII stored`);
  return new Response();
};
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$e
}, Symbol.toStringTag, { value: "Module" }));
const action$d = async ({
  request
}) => {
  const {
    shop,
    topic
  } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);
  await prisma.session.deleteMany({
    where: {
      shop
    }
  });
  await prisma.productConfig.deleteMany({
    where: {
      shop
    }
  });
  await prisma.configurator.deleteMany({
    where: {
      shop
    }
  });
  await prisma.appSettings.deleteMany({
    where: {
      shop
    }
  });
  const store = await prisma.store.findUnique({
    where: {
      shop
    }
  });
  if (store) {
    await prisma.product.deleteMany({
      where: {
        storeId: store.id
      }
    });
    await prisma.store.delete({
      where: {
        shop
      }
    });
  }
  return new Response();
};
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$d
}, Symbol.toStringTag, { value: "Module" }));
function useColorizedLayer(src, color, textureUrl, width, height) {
  const [sourceImage] = useImage(src, "anonymous");
  const [textureImage] = useImage(textureUrl || "", "anonymous");
  const [canvas, setCanvas] = useState(null);
  useEffect(() => {
    if (!sourceImage) {
      setCanvas(null);
      return;
    }
    if (!color && !textureUrl) {
      setCanvas(null);
      return;
    }
    const offscreen = document.createElement("canvas");
    offscreen.width = width;
    offscreen.height = height;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return;
    if (textureUrl && textureImage) {
      ctx.drawImage(textureImage, 0, 0, width, height);
    } else if (color) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(sourceImage, 0, 0, width, height);
    setCanvas(offscreen);
  }, [sourceImage, textureImage, color, textureUrl, width, height]);
  return { sourceImage, canvas };
}
function ProductLayer({
  src,
  color,
  textureUrl,
  width = 900,
  height = 900
}) {
  const { sourceImage, canvas } = useColorizedLayer(src, color, textureUrl, width, height);
  const hasEffect = color || textureUrl;
  const imageSource = hasEffect ? canvas : sourceImage;
  if (!imageSource) return null;
  return /* @__PURE__ */ jsx(
    Image,
    {
      image: imageSource,
      x: 0,
      y: 0,
      width,
      height,
      listening: false
    }
  );
}
function buildCanvasTexture(custom) {
  const { text: text2, textColor, textSize, textFont, logoImage } = custom;
  if (!text2 && !logoImage) return null;
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, size, size);
  if (logoImage) {
    const aspect = logoImage.naturalWidth / logoImage.naturalHeight;
    const w = aspect >= 1 ? size * 0.6 : size * 0.6 * aspect;
    const h = aspect >= 1 ? size * 0.6 / aspect : size * 0.6;
    ctx.drawImage(logoImage, (size - w) / 2, (size - h) / 2, w, h);
  }
  if (text2) {
    ctx.font = `${textSize ?? 64}px ${textFont ?? "Arial"}`;
    ctx.fillStyle = textColor ?? "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text2, size / 2, size / 2);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}
function MeshApplier({
  mesh,
  custom,
  loader: loader2,
  isHighlighted,
  isHovered
}) {
  useEffect(() => {
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of mats) {
      if (!mat) continue;
      if (custom.color) {
        mat.color.set(custom.color);
      }
      if (isHighlighted && !custom.text && !custom.logoImage) {
        mat.emissive.set("#4f46e5");
        mat.emissiveIntensity = 0.4;
        mat.needsUpdate = true;
      } else if (isHovered && !custom.text && !custom.logoImage) {
        mat.emissive.set("#22d3ee");
        mat.emissiveIntensity = 0.35;
        mat.needsUpdate = true;
      } else if (!custom.text && !custom.logoImage) {
        mat.emissive.set("#000000");
        mat.emissiveIntensity = 0;
        mat.needsUpdate = true;
      }
    }
  }, [mesh, custom.color, isHighlighted, isHovered]);
  useEffect(() => {
    if (!custom.textureUrl) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    let cancelled = false;
    loader2.load(custom.textureUrl, (tex) => {
      if (cancelled) {
        tex.dispose();
        return;
      }
      for (const mat of mats) {
        if (!mat) continue;
        const old = mat.map;
        mat.map = tex;
        mat.needsUpdate = true;
        old == null ? void 0 : old.dispose();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [mesh, custom.textureUrl, loader2]);
  useEffect(() => {
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const canvasTex = buildCanvasTexture(custom);
    for (const mat of mats) {
      if (!mat) continue;
      if (canvasTex) {
        const old = mat.emissiveMap;
        mat.emissiveMap = canvasTex;
        mat.emissive.set("#ffffff");
        mat.emissiveIntensity = 1;
        mat.needsUpdate = true;
        old == null ? void 0 : old.dispose();
      } else if (mat.emissiveMap) {
        mat.emissiveMap.dispose();
        mat.emissiveMap = null;
        mat.emissive.set("#000000");
        mat.needsUpdate = true;
      }
    }
    return () => {
      canvasTex == null ? void 0 : canvasTex.dispose();
    };
  }, [mesh, custom.text, custom.textColor, custom.textSize, custom.textFont, custom.logoImage]);
  return null;
}
function AutoFit() {
  const bounds = useBounds();
  useEffect(() => {
    bounds.refresh().fit();
  }, []);
  return null;
}
function GlbScene({ glbUrl, parts, customizations, selectedPartId, hoveredPartIds, onPartClick }) {
  const { scene: rawScene } = useGLTF(glbUrl);
  const textureLoader = useMemo(() => new THREE.TextureLoader(), []);
  const scene = useMemo(() => clone(rawScene), [rawScene]);
  const meshMap = useMemo(() => {
    const map = {};
    scene.traverse((obj) => {
      const mesh = obj;
      if (mesh.isMesh && mesh.name) {
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((m) => m.clone());
        } else {
          mesh.material = mesh.material.clone();
        }
        map[mesh.name] = mesh;
      }
    });
    return map;
  }, [scene]);
  const glbPartIds = parts.filter((p) => p.type === "glb-part").map((p) => p.id);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("ambientLight", { intensity: 0.8 }),
    /* @__PURE__ */ jsx("directionalLight", { position: [5, 10, 7], intensity: 1.2 }),
    /* @__PURE__ */ jsx("directionalLight", { position: [-5, -5, -5], intensity: 0.3 }),
    /* @__PURE__ */ jsxs(Bounds, { fit: true, clip: true, observe: true, margin: 1.4, children: [
      /* @__PURE__ */ jsx(
        "primitive",
        {
          object: scene,
          onClick: (e) => {
            var _a;
            e.stopPropagation();
            const clickedName = (_a = e.object) == null ? void 0 : _a.name;
            if (clickedName && onPartClick) onPartClick(clickedName);
          }
        }
      ),
      /* @__PURE__ */ jsx(AutoFit, {})
    ] }),
    glbPartIds.map((id) => {
      const mesh = meshMap[id];
      if (!mesh) return null;
      return /* @__PURE__ */ jsx(
        MeshApplier,
        {
          mesh,
          custom: customizations[id] ?? {},
          loader: textureLoader,
          isHighlighted: selectedPartId === id,
          isHovered: hoveredPartIds == null ? void 0 : hoveredPartIds.includes(id)
        },
        id
      );
    })
  ] });
}
const ThreeViewer = forwardRef(
  function ThreeViewer2({ glbUrl, parts, customizations, width = 560, height = 560, selectedPartId, hoveredPartIds, onPartClick }, ref) {
    const glRef = useRef(null);
    useImperativeHandle(ref, () => ({
      toDataURL: () => {
        var _a;
        return ((_a = glRef.current) == null ? void 0 : _a.domElement.toDataURL("image/png")) ?? "";
      }
    }));
    return /* @__PURE__ */ jsx("div", { style: { width, height, borderRadius: 8, overflow: "hidden", background: "#ffffff", cursor: "grab" }, children: /* @__PURE__ */ jsxs(
      Canvas,
      {
        gl: { preserveDrawingBuffer: true },
        camera: { position: [0, 0, 5], fov: 45 },
        style: { width: "100%", height: "100%" },
        onCreated: ({ gl }) => {
          glRef.current = gl;
        },
        children: [
          /* @__PURE__ */ jsx(Suspense, { fallback: null, children: /* @__PURE__ */ jsx(
            GlbScene,
            {
              glbUrl,
              parts,
              customizations,
              selectedPartId,
              hoveredPartIds,
              onPartClick
            }
          ) }),
          /* @__PURE__ */ jsx(OrbitControls, { makeDefault: true, enablePan: false, minDistance: 0.5, maxDistance: 20 })
        ]
      }
    ) });
  }
);
function getLayerSrc(layer, viewIndex, answerIdx = 0) {
  var _a, _b;
  if (!layer.src && ((_a = layer.answers) == null ? void 0 : _a.length)) {
    const answer = layer.answers[answerIdx] ?? layer.answers[0];
    if ((_b = answer == null ? void 0 : answer.viewImages) == null ? void 0 : _b.length) {
      const slot = answer.viewImages[viewIndex];
      if (slot != null && slot !== "") return slot;
      const hasAnyConfiguredView = answer.viewImages.some((v) => v != null && v !== "");
      if (hasAnyConfiguredView) return "";
      return answer.viewImages.find((v) => v != null && v !== "") ?? "";
    }
    return (answer == null ? void 0 : answer.imageUrl) ?? "";
  }
  if (viewIndex === 0) return layer.src;
  if (!layer.extraViews) return layer.src;
  const extraSlot = layer.extraViews[viewIndex - 1];
  if (extraSlot != null && extraSlot !== "") return extraSlot;
  const hasAnyExtraViewSet = layer.extraViews.some((v) => v != null && v !== "");
  return hasAnyExtraViewSet ? "" : layer.src;
}
const DEFAULT_STYLE = {
  swatchShape: "rounded",
  swatchSize: "md",
  thumbnailShape: "rounded",
  thumbnailSize: "md",
  choiceStyle: "pill",
  accentColor: "#5c6ac4",
  buttonRadius: "default",
  showLabels: false
};
const DEFAULT_APP_SETTINGS = {
  globalTextColor: "#333333",
  swatchShape: "rounded",
  swatchSize: "md",
  spaceBetweenOptions: 10,
  marginTop: 8,
  marginLeft: 0,
  marginRight: 0,
  marginBottom: 8,
  optionFieldLeftMargin: 10,
  subOptionLeftMargin: 55,
  disableZoom: false,
  disableShadow: false,
  cartAction: "redirect_cart",
  tempProductLifetime: "30min",
  tempProductPrefix: "[CUSTOM]"
};
function getQuestionAnswers(q) {
  switch (q.type) {
    case "color":
    case "thumbnail":
      return q.swatches.map((s) => ({ value: s.value, label: s.label }));
    case "radio":
      return q.options;
    case "dropdown":
      return q.options.map((o) => ({ value: o.value, label: o.label }));
    case "checkbox":
      return [
        { value: "true", label: q.checkedLabel || "Yes" },
        { value: "false", label: q.uncheckedLabel || "No" }
      ];
    case "label":
      return (q.answers ?? []).map((a) => ({ value: a.value, label: a.label }));
    default:
      return [];
  }
}
function evaluateLogicRules(rules, selectedAnswers) {
  const hiddenQuestions = /* @__PURE__ */ new Set();
  const unavailableAnswers = /* @__PURE__ */ new Map();
  for (const rule of rules) {
    const conditionsMet = rule.conditions.every((cond) => {
      const val = selectedAnswers[cond.questionId] ?? "";
      if (cond.operator === "is") return val === cond.value;
      if (cond.operator === "is_not") return val !== cond.value;
      if (cond.operator === "matches") return val.toLowerCase().includes(cond.value.toLowerCase());
      if (cond.operator === "doesnt_match") return !val.toLowerCase().includes(cond.value.toLowerCase());
      return false;
    });
    if (!conditionsMet) continue;
    for (const action2 of rule.actions) {
      if (action2.effect === "should_be_unavailable") {
        hiddenQuestions.add(action2.questionId);
      } else if ((action2.effect === "should_not_be" || action2.effect === "should_not_be_one_of") && action2.value) {
        if (!unavailableAnswers.has(action2.questionId)) unavailableAnswers.set(action2.questionId, /* @__PURE__ */ new Set());
        unavailableAnswers.get(action2.questionId).add(action2.value);
      }
    }
  }
  return { hiddenQuestions, unavailableAnswers };
}
const ALL_DISPLAY_TYPES = ["none", "image", "color", "logo", "text", "font", "font-size", "text-color", "text-outline"];
const VISUAL_DISPLAY_TYPES = ["image", "color", "logo", "text", "font", "font-size", "text-color", "text-outline"];
const DISPLAY_TYPE_MAP = {
  thumbnail: [...ALL_DISPLAY_TYPES],
  color: ["none", "color", "text-color"],
  text: ["none", "text"],
  file: ["none", "logo"],
  dropdown: [...ALL_DISPLAY_TYPES],
  radio: [...ALL_DISPLAY_TYPES],
  checkbox: [...ALL_DISPLAY_TYPES],
  label: [...ALL_DISPLAY_TYPES],
  group: ["none"],
  none: [...VISUAL_DISPLAY_TYPES]
};
const DISPLAY_TYPE_META = {
  none: { label: "None", icon: "⊘", desc: "Not shown on product" },
  image: { label: "Image", icon: "🏔" },
  color: { label: "Color", icon: "💧" },
  logo: { label: "Logo", icon: "⭐" },
  text: { label: "Text", icon: "T" },
  font: { label: "Font", icon: "F" },
  "font-size": { label: "Font size", icon: "↕" },
  "text-color": { label: "Text color", icon: "A" },
  "text-outline": { label: "Text outline", icon: "Ā" }
};
function migrateOptions(options, layers) {
  var _a, _b;
  if (options == null ? void 0 : options.questions) return options.questions;
  const questions = [];
  if (options == null ? void 0 : options.colorOptions) {
    for (const [layerId, swatches] of Object.entries(options.colorOptions)) {
      const layer = layers.find((l) => l.id === layerId);
      questions.push({
        id: `color-${layerId}`,
        name: `${(layer == null ? void 0 : layer.name) ?? layerId} Color`,
        type: "color",
        linkedLayerId: layerId,
        swatches: swatches.map((s) => ({ value: s.value, label: s.label || s.value }))
      });
    }
  }
  if ((_a = options == null ? void 0 : options.textOption) == null ? void 0 : _a.enabled) {
    questions.push({
      id: "custom-text",
      name: options.textOption.label || "Custom Text",
      type: "text",
      defaultText: options.textOption.defaultText || "Your Name",
      defaultColor: options.textOption.defaultColor || "#ffffff",
      defaultFontSize: options.textOption.defaultFontSize || 38,
      defaultFontFamily: "Arial",
      position: options.textOption.position || { x: 240, y: 180 }
    });
  }
  if ((_b = options == null ? void 0 : options.logoOption) == null ? void 0 : _b.enabled) {
    questions.push({
      id: "upload-logo",
      name: "Upload Logo",
      type: "file",
      position: options.logoOption.position || { x: 240, y: 280 },
      defaultWidth: 120,
      defaultHeight: 120
    });
  }
  return questions;
}
const headers$2 = () => ({
  "Content-Security-Policy": "frame-ancestors *",
  "X-Frame-Options": "ALLOWALL",
  "ngrok-skip-browser-warning": "true"
});
const CANVAS_SIZE$2 = 560;
const COORD_SCALE$1 = CANVAS_SIZE$2 / 800;
async function loader$c({
  request,
  params
}) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const numericId = params.productId;
  if (!shop) throw new Response("Missing shop parameter", {
    status: 400
  });
  const productId = `gid://shopify/Product/${numericId}`;
  const [config, appSettingsRecord] = await Promise.all([prisma.productConfig.findFirst({
    where: {
      productId,
      shop
    }
  }), prisma.appSettings.findUnique({
    where: {
      shop
    }
  })]);
  const appSettings = {
    ...DEFAULT_APP_SETTINGS,
    ...(appSettingsRecord == null ? void 0 : appSettingsRecord.settings) ?? {}
  };
  if (!config) {
    return {
      config: null,
      productName: "Product",
      productId,
      appSettings
    };
  }
  const opts = config.options ?? {};
  const configuratorStyle = {
    ...DEFAULT_STYLE,
    ...opts.configuratorStyle ?? {}
  };
  const modelMode = opts.modelMode === true;
  const glbUrl = opts.glbUrl;
  return {
    config,
    productName: config.productName ?? "Product",
    productId,
    configuratorStyle,
    modelMode,
    glbUrl,
    appSettings
  };
}
function isVisible$1(q, selectedAnswers, hiddenQuestions) {
  var _a;
  if (hiddenQuestions == null ? void 0 : hiddenQuestions.has(q.id)) return false;
  if (!((_a = q.conditions) == null ? void 0 : _a.length)) return true;
  return q.conditions.every((c) => selectedAnswers[c.questionId] === c.value);
}
function getEffectiveLayerIds$1(q) {
  const linkedLayerId = q.linkedLayerId;
  const applyOn = q.applyOn ?? [];
  if (linkedLayerId) return [linkedLayerId, ...applyOn];
  return applyOn;
}
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
function buildStyleVars(s, a) {
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
function adjustHex(hex, amount) {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amount));
  const g = Math.max(0, Math.min(255, (n >> 8 & 255) + amount));
  const b = Math.max(0, Math.min(255, (n & 255) + amount));
  return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
}
function ImageDropdown({
  q,
  selectedVals,
  onToggle,
  onHoverImages
}) {
  const [open, setOpen] = useState(false);
  const selectedOpts = q.options.filter((o) => selectedVals.includes(o.value));
  const getThumb = (o) => {
    var _a;
    return o.thumbnailUrl ?? ((_a = o.viewImages) == null ? void 0 : _a.find(Boolean)) ?? null;
  };
  return /* @__PURE__ */ jsxs("div", {
    style: {
      position: "relative"
    },
    children: [/* @__PURE__ */ jsx("div", {
      className: "cf-section-label",
      children: q.name
    }), /* @__PURE__ */ jsxs("button", {
      onClick: () => setOpen((v) => !v),
      style: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 12px",
        border: `1px solid var(--cf-border)`,
        borderRadius: "var(--cf-radius)",
        background: "var(--cf-surface)",
        cursor: "pointer",
        fontSize: 13,
        textAlign: "left",
        boxShadow: "var(--cf-shadow-sm)",
        transition: "border-color var(--cf-transition)"
      },
      children: [selectedOpts.length === 0 ? /* @__PURE__ */ jsx("span", {
        style: {
          color: "var(--cf-text-muted)",
          flex: 1
        },
        children: "Select an option…"
      }) : /* @__PURE__ */ jsx("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 6,
          flex: 1,
          flexWrap: "wrap"
        },
        children: selectedOpts.map((o) => {
          const thumb = getThumb(o);
          return /* @__PURE__ */ jsxs("div", {
            style: {
              display: "flex",
              alignItems: "center",
              gap: 5
            },
            children: [thumb && /* @__PURE__ */ jsx("img", {
              src: thumb,
              alt: o.label,
              style: {
                width: 22,
                height: 22,
                objectFit: "cover",
                borderRadius: 4,
                border: "1px solid var(--cf-border)"
              }
            }), /* @__PURE__ */ jsx("span", {
              style: {
                fontSize: 13,
                color: "var(--cf-text)"
              },
              children: o.label
            })]
          }, o.value);
        })
      }), /* @__PURE__ */ jsx("svg", {
        width: "12",
        height: "12",
        viewBox: "0 0 12 12",
        fill: "none",
        style: {
          flexShrink: 0,
          transform: open ? "rotate(180deg)" : "none",
          transition: "transform 0.15s"
        },
        children: /* @__PURE__ */ jsx("path", {
          d: "M2 4l4 4 4-4",
          stroke: "var(--cf-text-muted)",
          strokeWidth: "1.5",
          strokeLinecap: "round",
          strokeLinejoin: "round"
        })
      })]
    }), open && /* @__PURE__ */ jsx("div", {
      style: {
        position: "fixed",
        inset: 0,
        zIndex: 98
      },
      onClick: () => {
        setOpen(false);
        onHoverImages == null ? void 0 : onHoverImages(null);
      }
    }), open && /* @__PURE__ */ jsx("div", {
      className: "cf-dropdown-menu",
      style: {
        position: "absolute",
        top: "calc(100% + 4px)",
        left: 0,
        right: 0,
        zIndex: 99,
        background: "var(--cf-surface)",
        border: `1px solid var(--cf-border)`,
        borderRadius: "var(--cf-radius)",
        boxShadow: "var(--cf-shadow)",
        overflow: "hidden",
        maxHeight: 240,
        overflowY: "auto"
      },
      children: q.options.map((o) => {
        var _a;
        const thumb = getThumb(o);
        const isSelected = selectedVals.includes(o.value);
        const hasViewImages = (_a = o.viewImages) == null ? void 0 : _a.some(Boolean);
        return /* @__PURE__ */ jsxs("button", {
          onClick: () => {
            onToggle(o.value);
            if (!q.multipleSelection) setOpen(false);
          },
          onMouseEnter: () => hasViewImages ? onHoverImages == null ? void 0 : onHoverImages(o.viewImages) : void 0,
          onMouseLeave: () => onHoverImages == null ? void 0 : onHoverImages(null),
          style: {
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            padding: "10px 12px",
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            background: isSelected ? "var(--cf-accent-light)" : "var(--cf-surface)",
            textAlign: "left",
            borderBottom: `1px solid var(--cf-border)`,
            color: isSelected ? "var(--cf-accent)" : "var(--cf-text)"
          },
          children: [thumb ? /* @__PURE__ */ jsx("img", {
            src: thumb,
            alt: o.label,
            style: {
              width: 36,
              height: 36,
              objectFit: "cover",
              borderRadius: 6,
              border: `2px solid ${isSelected ? "var(--cf-accent)" : "var(--cf-border)"}`,
              flexShrink: 0
            }
          }) : /* @__PURE__ */ jsx("span", {
            style: {
              width: 36,
              height: 36,
              background: "var(--cf-bg)",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              flexShrink: 0
            },
            children: "🏔"
          }), /* @__PURE__ */ jsx("span", {
            style: {
              flex: 1,
              fontWeight: isSelected ? 600 : 400
            },
            children: o.label
          }), isSelected && /* @__PURE__ */ jsx("svg", {
            width: "14",
            height: "14",
            viewBox: "0 0 14 14",
            fill: "none",
            children: /* @__PURE__ */ jsx("path", {
              d: "M2.5 7l3.5 3.5 5.5-6",
              stroke: "var(--cf-accent)",
              strokeWidth: "2",
              strokeLinecap: "round",
              strokeLinejoin: "round"
            })
          })]
        }, o.value);
      })
    })]
  });
}
const configurator_$productId = UNSAFE_withComponentProps(function StorefrontConfiguratorPage() {
  var _a, _b, _c;
  const {
    config,
    productName,
    configuratorStyle,
    modelMode,
    glbUrl,
    appSettings
  } = useLoaderData();
  const appSet = {
    ...DEFAULT_APP_SETTINGS,
    ...appSettings ?? {}
  };
  const cfStyle = {
    ...DEFAULT_STYLE,
    swatchShape: appSet.swatchShape,
    swatchSize: appSet.swatchSize,
    ...configuratorStyle ?? {}
  };
  const dynamicCss = buildStyleVars(cfStyle, appSet);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    window.parent.postMessage({
      type: "configurator:ready"
    }, "*");
  }, []);
  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  const [nodeRefs] = useState({});
  const canvasAreaRef = useRef(null);
  const [canvasScale, setCanvasScale] = useState(1);
  const layers = (config == null ? void 0 : config.layers) ?? [];
  const questions = migrateOptions(config == null ? void 0 : config.options, layers);
  const logicRules = ((_a = config == null ? void 0 : config.options) == null ? void 0 : _a.logicRules) ?? [];
  const numViews = ((_b = config == null ? void 0 : config.options) == null ? void 0 : _b.numViews) ?? 1;
  const [currentView, setCurrentView] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState(() => {
    var _a2, _b2;
    const init = {};
    for (const q of questions) {
      if (q.type === "thumbnail" && q.displayType === "image" && q.swatches.length > 0) init[q.id] = q.swatches[0].value;
      if (q.type === "dropdown") {
        if (q.defaultValue) init[q.id] = q.defaultValue;
      }
      if (q.type === "radio") {
        const v = q.defaultValue || ((_a2 = q.options[0]) == null ? void 0 : _a2.value);
        if (v) init[q.id] = v;
      }
      if (q.type === "checkbox") init[q.id] = q.defaultChecked ? "true" : "false";
      if (q.type === "label" && ((_b2 = q.answers) == null ? void 0 : _b2.length)) init[q.id] = q.answers[0].value;
      if (q.type === "color" && q.swatches.length > 0) init[q.id] = q.swatches[0].value;
    }
    return init;
  });
  const [layerColors, setLayerColors] = useState({});
  const [layerImageOverrides, setLayerImageOverrides] = useState(() => {
    var _a2;
    const init = {};
    for (const q of questions) {
      if (q.type !== "thumbnail" || q.displayType !== "image") continue;
      const layerIds = getEffectiveLayerIds$1(q);
      if (!layerIds.length || !q.swatches.length) continue;
      const first = q.swatches[0];
      if ((_a2 = first.viewImages) == null ? void 0 : _a2.length) {
        for (const lid of layerIds) init[lid] = first.viewImages.map((v) => v || "");
      }
    }
    return init;
  });
  const [labelAnswerImages, setLabelAnswerImages] = useState(() => {
    var _a2, _b2, _c2;
    const init = {};
    for (const q of questions) {
      if (q.type === "dropdown" && q.displayType === "image") {
        const dq = q;
        const defaultVal = dq.defaultValue;
        if (!defaultVal) continue;
        const opt = dq.options.find((o) => o.value === defaultVal);
        if ((_a2 = opt == null ? void 0 : opt.viewImages) == null ? void 0 : _a2.some(Boolean)) {
          init[q.id] = opt.viewImages;
        }
      }
      if (q.type === "label" && ((_b2 = q.answers) == null ? void 0 : _b2.length)) {
        const firstAns = q.answers[0];
        if ((_c2 = firstAns.viewImages) == null ? void 0 : _c2.some(Boolean)) {
          init[q.id] = firstAns.viewImages;
        } else if (firstAns.imageUrl) {
          init[q.id] = [firstAns.imageUrl];
        }
      }
    }
    return init;
  });
  const [hoverViewImages, setHoverViewImages] = useState(null);
  const [layerTextures, setLayerTextures] = useState(() => {
    var _a2;
    const init = {};
    for (const q of questions) {
      if ((q.type === "color" || q.type === "thumbnail") && q.swatches.length > 0) {
        const isImageWithViews = q.type === "thumbnail" && q.displayType === "image" && ((_a2 = q.swatches[0].viewImages) == null ? void 0 : _a2.some(Boolean));
        if (isImageWithViews) continue;
        const first = q.swatches[0];
        if (!first.imageUrl) continue;
        const allIds = getEffectiveLayerIds$1(q);
        const layerIds = allIds.filter((id) => !questions.some((tq) => tq.id === id && tq.type === "text"));
        for (const lid of layerIds) init[lid] = first.imageUrl;
      }
    }
    return init;
  });
  const [textValues, setTextValues] = useState(() => {
    const init = {};
    for (const q of questions) {
      if (q.type === "text") init[q.id] = "";
    }
    return init;
  });
  const [textColors, setTextColors] = useState(() => {
    var _a2;
    const init = {};
    for (const q of questions) {
      if ((q.type === "color" || q.type === "thumbnail") && q.swatches.length > 0) {
        const isImageWithViews = q.type === "thumbnail" && q.displayType === "image" && ((_a2 = q.swatches[0].viewImages) == null ? void 0 : _a2.some(Boolean));
        if (isImageWithViews) continue;
        const allIds = getEffectiveLayerIds$1(q);
        for (const id of allIds) {
          if (questions.some((tq) => tq.id === id && tq.type === "text")) init[id] = q.swatches[0].value;
        }
      }
    }
    return init;
  });
  const [textSizes, setTextSizes] = useState(() => {
    const init = {};
    for (const q of questions) {
      if (q.type === "text") init[q.id] = q.defaultFontSize;
    }
    return init;
  });
  const [textFonts, setTextFonts] = useState(() => {
    const init = {};
    for (const q of questions) {
      if (q.type === "text") init[q.id] = q.defaultFontFamily;
    }
    return init;
  });
  const [uploadedImages, setUploadedImages] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredPartIds, setHoveredPartIds] = useState([]);
  const glbCustomizations = useMemo(() => {
    const glbIds = new Set(layers.filter((l) => l.type === "glb-part").map((l) => l.id));
    const result = {};
    for (const [id, color] of Object.entries(layerColors)) {
      if (glbIds.has(id)) result[id] = {
        ...result[id],
        color
      };
    }
    for (const [id, textureUrl] of Object.entries(layerTextures)) {
      if (glbIds.has(id)) result[id] = {
        ...result[id],
        textureUrl
      };
    }
    return result;
  }, [layers, layerColors, layerTextures]);
  const allGroupQuestionsInit = questions.filter((q) => q.type === "group");
  const [expandedGroupId, setExpandedGroupId] = useState(allGroupQuestionsInit.length > 0 ? allGroupQuestionsInit[0].id : null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState(null);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 680);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  useEffect(() => {
    const handler = (event) => {
      var _a2;
      if (!event.data || event.data.type !== "configurator:load-selections") return;
      const sel = event.data.selections;
      if (!sel) return;
      if (sel.selectedAnswers) {
        setSelectedAnswers(sel.selectedAnswers);
        const newColors = {};
        const newTextures = {};
        for (const q of questions) {
          if (q.type === "color" || q.type === "thumbnail") {
            const layerIds = getEffectiveLayerIds$1(q);
            if (!layerIds.length) continue;
            const val = sel.selectedAnswers[q.id];
            if (val) {
              const swatch = (_a2 = q.swatches) == null ? void 0 : _a2.find((s) => s.value === val);
              for (const layerId of layerIds) {
                if (swatch == null ? void 0 : swatch.imageUrl) newTextures[layerId] = swatch.imageUrl;
                newColors[layerId] = val;
              }
            }
          }
        }
        if (Object.keys(newColors).length) setLayerColors((lc) => ({
          ...lc,
          ...newColors
        }));
        if (Object.keys(newTextures).length) setLayerTextures((lt) => ({
          ...lt,
          ...newTextures
        }));
      }
      if (sel.textValues) setTextValues(sel.textValues);
      if (sel.textColors) setTextColors(sel.textColors);
      if (sel.textSizes) setTextSizes(sel.textSizes);
      if (sel.textFonts) setTextFonts(sel.textFonts);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [questions]);
  useEffect(() => {
    var _a2;
    if (!transformerRef.current) return;
    const node = selectedId ? nodeRefs[selectedId] : null;
    transformerRef.current.nodes(node ? [node] : []);
    (_a2 = transformerRef.current.getLayer()) == null ? void 0 : _a2.batchDraw();
  }, [selectedId, nodeRefs]);
  useEffect(() => {
    if (!canvasAreaRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const {
        width,
        height
      } = entries[0].contentRect;
      const available = Math.min(width - 48, height - 56);
      setCanvasScale(Math.min(1, Math.max(0.3, available / CANVAS_SIZE$2)));
    });
    ro.observe(canvasAreaRef.current);
    return () => ro.disconnect();
  }, []);
  const handleFileUpload = (questionId, file) => {
    const fq = questions.find((q) => q.id === questionId);
    const areas = fq == null ? void 0 : fq.printAreas;
    if (areas == null ? void 0 : areas.length) {
      const targetView = areas[0].visibleViews[0];
      if (targetView) setCurrentView(Math.min(targetView - 1, numViews - 1));
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.src = reader.result;
      img.onload = () => setUploadedImages({
        [questionId]: img
      });
    };
    reader.readAsDataURL(file);
  };
  const handleColorSwatchClick = (q, swatchValue, swatchImageUrl) => {
    setSelectedAnswers((p) => ({
      ...p,
      [q.id]: swatchValue
    }));
    const allIds = getEffectiveLayerIds$1(q);
    if (!allIds.length) return;
    const dt = q.displayType ?? "color";
    if (dt === "image") {
      const swatch = q.swatches.find((s) => s.value === swatchValue);
      const viewImages = ((swatch == null ? void 0 : swatch.viewImages) ?? []).map((v) => v || "");
      setLayerImageOverrides((p) => {
        const next = {
          ...p
        };
        for (const lid of allIds) next[lid] = viewImages;
        return next;
      });
      setLayerColors((p) => {
        const next = {
          ...p
        };
        for (const lid of allIds) delete next[lid];
        return next;
      });
      setLayerTextures((p) => {
        const next = {
          ...p
        };
        for (const lid of allIds) delete next[lid];
        return next;
      });
    } else {
      const textIds = allIds.filter((id) => questions.some((tq) => tq.id === id && tq.type === "text"));
      const layerIds = allIds.filter((id) => !textIds.includes(id));
      if (textIds.length > 0) {
        setTextColors((p) => {
          const next = {
            ...p
          };
          for (const tid of textIds) next[tid] = swatchValue;
          return next;
        });
      }
      setLayerImageOverrides((p) => {
        const next = {
          ...p
        };
        for (const lid of layerIds) delete next[lid];
        return next;
      });
      setLayerColors((p) => {
        const next = {
          ...p
        };
        for (const lid of layerIds) next[lid] = swatchValue;
        return next;
      });
      setLayerTextures((p) => {
        const next = {
          ...p
        };
        for (const lid of layerIds) {
          if (swatchImageUrl) next[lid] = swatchImageUrl;
          else delete next[lid];
        }
        return next;
      });
    }
  };
  const handleAddToCart = () => {
    var _a2;
    const properties = {};
    const childToGroupName = {};
    for (const q of questions) {
      if (q.type === "group") {
        for (const childId of q.childIds) {
          childToGroupName[childId] = q.name;
        }
      }
    }
    const propKey = (q) => {
      const groupName = childToGroupName[q.id];
      return groupName ? `${groupName} - ${q.name}` : q.name;
    };
    for (const q of questions) {
      if (!isVisible$1(q, selectedAnswers, hiddenQuestions)) continue;
      if (q.type === "color" || q.type === "thumbnail") {
        const selectedVal = selectedAnswers[q.id] || ((_a2 = q.swatches[0]) == null ? void 0 : _a2.value);
        if (selectedVal) {
          const swatch = q.swatches.find((s) => s.value === selectedVal);
          properties[propKey(q)] = swatch ? swatch.label : selectedVal;
        }
      } else if (q.type === "text") {
        const val = textValues[q.id];
        if (val) properties[propKey(q)] = val;
      } else if (q.type === "dropdown") {
        const dq = q;
        if (dq.multipleSelection) {
          const vals = (selectedAnswers[q.id] ?? "").split(",").filter(Boolean);
          if (vals.length > 0) {
            const labels = vals.map((v) => {
              var _a3;
              return ((_a3 = dq.options.find((o) => o.value === v)) == null ? void 0 : _a3.label) ?? v;
            });
            properties[propKey(q)] = labels.join(", ");
          }
        } else {
          const selectedVal = selectedAnswers[q.id];
          if (selectedVal) {
            const opt = dq.options.find((o) => o.value === selectedVal);
            properties[propKey(q)] = opt ? opt.label : selectedVal;
          }
        }
      } else if (q.type === "radio") {
        const selectedVal = selectedAnswers[q.id];
        if (selectedVal) {
          const opt = q.options.find((o) => o.value === selectedVal);
          properties[propKey(q)] = opt ? opt.label : selectedVal;
        }
      } else if (q.type === "checkbox") {
        properties[propKey(q)] = selectedAnswers[q.id] === "true" ? q.checkedLabel : q.uncheckedLabel;
      } else if (q.type === "label" && (q.answers ?? []).length > 0) {
        const selectedVals = (selectedAnswers[q.id] ?? "").split(",").filter(Boolean);
        if (selectedVals.length > 0) {
          const labels = selectedVals.map((v) => {
            var _a3;
            return ((_a3 = q.answers.find((a) => a.value === v)) == null ? void 0 : _a3.label) ?? v;
          });
          properties[propKey(q)] = labels.join(", ");
        }
      }
    }
    setSelectedId(null);
    setTimeout(async () => {
      var _a3;
      const previewDataUrl = (_a3 = stageRef.current) == null ? void 0 : _a3.toDataURL({
        pixelRatio: 2
      });
      let previewUrl = "";
      if (previewDataUrl) {
        try {
          const resp = await fetch("/upload-preview", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              dataUrl: previewDataUrl
            })
          });
          const data = await resp.json();
          if (data.url) {
            previewUrl = window.location.origin + data.url;
            properties["Preview Image"] = previewUrl;
            properties["_preview"] = previewUrl;
          }
        } catch {
        }
      }
      window.parent.postMessage({
        type: "configurator:add-to-cart",
        properties,
        previewDataUrl,
        previewUrl,
        cartAction: appSet.cartAction,
        rawSelections: {
          selectedAnswers,
          textValues,
          textColors,
          textSizes,
          textFonts
        }
      }, "*");
    }, 80);
  };
  const {
    hiddenQuestions
  } = evaluateLogicRules(logicRules, selectedAnswers);
  const visibleQuestions = questions.filter((q) => {
    var _a2, _b2;
    if (!isVisible$1(q, selectedAnswers, hiddenQuestions)) return false;
    if ((q.type === "radio" || q.type === "dropdown") && !((_a2 = q.options) == null ? void 0 : _a2.length)) return false;
    if ((q.type === "color" || q.type === "thumbnail") && !((_b2 = q.swatches) == null ? void 0 : _b2.length)) return false;
    return true;
  });
  const textQuestions = visibleQuestions.filter((q) => q.type === "text" && q.displayType !== "none");
  const fileQuestions = visibleQuestions.filter((q) => q.type === "file");
  const questionById = Object.fromEntries(questions.map((q) => [q.id, q]));
  const allGroupQuestions = questions.filter((q) => q.type === "group");
  const groupedChildIds = new Set(allGroupQuestions.flatMap((g) => g.childIds));
  const sidebarGroups = allGroupQuestions.filter((g) => isVisible$1(g, selectedAnswers, hiddenQuestions)).map((g) => ({
    group: g,
    children: g.childIds.map((id) => questionById[id]).filter((q) => !!q && visibleQuestions.includes(q))
  })).filter((g) => g.children.length > 0);
  const ungroupedQuestions = visibleQuestions.filter((q) => q.type !== "group" && !groupedChildIds.has(q.id));
  const hasGroups = sidebarGroups.length > 0;
  const mobileTabs = hasGroups ? sidebarGroups.map((sg) => ({
    id: sg.group.id,
    label: sg.group.name
  })) : ungroupedQuestions.map((q) => ({
    id: q.id,
    label: q.name
  }));
  const activeTabId = mobileActiveTab ?? ((_c = mobileTabs[0]) == null ? void 0 : _c.id) ?? null;
  if (!config) {
    return /* @__PURE__ */ jsxs(Fragment, {
      children: [/* @__PURE__ */ jsx("style", {
        children: CSS_TOKENS + dynamicCss
      }), /* @__PURE__ */ jsx("div", {
        style: {
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--cf-bg)"
        },
        children: /* @__PURE__ */ jsxs("div", {
          style: {
            textAlign: "center",
            padding: 32
          },
          children: [/* @__PURE__ */ jsx("div", {
            style: {
              fontSize: 48,
              marginBottom: 16
            },
            children: "🎨"
          }), /* @__PURE__ */ jsx("p", {
            style: {
              color: "var(--cf-text-sub)",
              fontSize: 15,
              fontWeight: 500
            },
            children: "Configurator not set up for this product yet."
          })]
        })
      })]
    });
  }
  const renderOneQuestion = (q, qi) => {
    if (q.type === "label") {
      const labelAnswers = q.answers ?? [];
      if (labelAnswers.length > 0) {
        const activeVals = (selectedAnswers[q.id] ?? "").split(",").filter(Boolean);
        const toggleAnswer = (val) => {
          var _a2, _b2;
          if (q.multipleSelection) {
            const next = activeVals.includes(val) ? activeVals.filter((v) => v !== val) : [...activeVals, val];
            setSelectedAnswers((p) => ({
              ...p,
              [q.id]: next.join(",")
            }));
          } else {
            const newVal = activeVals[0] === val ? "" : val;
            setSelectedAnswers((p) => ({
              ...p,
              [q.id]: newVal
            }));
            if (newVal) {
              const ans = (_a2 = q.answers) == null ? void 0 : _a2.find((a) => a.value === newVal);
              if ((_b2 = ans == null ? void 0 : ans.viewImages) == null ? void 0 : _b2.some(Boolean)) {
                setLabelAnswerImages((p) => ({
                  ...p,
                  [q.id]: ans.viewImages
                }));
              } else if (ans == null ? void 0 : ans.imageUrl) {
                setLabelAnswerImages((p) => ({
                  ...p,
                  [q.id]: [ans.imageUrl]
                }));
              } else {
                setLabelAnswerImages((p) => {
                  const n = {
                    ...p
                  };
                  delete n[q.id];
                  return n;
                });
              }
            } else {
              setLabelAnswerImages((p) => {
                const n = {
                  ...p
                };
                delete n[q.id];
                return n;
              });
            }
          }
        };
        return /* @__PURE__ */ jsx(QuestionBlock, {
          label: q.name,
          isFirst: qi === 0,
          children: /* @__PURE__ */ jsx("div", {
            style: {
              display: "flex",
              flexWrap: "wrap",
              gap: 8
            },
            children: labelAnswers.map((a) => {
              var _a2;
              const isAct = activeVals.includes(a.value);
              const hasViewImages = (_a2 = a.viewImages) == null ? void 0 : _a2.some(Boolean);
              return /* @__PURE__ */ jsxs("button", {
                className: `cf-pill-btn${isAct ? " active" : ""}`,
                onClick: () => toggleAnswer(a.value),
                onMouseEnter: () => hasViewImages ? setHoverViewImages(a.viewImages) : void 0,
                onMouseLeave: () => setHoverViewImages(null),
                style: choiceButtonStyle(cfStyle.choiceStyle, isAct),
                children: [a.imageUrl && /* @__PURE__ */ jsx("img", {
                  src: a.imageUrl,
                  alt: a.label,
                  style: {
                    width: 20,
                    height: 20,
                    borderRadius: 3,
                    objectFit: "cover"
                  }
                }), a.label]
              }, a.value);
            })
          })
        }, q.id);
      }
      return /* @__PURE__ */ jsx(QuestionBlock, {
        label: q.name,
        isFirst: qi === 0,
        children: q.content && /* @__PURE__ */ jsx("p", {
          style: {
            fontSize: 13,
            color: "var(--cf-text-sub)",
            lineHeight: 1.6
          },
          children: q.content
        })
      }, q.id);
    }
    if (q.type === "color") {
      const activeVal = selectedAnswers[q.id];
      return /* @__PURE__ */ jsx(QuestionBlock, {
        label: q.name,
        isFirst: qi === 0,
        children: /* @__PURE__ */ jsx("div", {
          style: {
            display: "flex",
            gap: "var(--cf-swatch-gap)",
            flexWrap: "wrap"
          },
          children: q.swatches.map((s) => {
            const isAct = activeVal === s.value;
            return /* @__PURE__ */ jsx("button", {
              title: s.label,
              className: "cf-swatch",
              onClick: () => handleColorSwatchClick(q, s.value, s.imageUrl),
              onMouseEnter: () => {
                if (modelMode) setHoveredPartIds(getEffectiveLayerIds$1(q));
              },
              onMouseLeave: () => {
                if (modelMode) setHoveredPartIds([]);
              },
              style: {
                width: "var(--cf-swatch-size)",
                height: "var(--cf-swatch-size)",
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
                flexShrink: 0
              }
            }, s.value);
          })
        })
      }, q.id);
    }
    if (q.type === "thumbnail") {
      const activeVal = selectedAnswers[q.id];
      return /* @__PURE__ */ jsx(QuestionBlock, {
        label: q.name,
        isFirst: qi === 0,
        children: /* @__PURE__ */ jsx("div", {
          style: {
            display: "flex",
            gap: "var(--cf-swatch-gap)",
            flexWrap: "wrap"
          },
          children: q.swatches.map((s) => {
            const isAct = activeVal === s.value;
            return /* @__PURE__ */ jsxs("div", {
              style: {
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3
              },
              children: [/* @__PURE__ */ jsx("button", {
                title: s.label,
                className: "cf-thumb-swatch",
                onClick: () => handleColorSwatchClick(q, s.value, s.imageUrl),
                style: {
                  width: "var(--cf-thumb-size)",
                  height: "var(--cf-thumb-size)",
                  borderRadius: "var(--cf-thumb-radius)",
                  overflow: "hidden",
                  padding: 0,
                  cursor: "pointer",
                  border: isAct ? "3px solid var(--cf-accent)" : "2px solid var(--cf-border)",
                  outline: isAct ? "3px solid var(--cf-accent-light)" : "none",
                  outlineOffset: 1,
                  background: s.imageUrl ? "none" : s.value,
                  boxShadow: isAct ? `0 2px 8px var(--cf-accent-light)` : "var(--cf-shadow-sm)",
                  flexShrink: 0
                },
                children: s.imageUrl ? /* @__PURE__ */ jsx("img", {
                  src: s.imageUrl,
                  alt: s.label,
                  style: {
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block"
                  }
                }) : /* @__PURE__ */ jsx("span", {
                  style: {
                    display: "block",
                    width: "100%",
                    height: "100%",
                    background: s.value
                  }
                })
              }), cfStyle.showLabels && /* @__PURE__ */ jsx("span", {
                style: {
                  fontSize: 10,
                  color: isAct ? "var(--cf-accent)" : "var(--cf-text-muted)",
                  textAlign: "center",
                  maxWidth: "var(--cf-thumb-size)",
                  display: "block",
                  wordBreak: "break-word",
                  fontWeight: isAct ? 600 : 400
                },
                children: s.label
              })]
            }, s.value);
          })
        })
      }, q.id);
    }
    if (q.type === "dropdown") {
      const dq = q;
      const isImageDrop = dq.displayType === "image";
      const selectedVals = dq.multipleSelection ? (selectedAnswers[q.id] ?? "").split(",").filter(Boolean) : [selectedAnswers[q.id] ?? ""].filter(Boolean);
      const toggleVal = (val) => {
        var _a2, _b2;
        if (dq.multipleSelection) {
          const cur = (selectedAnswers[q.id] ?? "").split(",").filter(Boolean);
          const isRemoving = cur.includes(val);
          const next = isRemoving ? cur.filter((v) => v !== val) : [...cur, val];
          setSelectedAnswers((p) => ({
            ...p,
            [q.id]: next.join(",")
          }));
          const opt = dq.options.find((o) => o.value === val);
          if (!isRemoving && ((_a2 = opt == null ? void 0 : opt.viewImages) == null ? void 0 : _a2.some(Boolean))) {
            setLabelAnswerImages((p) => ({
              ...p,
              [q.id]: opt.viewImages
            }));
          } else if (isRemoving && next.length === 0) {
            setLabelAnswerImages((p) => {
              const n = {
                ...p
              };
              delete n[q.id];
              return n;
            });
          }
        } else {
          setSelectedAnswers((p) => ({
            ...p,
            [q.id]: val
          }));
          const opt = dq.options.find((o) => o.value === val);
          if ((_b2 = opt == null ? void 0 : opt.viewImages) == null ? void 0 : _b2.some(Boolean)) {
            setLabelAnswerImages((p) => ({
              ...p,
              [q.id]: opt.viewImages
            }));
          } else {
            setLabelAnswerImages((p) => {
              const n = {
                ...p
              };
              delete n[q.id];
              return n;
            });
          }
        }
      };
      if (isImageDrop) {
        return /* @__PURE__ */ jsx(QuestionBlock, {
          label: "",
          isFirst: qi === 0,
          children: /* @__PURE__ */ jsx(ImageDropdown, {
            q: dq,
            selectedVals,
            onToggle: toggleVal,
            onHoverImages: setHoverViewImages
          })
        }, q.id);
      }
      return /* @__PURE__ */ jsx(QuestionBlock, {
        label: q.name,
        isFirst: qi === 0,
        children: /* @__PURE__ */ jsxs("div", {
          style: {
            position: "relative"
          },
          children: [/* @__PURE__ */ jsxs("select", {
            value: selectedAnswers[q.id] || "",
            onChange: (e) => setSelectedAnswers((p) => ({
              ...p,
              [q.id]: e.target.value
            })),
            style: {
              width: "100%",
              padding: "10px 36px 10px 12px",
              border: `1.5px solid var(--cf-border)`,
              borderRadius: "var(--cf-radius)",
              fontSize: 13,
              appearance: "none",
              background: "var(--cf-surface)",
              color: "var(--cf-text)",
              cursor: "pointer",
              boxShadow: "var(--cf-shadow-sm)",
              outline: "none"
            },
            children: [/* @__PURE__ */ jsx("option", {
              value: "",
              children: "Select an option…"
            }), (q.options ?? []).map((o) => /* @__PURE__ */ jsx("option", {
              value: o.value,
              children: o.label
            }, o.value))]
          }), /* @__PURE__ */ jsx("svg", {
            width: "12",
            height: "12",
            viewBox: "0 0 12 12",
            fill: "none",
            style: {
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none"
            },
            children: /* @__PURE__ */ jsx("path", {
              d: "M2 4l4 4 4-4",
              stroke: "var(--cf-text-muted)",
              strokeWidth: "1.5",
              strokeLinecap: "round",
              strokeLinejoin: "round"
            })
          })]
        })
      }, q.id);
    }
    if (q.type === "radio") return /* @__PURE__ */ jsx(QuestionBlock, {
      label: q.name,
      isFirst: qi === 0,
      children: /* @__PURE__ */ jsx("div", {
        style: {
          display: "flex",
          flexDirection: "column",
          gap: 8
        },
        children: (q.options ?? []).map((o) => {
          const isAct = selectedAnswers[q.id] === o.value;
          return /* @__PURE__ */ jsxs("label", {
            className: `cf-radio-label${isAct ? " active" : ""}`,
            style: radioLabelStyle(cfStyle.choiceStyle, isAct),
            children: [cfStyle.choiceStyle !== "pill" && /* @__PURE__ */ jsx("div", {
              style: {
                width: 18,
                height: 18,
                borderRadius: "50%",
                flexShrink: 0,
                border: `2px solid ${isAct ? "var(--cf-accent)" : "var(--cf-border)"}`,
                background: isAct ? "var(--cf-accent)" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all var(--cf-transition)"
              },
              children: isAct && /* @__PURE__ */ jsx("div", {
                style: {
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#fff"
                }
              })
            }), /* @__PURE__ */ jsx("input", {
              type: "radio",
              name: q.id,
              value: o.value,
              checked: isAct,
              onChange: () => setSelectedAnswers((p) => ({
                ...p,
                [q.id]: o.value
              })),
              style: {
                display: "none"
              }
            }), /* @__PURE__ */ jsx("span", {
              style: {
                fontSize: 13,
                fontWeight: isAct ? 600 : 400,
                color: isAct ? "var(--cf-accent)" : "var(--cf-text)"
              },
              children: o.label
            })]
          }, o.value);
        })
      })
    }, q.id);
    if (q.type === "checkbox") return /* @__PURE__ */ jsx(QuestionBlock, {
      label: "",
      isFirst: qi === 0,
      children: /* @__PURE__ */ jsxs("label", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: "pointer",
          padding: "10px 12px",
          borderRadius: "var(--cf-radius)",
          border: `1.5px solid var(--cf-border)`,
          background: "var(--cf-surface)",
          boxShadow: "var(--cf-shadow-sm)"
        },
        children: [/* @__PURE__ */ jsx("div", {
          onClick: () => setSelectedAnswers((p) => ({
            ...p,
            [q.id]: p[q.id] === "true" ? "false" : "true"
          })),
          style: {
            width: 20,
            height: 20,
            borderRadius: 5,
            flexShrink: 0,
            border: `2px solid ${selectedAnswers[q.id] === "true" ? "var(--cf-accent)" : "var(--cf-border)"}`,
            background: selectedAnswers[q.id] === "true" ? "var(--cf-accent)" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all var(--cf-transition)"
          },
          children: selectedAnswers[q.id] === "true" && /* @__PURE__ */ jsx("svg", {
            width: "10",
            height: "10",
            viewBox: "0 0 10 10",
            fill: "none",
            children: /* @__PURE__ */ jsx("path", {
              d: "M1.5 5l2.5 2.5 5-5",
              stroke: "#fff",
              strokeWidth: "1.5",
              strokeLinecap: "round",
              strokeLinejoin: "round"
            })
          })
        }), /* @__PURE__ */ jsx("input", {
          type: "checkbox",
          checked: selectedAnswers[q.id] === "true",
          onChange: (e) => setSelectedAnswers((p) => ({
            ...p,
            [q.id]: e.target.checked ? "true" : "false"
          })),
          style: {
            display: "none"
          }
        }), /* @__PURE__ */ jsx("span", {
          style: {
            fontSize: 13,
            fontWeight: 500,
            color: "var(--cf-text)"
          },
          children: selectedAnswers[q.id] === "true" ? q.checkedLabel : q.uncheckedLabel
        })]
      })
    }, q.id);
    if (q.type === "text") {
      const maxChars = q.maxChars ?? 15;
      const currentLen = (textValues[q.id] ?? q.defaultText ?? "").length;
      const atLimit = currentLen >= maxChars;
      const pa = q.printArea;
      return /* @__PURE__ */ jsx(QuestionBlock, {
        label: q.name,
        isFirst: qi === 0,
        children: /* @__PURE__ */ jsxs("div", {
          style: {
            position: "relative"
          },
          children: [/* @__PURE__ */ jsx("textarea", {
            value: textValues[q.id] ?? q.defaultText,
            onChange: (e) => setTextValues((p) => ({
              ...p,
              [q.id]: e.target.value
            })),
            placeholder: q.defaultText || "Enter text…",
            maxLength: maxChars,
            rows: 3,
            style: {
              width: "100%",
              padding: "10px 12px",
              border: `1.5px solid var(--cf-border)`,
              borderRadius: "var(--cf-radius)",
              fontSize: 13,
              boxSizing: "border-box",
              background: "var(--cf-surface)",
              color: "var(--cf-text)",
              outline: "none",
              boxShadow: "var(--cf-shadow-sm)",
              transition: "border-color var(--cf-transition)",
              resize: "vertical",
              fontFamily: "inherit",
              lineHeight: 1.5
            },
            onFocus: (e) => {
              var _a2;
              e.target.style.borderColor = "var(--cf-accent)";
              if (((_a2 = pa == null ? void 0 : pa.visibleViews) == null ? void 0 : _a2.length) > 0) setCurrentView(Math.min(pa.visibleViews[0] - 1, numViews - 1));
            },
            onBlur: (e) => e.target.style.borderColor = "var(--cf-border)"
          }), /* @__PURE__ */ jsxs("span", {
            style: {
              position: "absolute",
              bottom: 6,
              right: 8,
              fontSize: 11,
              color: atLimit ? "#ef4444" : "var(--cf-text-muted)",
              fontWeight: atLimit ? 600 : 400,
              pointerEvents: "none"
            },
            children: [currentLen, "/", maxChars]
          })]
        })
      }, q.id);
    }
    if (q.type === "file") return /* @__PURE__ */ jsx(QuestionBlock, {
      label: q.name,
      isFirst: qi === 0,
      children: /* @__PURE__ */ jsxs("label", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px",
          border: `2px dashed ${uploadedImages[q.id] ? "var(--cf-accent)" : "var(--cf-border)"}`,
          borderRadius: "var(--cf-radius)",
          cursor: "pointer",
          background: uploadedImages[q.id] ? "var(--cf-accent-light)" : "var(--cf-bg)",
          color: uploadedImages[q.id] ? "var(--cf-accent)" : "var(--cf-text-sub)",
          fontSize: 13,
          fontWeight: 500,
          transition: "all var(--cf-transition)"
        },
        children: [/* @__PURE__ */ jsx("div", {
          style: {
            width: 36,
            height: 36,
            borderRadius: 8,
            background: uploadedImages[q.id] ? "var(--cf-accent)" : "var(--cf-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          },
          children: /* @__PURE__ */ jsx("svg", {
            width: "16",
            height: "16",
            viewBox: "0 0 16 16",
            fill: "none",
            children: /* @__PURE__ */ jsx("path", {
              d: "M8 2v8M5 5l3-3 3 3M3 12h10",
              stroke: uploadedImages[q.id] ? "#fff" : "var(--cf-text-sub)",
              strokeWidth: "1.5",
              strokeLinecap: "round",
              strokeLinejoin: "round"
            })
          })
        }), /* @__PURE__ */ jsx("span", {
          children: uploadedImages[q.id] ? "Image uploaded — change" : "Upload your image"
        }), /* @__PURE__ */ jsx("input", {
          type: "file",
          accept: "image/*",
          style: {
            display: "none"
          },
          onChange: (e) => {
            var _a2;
            const f = (_a2 = e.target.files) == null ? void 0 : _a2[0];
            if (f) handleFileUpload(q.id, f);
          }
        })]
      })
    }, q.id);
    return null;
  };
  return /* @__PURE__ */ jsxs(Fragment, {
    children: [/* @__PURE__ */ jsx("style", {
      children: CSS_TOKENS + dynamicCss
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        background: "var(--cf-bg)",
        overflow: "hidden"
      },
      children: [/* @__PURE__ */ jsxs("div", {
        style: {
          padding: "0 20px",
          borderBottom: `1px solid var(--cf-border)`,
          background: "linear-gradient(135deg, #f8f9ff 0%, var(--cf-surface) 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 56,
          flexShrink: 0,
          boxShadow: "var(--cf-shadow-sm)"
        },
        children: [/* @__PURE__ */ jsxs("div", {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 10
          },
          children: [/* @__PURE__ */ jsx("div", {
            style: {
              width: 32,
              height: 32,
              background: "linear-gradient(135deg, var(--cf-accent) 0%, var(--cf-accent-dark) 100%)",
              borderRadius: 9,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 6px rgba(92,106,196,0.35)",
              flexShrink: 0
            },
            children: /* @__PURE__ */ jsxs("svg", {
              width: "15",
              height: "15",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "white",
              strokeWidth: "2.2",
              children: [/* @__PURE__ */ jsx("circle", {
                cx: "13.5",
                cy: "6.5",
                r: "2.5"
              }), /* @__PURE__ */ jsx("path", {
                d: "M14.622 17.897L19.5 12.5 20 7l-5.5.5-4.897 4.878M8.891 12.84 4.5 17.5l-1 3.5 3.5-1 4.66-4.391"
              })]
            })
          }), /* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("div", {
              style: {
                fontSize: 14,
                fontWeight: 700,
                color: "var(--cf-text)",
                letterSpacing: "-0.01em",
                lineHeight: 1.2
              },
              children: productName
            }), /* @__PURE__ */ jsx("div", {
              style: {
                fontSize: 10,
                color: "var(--cf-text-muted)",
                fontWeight: 500,
                marginTop: 1
              },
              children: "Personalise your product"
            })]
          })]
        }), /* @__PURE__ */ jsx("button", {
          onClick: () => window.parent.postMessage({
            type: "configurator:close"
          }, "*"),
          "aria-label": "Close configurator",
          style: {
            width: 32,
            height: 32,
            border: `1.5px solid var(--cf-border)`,
            borderRadius: "50%",
            background: "var(--cf-surface)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "background var(--cf-transition), border-color var(--cf-transition)"
          },
          onMouseEnter: (e) => {
            e.currentTarget.style.background = "#f3f4f6";
            e.currentTarget.style.borderColor = "var(--cf-border-hover)";
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.background = "var(--cf-surface)";
            e.currentTarget.style.borderColor = "var(--cf-border)";
          },
          children: /* @__PURE__ */ jsx("svg", {
            width: "12",
            height: "12",
            viewBox: "0 0 12 12",
            fill: "none",
            children: /* @__PURE__ */ jsx("path", {
              d: "M1 1l10 10M11 1L1 11",
              stroke: "var(--cf-text)",
              strokeWidth: "1.8",
              strokeLinecap: "round"
            })
          })
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "cf-body",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "cf-sidebar",
          children: [isMobile && mobileTabs.length > 0 && /* @__PURE__ */ jsx("div", {
            className: "cf-mobile-tabs",
            children: mobileTabs.map((tab) => /* @__PURE__ */ jsx("button", {
              className: "cf-tab-btn",
              onClick: () => setMobileActiveTab(tab.id),
              style: {
                fontWeight: activeTabId === tab.id ? 700 : 500,
                color: activeTabId === tab.id ? "var(--cf-accent)" : "var(--cf-text-sub)",
                borderBottom: activeTabId === tab.id ? "2px solid var(--cf-accent)" : "2px solid transparent"
              },
              children: tab.label
            }, tab.id))
          }), /* @__PURE__ */ jsxs("div", {
            style: {
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              padding: hasGroups ? "0" : "16px 16px 8px"
            },
            children: [visibleQuestions.length === 0 && /* @__PURE__ */ jsx("div", {
              style: {
                textAlign: "center",
                padding: "40px 0",
                color: "var(--cf-text-muted)"
              },
              children: /* @__PURE__ */ jsx("p", {
                style: {
                  fontSize: 13
                },
                children: "No options configured."
              })
            }), hasGroups && /* @__PURE__ */ jsxs("div", {
              children: [sidebarGroups.map((sg) => {
                if (isMobile) {
                  if (activeTabId !== sg.group.id) return null;
                  return /* @__PURE__ */ jsx("div", {
                    style: {
                      padding: "8px 16px 16px"
                    },
                    children: sg.children.map((q, qi) => renderOneQuestion(q, qi))
                  }, sg.group.id);
                }
                const isExpanded = expandedGroupId === sg.group.id;
                return /* @__PURE__ */ jsxs("div", {
                  style: {
                    borderBottom: `1px solid var(--cf-border)`
                  },
                  children: [/* @__PURE__ */ jsxs("button", {
                    onClick: () => setExpandedGroupId(isExpanded ? null : sg.group.id),
                    style: {
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 16px",
                      border: "none",
                      background: isExpanded ? "var(--cf-accent-light)" : "var(--cf-surface)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background var(--cf-transition)"
                    },
                    children: [/* @__PURE__ */ jsx("span", {
                      style: {
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: isExpanded ? "var(--cf-accent)" : "var(--cf-text)"
                      },
                      children: sg.group.name
                    }), /* @__PURE__ */ jsx("svg", {
                      width: "12",
                      height: "12",
                      viewBox: "0 0 12 12",
                      fill: "none",
                      style: {
                        transform: isExpanded ? "rotate(180deg)" : "none",
                        transition: "transform 0.2s ease",
                        flexShrink: 0
                      },
                      children: /* @__PURE__ */ jsx("path", {
                        d: "M2 4l4 4 4-4",
                        stroke: isExpanded ? "var(--cf-accent)" : "var(--cf-text-muted)",
                        strokeWidth: "1.8",
                        strokeLinecap: "round",
                        strokeLinejoin: "round"
                      })
                    })]
                  }), isExpanded && /* @__PURE__ */ jsx("div", {
                    style: {
                      padding: "8px 16px 16px",
                      background: "var(--cf-surface)"
                    },
                    children: sg.children.map((q, qi) => renderOneQuestion(q, qi))
                  })]
                }, sg.group.id);
              }), ungroupedQuestions.length > 0 && /* @__PURE__ */ jsx("div", {
                style: {
                  padding: "8px 16px 16px"
                },
                children: ungroupedQuestions.map((q, qi) => renderOneQuestion(q, qi))
              })]
            }), !hasGroups && visibleQuestions.filter((q) => !isMobile || !activeTabId || activeTabId === q.id).map((q, qi) => renderOneQuestion(q, qi))]
          }), /* @__PURE__ */ jsx("div", {
            style: {
              padding: isMobile ? "0" : "14px 16px 16px",
              borderTop: isMobile ? "none" : `1px solid var(--cf-border)`,
              background: isMobile ? "transparent" : "linear-gradient(180deg, var(--cf-surface) 0%, #f8f9ff 100%)",
              flexShrink: 0
            },
            children: /* @__PURE__ */ jsxs("button", {
              onClick: handleAddToCart,
              className: "cf-add-btn",
              style: {
                width: "100%",
                padding: "15px 20px",
                color: "#fff",
                border: "none",
                borderRadius: "var(--cf-btn-radius, var(--cf-radius))",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                letterSpacing: "0.02em",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 9
              },
              children: [/* @__PURE__ */ jsxs("svg", {
                width: "17",
                height: "17",
                viewBox: "0 0 16 16",
                fill: "none",
                children: [/* @__PURE__ */ jsx("path", {
                  d: "M1 1h2l2 8h7l1.5-5H5",
                  stroke: "currentColor",
                  strokeWidth: "1.6",
                  strokeLinecap: "round",
                  strokeLinejoin: "round"
                }), /* @__PURE__ */ jsx("circle", {
                  cx: "8",
                  cy: "13.5",
                  r: "1.5",
                  fill: "currentColor"
                }), /* @__PURE__ */ jsx("circle", {
                  cx: "12",
                  cy: "13.5",
                  r: "1.5",
                  fill: "currentColor"
                })]
              }), "Add to Cart"]
            })
          })]
        }), /* @__PURE__ */ jsx("div", {
          ref: canvasAreaRef,
          className: "cf-canvas-area",
          children: /* @__PURE__ */ jsxs("div", {
            className: "cf-canvas-wrap",
            style: {
              transform: `scale(${canvasScale})`,
              marginBottom: -(CANVAS_SIZE$2 * (1 - canvasScale))
            },
            children: [/* @__PURE__ */ jsx("div", {
              onClick: (e) => {
                if (e.target === e.currentTarget) setSelectedId(null);
              },
              style: {
                position: "relative"
              },
              children: mounted && modelMode && glbUrl ? /* @__PURE__ */ jsx(ThreeViewer, {
                glbUrl,
                parts: layers.filter((l) => l.type === "glb-part"),
                customizations: glbCustomizations,
                width: CANVAS_SIZE$2,
                height: CANVAS_SIZE$2,
                hoveredPartIds
              }) : mounted && /* @__PURE__ */ jsx(Stage, {
                width: CANVAS_SIZE$2,
                height: CANVAS_SIZE$2,
                ref: stageRef,
                onMouseDown: (e) => {
                  if (e.target === e.target.getStage()) setSelectedId(null);
                },
                style: {
                  boxShadow: "0 12px 48px rgba(0,0,0,0.13), 0 2px 10px rgba(0,0,0,0.07)",
                  borderRadius: 14,
                  background: "#fff",
                  display: "block"
                },
                children: /* @__PURE__ */ jsxs(Layer, {
                  children: [layers.map((layer) => {
                    if (layer.type === "glb-part") return null;
                    const overrideImages = layerImageOverrides[layer.id];
                    let src;
                    if (overrideImages) {
                      const slot = overrideImages[currentView];
                      const baseSrc = getLayerSrc(layer, currentView);
                      src = slot != null && slot !== "" ? slot : baseSrc || overrideImages.find((s) => s !== "" && s != null) || "";
                    } else {
                      src = getLayerSrc(layer, currentView);
                    }
                    return /* @__PURE__ */ jsx(ProductLayer, {
                      src,
                      color: layerColors[layer.id],
                      textureUrl: layerTextures[layer.id],
                      width: CANVAS_SIZE$2,
                      height: CANVAS_SIZE$2
                    }, layer.id);
                  }), hoverViewImages ? (() => {
                    const src = hoverViewImages[currentView] || "";
                    return src ? /* @__PURE__ */ jsx(ProductLayer, {
                      src,
                      width: CANVAS_SIZE$2,
                      height: CANVAS_SIZE$2
                    }, "hover-bg") : null;
                  })() : Object.entries(labelAnswerImages).filter(([qId]) => visibleQuestions.some((vq) => vq.id === qId)).map(([qId, images]) => {
                    const src = images[currentView] || "";
                    const colorSourceVisible = visibleQuestions.some((vq) => (vq.type === "color" || vq.type === "thumbnail") && (vq.applyOn ?? []).includes(qId));
                    return src ? /* @__PURE__ */ jsx(ProductLayer, {
                      src,
                      color: colorSourceVisible ? layerColors[qId] : void 0,
                      textureUrl: colorSourceVisible ? layerTextures[qId] : void 0,
                      width: CANVAS_SIZE$2,
                      height: CANVAS_SIZE$2
                    }, `q-bg-${qId}`) : null;
                  }), textQuestions.filter((q) => {
                    const pa = q.printArea;
                    return !pa || pa.visibleViews.includes(currentView + 1);
                  }).map((q) => {
                    const pa = q.printArea;
                    return /* @__PURE__ */ jsx(Text, {
                      ref: (node) => {
                        if (node) nodeRefs[q.id] = node;
                      },
                      text: textValues[q.id] ?? q.defaultText,
                      x: ((pa == null ? void 0 : pa.x) ?? q.position.x) * COORD_SCALE$1,
                      y: ((pa == null ? void 0 : pa.y) ?? q.position.y) * COORD_SCALE$1,
                      rotation: (pa == null ? void 0 : pa.rotation) ?? q.rotation ?? 0,
                      width: pa ? pa.width * COORD_SCALE$1 : void 0,
                      fontSize: (textSizes[q.id] ?? q.defaultFontSize) * COORD_SCALE$1,
                      fontFamily: textFonts[q.id] ?? q.defaultFontFamily,
                      fill: textColors[q.id] ?? q.defaultColor,
                      wrap: "word",
                      draggable: true,
                      onClick: () => setSelectedId(q.id),
                      onTap: () => setSelectedId(q.id)
                    }, q.id);
                  }), fileQuestions.filter((q) => {
                    const areas = q.printAreas;
                    if (!areas || areas.length === 0) return true;
                    return areas.some((pa) => pa.visibleViews.includes(currentView + 1));
                  }).map((q) => {
                    var _a2, _b2;
                    const img = uploadedImages[q.id];
                    if (!img) return null;
                    return /* @__PURE__ */ jsx(Image, {
                      image: img,
                      x: (((_a2 = q.position) == null ? void 0 : _a2.x) ?? 100) * COORD_SCALE$1,
                      y: (((_b2 = q.position) == null ? void 0 : _b2.y) ?? 100) * COORD_SCALE$1,
                      width: (q.defaultWidth ?? 120) * COORD_SCALE$1,
                      height: (q.defaultHeight ?? 120) * COORD_SCALE$1,
                      listening: false
                    }, q.id);
                  }), /* @__PURE__ */ jsx(Transformer, {
                    ref: transformerRef,
                    rotateEnabled: true
                  })]
                })
              })
            }), numViews > 1 && /* @__PURE__ */ jsxs("div", {
              style: {
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "var(--cf-surface)",
                borderRadius: 32,
                padding: "8px 14px",
                boxShadow: "var(--cf-shadow-sm)",
                border: `1px solid var(--cf-border)`
              },
              children: [/* @__PURE__ */ jsx("button", {
                onClick: () => setCurrentView((v) => Math.max(0, v - 1)),
                disabled: currentView === 0,
                style: {
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  border: `1.5px solid ${currentView === 0 ? "var(--cf-border)" : "var(--cf-border-hover)"}`,
                  background: "transparent",
                  cursor: currentView === 0 ? "default" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: currentView === 0 ? 0.35 : 1,
                  transition: "opacity var(--cf-transition)"
                },
                "aria-label": "Previous view",
                children: /* @__PURE__ */ jsx("svg", {
                  width: "12",
                  height: "12",
                  viewBox: "0 0 12 12",
                  fill: "none",
                  children: /* @__PURE__ */ jsx("path", {
                    d: "M8 2L4 6l4 4",
                    stroke: "var(--cf-text)",
                    strokeWidth: "1.8",
                    strokeLinecap: "round",
                    strokeLinejoin: "round"
                  })
                })
              }), /* @__PURE__ */ jsx("div", {
                style: {
                  display: "flex",
                  gap: 6,
                  alignItems: "center"
                },
                children: Array.from({
                  length: numViews
                }).map((_, vi) => /* @__PURE__ */ jsx("button", {
                  onClick: () => setCurrentView(vi),
                  style: {
                    width: vi === currentView ? 24 : 8,
                    height: 8,
                    borderRadius: 4,
                    background: vi === currentView ? "var(--cf-accent)" : "var(--cf-border)",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    transition: "width 0.2s ease, background 0.15s"
                  },
                  title: `View ${vi + 1}`
                }, vi))
              }), /* @__PURE__ */ jsx("button", {
                onClick: () => setCurrentView((v) => Math.min(numViews - 1, v + 1)),
                disabled: currentView === numViews - 1,
                style: {
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  border: `1.5px solid ${currentView === numViews - 1 ? "var(--cf-border)" : "var(--cf-border-hover)"}`,
                  background: "transparent",
                  cursor: currentView === numViews - 1 ? "default" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: currentView === numViews - 1 ? 0.35 : 1,
                  transition: "opacity var(--cf-transition)"
                },
                "aria-label": "Next view",
                children: /* @__PURE__ */ jsx("svg", {
                  width: "12",
                  height: "12",
                  viewBox: "0 0 12 12",
                  fill: "none",
                  children: /* @__PURE__ */ jsx("path", {
                    d: "M4 2l4 4-4 4",
                    stroke: "var(--cf-text)",
                    strokeWidth: "1.8",
                    strokeLinecap: "round",
                    strokeLinejoin: "round"
                  })
                })
              })]
            })]
          })
        })]
      })]
    })]
  });
});
function choiceButtonStyle(choiceStyle, active) {
  const base = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: active ? 600 : 500,
    color: active ? "var(--cf-accent)" : "var(--cf-text)",
    border: active ? "2px solid var(--cf-accent)" : "1.5px solid var(--cf-border)",
    background: active ? "var(--cf-accent-light)" : "var(--cf-surface)",
    transition: "all var(--cf-transition)"
  };
  if (choiceStyle === "pill") return {
    ...base,
    padding: "8px 18px",
    borderRadius: 20
  };
  if (choiceStyle === "card") return {
    ...base,
    padding: "10px 16px",
    borderRadius: "var(--cf-radius)",
    width: "100%"
  };
  return {
    ...base,
    padding: "9px 14px",
    borderRadius: "var(--cf-radius-sm)"
  };
}
function radioLabelStyle(choiceStyle, active) {
  const base = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
    color: active ? "var(--cf-accent)" : "var(--cf-text)",
    border: active ? "2px solid var(--cf-accent)" : "1.5px solid var(--cf-border)",
    background: active ? "var(--cf-accent-light)" : "var(--cf-surface)",
    transition: "all var(--cf-transition)"
  };
  if (choiceStyle === "pill") return {
    ...base,
    padding: "8px 18px",
    borderRadius: 20,
    display: "inline-flex",
    width: "auto"
  };
  if (choiceStyle === "card") return {
    ...base,
    padding: "10px 16px",
    borderRadius: "var(--cf-radius)"
  };
  return {
    ...base,
    padding: "9px 12px",
    borderRadius: "var(--cf-radius)"
  };
}
function QuestionBlock({
  label: label2,
  children,
  isFirst
}) {
  return /* @__PURE__ */ jsxs("div", {
    style: {
      paddingTop: isFirst ? 4 : 18,
      paddingBottom: 4,
      paddingLeft: "var(--cf-opt-field-left, 0px)",
      marginTop: "var(--cf-opt-pad-top, 0px)",
      marginBottom: "var(--cf-opt-pad-bottom, 0px)"
    },
    children: [label2 && /* @__PURE__ */ jsx("div", {
      className: "cf-section-label",
      children: label2
    }), children]
  });
}
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: configurator_$productId,
  headers: headers$2,
  loader: loader$c
}, Symbol.toStringTag, { value: "Module" }));
const action$c = async ({
  request
}) => {
  const {
    topic,
    shop
  } = await authenticate.webhook(request);
  console.log(`${topic} for shop ${shop} — final data purge`);
  await prisma.productConfig.deleteMany({
    where: {
      shop
    }
  });
  await prisma.configurator.deleteMany({
    where: {
      shop
    }
  });
  await prisma.appSettings.deleteMany({
    where: {
      shop
    }
  });
  const store = await prisma.store.findUnique({
    where: {
      shop
    }
  });
  if (store) {
    await prisma.product.deleteMany({
      where: {
        storeId: store.id
      }
    });
    await prisma.store.delete({
      where: {
        shop
      }
    });
  }
  return new Response();
};
const route7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$c
}, Symbol.toStringTag, { value: "Module" }));
const KEEP_DAYS = 10;
const KEEP_MS = KEEP_DAYS * 24 * 60 * 60 * 1e3;
function cleanupOldPreviews(uploadsDir) {
  try {
    const cutoff = Date.now() - KEEP_MS;
    for (const file of readdirSync(uploadsDir)) {
      if (!file.startsWith("preview-")) continue;
      const filePath = join(uploadsDir, file);
      if (statSync(filePath).mtimeMs < cutoff) {
        unlinkSync(filePath);
      }
    }
  } catch {
  }
}
async function action$b({
  request
}) {
  if (request.method !== "POST") {
    return Response.json({
      error: "Method not allowed"
    }, {
      status: 405
    });
  }
  try {
    const body = await request.json();
    const {
      dataUrl
    } = body;
    if (!dataUrl || !dataUrl.startsWith("data:image/")) {
      return Response.json({
        error: "Invalid image data"
      }, {
        status: 400
      });
    }
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    if (buffer.length > 5 * 1024 * 1024) {
      return Response.json({
        error: "Image too large"
      }, {
        status: 413
      });
    }
    const uploadsDir = join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, {
        recursive: true
      });
    }
    cleanupOldPreviews(uploadsDir);
    const filename = `preview-${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
    writeFileSync(join(uploadsDir, filename), buffer);
    return Response.json({
      url: `/uploads/${filename}`
    });
  } catch (err) {
    return Response.json({
      error: err.message ?? "Upload failed"
    }, {
      status: 500
    });
  }
}
const route8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$b
}, Symbol.toStringTag, { value: "Module" }));
function loginErrorMessage(loginErrors) {
  if ((loginErrors == null ? void 0 : loginErrors.shop) === LoginErrorType.MissingShop) {
    return { shop: "Please enter your shop domain to log in" };
  } else if ((loginErrors == null ? void 0 : loginErrors.shop) === LoginErrorType.InvalidShop) {
    return { shop: "Please enter a valid shop domain to log in" };
  }
  return {};
}
async function getLoginResult(request) {
  let resp;
  try {
    resp = await login(request);
  } catch (e) {
    resp = e;
  }
  if (resp instanceof Response) {
    const location = resp.headers.get("Location");
    if (location && (resp.status === 301 || resp.status === 302)) {
      return {
        redirectUrl: location
      };
    }
  }
  return {
    errors: loginErrorMessage(resp)
  };
}
const loader$b = async ({
  request
}) => {
  const url = new URL(request.url);
  if (!url.searchParams.get("shop")) {
    const known = await prisma.session.findFirst({
      select: {
        shop: true
      }
    });
    const fallback = (known == null ? void 0 : known.shop) || process.env.DEFAULT_SHOP;
    if (fallback) url.searchParams.set("shop", fallback);
  }
  return getLoginResult(new Request(url.toString(), request));
};
const action$a = async ({
  request
}) => {
  return getLoginResult(request);
};
const route$1 = UNSAFE_withComponentProps(function Auth() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const [searchParams] = useSearchParams();
  const [shop, setShop] = useState(searchParams.get("shop") ?? "");
  const data = actionData || loaderData;
  const {
    errors,
    redirectUrl
  } = data ?? {
    errors: {}
  };
  useEffect(() => {
    if (redirectUrl) {
      (window.top ?? window).location.href = redirectUrl;
    }
  }, [redirectUrl]);
  return /* @__PURE__ */ jsx(AppProvider, {
    embedded: false,
    children: /* @__PURE__ */ jsx("s-page", {
      children: /* @__PURE__ */ jsxs(Form, {
        method: "post",
        children: [/* @__PURE__ */ jsx("input", {
          type: "hidden",
          name: "shop",
          value: shop
        }), /* @__PURE__ */ jsxs("s-section", {
          heading: "Log in",
          children: [/* @__PURE__ */ jsx("s-text-field", {
            name: "_shop_display",
            label: "Shop domain",
            details: "example.myshopify.com",
            value: shop,
            onChange: (e) => {
              var _a, _b;
              return setShop(((_a = e.target) == null ? void 0 : _a.value) ?? ((_b = e.currentTarget) == null ? void 0 : _b.value) ?? "");
            },
            autocomplete: "on",
            error: errors == null ? void 0 : errors.shop
          }), /* @__PURE__ */ jsx("button", {
            type: "submit",
            style: {
              marginTop: 12,
              padding: "10px 20px",
              background: "#008060",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer"
            },
            children: "Log in"
          })]
        })]
      })
    })
  });
});
const route9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$a,
  default: route$1,
  loader: loader$b
}, Symbol.toStringTag, { value: "Module" }));
const index = "_index_12o3y_1";
const heading = "_heading_12o3y_11";
const text = "_text_12o3y_12";
const content = "_content_12o3y_22";
const form = "_form_12o3y_27";
const label = "_label_12o3y_35";
const input = "_input_12o3y_43";
const button = "_button_12o3y_47";
const list = "_list_12o3y_51";
const styles = {
  index,
  heading,
  text,
  content,
  form,
  label,
  input,
  button,
  list
};
const loader$a = async ({
  request
}) => {
  const url = new URL(request.url);
  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }
  return {
    showForm: Boolean(login)
  };
};
const route = UNSAFE_withComponentProps(function App2() {
  const {
    showForm
  } = useLoaderData();
  return /* @__PURE__ */ jsx("div", {
    className: styles.index,
    children: /* @__PURE__ */ jsxs("div", {
      className: styles.content,
      children: [/* @__PURE__ */ jsx("h1", {
        className: styles.heading,
        children: "A short heading about [your app]"
      }), /* @__PURE__ */ jsx("p", {
        className: styles.text,
        children: "A tagline about [your app] that describes your value proposition."
      }), showForm && /* @__PURE__ */ jsxs(Form, {
        className: styles.form,
        method: "post",
        action: "/auth/login",
        children: [/* @__PURE__ */ jsxs("label", {
          className: styles.label,
          children: [/* @__PURE__ */ jsx("span", {
            children: "Shop domain"
          }), /* @__PURE__ */ jsx("input", {
            className: styles.input,
            type: "text",
            name: "shop"
          }), /* @__PURE__ */ jsx("span", {
            children: "e.g: my-shop-domain.myshopify.com"
          })]
        }), /* @__PURE__ */ jsx("button", {
          className: styles.button,
          type: "submit",
          children: "Log in"
        })]
      }), /* @__PURE__ */ jsxs("ul", {
        className: styles.list,
        children: [/* @__PURE__ */ jsxs("li", {
          children: [/* @__PURE__ */ jsx("strong", {
            children: "Product feature"
          }), ". Some detail about your feature and its benefit to your customer."]
        }), /* @__PURE__ */ jsxs("li", {
          children: [/* @__PURE__ */ jsx("strong", {
            children: "Product feature"
          }), ". Some detail about your feature and its benefit to your customer."]
        }), /* @__PURE__ */ jsxs("li", {
          children: [/* @__PURE__ */ jsx("strong", {
            children: "Product feature"
          }), ". Some detail about your feature and its benefit to your customer."]
        })]
      })]
    })
  });
});
const route10 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: route,
  loader: loader$a
}, Symbol.toStringTag, { value: "Module" }));
const loader$9 = async ({
  request
}) => {
  await authenticate.admin(request);
  return null;
};
const headers$1 = (headersArgs) => {
  return boundary.headers(headersArgs);
};
const route11 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  headers: headers$1,
  loader: loader$9
}, Symbol.toStringTag, { value: "Module" }));
const Polaris = /* @__PURE__ */ JSON.parse('{"ActionMenu":{"Actions":{"moreActions":"More actions"},"RollupActions":{"rollupButton":"View actions"}},"ActionList":{"SearchField":{"clearButtonLabel":"Clear","search":"Search","placeholder":"Search actions"}},"Avatar":{"label":"Avatar","labelWithInitials":"Avatar with initials {initials}"},"Autocomplete":{"spinnerAccessibilityLabel":"Loading","ellipsis":"{content}…"},"Badge":{"PROGRESS_LABELS":{"incomplete":"Incomplete","partiallyComplete":"Partially complete","complete":"Complete"},"TONE_LABELS":{"info":"Info","success":"Success","warning":"Warning","critical":"Critical","attention":"Attention","new":"New","readOnly":"Read-only","enabled":"Enabled"},"progressAndTone":"{toneLabel} {progressLabel}"},"Banner":{"dismissButton":"Dismiss notification"},"Button":{"spinnerAccessibilityLabel":"Loading"},"Common":{"checkbox":"checkbox","undo":"Undo","cancel":"Cancel","clear":"Clear","close":"Close","submit":"Submit","more":"More"},"ContextualSaveBar":{"save":"Save","discard":"Discard"},"DataTable":{"sortAccessibilityLabel":"sort {direction} by","navAccessibilityLabel":"Scroll table {direction} one column","totalsRowHeading":"Totals","totalRowHeading":"Total"},"DatePicker":{"previousMonth":"Show previous month, {previousMonthName} {showPreviousYear}","nextMonth":"Show next month, {nextMonth} {nextYear}","today":"Today ","start":"Start of range","end":"End of range","months":{"january":"January","february":"February","march":"March","april":"April","may":"May","june":"June","july":"July","august":"August","september":"September","october":"October","november":"November","december":"December"},"days":{"monday":"Monday","tuesday":"Tuesday","wednesday":"Wednesday","thursday":"Thursday","friday":"Friday","saturday":"Saturday","sunday":"Sunday"},"daysAbbreviated":{"monday":"Mo","tuesday":"Tu","wednesday":"We","thursday":"Th","friday":"Fr","saturday":"Sa","sunday":"Su"}},"DiscardConfirmationModal":{"title":"Discard all unsaved changes","message":"If you discard changes, you’ll delete any edits you made since you last saved.","primaryAction":"Discard changes","secondaryAction":"Continue editing"},"DropZone":{"single":{"overlayTextFile":"Drop file to upload","overlayTextImage":"Drop image to upload","overlayTextVideo":"Drop video to upload","actionTitleFile":"Add file","actionTitleImage":"Add image","actionTitleVideo":"Add video","actionHintFile":"or drop file to upload","actionHintImage":"or drop image to upload","actionHintVideo":"or drop video to upload","labelFile":"Upload file","labelImage":"Upload image","labelVideo":"Upload video"},"allowMultiple":{"overlayTextFile":"Drop files to upload","overlayTextImage":"Drop images to upload","overlayTextVideo":"Drop videos to upload","actionTitleFile":"Add files","actionTitleImage":"Add images","actionTitleVideo":"Add videos","actionHintFile":"or drop files to upload","actionHintImage":"or drop images to upload","actionHintVideo":"or drop videos to upload","labelFile":"Upload files","labelImage":"Upload images","labelVideo":"Upload videos"},"errorOverlayTextFile":"File type is not valid","errorOverlayTextImage":"Image type is not valid","errorOverlayTextVideo":"Video type is not valid"},"EmptySearchResult":{"altText":"Empty search results"},"Frame":{"skipToContent":"Skip to content","navigationLabel":"Navigation","Navigation":{"closeMobileNavigationLabel":"Close navigation"}},"FullscreenBar":{"back":"Back","accessibilityLabel":"Exit fullscreen mode"},"Filters":{"moreFilters":"More filters","moreFiltersWithCount":"More filters ({count})","filter":"Filter {resourceName}","noFiltersApplied":"No filters applied","cancel":"Cancel","done":"Done","clearAllFilters":"Clear all filters","clear":"Clear","clearLabel":"Clear {filterName}","addFilter":"Add filter","clearFilters":"Clear all","searchInView":"in:{viewName}"},"FilterPill":{"clear":"Clear","unsavedChanges":"Unsaved changes - {label}"},"IndexFilters":{"searchFilterTooltip":"Search and filter","searchFilterTooltipWithShortcut":"Search and filter (F)","searchFilterAccessibilityLabel":"Search and filter results","sort":"Sort your results","addView":"Add a new view","newView":"Custom search","SortButton":{"ariaLabel":"Sort the results","tooltip":"Sort","title":"Sort by","sorting":{"asc":"Ascending","desc":"Descending","az":"A-Z","za":"Z-A"}},"EditColumnsButton":{"tooltip":"Edit columns","accessibilityLabel":"Customize table column order and visibility"},"UpdateButtons":{"cancel":"Cancel","update":"Update","save":"Save","saveAs":"Save as","modal":{"title":"Save view as","label":"Name","sameName":"A view with this name already exists. Please choose a different name.","save":"Save","cancel":"Cancel"}}},"IndexProvider":{"defaultItemSingular":"Item","defaultItemPlural":"Items","allItemsSelected":"All {itemsLength}+ {resourceNamePlural} are selected","selected":"{selectedItemsCount} selected","a11yCheckboxDeselectAllSingle":"Deselect {resourceNameSingular}","a11yCheckboxSelectAllSingle":"Select {resourceNameSingular}","a11yCheckboxDeselectAllMultiple":"Deselect all {itemsLength} {resourceNamePlural}","a11yCheckboxSelectAllMultiple":"Select all {itemsLength} {resourceNamePlural}"},"IndexTable":{"emptySearchTitle":"No {resourceNamePlural} found","emptySearchDescription":"Try changing the filters or search term","onboardingBadgeText":"New","resourceLoadingAccessibilityLabel":"Loading {resourceNamePlural}…","selectAllLabel":"Select all {resourceNamePlural}","selected":"{selectedItemsCount} selected","undo":"Undo","selectAllItems":"Select all {itemsLength}+ {resourceNamePlural}","selectItem":"Select {resourceName}","selectButtonText":"Select","sortAccessibilityLabel":"sort {direction} by"},"Loading":{"label":"Page loading bar"},"Modal":{"iFrameTitle":"body markup","modalWarning":"These required properties are missing from Modal: {missingProps}"},"Page":{"Header":{"rollupActionsLabel":"View actions for {title}","pageReadyAccessibilityLabel":"{title}. This page is ready"}},"Pagination":{"previous":"Previous","next":"Next","pagination":"Pagination"},"ProgressBar":{"negativeWarningMessage":"Values passed to the progress prop shouldn’t be negative. Resetting {progress} to 0.","exceedWarningMessage":"Values passed to the progress prop shouldn’t exceed 100. Setting {progress} to 100."},"ResourceList":{"sortingLabel":"Sort by","defaultItemSingular":"item","defaultItemPlural":"items","showing":"Showing {itemsCount} {resource}","showingTotalCount":"Showing {itemsCount} of {totalItemsCount} {resource}","loading":"Loading {resource}","selected":"{selectedItemsCount} selected","allItemsSelected":"All {itemsLength}+ {resourceNamePlural} in your store are selected","allFilteredItemsSelected":"All {itemsLength}+ {resourceNamePlural} in this filter are selected","selectAllItems":"Select all {itemsLength}+ {resourceNamePlural} in your store","selectAllFilteredItems":"Select all {itemsLength}+ {resourceNamePlural} in this filter","emptySearchResultTitle":"No {resourceNamePlural} found","emptySearchResultDescription":"Try changing the filters or search term","selectButtonText":"Select","a11yCheckboxDeselectAllSingle":"Deselect {resourceNameSingular}","a11yCheckboxSelectAllSingle":"Select {resourceNameSingular}","a11yCheckboxDeselectAllMultiple":"Deselect all {itemsLength} {resourceNamePlural}","a11yCheckboxSelectAllMultiple":"Select all {itemsLength} {resourceNamePlural}","Item":{"actionsDropdownLabel":"Actions for {accessibilityLabel}","actionsDropdown":"Actions dropdown","viewItem":"View details for {itemName}"},"BulkActions":{"actionsActivatorLabel":"Actions","moreActionsActivatorLabel":"More actions"}},"SkeletonPage":{"loadingLabel":"Page loading"},"Tabs":{"newViewAccessibilityLabel":"Create new view","newViewTooltip":"Create view","toggleTabsLabel":"More views","Tab":{"rename":"Rename view","duplicate":"Duplicate view","edit":"Edit view","editColumns":"Edit columns","delete":"Delete view","copy":"Copy of {name}","deleteModal":{"title":"Delete view?","description":"This can’t be undone. {viewName} view will no longer be available in your admin.","cancel":"Cancel","delete":"Delete view"}},"RenameModal":{"title":"Rename view","label":"Name","cancel":"Cancel","create":"Save","errors":{"sameName":"A view with this name already exists. Please choose a different name."}},"DuplicateModal":{"title":"Duplicate view","label":"Name","cancel":"Cancel","create":"Create view","errors":{"sameName":"A view with this name already exists. Please choose a different name."}},"CreateViewModal":{"title":"Create new view","label":"Name","cancel":"Cancel","create":"Create view","errors":{"sameName":"A view with this name already exists. Please choose a different name."}}},"Tag":{"ariaLabel":"Remove {children}"},"TextField":{"characterCount":"{count} characters","characterCountWithMaxLength":"{count} of {limit} characters used"},"TooltipOverlay":{"accessibilityLabel":"Tooltip: {label}"},"TopBar":{"toggleMenuLabel":"Toggle menu","SearchField":{"clearButtonLabel":"Clear","search":"Search"}},"MediaCard":{"dismissButton":"Dismiss","popoverButton":"Actions"},"VideoThumbnail":{"playButtonA11yLabel":{"default":"Play video","defaultWithDuration":"Play video of length {duration}","duration":{"hours":{"other":{"only":"{hourCount} hours","andMinutes":"{hourCount} hours and {minuteCount} minutes","andMinute":"{hourCount} hours and {minuteCount} minute","minutesAndSeconds":"{hourCount} hours, {minuteCount} minutes, and {secondCount} seconds","minutesAndSecond":"{hourCount} hours, {minuteCount} minutes, and {secondCount} second","minuteAndSeconds":"{hourCount} hours, {minuteCount} minute, and {secondCount} seconds","minuteAndSecond":"{hourCount} hours, {minuteCount} minute, and {secondCount} second","andSeconds":"{hourCount} hours and {secondCount} seconds","andSecond":"{hourCount} hours and {secondCount} second"},"one":{"only":"{hourCount} hour","andMinutes":"{hourCount} hour and {minuteCount} minutes","andMinute":"{hourCount} hour and {minuteCount} minute","minutesAndSeconds":"{hourCount} hour, {minuteCount} minutes, and {secondCount} seconds","minutesAndSecond":"{hourCount} hour, {minuteCount} minutes, and {secondCount} second","minuteAndSeconds":"{hourCount} hour, {minuteCount} minute, and {secondCount} seconds","minuteAndSecond":"{hourCount} hour, {minuteCount} minute, and {secondCount} second","andSeconds":"{hourCount} hour and {secondCount} seconds","andSecond":"{hourCount} hour and {secondCount} second"}},"minutes":{"other":{"only":"{minuteCount} minutes","andSeconds":"{minuteCount} minutes and {secondCount} seconds","andSecond":"{minuteCount} minutes and {secondCount} second"},"one":{"only":"{minuteCount} minute","andSeconds":"{minuteCount} minute and {secondCount} seconds","andSecond":"{minuteCount} minute and {secondCount} second"}},"seconds":{"other":"{secondCount} seconds","one":"{secondCount} second"}}}}}');
const enTranslations = {
  Polaris
};
function ChatWidget({ propertyId, widgetId }) {
  useEffect(() => {
    if (!propertyId || !widgetId) return;
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = /* @__PURE__ */ new Date();
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");
    document.head.appendChild(script);
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [propertyId, widgetId]);
  return null;
}
const loader$8 = async ({
  request
}) => {
  await authenticate.admin(request);
  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    tawkPropertyId: process.env.TAWK_PROPERTY_ID || "",
    tawkWidgetId: process.env.TAWK_WIDGET_ID || "default"
  };
};
const app = UNSAFE_withComponentProps(function App3() {
  const {
    apiKey,
    tawkPropertyId,
    tawkWidgetId
  } = useLoaderData();
  return /* @__PURE__ */ jsx(AppProvider, {
    embedded: true,
    apiKey,
    children: /* @__PURE__ */ jsxs(AppProvider$1, {
      i18n: enTranslations,
      children: [/* @__PURE__ */ jsxs("s-app-nav", {
        children: [/* @__PURE__ */ jsx("s-link", {
          href: "/app",
          children: "Home"
        }), /* @__PURE__ */ jsx("s-link", {
          href: "/app/products",
          children: "Products"
        }), /* @__PURE__ */ jsx("s-link", {
          href: "/app/settings",
          children: "Settings"
        })]
      }), /* @__PURE__ */ jsx(Outlet, {}), /* @__PURE__ */ jsx(ChatWidget, {
        propertyId: tawkPropertyId,
        widgetId: tawkWidgetId
      })]
    })
  });
});
const ErrorBoundary = UNSAFE_withErrorBoundaryProps(function ErrorBoundary2() {
  return boundary.error(useRouteError());
});
const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
const route12 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary,
  default: app,
  headers,
  loader: loader$8
}, Symbol.toStringTag, { value: "Module" }));
function hexToRgb(hex) {
  const h = hex.replace("#", "").padEnd(6, "0").slice(0, 6);
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return [255, 255, 255];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("").toUpperCase();
}
function rgbToHsv(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = (g - b) / d % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = h / 6;
    if (h < 0) h += 1;
  }
  return [h, max === 0 ? 0 : d / max, max];
}
function hsvToRgb(h, s, v) {
  const i = Math.floor(h * 6), f = h * 6 - i;
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  let r = 0, g = 0, b = 0;
  switch (i % 6) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
const PRESETS = [
  "#FF0000",
  "#FF8C00",
  "#8B4513",
  "#C8A96E",
  "#D2B48C",
  "#556B2F",
  "#228B22",
  "#800000",
  "#6A0DAD",
  "#0044FF",
  "#00CED1",
  "#000000",
  "#808080",
  "#A9A9A9",
  "#D3D3D3",
  "#FFFFFF",
  "#FF69B4",
  "#FFD700",
  "#87CEEB",
  "#98FFB3"
];
function ModernColorPicker({
  value,
  onChange
}) {
  const canvasRef = useRef(null);
  const lastEmitted = useRef(value);
  const parseHsv = (hex) => {
    const [r2, g2, b2] = hexToRgb(hex || "#FF0000");
    return rgbToHsv(r2, g2, b2);
  };
  const [h, setH] = useState(() => parseHsv(value)[0]);
  const [s, setS] = useState(() => parseHsv(value)[1]);
  const [v, setV] = useState(() => parseHsv(value)[2]);
  const [hexText, setHexText] = useState((value || "#FFFFFF").replace("#", "").toUpperCase());
  useEffect(() => {
    if (value && value !== lastEmitted.current) {
      lastEmitted.current = value;
      const [nh, ns, nv] = parseHsv(value);
      setH(nh);
      setS(ns);
      setV(nv);
      setHexText(value.replace("#", "").toUpperCase());
    }
  }, [value]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width, height } = canvas;
    const [hr2, hg2, hb2] = hsvToRgb(h, 1, 1);
    const hueGrad = ctx.createLinearGradient(0, 0, width, 0);
    hueGrad.addColorStop(0, "#FFFFFF");
    hueGrad.addColorStop(1, `rgb(${hr2},${hg2},${hb2})`);
    ctx.fillStyle = hueGrad;
    ctx.fillRect(0, 0, width, height);
    const darkGrad = ctx.createLinearGradient(0, 0, 0, height);
    darkGrad.addColorStop(0, "rgba(0,0,0,0)");
    darkGrad.addColorStop(1, "rgba(0,0,0,1)");
    ctx.fillStyle = darkGrad;
    ctx.fillRect(0, 0, width, height);
  }, [h]);
  const emit = useCallback((newH, newS, newV) => {
    const [r2, g2, b2] = hsvToRgb(newH, newS, newV);
    const hex = rgbToHex(r2, g2, b2);
    lastEmitted.current = hex;
    setHexText(hex.replace("#", ""));
    onChange(hex);
  }, [onChange]);
  const handleCanvasPointer = useCallback((e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const move = (ev) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const newS = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      const newV = 1 - Math.max(0, Math.min(1, (ev.clientY - rect.top) / rect.height));
      setS(newS);
      setV(newV);
      emit(h, newS, newV);
    };
    move(e.nativeEvent);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }, [h, emit]);
  const handleHuePointer = useCallback((e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    const move = (ev) => {
      const newH = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      setH(newH);
      emit(newH, s, v);
    };
    move(e.nativeEvent);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }, [s, v, emit]);
  const [r, g, b] = hsvToRgb(h, s, v);
  const [hr, hg, hb] = hsvToRgb(h, 1, 1);
  const currentHex = rgbToHex(r, g, b);
  const handleHexInput = (raw) => {
    const clean = raw.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
    setHexText(clean.toUpperCase());
    if (clean.length === 6) {
      const [rr, gg, bb] = hexToRgb("#" + clean);
      const [nh, ns, nv] = rgbToHsv(rr, gg, bb);
      setH(nh);
      setS(ns);
      setV(nv);
      const hex = rgbToHex(rr, gg, bb);
      lastEmitted.current = hex;
      onChange(hex);
    }
  };
  const handleRgbInput = (channel, val) => {
    const clamped = Math.max(0, Math.min(255, val));
    const nr = channel === "r" ? clamped : r;
    const ng = channel === "g" ? clamped : g;
    const nb = channel === "b" ? clamped : b;
    const [nh, ns, nv] = rgbToHsv(nr, ng, nb);
    setH(nh);
    setS(ns);
    setV(nv);
    const hex = rgbToHex(nr, ng, nb);
    lastEmitted.current = hex;
    setHexText(hex.replace("#", ""));
    onChange(hex);
  };
  return /* @__PURE__ */ jsxs("div", { style: { width: "100%", userSelect: "none" }, children: [
    /* @__PURE__ */ jsxs("div", { style: { position: "relative", width: "100%", paddingBottom: "60%", borderRadius: 8, overflow: "hidden", marginBottom: 10, cursor: "crosshair" }, children: [
      /* @__PURE__ */ jsx(
        "canvas",
        {
          ref: canvasRef,
          width: 300,
          height: 180,
          style: { position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" },
          onPointerDown: handleCanvasPointer
        }
      ),
      /* @__PURE__ */ jsx(
        "div",
        {
          style: {
            position: "absolute",
            left: `${s * 100}%`,
            top: `${(1 - v) * 100}%`,
            transform: "translate(-50%, -50%)",
            width: 14,
            height: 14,
            borderRadius: "50%",
            border: "2.5px solid #fff",
            boxShadow: "0 0 0 1.5px rgba(0,0,0,0.35)",
            background: currentHex,
            pointerEvents: "none"
          }
        }
      )
    ] }),
    /* @__PURE__ */ jsx(
      "div",
      {
        onPointerDown: handleHuePointer,
        style: {
          height: 14,
          borderRadius: 7,
          background: "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)",
          position: "relative",
          cursor: "pointer",
          marginBottom: 8,
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)"
        },
        children: /* @__PURE__ */ jsx(
          "div",
          {
            style: {
              position: "absolute",
              left: `${h * 100}%`,
              top: "50%",
              transform: "translate(-50%,-50%)",
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: `rgb(${hr},${hg},${hb})`,
              border: "2.5px solid #fff",
              boxShadow: "0 0 0 1.5px rgba(0,0,0,0.25)",
              pointerEvents: "none"
            }
          }
        )
      }
    ),
    /* @__PURE__ */ jsx(
      "div",
      {
        style: {
          height: 14,
          borderRadius: 7,
          background: `linear-gradient(to right, rgba(${hr},${hg},${hb},0) 0%, rgb(${hr},${hg},${hb}) 100%)`,
          position: "relative",
          marginBottom: 14,
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
          backgroundImage: `repeating-conic-gradient(#ccc 0% 25%, transparent 0% 50%) 0/12px 12px, linear-gradient(to right, rgba(${hr},${hg},${hb},0), rgb(${hr},${hg},${hb}))`
        },
        children: /* @__PURE__ */ jsx(
          "div",
          {
            style: {
              position: "absolute",
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: `rgb(${hr},${hg},${hb})`,
              border: "2.5px solid #fff",
              boxShadow: "0 0 0 1.5px rgba(0,0,0,0.25)",
              pointerEvents: "none"
            }
          }
        )
      }
    ),
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 6, marginBottom: 12 }, children: [
      /* @__PURE__ */ jsxs("div", { style: { flex: 2, minWidth: 0 }, children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            value: hexText,
            onChange: (e) => handleHexInput(e.target.value),
            maxLength: 6,
            style: {
              width: "100%",
              padding: "6px 8px",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              fontSize: 12,
              fontFamily: "monospace",
              boxSizing: "border-box",
              textAlign: "center",
              outline: "none"
            }
          }
        ),
        /* @__PURE__ */ jsx("div", { style: { fontSize: 10, color: "#9ca3af", textAlign: "center", marginTop: 3 }, children: "Hex" })
      ] }),
      ["R", "G", "B"].map((ch) => {
        const channelVal = ch === "R" ? r : ch === "G" ? g : b;
        return /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              min: 0,
              max: 255,
              value: channelVal,
              onChange: (e) => handleRgbInput(ch.toLowerCase(), Number(e.target.value)),
              style: {
                width: "100%",
                padding: "6px 4px",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                fontSize: 12,
                boxSizing: "border-box",
                textAlign: "center",
                outline: "none"
              }
            }
          ),
          /* @__PURE__ */ jsx("div", { style: { fontSize: 10, color: "#9ca3af", textAlign: "center", marginTop: 3 }, children: ch })
        ] }, ch);
      })
    ] }),
    /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 5 }, children: PRESETS.map((preset) => /* @__PURE__ */ jsx(
      "button",
      {
        title: preset,
        onClick: () => {
          const [rr, gg, bb] = hexToRgb(preset);
          const [nh, ns, nv] = rgbToHsv(rr, gg, bb);
          setH(nh);
          setS(ns);
          setV(nv);
          setHexText(preset.replace("#", ""));
          lastEmitted.current = preset;
          onChange(preset);
        },
        style: {
          width: "100%",
          aspectRatio: "1",
          borderRadius: "50%",
          background: preset,
          border: currentHex.toUpperCase() === preset.toUpperCase() ? "2.5px solid #3b82f6" : "1.5px solid rgba(0,0,0,0.18)",
          cursor: "pointer",
          padding: 0,
          outline: "none",
          boxSizing: "border-box"
        }
      },
      preset
    )) })
  ] });
}
async function extractMeshNames(glbUrl) {
  const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
  const { DRACOLoader } = await import("three/examples/jsm/loaders/DRACOLoader.js");
  return new Promise((resolve, reject) => {
    const loader2 = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
    loader2.setDRACOLoader(draco);
    loader2.load(
      glbUrl,
      (gltf) => {
        const names = [];
        gltf.scene.traverse((obj) => {
          if (obj.isMesh && obj.name) names.push(obj.name);
        });
        resolve([...new Set(names)]);
      },
      void 0,
      reject
    );
  });
}
function ToggleSwitch({ checked, onChange }) {
  return /* @__PURE__ */ jsx(
    "button",
    {
      onClick: (e) => {
        e.stopPropagation();
        onChange();
      },
      style: {
        position: "relative",
        width: 36,
        height: 20,
        borderRadius: 10,
        border: "none",
        background: checked ? "#4f46e5" : "#d1d5db",
        cursor: "pointer",
        flexShrink: 0,
        transition: "background 0.2s",
        padding: 0
      },
      children: /* @__PURE__ */ jsx(
        "span",
        {
          style: {
            position: "absolute",
            top: 2,
            left: checked ? 18 : 2,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            transition: "left 0.2s"
          }
        }
      )
    }
  );
}
function GlbPartSetup({ glbUrl, parts, selectedPartId, onPartSelect, onGlbUploaded, onPartsChange }) {
  var _a, _b, _c;
  const fetcher = useFetcher();
  const fileInputRef = useRef(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState(null);
  const processedUrl = useRef(void 0);
  const [editingId, setEditingId] = useState(null);
  const isUploading = fetcher.state !== "idle";
  function handleFileChange(e) {
    var _a2;
    const file = (_a2 = e.target.files) == null ? void 0 : _a2[0];
    if (!file) return;
    setExtractError(null);
    const fd = new FormData();
    fd.append("file", file);
    fetcher.submit(fd, { method: "post", action: "/app/upload-glb", encType: "multipart/form-data" });
  }
  useEffect(() => {
    var _a2;
    const url = (_a2 = fetcher.data) == null ? void 0 : _a2.url;
    if (!url || url === processedUrl.current) return;
    processedUrl.current = url;
    setExtracting(true);
    setExtractError(null);
    extractMeshNames(url).then((names) => {
      const newParts = names.map((name) => ({
        id: name,
        name,
        type: "glb-part",
        src: "",
        fromGlb: true
      }));
      onGlbUploaded(url, newParts);
    }).catch((err) => setExtractError("Could not read mesh names: " + ((err == null ? void 0 : err.message) ?? "unknown error"))).finally(() => setExtracting(false));
  }, [(_a = fetcher.data) == null ? void 0 : _a.url]);
  function updatePartName(partId, newName) {
    onPartsChange(parts.map((p) => p.id === partId ? { ...p, name: newName } : p));
  }
  function togglePartCustomizable(partId) {
    onPartsChange(
      parts.map((p) => {
        if (p.id !== partId) return p;
        return { ...p, type: p.type === "glb-part" ? "static" : "glb-part" };
      })
    );
  }
  function deletePart(partId) {
    onPartsChange(parts.filter((p) => p.id !== partId));
  }
  const visibleParts = parts.filter((p) => p.type === "glb-part");
  const hiddenParts = parts.filter((p) => p.type !== "glb-part");
  const allVisible = parts.length > 0 && visibleParts.length === parts.length;
  const allHidden = parts.length > 0 && hiddenParts.length === parts.length;
  function setAllVisible() {
    onPartsChange(parts.map((p) => ({ ...p, type: "glb-part" })));
  }
  function setAllHidden() {
    onPartsChange(parts.map((p) => ({ ...p, type: "static" })));
  }
  const isBusy = isUploading || extracting;
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 16 }, children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        onClick: () => {
          var _a2;
          return !isBusy && ((_a2 = fileInputRef.current) == null ? void 0 : _a2.click());
        },
        style: {
          border: `2px dashed ${isBusy ? "#c4cdd6" : glbUrl ? "#4f46e5" : "#c4cdd6"}`,
          borderRadius: 10,
          padding: "20px 16px",
          textAlign: "center",
          cursor: isBusy ? "not-allowed" : "pointer",
          background: glbUrl && !isBusy ? "#f5f3ff" : "#f9fafb",
          transition: "border-color 0.2s, background 0.2s"
        },
        children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              ref: fileInputRef,
              type: "file",
              accept: ".glb",
              style: { display: "none" },
              onChange: handleFileChange,
              disabled: isBusy
            }
          ),
          isUploading ? /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { style: { fontSize: 24, marginBottom: 6 }, children: "⏫" }),
            /* @__PURE__ */ jsx("p", { style: { margin: 0, fontWeight: 600, color: "#4f46e5", fontSize: 13 }, children: "Uploading…" })
          ] }) : extracting ? /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { style: { fontSize: 24, marginBottom: 6 }, children: "🔍" }),
            /* @__PURE__ */ jsx("p", { style: { margin: 0, fontWeight: 600, color: "#4f46e5", fontSize: 13 }, children: "Reading mesh parts…" }),
            /* @__PURE__ */ jsx("p", { style: { margin: "4px 0 0", fontSize: 11, color: "#9ca3af" }, children: "This may take a moment" })
          ] }) : glbUrl ? /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { style: { fontSize: 24, marginBottom: 6 }, children: "✅" }),
            /* @__PURE__ */ jsx("p", { style: { margin: "0 0 2px", fontWeight: 600, color: "#202223", fontSize: 13 }, children: "3D model uploaded" }),
            /* @__PURE__ */ jsx("p", { style: { margin: 0, fontSize: 11, color: "#6b7280" }, children: glbUrl.split("/").pop() }),
            /* @__PURE__ */ jsx("p", { style: { margin: "6px 0 0", fontSize: 11, color: "#4f46e5", fontWeight: 500 }, children: "Click to replace" })
          ] }) : /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { style: { fontSize: 28, marginBottom: 8 }, children: "📦" }),
            /* @__PURE__ */ jsx("p", { style: { margin: "0 0 4px", fontWeight: 600, color: "#202223", fontSize: 13 }, children: "Upload your 3D model" }),
            /* @__PURE__ */ jsx("p", { style: { margin: 0, fontSize: 12, color: "#9ca3af" }, children: "Drag & drop or click to browse · .glb format" })
          ] })
        ]
      }
    ),
    (((_b = fetcher.data) == null ? void 0 : _b.error) || extractError) && /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", background: "#fff1f0", border: "1px solid #fca5a5", borderRadius: 8 }, children: [
      /* @__PURE__ */ jsx("span", { style: { fontSize: 14, flexShrink: 0 }, children: "⚠️" }),
      /* @__PURE__ */ jsx("p", { style: { margin: 0, fontSize: 12, color: "#b91c1c" }, children: ((_c = fetcher.data) == null ? void 0 : _c.error) || extractError })
    ] }),
    parts.length > 0 && /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 12 }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { style: { fontSize: 13, fontWeight: 600, color: "#202223" }, children: "Mesh parts" }),
          /* @__PURE__ */ jsxs("span", { style: { marginLeft: 6, fontSize: 12, color: "#9ca3af" }, children: [
            parts.length,
            " detected"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 6 }, children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: setAllVisible,
              disabled: allVisible,
              style: {
                fontSize: 11,
                padding: "4px 10px",
                borderRadius: 6,
                cursor: allVisible ? "default" : "pointer",
                border: "1px solid #e5e7eb",
                background: allVisible ? "#f3f4f6" : "#fff",
                color: allVisible ? "#9ca3af" : "#374151",
                fontWeight: 500
              },
              children: "Show all"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: setAllHidden,
              disabled: allHidden,
              style: {
                fontSize: 11,
                padding: "4px 10px",
                borderRadius: 6,
                cursor: allHidden ? "default" : "pointer",
                border: "1px solid #e5e7eb",
                background: allHidden ? "#f3f4f6" : "#fff",
                color: allHidden ? "#9ca3af" : "#374151",
                fontWeight: 500
              },
              children: "Hide all"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 8 }, children: [
        /* @__PURE__ */ jsxs("div", { style: { flex: 1, padding: "8px 12px", background: "#f0fdf4", borderRadius: 8, border: "1px solid #bbf7d0" }, children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: 18, fontWeight: 700, color: "#16a34a" }, children: visibleParts.length }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: "#4ade80", fontWeight: 500 }, children: "Visible to customers" })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { flex: 1, padding: "8px 12px", background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }, children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: 18, fontWeight: 700, color: "#6b7280" }, children: hiddenParts.length }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: "#9ca3af", fontWeight: 500 }, children: "Behind the scene" })
        ] })
      ] }),
      visibleParts.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }, children: [
          /* @__PURE__ */ jsx("span", { style: { width: 6, height: 6, borderRadius: "50%", background: "#22c55e", flexShrink: 0 } }),
          /* @__PURE__ */ jsx("span", { style: { fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }, children: "Visible to customers" })
        ] }),
        /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 4 }, children: visibleParts.map((part) => /* @__PURE__ */ jsx(
          PartRow,
          {
            part,
            isSelected: selectedPartId === part.id,
            isEditing: editingId === part.id,
            onToggle: () => togglePartCustomizable(part.id),
            onSelect: () => onPartSelect == null ? void 0 : onPartSelect(part.id),
            onNameChange: (name) => updatePartName(part.id, name),
            onEditStart: () => setEditingId(part.id),
            onEditEnd: () => setEditingId(null),
            onDelete: () => deletePart(part.id)
          },
          part.id
        )) })
      ] }),
      hiddenParts.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }, children: [
          /* @__PURE__ */ jsx("span", { style: { width: 6, height: 6, borderRadius: "50%", background: "#d1d5db", flexShrink: 0 } }),
          /* @__PURE__ */ jsx("span", { style: { fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }, children: "Behind the scene" })
        ] }),
        /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 4 }, children: hiddenParts.map((part) => /* @__PURE__ */ jsx(
          PartRow,
          {
            part,
            isSelected: false,
            isEditing: editingId === part.id,
            onToggle: () => togglePartCustomizable(part.id),
            onSelect: () => {
            },
            onNameChange: (name) => updatePartName(part.id, name),
            onEditStart: () => setEditingId(part.id),
            onEditEnd: () => setEditingId(null),
            onDelete: () => deletePart(part.id)
          },
          part.id
        )) })
      ] }),
      /* @__PURE__ */ jsx("p", { style: { margin: 0, fontSize: 11, color: "#9ca3af", lineHeight: 1.5 }, children: "Toggle parts on to make them customisable by customers. Hidden parts are always shown but cannot be changed." })
    ] })
  ] });
}
function PartRow({
  part,
  isSelected,
  isEditing,
  onToggle,
  onSelect,
  onNameChange,
  onEditStart,
  onEditEnd,
  onDelete
}) {
  const isVisible2 = part.type === "glb-part";
  const inputRef = useRef(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    var _a;
    if (isEditing) (_a = inputRef.current) == null ? void 0 : _a.select();
  }, [isEditing]);
  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 3e3);
    return () => clearTimeout(t);
  }, [confirmDelete]);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      onClick: () => isVisible2 && !confirmDelete && onSelect(),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 12px",
        background: confirmDelete ? "#fff1f0" : isSelected ? "#eef2ff" : isVisible2 ? "#fff" : "#fafafa",
        border: confirmDelete ? "1.5px solid #fca5a5" : isSelected ? "1.5px solid #4f46e5" : "1px solid #e5e7eb",
        borderRadius: 8,
        cursor: isVisible2 && !confirmDelete ? "pointer" : "default",
        transition: "background 0.15s, border-color 0.15s",
        opacity: isVisible2 ? 1 : 0.6
      },
      children: [
        /* @__PURE__ */ jsx(
          "span",
          {
            style: {
              width: 28,
              height: 28,
              borderRadius: 6,
              flexShrink: 0,
              background: confirmDelete ? "#fee2e2" : isVisible2 ? "#ede9fe" : "#f3f4f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14
            },
            children: "🧩"
          }
        ),
        /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
          confirmDelete ? /* @__PURE__ */ jsx("span", { style: { fontSize: 12, color: "#b91c1c", fontWeight: 500 }, children: "Delete this part?" }) : isEditing ? /* @__PURE__ */ jsx(
            "input",
            {
              ref: inputRef,
              value: part.name,
              onChange: (e) => onNameChange(e.target.value),
              onBlur: onEditEnd,
              onKeyDown: (e) => {
                if (e.key === "Enter" || e.key === "Escape") onEditEnd();
              },
              onClick: (e) => e.stopPropagation(),
              style: {
                width: "100%",
                border: "1px solid #4f46e5",
                borderRadius: 4,
                fontSize: 13,
                padding: "2px 6px",
                outline: "none",
                boxSizing: "border-box",
                background: "#fff",
                color: "#202223"
              }
            }
          ) : /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 6, minWidth: 0 }, children: [
            /* @__PURE__ */ jsx("span", { style: { fontSize: 13, color: "#202223", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: part.name }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: (e) => {
                  e.stopPropagation();
                  onEditStart();
                },
                title: "Rename",
                style: { background: "none", border: "none", cursor: "pointer", padding: "0 2px", color: "#9ca3af", fontSize: 11, flexShrink: 0, lineHeight: 1 },
                children: "✎"
              }
            )
          ] }),
          !confirmDelete && /* @__PURE__ */ jsx("span", { style: { fontSize: 10, color: "#9ca3af", fontFamily: "monospace" }, children: part.id })
        ] }),
        confirmDelete ? /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 5, flexShrink: 0 }, children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: (e) => {
                e.stopPropagation();
                onDelete();
              },
              style: { fontSize: 11, padding: "4px 10px", borderRadius: 5, border: "none", background: "#ef4444", color: "#fff", cursor: "pointer", fontWeight: 600 },
              children: "Delete"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: (e) => {
                e.stopPropagation();
                setConfirmDelete(false);
              },
              style: { fontSize: 11, padding: "4px 10px", borderRadius: 5, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", cursor: "pointer" },
              children: "Cancel"
            }
          )
        ] }) : /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }, children: [
          /* @__PURE__ */ jsx(ToggleSwitch, { checked: isVisible2, onChange: onToggle }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: (e) => {
                e.stopPropagation();
                setConfirmDelete(true);
              },
              title: "Delete part",
              style: { background: "none", border: "none", cursor: "pointer", padding: "3px 4px", color: "#d1d5db", fontSize: 14, lineHeight: 1, borderRadius: 4, transition: "color 0.15s" },
              onMouseEnter: (e) => e.currentTarget.style.color = "#ef4444",
              onMouseLeave: (e) => e.currentTarget.style.color = "#d1d5db",
              children: "🗑"
            }
          )
        ] })
      ]
    }
  );
}
const CANVAS_SIZE$1 = 520;
async function loader$7({
  request,
  params
}) {
  const {
    admin
  } = await authenticate.admin(request);
  const decodedId = decodeURIComponent(params.productId);
  const [productResponse, config] = await Promise.all([admin.graphql(`query GetProduct($id: ID!) {
        product(id: $id) {
          id title handle status
          featuredImage { url }
          variants(first: 20) { edges { node { id title price } } }
        }
      }`, {
    variables: {
      id: decodedId
    }
  }), prisma.productConfig.findUnique({
    where: {
      productId: decodedId
    }
  })]);
  const productJson = await productResponse.json();
  return {
    product: productJson.data.product,
    config
  };
}
async function action$9({
  request,
  params
}) {
  const {
    admin
  } = await authenticate.admin(request);
  const decodedId = decodeURIComponent(params.productId);
  const formData = await request.formData();
  formData.get("intent");
  const layers = JSON.parse(formData.get("layers"));
  const questions = JSON.parse(formData.get("questions"));
  const logicRules = JSON.parse(formData.get("logicRules") ?? "[]");
  const productName = formData.get("productName");
  const productImageUrl = formData.get("productImageUrl");
  const productHandle = formData.get("productHandle");
  const numViews = Number(formData.get("numViews") ?? 1);
  const viewNames = JSON.parse(formData.get("viewNames") ?? "[]");
  const canvasW = Number(formData.get("canvasW") ?? 520);
  const canvasH = Number(formData.get("canvasH") ?? 520);
  const modelMode = formData.get("modelMode") === "true";
  const glbUrl = formData.get("glbUrl") || void 0;
  const shopResponse = await admin.graphql(`query { shop { myshopifyDomain } }`);
  const shopData = await shopResponse.json();
  const shop = shopData.data.shop.myshopifyDomain;
  await prisma.productConfig.upsert({
    where: {
      productId: decodedId
    },
    create: {
      productId: decodedId,
      productName,
      shop,
      layers,
      options: {
        questions,
        logicRules,
        productImageUrl,
        productHandle,
        numViews,
        viewNames,
        canvasW,
        canvasH,
        modelMode,
        glbUrl
      }
    },
    update: {
      productName,
      shop,
      layers,
      options: {
        questions,
        logicRules,
        productImageUrl,
        productHandle,
        numViews,
        viewNames,
        canvasW,
        canvasH,
        modelMode,
        glbUrl
      }
    }
  });
  await admin.graphql(`mutation AddConfiguratorTag($id: ID!, $tags: [String!]!) {
      tagsAdd(id: $id, tags: $tags) {
        node { id }
        userErrors { field message }
      }
    }`, {
    variables: {
      id: decodedId,
      tags: ["configurator-enabled"]
    }
  });
  return {
    success: true
  };
}
const labelSt = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  color: "#6b7280",
  marginBottom: 4,
  marginTop: 14,
  textTransform: "uppercase",
  letterSpacing: "0.04em"
};
const inputSt = {
  display: "block",
  width: "100%",
  padding: "8px 10px",
  border: "1px solid #e5e7eb",
  borderRadius: 6,
  fontSize: 13,
  boxSizing: "border-box",
  outline: "none"
};
const smallBtnSt = {
  background: "#f3f4f6",
  border: "none",
  borderRadius: 4,
  padding: "3px 9px",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
  color: "#374151"
};
const toolbarBtnSt = {
  width: 28,
  height: 28,
  border: "1px solid transparent",
  borderRadius: 4,
  background: "transparent",
  cursor: "pointer",
  fontSize: 13,
  color: "#374151",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  flexShrink: 0
};
const toolbarDividerSt = {
  width: 1,
  height: 20,
  background: "#e5e7eb",
  flexShrink: 0,
  margin: "0 4px"
};
const INPUT_TYPE_CONFIG = [{
  type: "thumbnail",
  label: "Thumbnail",
  bg: "#0ea5e9",
  icon: "⊞"
}, {
  type: "dropdown",
  label: "Dropdown",
  bg: "#6366f1",
  icon: "▼"
}, {
  type: "radio",
  label: "Radio button",
  bg: "#6366f1",
  icon: "◉"
}, {
  type: "label",
  label: "Label",
  bg: "#22c55e",
  icon: "⊟"
}, {
  type: "file",
  label: "File upload",
  bg: "#ef4444",
  icon: "↑"
}, {
  type: "text",
  label: "Text input",
  bg: "#10b981",
  icon: "T"
}, {
  type: "checkbox",
  label: "Checkbox",
  bg: "#10b981",
  icon: "☑"
}, {
  type: "color",
  label: "Color picker",
  bg: "#f59e0b",
  icon: "◎"
}, {
  type: "none",
  label: "None",
  bg: "#9ca3af",
  icon: "⊘"
}, {
  type: "group",
  label: "Group",
  bg: "#6b7280",
  icon: "◻"
}];
function AddQuestionModal({
  onAdd,
  onClose
}) {
  const [selInput, setSelInput] = useState(null);
  const [selDisplay, setSelDisplay] = useState(null);
  const displayOptions = selInput ? DISPLAY_TYPE_MAP[selInput] : [];
  const skipStep2 = displayOptions.length === 1 && displayOptions[0] === "none";
  const handleInputSelect = (type) => {
    setSelInput(type);
    const opts = DISPLAY_TYPE_MAP[type];
    setSelDisplay(opts.length === 1 ? opts[0] : null);
  };
  const canCreate = selInput && (skipStep2 || selDisplay);
  const descMap = {
    thumbnail: "Create a multiple choice question where each answer is a product image",
    color: "Create a color picker question linked to a layer",
    text: "Let customers add custom text on the product",
    file: "Let customers upload an image on the product",
    dropdown: "Create a dropdown select option",
    radio: "Create radio button options",
    checkbox: "Create a yes/no toggle option",
    label: "Add an informational label block",
    group: "Group questions together under a folder",
    none: "Add a static visual element with no customer input"
  };
  return /* @__PURE__ */ jsx("div", {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.45)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1e3
    },
    onClick: (e) => {
      if (e.target === e.currentTarget) onClose();
    },
    children: /* @__PURE__ */ jsxs("div", {
      style: {
        background: "#fff",
        borderRadius: 14,
        padding: 24,
        width: 500,
        maxWidth: "92vw",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)"
      },
      children: [/* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14
        },
        children: [/* @__PURE__ */ jsx("span", {
          style: {
            fontWeight: 700,
            fontSize: 14,
            color: "#111827"
          },
          children: "1. Select an input type"
        }), /* @__PURE__ */ jsx("button", {
          onClick: onClose,
          style: {
            background: "none",
            border: "none",
            fontSize: 20,
            cursor: "pointer",
            color: "#6b7280",
            lineHeight: 1
          },
          children: "×"
        })]
      }), /* @__PURE__ */ jsx("div", {
        style: {
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 7,
          marginBottom: 16
        },
        children: INPUT_TYPE_CONFIG.map(({
          type,
          label: label2,
          bg,
          icon
        }) => /* @__PURE__ */ jsxs("button", {
          onClick: () => handleInputSelect(type),
          style: {
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 11px",
            border: selInput === type ? `2px solid ${bg}` : "1px solid #e5e7eb",
            borderRadius: 8,
            background: selInput === type ? `${bg}14` : "#fff",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 500,
            textAlign: "left"
          },
          children: [/* @__PURE__ */ jsx("span", {
            style: {
              width: 26,
              height: 26,
              borderRadius: 6,
              background: bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              color: "#fff",
              flexShrink: 0,
              fontWeight: 700
            },
            children: icon
          }), label2]
        }, type))
      }), selInput && !skipStep2 && /* @__PURE__ */ jsxs(Fragment, {
        children: [/* @__PURE__ */ jsx("div", {
          style: {
            borderTop: "1px solid #f3f4f6",
            paddingTop: 14,
            marginBottom: 10
          },
          children: /* @__PURE__ */ jsx("span", {
            style: {
              fontWeight: 700,
              fontSize: 14,
              color: "#111827"
            },
            children: "2. Select a display type"
          })
        }), /* @__PURE__ */ jsx("div", {
          style: {
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 7,
            marginBottom: 16
          },
          children: displayOptions.map((dt) => {
            const meta = DISPLAY_TYPE_META[dt] ?? {
              label: dt,
              icon: "?"
            };
            return /* @__PURE__ */ jsxs("button", {
              onClick: () => setSelDisplay(dt),
              style: {
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 11px",
                border: selDisplay === dt ? "2px solid #0ea5e9" : "1px solid #e5e7eb",
                borderRadius: 8,
                background: selDisplay === dt ? "#e0f2fe" : "#fff",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 500,
                textAlign: "left"
              },
              children: [/* @__PURE__ */ jsx("span", {
                style: {
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  background: selDisplay === dt ? "#0ea5e9" : "#f3f4f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  color: selDisplay === dt ? "#fff" : "#6b7280",
                  flexShrink: 0,
                  fontWeight: 700
                },
                children: meta.icon
              }), /* @__PURE__ */ jsxs("span", {
                children: [meta.label, meta.desc && /* @__PURE__ */ jsx("span", {
                  style: {
                    display: "block",
                    fontSize: 10,
                    color: "#9ca3af",
                    fontWeight: 400
                  },
                  children: meta.desc
                })]
              })]
            }, dt);
          })
        })]
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          borderTop: "1px solid #f3f4f6",
          paddingTop: 14,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        },
        children: [/* @__PURE__ */ jsx("span", {
          style: {
            fontSize: 12,
            color: "#6b7280"
          },
          children: canCreate && selInput ? selInput === "thumbnail" && selDisplay === "image" ? "Create a multiple choice question where each answer is a product image" : descMap[selInput] ?? "" : "Please select what you want to create"
        }), /* @__PURE__ */ jsx("button", {
          onClick: () => {
            if (canCreate && selInput) {
              onAdd(selInput, selDisplay ?? "none");
              onClose();
            }
          },
          disabled: !canCreate,
          style: {
            padding: "8px 22px",
            background: canCreate ? "#111827" : "#e5e7eb",
            color: canCreate ? "#fff" : "#9ca3af",
            border: "none",
            borderRadius: 6,
            cursor: canCreate ? "pointer" : "default",
            fontWeight: 600,
            fontSize: 13
          },
          children: "Create"
        })]
      })]
    })
  });
}
const LAYER_DISPLAY_TYPES = Object.entries(DISPLAY_TYPE_META).filter(([key]) => key !== "none").map(([key, meta]) => ({
  key,
  ...meta
}));
const LAYER_DISPLAY_COLORS = {
  image: "#3b82f6",
  color: "#06b6d4",
  logo: "#f59e0b",
  text: "#f59e0b",
  font: "#f59e0b",
  "font-size": "#f59e0b",
  "text-color": "#f59e0b",
  "text-outline": "#f59e0b"
};
function AddLayerModal({
  onAdd,
  onClose
}) {
  var _a, _b;
  const [sel, setSel] = useState(null);
  return /* @__PURE__ */ jsx("div", {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.45)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1e3
    },
    onClick: (e) => {
      if (e.target === e.currentTarget) onClose();
    },
    children: /* @__PURE__ */ jsxs("div", {
      style: {
        background: "#fff",
        borderRadius: 14,
        padding: 24,
        width: 500,
        maxWidth: "92vw",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)"
      },
      children: [/* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18
        },
        children: [/* @__PURE__ */ jsx("span", {
          style: {
            fontWeight: 700,
            fontSize: 14,
            color: "#111827"
          },
          children: "Select a display type"
        }), /* @__PURE__ */ jsx("button", {
          onClick: onClose,
          style: {
            background: "none",
            border: "none",
            fontSize: 20,
            cursor: "pointer",
            color: "#6b7280",
            lineHeight: 1
          },
          children: "×"
        })]
      }), /* @__PURE__ */ jsx("div", {
        style: {
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 7,
          marginBottom: 16
        },
        children: LAYER_DISPLAY_TYPES.map(({
          key,
          label: label2,
          icon
        }) => {
          const bg = LAYER_DISPLAY_COLORS[key] ?? "#6b7280";
          return /* @__PURE__ */ jsxs("button", {
            onClick: () => setSel(key),
            style: {
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 11px",
              border: sel === key ? `2px solid ${bg}` : "1px solid #e5e7eb",
              borderRadius: 8,
              background: sel === key ? `${bg}14` : "#fff",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 500,
              textAlign: "left"
            },
            children: [/* @__PURE__ */ jsx("span", {
              style: {
                width: 26,
                height: 26,
                borderRadius: 6,
                background: bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                color: "#fff",
                flexShrink: 0,
                fontWeight: 700
              },
              children: icon
            }), label2]
          }, key);
        })
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          borderTop: "1px solid #f3f4f6",
          paddingTop: 14,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        },
        children: [/* @__PURE__ */ jsx("span", {
          style: {
            fontSize: 12,
            color: "#6b7280"
          },
          children: sel ? `Create a ${(_b = (_a = DISPLAY_TYPE_META[sel]) == null ? void 0 : _a.label) == null ? void 0 : _b.toLowerCase()} layer` : "Please select a display type"
        }), /* @__PURE__ */ jsx("button", {
          onClick: () => {
            if (sel) {
              onAdd(sel === "color" ? "colorable" : "static", sel);
              onClose();
            }
          },
          disabled: !sel,
          style: {
            padding: "8px 22px",
            background: sel ? "#111827" : "#e5e7eb",
            color: sel ? "#fff" : "#9ca3af",
            border: "none",
            borderRadius: 6,
            cursor: sel ? "pointer" : "default",
            fontWeight: 600,
            fontSize: 13
          },
          children: "Create"
        })]
      })]
    })
  });
}
function getQuestionIcon(q) {
  var _a, _b;
  const dt = q.displayType;
  if (q.type === "thumbnail" && dt === "image") return /* @__PURE__ */ jsx("span", {
    style: {
      fontSize: 11,
      color: "#0ea5e9"
    },
    children: "🏔"
  });
  if (q.type === "thumbnail" && dt === "color") return /* @__PURE__ */ jsx("span", {
    style: {
      fontSize: 11,
      color: "#f59e0b"
    },
    children: "💧"
  });
  switch (q.type) {
    case "color":
      return /* @__PURE__ */ jsx("span", {
        style: {
          display: "inline-block",
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: ((_b = (_a = q.swatches) == null ? void 0 : _a[0]) == null ? void 0 : _b.value) ?? "#888",
          border: "1px solid rgba(0,0,0,0.1)",
          flexShrink: 0
        }
      });
    case "thumbnail":
      return /* @__PURE__ */ jsx("span", {
        style: {
          fontSize: 11,
          color: "#0ea5e9",
          fontWeight: 700
        },
        children: "⊞"
      });
    case "text":
      return /* @__PURE__ */ jsx("span", {
        style: {
          fontWeight: 800,
          fontSize: 12,
          color: "#10b981",
          lineHeight: 1
        },
        children: "T"
      });
    case "file":
      return /* @__PURE__ */ jsx("span", {
        style: {
          fontSize: 11,
          color: "#ef4444"
        },
        children: "↑"
      });
    case "dropdown":
      return /* @__PURE__ */ jsx("span", {
        style: {
          fontSize: 10,
          color: "#6366f1"
        },
        children: "▼"
      });
    case "radio":
      return /* @__PURE__ */ jsx("span", {
        style: {
          fontSize: 10,
          color: "#6366f1"
        },
        children: "◉"
      });
    case "checkbox":
      return /* @__PURE__ */ jsx("span", {
        style: {
          fontSize: 10,
          color: "#10b981"
        },
        children: "☑"
      });
    case "label":
      return /* @__PURE__ */ jsx("span", {
        style: {
          fontSize: 10,
          color: "#22c55e"
        },
        children: "⊟"
      });
    case "group":
      return /* @__PURE__ */ jsx("span", {
        style: {
          fontSize: 11,
          color: "#6b7280"
        },
        children: "📁"
      });
    case "none":
      return /* @__PURE__ */ jsx("span", {
        style: {
          fontSize: 11,
          color: "#9ca3af"
        },
        children: "⊘"
      });
    default:
      return /* @__PURE__ */ jsx("span", {
        style: {
          fontSize: 10,
          color: "#9ca3af"
        },
        children: "?"
      });
  }
}
function QuestionRow({
  q,
  selected,
  layerName,
  onSelect,
  onDuplicate,
  onDelete,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return /* @__PURE__ */ jsxs("div", {
    draggable: true,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    style: {
      position: "relative",
      opacity: isDragging ? 0.35 : 1
    },
    onMouseLeave: () => setMenuOpen(false),
    children: [/* @__PURE__ */ jsxs("div", {
      onClick: onSelect,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 10px 8px 10px",
        cursor: "pointer",
        background: isDragOver ? "#f0f9ff" : selected ? "#eff6ff" : "transparent",
        borderLeft: `3px solid ${isDragOver ? "#0ea5e9" : selected ? "#3b82f6" : "transparent"}`
      },
      children: [/* @__PURE__ */ jsx("span", {
        style: {
          cursor: "grab",
          color: "#d1d5db",
          fontSize: 12,
          letterSpacing: 1,
          flexShrink: 0,
          userSelect: "none"
        },
        children: "⠿"
      }), /* @__PURE__ */ jsx("span", {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 18,
          flexShrink: 0
        },
        children: getQuestionIcon(q)
      }), /* @__PURE__ */ jsx("span", {
        style: {
          flex: 1,
          fontSize: 13,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        },
        children: q.name
      }), (q.type === "color" || q.type === "thumbnail") && layerName && /* @__PURE__ */ jsxs("span", {
        style: {
          fontSize: 10,
          color: "#9ca3af",
          flexShrink: 0
        },
        children: ["→ ", layerName]
      }), /* @__PURE__ */ jsx("button", {
        onClick: (e) => {
          e.stopPropagation();
          setMenuOpen((o) => !o);
        },
        style: {
          background: "none",
          border: "none",
          color: "#9ca3af",
          cursor: "pointer",
          fontSize: 14,
          lineHeight: 1,
          padding: "2px 4px",
          flexShrink: 0,
          borderRadius: 4
        },
        children: "⋮"
      })]
    }), menuOpen && /* @__PURE__ */ jsxs("div", {
      style: {
        position: "absolute",
        right: 8,
        top: "100%",
        zIndex: 50,
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
        minWidth: 160,
        overflow: "hidden"
      },
      children: [/* @__PURE__ */ jsx("button", {
        onClick: (e) => {
          e.stopPropagation();
          onDuplicate();
          setMenuOpen(false);
        },
        style: {
          display: "block",
          width: "100%",
          textAlign: "left",
          padding: "9px 14px",
          border: "none",
          background: "none",
          cursor: "pointer",
          fontSize: 13,
          color: "#374151"
        },
        children: "Duplicate"
      }), /* @__PURE__ */ jsx("button", {
        onClick: (e) => {
          e.stopPropagation();
          onDelete();
          setMenuOpen(false);
        },
        style: {
          display: "block",
          width: "100%",
          textAlign: "left",
          padding: "9px 14px",
          border: "none",
          background: "none",
          cursor: "pointer",
          fontSize: 13,
          color: "#ef4444"
        },
        children: "Delete"
      })]
    })]
  });
}
function GroupRow({
  q,
  selected,
  expanded,
  onToggle,
  onSelect,
  onDelete,
  onAddChild,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}) {
  const [hovering, setHovering] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  return /* @__PURE__ */ jsxs("div", {
    draggable: true,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    style: {
      opacity: isDragging ? 0.35 : 1,
      position: "relative"
    },
    onMouseEnter: () => setHovering(true),
    onMouseLeave: () => {
      setHovering(false);
      setMenuOpen(false);
    },
    children: [/* @__PURE__ */ jsxs("div", {
      onClick: onSelect,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 10px",
        cursor: "pointer",
        background: isDragOver ? "#dbeafe" : selected ? "#eff6ff" : "transparent",
        borderLeft: `3px solid ${isDragOver ? "#2563eb" : selected ? "#3b82f6" : "transparent"}`,
        outline: isDragOver ? "1px dashed #93c5fd" : "none",
        outlineOffset: -1
      },
      children: [/* @__PURE__ */ jsx("button", {
        onClick: (e) => {
          e.stopPropagation();
          onToggle();
        },
        style: {
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          width: 16,
          height: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0
        },
        children: /* @__PURE__ */ jsx("svg", {
          width: "11",
          height: "11",
          viewBox: "0 0 11 11",
          fill: "none",
          style: {
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.15s"
          },
          children: /* @__PURE__ */ jsx("path", {
            d: "M3.5 2l4 3.5-4 3.5",
            stroke: "#6b7280",
            strokeWidth: "1.5",
            strokeLinecap: "round",
            strokeLinejoin: "round"
          })
        })
      }), /* @__PURE__ */ jsx("span", {
        style: {
          fontSize: 15,
          flexShrink: 0
        },
        children: "📁"
      }), /* @__PURE__ */ jsx("span", {
        style: {
          flex: 1,
          fontSize: 13,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        },
        children: q.name
      }), isDragOver && /* @__PURE__ */ jsx("span", {
        style: {
          fontSize: 10,
          color: "#2563eb",
          fontWeight: 600,
          flexShrink: 0
        },
        children: "↳ drop inside"
      }), hovering && !isDragOver && /* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          gap: 4,
          flexShrink: 0
        },
        onClick: (e) => e.stopPropagation(),
        children: [/* @__PURE__ */ jsxs("div", {
          style: {
            position: "relative"
          },
          children: [/* @__PURE__ */ jsx("button", {
            onClick: (e) => {
              e.stopPropagation();
              setMenuOpen((o) => !o);
            },
            style: {
              width: 22,
              height: 22,
              background: "none",
              border: "1px solid #e5e7eb",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 13,
              color: "#6b7280",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            },
            children: "⋮"
          }), menuOpen && /* @__PURE__ */ jsxs("div", {
            style: {
              position: "absolute",
              right: 0,
              top: "100%",
              zIndex: 60,
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              minWidth: 160,
              overflow: "hidden",
              marginTop: 2
            },
            children: [/* @__PURE__ */ jsx("div", {
              style: {
                padding: "6px 12px 4px",
                fontSize: 10,
                color: "#9ca3af",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              },
              children: "More actions"
            }), /* @__PURE__ */ jsx("button", {
              onClick: (e) => {
                e.stopPropagation();
                onDelete();
              },
              style: {
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 14px",
                border: "none",
                background: "none",
                cursor: "pointer",
                fontSize: 13,
                color: "#ef4444"
              },
              children: "Delete"
            })]
          })]
        }), /* @__PURE__ */ jsx("button", {
          onClick: (e) => {
            e.stopPropagation();
            onAddChild();
          },
          style: {
            width: 22,
            height: 22,
            background: "#111827",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 15,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          },
          children: "+"
        })]
      })]
    }), menuOpen && /* @__PURE__ */ jsx("div", {
      style: {
        position: "fixed",
        inset: 0,
        zIndex: 55
      },
      onClick: () => setMenuOpen(false)
    })]
  });
}
function LayerRow({
  layer,
  selected,
  linkedNames,
  onSelect,
  onRemove,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}) {
  const dt = layer.displayType;
  const dtMeta = dt ? DISPLAY_TYPE_META[dt] : null;
  const dtBg = dt ? LAYER_DISPLAY_COLORS[dt] ?? "#6b7280" : "#d1d5db";
  return /* @__PURE__ */ jsxs("div", {
    draggable: true,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    style: {
      position: "relative",
      opacity: isDragging ? 0.35 : 1
    },
    children: [/* @__PURE__ */ jsxs("div", {
      onClick: onSelect,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 10px 7px 10px",
        cursor: "pointer",
        background: isDragOver ? "#f0f9ff" : selected ? "#eff6ff" : "transparent",
        borderLeft: `3px solid ${isDragOver ? "#0ea5e9" : selected ? "#3b82f6" : "transparent"}`
      },
      children: [/* @__PURE__ */ jsx("span", {
        style: {
          cursor: "grab",
          color: "#d1d5db",
          fontSize: 12,
          letterSpacing: 1,
          flexShrink: 0,
          userSelect: "none"
        },
        children: "⠿"
      }), dtMeta ? /* @__PURE__ */ jsx("span", {
        style: {
          width: 18,
          height: 18,
          background: dtBg,
          borderRadius: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          color: "#fff",
          fontWeight: 700,
          flexShrink: 0
        },
        children: dtMeta.icon
      }) : /* @__PURE__ */ jsx("span", {
        style: {
          display: "inline-block",
          width: 4,
          height: 18,
          borderRadius: 2,
          background: layer.type === "colorable" ? "#6366f1" : "#d1d5db",
          flexShrink: 0
        }
      }), /* @__PURE__ */ jsx("span", {
        style: {
          flex: 1,
          fontSize: 13,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        },
        children: layer.name
      }), !dtMeta && /* @__PURE__ */ jsx("span", {
        style: {
          fontSize: 10,
          color: "#9ca3af",
          textTransform: "uppercase",
          flexShrink: 0
        },
        children: layer.type === "colorable" ? "color" : "static"
      }), /* @__PURE__ */ jsx("button", {
        onClick: (e) => {
          e.stopPropagation();
          onRemove();
        },
        style: {
          background: "none",
          border: "none",
          color: "#d1d5db",
          cursor: "pointer",
          fontSize: 14,
          lineHeight: 1,
          padding: 0
        },
        children: "×"
      })]
    }), linkedNames && linkedNames.length > 0 && /* @__PURE__ */ jsx("div", {
      style: {
        paddingLeft: 36,
        paddingBottom: 4
      },
      children: linkedNames.map((n) => /* @__PURE__ */ jsxs("span", {
        style: {
          fontSize: 11,
          color: "#9ca3af"
        },
        children: ["↳ ", n]
      }, n))
    })]
  });
}
const STANDARD_PALETTE = [{
  value: "#FFFFFF",
  label: "White"
}, {
  value: "#000000",
  label: "Black"
}, {
  value: "#808080",
  label: "Gray"
}, {
  value: "#C8A96E",
  label: "Blonde"
}, {
  value: "#D2B48C",
  label: "Tan"
}, {
  value: "#8B4513",
  label: "Brown"
}, {
  value: "#800000",
  label: "Maroon"
}, {
  value: "#003087",
  label: "Navy Blue"
}, {
  value: "#FF0000",
  label: "Red"
}, {
  value: "#6A0DAD",
  label: "Purple"
}, {
  value: "#0044FF",
  label: "Royal Blue"
}, {
  value: "#87CEEB",
  label: "Sky Blue"
}, {
  value: "#98FFB3",
  label: "Mint"
}, {
  value: "#228B22",
  label: "Forest Green"
}, {
  value: "#ADD8E6",
  label: "Light Blue"
}, {
  value: "#FF8C00",
  label: "Orange"
}, {
  value: "#FF69B4",
  label: "Pink"
}, {
  value: "#FFD700",
  label: "Yellow"
}, {
  value: "#556B2F",
  label: "Army Green"
}, {
  value: "#00CED1",
  label: "Teal"
}];
function SwatchRow({
  swatch,
  isActive,
  onSelect,
  onRemove,
  onImageUpload
}) {
  var _a;
  const fetcher = useFetcher();
  const uploading = fetcher.state !== "idle";
  useEffect(() => {
    var _a2;
    if ((_a2 = fetcher.data) == null ? void 0 : _a2.url) onImageUpload(fetcher.data.url);
  }, [(_a = fetcher.data) == null ? void 0 : _a.url]);
  const handleFile = (e) => {
    var _a2;
    const file = (_a2 = e.target.files) == null ? void 0 : _a2[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fetcher.submit(fd, {
      method: "post",
      action: "/app/upload-image",
      encType: "multipart/form-data"
    });
    e.target.value = "";
  };
  return /* @__PURE__ */ jsxs("div", {
    onClick: onSelect,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "5px 8px",
      borderRadius: 6,
      background: isActive ? "#eff6ff" : "#f9fafb",
      border: isActive ? "1px solid #93c5fd" : "1px solid #f3f4f6",
      cursor: "pointer"
    },
    children: [swatch.imageUrl ? /* @__PURE__ */ jsx("img", {
      src: swatch.imageUrl,
      alt: swatch.label,
      style: {
        width: 28,
        height: 28,
        borderRadius: 4,
        objectFit: "cover",
        flexShrink: 0,
        outline: isActive ? "2px solid #3b82f6" : "none",
        outlineOffset: 1
      }
    }) : /* @__PURE__ */ jsx("span", {
      style: {
        width: 22,
        height: 22,
        borderRadius: "50%",
        background: swatch.value,
        border: isActive ? "2px solid #3b82f6" : "1px solid rgba(0,0,0,0.15)",
        flexShrink: 0,
        display: "inline-block"
      }
    }), /* @__PURE__ */ jsx("span", {
      style: {
        flex: 1,
        fontSize: 13,
        fontWeight: isActive ? 600 : 400
      },
      children: swatch.label
    }), isActive && /* @__PURE__ */ jsx("span", {
      style: {
        fontSize: 10,
        color: "#3b82f6",
        fontWeight: 700
      },
      children: "● PREVIEW"
    }), /* @__PURE__ */ jsx("span", {
      style: {
        fontSize: 11,
        color: "#9ca3af"
      },
      children: swatch.value
    }), /* @__PURE__ */ jsxs("label", {
      title: swatch.imageUrl ? "Replace image" : "Add texture image",
      style: {
        cursor: uploading ? "wait" : "pointer",
        fontSize: 13,
        color: "#9ca3af"
      },
      children: [uploading ? "⏳" : swatch.imageUrl ? "🔄" : "🖼", /* @__PURE__ */ jsx("input", {
        type: "file",
        accept: "image/*",
        style: {
          display: "none"
        },
        onChange: handleFile,
        disabled: uploading
      })]
    }), /* @__PURE__ */ jsx("button", {
      onClick: onRemove,
      style: {
        background: "none",
        border: "none",
        color: "#d1d5db",
        cursor: "pointer",
        fontSize: 16,
        lineHeight: 1,
        padding: 0
      },
      children: "×"
    })]
  });
}
function ImageUploadSlot({
  currentUrl,
  label: label2,
  onUploaded
}) {
  var _a, _b;
  const fetcher = useFetcher();
  const uploading = fetcher.state !== "idle";
  useEffect(() => {
    var _a2;
    if ((_a2 = fetcher.data) == null ? void 0 : _a2.url) onUploaded(fetcher.data.url);
  }, [(_a = fetcher.data) == null ? void 0 : _a.url]);
  const handleFile = (e) => {
    var _a2;
    const file = (_a2 = e.target.files) == null ? void 0 : _a2[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fetcher.submit(fd, {
      method: "post",
      action: "/app/upload-image",
      encType: "multipart/form-data"
    });
    e.target.value = "";
  };
  const getFileInfo = (url) => {
    const filename = url.split("/").pop() ?? "image.png";
    const tsMatch = filename.match(/preview-(\d+)-/);
    if (tsMatch) {
      const ts = parseInt(tsMatch[1]);
      const diff = Date.now() - ts;
      const days = Math.floor(diff / 864e5);
      const hours = Math.floor(diff / 36e5);
      const mins = Math.floor(diff / 6e4);
      const timeAgo = days > 0 ? `${days} day${days > 1 ? "s" : ""} ago` : hours > 0 ? `${hours}h ago` : mins > 0 ? `${mins}m ago` : "Just now";
      return {
        name: filename,
        timeAgo
      };
    }
    return {
      name: filename,
      timeAgo: "Uploaded"
    };
  };
  return /* @__PURE__ */ jsxs("div", {
    style: {
      marginBottom: 8
    },
    children: [/* @__PURE__ */ jsx("label", {
      style: {
        fontSize: 11,
        color: "#6b7280",
        display: "block",
        marginBottom: 4,
        fontWeight: 600
      },
      children: label2
    }), currentUrl ? (
      /* ── Uploaded state: filename + date (Kickflip style) ── */
      /* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 10px",
          border: "1px solid #e5e7eb",
          borderRadius: 6,
          background: "#f9fafb"
        },
        children: [/* @__PURE__ */ jsx("img", {
          src: currentUrl,
          alt: "",
          style: {
            width: 38,
            height: 38,
            objectFit: "contain",
            borderRadius: 4,
            border: "1px solid #e5e7eb",
            background: "#fff",
            flexShrink: 0
          }
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            flex: 1,
            minWidth: 0
          },
          children: [/* @__PURE__ */ jsx("div", {
            style: {
              fontSize: 12,
              color: "#374151",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontWeight: 500
            },
            children: getFileInfo(currentUrl).name
          }), /* @__PURE__ */ jsx("div", {
            style: {
              fontSize: 11,
              color: "#9ca3af",
              marginTop: 1
            },
            children: getFileInfo(currentUrl).timeAgo
          })]
        }), /* @__PURE__ */ jsxs("label", {
          style: {
            fontSize: 11,
            color: "#2563eb",
            cursor: uploading ? "wait" : "pointer",
            flexShrink: 0,
            whiteSpace: "nowrap"
          },
          children: ["Replace", /* @__PURE__ */ jsx("input", {
            type: "file",
            accept: "image/*",
            style: {
              display: "none"
            },
            disabled: uploading,
            onChange: handleFile
          })]
        }), /* @__PURE__ */ jsx("button", {
          onClick: () => onUploaded(null),
          style: {
            background: "none",
            border: "none",
            color: "#d1d5db",
            cursor: "pointer",
            fontSize: 18,
            lineHeight: 1,
            padding: 0,
            flexShrink: 0
          },
          children: "×"
        })]
      })
    ) : (
      /* ── Empty state: dashed drop zone ── */
      /* @__PURE__ */ jsxs("label", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 12px",
          border: "1.5px dashed #d1d5db",
          borderRadius: 6,
          cursor: uploading ? "wait" : "pointer",
          color: uploading ? "#9ca3af" : "#6b7280",
          fontSize: 12,
          background: "#fafafa",
          transition: "border-color 0.15s"
        },
        children: [/* @__PURE__ */ jsx("span", {
          style: {
            fontSize: 15,
            opacity: 0.6
          },
          children: uploading ? "⏳" : "↑"
        }), /* @__PURE__ */ jsx("span", {
          style: {
            color: "#374151"
          },
          children: uploading ? "Uploading…" : "Drop image, or "
        }), !uploading && /* @__PURE__ */ jsx("span", {
          style: {
            color: "#2563eb",
            fontWeight: 600,
            textDecoration: "underline"
          },
          children: "browse"
        }), /* @__PURE__ */ jsx("input", {
          type: "file",
          accept: "image/*",
          style: {
            display: "none"
          },
          disabled: uploading,
          onChange: handleFile
        })]
      })
    ), ((_b = fetcher.data) == null ? void 0 : _b.error) && /* @__PURE__ */ jsx("p", {
      style: {
        color: "#ef4444",
        fontSize: 11,
        margin: "3px 0 0"
      },
      children: fetcher.data.error
    })]
  });
}
function ToggleRow({
  label: label2,
  checked,
  onChange
}) {
  return /* @__PURE__ */ jsxs("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "5px 0"
    },
    children: [/* @__PURE__ */ jsx("span", {
      style: {
        fontSize: 13,
        color: "#374151"
      },
      children: label2
    }), /* @__PURE__ */ jsx("div", {
      onClick: () => onChange(!checked),
      style: {
        width: 36,
        height: 20,
        borderRadius: 10,
        background: checked ? "#22c55e" : "#d1d5db",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.15s",
        flexShrink: 0
      },
      children: /* @__PURE__ */ jsx("div", {
        style: {
          position: "absolute",
          top: 2,
          left: checked ? 16 : 2,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.15s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
        }
      })
    })]
  });
}
function AnswerDetailPanel({
  swatch,
  numViews,
  displayType,
  onDone,
  onChange
}) {
  const setViewImage = (vi, url) => {
    const views = [...swatch.viewImages ?? Array(numViews).fill(null)];
    views[vi] = url;
    onChange({
      ...swatch,
      viewImages: views
    });
  };
  return /* @__PURE__ */ jsxs("div", {
    children: [/* @__PURE__ */ jsxs("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        borderBottom: "1px solid #e5e7eb"
      },
      children: [/* @__PURE__ */ jsx("span", {
        style: {
          fontSize: 15,
          color: "#9ca3af",
          letterSpacing: 3
        },
        children: "⠿"
      }), /* @__PURE__ */ jsx("button", {
        onClick: onDone,
        style: {
          padding: "5px 18px",
          border: "1px solid #e5e7eb",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 600,
          background: "#fff",
          color: "#374151"
        },
        children: "Done"
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        padding: "12px 16px 8px"
      },
      children: [/* @__PURE__ */ jsx("label", {
        style: labelSt,
        children: "Title"
      }), /* @__PURE__ */ jsx("input", {
        value: swatch.label,
        onChange: (e) => onChange({
          ...swatch,
          label: e.target.value
        }),
        style: inputSt
      })]
    }), displayType === "image" && /* @__PURE__ */ jsx("div", {
      style: {
        padding: "4px 16px 4px"
      },
      children: Array.from({
        length: numViews
      }).map((_, vi) => {
        var _a;
        return /* @__PURE__ */ jsxs("div", {
          style: {
            marginBottom: 10
          },
          children: [/* @__PURE__ */ jsxs("label", {
            style: {
              fontSize: 13,
              fontWeight: 500,
              color: "#374151",
              display: "block",
              marginBottom: 6
            },
            children: ["View ", vi + 1]
          }), /* @__PURE__ */ jsx(ImageUploadSlot, {
            label: "",
            currentUrl: ((_a = swatch.viewImages) == null ? void 0 : _a[vi]) ?? null,
            onUploaded: (url) => setViewImage(vi, url)
          })]
        }, vi);
      })
    }), displayType === "color" && /* @__PURE__ */ jsxs("div", {
      style: {
        padding: "4px 16px 12px"
      },
      children: [/* @__PURE__ */ jsx("label", {
        style: {
          fontSize: 13,
          fontWeight: 500,
          color: "#374151",
          display: "block",
          marginBottom: 10
        },
        children: "Color"
      }), /* @__PURE__ */ jsx(ModernColorPicker, {
        value: swatch.value.startsWith("#") ? swatch.value : "#FF0000",
        onChange: (hex) => onChange({
          ...swatch,
          value: hex
        })
      })]
    }), displayType === "color" && /* @__PURE__ */ jsxs("div", {
      style: {
        padding: "4px 16px 14px",
        borderTop: "1px solid #f3f4f6"
      },
      children: [/* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14
        },
        children: [/* @__PURE__ */ jsx("span", {
          style: {
            fontSize: 13,
            color: "#374151",
            fontWeight: 500
          },
          children: "Lighting"
        }), /* @__PURE__ */ jsx("input", {
          type: "checkbox",
          checked: swatch.lighting ?? true,
          onChange: (e) => onChange({
            ...swatch,
            lighting: e.target.checked
          }),
          style: {
            width: 18,
            height: 18,
            cursor: "pointer",
            accentColor: "#2563eb"
          }
        })]
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          marginBottom: 12,
          opacity: swatch.lighting === false ? 0.45 : 1,
          transition: "opacity 0.15s"
        },
        children: [/* @__PURE__ */ jsx("span", {
          style: {
            fontSize: 13,
            color: "#374151",
            display: "block",
            marginBottom: 8
          },
          children: "Lighting brightness"
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 10
          },
          children: [/* @__PURE__ */ jsx("input", {
            type: "range",
            min: 0,
            max: 1,
            step: 0.01,
            value: swatch.lightingBrightness ?? 0.6,
            disabled: swatch.lighting === false,
            onChange: (e) => onChange({
              ...swatch,
              lightingBrightness: Number(e.target.value)
            }),
            style: {
              flex: 1,
              accentColor: "#2563eb",
              cursor: swatch.lighting === false ? "default" : "pointer"
            }
          }), /* @__PURE__ */ jsx("input", {
            type: "number",
            min: 0,
            max: 1,
            step: 0.1,
            value: swatch.lightingBrightness ?? 0.6,
            disabled: swatch.lighting === false,
            onChange: (e) => onChange({
              ...swatch,
              lightingBrightness: Math.max(0, Math.min(1, Number(e.target.value)))
            }),
            style: {
              width: 56,
              padding: "4px 6px",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              fontSize: 13,
              outline: "none",
              textAlign: "center"
            }
          })]
        })]
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          marginBottom: 14,
          opacity: swatch.lighting === false ? 0.45 : 1,
          transition: "opacity 0.15s"
        },
        children: [/* @__PURE__ */ jsx("span", {
          style: {
            fontSize: 13,
            color: "#374151",
            display: "block",
            marginBottom: 8
          },
          children: "Lighting intensity"
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 10
          },
          children: [/* @__PURE__ */ jsx("input", {
            type: "range",
            min: 0,
            max: 100,
            step: 1,
            value: swatch.lightingIntensity ?? 30,
            disabled: swatch.lighting === false,
            onChange: (e) => onChange({
              ...swatch,
              lightingIntensity: Number(e.target.value)
            }),
            style: {
              flex: 1,
              accentColor: "#2563eb",
              cursor: swatch.lighting === false ? "default" : "pointer"
            }
          }), /* @__PURE__ */ jsx("input", {
            type: "number",
            min: 0,
            max: 100,
            step: 1,
            value: swatch.lightingIntensity ?? 30,
            disabled: swatch.lighting === false,
            onChange: (e) => onChange({
              ...swatch,
              lightingIntensity: Math.max(0, Math.min(100, Number(e.target.value)))
            }),
            style: {
              width: 56,
              padding: "4px 6px",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              fontSize: 13,
              outline: "none",
              textAlign: "center"
            }
          })]
        })]
      }), /* @__PURE__ */ jsx("button", {
        onClick: () => onChange({
          ...swatch,
          lighting: true,
          lightingBrightness: 0.6,
          lightingIntensity: 30
        }),
        style: {
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          fontSize: 13,
          color: "#9ca3af"
        },
        children: "Reset to default"
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        padding: "4px 16px 10px",
        borderTop: "1px solid #f3f4f6"
      },
      children: [/* @__PURE__ */ jsx("label", {
        style: {
          fontSize: 13,
          fontWeight: 500,
          color: "#374151",
          display: "block",
          marginBottom: 6
        },
        children: "Thumbnail"
      }), /* @__PURE__ */ jsx(ImageUploadSlot, {
        label: "",
        currentUrl: swatch.imageUrl ?? null,
        onUploaded: (url) => onChange({
          ...swatch,
          imageUrl: url ?? void 0
        })
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        borderTop: "1px solid #f3f4f6"
      },
      children: [/* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px"
        },
        children: [/* @__PURE__ */ jsx("label", {
          style: {
            fontSize: 13,
            color: "#374151"
          },
          children: "Description"
        }), /* @__PURE__ */ jsx("input", {
          type: "checkbox",
          checked: swatch.description !== void 0,
          onChange: (e) => onChange({
            ...swatch,
            description: e.target.checked ? "" : void 0
          }),
          style: {
            width: 16,
            height: 16,
            cursor: "pointer",
            accentColor: "#22c55e"
          }
        })]
      }), swatch.description !== void 0 && /* @__PURE__ */ jsx("div", {
        style: {
          padding: "0 16px 10px"
        },
        children: /* @__PURE__ */ jsx("input", {
          value: swatch.description,
          onChange: (e) => onChange({
            ...swatch,
            description: e.target.value
          }),
          placeholder: "Enter description…",
          style: inputSt
        })
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        borderTop: "1px solid #f3f4f6"
      },
      children: [/* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px"
        },
        children: [/* @__PURE__ */ jsx("label", {
          style: {
            fontSize: 13,
            color: "#374151"
          },
          children: "Production code"
        }), /* @__PURE__ */ jsx("input", {
          type: "checkbox",
          checked: swatch.productionCode !== void 0,
          onChange: (e) => onChange({
            ...swatch,
            productionCode: e.target.checked ? "" : void 0
          }),
          style: {
            width: 16,
            height: 16,
            cursor: "pointer",
            accentColor: "#22c55e"
          }
        })]
      }), swatch.productionCode !== void 0 && /* @__PURE__ */ jsx("div", {
        style: {
          padding: "0 16px 10px"
        },
        children: /* @__PURE__ */ jsx("input", {
          value: swatch.productionCode,
          onChange: (e) => onChange({
            ...swatch,
            productionCode: e.target.value
          }),
          placeholder: "Enter production code…",
          style: inputSt
        })
      })]
    })]
  });
}
function ThumbnailEditor({
  q,
  layers,
  questions,
  numViews,
  onChange,
  onEditAnswer,
  editingIdx,
  onSwitchType,
  onPreview
}) {
  var _a, _b;
  const [answerMenu, setAnswerMenu] = useState(null);
  const [showApplyPicker, setShowApplyPicker] = useState(false);
  const [applySearchColor, setApplySearchColor] = useState("");
  const [showInputTypePicker, setShowInputTypePicker] = useState(false);
  const [showDisplayTypePicker, setShowDisplayTypePicker] = useState(false);
  const displayType = q.displayType ?? "image";
  const addAnswer = () => {
    const swatch = displayType === "color" ? {
      value: "#ff0000",
      label: "Untitled answer"
    } : {
      value: `ans-${Date.now()}`,
      label: "Untitled answer",
      viewImages: Array(numViews).fill(null)
    };
    const next = [...q.swatches, swatch];
    onChange({
      ...q,
      swatches: next
    });
    onEditAnswer(next.length - 1);
  };
  const duplicateAnswer = (idx) => {
    const copy = {
      ...q.swatches[idx],
      value: `ans-${Date.now()}`,
      label: `${q.swatches[idx].label} (copy)`
    };
    onChange({
      ...q,
      swatches: [...q.swatches.slice(0, idx + 1), copy, ...q.swatches.slice(idx + 1)]
    });
  };
  const removeAnswer = (idx) => onChange({
    ...q,
    swatches: q.swatches.filter((_, i) => i !== idx)
  });
  const [dragAnswerIdx, setDragAnswerIdx] = useState(null);
  const [dragOverAnswerIdx, setDragOverAnswerIdx] = useState(null);
  const handleAnswerDragStart = (idx) => setDragAnswerIdx(idx);
  const handleAnswerDragOver = (e, idx) => {
    e.preventDefault();
    setDragOverAnswerIdx(idx);
  };
  const handleAnswerDrop = (e, toIdx) => {
    e.preventDefault();
    if (dragAnswerIdx === null || dragAnswerIdx === toIdx) {
      setDragAnswerIdx(null);
      setDragOverAnswerIdx(null);
      return;
    }
    const next = [...q.swatches];
    const [removed] = next.splice(dragAnswerIdx, 1);
    next.splice(toIdx, 0, removed);
    onChange({
      ...q,
      swatches: next
    });
    setDragAnswerIdx(null);
    setDragOverAnswerIdx(null);
  };
  const handleAnswerDragEnd = () => {
    setDragAnswerIdx(null);
    setDragOverAnswerIdx(null);
  };
  const linkedIds = q.applyOn ?? [];
  const allImageItems = [...questions.filter((oq) => oq.id !== q.id).map((oq) => ({
    id: oq.id,
    name: oq.name
  })), ...layers.map((l) => ({
    id: l.id,
    name: l.name
  }))];
  const applyPickerRef = useRef(null);
  useEffect(() => {
    if (!showApplyPicker) return;
    const handleClickOutside = (e) => {
      if (applyPickerRef.current && !applyPickerRef.current.contains(e.target)) {
        setShowApplyPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showApplyPicker]);
  return /* @__PURE__ */ jsxs("div", {
    children: [/* @__PURE__ */ jsxs("div", {
      style: {
        padding: "12px 16px 8px"
      },
      children: [/* @__PURE__ */ jsx("label", {
        style: labelSt,
        children: "Title"
      }), /* @__PURE__ */ jsx("input", {
        value: q.name,
        onChange: (e) => onChange({
          ...q,
          name: e.target.value
        }),
        style: inputSt
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        padding: "8px 16px 12px",
        borderBottom: "1px solid #f3f4f6"
      },
      children: [/* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8
        },
        children: [/* @__PURE__ */ jsx("span", {
          style: {
            fontSize: 13,
            fontWeight: 600,
            color: "#374151"
          },
          children: displayType === "color" ? "Color answers" : "Image answers"
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            display: "flex",
            gap: 5
          },
          children: [/* @__PURE__ */ jsx("button", {
            title: "Library",
            style: {
              background: "none",
              border: "1px solid #e5e7eb",
              borderRadius: 5,
              width: 28,
              height: 28,
              cursor: "pointer",
              fontSize: 13,
              color: "#9ca3af",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            },
            children: "⊞"
          }), /* @__PURE__ */ jsx("button", {
            onClick: addAnswer,
            style: {
              width: 28,
              height: 28,
              background: "#111827",
              color: "#fff",
              border: "none",
              borderRadius: 5,
              cursor: "pointer",
              fontSize: 18,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            },
            children: "+"
          })]
        })]
      }), q.swatches.length === 0 && /* @__PURE__ */ jsxs("div", {
        style: {
          padding: "14px",
          border: "2px dashed #e5e7eb",
          borderRadius: 8,
          textAlign: "center"
        },
        children: [/* @__PURE__ */ jsx("p", {
          style: {
            fontSize: 12,
            color: "#9ca3af",
            margin: "0 0 8px"
          },
          children: "No answers yet."
        }), /* @__PURE__ */ jsx("button", {
          onClick: addAnswer,
          style: {
            padding: "6px 14px",
            background: "#111827",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600
          },
          children: "+ Add first answer"
        })]
      }), q.swatches.map((s, idx) => /* @__PURE__ */ jsxs("div", {
        draggable: true,
        onDragStart: () => handleAnswerDragStart(idx),
        onDragOver: (e) => handleAnswerDragOver(e, idx),
        onDrop: (e) => handleAnswerDrop(e, idx),
        onDragEnd: handleAnswerDragEnd,
        style: {
          position: "relative",
          marginBottom: 5,
          opacity: dragAnswerIdx === idx ? 0.35 : 1
        },
        onMouseLeave: () => setAnswerMenu(null),
        children: [/* @__PURE__ */ jsxs("div", {
          onClick: () => {
            onEditAnswer(idx);
            if (displayType === "color") onPreview == null ? void 0 : onPreview(s.value);
          },
          style: {
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 10px",
            border: `1px solid ${dragOverAnswerIdx === idx && dragAnswerIdx !== idx ? "#0ea5e9" : editingIdx === idx ? "#93c5fd" : "#e5e7eb"}`,
            borderRadius: 7,
            cursor: "pointer",
            background: dragOverAnswerIdx === idx && dragAnswerIdx !== idx ? "#f0f9ff" : editingIdx === idx ? "#eff6ff" : "#fafafa"
          },
          children: [/* @__PURE__ */ jsx("span", {
            style: {
              cursor: "grab",
              color: "#d1d5db",
              fontSize: 13,
              letterSpacing: 1,
              flexShrink: 0,
              userSelect: "none"
            },
            children: "⠿"
          }), displayType === "color" ? /* @__PURE__ */ jsx("span", {
            style: {
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: s.value || "#e5e7eb",
              border: "1px solid rgba(0,0,0,0.1)",
              flexShrink: 0,
              display: "inline-block"
            }
          }) : s.imageUrl ? /* @__PURE__ */ jsx("img", {
            src: s.imageUrl,
            alt: "",
            style: {
              width: 22,
              height: 22,
              borderRadius: 4,
              objectFit: "cover",
              flexShrink: 0
            }
          }) : /* @__PURE__ */ jsx("span", {
            style: {
              width: 22,
              height: 22,
              borderRadius: 4,
              background: "#e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              color: "#9ca3af",
              flexShrink: 0
            },
            children: "img"
          }), /* @__PURE__ */ jsx("span", {
            style: {
              flex: 1,
              fontSize: 13
            },
            children: s.label || "Untitled answer"
          }), /* @__PURE__ */ jsx("button", {
            onClick: (e) => {
              e.stopPropagation();
              setAnswerMenu(answerMenu === idx ? null : idx);
            },
            style: {
              background: "none",
              border: "none",
              color: "#9ca3af",
              cursor: "pointer",
              fontSize: 16,
              padding: "0 2px",
              flexShrink: 0
            },
            children: "⋮"
          }), /* @__PURE__ */ jsx("span", {
            style: {
              color: "#22c55e",
              fontSize: 14,
              flexShrink: 0
            },
            children: "✓"
          })]
        }), answerMenu === idx && /* @__PURE__ */ jsxs("div", {
          style: {
            position: "absolute",
            right: 0,
            top: "100%",
            zIndex: 50,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            minWidth: 140,
            overflow: "hidden"
          },
          children: [/* @__PURE__ */ jsx("button", {
            onClick: (e) => {
              e.stopPropagation();
              duplicateAnswer(idx);
              setAnswerMenu(null);
            },
            style: {
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "8px 14px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: 13,
              color: "#374151"
            },
            children: "Duplicate"
          }), /* @__PURE__ */ jsx("button", {
            onClick: (e) => {
              e.stopPropagation();
              removeAnswer(idx);
              setAnswerMenu(null);
            },
            style: {
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "8px 14px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: 13,
              color: "#ef4444"
            },
            children: "Delete"
          })]
        })]
      }, `${s.value}-${idx}`))]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        padding: "12px 16px",
        borderBottom: "1px solid #f3f4f6"
      },
      children: [/* @__PURE__ */ jsx("label", {
        style: {
          fontSize: 13,
          fontWeight: 600,
          color: "#374151",
          display: "block",
          marginBottom: 8
        },
        children: "Input type"
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          position: "relative",
          marginBottom: 10
        },
        children: [/* @__PURE__ */ jsxs("button", {
          onClick: () => {
            setShowInputTypePicker((v) => !v);
            setShowDisplayTypePicker(false);
          },
          style: {
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 10px",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            background: "#f9fafb",
            width: "100%",
            cursor: "pointer",
            boxSizing: "border-box"
          },
          children: [/* @__PURE__ */ jsx("span", {
            style: {
              width: 22,
              height: 22,
              background: "#0ea5e9",
              borderRadius: 5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              color: "#fff",
              fontWeight: 700,
              flexShrink: 0
            },
            children: "⊞"
          }), /* @__PURE__ */ jsx("span", {
            style: {
              flex: 1,
              fontSize: 13,
              color: "#374151",
              textAlign: "left"
            },
            children: "Thumbnail"
          }), /* @__PURE__ */ jsx("span", {
            style: {
              fontSize: 10,
              color: "#9ca3af"
            },
            children: "▼"
          })]
        }), showInputTypePicker && /* @__PURE__ */ jsx("div", {
          style: {
            position: "absolute",
            left: 0,
            right: 0,
            top: "calc(100% + 2px)",
            zIndex: 60,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            maxHeight: 280,
            overflowY: "auto"
          },
          children: INPUT_TYPE_CONFIG.map(({
            type,
            label: label2,
            bg,
            icon
          }) => /* @__PURE__ */ jsxs("button", {
            onClick: () => {
              if (type !== "thumbnail") onSwitchType == null ? void 0 : onSwitchType(type);
              setShowInputTypePicker(false);
            },
            style: {
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              border: "none",
              background: type === "thumbnail" ? "#eff6ff" : "none",
              cursor: "pointer",
              width: "100%",
              boxSizing: "border-box"
            },
            children: [/* @__PURE__ */ jsx("span", {
              style: {
                width: 22,
                height: 22,
                background: bg,
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                color: "#fff",
                fontWeight: 700,
                flexShrink: 0
              },
              children: icon
            }), /* @__PURE__ */ jsx("span", {
              style: {
                flex: 1,
                fontSize: 13,
                color: "#374151",
                textAlign: "left"
              },
              children: label2
            }), type === "thumbnail" && /* @__PURE__ */ jsx("span", {
              style: {
                color: "#22c55e",
                fontSize: 12
              },
              children: "✓"
            })]
          }, type))
        })]
      }), /* @__PURE__ */ jsx(ToggleRow, {
        label: "Multiple selection",
        checked: q.multipleSelection ?? false,
        onChange: (v) => onChange({
          ...q,
          multipleSelection: v
        })
      }), /* @__PURE__ */ jsx(ToggleRow, {
        label: "Large thumbnail",
        checked: q.largeThumbnail ?? false,
        onChange: (v) => onChange({
          ...q,
          largeThumbnail: v
        })
      }), /* @__PURE__ */ jsx(ToggleRow, {
        label: "Show name label",
        checked: q.showNameLabel ?? false,
        onChange: (v) => onChange({
          ...q,
          showNameLabel: v
        })
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        padding: "12px 16px"
      },
      children: [/* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8
        },
        children: [/* @__PURE__ */ jsx("label", {
          style: {
            fontSize: 13,
            fontWeight: 600,
            color: "#374151"
          },
          children: "Display type"
        }), /* @__PURE__ */ jsx("span", {
          style: {
            fontSize: 14,
            color: "#9ca3af"
          },
          children: "⚙"
        })]
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          position: "relative",
          marginBottom: 10
        },
        children: [/* @__PURE__ */ jsxs("button", {
          onClick: () => {
            setShowDisplayTypePicker((v) => !v);
            setShowInputTypePicker(false);
          },
          style: {
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 10px",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            background: "#f9fafb",
            width: "100%",
            cursor: "pointer",
            boxSizing: "border-box"
          },
          children: [/* @__PURE__ */ jsx("span", {
            style: {
              width: 22,
              height: 22,
              background: "#f3f4f6",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              color: "#6b7280",
              flexShrink: 0
            },
            children: ((_a = DISPLAY_TYPE_META[displayType]) == null ? void 0 : _a.icon) ?? "?"
          }), /* @__PURE__ */ jsx("span", {
            style: {
              flex: 1,
              fontSize: 13,
              color: "#374151",
              textAlign: "left"
            },
            children: ((_b = DISPLAY_TYPE_META[displayType]) == null ? void 0 : _b.label) ?? displayType
          }), /* @__PURE__ */ jsx("span", {
            style: {
              fontSize: 10,
              color: "#9ca3af"
            },
            children: "▼"
          })]
        }), showDisplayTypePicker && /* @__PURE__ */ jsx("div", {
          style: {
            position: "absolute",
            left: 0,
            right: 0,
            top: "calc(100% + 2px)",
            zIndex: 60,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            overflow: "hidden"
          },
          children: ["image", "color", "none"].map((dt) => {
            const meta = DISPLAY_TYPE_META[dt] ?? {
              label: dt,
              icon: "?"
            };
            return /* @__PURE__ */ jsxs("button", {
              onClick: () => {
                onChange({
                  ...q,
                  displayType: dt
                });
                setShowDisplayTypePicker(false);
              },
              style: {
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                border: "none",
                background: dt === displayType ? "#eff6ff" : "none",
                cursor: "pointer",
                width: "100%",
                boxSizing: "border-box"
              },
              children: [/* @__PURE__ */ jsx("span", {
                style: {
                  width: 22,
                  height: 22,
                  background: "#f3f4f6",
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  color: "#374151",
                  flexShrink: 0
                },
                children: meta.icon
              }), /* @__PURE__ */ jsxs("span", {
                style: {
                  flex: 1,
                  fontSize: 13,
                  color: "#374151",
                  textAlign: "left"
                },
                children: [meta.label, meta.desc && /* @__PURE__ */ jsx("span", {
                  style: {
                    display: "block",
                    fontSize: 10,
                    color: "#9ca3af"
                  },
                  children: meta.desc
                })]
              }), dt === displayType && /* @__PURE__ */ jsx("span", {
                style: {
                  color: "#22c55e",
                  fontSize: 12
                },
                children: "✓"
              })]
            }, dt);
          })
        })]
      }), displayType === "color" && /* @__PURE__ */ jsxs("div", {
        style: {
          marginTop: 12
        },
        children: [/* @__PURE__ */ jsxs("div", {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 6
          },
          children: [/* @__PURE__ */ jsx("span", {
            style: {
              fontSize: 13,
              color: "#9ca3af"
            },
            children: "↳"
          }), /* @__PURE__ */ jsx("span", {
            style: {
              fontSize: 12,
              color: "#6b7280",
              fontWeight: 500
            },
            children: "Apply on"
          }), /* @__PURE__ */ jsxs("div", {
            ref: applyPickerRef,
            style: {
              marginLeft: "auto",
              position: "relative"
            },
            children: [/* @__PURE__ */ jsxs("button", {
              onClick: () => {
                setShowApplyPicker((v) => !v);
                setApplySearchColor("");
              },
              style: {
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 12,
                background: showApplyPicker ? "#eff6ff" : "#f9fafb",
                color: "#374151"
              },
              children: [/* @__PURE__ */ jsx("span", {
                children: "🏔"
              }), /* @__PURE__ */ jsx("span", {
                children: "Image question"
              }), /* @__PURE__ */ jsx("span", {
                style: {
                  fontWeight: 700
                },
                children: "+"
              })]
            }), showApplyPicker && /* @__PURE__ */ jsxs("div", {
              style: {
                position: "absolute",
                right: 0,
                top: "calc(100% + 4px)",
                zIndex: 50,
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                minWidth: 200,
                padding: "8px 8px 6px"
              },
              children: [/* @__PURE__ */ jsx("input", {
                autoFocus: true,
                value: applySearchColor,
                onChange: (e) => setApplySearchColor(e.target.value),
                placeholder: "Search...",
                style: {
                  width: "100%",
                  padding: "5px 8px",
                  fontSize: 12,
                  border: "1px solid #e5e7eb",
                  borderRadius: 5,
                  marginBottom: 6,
                  boxSizing: "border-box",
                  outline: "none"
                }
              }), /* @__PURE__ */ jsxs("div", {
                style: {
                  maxHeight: 180,
                  overflowY: "auto"
                },
                children: [allImageItems.filter((item) => !linkedIds.includes(item.id) && item.name.toLowerCase().includes(applySearchColor.toLowerCase())).map((item) => /* @__PURE__ */ jsx("button", {
                  onClick: () => {
                    onChange({
                      ...q,
                      applyOn: [...linkedIds, item.id]
                    });
                    setShowApplyPicker(false);
                    setApplySearchColor("");
                  },
                  style: {
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "7px 10px",
                    border: "none",
                    borderRadius: 5,
                    background: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    color: "#374151"
                  },
                  children: item.name
                }, item.id)), allImageItems.filter((item) => !linkedIds.includes(item.id) && item.name.toLowerCase().includes(applySearchColor.toLowerCase())).length === 0 && /* @__PURE__ */ jsx("p", {
                  style: {
                    padding: "6px 10px",
                    fontSize: 12,
                    color: "#9ca3af",
                    margin: 0
                  },
                  children: "No matches."
                })]
              })]
            })]
          })]
        }), linkedIds.map((lid) => {
          var _a2;
          const linkedQ = questions.find((oq) => oq.id === lid);
          const linkedL = !linkedQ ? layers.find((l) => l.id === lid) : null;
          const linkedName = (_a2 = linkedQ || linkedL) == null ? void 0 : _a2.name;
          if (!linkedName) return null;
          return /* @__PURE__ */ jsxs("div", {
            style: {
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 10px",
              background: "#f9fafb",
              borderRadius: 6,
              border: "1px solid #e5e7eb",
              marginBottom: 4
            },
            children: [/* @__PURE__ */ jsx("span", {
              style: {
                fontSize: 13
              },
              children: "🏔"
            }), /* @__PURE__ */ jsx("span", {
              style: {
                flex: 1,
                fontSize: 12,
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              },
              children: linkedName
            }), /* @__PURE__ */ jsx("button", {
              onClick: () => onChange({
                ...q,
                applyOn: linkedIds.filter((id) => id !== lid)
              }),
              style: {
                background: "none",
                border: "none",
                color: "#9ca3af",
                cursor: "pointer",
                fontSize: 16,
                padding: 0,
                lineHeight: 1,
                flexShrink: 0
              },
              children: "×"
            })]
          }, lid);
        })]
      })]
    })]
  });
}
function SwatchEditor({
  q,
  layers,
  onChange,
  previewValue,
  onPreview
}) {
  const [newColor, setNewColor] = useState("#ff0000");
  const [newLabel, setNewLabel] = useState("");
  const [showPalette, setShowPalette] = useState(false);
  const addSwatch = (swatch) => {
    if (q.swatches.some((s) => s.value.toLowerCase() === swatch.value.toLowerCase())) return;
    onChange({
      ...q,
      swatches: [...q.swatches, swatch]
    });
  };
  return /* @__PURE__ */ jsxs("div", {
    style: {
      padding: 16
    },
    children: [/* @__PURE__ */ jsx("label", {
      style: labelSt,
      children: "Title"
    }), /* @__PURE__ */ jsx("input", {
      value: q.name,
      onChange: (e) => onChange({
        ...q,
        name: e.target.value
      }),
      style: inputSt
    }), q.type === "color" && q.displayType !== "none" && q.displayType !== "text-color" && /* @__PURE__ */ jsxs(Fragment, {
      children: [/* @__PURE__ */ jsx("label", {
        style: labelSt,
        children: "Linked Layer"
      }), /* @__PURE__ */ jsx("select", {
        value: q.linkedLayerId ?? "",
        onChange: (e) => onChange({
          ...q,
          linkedLayerId: e.target.value
        }),
        style: inputSt,
        children: layers.filter((l) => l.type === "colorable").map((l) => /* @__PURE__ */ jsx("option", {
          value: l.id,
          children: l.name
        }, l.id))
      })]
    }), q.type === "thumbnail" && /* @__PURE__ */ jsxs(Fragment, {
      children: [/* @__PURE__ */ jsx("label", {
        style: labelSt,
        children: "Linked Layer (optional)"
      }), /* @__PURE__ */ jsxs("select", {
        value: q.linkedLayerId || "",
        onChange: (e) => onChange({
          ...q,
          linkedLayerId: e.target.value || void 0
        }),
        style: inputSt,
        children: [/* @__PURE__ */ jsx("option", {
          value: "",
          children: "— none —"
        }), layers.filter((l) => l.type === "colorable").map((l) => /* @__PURE__ */ jsx("option", {
          value: l.id,
          children: l.name
        }, l.id))]
      })]
    }), /* @__PURE__ */ jsx("label", {
      style: labelSt,
      children: q.type === "thumbnail" ? "Thumbnail Options" : "Color Answers"
    }), q.swatches.length === 0 && /* @__PURE__ */ jsx("p", {
      style: {
        fontSize: 12,
        color: "#9ca3af",
        margin: "4px 0 8px"
      },
      children: "No options yet. Add from palette or add custom below."
    }), /* @__PURE__ */ jsx("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 4,
        marginBottom: 10
      },
      children: q.swatches.map((s, i) => /* @__PURE__ */ jsx(SwatchRow, {
        swatch: s,
        isActive: previewValue === s.value,
        onSelect: () => onPreview(s.value),
        onRemove: () => onChange({
          ...q,
          swatches: q.swatches.filter((_, idx) => idx !== i)
        }),
        onImageUpload: (imageUrl) => onChange({
          ...q,
          swatches: q.swatches.map((sw, idx) => idx === i ? {
            ...sw,
            imageUrl
          } : sw)
        })
      }, i))
    }), /* @__PURE__ */ jsx("button", {
      onClick: () => setShowPalette((p) => !p),
      style: {
        width: "100%",
        padding: "7px 10px",
        border: "1px solid #e5e7eb",
        borderRadius: 6,
        background: "#f9fafb",
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 600,
        color: "#374151",
        textAlign: "left",
        marginBottom: 6
      },
      children: showPalette ? "▲ Hide standard palette" : "▼ Add from standard palette"
    }), showPalette && /* @__PURE__ */ jsx("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: 5,
        marginBottom: 10,
        padding: "8px",
        background: "#f9fafb",
        borderRadius: 6,
        border: "1px solid #e5e7eb"
      },
      children: STANDARD_PALETTE.map((s) => {
        const already = q.swatches.some((sw) => sw.value.toLowerCase() === s.value.toLowerCase());
        return /* @__PURE__ */ jsx("button", {
          title: s.label,
          onClick: () => addSwatch(s),
          disabled: already,
          style: {
            width: "100%",
            aspectRatio: "1",
            borderRadius: "50%",
            background: s.value,
            border: already ? "3px solid #3b82f6" : "2px solid rgba(0,0,0,0.1)",
            cursor: already ? "default" : "pointer",
            opacity: already ? 0.5 : 1,
            outline: "none"
          }
        }, s.value);
      })
    }), /* @__PURE__ */ jsx("label", {
      style: labelSt,
      children: "Custom Color"
    }), /* @__PURE__ */ jsx("div", {
      style: {
        marginBottom: 10
      },
      children: /* @__PURE__ */ jsx(ModernColorPicker, {
        value: newColor,
        onChange: (hex) => setNewColor(hex)
      })
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        display: "flex",
        gap: 6
      },
      children: [/* @__PURE__ */ jsx("div", {
        style: {
          width: 28,
          height: 28,
          borderRadius: 6,
          background: newColor,
          border: "1.5px solid rgba(0,0,0,0.15)",
          flexShrink: 0,
          alignSelf: "center"
        }
      }), /* @__PURE__ */ jsx("input", {
        placeholder: "Label (e.g. Crimson Red)",
        value: newLabel,
        onChange: (e) => setNewLabel(e.target.value),
        onKeyDown: (e) => {
          if (e.key === "Enter" && newLabel.trim()) {
            addSwatch({
              value: newColor,
              label: newLabel.trim()
            });
            setNewLabel("");
          }
        },
        style: {
          flex: 1,
          padding: "6px 10px",
          border: "1px solid #e5e7eb",
          borderRadius: 6,
          fontSize: 13
        }
      }), /* @__PURE__ */ jsx("button", {
        onClick: () => {
          if (!newLabel.trim()) return;
          addSwatch({
            value: newColor,
            label: newLabel.trim()
          });
          setNewLabel("");
        },
        style: {
          padding: "6px 12px",
          background: "#111827",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600
        },
        children: "+"
      })]
    })]
  });
}
const TEXT_CREATE_OPTIONS = [{
  key: "color",
  label: "Color question",
  icon: "A",
  bg: "#f59e0b"
}, {
  key: "font",
  label: "Font question",
  icon: "F",
  bg: "#f59e0b"
}, {
  key: "font-size",
  label: "Font size question",
  icon: "↕",
  bg: "#f59e0b"
}, {
  key: "outline",
  label: "Outline question",
  icon: "Ā",
  bg: "#f59e0b"
}];
function TextEditor({
  q,
  layers,
  onChange,
  onSwitchType,
  onCreateSubQuestion,
  onEditPrintArea
}) {
  const [showInputTypePicker, setShowInputTypePicker] = useState(false);
  const [showDisplayTypePicker, setShowDisplayTypePicker] = useState(false);
  const displayType = q.displayType ?? "text";
  const displayMeta = DISPLAY_TYPE_META[displayType] ?? {
    label: "Text",
    icon: "T"
  };
  const printArea = q.printArea;
  return /* @__PURE__ */ jsxs("div", {
    children: [/* @__PURE__ */ jsxs("div", {
      style: {
        padding: "12px 16px 8px",
        borderBottom: "1px solid #f3f4f6"
      },
      children: [/* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 6
        },
        children: [/* @__PURE__ */ jsx("span", {
          style: {
            width: 22,
            height: 22,
            background: "#10b981",
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            color: "#fff",
            fontWeight: 700,
            flexShrink: 0
          },
          children: "T"
        }), /* @__PURE__ */ jsx("input", {
          value: q.name,
          onChange: (e) => onChange({
            ...q,
            name: e.target.value
          }),
          placeholder: "Title",
          style: {
            flex: 1,
            border: "none",
            outline: "none",
            fontSize: 14,
            fontWeight: 500,
            color: "#111827",
            background: "transparent"
          }
        })]
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          paddingLeft: 30
        },
        children: [/* @__PURE__ */ jsx("label", {
          style: {
            fontSize: 11,
            fontWeight: 600,
            color: "#6b7280",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            display: "block",
            marginBottom: 4
          },
          children: "Placeholder"
        }), /* @__PURE__ */ jsx("input", {
          value: q.defaultText,
          onChange: (e) => onChange({
            ...q,
            defaultText: e.target.value
          }),
          placeholder: "Your text",
          style: inputSt
        })]
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        padding: "12px 16px",
        borderBottom: "1px solid #f3f4f6"
      },
      children: [/* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8
        },
        children: [/* @__PURE__ */ jsx("span", {
          style: {
            fontSize: 13,
            fontWeight: 600,
            color: "#374151"
          },
          children: "Input type"
        }), /* @__PURE__ */ jsx("span", {
          style: {
            fontSize: 13,
            color: "#9ca3af"
          },
          children: "⚙"
        })]
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          position: "relative"
        },
        children: [/* @__PURE__ */ jsxs("button", {
          onClick: () => {
            setShowInputTypePicker((v) => !v);
            setShowDisplayTypePicker(false);
          },
          style: {
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 10px",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            background: "#f9fafb",
            width: "100%",
            cursor: "pointer",
            boxSizing: "border-box"
          },
          children: [/* @__PURE__ */ jsx("span", {
            style: {
              width: 22,
              height: 22,
              background: "#10b981",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              color: "#fff",
              fontWeight: 700,
              flexShrink: 0
            },
            children: "T"
          }), /* @__PURE__ */ jsx("span", {
            style: {
              flex: 1,
              fontSize: 13,
              color: "#374151",
              textAlign: "left"
            },
            children: "Text input"
          }), /* @__PURE__ */ jsx("span", {
            style: {
              fontSize: 10,
              color: "#9ca3af"
            },
            children: "▼"
          })]
        }), showInputTypePicker && /* @__PURE__ */ jsx("div", {
          style: {
            position: "absolute",
            left: 0,
            right: 0,
            top: "calc(100% + 2px)",
            zIndex: 60,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            maxHeight: 280,
            overflowY: "auto"
          },
          children: INPUT_TYPE_CONFIG.map(({
            type,
            label: label2,
            bg,
            icon
          }) => /* @__PURE__ */ jsxs("button", {
            onClick: () => {
              if (type !== "text") onSwitchType == null ? void 0 : onSwitchType(type);
              setShowInputTypePicker(false);
            },
            style: {
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              border: "none",
              background: type === "text" ? "#eff6ff" : "none",
              cursor: "pointer",
              width: "100%",
              boxSizing: "border-box"
            },
            children: [/* @__PURE__ */ jsx("span", {
              style: {
                width: 22,
                height: 22,
                background: bg,
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                color: "#fff",
                fontWeight: 700,
                flexShrink: 0
              },
              children: icon
            }), /* @__PURE__ */ jsx("span", {
              style: {
                flex: 1,
                fontSize: 13,
                color: "#374151",
                textAlign: "left"
              },
              children: label2
            }), type === "text" && /* @__PURE__ */ jsx("span", {
              style: {
                color: "#22c55e",
                fontSize: 12
              },
              children: "✓"
            })]
          }, type))
        })]
      })]
    }), displayType === "text" && /* @__PURE__ */ jsxs("div", {
      style: {
        padding: "12px 16px",
        borderBottom: "1px solid #f3f4f6"
      },
      children: [/* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8
        },
        children: [/* @__PURE__ */ jsx("span", {
          style: {
            fontSize: 13,
            fontWeight: 600,
            color: "#374151"
          },
          children: "Display type"
        }), /* @__PURE__ */ jsx("span", {
          style: {
            fontSize: 13,
            color: "#9ca3af"
          },
          children: "⚙"
        })]
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          position: "relative",
          marginBottom: 12
        },
        children: [/* @__PURE__ */ jsxs("button", {
          onClick: () => {
            setShowDisplayTypePicker((v) => !v);
            setShowInputTypePicker(false);
          },
          style: {
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 10px",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            background: "#f9fafb",
            width: "100%",
            cursor: "pointer",
            boxSizing: "border-box"
          },
          children: [/* @__PURE__ */ jsx("span", {
            style: {
              width: 22,
              height: 22,
              background: "#f59e0b",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              color: "#fff",
              fontWeight: 700,
              flexShrink: 0
            },
            children: displayMeta.icon
          }), /* @__PURE__ */ jsx("span", {
            style: {
              flex: 1,
              fontSize: 13,
              color: "#374151",
              textAlign: "left"
            },
            children: displayMeta.label
          }), /* @__PURE__ */ jsx("span", {
            style: {
              fontSize: 10,
              color: "#9ca3af"
            },
            children: "▼"
          })]
        }), showDisplayTypePicker && /* @__PURE__ */ jsx("div", {
          style: {
            position: "absolute",
            left: 0,
            right: 0,
            top: "calc(100% + 2px)",
            zIndex: 60,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            overflow: "hidden"
          },
          children: DISPLAY_TYPE_MAP["text"].map((dt) => {
            const meta = DISPLAY_TYPE_META[dt] ?? {
              label: dt,
              icon: "?"
            };
            return /* @__PURE__ */ jsxs("button", {
              onClick: () => {
                onChange({
                  ...q,
                  displayType: dt
                });
                setShowDisplayTypePicker(false);
              },
              style: {
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                border: "none",
                background: dt === displayType ? "#eff6ff" : "none",
                cursor: "pointer",
                width: "100%",
                boxSizing: "border-box"
              },
              children: [/* @__PURE__ */ jsx("span", {
                style: {
                  width: 22,
                  height: 22,
                  background: "#f3f4f6",
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  color: "#374151",
                  flexShrink: 0
                },
                children: meta.icon
              }), /* @__PURE__ */ jsxs("span", {
                style: {
                  flex: 1,
                  fontSize: 13,
                  color: "#374151",
                  textAlign: "left"
                },
                children: [meta.label, meta.desc && /* @__PURE__ */ jsx("span", {
                  style: {
                    display: "block",
                    fontSize: 10,
                    color: "#9ca3af"
                  },
                  children: meta.desc
                })]
              }), dt === displayType && /* @__PURE__ */ jsx("span", {
                style: {
                  color: "#22c55e",
                  fontSize: 12
                },
                children: "✓"
              })]
            }, dt);
          })
        })]
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: printArea ? 8 : 0
        },
        children: [/* @__PURE__ */ jsx("span", {
          style: {
            fontSize: 13,
            color: "#9ca3af"
          },
          children: "↳"
        }), /* @__PURE__ */ jsx("span", {
          style: {
            fontSize: 12,
            color: "#6b7280",
            fontWeight: 500
          },
          children: "Apply on"
        }), !printArea && /* @__PURE__ */ jsxs("button", {
          onClick: () => {
            const id = `pa-${Date.now()}`;
            const newPA = {
              id,
              name: `Print area 1`,
              customerEditingView: 1,
              dpi: 300,
              units: "px",
              width: 200,
              height: 80,
              bleedArea: 0,
              showQualityIndicator: false,
              safeAreaWidth: 0,
              safeAreaHeight: 0,
              outlineColor: "#3b82f6",
              showOutline: true,
              visibleViews: [1],
              x: q.position.x,
              y: q.position.y
            };
            onChange({
              ...q,
              printArea: newPA
            });
            onEditPrintArea == null ? void 0 : onEditPrintArea();
          },
          style: {
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "4px 10px",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 12,
            background: "#f9fafb",
            color: "#374151"
          },
          children: [/* @__PURE__ */ jsx("span", {
            children: "🖨"
          }), /* @__PURE__ */ jsx("span", {
            children: "Print area"
          }), /* @__PURE__ */ jsx("span", {
            style: {
              fontWeight: 700
            },
            children: "+"
          })]
        })]
      }), printArea && /* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 10px",
          background: "#f9fafb",
          borderRadius: 6,
          border: "1px solid #e5e7eb"
        },
        children: [/* @__PURE__ */ jsx("span", {
          style: {
            fontSize: 13
          },
          children: "🖨"
        }), /* @__PURE__ */ jsx("span", {
          onClick: () => onEditPrintArea == null ? void 0 : onEditPrintArea(),
          style: {
            flex: 1,
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer"
          },
          children: printArea.name
        }), /* @__PURE__ */ jsx("button", {
          onClick: () => onChange({
            ...q,
            printArea: void 0
          }),
          style: {
            background: "none",
            border: "none",
            color: "#9ca3af",
            cursor: "pointer",
            fontSize: 16,
            padding: 0,
            lineHeight: 1
          },
          children: "×"
        })]
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        padding: "12px 16px",
        borderBottom: "1px solid #f3f4f6"
      },
      children: [/* @__PURE__ */ jsx("span", {
        style: {
          fontSize: 11,
          fontWeight: 700,
          color: "#9ca3af",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          display: "block",
          marginBottom: 10
        },
        children: "Text settings"
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          marginBottom: 8
        },
        children: [/* @__PURE__ */ jsxs("div", {
          children: [/* @__PURE__ */ jsx("label", {
            style: labelSt,
            children: "Font size"
          }), /* @__PURE__ */ jsx("input", {
            type: "number",
            value: q.defaultFontSize,
            onChange: (e) => onChange({
              ...q,
              defaultFontSize: Number(e.target.value)
            }),
            style: inputSt
          })]
        }), /* @__PURE__ */ jsxs("div", {
          children: [/* @__PURE__ */ jsx("label", {
            style: labelSt,
            children: "Rotation °"
          }), /* @__PURE__ */ jsx("input", {
            type: "number",
            value: q.rotation ?? 0,
            onChange: (e) => onChange({
              ...q,
              rotation: Number(e.target.value)
            }),
            style: inputSt
          })]
        })]
      }), /* @__PURE__ */ jsx("label", {
        style: labelSt,
        children: "Font family"
      }), /* @__PURE__ */ jsx("select", {
        value: q.defaultFontFamily,
        onChange: (e) => onChange({
          ...q,
          defaultFontFamily: e.target.value
        }),
        style: {
          ...inputSt,
          marginBottom: 8
        },
        children: ["Arial", "Georgia", "Impact", "Verdana", "Courier New", "Times New Roman"].map((f) => /* @__PURE__ */ jsx("option", {
          value: f,
          children: f
        }, f))
      }), /* @__PURE__ */ jsx("label", {
        style: labelSt,
        children: "Color"
      }), /* @__PURE__ */ jsx("div", {
        style: {
          marginBottom: 8
        },
        children: /* @__PURE__ */ jsx(ModernColorPicker, {
          value: q.defaultColor || "#000000",
          onChange: (hex) => onChange({
            ...q,
            defaultColor: hex
          })
        })
      })]
    }), displayType === "text" && printArea && /* @__PURE__ */ jsxs("div", {
      style: {
        padding: "12px 16px",
        borderBottom: "1px solid #f3f4f6"
      },
      children: [/* @__PURE__ */ jsx("span", {
        style: {
          fontSize: 12,
          color: "#6b7280",
          fontWeight: 600,
          display: "block",
          marginBottom: 8
        },
        children: "Select allowed transforms"
      }), ["move", "resize", "rotate"].map((key) => {
        const icons = {
          move: "✥",
          resize: "↔",
          rotate: "↻"
        };
        const labels = {
          move: "Move",
          resize: "Resize",
          rotate: "Rotate"
        };
        const transforms = q.allowedTransforms ?? {
          move: false,
          resize: false,
          rotate: false
        };
        const isOn = transforms[key];
        return /* @__PURE__ */ jsxs("div", {
          style: {
            display: "flex",
            alignItems: "center",
            padding: "6px 0",
            borderBottom: "1px solid #f9fafb"
          },
          children: [/* @__PURE__ */ jsx("span", {
            style: {
              fontSize: 14,
              marginRight: 8,
              color: "#9ca3af"
            },
            children: icons[key]
          }), /* @__PURE__ */ jsx("span", {
            style: {
              flex: 1,
              fontSize: 13,
              color: "#374151"
            },
            children: labels[key]
          }), /* @__PURE__ */ jsx("button", {
            onClick: () => onChange({
              ...q,
              allowedTransforms: {
                ...q.allowedTransforms ?? {
                  move: false,
                  resize: false,
                  rotate: false
                },
                [key]: !isOn
              }
            }),
            style: {
              width: 36,
              height: 20,
              borderRadius: 10,
              background: isOn ? "#111827" : "#d1d5db",
              border: "none",
              cursor: "pointer",
              position: "relative",
              flexShrink: 0
            },
            children: /* @__PURE__ */ jsx("span", {
              style: {
                position: "absolute",
                top: 2,
                left: isOn ? 18 : 2,
                width: 16,
                height: 16,
                borderRadius: 8,
                background: "#fff",
                transition: "left 0.12s"
              }
            })
          })]
        }, key);
      })]
    }), displayType === "text" && /* @__PURE__ */ jsxs("div", {
      style: {
        padding: "12px 16px",
        borderBottom: "1px solid #f3f4f6"
      },
      children: [/* @__PURE__ */ jsx("span", {
        style: {
          fontSize: 13,
          fontWeight: 600,
          color: "#374151",
          display: "block",
          marginBottom: 8
        },
        children: "Create"
      }), /* @__PURE__ */ jsx("div", {
        style: {
          display: "flex",
          flexDirection: "column",
          gap: 4
        },
        children: TEXT_CREATE_OPTIONS.map(({
          key,
          label: label2,
          icon,
          bg
        }) => /* @__PURE__ */ jsxs("button", {
          onClick: () => onCreateSubQuestion == null ? void 0 : onCreateSubQuestion(key, q.id),
          style: {
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 10px",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            background: "#fafafa",
            cursor: "pointer",
            width: "100%",
            boxSizing: "border-box"
          },
          children: [/* @__PURE__ */ jsx("span", {
            style: {
              width: 22,
              height: 22,
              background: bg,
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              color: "#fff",
              fontWeight: 700,
              flexShrink: 0
            },
            children: icon
          }), /* @__PURE__ */ jsx("span", {
            style: {
              flex: 1,
              fontSize: 13,
              color: "#374151",
              textAlign: "left"
            },
            children: label2
          }), /* @__PURE__ */ jsx("span", {
            style: {
              fontSize: 15,
              color: "#9ca3af",
              fontWeight: 700
            },
            children: "+"
          })]
        }, key))
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        padding: "12px 16px"
      },
      children: [/* @__PURE__ */ jsxs("div", {
        style: {
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          marginBottom: 8
        },
        children: [/* @__PURE__ */ jsxs("div", {
          children: [/* @__PURE__ */ jsx("label", {
            style: labelSt,
            children: "Position X"
          }), /* @__PURE__ */ jsx("input", {
            type: "number",
            value: q.position.x,
            onChange: (e) => onChange({
              ...q,
              position: {
                ...q.position,
                x: Number(e.target.value)
              }
            }),
            style: inputSt
          })]
        }), /* @__PURE__ */ jsxs("div", {
          children: [/* @__PURE__ */ jsx("label", {
            style: labelSt,
            children: "Position Y"
          }), /* @__PURE__ */ jsx("input", {
            type: "number",
            value: q.position.y,
            onChange: (e) => onChange({
              ...q,
              position: {
                ...q.position,
                y: Number(e.target.value)
              }
            }),
            style: inputSt
          })]
        })]
      }), /* @__PURE__ */ jsx("label", {
        style: labelSt,
        children: "Max characters"
      }), /* @__PURE__ */ jsx("input", {
        type: "number",
        min: 1,
        max: 500,
        value: q.maxChars ?? 15,
        onChange: (e) => onChange({
          ...q,
          maxChars: Math.max(1, Number(e.target.value))
        }),
        style: inputSt
      })]
    })]
  });
}
function LogoAnswerDetailPanel({
  answer,
  onDone,
  onChange
}) {
  return /* @__PURE__ */ jsxs("div", {
    children: [/* @__PURE__ */ jsxs("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        borderBottom: "1px solid #e5e7eb"
      },
      children: [/* @__PURE__ */ jsx("span", {
        style: {
          fontSize: 15,
          color: "#9ca3af",
          letterSpacing: 3
        },
        children: "⠿"
      }), /* @__PURE__ */ jsx("button", {
        onClick: onDone,
        style: {
          padding: "5px 18px",
          border: "1px solid #e5e7eb",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 600,
          background: "#fff",
          color: "#374151"
        },
        children: "Done"
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        padding: "12px 16px 8px"
      },
      children: [/* @__PURE__ */ jsx("label", {
        style: labelSt,
        children: "Title"
      }), /* @__PURE__ */ jsx("input", {
        value: answer.label,
        onChange: (e) => onChange({
          ...answer,
          label: e.target.value
        }),
        style: inputSt,
        autoFocus: true
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        padding: "4px 16px 10px",
        borderTop: "1px solid #f3f4f6"
      },
      children: [/* @__PURE__ */ jsx("label", {
        style: {
          fontSize: 13,
          fontWeight: 500,
          color: "#374151",
          display: "block",
          marginBottom: 6
        },
        children: "Image"
      }), /* @__PURE__ */ jsx(ImageUploadSlot, {
        label: "",
        currentUrl: answer.imageUrl ?? null,
        onUploaded: (url) => onChange({
          ...answer,
          imageUrl: url ?? void 0
        })
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        padding: "4px 16px 10px",
        borderTop: "1px solid #f3f4f6"
      },
      children: [/* @__PURE__ */ jsx("label", {
        style: {
          fontSize: 13,
          fontWeight: 500,
          color: "#374151",
          display: "block",
          marginBottom: 6
        },
        children: "Thumbnail"
      }), /* @__PURE__ */ jsx(ImageUploadSlot, {
        label: "",
        currentUrl: answer.thumbnailUrl ?? null,
        onUploaded: (url) => onChange({
          ...answer,
          thumbnailUrl: url ?? void 0
        })
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        borderTop: "1px solid #f3f4f6"
      },
      children: [/* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px"
        },
        children: [/* @__PURE__ */ jsx("label", {
          style: {
            fontSize: 13,
            color: "#374151"
          },
          children: "Description"
        }), /* @__PURE__ */ jsx("input", {
          type: "checkbox",
          checked: answer.description !== void 0,
          onChange: (e) => onChange({
            ...answer,
            description: e.target.checked ? "" : void 0
          }),
          style: {
            width: 16,
            height: 16,
            cursor: "pointer",
            accentColor: "#22c55e"
          }
        })]
      }), answer.description !== void 0 && /* @__PURE__ */ jsx("div", {
        style: {
          padding: "0 16px 10px"
        },
        children: /* @__PURE__ */ jsx("input", {
          value: answer.description,
          onChange: (e) => onChange({
            ...answer,
            description: e.target.value
          }),
          placeholder: "Enter description…",
          style: inputSt
        })
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        borderTop: "1px solid #f3f4f6"
      },
      children: [/* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px"
        },
        children: [/* @__PURE__ */ jsx("label", {
          style: {
            fontSize: 13,
            color: "#374151"
          },
          children: "Production code"
        }), /* @__PURE__ */ jsx("input", {
          type: "checkbox",
          checked: answer.productionCode !== void 0,
          onChange: (e) => onChange({
            ...answer,
            productionCode: e.target.checked ? "" : void 0
          }),
          style: {
            width: 16,
            height: 16,
            cursor: "pointer",
            accentColor: "#22c55e"
          }
        })]
      }), answer.productionCode !== void 0 && /* @__PURE__ */ jsx("div", {
        style: {
          padding: "0 16px 10px"
        },
        children: /* @__PURE__ */ jsx("input", {
          value: answer.productionCode,
          onChange: (e) => onChange({
            ...answer,
            productionCode: e.target.value
          }),
          placeholder: "Enter production code…",
          style: inputSt
        })
      })]
    })]
  });
}
function FileEditor({
  q,
  onChange,
  onSwitchType,
  onEditPrintArea
}) {
  const [showInputDD, setShowInputDD] = useState(false);
  const [showDisplayDD, setShowDisplayDD] = useState(false);
  const [showPAPicker, setShowPAPicker] = useState(false);
  const [paSearch, setPaSearch] = useState("");
  const [editingAnswerIdx, setEditingAnswerIdx] = useState(null);
  const [answerMenu, setAnswerMenu] = useState(null);
  const displayType = q.displayType ?? "none";
  const dtMeta = DISPLAY_TYPE_META[displayType] ?? DISPLAY_TYPE_META.none;
  const dtList = DISPLAY_TYPE_MAP["file"];
  const printAreas = q.printAreas ?? [];
  const transforms = q.allowedTransforms ?? {
    move: true,
    resize: true,
    rotate: false
  };
  const fileTypeMeta = INPUT_TYPE_CONFIG.find((c) => c.type === "file");
  const logoAnswers = q.answers ?? [];
  const addLogoAnswer = () => {
    const newAns = {
      id: `logo-${Date.now()}`,
      label: "Untitled answer"
    };
    const next = [...logoAnswers, newAns];
    onChange({
      ...q,
      answers: next
    });
    setEditingAnswerIdx(next.length - 1);
  };
  const updateLogoAnswer = (idx, updated) => {
    onChange({
      ...q,
      answers: logoAnswers.map((a, i) => i === idx ? updated : a)
    });
  };
  const removeLogoAnswer = (idx) => {
    onChange({
      ...q,
      answers: logoAnswers.filter((_, i) => i !== idx)
    });
    if (editingAnswerIdx === idx) setEditingAnswerIdx(null);
  };
  if (editingAnswerIdx !== null && logoAnswers[editingAnswerIdx]) {
    return /* @__PURE__ */ jsx(LogoAnswerDetailPanel, {
      answer: logoAnswers[editingAnswerIdx],
      onDone: () => setEditingAnswerIdx(null),
      onChange: (updated) => updateLogoAnswer(editingAnswerIdx, updated)
    });
  }
  const addPA = () => {
    const id = `pa-${Date.now()}`;
    const newPA = {
      id,
      name: `Print area ${printAreas.length + 1}`,
      customerEditingView: 1,
      dpi: 300,
      units: "in",
      width: 12,
      height: 16,
      bleedArea: 0,
      showQualityIndicator: true,
      safeAreaWidth: 0,
      safeAreaHeight: 0,
      outlineColor: "#000000",
      showOutline: true,
      visibleViews: [1],
      x: 100,
      y: 100
    };
    onChange({
      ...q,
      printAreas: [...printAreas, newPA]
    });
    setShowPAPicker(false);
    onEditPrintArea(id);
  };
  return /* @__PURE__ */ jsxs("div", {
    children: [/* @__PURE__ */ jsxs("div", {
      style: {
        padding: "12px 16px 8px"
      },
      children: [/* @__PURE__ */ jsx("label", {
        style: labelSt,
        children: "Title"
      }), /* @__PURE__ */ jsx("input", {
        value: q.name,
        onChange: (e) => onChange({
          ...q,
          name: e.target.value
        }),
        style: inputSt
      })]
    }), displayType === "logo" && /* @__PURE__ */ jsxs("div", {
      style: {
        padding: "8px 16px 12px",
        borderBottom: "1px solid #f3f4f6"
      },
      children: [/* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8
        },
        children: [/* @__PURE__ */ jsx("span", {
          style: {
            fontSize: 13,
            fontWeight: 600,
            color: "#374151"
          },
          children: "Logo answers"
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            display: "flex",
            gap: 5
          },
          children: [/* @__PURE__ */ jsx("button", {
            title: "Library",
            style: {
              background: "none",
              border: "1px solid #e5e7eb",
              borderRadius: 5,
              width: 28,
              height: 28,
              cursor: "pointer",
              fontSize: 13,
              color: "#9ca3af",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            },
            children: "⊞"
          }), /* @__PURE__ */ jsx("button", {
            onClick: addLogoAnswer,
            style: {
              width: 28,
              height: 28,
              background: "#111827",
              color: "#fff",
              border: "none",
              borderRadius: 5,
              cursor: "pointer",
              fontSize: 18,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            },
            children: "+"
          })]
        })]
      }), logoAnswers.length === 0 && /* @__PURE__ */ jsxs("div", {
        style: {
          padding: "14px",
          border: "2px dashed #e5e7eb",
          borderRadius: 8,
          textAlign: "center"
        },
        children: [/* @__PURE__ */ jsx("p", {
          style: {
            fontSize: 12,
            color: "#9ca3af",
            margin: "0 0 8px"
          },
          children: "No answers yet."
        }), /* @__PURE__ */ jsx("button", {
          onClick: addLogoAnswer,
          style: {
            padding: "6px 14px",
            background: "#111827",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600
          },
          children: "+ Add first answer"
        })]
      }), logoAnswers.map((ans, idx) => /* @__PURE__ */ jsxs("div", {
        style: {
          position: "relative",
          marginBottom: 5
        },
        onMouseLeave: () => setAnswerMenu(null),
        children: [/* @__PURE__ */ jsxs("div", {
          onClick: () => setEditingAnswerIdx(idx),
          style: {
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 10px",
            border: `1px solid ${editingAnswerIdx === idx ? "#93c5fd" : "#e5e7eb"}`,
            borderRadius: 7,
            cursor: "pointer",
            background: editingAnswerIdx === idx ? "#eff6ff" : "#fafafa"
          },
          children: [/* @__PURE__ */ jsx("span", {
            style: {
              cursor: "grab",
              color: "#d1d5db",
              fontSize: 11,
              userSelect: "none"
            },
            children: "⠿"
          }), ans.thumbnailUrl || ans.imageUrl ? /* @__PURE__ */ jsx("img", {
            src: ans.thumbnailUrl ?? ans.imageUrl,
            alt: ans.label,
            style: {
              width: 28,
              height: 28,
              borderRadius: 4,
              objectFit: "cover",
              border: "1px solid #e5e7eb",
              flexShrink: 0
            }
          }) : /* @__PURE__ */ jsx("span", {
            style: {
              width: 28,
              height: 28,
              borderRadius: 4,
              background: "#f3f4f6",
              border: "1px dashed #d1d5db",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              color: "#9ca3af",
              flexShrink: 0
            },
            children: "⭐"
          }), /* @__PURE__ */ jsx("span", {
            style: {
              flex: 1,
              fontSize: 13,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            },
            children: ans.label || "Untitled answer"
          }), /* @__PURE__ */ jsx("button", {
            onClick: (e) => {
              e.stopPropagation();
              setAnswerMenu(answerMenu === idx ? null : idx);
            },
            style: {
              background: "none",
              border: "none",
              color: "#9ca3af",
              cursor: "pointer",
              fontSize: 16,
              padding: "0 2px",
              flexShrink: 0
            },
            children: "⋮"
          }), /* @__PURE__ */ jsx("span", {
            style: {
              color: "#22c55e",
              fontSize: 14,
              flexShrink: 0
            },
            children: "✓"
          })]
        }), answerMenu === idx && /* @__PURE__ */ jsxs("div", {
          style: {
            position: "absolute",
            right: 8,
            top: "100%",
            zIndex: 50,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            minWidth: 140,
            overflow: "hidden"
          },
          children: [/* @__PURE__ */ jsx("button", {
            onClick: (e) => {
              e.stopPropagation();
              setEditingAnswerIdx(idx);
              setAnswerMenu(null);
            },
            style: {
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "8px 14px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: 13,
              color: "#374151"
            },
            children: "Edit"
          }), /* @__PURE__ */ jsx("button", {
            onClick: (e) => {
              e.stopPropagation();
              removeLogoAnswer(idx);
              setAnswerMenu(null);
            },
            style: {
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "8px 14px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: 13,
              color: "#ef4444"
            },
            children: "Delete"
          })]
        })]
      }, ans.id))]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        padding: "12px 16px",
        borderBottom: "1px solid #f3f4f6"
      },
      children: [/* @__PURE__ */ jsx("label", {
        style: {
          fontSize: 13,
          fontWeight: 600,
          color: "#374151",
          display: "block",
          marginBottom: 8
        },
        children: "Input type"
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          position: "relative"
        },
        children: [/* @__PURE__ */ jsxs("button", {
          onClick: () => {
            setShowInputDD((v) => !v);
            setShowDisplayDD(false);
          },
          style: {
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "7px 10px",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            background: "#f9fafb",
            cursor: "pointer",
            fontSize: 13,
            boxSizing: "border-box"
          },
          children: [/* @__PURE__ */ jsx("span", {
            style: {
              width: 22,
              height: 22,
              background: fileTypeMeta.bg,
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              color: "#fff",
              fontWeight: 700,
              flexShrink: 0
            },
            children: fileTypeMeta.icon
          }), /* @__PURE__ */ jsx("span", {
            style: {
              flex: 1,
              textAlign: "left",
              color: "#374151"
            },
            children: "File uploader"
          }), /* @__PURE__ */ jsx("span", {
            style: {
              fontSize: 10,
              color: "#9ca3af"
            },
            children: "▼"
          })]
        }), showInputDD && /* @__PURE__ */ jsx("div", {
          style: {
            position: "absolute",
            left: 0,
            right: 0,
            top: "calc(100% + 2px)",
            zIndex: 60,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            maxHeight: 280,
            overflowY: "auto"
          },
          children: INPUT_TYPE_CONFIG.map(({
            type,
            label: label2,
            bg,
            icon
          }) => /* @__PURE__ */ jsxs("button", {
            onClick: () => {
              if (type !== "file") onSwitchType(type);
              setShowInputDD(false);
            },
            style: {
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "8px 14px",
              border: "none",
              background: type === "file" ? "#eff6ff" : "none",
              cursor: "pointer",
              fontSize: 13,
              color: "#374151",
              boxSizing: "border-box"
            },
            children: [/* @__PURE__ */ jsx("span", {
              style: {
                width: 22,
                height: 22,
                background: bg,
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                color: "#fff",
                fontWeight: 700,
                flexShrink: 0
              },
              children: icon
            }), /* @__PURE__ */ jsx("span", {
              style: {
                flex: 1,
                textAlign: "left"
              },
              children: label2
            }), type === "file" && /* @__PURE__ */ jsx("span", {
              style: {
                color: "#22c55e",
                fontSize: 12
              },
              children: "✓"
            })]
          }, type))
        })]
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        padding: "12px 16px",
        borderBottom: displayType === "logo" ? "1px solid #f3f4f6" : "none"
      },
      children: [/* @__PURE__ */ jsx("label", {
        style: {
          fontSize: 13,
          fontWeight: 600,
          color: "#374151",
          display: "block",
          marginBottom: 8
        },
        children: "Display type"
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          position: "relative"
        },
        children: [/* @__PURE__ */ jsxs("button", {
          onClick: () => {
            setShowDisplayDD((v) => !v);
            setShowInputDD(false);
          },
          style: {
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "7px 10px",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            background: "#f9fafb",
            cursor: "pointer",
            fontSize: 13,
            boxSizing: "border-box"
          },
          children: [/* @__PURE__ */ jsx("span", {
            style: {
              width: 22,
              height: 22,
              background: "#f3f4f6",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              color: "#374151",
              flexShrink: 0
            },
            children: dtMeta.icon
          }), /* @__PURE__ */ jsx("span", {
            style: {
              flex: 1,
              textAlign: "left",
              color: "#374151"
            },
            children: dtMeta.label
          }), /* @__PURE__ */ jsx("span", {
            style: {
              fontSize: 10,
              color: "#9ca3af"
            },
            children: "▼"
          })]
        }), showDisplayDD && /* @__PURE__ */ jsx("div", {
          style: {
            position: "absolute",
            left: 0,
            right: 0,
            top: "calc(100% + 2px)",
            zIndex: 60,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            overflow: "hidden"
          },
          children: dtList.map((dt) => {
            const meta = DISPLAY_TYPE_META[dt] ?? {
              label: dt,
              icon: "?"
            };
            return /* @__PURE__ */ jsxs("button", {
              onClick: () => {
                onChange({
                  ...q,
                  displayType: dt
                });
                setShowDisplayDD(false);
              },
              style: {
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "8px 14px",
                border: "none",
                background: dt === displayType ? "#eff6ff" : "none",
                cursor: "pointer",
                fontSize: 13,
                color: "#374151",
                boxSizing: "border-box"
              },
              children: [/* @__PURE__ */ jsx("span", {
                style: {
                  width: 22,
                  height: 22,
                  background: "#f3f4f6",
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  color: "#374151",
                  flexShrink: 0
                },
                children: meta.icon
              }), /* @__PURE__ */ jsxs("span", {
                style: {
                  flex: 1,
                  textAlign: "left"
                },
                children: [meta.label, meta.desc && /* @__PURE__ */ jsx("span", {
                  style: {
                    display: "block",
                    fontSize: 10,
                    color: "#9ca3af",
                    fontWeight: 400
                  },
                  children: meta.desc
                })]
              }), dt === displayType && /* @__PURE__ */ jsx("span", {
                style: {
                  color: "#22c55e",
                  fontSize: 12
                },
                children: "✓"
              })]
            }, dt);
          })
        })]
      })]
    }), displayType === "logo" && /* @__PURE__ */ jsxs(Fragment, {
      children: [/* @__PURE__ */ jsxs("div", {
        style: {
          padding: "12px 16px",
          borderBottom: "1px solid #f3f4f6"
        },
        children: [/* @__PURE__ */ jsxs("div", {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 4
          },
          children: [/* @__PURE__ */ jsx("span", {
            style: {
              fontSize: 12,
              color: "#9ca3af"
            },
            children: "↳"
          }), /* @__PURE__ */ jsx("span", {
            style: {
              fontSize: 12,
              color: "#6b7280",
              fontWeight: 500
            },
            children: "Apply on"
          }), /* @__PURE__ */ jsxs("button", {
            onClick: () => {
              setShowPAPicker((v) => !v);
              setPaSearch("");
            },
            style: {
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 10px",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 12,
              background: showPAPicker ? "#eff6ff" : "#f9fafb",
              color: "#374151"
            },
            children: [/* @__PURE__ */ jsx("span", {
              children: "🖨"
            }), /* @__PURE__ */ jsx("span", {
              children: "Print area"
            }), /* @__PURE__ */ jsx("span", {
              style: {
                fontWeight: 700
              },
              children: "+"
            })]
          })]
        }), showPAPicker && /* @__PURE__ */ jsxs("div", {
          style: {
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: "10px 12px",
            marginTop: 8
          },
          children: [/* @__PURE__ */ jsxs("button", {
            onClick: addPA,
            style: {
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "7px 10px",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              background: "#fff",
              cursor: "pointer",
              fontSize: 13,
              color: "#374151",
              marginBottom: 8,
              boxSizing: "border-box"
            },
            children: [/* @__PURE__ */ jsx("span", {
              style: {
                width: 22,
                height: 22,
                background: "#6b7280",
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                color: "#fff",
                fontWeight: 700,
                flexShrink: 0
              },
              children: "🖨"
            }), /* @__PURE__ */ jsx("span", {
              children: "Add print area"
            }), /* @__PURE__ */ jsx("span", {
              style: {
                marginLeft: "auto",
                fontWeight: 700,
                fontSize: 16
              },
              children: "+"
            })]
          }), printAreas.length > 0 && /* @__PURE__ */ jsxs(Fragment, {
            children: [/* @__PURE__ */ jsx("div", {
              style: {
                fontSize: 11,
                color: "#9ca3af",
                textAlign: "center",
                margin: "8px 0",
                borderTop: "1px solid #e5e7eb",
                paddingTop: 8
              },
              children: "or"
            }), /* @__PURE__ */ jsx("input", {
              value: paSearch,
              onChange: (e) => setPaSearch(e.target.value),
              placeholder: "Search print areas…",
              style: {
                ...inputSt,
                marginBottom: 6,
                fontSize: 12
              }
            }), printAreas.filter((pa) => pa.name.toLowerCase().includes(paSearch.toLowerCase())).map((pa) => /* @__PURE__ */ jsxs("button", {
              onClick: () => {
                onEditPrintArea(pa.id);
                setShowPAPicker(false);
              },
              style: {
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "6px 8px",
                border: "none",
                background: "none",
                cursor: "pointer",
                fontSize: 13,
                color: "#374151",
                borderRadius: 5
              },
              children: [/* @__PURE__ */ jsx("span", {
                style: {
                  fontSize: 12
                },
                children: "🖨"
              }), /* @__PURE__ */ jsx("span", {
                style: {
                  flex: 1,
                  textAlign: "left"
                },
                children: pa.name
              })]
            }, pa.id))]
          })]
        }), printAreas.map((pa) => /* @__PURE__ */ jsxs("div", {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 10px",
            background: "#f9fafb",
            borderRadius: 6,
            border: "1px solid #e5e7eb",
            marginTop: 4
          },
          children: [/* @__PURE__ */ jsx("span", {
            style: {
              fontSize: 12
            },
            children: "🖨"
          }), /* @__PURE__ */ jsx("span", {
            onClick: () => onEditPrintArea(pa.id),
            style: {
              flex: 1,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            },
            children: pa.name
          }), /* @__PURE__ */ jsx("button", {
            onClick: () => onChange({
              ...q,
              printAreas: printAreas.filter((p) => p.id !== pa.id)
            }),
            style: {
              background: "none",
              border: "none",
              color: "#9ca3af",
              cursor: "pointer",
              fontSize: 16,
              padding: 0,
              lineHeight: 1,
              flexShrink: 0
            },
            children: "×"
          })]
        }, pa.id))]
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          padding: "12px 16px"
        },
        children: [/* @__PURE__ */ jsx("label", {
          style: {
            fontSize: 13,
            fontWeight: 600,
            color: "#374151",
            display: "block",
            marginBottom: 10
          },
          children: "Select allowed transforms"
        }), /* @__PURE__ */ jsx(ToggleRow, {
          label: "Move",
          checked: transforms.move,
          onChange: (v) => onChange({
            ...q,
            allowedTransforms: {
              ...transforms,
              move: v
            }
          })
        }), /* @__PURE__ */ jsx(ToggleRow, {
          label: "Resize",
          checked: transforms.resize,
          onChange: (v) => onChange({
            ...q,
            allowedTransforms: {
              ...transforms,
              resize: v
            }
          })
        }), /* @__PURE__ */ jsx(ToggleRow, {
          label: "Rotate",
          checked: transforms.rotate,
          onChange: (v) => onChange({
            ...q,
            allowedTransforms: {
              ...transforms,
              rotate: v
            }
          })
        })]
      })]
    })]
  });
}
function PrintAreaPanel({
  area,
  numViews,
  layers,
  onClose,
  onDelete,
  onChange,
  onViewChange
}) {
  var _a;
  const [showClipPicker, setShowClipPicker] = useState(false);
  const toggleView = (v) => {
    const next = area.visibleViews.includes(v) ? area.visibleViews.filter((x) => x !== v) : [...area.visibleViews, v];
    onChange({
      ...area,
      visibleViews: next
    });
  };
  return /* @__PURE__ */ jsxs("div", {
    style: {
      width: 300,
      borderLeft: "1px solid #e5e7eb",
      background: "#fff",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      flexShrink: 0
    },
    children: [/* @__PURE__ */ jsxs("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 14px",
        borderBottom: "1px solid #e5e7eb"
      },
      children: [/* @__PURE__ */ jsx("span", {
        style: {
          fontSize: 15,
          color: "#9ca3af",
          letterSpacing: 3,
          cursor: "grab"
        },
        children: "⠿"
      }), /* @__PURE__ */ jsx("button", {
        onClick: onDelete,
        style: {
          background: "none",
          border: "none",
          color: "#ef4444",
          cursor: "pointer",
          fontSize: 15,
          padding: "2px 4px",
          lineHeight: 1,
          borderRadius: 4
        },
        children: "🗑"
      }), /* @__PURE__ */ jsx("button", {
        onClick: onClose,
        style: {
          marginLeft: "auto",
          padding: "5px 18px",
          border: "1px solid #e5e7eb",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 600,
          background: "#fff",
          color: "#374151"
        },
        children: "Done"
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        flex: 1,
        overflowY: "auto"
      },
      children: [/* @__PURE__ */ jsxs("div", {
        style: {
          padding: "12px 16px 8px"
        },
        children: [/* @__PURE__ */ jsx("label", {
          style: labelSt,
          children: "Title"
        }), /* @__PURE__ */ jsx("input", {
          value: area.name,
          onChange: (e) => onChange({
            ...area,
            name: e.target.value
          }),
          style: inputSt
        })]
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          padding: "4px 16px 10px",
          borderBottom: "1px solid #f3f4f6"
        },
        children: [/* @__PURE__ */ jsx("label", {
          style: labelSt,
          children: "Customer editing view"
        }), /* @__PURE__ */ jsx("select", {
          value: area.customerEditingView,
          onChange: (e) => {
            const v = Number(e.target.value);
            onChange({
              ...area,
              customerEditingView: v
            });
            onViewChange == null ? void 0 : onViewChange(v);
          },
          style: inputSt,
          children: Array.from({
            length: numViews
          }).map((_, i) => /* @__PURE__ */ jsx("option", {
            value: i + 1,
            children: i + 1
          }, i + 1))
        }), /* @__PURE__ */ jsx("p", {
          style: {
            fontSize: 11,
            color: "#9ca3af",
            margin: "4px 0 0",
            lineHeight: 1.5
          },
          children: "The box should be placed approximately on your product."
        }), /* @__PURE__ */ jsx("div", {
          style: {
            marginTop: 8,
            height: 80,
            background: "#f3f4f6",
            borderRadius: 6,
            border: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          },
          children: /* @__PURE__ */ jsx("div", {
            style: {
              width: 40,
              height: 50,
              border: "2px dashed #9ca3af",
              borderRadius: 3,
              background: "#fff"
            }
          })
        })]
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          padding: "10px 16px 4px",
          borderBottom: "1px solid #f3f4f6"
        },
        children: [/* @__PURE__ */ jsxs("div", {
          style: {
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 8
          },
          children: [/* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("label", {
              style: labelSt,
              children: "DPI"
            }), /* @__PURE__ */ jsx("input", {
              type: "number",
              value: area.dpi,
              min: 72,
              max: 1200,
              onChange: (e) => onChange({
                ...area,
                dpi: Number(e.target.value)
              }),
              style: inputSt
            })]
          }), /* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("label", {
              style: labelSt,
              children: "Units"
            }), /* @__PURE__ */ jsxs("select", {
              value: area.units,
              onChange: (e) => onChange({
                ...area,
                units: e.target.value
              }),
              style: inputSt,
              children: [/* @__PURE__ */ jsx("option", {
                value: "in",
                children: "In"
              }), /* @__PURE__ */ jsx("option", {
                value: "cm",
                children: "cm"
              }), /* @__PURE__ */ jsx("option", {
                value: "px",
                children: "px"
              })]
            })]
          })]
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 8
          },
          children: [/* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("label", {
              style: labelSt,
              children: "Width"
            }), /* @__PURE__ */ jsx("input", {
              type: "number",
              value: area.width,
              min: 0.1,
              onChange: (e) => onChange({
                ...area,
                width: Number(e.target.value)
              }),
              style: inputSt
            })]
          }), /* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("label", {
              style: labelSt,
              children: "Height"
            }), /* @__PURE__ */ jsx("input", {
              type: "number",
              value: area.height,
              min: 0.1,
              onChange: (e) => onChange({
                ...area,
                height: Number(e.target.value)
              }),
              style: inputSt
            })]
          })]
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            marginBottom: 8
          },
          children: [/* @__PURE__ */ jsx("label", {
            style: labelSt,
            children: "Rotation °"
          }), /* @__PURE__ */ jsx("input", {
            type: "number",
            value: area.rotation ?? 0,
            min: -360,
            max: 360,
            onChange: (e) => onChange({
              ...area,
              rotation: Number(e.target.value)
            }),
            style: inputSt
          })]
        }), /* @__PURE__ */ jsxs("div", {
          children: [/* @__PURE__ */ jsx("label", {
            style: labelSt,
            children: "Bleed area"
          }), /* @__PURE__ */ jsx("input", {
            type: "number",
            value: area.bleedArea,
            min: 0,
            onChange: (e) => onChange({
              ...area,
              bleedArea: Number(e.target.value)
            }),
            style: inputSt
          })]
        }), /* @__PURE__ */ jsx("p", {
          style: {
            fontSize: 11,
            color: "#9ca3af",
            margin: "4px 0 8px"
          },
          children: "Maximum size: 225MP"
        })]
      }), /* @__PURE__ */ jsx("div", {
        style: {
          padding: "10px 16px",
          borderBottom: "1px solid #f3f4f6"
        },
        children: /* @__PURE__ */ jsx(ToggleRow, {
          label: "Show quality indicator",
          checked: area.showQualityIndicator,
          onChange: (v) => onChange({
            ...area,
            showQualityIndicator: v
          })
        })
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          padding: "10px 16px",
          borderBottom: "1px solid #f3f4f6"
        },
        children: [/* @__PURE__ */ jsx("label", {
          style: labelSt,
          children: "Safe area"
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10
          },
          children: [/* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("label", {
              style: {
                ...labelSt,
                marginTop: 6
              },
              children: "Width"
            }), /* @__PURE__ */ jsx("input", {
              type: "number",
              value: area.safeAreaWidth,
              min: 0,
              onChange: (e) => onChange({
                ...area,
                safeAreaWidth: Number(e.target.value)
              }),
              style: inputSt
            })]
          }), /* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("label", {
              style: {
                ...labelSt,
                marginTop: 6
              },
              children: "Height"
            }), /* @__PURE__ */ jsx("input", {
              type: "number",
              value: area.safeAreaHeight,
              min: 0,
              onChange: (e) => onChange({
                ...area,
                safeAreaHeight: Number(e.target.value)
              }),
              style: inputSt
            })]
          })]
        })]
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          padding: "10px 16px",
          borderBottom: "1px solid #f3f4f6"
        },
        children: [/* @__PURE__ */ jsxs("div", {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8
          },
          children: [/* @__PURE__ */ jsx("label", {
            style: {
              ...labelSt,
              marginBottom: 0,
              marginTop: 0
            },
            children: "Outline color"
          }), /* @__PURE__ */ jsx("input", {
            type: "color",
            value: area.outlineColor,
            onChange: (e) => onChange({
              ...area,
              outlineColor: e.target.value
            }),
            style: {
              width: 28,
              height: 28,
              border: "1px solid #e5e7eb",
              borderRadius: "50%",
              cursor: "pointer",
              padding: 2,
              boxSizing: "border-box"
            }
          })]
        }), /* @__PURE__ */ jsx(ToggleRow, {
          label: "Show outline",
          checked: area.showOutline,
          onChange: (v) => onChange({
            ...area,
            showOutline: v
          })
        })]
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          padding: "10px 16px",
          borderBottom: "1px solid #f3f4f6",
          position: "relative"
        },
        children: [/* @__PURE__ */ jsx("label", {
          style: labelSt,
          children: "Clip to layer"
        }), /* @__PURE__ */ jsxs("button", {
          onClick: () => setShowClipPicker((v) => !v),
          style: {
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "7px 10px",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            background: "#f9fafb",
            cursor: "pointer",
            fontSize: 13,
            boxSizing: "border-box"
          },
          children: [/* @__PURE__ */ jsx("span", {
            style: {
              fontSize: 13
            },
            children: "🔗"
          }), /* @__PURE__ */ jsx("span", {
            style: {
              flex: 1,
              textAlign: "left",
              color: area.clipToLayerId ? "#374151" : "#9ca3af"
            },
            children: area.clipToLayerId ? ((_a = layers.find((l) => l.id === area.clipToLayerId)) == null ? void 0 : _a.name) ?? "Unknown" : "None"
          }), /* @__PURE__ */ jsx("span", {
            style: {
              fontSize: 10,
              color: "#9ca3af"
            },
            children: "▼"
          })]
        }), showClipPicker && /* @__PURE__ */ jsxs("div", {
          style: {
            position: "absolute",
            left: 16,
            right: 16,
            top: "calc(100% - 4px)",
            zIndex: 60,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            overflow: "hidden"
          },
          children: [/* @__PURE__ */ jsx("button", {
            onClick: () => {
              onChange({
                ...area,
                clipToLayerId: void 0
              });
              setShowClipPicker(false);
            },
            style: {
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "8px 14px",
              border: "none",
              background: !area.clipToLayerId ? "#eff6ff" : "none",
              cursor: "pointer",
              fontSize: 13,
              color: "#374151"
            },
            children: "None"
          }), layers.map((l) => /* @__PURE__ */ jsx("button", {
            onClick: () => {
              onChange({
                ...area,
                clipToLayerId: l.id
              });
              setShowClipPicker(false);
            },
            style: {
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "8px 14px",
              border: "none",
              background: area.clipToLayerId === l.id ? "#eff6ff" : "none",
              cursor: "pointer",
              fontSize: 13,
              color: "#374151"
            },
            children: l.name
          }, l.id))]
        })]
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          padding: "10px 16px"
        },
        children: [/* @__PURE__ */ jsx("label", {
          style: labelSt,
          children: "Views"
        }), /* @__PURE__ */ jsx("div", {
          style: {
            display: "flex",
            gap: 6,
            flexWrap: "wrap"
          },
          children: Array.from({
            length: numViews
          }).map((_, i) => {
            const v = i + 1;
            const active = area.visibleViews.includes(v);
            return /* @__PURE__ */ jsx("button", {
              onClick: () => toggleView(v),
              style: {
                width: 32,
                height: 32,
                borderRadius: 6,
                border: active ? "2px solid #3b82f6" : "1px solid #e5e7eb",
                background: active ? "#eff6ff" : "#f9fafb",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: active ? 700 : 400,
                color: active ? "#2563eb" : "#374151"
              },
              children: v
            }, v);
          })
        }), area.visibleViews.map((v) => /* @__PURE__ */ jsxs("p", {
          style: {
            fontSize: 12,
            color: "#6b7280",
            margin: "6px 0 0"
          },
          children: ["Show in view ", v]
        }, v))]
      })]
    })]
  });
}
function DropdownEditor({
  q,
  numViews,
  onChange,
  onEditAnswer,
  editingIdx
}) {
  const displayType = q.displayType ?? "none";
  const isImage = displayType === "image";
  const [newVal, setNewVal] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [answerMenu, setAnswerMenu] = useState(null);
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const addOption = () => {
    if (isImage) {
      const opt = {
        value: `opt-${Date.now()}`,
        label: "Untitled answer",
        viewImages: Array(numViews).fill(null)
      };
      const next = [...q.options, opt];
      onChange({
        ...q,
        options: next
      });
      onEditAnswer(next.length - 1);
    } else {
      if (!newVal.trim() || !newLabel.trim()) return;
      onChange({
        ...q,
        options: [...q.options, {
          value: newVal.trim(),
          label: newLabel.trim()
        }]
      });
      setNewVal("");
      setNewLabel("");
    }
  };
  const removeOption = (i) => onChange({
    ...q,
    options: q.options.filter((_, idx) => idx !== i)
  });
  const handleDragStart = (i) => setDragIdx(i);
  const handleDragOver = (e, i) => {
    e.preventDefault();
    setDragOverIdx(i);
  };
  const handleDrop = (e, toIdx) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === toIdx) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    const next = [...q.options];
    const [removed] = next.splice(dragIdx, 1);
    next.splice(toIdx, 0, removed);
    onChange({
      ...q,
      options: next
    });
    setDragIdx(null);
    setDragOverIdx(null);
  };
  const handleDragEnd = () => {
    setDragIdx(null);
    setDragOverIdx(null);
  };
  if (isImage) {
    return /* @__PURE__ */ jsxs("div", {
      children: [/* @__PURE__ */ jsxs("div", {
        style: {
          padding: "12px 16px 8px"
        },
        children: [/* @__PURE__ */ jsx("label", {
          style: labelSt,
          children: "Title"
        }), /* @__PURE__ */ jsx("input", {
          value: q.name,
          onChange: (e) => onChange({
            ...q,
            name: e.target.value
          }),
          style: inputSt
        })]
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          padding: "8px 16px 12px",
          borderBottom: "1px solid #f3f4f6"
        },
        children: [/* @__PURE__ */ jsxs("div", {
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8
          },
          children: [/* @__PURE__ */ jsx("span", {
            style: {
              fontSize: 13,
              fontWeight: 600,
              color: "#374151"
            },
            children: "Image answers"
          }), /* @__PURE__ */ jsx("button", {
            onClick: addOption,
            style: {
              width: 28,
              height: 28,
              background: "#111827",
              color: "#fff",
              border: "none",
              borderRadius: 5,
              cursor: "pointer",
              fontSize: 18,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            },
            children: "+"
          })]
        }), q.options.length === 0 && /* @__PURE__ */ jsxs("div", {
          style: {
            padding: 14,
            border: "2px dashed #e5e7eb",
            borderRadius: 8,
            textAlign: "center"
          },
          children: [/* @__PURE__ */ jsx("p", {
            style: {
              fontSize: 12,
              color: "#9ca3af",
              margin: "0 0 8px"
            },
            children: "No answers yet."
          }), /* @__PURE__ */ jsx("button", {
            onClick: addOption,
            style: {
              padding: "6px 14px",
              background: "#111827",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600
            },
            children: "+ Add first answer"
          })]
        }), q.options.map((opt, idx) => {
          var _a, _b;
          return /* @__PURE__ */ jsxs("div", {
            draggable: true,
            onDragStart: () => handleDragStart(idx),
            onDragOver: (e) => handleDragOver(e, idx),
            onDrop: (e) => handleDrop(e, idx),
            onDragEnd: handleDragEnd,
            style: {
              position: "relative",
              marginBottom: 5,
              opacity: dragIdx === idx ? 0.35 : 1
            },
            onMouseLeave: () => setAnswerMenu(null),
            children: [/* @__PURE__ */ jsxs("div", {
              onClick: () => onEditAnswer(idx),
              style: {
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 10px",
                border: `1px solid ${dragOverIdx === idx && dragIdx !== idx ? "#0ea5e9" : editingIdx === idx ? "#93c5fd" : "#e5e7eb"}`,
                borderRadius: 7,
                cursor: "pointer",
                background: dragOverIdx === idx && dragIdx !== idx ? "#f0f9ff" : editingIdx === idx ? "#eff6ff" : "#fafafa"
              },
              children: [/* @__PURE__ */ jsx("span", {
                style: {
                  cursor: "grab",
                  color: "#d1d5db",
                  fontSize: 11,
                  userSelect: "none"
                },
                children: "⠿"
              }), opt.thumbnailUrl || ((_a = opt.viewImages) == null ? void 0 : _a.find(Boolean)) ? /* @__PURE__ */ jsx("img", {
                src: opt.thumbnailUrl ?? ((_b = opt.viewImages) == null ? void 0 : _b.find(Boolean)) ?? "",
                alt: opt.label,
                style: {
                  width: 32,
                  height: 32,
                  objectFit: "cover",
                  borderRadius: 4,
                  border: "1px solid #e5e7eb",
                  flexShrink: 0
                }
              }) : /* @__PURE__ */ jsx("span", {
                style: {
                  width: 32,
                  height: 32,
                  background: "#f3f4f6",
                  borderRadius: 4,
                  border: "1px dashed #d1d5db",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  color: "#9ca3af",
                  flexShrink: 0
                },
                children: "🏔"
              }), /* @__PURE__ */ jsx("span", {
                style: {
                  flex: 1,
                  fontSize: 13,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                },
                children: opt.label
              }), editingIdx === idx && /* @__PURE__ */ jsx("span", {
                style: {
                  fontSize: 10,
                  color: "#3b82f6",
                  fontWeight: 700,
                  flexShrink: 0
                },
                children: "● EDITING"
              }), /* @__PURE__ */ jsx("button", {
                onClick: (e) => {
                  e.stopPropagation();
                  setAnswerMenu(answerMenu === idx ? null : idx);
                },
                style: {
                  background: "none",
                  border: "none",
                  color: "#9ca3af",
                  cursor: "pointer",
                  fontSize: 14,
                  padding: "2px 4px",
                  flexShrink: 0
                },
                children: "⋮"
              })]
            }), answerMenu === idx && /* @__PURE__ */ jsxs("div", {
              style: {
                position: "absolute",
                right: 8,
                top: "100%",
                zIndex: 50,
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                minWidth: 140,
                overflow: "hidden"
              },
              children: [/* @__PURE__ */ jsx("button", {
                onClick: (e) => {
                  e.stopPropagation();
                  const copy = {
                    ...opt,
                    value: `opt-${Date.now()}`,
                    label: `${opt.label} (copy)`
                  };
                  onChange({
                    ...q,
                    options: [...q.options.slice(0, idx + 1), copy, ...q.options.slice(idx + 1)]
                  });
                  setAnswerMenu(null);
                },
                style: {
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "9px 14px",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "#374151"
                },
                children: "Duplicate"
              }), /* @__PURE__ */ jsx("button", {
                onClick: (e) => {
                  e.stopPropagation();
                  removeOption(idx);
                  setAnswerMenu(null);
                },
                style: {
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "9px 14px",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "#ef4444"
                },
                children: "Delete"
              })]
            })]
          }, `${opt.value}-${idx}`);
        })]
      }), /* @__PURE__ */ jsx("div", {
        style: {
          padding: "10px 16px",
          borderBottom: "1px solid #f3f4f6"
        },
        children: /* @__PURE__ */ jsx(ToggleRow, {
          label: "Multiple selection",
          checked: q.multipleSelection ?? false,
          onChange: (v) => onChange({
            ...q,
            multipleSelection: v
          })
        })
      })]
    });
  }
  return /* @__PURE__ */ jsxs("div", {
    style: {
      padding: 16
    },
    children: [/* @__PURE__ */ jsx("label", {
      style: labelSt,
      children: "Title"
    }), /* @__PURE__ */ jsx("input", {
      value: q.name,
      onChange: (e) => onChange({
        ...q,
        name: e.target.value
      }),
      style: inputSt
    }), /* @__PURE__ */ jsx("label", {
      style: labelSt,
      children: "Default Value"
    }), /* @__PURE__ */ jsxs("select", {
      value: q.defaultValue || "",
      onChange: (e) => onChange({
        ...q,
        defaultValue: e.target.value
      }),
      style: inputSt,
      children: [/* @__PURE__ */ jsx("option", {
        value: "",
        children: "— none —"
      }), q.options.map((o) => /* @__PURE__ */ jsx("option", {
        value: o.value,
        children: o.label
      }, o.value))]
    }), /* @__PURE__ */ jsx("label", {
      style: labelSt,
      children: "Options"
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 4,
        marginBottom: 8
      },
      children: [q.options.map((o, i) => /* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          gap: 6,
          alignItems: "center",
          padding: "5px 8px",
          background: "#f9fafb",
          borderRadius: 5,
          border: "1px solid #e5e7eb"
        },
        children: [/* @__PURE__ */ jsx("span", {
          style: {
            flex: 1,
            fontSize: 13
          },
          children: o.label
        }), /* @__PURE__ */ jsx("span", {
          style: {
            fontSize: 11,
            color: "#9ca3af"
          },
          children: o.value
        }), /* @__PURE__ */ jsx("button", {
          onClick: () => removeOption(i),
          style: {
            background: "none",
            border: "none",
            color: "#d1d5db",
            cursor: "pointer",
            fontSize: 14
          },
          children: "×"
        })]
      }, i)), q.options.length === 0 && /* @__PURE__ */ jsx("p", {
        style: {
          fontSize: 12,
          color: "#9ca3af",
          margin: "4px 0"
        },
        children: "No options yet."
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr auto",
        gap: 5
      },
      children: [/* @__PURE__ */ jsx("input", {
        placeholder: "value",
        value: newVal,
        onChange: (e) => setNewVal(e.target.value),
        style: inputSt
      }), /* @__PURE__ */ jsx("input", {
        placeholder: "Label",
        value: newLabel,
        onChange: (e) => setNewLabel(e.target.value),
        onKeyDown: (e) => {
          if (e.key === "Enter") addOption();
        },
        style: inputSt
      }), /* @__PURE__ */ jsx("button", {
        onClick: addOption,
        style: {
          padding: "8px 12px",
          background: "#111827",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          fontWeight: 600
        },
        children: "+"
      })]
    })]
  });
}
function RadioEditor({
  q,
  onChange
}) {
  const [newVal, setNewVal] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const addOption = () => {
    if (!newVal.trim() || !newLabel.trim()) return;
    onChange({
      ...q,
      options: [...q.options, {
        value: newVal.trim(),
        label: newLabel.trim()
      }]
    });
    setNewVal("");
    setNewLabel("");
  };
  return /* @__PURE__ */ jsxs("div", {
    style: {
      padding: 16
    },
    children: [/* @__PURE__ */ jsx("label", {
      style: labelSt,
      children: "Title"
    }), /* @__PURE__ */ jsx("input", {
      value: q.name,
      onChange: (e) => onChange({
        ...q,
        name: e.target.value
      }),
      style: inputSt
    }), /* @__PURE__ */ jsx("label", {
      style: labelSt,
      children: "Default Value"
    }), /* @__PURE__ */ jsxs("select", {
      value: q.defaultValue || "",
      onChange: (e) => onChange({
        ...q,
        defaultValue: e.target.value
      }),
      style: inputSt,
      children: [/* @__PURE__ */ jsx("option", {
        value: "",
        children: "— none —"
      }), q.options.map((o) => /* @__PURE__ */ jsx("option", {
        value: o.value,
        children: o.label
      }, o.value))]
    }), /* @__PURE__ */ jsx("label", {
      style: labelSt,
      children: "Options"
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 4,
        marginBottom: 8
      },
      children: [q.options.map((o, i) => /* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          gap: 6,
          alignItems: "center",
          padding: "5px 8px",
          background: "#f9fafb",
          borderRadius: 5,
          border: "1px solid #e5e7eb"
        },
        children: [/* @__PURE__ */ jsx("span", {
          style: {
            flex: 1,
            fontSize: 13
          },
          children: o.label
        }), /* @__PURE__ */ jsx("button", {
          onClick: () => onChange({
            ...q,
            options: q.options.filter((_, idx) => idx !== i)
          }),
          style: {
            background: "none",
            border: "none",
            color: "#d1d5db",
            cursor: "pointer",
            fontSize: 14
          },
          children: "×"
        })]
      }, i)), q.options.length === 0 && /* @__PURE__ */ jsx("p", {
        style: {
          fontSize: 12,
          color: "#9ca3af",
          margin: "4px 0"
        },
        children: "No options yet."
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr auto",
        gap: 5
      },
      children: [/* @__PURE__ */ jsx("input", {
        placeholder: "value",
        value: newVal,
        onChange: (e) => setNewVal(e.target.value),
        style: inputSt
      }), /* @__PURE__ */ jsx("input", {
        placeholder: "Label",
        value: newLabel,
        onChange: (e) => setNewLabel(e.target.value),
        onKeyDown: (e) => {
          if (e.key === "Enter") addOption();
        },
        style: inputSt
      }), /* @__PURE__ */ jsx("button", {
        onClick: addOption,
        style: {
          padding: "8px 12px",
          background: "#111827",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          fontWeight: 600
        },
        children: "+"
      })]
    })]
  });
}
function CheckboxEditor({
  q,
  onChange
}) {
  return /* @__PURE__ */ jsxs("div", {
    style: {
      padding: 16
    },
    children: [/* @__PURE__ */ jsx("label", {
      style: labelSt,
      children: "Title"
    }), /* @__PURE__ */ jsx("input", {
      value: q.name,
      onChange: (e) => onChange({
        ...q,
        name: e.target.value
      }),
      style: inputSt
    }), /* @__PURE__ */ jsx("label", {
      style: labelSt,
      children: "Checked Label"
    }), /* @__PURE__ */ jsx("input", {
      value: q.checkedLabel,
      onChange: (e) => onChange({
        ...q,
        checkedLabel: e.target.value
      }),
      style: inputSt
    }), /* @__PURE__ */ jsx("label", {
      style: labelSt,
      children: "Unchecked Label"
    }), /* @__PURE__ */ jsx("input", {
      value: q.uncheckedLabel,
      onChange: (e) => onChange({
        ...q,
        uncheckedLabel: e.target.value
      }),
      style: inputSt
    }), /* @__PURE__ */ jsxs("label", {
      style: {
        ...labelSt,
        marginTop: 14,
        display: "flex",
        alignItems: "center",
        gap: 8,
        textTransform: "none",
        cursor: "pointer"
      },
      children: [/* @__PURE__ */ jsx("input", {
        type: "checkbox",
        checked: q.defaultChecked,
        onChange: (e) => onChange({
          ...q,
          defaultChecked: e.target.checked
        })
      }), "Default checked"]
    })]
  });
}
function LabelAnswerDetailPanel({
  answer,
  numViews,
  displayType,
  onDone,
  onChange
}) {
  const setViewImage = (vi, url) => {
    const views = [...answer.viewImages ?? Array(numViews).fill(null)];
    views[vi] = url;
    onChange({
      ...answer,
      viewImages: views,
      imageUrl: views[0] ?? void 0
    });
  };
  return /* @__PURE__ */ jsxs("div", {
    children: [/* @__PURE__ */ jsxs("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        borderBottom: "1px solid #e5e7eb"
      },
      children: [/* @__PURE__ */ jsx("span", {
        style: {
          fontSize: 15,
          color: "#9ca3af",
          letterSpacing: 3
        },
        children: "⠿"
      }), /* @__PURE__ */ jsx("button", {
        onClick: onDone,
        style: {
          padding: "5px 18px",
          border: "1px solid #e5e7eb",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 600,
          background: "#fff",
          color: "#374151"
        },
        children: "Done"
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        padding: "12px 16px 8px"
      },
      children: [/* @__PURE__ */ jsx("label", {
        style: labelSt,
        children: "Title"
      }), /* @__PURE__ */ jsx("input", {
        value: answer.label,
        onChange: (e) => onChange({
          ...answer,
          label: e.target.value
        }),
        style: inputSt,
        autoFocus: true
      })]
    }), numViews > 1 ? /* @__PURE__ */ jsx("div", {
      style: {
        padding: "4px 16px 10px",
        borderTop: "1px solid #f3f4f6"
      },
      children: Array.from({
        length: numViews
      }).map((_, vi) => {
        var _a;
        return /* @__PURE__ */ jsxs("div", {
          style: {
            marginBottom: 10
          },
          children: [/* @__PURE__ */ jsxs("label", {
            style: {
              fontSize: 13,
              fontWeight: 500,
              color: "#374151",
              display: "block",
              marginBottom: 6
            },
            children: ["View ", vi + 1]
          }), /* @__PURE__ */ jsx(ImageUploadSlot, {
            label: "",
            currentUrl: ((_a = answer.viewImages) == null ? void 0 : _a[vi]) ?? null,
            onUploaded: (url) => setViewImage(vi, url)
          })]
        }, vi);
      })
    }) : /* @__PURE__ */ jsxs("div", {
      style: {
        padding: "4px 16px 10px",
        borderTop: "1px solid #f3f4f6"
      },
      children: [/* @__PURE__ */ jsx("label", {
        style: {
          fontSize: 13,
          fontWeight: 500,
          color: "#374151",
          display: "block",
          marginBottom: 6
        },
        children: "Thumbnail"
      }), /* @__PURE__ */ jsx(ImageUploadSlot, {
        label: "",
        currentUrl: answer.imageUrl ?? null,
        onUploaded: (url) => onChange({
          ...answer,
          imageUrl: url ?? void 0
        })
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        borderTop: "1px solid #f3f4f6"
      },
      children: [/* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px"
        },
        children: [/* @__PURE__ */ jsx("label", {
          style: {
            fontSize: 13,
            color: "#374151"
          },
          children: "Description"
        }), /* @__PURE__ */ jsx("input", {
          type: "checkbox",
          checked: answer.description !== void 0,
          onChange: (e) => onChange({
            ...answer,
            description: e.target.checked ? "" : void 0
          }),
          style: {
            width: 16,
            height: 16,
            cursor: "pointer",
            accentColor: "#22c55e"
          }
        })]
      }), answer.description !== void 0 && /* @__PURE__ */ jsx("div", {
        style: {
          padding: "0 16px 10px"
        },
        children: /* @__PURE__ */ jsx("input", {
          value: answer.description,
          onChange: (e) => onChange({
            ...answer,
            description: e.target.value
          }),
          placeholder: "Enter description…",
          style: inputSt
        })
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        borderTop: "1px solid #f3f4f6"
      },
      children: [/* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px"
        },
        children: [/* @__PURE__ */ jsx("label", {
          style: {
            fontSize: 13,
            color: "#374151"
          },
          children: "Production code"
        }), /* @__PURE__ */ jsx("input", {
          type: "checkbox",
          checked: answer.productionCode !== void 0,
          onChange: (e) => onChange({
            ...answer,
            productionCode: e.target.checked ? "" : void 0
          }),
          style: {
            width: 16,
            height: 16,
            cursor: "pointer",
            accentColor: "#22c55e"
          }
        })]
      }), answer.productionCode !== void 0 && /* @__PURE__ */ jsx("div", {
        style: {
          padding: "0 16px 10px"
        },
        children: /* @__PURE__ */ jsx("input", {
          value: answer.productionCode,
          onChange: (e) => onChange({
            ...answer,
            productionCode: e.target.value
          }),
          placeholder: "Enter production code…",
          style: inputSt
        })
      })]
    })]
  });
}
function LabelEditor({
  q,
  numViews,
  onChange,
  onSwitchType,
  onAnswerPreview
}) {
  const [editingIdx, setEditingIdx] = useState(null);
  const [answerMenu, setAnswerMenu] = useState(null);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showDisplayDropdown, setShowDisplayDropdown] = useState(false);
  const answers = q.answers ?? [];
  const displayType = q.displayType ?? "none";
  const displayMeta = DISPLAY_TYPE_META[displayType] ?? {
    label: "None",
    icon: "⊘"
  };
  const displayTypes = DISPLAY_TYPE_MAP["label"];
  const openAnswerDetail = (idx) => {
    var _a;
    setEditingIdx(idx);
    const ans = answers[idx];
    onAnswerPreview == null ? void 0 : onAnswerPreview(((_a = ans == null ? void 0 : ans.viewImages) == null ? void 0 : _a.some(Boolean)) ? ans.viewImages : null);
  };
  const closeAnswerDetail = () => {
    setEditingIdx(null);
    onAnswerPreview == null ? void 0 : onAnswerPreview(null);
  };
  const addAnswer = () => {
    const newAns = numViews > 1 ? {
      value: `ans-${Date.now()}`,
      label: "Untitled answer",
      viewImages: Array(numViews).fill(null)
    } : {
      value: `ans-${Date.now()}`,
      label: "Untitled answer"
    };
    const next = [...answers, newAns];
    onChange({
      ...q,
      answers: next
    });
    openAnswerDetail(next.length - 1);
  };
  const updateAnswer = (idx, updated) => {
    var _a;
    onChange({
      ...q,
      answers: answers.map((a, i) => i === idx ? updated : a)
    });
    onAnswerPreview == null ? void 0 : onAnswerPreview(((_a = updated.viewImages) == null ? void 0 : _a.some(Boolean)) ? updated.viewImages : null);
  };
  const removeAnswer = (idx) => {
    onChange({
      ...q,
      answers: answers.filter((_, i) => i !== idx)
    });
    if (editingIdx === idx) setEditingIdx(null);
  };
  if (editingIdx !== null && answers[editingIdx]) {
    return /* @__PURE__ */ jsx(LabelAnswerDetailPanel, {
      answer: answers[editingIdx],
      numViews,
      displayType,
      onDone: closeAnswerDetail,
      onChange: (updated) => updateAnswer(editingIdx, updated)
    });
  }
  return /* @__PURE__ */ jsxs("div", {
    children: [/* @__PURE__ */ jsxs("div", {
      style: {
        padding: "12px 16px 8px"
      },
      children: [/* @__PURE__ */ jsx("label", {
        style: labelSt,
        children: "Title"
      }), /* @__PURE__ */ jsx("input", {
        value: q.name,
        onChange: (e) => onChange({
          ...q,
          name: e.target.value
        }),
        style: inputSt
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        padding: "8px 16px 12px",
        borderBottom: "1px solid #f3f4f6"
      },
      children: [/* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8
        },
        children: [/* @__PURE__ */ jsx("span", {
          style: {
            fontSize: 13,
            fontWeight: 600,
            color: "#374151"
          },
          children: "Value answers"
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            display: "flex",
            gap: 5
          },
          children: [/* @__PURE__ */ jsx("button", {
            title: "Library",
            style: {
              background: "none",
              border: "1px solid #e5e7eb",
              borderRadius: 5,
              width: 28,
              height: 28,
              cursor: "pointer",
              fontSize: 13,
              color: "#9ca3af",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            },
            children: "⊞"
          }), /* @__PURE__ */ jsx("button", {
            onClick: addAnswer,
            style: {
              width: 28,
              height: 28,
              background: "#111827",
              color: "#fff",
              border: "none",
              borderRadius: 5,
              cursor: "pointer",
              fontSize: 18,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            },
            children: "+"
          })]
        })]
      }), answers.length === 0 && /* @__PURE__ */ jsxs("div", {
        style: {
          padding: "12px",
          border: "2px dashed #e5e7eb",
          borderRadius: 8,
          textAlign: "center"
        },
        children: [/* @__PURE__ */ jsx("p", {
          style: {
            fontSize: 12,
            color: "#9ca3af",
            margin: "0 0 8px"
          },
          children: "No answers yet."
        }), /* @__PURE__ */ jsx("button", {
          onClick: addAnswer,
          style: {
            padding: "5px 12px",
            background: "#111827",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600
          },
          children: "+ Add first answer"
        })]
      }), answers.map((a, idx) => {
        var _a, _b;
        return /* @__PURE__ */ jsxs("div", {
          style: {
            position: "relative",
            marginBottom: 5
          },
          onMouseLeave: () => setAnswerMenu(null),
          children: [/* @__PURE__ */ jsxs("div", {
            onClick: () => openAnswerDetail(idx),
            style: {
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 10px",
              border: "1px solid #e5e7eb",
              borderRadius: 7,
              cursor: "pointer",
              background: "#fafafa"
            },
            children: [a.imageUrl ?? ((_a = a.viewImages) == null ? void 0 : _a.find(Boolean)) ? /* @__PURE__ */ jsx("img", {
              src: a.imageUrl ?? ((_b = a.viewImages) == null ? void 0 : _b.find(Boolean)),
              alt: "",
              style: {
                width: 22,
                height: 22,
                borderRadius: 4,
                objectFit: "cover",
                flexShrink: 0
              }
            }) : /* @__PURE__ */ jsx("span", {
              style: {
                width: 22,
                height: 22,
                borderRadius: 4,
                background: "#e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9,
                color: "#9ca3af",
                flexShrink: 0
              },
              children: "img"
            }), /* @__PURE__ */ jsx("span", {
              style: {
                flex: 1,
                fontSize: 13
              },
              children: a.label || "Untitled answer"
            }), /* @__PURE__ */ jsx("button", {
              onClick: (e) => {
                e.stopPropagation();
                setAnswerMenu(answerMenu === idx ? null : idx);
              },
              style: {
                background: "none",
                border: "none",
                color: "#9ca3af",
                cursor: "pointer",
                fontSize: 16,
                padding: "0 2px",
                flexShrink: 0
              },
              children: "⋮"
            }), /* @__PURE__ */ jsx("span", {
              style: {
                color: "#22c55e",
                fontSize: 14,
                flexShrink: 0
              },
              children: "✓"
            })]
          }), answerMenu === idx && /* @__PURE__ */ jsxs("div", {
            style: {
              position: "absolute",
              right: 8,
              top: "100%",
              zIndex: 50,
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              minWidth: 140,
              overflow: "hidden"
            },
            children: [/* @__PURE__ */ jsx("button", {
              onClick: (e) => {
                e.stopPropagation();
                openAnswerDetail(idx);
                setAnswerMenu(null);
              },
              style: {
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 14px",
                border: "none",
                background: "none",
                cursor: "pointer",
                fontSize: 13,
                color: "#374151"
              },
              children: "Edit"
            }), /* @__PURE__ */ jsx("button", {
              onClick: (e) => {
                e.stopPropagation();
                removeAnswer(idx);
                setAnswerMenu(null);
              },
              style: {
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 14px",
                border: "none",
                background: "none",
                cursor: "pointer",
                fontSize: 13,
                color: "#ef4444"
              },
              children: "Delete"
            })]
          })]
        }, a.value);
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        padding: "12px 16px",
        borderBottom: "1px solid #f3f4f6",
        position: "relative"
      },
      children: [/* @__PURE__ */ jsx("label", {
        style: {
          fontSize: 13,
          fontWeight: 600,
          color: "#374151",
          display: "block",
          marginBottom: 8
        },
        children: "Input type"
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          position: "relative"
        },
        onMouseLeave: () => setShowTypeDropdown(false),
        children: [/* @__PURE__ */ jsxs("button", {
          onClick: () => setShowTypeDropdown(!showTypeDropdown),
          style: {
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "7px 10px",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            background: "#f9fafb",
            cursor: "pointer",
            fontSize: 13,
            boxSizing: "border-box"
          },
          children: [/* @__PURE__ */ jsx("span", {
            style: {
              width: 22,
              height: 22,
              background: "#22c55e",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              color: "#fff",
              fontWeight: 700,
              flexShrink: 0
            },
            children: "⊟"
          }), /* @__PURE__ */ jsx("span", {
            style: {
              flex: 1,
              textAlign: "left",
              color: "#374151"
            },
            children: "Label"
          }), /* @__PURE__ */ jsx("span", {
            style: {
              fontSize: 10,
              color: "#9ca3af"
            },
            children: "▼"
          })]
        }), showTypeDropdown && /* @__PURE__ */ jsx("div", {
          style: {
            position: "absolute",
            left: 0,
            right: 0,
            top: "calc(100% + 2px)",
            zIndex: 50,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            overflow: "hidden"
          },
          children: INPUT_TYPE_CONFIG.map(({
            type,
            label: label2,
            bg,
            icon
          }) => /* @__PURE__ */ jsxs("button", {
            onClick: () => {
              if (type !== "label") onSwitchType == null ? void 0 : onSwitchType(type);
              setShowTypeDropdown(false);
            },
            style: {
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "8px 14px",
              border: "none",
              background: type === "label" ? "#eff6ff" : "none",
              cursor: "pointer",
              fontSize: 13,
              color: "#374151"
            },
            children: [/* @__PURE__ */ jsx("span", {
              style: {
                width: 22,
                height: 22,
                background: bg,
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                color: "#fff",
                fontWeight: 700,
                flexShrink: 0
              },
              children: icon
            }), label2]
          }, type))
        })]
      }), /* @__PURE__ */ jsx("div", {
        style: {
          marginTop: 10
        },
        children: /* @__PURE__ */ jsx(ToggleRow, {
          label: "Multiple selection",
          checked: q.multipleSelection ?? false,
          onChange: (v) => onChange({
            ...q,
            multipleSelection: v
          })
        })
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        padding: "12px 16px"
      },
      children: [/* @__PURE__ */ jsx("label", {
        style: {
          fontSize: 13,
          fontWeight: 600,
          color: "#374151",
          display: "block",
          marginBottom: 8
        },
        children: "Display type"
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          position: "relative"
        },
        onMouseLeave: () => setShowDisplayDropdown(false),
        children: [/* @__PURE__ */ jsxs("button", {
          onClick: () => setShowDisplayDropdown(!showDisplayDropdown),
          style: {
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "7px 10px",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            background: "#f9fafb",
            cursor: "pointer",
            fontSize: 13,
            boxSizing: "border-box"
          },
          children: [/* @__PURE__ */ jsx("span", {
            style: {
              width: 22,
              height: 22,
              background: "#f3f4f6",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              color: "#6b7280",
              fontWeight: 700,
              flexShrink: 0
            },
            children: displayMeta.icon
          }), /* @__PURE__ */ jsx("span", {
            style: {
              flex: 1,
              textAlign: "left",
              color: "#374151"
            },
            children: displayMeta.label
          }), /* @__PURE__ */ jsx("span", {
            style: {
              fontSize: 10,
              color: "#9ca3af"
            },
            children: "▼"
          })]
        }), showDisplayDropdown && /* @__PURE__ */ jsx("div", {
          style: {
            position: "absolute",
            left: 0,
            right: 0,
            top: "calc(100% + 2px)",
            zIndex: 50,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            overflow: "hidden"
          },
          children: displayTypes.map((dt) => {
            const meta = DISPLAY_TYPE_META[dt] ?? {
              label: dt,
              icon: "?"
            };
            return /* @__PURE__ */ jsxs("button", {
              onClick: () => {
                onChange({
                  ...q,
                  displayType: dt
                });
                setShowDisplayDropdown(false);
              },
              style: {
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "8px 14px",
                border: "none",
                background: dt === displayType ? "#eff6ff" : "none",
                cursor: "pointer",
                fontSize: 13,
                color: "#374151"
              },
              children: [/* @__PURE__ */ jsx("span", {
                style: {
                  width: 22,
                  height: 22,
                  background: dt === displayType ? "#0ea5e9" : "#f3f4f6",
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  color: dt === displayType ? "#fff" : "#6b7280",
                  fontWeight: 700,
                  flexShrink: 0
                },
                children: meta.icon
              }), /* @__PURE__ */ jsxs("span", {
                style: {
                  textAlign: "left"
                },
                children: [meta.label, meta.desc && /* @__PURE__ */ jsx("span", {
                  style: {
                    display: "block",
                    fontSize: 10,
                    color: "#9ca3af",
                    fontWeight: 400
                  },
                  children: meta.desc
                })]
              })]
            }, dt);
          })
        })]
      })]
    })]
  });
}
function GroupEditorComp({
  q,
  questions,
  onChange,
  onAddElement
}) {
  return /* @__PURE__ */ jsxs("div", {
    children: [/* @__PURE__ */ jsxs("div", {
      style: {
        padding: "12px 16px 8px"
      },
      children: [/* @__PURE__ */ jsx("label", {
        style: labelSt,
        children: "Title"
      }), /* @__PURE__ */ jsx("input", {
        value: q.name,
        onChange: (e) => onChange({
          ...q,
          name: e.target.value
        }),
        style: inputSt
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        padding: "8px 16px 16px",
        borderTop: "1px solid #f3f4f6"
      },
      children: [/* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10
        },
        children: [/* @__PURE__ */ jsx("span", {
          style: {
            fontSize: 13,
            fontWeight: 600,
            color: "#374151"
          },
          children: "Group elements"
        }), /* @__PURE__ */ jsx("button", {
          onClick: onAddElement,
          style: {
            width: 26,
            height: 26,
            background: "#111827",
            color: "#fff",
            border: "none",
            borderRadius: 5,
            cursor: "pointer",
            fontSize: 16,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          },
          children: "+"
        })]
      }), q.childIds.length === 0 ? /* @__PURE__ */ jsx("p", {
        style: {
          fontSize: 12,
          color: "#9ca3af",
          margin: "20px 0",
          textAlign: "center"
        },
        children: "There are no elements, yet."
      }) : /* @__PURE__ */ jsx("div", {
        style: {
          display: "flex",
          flexDirection: "column",
          gap: 5
        },
        children: q.childIds.map((childId) => {
          const child = questions.find((oq) => oq.id === childId);
          if (!child) return null;
          return /* @__PURE__ */ jsxs("div", {
            style: {
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 10px",
              background: "#f9fafb",
              borderRadius: 7,
              border: "1px solid #e5e7eb"
            },
            children: [/* @__PURE__ */ jsx("span", {
              style: {
                display: "flex",
                alignItems: "center",
                width: 18,
                flexShrink: 0
              },
              children: getQuestionIcon(child)
            }), /* @__PURE__ */ jsx("span", {
              style: {
                flex: 1,
                fontSize: 13,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              },
              children: child.name
            }), /* @__PURE__ */ jsx("button", {
              onClick: () => onChange({
                ...q,
                childIds: q.childIds.filter((id) => id !== childId)
              }),
              style: {
                background: "none",
                border: "none",
                color: "#d1d5db",
                cursor: "pointer",
                fontSize: 16,
                padding: 0,
                flexShrink: 0,
                lineHeight: 1
              },
              children: "×"
            })]
          }, childId);
        })
      })]
    })]
  });
}
function ViewUploadSlot({
  viewIndex,
  currentUrl,
  onUploaded,
  onUrlChange
}) {
  var _a, _b;
  const fetcher = useFetcher();
  const uploading = fetcher.state !== "idle";
  useEffect(() => {
    var _a2;
    if ((_a2 = fetcher.data) == null ? void 0 : _a2.url) onUploaded(fetcher.data.url);
  }, [(_a = fetcher.data) == null ? void 0 : _a.url]);
  const handleFile = (e) => {
    var _a2;
    const file = (_a2 = e.target.files) == null ? void 0 : _a2[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fetcher.submit(fd, {
      method: "post",
      action: "/app/upload-image",
      encType: "multipart/form-data"
    });
    e.target.value = "";
  };
  return /* @__PURE__ */ jsxs("div", {
    style: {
      marginBottom: 10,
      padding: 10,
      border: "1px solid #e5e7eb",
      borderRadius: 8,
      background: "#fafafa"
    },
    children: [/* @__PURE__ */ jsxs("div", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        color: "#6b7280",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        marginBottom: 6
      },
      children: ["View ", viewIndex + 1, viewIndex === 0 && /* @__PURE__ */ jsx("span", {
        style: {
          fontWeight: 400,
          textTransform: "none",
          color: "#9ca3af",
          marginLeft: 4
        },
        children: "(primary)"
      })]
    }), currentUrl && /* @__PURE__ */ jsx("div", {
      style: {
        marginBottom: 6,
        textAlign: "center"
      },
      children: /* @__PURE__ */ jsx("img", {
        src: currentUrl,
        alt: `View ${viewIndex + 1}`,
        style: {
          maxWidth: "100%",
          maxHeight: 80,
          objectFit: "contain",
          borderRadius: 4
        },
        onError: (e) => {
          e.target.style.display = "none";
        }
      })
    }), /* @__PURE__ */ jsxs("label", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "7px 10px",
        border: "2px dashed #d1d5db",
        borderRadius: 6,
        cursor: uploading ? "wait" : "pointer",
        color: "#6b7280",
        fontSize: 12,
        background: uploading ? "#f3f4f6" : "#fff",
        marginBottom: 4
      },
      children: [/* @__PURE__ */ jsx("span", {
        children: uploading ? "⏳" : "📁"
      }), /* @__PURE__ */ jsx("span", {
        children: uploading ? "Uploading…" : currentUrl ? "Replace image" : "Upload PNG"
      }), /* @__PURE__ */ jsx("input", {
        type: "file",
        accept: "image/png,image/jpeg,image/webp",
        style: {
          display: "none"
        },
        onChange: handleFile,
        disabled: uploading
      })]
    }), ((_b = fetcher.data) == null ? void 0 : _b.error) && /* @__PURE__ */ jsx("p", {
      style: {
        color: "#ef4444",
        fontSize: 11,
        margin: "2px 0"
      },
      children: fetcher.data.error
    }), /* @__PURE__ */ jsx("input", {
      value: currentUrl,
      onChange: (e) => onUrlChange(e.target.value),
      placeholder: "or paste URL…",
      style: {
        ...inputSt,
        fontSize: 11,
        padding: "5px 8px"
      }
    })]
  });
}
const GOOGLE_FONTS = ["Roboto", "Open Sans", "Lato", "Montserrat", "Poppins", "Inter", "Raleway", "Oswald", "Merriweather", "Playfair Display", "Ubuntu", "Nunito", "Noto Sans JP", "Source Sans Pro", "PT Sans", "Google Sans"];
const LAYER_ANSWER_LABELS = {
  image: "Image answers",
  color: "Color answers",
  logo: "Logo answers",
  font: "Font answers",
  "font-size": "Font size answers",
  "text-color": "Color answers",
  "text-outline": "Outline answers"
};
const LAYER_APPLY_ON = {
  color: {
    label: "Image question",
    targetDT: "image"
  },
  logo: {
    label: "Print area",
    targetDT: "text"
  },
  text: {
    label: "Print area",
    targetDT: "text"
  },
  font: {
    label: "Text question",
    targetDT: "text"
  },
  "font-size": {
    label: "Text question",
    targetDT: "text"
  },
  "text-color": {
    label: "Text question",
    targetDT: "text"
  },
  "text-outline": {
    label: "Text question",
    targetDT: "text"
  }
};
const LAYER_CREATE = {
  image: [{
    type: "color",
    label: "Color question"
  }],
  text: [{
    type: "text-color",
    label: "Color question"
  }, {
    type: "font",
    label: "Font question"
  }, {
    type: "font-size",
    label: "Font size question"
  }, {
    type: "text-outline",
    label: "Outline question"
  }]
};
function DraggableAnswerList({
  answers,
  onReorder,
  onEdit,
  renderPreview
}) {
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const drop = (toIdx) => {
    if (dragIdx === null || dragIdx === toIdx) {
      setDragIdx(null);
      setOverIdx(null);
      return;
    }
    const next = [...answers];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(toIdx, 0, moved);
    onReorder(next);
    setDragIdx(null);
    setOverIdx(null);
  };
  return /* @__PURE__ */ jsx("div", {
    children: answers.map((a, idx) => /* @__PURE__ */ jsxs("div", {
      draggable: true,
      onDragStart: () => setDragIdx(idx),
      onDragOver: (e) => {
        e.preventDefault();
        setOverIdx(idx);
      },
      onDrop: () => drop(idx),
      onDragEnd: () => {
        setDragIdx(null);
        setOverIdx(null);
      },
      onClick: () => onEdit(idx),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 8px",
        border: overIdx === idx ? "1.5px solid #3b82f6" : "1px solid #e5e7eb",
        borderRadius: 7,
        cursor: "pointer",
        background: overIdx === idx ? "#eff6ff" : "#fafafa",
        marginBottom: 5,
        opacity: dragIdx === idx ? 0.4 : 1,
        userSelect: "none"
      },
      children: [/* @__PURE__ */ jsx("span", {
        style: {
          color: "#d1d5db",
          cursor: "grab",
          fontSize: 14,
          flexShrink: 0
        },
        title: "Drag to reorder",
        children: "⠿"
      }), renderPreview(a), /* @__PURE__ */ jsx("span", {
        style: {
          flex: 1,
          fontSize: 13,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        },
        children: a.label || "Untitled answer"
      }), /* @__PURE__ */ jsx("span", {
        style: {
          color: "#22c55e",
          fontSize: 12,
          flexShrink: 0
        },
        children: "✓"
      })]
    }, a.id))
  });
}
function FontPicker({
  value,
  onChange
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("google");
  return /* @__PURE__ */ jsxs("div", {
    style: {
      padding: "4px 16px 10px"
    },
    children: [/* @__PURE__ */ jsx("label", {
      style: labelSt,
      children: "Fonts"
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        position: "relative"
      },
      children: [/* @__PURE__ */ jsxs("button", {
        onClick: () => setOpen(!open),
        style: {
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          padding: "7px 10px",
          border: "1px solid #3b82f6",
          borderRadius: 6,
          background: "#fff",
          cursor: "pointer",
          fontSize: 13,
          boxSizing: "border-box"
        },
        children: [/* @__PURE__ */ jsx("span", {
          style: {
            flex: 1,
            textAlign: "left"
          },
          children: value
        }), /* @__PURE__ */ jsx("span", {
          style: {
            fontSize: 10,
            color: "#9ca3af"
          },
          children: "▼"
        })]
      }), open && /* @__PURE__ */ jsxs("div", {
        style: {
          position: "absolute",
          left: 0,
          right: 0,
          top: "calc(100% + 2px)",
          zIndex: 100,
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          overflow: "hidden"
        },
        children: [/* @__PURE__ */ jsx("div", {
          style: {
            display: "flex",
            borderBottom: "1px solid #e5e7eb"
          },
          children: ["google", "custom"].map((t) => /* @__PURE__ */ jsx("button", {
            onClick: () => setTab(t),
            style: {
              flex: 1,
              padding: "8px 14px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: tab === t ? 600 : 400,
              color: tab === t ? "#2563eb" : "#6b7280",
              borderBottom: tab === t ? "2px solid #2563eb" : "2px solid transparent"
            },
            children: t === "google" ? "Google" : "My fonts"
          }, t))
        }), tab === "google" ? /* @__PURE__ */ jsx("div", {
          style: {
            maxHeight: 200,
            overflowY: "auto"
          },
          children: GOOGLE_FONTS.map((font) => /* @__PURE__ */ jsx("button", {
            onClick: () => {
              onChange(font);
              setOpen(false);
            },
            style: {
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "8px 14px",
              border: "none",
              background: font === value ? "#eff6ff" : "none",
              cursor: "pointer",
              fontSize: 13,
              color: font === value ? "#2563eb" : "#374151",
              fontWeight: font === value ? 600 : 400
            },
            children: font
          }, font))
        }) : /* @__PURE__ */ jsxs("div", {
          style: {
            padding: "12px 14px"
          },
          children: [/* @__PURE__ */ jsxs("label", {
            style: {
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 10px",
              border: "1.5px dashed #d1d5db",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 13,
              color: "#374151"
            },
            children: [/* @__PURE__ */ jsx("span", {
              children: "↑"
            }), " Upload your font", /* @__PURE__ */ jsx("input", {
              type: "file",
              accept: ".ttf,.otf,.woff,.woff2",
              style: {
                display: "none"
              }
            })]
          }), /* @__PURE__ */ jsx("p", {
            style: {
              fontSize: 12,
              color: "#9ca3af",
              margin: "8px 0 0",
              textAlign: "center"
            },
            children: "No options"
          })]
        })]
      })]
    })]
  });
}
function LayerAnswerDetail({
  answer,
  displayType,
  numViews,
  onBack,
  onChange
}) {
  var _a;
  const isColor = displayType === "color" || displayType === "text-color";
  const setViewImage = (vi, url) => {
    const views = [...answer.viewImages ?? Array(numViews).fill(null)];
    views[vi] = url;
    onChange({
      ...answer,
      viewImages: views,
      imageUrl: views[0] ?? void 0
    });
  };
  return /* @__PURE__ */ jsxs("div", {
    children: [/* @__PURE__ */ jsxs("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        borderBottom: "1px solid #e5e7eb"
      },
      children: [/* @__PURE__ */ jsx("span", {
        style: {
          fontSize: 15,
          color: "#9ca3af",
          letterSpacing: 3
        },
        children: "⠿"
      }), /* @__PURE__ */ jsx("button", {
        onClick: onBack,
        style: {
          padding: "5px 18px",
          border: "1px solid #e5e7eb",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 600,
          background: "#fff",
          color: "#374151"
        },
        children: "Done"
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        padding: "12px 16px 8px"
      },
      children: [/* @__PURE__ */ jsx("label", {
        style: labelSt,
        children: "Title"
      }), /* @__PURE__ */ jsx("input", {
        value: answer.label,
        onChange: (e) => onChange({
          ...answer,
          label: e.target.value
        }),
        style: inputSt
      })]
    }), displayType === "image" && /* @__PURE__ */ jsx("div", {
      style: {
        padding: "4px 16px 4px"
      },
      children: Array.from({
        length: numViews
      }).map((_, vi) => {
        var _a2;
        return /* @__PURE__ */ jsxs("div", {
          style: {
            marginBottom: 10
          },
          children: [/* @__PURE__ */ jsxs("label", {
            style: {
              fontSize: 13,
              fontWeight: 500,
              color: "#374151",
              display: "block",
              marginBottom: 6
            },
            children: ["View ", vi + 1]
          }), /* @__PURE__ */ jsx(ImageUploadSlot, {
            label: "",
            currentUrl: ((_a2 = answer.viewImages) == null ? void 0 : _a2[vi]) ?? null,
            onUploaded: (url) => setViewImage(vi, url)
          })]
        }, vi);
      })
    }), isColor && /* @__PURE__ */ jsxs("div", {
      style: {
        padding: "4px 16px 12px"
      },
      children: [/* @__PURE__ */ jsx("label", {
        style: labelSt,
        children: "Color"
      }), /* @__PURE__ */ jsx(ModernColorPicker, {
        value: ((_a = answer.value) == null ? void 0 : _a.startsWith("#")) ? answer.value : "#000000",
        onChange: (hex) => onChange({
          ...answer,
          value: hex
        })
      })]
    }), displayType === "font" && /* @__PURE__ */ jsx(FontPicker, {
      value: answer.value || "Roboto",
      onChange: (font) => onChange({
        ...answer,
        value: font
      })
    }), displayType === "font-size" && /* @__PURE__ */ jsxs("div", {
      style: {
        padding: "4px 16px 10px"
      },
      children: [/* @__PURE__ */ jsxs("label", {
        style: labelSt,
        children: ["Width in view", /* @__PURE__ */ jsx("span", {
          style: {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 18,
            height: 18,
            borderRadius: 3,
            background: "#e5e7eb",
            fontSize: 10,
            marginLeft: 5,
            fontWeight: 700
          },
          children: "1"
        })]
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 6
        },
        children: [/* @__PURE__ */ jsx("input", {
          type: "number",
          value: answer.fontSize ?? 32,
          min: 1,
          max: 500,
          onChange: (e) => onChange({
            ...answer,
            fontSize: Number(e.target.value),
            value: `${e.target.value}px`
          }),
          style: {
            flex: 1,
            padding: "7px 10px",
            border: "1px solid #3b82f6",
            borderRadius: 6,
            fontSize: 13
          }
        }), /* @__PURE__ */ jsx("span", {
          style: {
            fontSize: 12,
            color: "#6b7280"
          },
          children: "px"
        })]
      })]
    }), displayType === "text-outline" && /* @__PURE__ */ jsxs("div", {
      style: {
        padding: "4px 16px 10px"
      },
      children: [/* @__PURE__ */ jsx("label", {
        style: labelSt,
        children: "Outline size (px)"
      }), /* @__PURE__ */ jsx("input", {
        type: "number",
        value: answer.outlineSize ?? 0,
        min: 0,
        max: 50,
        onChange: (e) => onChange({
          ...answer,
          outlineSize: Number(e.target.value),
          value: `${e.target.value}px`
        }),
        style: inputSt
      }), /* @__PURE__ */ jsx("label", {
        style: {
          ...labelSt,
          marginTop: 10
        },
        children: "Outline color"
      }), /* @__PURE__ */ jsx(ModernColorPicker, {
        value: answer.outlineColor || "#9CA3AF",
        onChange: (hex) => onChange({
          ...answer,
          outlineColor: hex
        })
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        padding: "4px 16px 10px",
        borderTop: "1px solid #f3f4f6"
      },
      children: [/* @__PURE__ */ jsx("label", {
        style: {
          fontSize: 13,
          fontWeight: 500,
          color: "#374151",
          display: "block",
          marginBottom: 6
        },
        children: "Thumbnail"
      }), /* @__PURE__ */ jsx(ImageUploadSlot, {
        label: "",
        currentUrl: answer.thumbnailUrl ?? null,
        onUploaded: (url) => onChange({
          ...answer,
          thumbnailUrl: url ?? void 0
        })
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        borderTop: "1px solid #f3f4f6"
      },
      children: [/* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px"
        },
        children: [/* @__PURE__ */ jsx("label", {
          style: {
            fontSize: 13,
            color: "#374151"
          },
          children: "Description"
        }), /* @__PURE__ */ jsx("input", {
          type: "checkbox",
          checked: answer.description !== void 0,
          onChange: (e) => onChange({
            ...answer,
            description: e.target.checked ? "" : void 0
          }),
          style: {
            width: 16,
            height: 16,
            cursor: "pointer",
            accentColor: "#22c55e"
          }
        })]
      }), answer.description !== void 0 && /* @__PURE__ */ jsx("div", {
        style: {
          padding: "0 16px 10px"
        },
        children: /* @__PURE__ */ jsx("input", {
          value: answer.description,
          onChange: (e) => onChange({
            ...answer,
            description: e.target.value
          }),
          placeholder: "Enter description…",
          style: inputSt
        })
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        borderTop: "1px solid #f3f4f6"
      },
      children: [/* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px"
        },
        children: [/* @__PURE__ */ jsx("label", {
          style: {
            fontSize: 13,
            color: "#374151"
          },
          children: "Production code"
        }), /* @__PURE__ */ jsx("input", {
          type: "checkbox",
          checked: answer.productionCode !== void 0,
          onChange: (e) => onChange({
            ...answer,
            productionCode: e.target.checked ? "" : void 0
          }),
          style: {
            width: 16,
            height: 16,
            cursor: "pointer",
            accentColor: "#22c55e"
          }
        })]
      }), answer.productionCode !== void 0 && /* @__PURE__ */ jsx("div", {
        style: {
          padding: "0 16px 10px"
        },
        children: /* @__PURE__ */ jsx("input", {
          value: answer.productionCode,
          onChange: (e) => onChange({
            ...answer,
            productionCode: e.target.value
          }),
          placeholder: "Enter production code…",
          style: inputSt
        })
      })]
    })]
  });
}
function NewLayerEditor({
  layer,
  layers,
  questions,
  numViews,
  onChange,
  onConvertToQuestion,
  onCreateAndLinkQuestion,
  onAddLinkedLayer,
  onAnswerPreview
}) {
  var _a, _b;
  const [editingIdx, setEditingIdx] = useState(null);
  const setEditingIdxAndNotify = (idx) => {
    setEditingIdx(idx);
    onAnswerPreview == null ? void 0 : onAnswerPreview(idx);
  };
  const [showInputTypeDropdown, setShowInputTypeDropdown] = useState(false);
  const [showApplyPicker, setShowApplyPicker] = useState(false);
  const [applySearch, setApplySearch] = useState("");
  const dt = layer.displayType;
  const answers = layer.answers ?? [];
  const displayMeta = DISPLAY_TYPE_META[dt] ?? {
    label: dt,
    icon: "?"
  };
  const answerLabel = LAYER_ANSWER_LABELS[dt];
  const applyConf = LAYER_APPLY_ON[dt];
  const createItems = LAYER_CREATE[dt] ?? [];
  const hasAnswers = dt !== "text";
  const iconBg = LAYER_DISPLAY_COLORS[dt] ?? "#6b7280";
  const appliedIds = layer.applyOn ?? [];
  const applyTargetInputType = applyConf ? applyConf.targetDT === "image" ? "thumbnail" : applyConf.targetDT === "text" ? "text" : null : null;
  const matchingQuestions = applyConf ? questions.filter((q) => applyConf.targetDT === "image" ? q.type === "thumbnail" : applyConf.targetDT === "text" ? q.type === "text" : false) : [];
  const filteredApplyQuestions = matchingQuestions.filter((q) => !appliedIds.includes(q.id) && q.name.toLowerCase().includes(applySearch.toLowerCase()));
  const addAnswer = () => {
    const id = `ans-${Date.now()}`;
    const defaults = {};
    if (dt === "color" || dt === "text-color") defaults.value = "#000000";
    if (dt === "font") defaults.value = "Roboto";
    if (dt === "font-size") {
      defaults.fontSize = 32;
      defaults.value = "32px";
    }
    if (dt === "text-outline") {
      defaults.outlineSize = 0;
      defaults.outlineColor = "#9ca3af";
      defaults.value = "0px";
    }
    if (dt === "image") defaults.viewImages = Array(numViews).fill(null);
    const newAns = {
      id,
      label: "Untitled answer",
      ...defaults
    };
    const next = [...answers, newAns];
    onChange({
      ...layer,
      answers: next
    });
    setEditingIdxAndNotify(next.length - 1);
  };
  const renderPreview = (a) => {
    if (dt === "image") return a.imageUrl ? /* @__PURE__ */ jsx("img", {
      src: a.imageUrl,
      alt: "",
      style: {
        width: 22,
        height: 22,
        borderRadius: 4,
        objectFit: "cover",
        flexShrink: 0
      }
    }) : /* @__PURE__ */ jsx("span", {
      style: {
        width: 22,
        height: 22,
        background: "#e5e7eb",
        borderRadius: 4,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 9,
        color: "#9ca3af",
        flexShrink: 0
      },
      children: "img"
    });
    if (dt === "logo") return /* @__PURE__ */ jsx("span", {
      style: {
        width: 22,
        height: 22,
        background: "#fef3c7",
        borderRadius: 4,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        flexShrink: 0
      },
      children: "⭐"
    });
    if (dt === "color" || dt === "text-color") return /* @__PURE__ */ jsx("span", {
      style: {
        width: 18,
        height: 18,
        borderRadius: "50%",
        background: a.value || "#000",
        border: "1px solid rgba(0,0,0,0.15)",
        flexShrink: 0,
        display: "inline-block"
      }
    });
    if (dt === "font") return /* @__PURE__ */ jsx("span", {
      style: {
        fontSize: 10,
        fontWeight: 700,
        color: "#374151",
        flexShrink: 0,
        minWidth: 22,
        textAlign: "center"
      },
      children: "aA"
    });
    if (dt === "font-size") return /* @__PURE__ */ jsx("span", {
      style: {
        fontSize: 10,
        color: "#6b7280",
        flexShrink: 0,
        minWidth: 32
      },
      children: a.value ?? "32px"
    });
    if (dt === "text-outline") return /* @__PURE__ */ jsx("span", {
      style: {
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: a.outlineColor || "#9ca3af",
        border: "2px solid rgba(0,0,0,0.1)",
        flexShrink: 0,
        display: "inline-block"
      }
    });
    return null;
  };
  if (editingIdx !== null && answers[editingIdx]) {
    return /* @__PURE__ */ jsx(LayerAnswerDetail, {
      answer: answers[editingIdx],
      displayType: dt,
      numViews,
      onBack: () => setEditingIdxAndNotify(null),
      onChange: (updated) => onChange({
        ...layer,
        answers: answers.map((a, i) => i === editingIdx ? updated : a)
      })
    });
  }
  return /* @__PURE__ */ jsxs("div", {
    children: [/* @__PURE__ */ jsxs("div", {
      style: {
        padding: "12px 16px 8px"
      },
      children: [/* @__PURE__ */ jsx("label", {
        style: labelSt,
        children: "Title"
      }), /* @__PURE__ */ jsx("input", {
        value: layer.name,
        onChange: (e) => onChange({
          ...layer,
          name: e.target.value
        }),
        style: inputSt
      })]
    }), hasAnswers && /* @__PURE__ */ jsxs("div", {
      style: {
        padding: "8px 16px 12px",
        borderBottom: "1px solid #f3f4f6"
      },
      children: [/* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8
        },
        children: [/* @__PURE__ */ jsx("span", {
          style: {
            fontSize: 13,
            fontWeight: 600,
            color: "#374151"
          },
          children: answerLabel
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            display: "flex",
            gap: 5
          },
          children: [/* @__PURE__ */ jsx("button", {
            title: "Library",
            style: {
              background: "none",
              border: "1px solid #e5e7eb",
              borderRadius: 5,
              width: 28,
              height: 28,
              cursor: "pointer",
              fontSize: 13,
              color: "#9ca3af",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            },
            children: "⊞"
          }), /* @__PURE__ */ jsx("button", {
            onClick: addAnswer,
            style: {
              width: 28,
              height: 28,
              background: "#111827",
              color: "#fff",
              border: "none",
              borderRadius: 5,
              cursor: "pointer",
              fontSize: 18,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            },
            children: "+"
          })]
        })]
      }), answers.length === 0 && /* @__PURE__ */ jsx("div", {
        style: {
          padding: "12px",
          border: "2px dashed #e5e7eb",
          borderRadius: 8,
          textAlign: "center"
        },
        children: /* @__PURE__ */ jsx("button", {
          onClick: addAnswer,
          style: {
            padding: "5px 12px",
            background: "#111827",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600
          },
          children: "+ Add first answer"
        })
      }), /* @__PURE__ */ jsx(DraggableAnswerList, {
        answers,
        onReorder: (next) => onChange({
          ...layer,
          answers: next
        }),
        onEdit: (idx) => setEditingIdxAndNotify(idx),
        renderPreview
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        padding: "12px 16px",
        borderBottom: "1px solid #f3f4f6"
      },
      children: [/* @__PURE__ */ jsx("label", {
        style: {
          fontSize: 13,
          fontWeight: 600,
          color: "#374151",
          display: "block",
          marginBottom: 8
        },
        children: "Input type"
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          position: "relative"
        },
        children: [/* @__PURE__ */ jsxs("button", {
          onClick: () => setShowInputTypeDropdown(!showInputTypeDropdown),
          style: {
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "7px 10px",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            background: "#f9fafb",
            cursor: "pointer",
            fontSize: 13,
            boxSizing: "border-box"
          },
          children: [/* @__PURE__ */ jsx("span", {
            style: {
              width: 22,
              height: 22,
              background: "#f3f4f6",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              color: "#6b7280",
              flexShrink: 0
            },
            children: "⊘"
          }), /* @__PURE__ */ jsx("span", {
            style: {
              flex: 1,
              textAlign: "left",
              color: "#374151"
            },
            children: "None"
          }), /* @__PURE__ */ jsx("span", {
            style: {
              fontSize: 10,
              color: "#9ca3af"
            },
            children: "▼"
          })]
        }), showInputTypeDropdown && /* @__PURE__ */ jsxs("div", {
          style: {
            position: "absolute",
            left: 0,
            right: 0,
            top: "calc(100% + 2px)",
            zIndex: 60,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            boxShadow: "0 4px 20px rgba(0,0,0,0.14)",
            maxHeight: 280,
            overflowY: "auto"
          },
          children: [/* @__PURE__ */ jsxs("button", {
            onClick: () => setShowInputTypeDropdown(false),
            style: {
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "8px 14px",
              border: "none",
              background: "#eff6ff",
              cursor: "pointer",
              fontSize: 13,
              color: "#374151",
              borderBottom: "1px solid #f3f4f6"
            },
            children: [/* @__PURE__ */ jsx("span", {
              style: {
                width: 22,
                height: 22,
                background: "#f3f4f6",
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                color: "#6b7280",
                flexShrink: 0
              },
              children: "⊘"
            }), "None ", /* @__PURE__ */ jsx("span", {
              style: {
                marginLeft: 4,
                fontSize: 11,
                color: "#9ca3af"
              },
              children: "(Behind the scene)"
            }), /* @__PURE__ */ jsx("span", {
              style: {
                marginLeft: "auto",
                color: "#22c55e",
                fontSize: 12
              },
              children: "✓"
            })]
          }), INPUT_TYPE_CONFIG.map(({
            type,
            label: label2,
            bg,
            icon
          }) => /* @__PURE__ */ jsxs("button", {
            onClick: () => {
              onConvertToQuestion(layer, type);
              setShowInputTypeDropdown(false);
            },
            style: {
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "8px 14px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: 13,
              color: "#374151"
            },
            children: [/* @__PURE__ */ jsx("span", {
              style: {
                width: 22,
                height: 22,
                background: bg,
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                color: "#fff",
                fontWeight: 700,
                flexShrink: 0
              },
              children: icon
            }), /* @__PURE__ */ jsx("span", {
              style: {
                flex: 1,
                textAlign: "left"
              },
              children: label2
            }), /* @__PURE__ */ jsx("span", {
              style: {
                fontSize: 10,
                color: "#9ca3af"
              },
              children: "→ Questions"
            })]
          }, type))]
        })]
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        padding: "12px 16px"
      },
      children: [/* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8
        },
        children: [/* @__PURE__ */ jsx("label", {
          style: {
            fontSize: 13,
            fontWeight: 600,
            color: "#374151"
          },
          children: "Display type"
        }), /* @__PURE__ */ jsx("span", {
          style: {
            fontSize: 14,
            color: "#9ca3af"
          },
          children: "⚙"
        })]
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 10px",
          border: "1px solid #e5e7eb",
          borderRadius: 6,
          background: "#f9fafb",
          marginBottom: applyConf ? 12 : 0
        },
        children: [/* @__PURE__ */ jsx("span", {
          style: {
            width: 22,
            height: 22,
            background: iconBg,
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            color: "#fff",
            fontWeight: 700,
            flexShrink: 0
          },
          children: displayMeta.icon
        }), /* @__PURE__ */ jsx("span", {
          style: {
            flex: 1,
            fontSize: 13,
            color: "#374151"
          },
          children: displayMeta.label
        }), /* @__PURE__ */ jsx("span", {
          style: {
            fontSize: 10,
            color: "#9ca3af"
          },
          children: "▼"
        })]
      }), applyConf && /* @__PURE__ */ jsxs("div", {
        style: {
          marginBottom: createItems.length > 0 ? 14 : 0
        },
        children: [/* @__PURE__ */ jsxs("div", {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: showApplyPicker ? 0 : 4
          },
          children: [/* @__PURE__ */ jsx("span", {
            style: {
              fontSize: 13,
              color: "#9ca3af"
            },
            children: "↳"
          }), /* @__PURE__ */ jsx("span", {
            style: {
              fontSize: 12,
              color: "#6b7280",
              fontWeight: 500
            },
            children: "Apply on"
          }), /* @__PURE__ */ jsxs("button", {
            onClick: () => {
              setShowApplyPicker((v) => !v);
              setApplySearch("");
            },
            style: {
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 10px",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 12,
              background: showApplyPicker ? "#eff6ff" : "#f9fafb",
              color: "#374151"
            },
            children: [/* @__PURE__ */ jsx("span", {
              style: {
                width: 18,
                height: 18,
                background: LAYER_DISPLAY_COLORS[applyConf.targetDT] ?? "#6b7280",
                borderRadius: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                color: "#fff",
                flexShrink: 0
              },
              children: ((_a = DISPLAY_TYPE_META[applyConf.targetDT]) == null ? void 0 : _a.icon) ?? "?"
            }), /* @__PURE__ */ jsx("span", {
              children: applyConf.label
            }), /* @__PURE__ */ jsx("span", {
              style: {
                fontWeight: 700
              },
              children: "+"
            })]
          })]
        }), showApplyPicker && /* @__PURE__ */ jsxs("div", {
          style: {
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: "10px 12px",
            marginTop: 8,
            marginBottom: 8
          },
          children: [applyTargetInputType && /* @__PURE__ */ jsxs("button", {
            onClick: () => {
              onCreateAndLinkQuestion(applyTargetInputType, layer.id);
              setShowApplyPicker(false);
            },
            style: {
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "7px 10px",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              background: "#fff",
              cursor: "pointer",
              fontSize: 13,
              color: "#374151",
              marginBottom: 8,
              boxSizing: "border-box"
            },
            children: [/* @__PURE__ */ jsx("span", {
              style: {
                width: 22,
                height: 22,
                background: LAYER_DISPLAY_COLORS[applyConf.targetDT] ?? "#6b7280",
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                color: "#fff",
                fontWeight: 700,
                flexShrink: 0
              },
              children: ((_b = DISPLAY_TYPE_META[applyConf.targetDT]) == null ? void 0 : _b.icon) ?? "+"
            }), /* @__PURE__ */ jsxs("span", {
              children: ["New ", applyConf.label]
            }), /* @__PURE__ */ jsx("span", {
              style: {
                marginLeft: "auto",
                fontWeight: 700,
                fontSize: 16
              },
              children: "+"
            })]
          }), matchingQuestions.length > 0 && /* @__PURE__ */ jsxs(Fragment, {
            children: [/* @__PURE__ */ jsx("div", {
              style: {
                fontSize: 11,
                color: "#9ca3af",
                textAlign: "center",
                margin: "8px 0",
                borderTop: "1px solid #e5e7eb",
                paddingTop: 8
              },
              children: "or select existing"
            }), /* @__PURE__ */ jsx("input", {
              value: applySearch,
              onChange: (e) => setApplySearch(e.target.value),
              placeholder: "Search questions...",
              style: {
                ...inputSt,
                marginBottom: 6,
                fontSize: 12
              }
            }), /* @__PURE__ */ jsxs("div", {
              style: {
                maxHeight: 140,
                overflowY: "auto"
              },
              children: [filteredApplyQuestions.length === 0 && /* @__PURE__ */ jsx("p", {
                style: {
                  fontSize: 12,
                  color: "#9ca3af",
                  margin: "4px 0",
                  textAlign: "center"
                },
                children: "No matching questions"
              }), filteredApplyQuestions.map((q) => {
                var _a2;
                return /* @__PURE__ */ jsxs("button", {
                  onClick: () => {
                    onChange({
                      ...layer,
                      applyOn: [...appliedIds, q.id]
                    });
                    setShowApplyPicker(false);
                  },
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "6px 8px",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    color: "#374151",
                    borderRadius: 5
                  },
                  children: [/* @__PURE__ */ jsx("span", {
                    style: {
                      width: 20,
                      height: 20,
                      background: LAYER_DISPLAY_COLORS[applyConf.targetDT] ?? "#6b7280",
                      borderRadius: 3,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      color: "#fff",
                      flexShrink: 0
                    },
                    children: ((_a2 = DISPLAY_TYPE_META[applyConf.targetDT]) == null ? void 0 : _a2.icon) ?? "?"
                  }), /* @__PURE__ */ jsx("span", {
                    style: {
                      flex: 1,
                      textAlign: "left",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    },
                    children: q.name
                  })]
                }, q.id);
              })]
            })]
          })]
        }), appliedIds.map((qid) => {
          const linkedQ = questions.find((q) => q.id === qid);
          if (!linkedQ) return null;
          const qTypeMeta = INPUT_TYPE_CONFIG.find((c) => c.type === linkedQ.type);
          return /* @__PURE__ */ jsxs("div", {
            style: {
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 10px",
              background: "#f9fafb",
              borderRadius: 6,
              border: "1px solid #e5e7eb",
              marginBottom: 4,
              marginTop: 4
            },
            children: [/* @__PURE__ */ jsx("span", {
              style: {
                width: 18,
                height: 18,
                background: (qTypeMeta == null ? void 0 : qTypeMeta.bg) ?? "#6b7280",
                borderRadius: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                color: "#fff",
                flexShrink: 0
              },
              children: (qTypeMeta == null ? void 0 : qTypeMeta.icon) ?? "?"
            }), /* @__PURE__ */ jsx("span", {
              style: {
                flex: 1,
                fontSize: 12,
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              },
              children: linkedQ.name
            }), /* @__PURE__ */ jsx("button", {
              onClick: () => onChange({
                ...layer,
                applyOn: appliedIds.filter((id) => id !== qid)
              }),
              style: {
                background: "none",
                border: "none",
                color: "#9ca3af",
                cursor: "pointer",
                fontSize: 16,
                padding: 0,
                lineHeight: 1,
                flexShrink: 0
              },
              children: "×"
            })]
          }, qid);
        })]
      }), createItems.length > 0 && /* @__PURE__ */ jsxs("div", {
        style: {
          borderTop: applyConf ? "1px solid #f3f4f6" : "none",
          paddingTop: applyConf ? 12 : 0
        },
        children: [/* @__PURE__ */ jsx("span", {
          style: {
            fontSize: 11,
            fontWeight: 700,
            color: "#374151",
            display: "block",
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          },
          children: "Create"
        }), createItems.map(({
          type,
          label: label2
        }) => {
          const meta = DISPLAY_TYPE_META[type] ?? {
            icon: "?"
          };
          const linkedQ = type === "color" ? questions.find((q) => q.type === "thumbnail" && q.displayType === "color" && (q.applyOn ?? []).includes(layer.id)) : null;
          return /* @__PURE__ */ jsxs("div", {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "7px 10px",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              marginBottom: 5,
              background: linkedQ ? "#f0fdf4" : "#fafafa"
            },
            children: [/* @__PURE__ */ jsxs("div", {
              style: {
                display: "flex",
                alignItems: "center",
                gap: 8
              },
              children: [/* @__PURE__ */ jsx("span", {
                style: {
                  width: 22,
                  height: 22,
                  background: LAYER_DISPLAY_COLORS[type] ?? "#6b7280",
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  color: "#fff",
                  fontWeight: 700,
                  flexShrink: 0
                },
                children: meta.icon
              }), /* @__PURE__ */ jsx("span", {
                style: {
                  fontSize: 13,
                  color: "#374151"
                },
                children: linkedQ ? linkedQ.name : label2
              }), linkedQ && /* @__PURE__ */ jsx("span", {
                style: {
                  fontSize: 10,
                  color: "#16a34a",
                  fontWeight: 600
                },
                children: "linked"
              })]
            }), /* @__PURE__ */ jsx("button", {
              onClick: () => onAddLinkedLayer(type, layer.id),
              style: {
                background: "none",
                border: "none",
                color: linkedQ ? "#16a34a" : "#374151",
                cursor: "pointer",
                fontSize: linkedQ ? 14 : 20,
                fontWeight: 700,
                padding: "0 4px",
                lineHeight: 1
              },
              children: linkedQ ? "→" : "+"
            })]
          }, type);
        })]
      })]
    })]
  });
}
function OldLayerEditor({
  layer,
  numViews,
  onChange
}) {
  const setViewUrl = (viewIndex, url) => {
    if (viewIndex === 0) {
      onChange({
        ...layer,
        src: url
      });
      return;
    }
    const ev = [...layer.extraViews ?? []];
    ev[viewIndex - 1] = url;
    onChange({
      ...layer,
      extraViews: ev
    });
  };
  const getViewUrl = (viewIndex) => {
    var _a;
    if (viewIndex === 0) return layer.src;
    return ((_a = layer.extraViews) == null ? void 0 : _a[viewIndex - 1]) ?? "";
  };
  return /* @__PURE__ */ jsxs("div", {
    style: {
      padding: 16
    },
    children: [/* @__PURE__ */ jsx("label", {
      style: labelSt,
      children: "Layer Name"
    }), /* @__PURE__ */ jsx("input", {
      value: layer.name,
      onChange: (e) => onChange({
        ...layer,
        name: e.target.value
      }),
      style: inputSt
    }), /* @__PURE__ */ jsx("label", {
      style: labelSt,
      children: "Type"
    }), /* @__PURE__ */ jsxs("select", {
      value: layer.type,
      onChange: (e) => onChange({
        ...layer,
        type: e.target.value
      }),
      style: inputSt,
      children: [/* @__PURE__ */ jsx("option", {
        value: "static",
        children: "Static (fixed image)"
      }), /* @__PURE__ */ jsx("option", {
        value: "colorable",
        children: "Colorable (mask PNG)"
      })]
    }), /* @__PURE__ */ jsxs("label", {
      style: {
        ...labelSt,
        marginTop: 16
      },
      children: ["Images (", numViews, " view", numViews !== 1 ? "s" : "", ")"]
    }), Array.from({
      length: numViews
    }).map((_, vi) => /* @__PURE__ */ jsx(ViewUploadSlot, {
      viewIndex: vi,
      currentUrl: getViewUrl(vi),
      onUploaded: (url) => setViewUrl(vi, url),
      onUrlChange: (url) => setViewUrl(vi, url)
    }, vi)), layer.type === "colorable" && /* @__PURE__ */ jsx("p", {
      style: {
        fontSize: 11,
        color: "#9ca3af",
        marginTop: 6,
        lineHeight: 1.5
      },
      children: "Use a white/grayscale PNG on a transparent background for accurate coloring."
    })]
  });
}
function LayerEditorComp({
  layer,
  numViews,
  onChange,
  layers,
  questions,
  onAddLinkedLayer,
  onConvertToQuestion,
  onCreateAndLinkQuestion,
  onAnswerPreview
}) {
  if (!layer.displayType) return /* @__PURE__ */ jsx(OldLayerEditor, {
    layer,
    numViews,
    onChange
  });
  return /* @__PURE__ */ jsx(NewLayerEditor, {
    layer,
    layers,
    questions,
    numViews,
    onChange,
    onConvertToQuestion,
    onCreateAndLinkQuestion,
    onAddLinkedLayer,
    onAnswerPreview
  });
}
function UniversalInputDisplayRow({
  q,
  onChange,
  onSwitchType
}) {
  const [showInputDD, setShowInputDD] = useState(false);
  const [showDisplayDD, setShowDisplayDD] = useState(false);
  const dtList = DISPLAY_TYPE_MAP[q.type] ?? ["none"];
  const hasDisplayChoice = dtList.length > 1;
  const currentDT = q.displayType ?? dtList[0] ?? "none";
  const currentTypeMeta = INPUT_TYPE_CONFIG.find((c) => c.type === q.type);
  const currentDTMeta = DISPLAY_TYPE_META[currentDT] ?? {
    label: currentDT,
    icon: "?"
  };
  return /* @__PURE__ */ jsxs("div", {
    style: {
      borderTop: "1px solid #f3f4f6"
    },
    children: [/* @__PURE__ */ jsxs("div", {
      style: {
        padding: "12px 16px",
        borderBottom: hasDisplayChoice ? "1px solid #f3f4f6" : "none"
      },
      children: [/* @__PURE__ */ jsx("label", {
        style: {
          fontSize: 13,
          fontWeight: 600,
          color: "#374151",
          display: "block",
          marginBottom: 8
        },
        children: "Input type"
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          position: "relative"
        },
        children: [/* @__PURE__ */ jsxs("button", {
          onClick: () => {
            setShowInputDD((v) => !v);
            setShowDisplayDD(false);
          },
          style: {
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "7px 10px",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            background: "#f9fafb",
            cursor: "pointer",
            fontSize: 13,
            boxSizing: "border-box"
          },
          children: [/* @__PURE__ */ jsx("span", {
            style: {
              width: 22,
              height: 22,
              background: (currentTypeMeta == null ? void 0 : currentTypeMeta.bg) ?? "#6b7280",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              color: "#fff",
              fontWeight: 700,
              flexShrink: 0
            },
            children: (currentTypeMeta == null ? void 0 : currentTypeMeta.icon) ?? "?"
          }), /* @__PURE__ */ jsx("span", {
            style: {
              flex: 1,
              textAlign: "left",
              color: "#374151"
            },
            children: (currentTypeMeta == null ? void 0 : currentTypeMeta.label) ?? q.type
          }), /* @__PURE__ */ jsx("span", {
            style: {
              fontSize: 10,
              color: "#9ca3af"
            },
            children: "▼"
          })]
        }), showInputDD && /* @__PURE__ */ jsx("div", {
          style: {
            position: "absolute",
            left: 0,
            right: 0,
            top: "calc(100% + 2px)",
            zIndex: 60,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            maxHeight: 280,
            overflowY: "auto"
          },
          children: INPUT_TYPE_CONFIG.map(({
            type,
            label: label2,
            bg,
            icon
          }) => /* @__PURE__ */ jsxs("button", {
            onClick: () => {
              if (type !== q.type) onSwitchType(type);
              setShowInputDD(false);
            },
            style: {
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "8px 14px",
              border: "none",
              background: type === q.type ? "#eff6ff" : "none",
              cursor: "pointer",
              fontSize: 13,
              boxSizing: "border-box"
            },
            children: [/* @__PURE__ */ jsx("span", {
              style: {
                width: 22,
                height: 22,
                background: bg,
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                color: "#fff",
                fontWeight: 700,
                flexShrink: 0
              },
              children: icon
            }), /* @__PURE__ */ jsx("span", {
              style: {
                flex: 1,
                textAlign: "left",
                color: "#374151"
              },
              children: label2
            }), type === q.type && /* @__PURE__ */ jsx("span", {
              style: {
                color: "#22c55e",
                fontSize: 12
              },
              children: "✓"
            })]
          }, type))
        })]
      })]
    }), hasDisplayChoice && /* @__PURE__ */ jsxs("div", {
      style: {
        padding: "12px 16px"
      },
      children: [/* @__PURE__ */ jsx("label", {
        style: {
          fontSize: 13,
          fontWeight: 600,
          color: "#374151",
          display: "block",
          marginBottom: 8
        },
        children: "Display type"
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          position: "relative"
        },
        children: [/* @__PURE__ */ jsxs("button", {
          onClick: () => {
            setShowDisplayDD((v) => !v);
            setShowInputDD(false);
          },
          style: {
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "7px 10px",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            background: "#f9fafb",
            cursor: "pointer",
            fontSize: 13,
            boxSizing: "border-box"
          },
          children: [/* @__PURE__ */ jsx("span", {
            style: {
              width: 22,
              height: 22,
              background: "#f3f4f6",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              color: "#374151",
              flexShrink: 0
            },
            children: currentDTMeta.icon
          }), /* @__PURE__ */ jsx("span", {
            style: {
              flex: 1,
              textAlign: "left",
              color: "#374151"
            },
            children: currentDTMeta.label
          }), /* @__PURE__ */ jsx("span", {
            style: {
              fontSize: 10,
              color: "#9ca3af"
            },
            children: "▼"
          })]
        }), showDisplayDD && /* @__PURE__ */ jsx("div", {
          style: {
            position: "absolute",
            left: 0,
            right: 0,
            top: "calc(100% + 2px)",
            zIndex: 60,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            maxHeight: 280,
            overflowY: "auto"
          },
          children: dtList.map((dt) => {
            const meta = DISPLAY_TYPE_META[dt] ?? {
              label: dt,
              icon: "?"
            };
            return /* @__PURE__ */ jsxs("button", {
              onClick: () => {
                onChange({
                  ...q,
                  displayType: dt
                });
                setShowDisplayDD(false);
              },
              style: {
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "8px 14px",
                border: "none",
                background: dt === currentDT ? "#eff6ff" : "none",
                cursor: "pointer",
                fontSize: 13,
                boxSizing: "border-box"
              },
              children: [/* @__PURE__ */ jsx("span", {
                style: {
                  width: 22,
                  height: 22,
                  background: "#f3f4f6",
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  color: "#374151",
                  flexShrink: 0
                },
                children: meta.icon
              }), /* @__PURE__ */ jsxs("span", {
                style: {
                  flex: 1,
                  textAlign: "left"
                },
                children: [meta.label, meta.desc && /* @__PURE__ */ jsx("span", {
                  style: {
                    display: "block",
                    fontSize: 10,
                    color: "#9ca3af"
                  },
                  children: meta.desc
                })]
              }), dt === currentDT && /* @__PURE__ */ jsx("span", {
                style: {
                  color: "#22c55e",
                  fontSize: 12
                },
                children: "✓"
              })]
            }, dt);
          })
        })]
      })]
    })]
  });
}
const selSt = {
  padding: "5px 8px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 13,
  background: "#fff",
  cursor: "pointer",
  outline: "none"
};
function LogicRuleEditor({
  questions,
  layers,
  onSave,
  onCancel,
  initialRule
}) {
  var _a, _b;
  const firstCond = initialRule == null ? void 0 : initialRule.conditions[0];
  const firstAction = initialRule == null ? void 0 : initialRule.actions[0];
  const behindLayers = layers.filter((l) => l.type !== "glb-part");
  const defaultId = ((_a = questions[0]) == null ? void 0 : _a.id) ?? ((_b = behindLayers[0]) == null ? void 0 : _b.id) ?? "";
  const [condQId, setCondQId] = useState((firstCond == null ? void 0 : firstCond.questionId) ?? defaultId);
  const [condOp, setCondOp] = useState((firstCond == null ? void 0 : firstCond.operator) ?? "is");
  const [condVal, setCondVal] = useState((firstCond == null ? void 0 : firstCond.value) ?? "");
  const [actionQId, setActionQId] = useState((firstAction == null ? void 0 : firstAction.questionId) ?? defaultId);
  const [actionEffect, setActionEffect] = useState((firstAction == null ? void 0 : firstAction.effect) ?? "should_be_unavailable");
  const [actionVal, setActionVal] = useState((firstAction == null ? void 0 : firstAction.value) ?? "");
  const isEditing = !!initialRule;
  const condQ = questions.find((q) => q.id === condQId);
  const condLayer = !condQ ? behindLayers.find((l) => l.id === condQId) : void 0;
  const actionQ = questions.find((q) => q.id === actionQId);
  const condAnswers = condQ ? getQuestionAnswers(condQ) : ((condLayer == null ? void 0 : condLayer.answers) ?? []).map((a) => ({
    value: a.id,
    label: a.label
  }));
  const actionQ2 = !actionQ ? behindLayers.find((l) => l.id === actionQId) : void 0;
  const actionAnswers = actionQ ? getQuestionAnswers(actionQ) : ((actionQ2 == null ? void 0 : actionQ2.answers) ?? []).map((a) => ({
    value: a.id,
    label: a.label
  }));
  const needsActionValue = actionEffect !== "should_be_unavailable";
  const canSave = condQId && condVal && actionQId && (!needsActionValue || actionVal);
  const handleSave = () => {
    if (!canSave) return;
    onSave({
      id: (initialRule == null ? void 0 : initialRule.id) ?? `rule-${Date.now()}`,
      conditions: [{
        questionId: condQId,
        operator: condOp,
        value: condVal
      }],
      actions: [{
        questionId: actionQId,
        effect: actionEffect,
        value: needsActionValue ? actionVal : void 0
      }]
    });
  };
  return /* @__PURE__ */ jsxs("div", {
    style: {
      background: "#fff",
      border: "1.5px solid #2563eb",
      borderRadius: 8,
      padding: "14px 16px",
      margin: "0 0 12px"
    },
    children: [isEditing && /* @__PURE__ */ jsx("div", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        color: "#2563eb",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        marginBottom: 10
      },
      children: "Edit rule"
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 8
      },
      children: [/* @__PURE__ */ jsx("span", {
        style: {
          fontSize: 13,
          color: "#6b7280",
          fontWeight: 600
        },
        children: "When"
      }), /* @__PURE__ */ jsxs("select", {
        value: condQId,
        onChange: (e) => {
          setCondQId(e.target.value);
          setCondVal("");
        },
        style: selSt,
        children: [/* @__PURE__ */ jsx("optgroup", {
          label: "Questions",
          children: questions.map((q) => /* @__PURE__ */ jsx("option", {
            value: q.id,
            children: q.name
          }, q.id))
        }), behindLayers.length > 0 && /* @__PURE__ */ jsx("optgroup", {
          label: "Behind the Scene",
          children: behindLayers.map((l) => /* @__PURE__ */ jsx("option", {
            value: l.id,
            children: l.name
          }, l.id))
        })]
      }), /* @__PURE__ */ jsxs("select", {
        value: condOp,
        onChange: (e) => setCondOp(e.target.value),
        style: selSt,
        children: [/* @__PURE__ */ jsx("option", {
          value: "is",
          children: "is"
        }), /* @__PURE__ */ jsx("option", {
          value: "is_not",
          children: "is not"
        }), /* @__PURE__ */ jsx("option", {
          value: "matches",
          children: "matches"
        }), /* @__PURE__ */ jsx("option", {
          value: "doesnt_match",
          children: "doesn't match"
        })]
      }), /* @__PURE__ */ jsxs("select", {
        value: condVal,
        onChange: (e) => setCondVal(e.target.value),
        style: selSt,
        children: [/* @__PURE__ */ jsx("option", {
          value: "",
          children: "— Answer —"
        }), condAnswers.map((a) => /* @__PURE__ */ jsx("option", {
          value: a.value,
          children: a.label
        }, a.value))]
      }), /* @__PURE__ */ jsx("span", {
        style: {
          fontSize: 13,
          color: "#6b7280",
          fontWeight: 600
        },
        children: "then"
      }), /* @__PURE__ */ jsxs("select", {
        value: actionQId,
        onChange: (e) => {
          setActionQId(e.target.value);
          setActionVal("");
        },
        style: selSt,
        children: [/* @__PURE__ */ jsx("optgroup", {
          label: "Questions",
          children: questions.map((q) => /* @__PURE__ */ jsx("option", {
            value: q.id,
            children: q.name
          }, q.id))
        }), behindLayers.length > 0 && /* @__PURE__ */ jsx("optgroup", {
          label: "Behind the Scene",
          children: behindLayers.map((l) => /* @__PURE__ */ jsx("option", {
            value: l.id,
            children: l.name
          }, l.id))
        })]
      }), /* @__PURE__ */ jsxs("select", {
        value: actionEffect,
        onChange: (e) => setActionEffect(e.target.value),
        style: selSt,
        children: [/* @__PURE__ */ jsx("option", {
          value: "should_be",
          children: "should be"
        }), /* @__PURE__ */ jsx("option", {
          value: "should_not_be",
          children: "should not be"
        }), /* @__PURE__ */ jsx("option", {
          value: "should_be_unavailable",
          children: "should be unavailable"
        }), /* @__PURE__ */ jsx("option", {
          value: "should_be_one_of",
          children: "should be one of"
        }), /* @__PURE__ */ jsx("option", {
          value: "should_not_be_one_of",
          children: "should not be one of"
        })]
      }), needsActionValue && /* @__PURE__ */ jsxs("select", {
        value: actionVal,
        onChange: (e) => setActionVal(e.target.value),
        style: selSt,
        children: [/* @__PURE__ */ jsx("option", {
          value: "",
          children: "— Answer —"
        }), actionAnswers.map((a) => /* @__PURE__ */ jsx("option", {
          value: a.value,
          children: a.label
        }, a.value))]
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        display: "flex",
        gap: 8,
        marginTop: 14,
        justifyContent: "flex-end"
      },
      children: [/* @__PURE__ */ jsx("button", {
        onClick: onCancel,
        style: {
          ...smallBtnSt,
          background: "none",
          border: "1px solid #e5e7eb"
        },
        children: "Cancel"
      }), /* @__PURE__ */ jsx("button", {
        onClick: handleSave,
        disabled: !canSave,
        style: {
          background: canSave ? "#2563eb" : "#9ca3af",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          padding: "6px 18px",
          cursor: canSave ? "pointer" : "default",
          fontSize: 13,
          fontWeight: 600
        },
        children: isEditing ? "Save" : "Add"
      })]
    })]
  });
}
function ruleToText(rule, questions, layers = []) {
  const getQName = (id) => {
    var _a, _b;
    return ((_a = questions.find((q) => q.id === id)) == null ? void 0 : _a.name) ?? ((_b = layers.find((l) => l.id === id)) == null ? void 0 : _b.name) ?? id;
  };
  const getAnswerLabel = (qId, val) => {
    var _a, _b, _c;
    const q = questions.find((q2) => q2.id === qId);
    if (q) return ((_a = getQuestionAnswers(q).find((a) => a.value === val)) == null ? void 0 : _a.label) ?? val;
    const l = layers.find((l2) => l2.id === qId);
    return ((_c = (_b = l == null ? void 0 : l.answers) == null ? void 0 : _b.find((a) => a.id === val)) == null ? void 0 : _c.label) ?? val;
  };
  const EFFECT_LABELS = {
    should_be: "should be",
    should_not_be: "should not be",
    should_be_unavailable: "should be unavailable",
    should_be_one_of: "should be one of",
    should_not_be_one_of: "should not be one of"
  };
  const OP_LABELS = {
    is: "is",
    is_not: "is not",
    matches: "matches",
    doesnt_match: "doesn't match"
  };
  const condParts = rule.conditions.map((c) => `${getQName(c.questionId)} ${OP_LABELS[c.operator]} ${getAnswerLabel(c.questionId, c.value)}`);
  const actionParts = rule.actions.map((a) => `${getQName(a.questionId)} ${EFFECT_LABELS[a.effect]}${a.value ? ` ${getAnswerLabel(a.questionId, a.value)}` : ""}`);
  return `When ${condParts.join(" and ")} then ${actionParts.join(" and ")}`;
}
const actionIconSt = {
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "7px 11px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14
};
function LogicPanel({
  rules,
  questions,
  layers,
  onChange,
  onBack
}) {
  const [addingNew, setAddingNew] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [hoveredRuleId, setHoveredRuleId] = useState(null);
  const [search, setSearch] = useState("");
  const filtered = rules.filter((r) => !search || ruleToText(r, questions, layers).toLowerCase().includes(search.toLowerCase()));
  const handleStartAdd = () => {
    setAddingNew(true);
    setEditingRuleId(null);
  };
  const handleStartEdit = (id) => {
    setEditingRuleId(id);
    setAddingNew(false);
  };
  return /* @__PURE__ */ jsxs("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      background: "#fff",
      overflow: "hidden"
    },
    children: [/* @__PURE__ */ jsxs("div", {
      style: {
        height: 44,
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 12,
        flexShrink: 0
      },
      children: [/* @__PURE__ */ jsx("button", {
        onClick: onBack,
        style: {
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 18,
          color: "#6b7280",
          padding: 0,
          display: "flex",
          alignItems: "center"
        },
        children: "←"
      }), /* @__PURE__ */ jsx("span", {
        style: {
          fontWeight: 700,
          fontSize: 14
        },
        children: "Logic"
      }), /* @__PURE__ */ jsx("div", {
        style: {
          marginLeft: "auto"
        },
        children: /* @__PURE__ */ jsx("button", {
          onClick: handleStartAdd,
          style: {
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "6px 16px",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 6
          },
          children: "+ Add rule"
        })
      })]
    }), /* @__PURE__ */ jsx("div", {
      style: {
        padding: "10px 20px",
        borderBottom: "1px solid #e5e7eb",
        flexShrink: 0
      },
      children: /* @__PURE__ */ jsx("input", {
        value: search,
        onChange: (e) => setSearch(e.target.value),
        placeholder: "Search rules...",
        style: {
          width: "100%",
          padding: "7px 12px",
          border: "1px solid #e5e7eb",
          borderRadius: 6,
          fontSize: 13,
          boxSizing: "border-box",
          outline: "none"
        }
      })
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        flex: 1,
        overflowY: "auto",
        padding: "16px 20px"
      },
      children: [addingNew && /* @__PURE__ */ jsx(LogicRuleEditor, {
        questions,
        layers,
        onSave: (rule) => {
          onChange([...rules, rule]);
          setAddingNew(false);
        },
        onCancel: () => setAddingNew(false)
      }), filtered.length === 0 && !addingNew && /* @__PURE__ */ jsxs("div", {
        style: {
          textAlign: "center",
          color: "#9ca3af",
          padding: "60px 20px"
        },
        children: [/* @__PURE__ */ jsx("div", {
          style: {
            fontSize: 32,
            marginBottom: 12
          },
          children: "⚙"
        }), /* @__PURE__ */ jsxs("p", {
          style: {
            margin: 0,
            fontSize: 13,
            lineHeight: 1.6
          },
          children: ["No logic rules yet. Click ", /* @__PURE__ */ jsx("strong", {
            children: "+ Add rule"
          }), " to create your first conditional rule."]
        })]
      }), filtered.map((rule) => /* @__PURE__ */ jsx("div", {
        children: editingRuleId === rule.id ? /* @__PURE__ */ jsx(LogicRuleEditor, {
          questions,
          layers,
          initialRule: rule,
          onSave: (updated) => {
            onChange(rules.map((r) => r.id === rule.id ? updated : r));
            setEditingRuleId(null);
          },
          onCancel: () => setEditingRuleId(null)
        }) : /* @__PURE__ */ jsxs("div", {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 0",
            borderBottom: "1px solid #f3f4f6",
            position: "relative"
          },
          onMouseEnter: () => setHoveredRuleId(rule.id),
          onMouseLeave: () => setHoveredRuleId(null),
          children: [/* @__PURE__ */ jsx("span", {
            style: {
              flex: 1,
              fontSize: 13,
              color: "#374151",
              lineHeight: 1.5,
              paddingRight: hoveredRuleId === rule.id ? 112 : 0
            },
            children: ruleToText(rule, questions, layers)
          }), hoveredRuleId === rule.id && /* @__PURE__ */ jsxs("div", {
            style: {
              position: "absolute",
              right: 0,
              display: "flex",
              alignItems: "center",
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
              overflow: "hidden",
              flexShrink: 0
            },
            children: [/* @__PURE__ */ jsx("button", {
              onClick: () => onChange([...rules, {
                ...rule,
                id: `rule-${Date.now()}`
              }]),
              style: {
                ...actionIconSt,
                color: "#6b7280",
                borderRight: "1px solid #e5e7eb"
              },
              title: "Duplicate",
              children: "⎘"
            }), /* @__PURE__ */ jsx("button", {
              onClick: () => handleStartEdit(rule.id),
              style: {
                ...actionIconSt,
                color: "#6b7280",
                borderRight: "1px solid #e5e7eb"
              },
              title: "Edit",
              children: "✎"
            }), /* @__PURE__ */ jsx("button", {
              onClick: () => onChange(rules.filter((r) => r.id !== rule.id)),
              style: {
                ...actionIconSt,
                color: "#ef4444"
              },
              title: "Delete",
              children: "🗑"
            })]
          })]
        })
      }, rule.id))]
    })]
  });
}
function AlignLeftIcon() {
  return /* @__PURE__ */ jsxs("svg", {
    width: "16",
    height: "14",
    viewBox: "0 0 16 14",
    fill: "none",
    children: [/* @__PURE__ */ jsx("rect", {
      x: "1",
      y: "1",
      width: "14",
      height: "2",
      rx: "1",
      fill: "currentColor"
    }), /* @__PURE__ */ jsx("rect", {
      x: "1",
      y: "5",
      width: "9",
      height: "2",
      rx: "1",
      fill: "currentColor"
    }), /* @__PURE__ */ jsx("rect", {
      x: "1",
      y: "9",
      width: "11",
      height: "2",
      rx: "1",
      fill: "currentColor"
    })]
  });
}
function AlignCenterIcon() {
  return /* @__PURE__ */ jsxs("svg", {
    width: "16",
    height: "14",
    viewBox: "0 0 16 14",
    fill: "none",
    children: [/* @__PURE__ */ jsx("rect", {
      x: "1",
      y: "1",
      width: "14",
      height: "2",
      rx: "1",
      fill: "currentColor"
    }), /* @__PURE__ */ jsx("rect", {
      x: "3.5",
      y: "5",
      width: "9",
      height: "2",
      rx: "1",
      fill: "currentColor"
    }), /* @__PURE__ */ jsx("rect", {
      x: "2.5",
      y: "9",
      width: "11",
      height: "2",
      rx: "1",
      fill: "currentColor"
    })]
  });
}
function AlignRightIcon() {
  return /* @__PURE__ */ jsxs("svg", {
    width: "16",
    height: "14",
    viewBox: "0 0 16 14",
    fill: "none",
    children: [/* @__PURE__ */ jsx("rect", {
      x: "1",
      y: "1",
      width: "14",
      height: "2",
      rx: "1",
      fill: "currentColor"
    }), /* @__PURE__ */ jsx("rect", {
      x: "6",
      y: "5",
      width: "9",
      height: "2",
      rx: "1",
      fill: "currentColor"
    }), /* @__PURE__ */ jsx("rect", {
      x: "4",
      y: "9",
      width: "11",
      height: "2",
      rx: "1",
      fill: "currentColor"
    })]
  });
}
function TextCanvasToolbar({
  tq,
  onUpdate
}) {
  const pa = tq.printArea;
  const rotVal = pa ? pa.rotation ?? 0 : tq.rotation ?? 0;
  const handleRot = (v) => {
    if (pa) onUpdate({
      ...tq,
      printArea: {
        ...pa,
        rotation: v
      }
    });
    else onUpdate({
      ...tq,
      rotation: v
    });
  };
  const FONTS = ["Arial", "Georgia", "Impact", "Verdana", "Courier New", "Times New Roman"];
  return /* @__PURE__ */ jsxs("div", {
    style: {
      height: 44,
      background: "#fff",
      borderBottom: "1px solid #e5e7eb",
      display: "flex",
      alignItems: "center",
      padding: "0 12px",
      gap: 2,
      flexShrink: 0,
      overflowX: "auto"
    },
    children: [/* @__PURE__ */ jsx("button", {
      style: toolbarBtnSt,
      title: "Move",
      children: "✥"
    }), /* @__PURE__ */ jsx("button", {
      style: toolbarBtnSt,
      title: "Rotate",
      children: "↻"
    }), /* @__PURE__ */ jsx("button", {
      style: toolbarBtnSt,
      title: "Resize",
      children: "⤢"
    }), /* @__PURE__ */ jsx("div", {
      style: toolbarDividerSt
    }), ["left", "center", "right"].map((align) => {
      const isActive = (tq.textAlign ?? "left") === align;
      return /* @__PURE__ */ jsxs("button", {
        onClick: () => onUpdate({
          ...tq,
          textAlign: align
        }),
        title: `Align ${align}`,
        style: {
          ...toolbarBtnSt,
          background: isActive ? "#f3f4f6" : "transparent",
          border: isActive ? "1px solid #d1d5db" : "1px solid transparent",
          color: isActive ? "#111827" : "#6b7280"
        },
        children: [align === "left" && /* @__PURE__ */ jsx(AlignLeftIcon, {}), align === "center" && /* @__PURE__ */ jsx(AlignCenterIcon, {}), align === "right" && /* @__PURE__ */ jsx(AlignRightIcon, {})]
      }, align);
    }), /* @__PURE__ */ jsx("div", {
      style: toolbarDividerSt
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        position: "relative",
        display: "flex",
        alignItems: "center"
      },
      children: [/* @__PURE__ */ jsxs("button", {
        style: {
          ...toolbarBtnSt,
          position: "relative",
          overflow: "visible"
        },
        onClick: () => {
          var _a;
          return (_a = document.getElementById(`tbar-color-${tq.id}`)) == null ? void 0 : _a.click();
        },
        title: "Text color",
        children: [/* @__PURE__ */ jsx("span", {
          style: {
            fontSize: 13,
            fontWeight: 700,
            color: tq.defaultColor || "#000",
            lineHeight: 1
          },
          children: "A"
        }), /* @__PURE__ */ jsx("span", {
          style: {
            position: "absolute",
            bottom: 2,
            left: "50%",
            transform: "translateX(-50%)",
            width: 14,
            height: 3,
            borderRadius: 1,
            background: tq.defaultColor || "#000"
          }
        })]
      }), /* @__PURE__ */ jsx("input", {
        id: `tbar-color-${tq.id}`,
        type: "color",
        value: tq.defaultColor || "#000000",
        onChange: (e) => onUpdate({
          ...tq,
          defaultColor: e.target.value
        }),
        style: {
          position: "absolute",
          opacity: 0,
          width: 0,
          height: 0,
          pointerEvents: "none"
        }
      })]
    }), /* @__PURE__ */ jsx("div", {
      style: toolbarDividerSt
    }), /* @__PURE__ */ jsx("select", {
      value: tq.defaultFontFamily,
      onChange: (e) => onUpdate({
        ...tq,
        defaultFontFamily: e.target.value
      }),
      style: {
        height: 28,
        border: "1px solid #e5e7eb",
        borderRadius: 4,
        fontSize: 12,
        padding: "0 6px",
        background: "#fff",
        cursor: "pointer",
        maxWidth: 130
      },
      title: "Font family",
      children: FONTS.map((f) => /* @__PURE__ */ jsx("option", {
        value: f,
        children: f
      }, f))
    }), /* @__PURE__ */ jsx("div", {
      style: toolbarDividerSt
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 3
      },
      children: [/* @__PURE__ */ jsx("span", {
        style: {
          fontSize: 12,
          fontWeight: 700,
          color: "#374151"
        },
        children: "A"
      }), /* @__PURE__ */ jsx("input", {
        type: "number",
        value: tq.defaultFontSize,
        onChange: (e) => onUpdate({
          ...tq,
          defaultFontSize: Math.max(6, Number(e.target.value))
        }),
        min: 6,
        max: 300,
        style: {
          width: 48,
          height: 28,
          border: "1px solid #e5e7eb",
          borderRadius: 4,
          fontSize: 12,
          padding: "0 4px",
          textAlign: "center"
        },
        title: "Font size"
      }), /* @__PURE__ */ jsx("span", {
        style: {
          fontSize: 11,
          color: "#9ca3af"
        },
        children: "px"
      })]
    }), /* @__PURE__ */ jsx("div", {
      style: toolbarDividerSt
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 3
      },
      children: [/* @__PURE__ */ jsxs("svg", {
        width: "14",
        height: "14",
        viewBox: "0 0 14 14",
        fill: "none",
        style: {
          color: "#6b7280",
          flexShrink: 0
        },
        children: [/* @__PURE__ */ jsx("path", {
          d: "M2 7a5 5 0 1 0 5-5",
          stroke: "currentColor",
          strokeWidth: "1.5",
          strokeLinecap: "round"
        }), /* @__PURE__ */ jsx("path", {
          d: "M7 2 5.5 3.5 7 5",
          stroke: "currentColor",
          strokeWidth: "1.5",
          strokeLinecap: "round",
          strokeLinejoin: "round"
        })]
      }), /* @__PURE__ */ jsx("input", {
        type: "number",
        value: rotVal,
        onChange: (e) => handleRot(Number(e.target.value)),
        min: -360,
        max: 360,
        style: {
          width: 52,
          height: 28,
          border: "1px solid #e5e7eb",
          borderRadius: 4,
          fontSize: 12,
          padding: "0 4px",
          textAlign: "center"
        },
        title: "Rotation °"
      }), /* @__PURE__ */ jsx("span", {
        style: {
          fontSize: 11,
          color: "#9ca3af"
        },
        children: "°"
      })]
    })]
  });
}
const app_configuratorSetup_$productId = UNSAFE_withComponentProps(function BuilderPage() {
  const {
    product,
    config
  } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const existingOptions = config == null ? void 0 : config.options;
  const [leftTab, setLeftTab] = useState("layers");
  const [modelMode, setModelMode] = useState((existingOptions == null ? void 0 : existingOptions.modelMode) ?? false);
  const [glbUrl, setGlbUrl] = useState(existingOptions == null ? void 0 : existingOptions.glbUrl);
  const [customTitle, setCustomTitle] = useState(product.title ?? "");
  const [canvasW, setCanvasW] = useState((existingOptions == null ? void 0 : existingOptions.canvasW) ?? CANVAS_SIZE$1);
  const [canvasH, setCanvasH] = useState((existingOptions == null ? void 0 : existingOptions.canvasH) ?? CANVAS_SIZE$1);
  const [layers, setLayers] = useState((config == null ? void 0 : config.layers) ?? []);
  const [questions, setQuestions] = useState(() => migrateOptions(existingOptions, (config == null ? void 0 : config.layers) ?? []) || []);
  const [logicRules, setLogicRules] = useState((existingOptions == null ? void 0 : existingOptions.logicRules) ?? []);
  const [showLogicPanel, setShowLogicPanel] = useState(false);
  const [selected, setSelected] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [numViews, setNumViews] = useState((existingOptions == null ? void 0 : existingOptions.numViews) ?? 1);
  const [viewNames, setViewNames] = useState(() => {
    const saved = existingOptions == null ? void 0 : existingOptions.viewNames;
    const n = (existingOptions == null ? void 0 : existingOptions.numViews) ?? 1;
    const defaults = ["Front", "Back", "Side", "Detail"];
    return Array.from({
      length: n
    }, (_, i) => (saved == null ? void 0 : saved[i]) || defaults[i] || `View ${i + 1}`);
  });
  const [currentView, setCurrentView] = useState(0);
  const [answerEditState, setAnswerEditState] = useState(null);
  const [editingPrintAreaId, setEditingPrintAreaId] = useState(null);
  const [layerPreviewAnswerIdx, setLayerPreviewAnswerIdx] = useState({});
  const [labelPreviewImages, setLabelPreviewImages] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState(/* @__PURE__ */ new Set());
  const [addToGroupId, setAddToGroupId] = useState(null);
  const toggleGroup = (id) => setExpandedGroups((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  const [dragQId, setDragQId] = useState(null);
  const [dragOverQId, setDragOverQId] = useState(null);
  const [dragLId, setDragLId] = useState(null);
  const [dragOverLId, setDragOverLId] = useState(null);
  const [pendingPreview, setPendingPreview] = useState(false);
  const handleLDragStart = (id) => setDragLId(id);
  const handleLDragOver = (e, id) => {
    e.preventDefault();
    setDragOverLId(id);
  };
  const handleLDrop = (targetId) => {
    if (!dragLId || dragLId === targetId) {
      setDragLId(null);
      setDragOverLId(null);
      return;
    }
    setLayers((prev) => {
      const from = prev.findIndex((l) => l.id === dragLId);
      const to = prev.findIndex((l) => l.id === targetId);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      const [removed] = next.splice(from, 1);
      next.splice(to, 0, removed);
      return next;
    });
    setDragLId(null);
    setDragOverLId(null);
  };
  const handleLDragEnd = () => {
    setDragLId(null);
    setDragOverLId(null);
  };
  const handleQDragStart = (id) => setDragQId(id);
  const handleQDragOver = (e, id) => {
    e.preventDefault();
    setDragOverQId(id);
  };
  const handleQDrop = (targetId) => {
    if (!dragQId || dragQId === targetId) {
      setDragQId(null);
      setDragOverQId(null);
      return;
    }
    const targetQ = questions.find((q) => q.id === targetId);
    if ((targetQ == null ? void 0 : targetQ.type) === "group") {
      setQuestions((prev) => prev.map((q) => {
        if (q.type !== "group") return q;
        if (q.id === targetId) {
          if (q.childIds.includes(dragQId)) return q;
          return {
            ...q,
            childIds: [...q.childIds, dragQId]
          };
        }
        return {
          ...q,
          childIds: q.childIds.filter((id) => id !== dragQId)
        };
      }));
      setExpandedGroups((prev) => /* @__PURE__ */ new Set([...prev, targetId]));
    } else {
      const targetGroup = questions.find((q) => q.type === "group" && q.childIds.includes(targetId));
      if (targetGroup) {
        const newChildIds = [...targetGroup.childIds];
        if (newChildIds.includes(dragQId)) newChildIds.splice(newChildIds.indexOf(dragQId), 1);
        newChildIds.splice(newChildIds.indexOf(targetId), 0, dragQId);
        setQuestions((prev) => prev.map((q) => {
          if (q.type !== "group") return q;
          if (q.id === targetGroup.id) return {
            ...q,
            childIds: newChildIds
          };
          return {
            ...q,
            childIds: q.childIds.filter((id) => id !== dragQId)
          };
        }));
        setExpandedGroups((prev) => /* @__PURE__ */ new Set([...prev, targetGroup.id]));
      } else {
        const dragIdx = questions.findIndex((q) => q.id === dragQId);
        const targetIdx = questions.findIndex((q) => q.id === targetId);
        if (dragIdx === -1 || targetIdx === -1) {
          setDragQId(null);
          setDragOverQId(null);
          return;
        }
        const next = [...questions];
        const [removed] = next.splice(dragIdx, 1);
        const newTarget = next.findIndex((q) => q.id === targetId);
        next.splice(newTarget + 1, 0, removed);
        setQuestions(next.map((q) => q.type === "group" ? {
          ...q,
          childIds: q.childIds.filter((id) => id !== dragQId)
        } : q));
      }
    }
    setDragQId(null);
    setDragOverQId(null);
  };
  const handleQDragEnd = () => {
    setDragQId(null);
    setDragOverQId(null);
  };
  const [showAddLayerModal, setShowAddLayerModal] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    setAnswerEditState(null);
    setEditingPrintAreaId(null);
    if ((selected == null ? void 0 : selected.kind) === "question") {
      const q = questions.find((q2) => q2.id === selected.id);
      if ((q == null ? void 0 : q.type) === "text") {
        const pa = q.printArea;
        if (pa && pa.visibleViews.length > 0) {
          setCurrentView(Math.min(pa.visibleViews[0] - 1, numViews - 1));
        }
      }
    }
  }, [selected == null ? void 0 : selected.id]);
  const [selectedSwatches, setSelectedSwatches] = useState({});
  const canvasColors = useMemo(() => {
    const c = {};
    for (const q of questions) {
      const isImageThumbnail = q.type === "thumbnail" && (q.displayType ?? "image") === "image";
      if (isImageThumbnail) continue;
      if (q.type === "color" || q.type === "thumbnail") {
        const linkedLayerId = q.linkedLayerId;
        const applyOn = q.applyOn;
        const layerIds = linkedLayerId ? [linkedLayerId, ...applyOn ?? []] : applyOn ?? [];
        if (!layerIds.length) continue;
        const picked = selectedSwatches[q.id];
        if (picked) {
          for (const lid of layerIds) c[lid] = picked;
        }
      }
    }
    return c;
  }, [questions, selectedSwatches]);
  const canvasTextures = useMemo(() => {
    const t = {};
    for (const q of questions) {
      const isImageThumbnail = q.type === "thumbnail" && (q.displayType ?? "image") === "image";
      if (isImageThumbnail) continue;
      if (q.type === "color" || q.type === "thumbnail") {
        const linkedLayerId = q.linkedLayerId;
        const applyOn = q.applyOn;
        const layerIds = linkedLayerId ? [linkedLayerId, ...applyOn ?? []] : applyOn ?? [];
        if (!layerIds.length) continue;
        const pickedVal = selectedSwatches[q.id];
        if (pickedVal) {
          const swatch = q.swatches.find((s) => s.value === pickedVal);
          if (swatch == null ? void 0 : swatch.imageUrl) {
            for (const lid of layerIds) t[lid] = swatch.imageUrl;
          }
        }
      }
    }
    return t;
  }, [questions, selectedSwatches]);
  const adminPreviewCustomizations = useMemo(() => {
    const glbIds = new Set(layers.filter((l) => l.type === "glb-part").map((l) => l.id));
    const result = {};
    for (const [id, color] of Object.entries(canvasColors)) {
      if (glbIds.has(id)) result[id] = {
        ...result[id],
        color
      };
    }
    for (const [id, textureUrl] of Object.entries(canvasTextures)) {
      if (glbIds.has(id)) result[id] = {
        ...result[id],
        textureUrl
      };
    }
    return result;
  }, [layers, canvasColors, canvasTextures]);
  const canvasImageOverrides = useMemo(() => {
    var _a;
    const o = {};
    for (const q of questions) {
      if (q.type !== "thumbnail" || (q.displayType ?? "image") !== "image") continue;
      const linkedLayerId = q.linkedLayerId;
      const applyOn = q.applyOn;
      const layerIds = linkedLayerId ? [linkedLayerId, ...applyOn ?? []] : applyOn ?? [];
      if (!layerIds.length) continue;
      const picked = selectedSwatches[q.id];
      if (!picked) continue;
      const swatch = q.swatches.find((s) => s.value === picked);
      if ((_a = swatch == null ? void 0 : swatch.viewImages) == null ? void 0 : _a.length) {
        const viewArr = swatch.viewImages.map((v) => v || "");
        for (const lid of layerIds) o[lid] = viewArr;
      }
    }
    return o;
  }, [questions, selectedSwatches]);
  const textItems = useMemo(() => questions.filter((q) => q.type === "text"), [questions]);
  const filePlaceholders = useMemo(() => questions.filter((q) => q.type === "file"), [questions]);
  const aspectRatio = canvasW / canvasH;
  const displayW = aspectRatio >= 1 ? CANVAS_SIZE$1 : Math.round(CANVAS_SIZE$1 * aspectRatio);
  const displayH = aspectRatio <= 1 ? CANVAS_SIZE$1 : Math.round(CANVAS_SIZE$1 / aspectRatio);
  const canvasDisplayScale = displayW / canvasW;
  const S = canvasW / 800;
  const textNodeRefs = useRef({});
  const logoNodeRefs = useRef({});
  const printAreaGroupRefs = useRef({});
  const transformerRef = useRef(null);
  const printAreaTransformerRef = useRef(null);
  useEffect(() => {
    var _a, _b, _c, _d, _e, _f;
    const selQ2 = (selected == null ? void 0 : selected.kind) === "question" ? questions.find((q) => q.id === selected.id) : null;
    const isTextWithPA = (selQ2 == null ? void 0 : selQ2.type) === "text" && !!selQ2.printArea;
    const isTextNoPA = (selQ2 == null ? void 0 : selQ2.type) === "text" && !selQ2.printArea;
    const isLogo = (selQ2 == null ? void 0 : selQ2.type) === "file" && selQ2.displayType === "logo";
    if (isTextWithPA) {
      (_a = transformerRef.current) == null ? void 0 : _a.nodes([]);
      (_c = (_b = transformerRef.current) == null ? void 0 : _b.getLayer()) == null ? void 0 : _c.batchDraw();
    } else if (isTextNoPA && transformerRef.current && textNodeRefs.current[selQ2.id]) {
      transformerRef.current.nodes([textNodeRefs.current[selQ2.id]]);
      (_d = transformerRef.current.getLayer()) == null ? void 0 : _d.batchDraw();
    } else if (isLogo && transformerRef.current && logoNodeRefs.current[selQ2.id]) {
      transformerRef.current.nodes([logoNodeRefs.current[selQ2.id]]);
      (_e = transformerRef.current.getLayer()) == null ? void 0 : _e.batchDraw();
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      (_f = transformerRef.current.getLayer()) == null ? void 0 : _f.batchDraw();
    }
  }, [selected, questions]);
  useEffect(() => {
    var _a;
    if (!printAreaTransformerRef.current) return;
    const node = editingPrintAreaId ? printAreaGroupRefs.current[editingPrintAreaId] : null;
    printAreaTransformerRef.current.nodes(node ? [node] : []);
    (_a = printAreaTransformerRef.current.getLayer()) == null ? void 0 : _a.batchDraw();
  }, [editingPrintAreaId, selected]);
  const updateQ = (u) => setQuestions((p) => p.map((q) => q.id === u.id ? u : q));
  const removeQ = (id) => {
    setQuestions((p) => p.filter((q) => q.id !== id).map((q) => q.type === "group" ? {
      ...q,
      childIds: q.childIds.filter((cid) => cid !== id)
    } : q));
    if ((selected == null ? void 0 : selected.id) === id) setSelected(null);
  };
  const duplicateQ = (id) => {
    const src = questions.find((q) => q.id === id);
    if (!src) return;
    const newId = `${src.type}-${Date.now()}`;
    setQuestions((p) => [...p, {
      ...src,
      id: newId,
      name: `${src.name} (copy)`
    }]);
  };
  const addQuestion = (type, displayType) => {
    const id = `${type}-${Date.now()}`;
    let q;
    switch (type) {
      case "color": {
        if (displayType === "color") {
          const first = layers.find((l) => l.type === "colorable");
          if (!first) {
            alert("Add a colorable layer first.");
            return;
          }
          q = {
            id,
            name: "Color Option",
            type: "color",
            displayType: "color",
            linkedLayerId: first.id,
            swatches: []
          };
        } else {
          q = {
            id,
            name: "Color Option",
            type: "color",
            displayType,
            swatches: []
          };
        }
        break;
      }
      case "thumbnail":
        q = {
          id,
          name: "Untitled image",
          type: "thumbnail",
          displayType,
          swatches: []
        };
        break;
      case "text":
        q = {
          id,
          name: "Custom Text",
          type: "text",
          displayType: displayType || "text",
          defaultText: "Your Name",
          defaultColor: "#ffffff",
          defaultFontSize: 38,
          defaultFontFamily: "Arial",
          position: {
            x: 200,
            y: 180
          }
        };
        break;
      case "file":
        q = {
          id,
          name: "Untitled logo",
          type: "file",
          displayType: displayType || "logo",
          position: {
            x: 200,
            y: 280
          },
          defaultWidth: 120,
          defaultHeight: 120,
          printAreas: [],
          allowedTransforms: {
            move: true,
            resize: true,
            rotate: false
          }
        };
        break;
      case "dropdown":
        q = {
          id,
          name: "Select Option",
          type: "dropdown",
          displayType: displayType === "image" ? "image" : "none",
          options: displayType === "image" ? [] : [{
            value: "option-1",
            label: "Option 1"
          }]
        };
        break;
      case "radio":
        q = {
          id,
          name: "Choose Option",
          type: "radio",
          options: [{
            value: "option-1",
            label: "Option 1"
          }]
        };
        break;
      case "checkbox":
        q = {
          id,
          name: "Add-on",
          type: "checkbox",
          checkedLabel: "Yes",
          uncheckedLabel: "No",
          defaultChecked: false
        };
        break;
      case "label":
        q = {
          id,
          name: "Type",
          type: "label",
          content: "",
          answers: [],
          displayType: displayType || "none",
          multipleSelection: false
        };
        break;
      case "group":
        q = {
          id,
          name: "Group",
          type: "group",
          childIds: []
        };
        break;
      case "none":
        q = {
          id,
          name: "Static Element",
          type: "none",
          displayType: displayType || "image"
        };
        break;
      default:
        return;
    }
    if (addToGroupId) {
      const gid = addToGroupId;
      setQuestions((p) => {
        const updated = [...p, q];
        return updated.map((oq) => oq.id === gid ? {
          ...oq,
          childIds: [...oq.childIds, id]
        } : oq);
      });
      setExpandedGroups((prev) => /* @__PURE__ */ new Set([...prev, gid]));
    } else {
      setQuestions((p) => [...p, q]);
    }
    setSelected({
      kind: "question",
      id
    });
  };
  const addTextSubQuestion = (subType, parentId) => {
    const id = `${subType}-${Date.now()}`;
    const subTypeMap = {
      color: {
        id,
        name: "Text color",
        type: "color",
        displayType: "text-color",
        swatches: []
      },
      font: {
        id,
        name: "Font",
        type: "dropdown",
        options: [{
          value: "Arial",
          label: "Arial"
        }, {
          value: "Georgia",
          label: "Georgia"
        }, {
          value: "Impact",
          label: "Impact"
        }]
      },
      "font-size": {
        id,
        name: "Font size",
        type: "dropdown",
        options: [{
          value: "24",
          label: "24px"
        }, {
          value: "36",
          label: "36px"
        }, {
          value: "48",
          label: "48px"
        }, {
          value: "64",
          label: "64px"
        }]
      },
      outline: {
        id,
        name: "Text outline",
        type: "color",
        displayType: "text-outline",
        swatches: []
      }
    };
    const newQ = subTypeMap[subType];
    if (!newQ) return;
    setQuestions((p) => [...p, newQ]);
    setSelected({
      kind: "question",
      id
    });
  };
  const switchQuestionType = (id, newType) => {
    const existingQ = questions.find((q) => q.id === id);
    if (!existingQ) return;
    const {
      name
    } = existingQ;
    let newQ;
    switch (newType) {
      case "thumbnail":
        newQ = {
          id,
          name,
          type: "thumbnail",
          displayType: "image",
          swatches: []
        };
        break;
      case "dropdown":
        newQ = {
          id,
          name,
          type: "dropdown",
          options: [{
            value: "option-1",
            label: "Option 1"
          }]
        };
        break;
      case "radio":
        newQ = {
          id,
          name,
          type: "radio",
          options: [{
            value: "option-1",
            label: "Option 1"
          }]
        };
        break;
      case "checkbox":
        newQ = {
          id,
          name,
          type: "checkbox",
          checkedLabel: "Yes",
          uncheckedLabel: "No",
          defaultChecked: false
        };
        break;
      case "text":
        newQ = {
          id,
          name,
          type: "text",
          defaultText: "Your Name",
          defaultColor: "#ffffff",
          defaultFontSize: 38,
          defaultFontFamily: "Arial",
          position: {
            x: 200,
            y: 180
          }
        };
        break;
      case "file":
        newQ = {
          id,
          name,
          type: "file",
          displayType: "logo",
          position: {
            x: 200,
            y: 280
          },
          defaultWidth: 120,
          defaultHeight: 120,
          printAreas: [],
          allowedTransforms: {
            move: true,
            resize: true,
            rotate: false
          }
        };
        break;
      case "color": {
        const first = layers.find((l) => l.type === "colorable");
        if (!first) {
          alert("Add a colorable layer first.");
          return;
        }
        newQ = {
          id,
          name,
          type: "color",
          linkedLayerId: first.id,
          swatches: []
        };
        break;
      }
      case "label":
        newQ = {
          id,
          name,
          type: "label",
          content: "",
          answers: [],
          displayType: "none"
        };
        break;
      case "group":
        newQ = {
          id,
          name,
          type: "group",
          childIds: []
        };
        break;
      case "none":
        newQ = {
          id,
          name,
          type: "none",
          displayType: "image"
        };
        break;
      default:
        return;
    }
    setQuestions((p) => p.map((q) => q.id === id ? newQ : q));
  };
  const updateL = (u) => setLayers((p) => p.map((l) => l.id === u.id ? u : l));
  const removeL = (id) => {
    setLayers((p) => p.filter((l) => l.id !== id));
    if ((selected == null ? void 0 : selected.id) === id) setSelected(null);
  };
  const addNewLayer = (layerType, displayType) => {
    var _a;
    const baseName = ((_a = DISPLAY_TYPE_META[displayType]) == null ? void 0 : _a.label) ?? displayType;
    const id = `${displayType}-${Date.now()}`;
    setLayers((p) => [...p, {
      id,
      name: `Untitled ${baseName.toLowerCase()}`,
      type: layerType,
      src: "",
      displayType,
      answers: []
    }]);
    setSelected({
      kind: "layer",
      id
    });
  };
  const addLinkedLayer = (displayType, sourceId) => {
    var _a;
    if (displayType === "color") {
      const existing = questions.find((q) => q.type === "thumbnail" && q.displayType === "color" && (q.applyOn ?? []).includes(sourceId));
      if (existing) {
        setSelected({
          kind: "question",
          id: existing.id
        });
        return;
      }
      const count2 = questions.filter((q) => q.type === "thumbnail" && q.displayType === "color").length + 1;
      const id2 = `q-color-${Date.now()}`;
      const newQ = {
        id: id2,
        name: `Untitled Question ${count2} colors`,
        type: "thumbnail",
        displayType: "color",
        swatches: [],
        applyOn: [sourceId]
      };
      setQuestions((p) => [...p, newQ]);
      setSelected({
        kind: "question",
        id: id2
      });
      return;
    }
    const baseName = ((_a = DISPLAY_TYPE_META[displayType]) == null ? void 0 : _a.label) ?? displayType;
    const id = `${displayType}-${Date.now()}`;
    const count = layers.filter((l) => l.displayType === displayType).length + 1;
    setLayers((p) => [...p, {
      id,
      name: `Untitled ${baseName.toLowerCase()} ${count}`,
      type: "static",
      src: "",
      displayType,
      answers: [],
      applyOn: [sourceId]
    }]);
    setSelected({
      kind: "layer",
      id
    });
  };
  const convertLayerToQuestion = (layer, inputType) => {
    const {
      id,
      name
    } = layer;
    const answerOptions = (layer.answers ?? []).map((a) => ({
      value: a.id,
      label: a.label
    }));
    let newQ;
    switch (inputType) {
      case "thumbnail":
        newQ = {
          id,
          name,
          type: "thumbnail",
          displayType: layer.displayType ?? "image",
          swatches: (layer.answers ?? []).map((a) => ({
            value: a.id,
            label: a.label,
            imageUrl: a.thumbnailUrl
          }))
        };
        break;
      case "text":
        newQ = {
          id,
          name,
          type: "text",
          defaultText: "Your text",
          defaultColor: "#000000",
          defaultFontSize: 32,
          defaultFontFamily: "Roboto",
          position: {
            x: 200,
            y: 200
          }
        };
        break;
      case "label":
        newQ = {
          id,
          name,
          type: "label",
          content: "",
          answers: answerOptions,
          displayType: layer.displayType,
          multipleSelection: false
        };
        break;
      case "dropdown":
        newQ = {
          id,
          name,
          type: "dropdown",
          options: answerOptions
        };
        break;
      case "radio":
        newQ = {
          id,
          name,
          type: "radio",
          options: answerOptions
        };
        break;
      case "checkbox":
        newQ = {
          id,
          name,
          type: "checkbox",
          checkedLabel: "Yes",
          uncheckedLabel: "No",
          defaultChecked: false
        };
        break;
      case "file":
        newQ = {
          id,
          name,
          type: "file",
          displayType: "logo",
          position: {
            x: 200,
            y: 280
          },
          defaultWidth: 120,
          defaultHeight: 120,
          printAreas: [],
          allowedTransforms: {
            move: true,
            resize: true,
            rotate: false
          }
        };
        break;
      case "color": {
        const first = layers.find((l) => l.type === "colorable" && l.id !== id);
        if (!first) {
          alert("Add a colorable layer first.");
          return;
        }
        newQ = {
          id,
          name,
          type: "color",
          linkedLayerId: first.id,
          swatches: []
        };
        break;
      }
      case "group":
        newQ = {
          id,
          name,
          type: "group",
          childIds: []
        };
        break;
      default:
        return;
    }
    setLayers((p) => p.filter((l) => l.id !== id));
    setQuestions((p) => [...p, newQ]);
    setSelected({
      kind: "question",
      id
    });
  };
  const createAndLinkQuestion = (inputType, layerId) => {
    const id = `q-${inputType}-${Date.now()}`;
    let newQ;
    switch (inputType) {
      case "thumbnail":
        newQ = {
          id,
          name: "Untitled image",
          type: "thumbnail",
          displayType: "image",
          swatches: []
        };
        break;
      case "text":
        newQ = {
          id,
          name: "Untitled text",
          type: "text",
          defaultText: "Your text",
          defaultColor: "#000000",
          defaultFontSize: 32,
          defaultFontFamily: "Roboto",
          position: {
            x: 200,
            y: 200
          }
        };
        break;
      default:
        return;
    }
    setQuestions((p) => [...p, newQ]);
    setLayers((p) => p.map((l) => l.id === layerId ? {
      ...l,
      applyOn: [...l.applyOn ?? [], id]
    } : l));
  };
  const handleSave = () => {
    var _a;
    const fd = new FormData();
    fd.append("layers", JSON.stringify(layers));
    fd.append("questions", JSON.stringify(questions));
    fd.append("logicRules", JSON.stringify(logicRules));
    fd.append("productName", customTitle || product.title);
    fd.append("productImageUrl", ((_a = product.featuredImage) == null ? void 0 : _a.url) || "");
    fd.append("productHandle", product.handle || "");
    fd.append("numViews", String(numViews));
    fd.append("viewNames", JSON.stringify(viewNames));
    fd.append("canvasW", String(canvasW));
    fd.append("canvasH", String(canvasH));
    fd.append("modelMode", String(modelMode));
    if (glbUrl) fd.append("glbUrl", glbUrl);
    submit(fd, {
      method: "post"
    });
  };
  useEffect(() => {
    if (pendingPreview && navigation.state === "idle") {
      setPendingPreview(false);
      navigate(`/app/configurator/${encodeURIComponent(product.id)}`);
    }
  }, [navigation.state, pendingPreview]);
  const selQ = (selected == null ? void 0 : selected.kind) === "question" ? questions.find((q) => q.id === selected.id) : null;
  const selL = (selected == null ? void 0 : selected.kind) === "layer" ? layers.find((l) => l.id === selected.id) : null;
  return /* @__PURE__ */ jsxs("div", {
    style: {
      display: "flex",
      height: "100vh",
      overflow: "hidden",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      fontSize: 14,
      color: "#111827"
    },
    children: [showAddModal && /* @__PURE__ */ jsx(AddQuestionModal, {
      onAdd: (type, displayType) => {
        addQuestion(type, displayType);
        setAddToGroupId(null);
      },
      onClose: () => {
        setShowAddModal(false);
        setAddToGroupId(null);
      }
    }), showAddLayerModal && /* @__PURE__ */ jsx(AddLayerModal, {
      onAdd: (layerType, displayType) => addNewLayer(layerType, displayType),
      onClose: () => setShowAddLayerModal(false)
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        width: 268,
        borderRight: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#fff"
      },
      children: [/* @__PURE__ */ jsx("div", {
        style: {
          padding: "8px 12px 6px",
          display: "flex",
          alignItems: "center",
          background: "#fafafa",
          borderBottom: "1px solid #f3f4f6"
        },
        children: /* @__PURE__ */ jsxs(Link, {
          to: "/app/products",
          style: {
            fontSize: 12,
            color: "#6b7280",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontWeight: 500
          },
          children: [/* @__PURE__ */ jsx("svg", {
            width: "12",
            height: "12",
            viewBox: "0 0 12 12",
            fill: "none",
            children: /* @__PURE__ */ jsx("path", {
              d: "M7.5 2L4 6l3.5 4",
              stroke: "#9ca3af",
              strokeWidth: "1.5",
              strokeLinecap: "round",
              strokeLinejoin: "round"
            })
          }), "Products"]
        })
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          padding: "10px 12px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          gap: 10
        },
        children: [product.featuredImage ? /* @__PURE__ */ jsx("img", {
          src: product.featuredImage.url,
          alt: "",
          style: {
            width: 36,
            height: 36,
            objectFit: "cover",
            borderRadius: 8,
            flexShrink: 0,
            border: "1px solid #e5e7eb"
          }
        }) : /* @__PURE__ */ jsx("div", {
          style: {
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "#f3f4f6",
            border: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            flexShrink: 0
          },
          children: "📦"
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            flex: 1,
            minWidth: 0
          },
          children: [/* @__PURE__ */ jsx("div", {
            style: {
              fontWeight: 700,
              fontSize: 14,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: "#111827"
            },
            children: customTitle || product.title
          }), /* @__PURE__ */ jsx("div", {
            style: {
              fontSize: 11,
              color: "#9ca3af",
              marginTop: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            },
            children: product.handle
          })]
        })]
      }), /* @__PURE__ */ jsx("div", {
        style: {
          display: "flex",
          borderBottom: "1px solid #e5e7eb"
        },
        children: [{
          id: "layers",
          label: "Layers",
          icon: "≡"
        }, {
          id: "model",
          label: "3D",
          icon: "◎"
        }, {
          id: "settings",
          label: "Settings",
          icon: "⚙"
        }].map(({
          id,
          label: label2,
          icon
        }) => /* @__PURE__ */ jsxs("button", {
          onClick: () => {
            setLeftTab(id);
            if (id === "model") setModelMode(true);
          },
          style: {
            flex: 1,
            height: 38,
            border: "none",
            borderBottom: leftTab === id ? "2px solid #4f46e5" : "2px solid transparent",
            background: "none",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: leftTab === id ? 600 : 400,
            color: leftTab === id ? "#4f46e5" : "#6b7280",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            transition: "color 0.12s",
            marginBottom: -1
          },
          children: [/* @__PURE__ */ jsx("span", {
            style: {
              fontSize: 13,
              lineHeight: 1
            },
            children: icon
          }), /* @__PURE__ */ jsx("span", {
            style: {
              fontSize: 10
            },
            children: label2
          })]
        }, id))
      }), leftTab === "model" ? (
        /* ── 3D Model panel ──────────────────────────────────────────── */
        /* @__PURE__ */ jsxs("div", {
          style: {
            flex: 1,
            overflowY: "auto",
            padding: "14px 14px 20px"
          },
          children: [/* @__PURE__ */ jsxs("p", {
            style: {
              margin: "0 0 12px",
              fontSize: 12,
              color: "#6b7280",
              lineHeight: 1.6
            },
            children: ["Upload a ", /* @__PURE__ */ jsx("strong", {
              children: ".glb"
            }), " file. Detected mesh parts appear below — check which parts customers can customise, then link them to questions using the mesh name as the layer ID."]
          }), /* @__PURE__ */ jsx(GlbPartSetup, {
            glbUrl,
            parts: layers.filter((l) => l.type === "glb-part" || l.fromGlb),
            selectedPartId: (selected == null ? void 0 : selected.kind) === "layer" ? selected.id : null,
            onPartSelect: (id) => setSelected({
              kind: "layer",
              id
            }),
            onGlbUploaded: (url, detectedParts) => {
              setGlbUrl(url);
              setLayers((prev) => [...prev.filter((l) => !l.fromGlb && l.type !== "glb-part"), ...detectedParts]);
            },
            onPartsChange: (updatedParts) => {
              setLayers((prev) => [...prev.filter((l) => !l.fromGlb && l.type !== "glb-part"), ...updatedParts]);
            }
          })]
        })
      ) : leftTab === "settings" ? (
        /* ── Settings panel ─────────────────────────────────────────── */
        /* @__PURE__ */ jsxs("div", {
          style: {
            flex: 1,
            overflowY: "auto",
            padding: "14px 14px 20px"
          },
          children: [/* @__PURE__ */ jsxs("div", {
            style: {
              marginBottom: 20
            },
            children: [/* @__PURE__ */ jsx("label", {
              style: {
                display: "block",
                fontSize: 10,
                fontWeight: 700,
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 6
              },
              children: "Customizer title"
            }), /* @__PURE__ */ jsx("input", {
              value: customTitle,
              onChange: (e) => setCustomTitle(e.target.value),
              style: {
                display: "block",
                width: "100%",
                padding: "8px 10px",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                fontSize: 13,
                boxSizing: "border-box"
              }
            })]
          }), /* @__PURE__ */ jsxs("div", {
            style: {
              marginBottom: 20
            },
            children: [/* @__PURE__ */ jsxs("div", {
              style: {
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8
              },
              children: [/* @__PURE__ */ jsx("label", {
                style: {
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em"
                },
                children: "Product views"
              }), /* @__PURE__ */ jsx("button", {
                onClick: () => {
                  const defaults = ["Front", "Back", "Side", "Detail"];
                  setViewNames((prev) => [...prev, defaults[numViews] || `View ${numViews + 1}`]);
                  setNumViews((n) => n + 1);
                  setCurrentView(numViews);
                },
                style: {
                  background: "#4f46e5",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  padding: "3px 9px",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600
                },
                children: "+"
              })]
            }), /* @__PURE__ */ jsx("div", {
              style: {
                display: "flex",
                flexDirection: "column",
                gap: 5
              },
              children: Array.from({
                length: numViews
              }).map((_, vi) => /* @__PURE__ */ jsxs("div", {
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 8px",
                  background: currentView === vi ? "#eff6ff" : "#f9fafb",
                  border: currentView === vi ? "1px solid #93c5fd" : "1px solid #e5e7eb",
                  borderRadius: 6,
                  cursor: "pointer"
                },
                onClick: () => setCurrentView(vi),
                children: [/* @__PURE__ */ jsx("div", {
                  style: {
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: currentView === vi ? "#4f46e5" : "#e5e7eb",
                    color: currentView === vi ? "#fff" : "#6b7280",
                    fontSize: 10,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  },
                  children: vi + 1
                }), /* @__PURE__ */ jsx("input", {
                  value: viewNames[vi] ?? `View ${vi + 1}`,
                  onChange: (e) => {
                    e.stopPropagation();
                    setViewNames((prev) => {
                      const n = [...prev];
                      n[vi] = e.target.value;
                      return n;
                    });
                  },
                  onClick: (e) => e.stopPropagation(),
                  style: {
                    flex: 1,
                    border: "none",
                    background: "transparent",
                    fontSize: 13,
                    fontWeight: currentView === vi ? 600 : 400,
                    color: "#111827",
                    outline: "none",
                    padding: 0,
                    cursor: "text",
                    minWidth: 0
                  },
                  placeholder: `View ${vi + 1}`
                }), vi === 0 && /* @__PURE__ */ jsx("span", {
                  style: {
                    fontSize: 10,
                    color: "#9ca3af",
                    flexShrink: 0
                  },
                  children: "primary"
                }), numViews > 1 && vi === numViews - 1 && /* @__PURE__ */ jsx("button", {
                  onClick: (e) => {
                    e.stopPropagation();
                    setViewNames((prev) => prev.slice(0, -1));
                    setNumViews((n) => n - 1);
                    setCurrentView((v) => Math.min(v, numViews - 2));
                  },
                  style: {
                    background: "none",
                    border: "none",
                    color: "#d1d5db",
                    cursor: "pointer",
                    fontSize: 16,
                    padding: 0,
                    lineHeight: 1,
                    flexShrink: 0
                  },
                  children: "×"
                })]
              }, vi))
            })]
          }), /* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("label", {
              style: {
                display: "block",
                fontSize: 10,
                fontWeight: 700,
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 8
              },
              children: "Canvas size"
            }), /* @__PURE__ */ jsxs("div", {
              style: {
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8
              },
              children: [/* @__PURE__ */ jsxs("div", {
                children: [/* @__PURE__ */ jsx("label", {
                  style: {
                    fontSize: 11,
                    color: "#9ca3af",
                    display: "block",
                    marginBottom: 3
                  },
                  children: "Width"
                }), /* @__PURE__ */ jsxs("div", {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  },
                  children: [/* @__PURE__ */ jsx("input", {
                    type: "number",
                    value: canvasW,
                    onChange: (e) => setCanvasW(Number(e.target.value)),
                    min: 100,
                    max: 2e3,
                    style: {
                      flex: 1,
                      padding: "6px 8px",
                      border: "1px solid #e5e7eb",
                      borderRadius: 5,
                      fontSize: 12,
                      boxSizing: "border-box"
                    }
                  }), /* @__PURE__ */ jsx("span", {
                    style: {
                      fontSize: 10,
                      color: "#9ca3af"
                    },
                    children: "px"
                  })]
                })]
              }), /* @__PURE__ */ jsxs("div", {
                children: [/* @__PURE__ */ jsx("label", {
                  style: {
                    fontSize: 11,
                    color: "#9ca3af",
                    display: "block",
                    marginBottom: 3
                  },
                  children: "Height"
                }), /* @__PURE__ */ jsxs("div", {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  },
                  children: [/* @__PURE__ */ jsx("input", {
                    type: "number",
                    value: canvasH,
                    onChange: (e) => setCanvasH(Number(e.target.value)),
                    min: 100,
                    max: 2e3,
                    style: {
                      flex: 1,
                      padding: "6px 8px",
                      border: "1px solid #e5e7eb",
                      borderRadius: 5,
                      fontSize: 12,
                      boxSizing: "border-box"
                    }
                  }), /* @__PURE__ */ jsx("span", {
                    style: {
                      fontSize: 10,
                      color: "#9ca3af"
                    },
                    children: "px"
                  })]
                })]
              })]
            }), /* @__PURE__ */ jsxs("p", {
              style: {
                fontSize: 11,
                color: "#9ca3af",
                margin: "6px 0 0",
                lineHeight: 1.5
              },
              children: ["Canvas size should match your image resolution.", /* @__PURE__ */ jsx("br", {}), "Max recommended: 1200×1200 px."]
            })]
          })]
        })
      ) : (
        /* ── Layers panel ───────────────────────────────────────────── */
        /* @__PURE__ */ jsxs("div", {
          style: {
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0
          },
          children: [/* @__PURE__ */ jsxs("div", {
            style: {
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              borderBottom: "2px solid #e5e7eb"
            },
            children: [/* @__PURE__ */ jsxs("div", {
              style: {
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px 6px",
                flexShrink: 0
              },
              children: [/* @__PURE__ */ jsx("span", {
                style: {
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#6b7280"
                },
                children: "Questions"
              }), /* @__PURE__ */ jsx("button", {
                onClick: () => setShowAddModal(true),
                title: "Add question",
                style: {
                  background: "#4f46e5",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "3px 10px",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600
                },
                children: "+ Add"
              })]
            }), /* @__PURE__ */ jsxs("div", {
              style: {
                flex: 1,
                overflowY: "auto",
                minHeight: 0
              },
              children: [questions.length === 0 && /* @__PURE__ */ jsx("p", {
                style: {
                  padding: "8px 14px",
                  fontSize: 12,
                  color: "#9ca3af",
                  margin: 0
                },
                children: 'No questions yet. Click "Add" to create one.'
              }), (() => {
                const childIdsInGroups = new Set(questions.filter((q) => q.type === "group").flatMap((q) => q.childIds));
                return questions.map((q, idx) => {
                  var _a;
                  if (childIdsInGroups.has(q.id)) return null;
                  if (q.type === "group") {
                    const gq = q;
                    const isExpanded = expandedGroups.has(q.id);
                    return /* @__PURE__ */ jsxs("div", {
                      children: [/* @__PURE__ */ jsx(GroupRow, {
                        q: gq,
                        selected: (selected == null ? void 0 : selected.id) === q.id,
                        expanded: isExpanded,
                        onToggle: () => toggleGroup(q.id),
                        onSelect: () => setSelected({
                          kind: "question",
                          id: q.id
                        }),
                        onDelete: () => removeQ(q.id),
                        onAddChild: () => {
                          setAddToGroupId(q.id);
                          setShowAddModal(true);
                        },
                        isDragging: dragQId === q.id,
                        isDragOver: dragOverQId === q.id && dragQId !== q.id,
                        onDragStart: () => handleQDragStart(q.id),
                        onDragOver: (e) => handleQDragOver(e, q.id),
                        onDrop: () => handleQDrop(q.id),
                        onDragEnd: handleQDragEnd
                      }), isExpanded && gq.childIds.map((childId) => {
                        var _a2;
                        const child = questions.find((oq) => oq.id === childId);
                        if (!child) return null;
                        return /* @__PURE__ */ jsx("div", {
                          style: {
                            paddingLeft: 18,
                            borderLeft: "2px solid #e5e7eb",
                            marginLeft: 18
                          },
                          children: /* @__PURE__ */ jsx(QuestionRow, {
                            q: child,
                            selected: (selected == null ? void 0 : selected.id) === child.id,
                            layerName: child.type === "color" || child.type === "thumbnail" ? (_a2 = layers.find((l) => l.id === child.linkedLayerId)) == null ? void 0 : _a2.name : void 0,
                            onSelect: () => setSelected({
                              kind: "question",
                              id: child.id
                            }),
                            onDuplicate: () => duplicateQ(child.id),
                            onDelete: () => removeQ(child.id),
                            isDragging: dragQId === child.id,
                            isDragOver: dragOverQId === child.id && dragQId !== child.id,
                            onDragStart: () => handleQDragStart(child.id),
                            onDragOver: (e) => handleQDragOver(e, child.id),
                            onDrop: () => handleQDrop(child.id),
                            onDragEnd: handleQDragEnd
                          })
                        }, childId);
                      })]
                    }, q.id);
                  }
                  return /* @__PURE__ */ jsxs("div", {
                    children: [/* @__PURE__ */ jsx(QuestionRow, {
                      q,
                      selected: (selected == null ? void 0 : selected.id) === q.id,
                      layerName: q.type === "color" || q.type === "thumbnail" ? (_a = layers.find((l) => l.id === q.linkedLayerId)) == null ? void 0 : _a.name : void 0,
                      onSelect: () => {
                        setSelected({
                          kind: "question",
                          id: q.id
                        });
                        setEditingPrintAreaId(null);
                      },
                      onDuplicate: () => duplicateQ(q.id),
                      onDelete: () => removeQ(q.id),
                      isDragging: dragQId === q.id,
                      isDragOver: dragOverQId === q.id && dragQId !== q.id,
                      onDragStart: () => handleQDragStart(q.id),
                      onDragOver: (e) => handleQDragOver(e, q.id),
                      onDrop: () => handleQDrop(q.id),
                      onDragEnd: handleQDragEnd
                    }), q.type === "file" && (q.printAreas ?? []).map((pa) => /* @__PURE__ */ jsxs("div", {
                      onClick: () => {
                        setSelected({
                          kind: "question",
                          id: q.id
                        });
                        setEditingPrintAreaId(pa.id);
                      },
                      style: {
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "5px 10px 5px 40px",
                        cursor: "pointer",
                        background: editingPrintAreaId === pa.id ? "#eff6ff" : "transparent"
                      },
                      children: [/* @__PURE__ */ jsx("span", {
                        style: {
                          fontSize: 11
                        },
                        children: "🖨"
                      }), /* @__PURE__ */ jsxs("span", {
                        style: {
                          fontSize: 12,
                          color: "#6b7280"
                        },
                        children: ["↳ ", pa.name]
                      })]
                    }, pa.id))]
                  }, q.id);
                });
              })()]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            style: {
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0
            },
            children: [/* @__PURE__ */ jsxs("div", {
              style: {
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px 6px",
                flexShrink: 0
              },
              children: [/* @__PURE__ */ jsx("span", {
                style: {
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#6b7280"
                },
                children: "Behind the scene"
              }), /* @__PURE__ */ jsx("button", {
                onClick: () => setShowAddLayerModal(true),
                style: {
                  background: "#f3f4f6",
                  border: "none",
                  borderRadius: 6,
                  padding: "3px 9px",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#374151"
                },
                children: "+"
              })]
            }), /* @__PURE__ */ jsx("div", {
              style: {
                flex: 1,
                overflowY: "auto",
                minHeight: 0
              },
              children: layers.filter((l) => l.type !== "glb-part").map((l, idx) => {
                const forwardNames = (l.applyOn ?? []).map((qid) => {
                  var _a;
                  return (_a = questions.find((q) => q.id === qid)) == null ? void 0 : _a.name;
                }).filter(Boolean);
                const reverseNames = questions.filter((q) => {
                  var _a;
                  return (_a = q.applyOn) == null ? void 0 : _a.includes(l.id);
                }).map((q) => q.name);
                const allLinkedNames = [.../* @__PURE__ */ new Set([...forwardNames, ...reverseNames])];
                return /* @__PURE__ */ jsx(LayerRow, {
                  layer: l,
                  selected: (selected == null ? void 0 : selected.id) === l.id,
                  linkedNames: allLinkedNames,
                  onSelect: () => setSelected({
                    kind: "layer",
                    id: l.id
                  }),
                  onRemove: () => removeL(l.id),
                  isDragging: dragLId === l.id,
                  isDragOver: dragOverLId === l.id && dragLId !== l.id,
                  onDragStart: () => handleLDragStart(l.id),
                  onDragOver: (e) => handleLDragOver(e, l.id),
                  onDrop: () => handleLDrop(l.id),
                  onDragEnd: handleLDragEnd
                }, l.id);
              })
            })]
          })]
        })
      ), /* @__PURE__ */ jsx("div", {
        style: {
          padding: "10px 14px",
          borderTop: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
          gap: 6
        },
        children: config && /* @__PURE__ */ jsx("button", {
          onClick: () => {
            handleSave();
            setPendingPreview(true);
          },
          disabled: pendingPreview,
          style: {
            fontSize: 12,
            color: "#2563eb",
            textDecoration: "none",
            background: "none",
            border: "none",
            padding: 0,
            cursor: pendingPreview ? "wait" : "pointer"
          },
          children: pendingPreview ? "Saving…" : "Preview customer view →"
        })
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: "#f3f4f6",
        overflow: "hidden"
      },
      children: [/* @__PURE__ */ jsxs("div", {
        style: {
          height: 46,
          background: "#fff",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 0
        },
        children: [/* @__PURE__ */ jsx("button", {
          onClick: () => setShowLogicPanel(false),
          style: {
            height: 46,
            padding: "0 16px",
            background: "none",
            border: "none",
            borderBottom: showLogicPanel ? "2px solid transparent" : "2px solid #4f46e5",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            color: showLogicPanel ? "#9ca3af" : "#4f46e5",
            marginBottom: -1,
            whiteSpace: "nowrap"
          },
          children: "Build"
        }), /* @__PURE__ */ jsx(Link, {
          to: `/app/pricing/${encodeURIComponent(product.id)}`,
          prefetch: "intent",
          style: {
            height: 46,
            padding: "0 16px",
            display: "flex",
            alignItems: "center",
            fontSize: 13,
            fontWeight: 400,
            color: "#6b7280",
            textDecoration: "none",
            borderBottom: "2px solid transparent",
            whiteSpace: "nowrap"
          },
          children: "Pricing"
        }), /* @__PURE__ */ jsx(Link, {
          to: `/app/variants/${encodeURIComponent(product.id)}`,
          prefetch: "intent",
          style: {
            height: 46,
            padding: "0 16px",
            display: "flex",
            alignItems: "center",
            fontSize: 13,
            fontWeight: 400,
            color: "#6b7280",
            textDecoration: "none",
            borderBottom: "2px solid transparent",
            whiteSpace: "nowrap"
          },
          children: "Variants"
        }), /* @__PURE__ */ jsx("div", {
          style: {
            flex: 1
          }
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 8
          },
          children: [/* @__PURE__ */ jsx(Link, {
            to: `/app/configurator-style/${encodeURIComponent(product.id)}`,
            style: {
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              color: "#5c6ac4",
              fontSize: 12,
              fontWeight: 500,
              textDecoration: "none",
              padding: "5px 12px",
              borderRadius: 6,
              border: "1px solid #e0d9ff",
              background: "#f5f3ff",
              whiteSpace: "nowrap"
            },
            children: "Style"
          }), /* @__PURE__ */ jsxs("button", {
            onClick: () => setShowLogicPanel((v) => !v),
            style: {
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              background: showLogicPanel ? "#4f46e5" : "#f3f4f6",
              color: showLogicPanel ? "#fff" : "#374151",
              border: "none",
              borderRadius: 6,
              padding: "5px 12px",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: "nowrap"
            },
            children: ["Logic ", logicRules.length > 0 && /* @__PURE__ */ jsx("span", {
              style: {
                background: showLogicPanel ? "rgba(255,255,255,0.3)" : "#4f46e5",
                color: "#fff",
                borderRadius: 10,
                fontSize: 11,
                padding: "0 5px",
                minWidth: 16,
                textAlign: "center"
              },
              children: logicRules.length
            })]
          }), (actionData == null ? void 0 : actionData.success) && /* @__PURE__ */ jsx("span", {
            style: {
              background: "#d1fae5",
              color: "#065f46",
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: "nowrap"
            },
            children: "✓ Saved"
          })]
        })]
      }), !showLogicPanel && (selQ == null ? void 0 : selQ.type) === "text" && /* @__PURE__ */ jsx(TextCanvasToolbar, {
        tq: selQ,
        onUpdate: updateQ
      }), showLogicPanel && /* @__PURE__ */ jsx(LogicPanel, {
        rules: logicRules,
        questions,
        layers,
        onChange: setLogicRules,
        onBack: () => setShowLogicPanel(false)
      }), !showLogicPanel && /* @__PURE__ */ jsxs("div", {
        style: {
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "auto",
          padding: 24,
          position: "relative"
        },
        children: [numViews > 1 && /* @__PURE__ */ jsx("button", {
          onClick: () => setCurrentView((v) => Math.max(0, v - 1)),
          disabled: currentView === 0,
          style: {
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
            width: 34,
            height: 34,
            borderRadius: "50%",
            border: "1px solid #e5e7eb",
            background: currentView === 0 ? "#f3f4f6" : "#fff",
            cursor: currentView === 0 ? "default" : "pointer",
            fontSize: 20,
            color: currentView === 0 ? "#d1d5db" : "#374151",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.1)"
          },
          children: "‹"
        }), mounted ? /* @__PURE__ */ jsxs("div", {
          style: {
            position: "relative",
            borderRadius: 6,
            overflow: "hidden"
          },
          children: [modelMode && glbUrl ? /* @__PURE__ */ jsx(ThreeViewer, {
            glbUrl,
            parts: layers,
            customizations: adminPreviewCustomizations,
            width: displayW,
            height: displayH,
            selectedPartId: (selected == null ? void 0 : selected.kind) === "layer" ? selected.id : null,
            onPartClick: (meshName) => setSelected({
              kind: "layer",
              id: meshName
            })
          }) : /* @__PURE__ */ jsxs(Fragment, {
            children: [layers.length === 0 && /* @__PURE__ */ jsxs("div", {
              style: {
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                color: "#9ca3af",
                zIndex: 1,
                pointerEvents: "none"
              },
              children: [/* @__PURE__ */ jsx("div", {
                style: {
                  fontSize: 40
                },
                children: "🎨"
              }), /* @__PURE__ */ jsxs("p", {
                style: {
                  margin: 0,
                  fontSize: 13,
                  textAlign: "center",
                  lineHeight: 1.5,
                  padding: "0 20px"
                },
                children: ["Add layers using the ", /* @__PURE__ */ jsx("strong", {
                  children: "+"
                }), " button in the left panel."]
              })]
            }), /* @__PURE__ */ jsx(Stage, {
              width: displayW,
              height: displayH,
              style: {
                display: "block"
              },
              children: /* @__PURE__ */ jsxs(Layer, {
                scaleX: canvasDisplayScale,
                scaleY: canvasDisplayScale,
                children: [labelPreviewImages && (() => {
                  const src = labelPreviewImages[currentView] || labelPreviewImages.find(Boolean) || "";
                  return src ? /* @__PURE__ */ jsx(ProductLayer, {
                    src,
                    width: canvasW,
                    height: canvasH
                  }) : null;
                })(), layers.map((layer) => {
                  const imgOverride = canvasImageOverrides[layer.id];
                  let layerSrc;
                  if (imgOverride) {
                    const slot = imgOverride[currentView];
                    layerSrc = slot != null && slot !== "" ? slot : imgOverride.find((s) => s !== "" && s != null) ?? getLayerSrc(layer, currentView, layerPreviewAnswerIdx[layer.id] ?? 0);
                  } else {
                    layerSrc = getLayerSrc(layer, currentView, layerPreviewAnswerIdx[layer.id] ?? 0);
                  }
                  return /* @__PURE__ */ jsx(ProductLayer, {
                    src: layerSrc,
                    color: canvasColors[layer.id],
                    textureUrl: canvasTextures[layer.id],
                    width: canvasW,
                    height: canvasH
                  }, layer.id);
                }), textItems.filter((q) => !q.printArea && q.displayType !== "none").map((q) => /* @__PURE__ */ jsx(Text, {
                  ref: (node) => {
                    textNodeRefs.current[q.id] = node;
                  },
                  text: q.defaultText,
                  x: q.position.x * S,
                  y: q.position.y * S,
                  fontSize: q.defaultFontSize * S,
                  fontFamily: q.defaultFontFamily,
                  fill: q.defaultColor,
                  align: q.textAlign ?? "left",
                  rotation: q.rotation ?? 0,
                  draggable: true,
                  onClick: () => setSelected({
                    kind: "question",
                    id: q.id
                  }),
                  onDragEnd: (e) => {
                    updateQ({
                      ...q,
                      position: {
                        x: Math.round(e.target.x() / S),
                        y: Math.round(e.target.y() / S)
                      }
                    });
                  },
                  onTransformEnd: (e) => {
                    updateQ({
                      ...q,
                      position: {
                        x: Math.round(e.target.x() / S),
                        y: Math.round(e.target.y() / S)
                      },
                      rotation: Math.round(e.target.rotation())
                    });
                  }
                }, q.id)), (() => {
                  if ((selected == null ? void 0 : selected.kind) !== "question") return null;
                  const selQuestion = questions.find((q) => q.id === selected.id);
                  if (!selQuestion) return null;
                  if (selQuestion.type === "text") {
                    const tq = selQuestion;
                    if (tq.displayType === "none") return null;
                    const pa = tq.printArea;
                    if (!pa || !pa.visibleViews.includes(currentView + 1)) return null;
                    const isActive = editingPrintAreaId === pa.id;
                    return /* @__PURE__ */ jsxs(Group, {
                      ref: (node) => {
                        printAreaGroupRefs.current[pa.id] = node;
                      },
                      x: pa.x * S,
                      y: pa.y * S,
                      rotation: pa.rotation ?? 0,
                      draggable: true,
                      onClick: () => {
                        setSelected({
                          kind: "question",
                          id: tq.id
                        });
                        setEditingPrintAreaId(pa.id);
                      },
                      onDragEnd: (e) => {
                        const nx = Math.round(e.target.x() / S);
                        const ny = Math.round(e.target.y() / S);
                        updateQ({
                          ...tq,
                          position: {
                            x: nx,
                            y: ny
                          },
                          printArea: {
                            ...pa,
                            x: nx,
                            y: ny
                          }
                        });
                      },
                      onTransformEnd: (e) => {
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
                          position: {
                            x: newX,
                            y: newY
                          },
                          printArea: {
                            ...pa,
                            x: newX,
                            y: newY,
                            width: newW,
                            height: newH,
                            rotation: newRot
                          }
                        });
                      },
                      children: [/* @__PURE__ */ jsx(Rect, {
                        width: pa.width * S,
                        height: pa.height * S,
                        fill: isActive ? "rgba(59,130,246,0.08)" : "rgba(59,130,246,0.03)",
                        stroke: pa.showOutline ? pa.outlineColor : "#3b82f6",
                        strokeWidth: isActive ? 2 : 1.5,
                        dash: [6, 3]
                      }), /* @__PURE__ */ jsx(Text, {
                        text: tq.defaultText || tq.name,
                        x: 4,
                        y: Math.max(4, (pa.height * S - tq.defaultFontSize * S) / 2),
                        width: pa.width * S - 8,
                        fontSize: tq.defaultFontSize * S,
                        fontFamily: tq.defaultFontFamily,
                        fill: tq.defaultColor,
                        align: tq.textAlign ?? "left",
                        wrap: "none",
                        listening: false
                      })]
                    }, pa.id);
                  }
                  if (selQuestion.type === "file") {
                    const fq = selQuestion;
                    return (fq.printAreas ?? []).filter((pa) => pa.visibleViews.includes(currentView + 1)).map((pa) => /* @__PURE__ */ jsx(Rect, {
                      x: pa.x * S,
                      y: pa.y * S,
                      width: pa.width * S,
                      height: pa.height * S,
                      rotation: pa.rotation ?? 0,
                      fill: editingPrintAreaId === pa.id ? "rgba(59,130,246,0.08)" : "rgba(59,130,246,0.03)",
                      stroke: pa.showOutline ? pa.outlineColor : "#3b82f6",
                      strokeWidth: editingPrintAreaId === pa.id ? 2 : 1.5,
                      dash: [6, 3],
                      listening: false
                    }, pa.id));
                  }
                  return null;
                })(), filePlaceholders.map((fq) => {
                  const fqTyped = fq;
                  const fqAreas = fqTyped.printAreas ?? [];
                  const visibleOnView = fqAreas.length === 0 || fqAreas.some((pa) => pa.visibleViews.includes(currentView + 1));
                  if (!visibleOnView) return null;
                  if (fqTyped.displayType === "logo") {
                    const t = fqTyped.allowedTransforms ?? {
                      move: true
                    };
                    const w = fqTyped.defaultWidth * S;
                    const h = fqTyped.defaultHeight * S;
                    return /* @__PURE__ */ jsxs(Group, {
                      ref: (node) => {
                        logoNodeRefs.current[fqTyped.id] = node;
                      },
                      x: fqTyped.position.x * S,
                      y: fqTyped.position.y * S,
                      rotation: fqTyped.rotation ?? 0,
                      draggable: t.move,
                      onClick: () => setSelected({
                        kind: "question",
                        id: fqTyped.id
                      }),
                      onDragEnd: (e) => {
                        updateQ({
                          ...fqTyped,
                          position: {
                            x: Math.round(e.target.x() / S),
                            y: Math.round(e.target.y() / S)
                          }
                        });
                      },
                      onTransformEnd: (e) => {
                        const node = logoNodeRefs.current[fqTyped.id];
                        if (!node) return;
                        const sx = node.scaleX();
                        const sy = node.scaleY();
                        node.scaleX(1);
                        node.scaleY(1);
                        updateQ({
                          ...fqTyped,
                          position: {
                            x: Math.round(node.x() / S),
                            y: Math.round(node.y() / S)
                          },
                          defaultWidth: Math.max(20, Math.round(fqTyped.defaultWidth * sx)),
                          defaultHeight: Math.max(20, Math.round(fqTyped.defaultHeight * sy)),
                          rotation: Math.round(node.rotation())
                        });
                      },
                      children: [/* @__PURE__ */ jsx(Rect, {
                        width: w,
                        height: h,
                        fill: "rgba(59,130,246,0.08)",
                        stroke: "#3b82f6",
                        strokeWidth: 1.5,
                        dash: [6, 3]
                      }), /* @__PURE__ */ jsx(Text, {
                        text: "LOGO",
                        width: w,
                        height: h,
                        align: "center",
                        verticalAlign: "middle",
                        fontSize: 13,
                        fill: "#3b82f6",
                        fontStyle: "bold",
                        listening: false
                      })]
                    }, fqTyped.id);
                  }
                  return /* @__PURE__ */ jsx(Rect, {
                    x: fq.position.x * S,
                    y: fq.position.y * S,
                    width: fq.defaultWidth * S,
                    height: fq.defaultHeight * S,
                    fill: "#f3f4f6",
                    stroke: "#9ca3af",
                    strokeWidth: 1,
                    dash: [5, 3],
                    listening: false
                  }, fq.id);
                }), (() => {
                  const selQ2 = (selected == null ? void 0 : selected.kind) === "question" ? questions.find((q) => q.id === selected.id) : null;
                  const isLogo = (selQ2 == null ? void 0 : selQ2.type) === "file" && selQ2.displayType === "logo";
                  const logoT = isLogo ? selQ2.allowedTransforms ?? {
                    resize: true,
                    rotate: false
                  } : null;
                  return /* @__PURE__ */ jsxs(Fragment, {
                    children: [/* @__PURE__ */ jsx(Transformer, {
                      ref: transformerRef,
                      rotateEnabled: isLogo ? (logoT == null ? void 0 : logoT.rotate) ?? false : true,
                      resizeEnabled: isLogo ? (logoT == null ? void 0 : logoT.resize) ?? true : false,
                      keepRatio: false,
                      rotationSnaps: [0, 45, 90, 135, 180, 225, 270, 315],
                      anchorSize: 8,
                      borderDash: [4, 4],
                      borderStroke: "#3b82f6",
                      anchorFill: "#fff",
                      anchorStroke: "#3b82f6"
                    }), /* @__PURE__ */ jsx(Transformer, {
                      ref: printAreaTransformerRef,
                      rotateEnabled: false,
                      resizeEnabled: true,
                      keepRatio: false,
                      anchorSize: 9,
                      borderDash: [4, 4],
                      borderStroke: "#2563eb",
                      anchorFill: "#fff",
                      anchorStroke: "#2563eb",
                      anchorCornerRadius: 2,
                      boundBoxFunc: (old, nw) => nw.width < 20 || nw.height < 10 ? old : nw
                    })]
                  });
                })()]
              })
            })]
          }), " "]
        }) : /* @__PURE__ */ jsx("div", {
          style: {
            width: displayW,
            height: displayH,
            background: "#e5e7eb",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#9ca3af",
            fontSize: 14
          },
          children: "Loading canvas…"
        }), numViews > 1 && /* @__PURE__ */ jsx("button", {
          onClick: () => setCurrentView((v) => Math.min(numViews - 1, v + 1)),
          disabled: currentView === numViews - 1,
          style: {
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
            width: 34,
            height: 34,
            borderRadius: "50%",
            border: "1px solid #e5e7eb",
            background: currentView === numViews - 1 ? "#f3f4f6" : "#fff",
            cursor: currentView === numViews - 1 ? "default" : "pointer",
            fontSize: 20,
            color: currentView === numViews - 1 ? "#d1d5db" : "#374151",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.1)"
          },
          children: "›"
        })]
      }), !showLogicPanel && /* @__PURE__ */ jsxs("div", {
        style: {
          background: "#f3f4f6",
          borderTop: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          padding: "6px 12px",
          overflowX: "auto"
        },
        children: [Array.from({
          length: numViews
        }).map((_, vi) => /* @__PURE__ */ jsx("button", {
          onClick: () => setCurrentView(vi),
          style: {
            height: 28,
            padding: "0 12px",
            borderRadius: 6,
            border: "none",
            background: vi === currentView ? "#4f46e5" : "#fff",
            color: vi === currentView ? "#fff" : "#6b7280",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: vi === currentView ? 600 : 400,
            whiteSpace: "nowrap",
            boxShadow: vi === currentView ? "0 1px 4px rgba(79,70,229,0.3)" : "0 1px 2px rgba(0,0,0,0.06)",
            transition: "background 0.12s"
          },
          children: viewNames[vi] || `View ${vi + 1}`
        }, vi)), /* @__PURE__ */ jsx("button", {
          onClick: () => {
            const defaults = ["Front", "Back", "Side", "Detail"];
            setViewNames((prev) => [...prev, defaults[numViews] || `View ${numViews + 1}`]);
            setNumViews((n) => n + 1);
            setCurrentView(numViews);
          },
          style: {
            height: 28,
            width: 28,
            borderRadius: 6,
            border: "1px dashed #d1d5db",
            background: "none",
            cursor: "pointer",
            fontSize: 16,
            color: "#9ca3af",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            flexShrink: 0
          },
          title: "Add view",
          children: "+"
        }), numViews > 1 && /* @__PURE__ */ jsx("button", {
          onClick: () => {
            setViewNames((prev) => prev.slice(0, -1));
            setNumViews((n) => n - 1);
            setCurrentView((v) => Math.min(v, numViews - 2));
          },
          style: {
            height: 28,
            width: 28,
            borderRadius: 6,
            border: "1px dashed #fca5a5",
            background: "none",
            cursor: "pointer",
            fontSize: 14,
            color: "#ef4444",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            flexShrink: 0
          },
          title: "Remove last view",
          children: "−"
        })]
      }), /* @__PURE__ */ jsx("div", {
        style: {
          height: 58,
          background: "#fff",
          borderTop: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12
        },
        children: /* @__PURE__ */ jsx("button", {
          onClick: handleSave,
          style: {
            padding: "10px 40px",
            background: "#4f46e5",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
            letterSpacing: "0.01em",
            boxShadow: "0 1px 6px rgba(79,70,229,0.35)"
          },
          children: "Save Configuration"
        })
      })]
    }), answerEditState && (selQ == null ? void 0 : selQ.type) === "thumbnail" && (() => {
      const tq = selQ;
      const swatch = tq.swatches[answerEditState.answerIdx];
      if (!swatch) return null;
      return /* @__PURE__ */ jsx("div", {
        style: {
          width: 300,
          borderLeft: "1px solid #e5e7eb",
          background: "#fff",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          flexShrink: 0
        },
        children: /* @__PURE__ */ jsx(AnswerDetailPanel, {
          swatch,
          numViews,
          displayType: tq.displayType ?? "image",
          onDone: () => setAnswerEditState(null),
          onChange: (updated) => {
            updateQ({
              ...tq,
              swatches: tq.swatches.map((s, i) => i === answerEditState.answerIdx ? updated : s)
            });
            if ((tq.displayType ?? "image") === "color") {
              setSelectedSwatches((p) => ({
                ...p,
                [tq.id]: updated.value
              }));
            }
          }
        })
      });
    })(), answerEditState && (selQ == null ? void 0 : selQ.type) === "dropdown" && selQ.displayType === "image" && (() => {
      const dq = selQ;
      const opt = dq.options[answerEditState.answerIdx];
      if (!opt) return null;
      const asSwatch = {
        value: opt.value,
        label: opt.label,
        imageUrl: opt.thumbnailUrl,
        viewImages: opt.viewImages,
        description: opt.description,
        productionCode: opt.productionCode
      };
      return /* @__PURE__ */ jsx("div", {
        style: {
          width: 300,
          borderLeft: "1px solid #e5e7eb",
          background: "#fff",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          flexShrink: 0
        },
        children: /* @__PURE__ */ jsx(AnswerDetailPanel, {
          swatch: asSwatch,
          numViews,
          displayType: "image",
          onDone: () => setAnswerEditState(null),
          onChange: (updated) => {
            var _a;
            const firstViewImg = ((_a = updated.viewImages) == null ? void 0 : _a.find(Boolean)) ?? null;
            const updatedOpt = {
              value: updated.value,
              label: updated.label,
              thumbnailUrl: updated.imageUrl ?? firstViewImg ?? void 0,
              viewImages: updated.viewImages,
              description: updated.description,
              productionCode: updated.productionCode
            };
            updateQ({
              ...dq,
              options: dq.options.map((o, i) => i === answerEditState.answerIdx ? updatedOpt : o)
            });
          }
        })
      });
    })(), (() => {
      if (!editingPrintAreaId) return null;
      if ((selQ == null ? void 0 : selQ.type) === "text") {
        const tq = selQ;
        if (!tq.printArea || tq.printArea.id !== editingPrintAreaId) return null;
        return /* @__PURE__ */ jsx(PrintAreaPanel, {
          area: tq.printArea,
          numViews,
          layers,
          onClose: () => setEditingPrintAreaId(null),
          onDelete: () => {
            updateQ({
              ...tq,
              printArea: void 0
            });
            setEditingPrintAreaId(null);
          },
          onChange: (updated) => updateQ({
            ...tq,
            printArea: updated
          }),
          onViewChange: (v) => setCurrentView(Math.min(v - 1, numViews - 1))
        });
      }
      if ((selQ == null ? void 0 : selQ.type) !== "file") return null;
      const fq = selQ;
      const pa = (fq.printAreas ?? []).find((p) => p.id === editingPrintAreaId);
      if (!pa) return null;
      return /* @__PURE__ */ jsx(PrintAreaPanel, {
        area: pa,
        numViews,
        layers,
        onClose: () => setEditingPrintAreaId(null),
        onDelete: () => {
          updateQ({
            ...fq,
            printAreas: (fq.printAreas ?? []).filter((p) => p.id !== editingPrintAreaId)
          });
          setEditingPrintAreaId(null);
        },
        onChange: (updated) => updateQ({
          ...fq,
          printAreas: (fq.printAreas ?? []).map((p) => p.id === updated.id ? updated : p)
        }),
        onViewChange: (v) => setCurrentView(Math.min(v - 1, numViews - 1))
      });
    })(), /* @__PURE__ */ jsxs("div", {
      style: {
        width: 300,
        borderLeft: "1px solid #e5e7eb",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      },
      children: [(selQ == null ? void 0 : selQ.type) === "thumbnail" ? /* @__PURE__ */ jsxs("div", {
        style: {
          padding: "11px 16px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "#fafafa"
        },
        children: [/* @__PURE__ */ jsx("span", {
          style: {
            fontWeight: 700,
            fontSize: 13,
            color: "#4f46e5",
            borderBottom: "2px solid #4f46e5",
            paddingBottom: 2
          },
          children: "Question"
        }), /* @__PURE__ */ jsx("button", {
          onClick: () => removeQ(selQ.id),
          style: {
            marginLeft: "auto",
            background: "none",
            border: "1px solid #fca5a5",
            color: "#ef4444",
            borderRadius: 6,
            padding: "3px 10px",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 500
          },
          children: "Remove"
        })]
      }) : /* @__PURE__ */ jsxs("div", {
        style: {
          padding: "11px 16px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "#fafafa"
        },
        children: [/* @__PURE__ */ jsx("span", {
          style: {
            fontWeight: 700,
            fontSize: 13,
            color: "#111827"
          },
          children: selQ ? "Question" : selL ? "Layer" : "Properties"
        }), (selQ || selL) && /* @__PURE__ */ jsx("button", {
          onClick: () => {
            if (selQ) removeQ(selQ.id);
            else if (selL) removeL(selL.id);
          },
          style: {
            marginLeft: "auto",
            background: "none",
            border: "1px solid #fca5a5",
            color: "#ef4444",
            borderRadius: 6,
            padding: "3px 10px",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 500
          },
          children: "Remove"
        })]
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          flex: 1,
          overflowY: "auto"
        },
        children: [!selected && /* @__PURE__ */ jsxs("div", {
          style: {
            padding: "48px 24px",
            textAlign: "center"
          },
          children: [/* @__PURE__ */ jsx("div", {
            style: {
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "#f5f3ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
              fontSize: 22
            },
            children: "🎛️"
          }), /* @__PURE__ */ jsx("p", {
            style: {
              margin: "0 0 6px",
              fontSize: 14,
              fontWeight: 600,
              color: "#374151"
            },
            children: "No selection"
          }), /* @__PURE__ */ jsxs("p", {
            style: {
              margin: 0,
              fontSize: 13,
              color: "#9ca3af",
              lineHeight: 1.6
            },
            children: ["Select a ", /* @__PURE__ */ jsx("strong", {
              style: {
                color: "#4f46e5"
              },
              children: "question"
            }), " or ", /* @__PURE__ */ jsx("strong", {
              style: {
                color: "#4f46e5"
              },
              children: "layer"
            }), " in the left panel to configure it here."]
          })]
        }), selQ && selQ.type === "thumbnail" && /* @__PURE__ */ jsx(ThumbnailEditor, {
          q: selQ,
          layers,
          questions,
          numViews,
          onChange: updateQ,
          onEditAnswer: (idx) => setAnswerEditState({
            questionId: selQ.id,
            answerIdx: idx
          }),
          editingIdx: (answerEditState == null ? void 0 : answerEditState.questionId) === selQ.id ? (answerEditState == null ? void 0 : answerEditState.answerIdx) ?? null : null,
          onSwitchType: (t) => switchQuestionType(selQ.id, t),
          onPreview: (value) => setSelectedSwatches((p) => ({
            ...p,
            [selQ.id]: value
          }))
        }), selQ && selQ.type === "color" && /* @__PURE__ */ jsx(SwatchEditor, {
          q: selQ,
          layers,
          onChange: updateQ,
          previewValue: selectedSwatches[selQ.id],
          onPreview: (value) => setSelectedSwatches((p) => ({
            ...p,
            [selQ.id]: value
          }))
        }), selQ && selQ.type === "text" && /* @__PURE__ */ jsx(TextEditor, {
          q: selQ,
          layers,
          onChange: updateQ,
          onSwitchType: (t) => switchQuestionType(selQ.id, t),
          onCreateSubQuestion: addTextSubQuestion,
          onEditPrintArea: () => {
            const pa = selQ.printArea;
            if (pa) setEditingPrintAreaId(pa.id);
          }
        }), selQ && selQ.type === "file" && /* @__PURE__ */ jsx(FileEditor, {
          q: selQ,
          onChange: updateQ,
          onSwitchType: (t) => switchQuestionType(selQ.id, t),
          onEditPrintArea: (paId) => setEditingPrintAreaId(paId)
        }), selQ && selQ.type === "dropdown" && /* @__PURE__ */ jsx(DropdownEditor, {
          q: selQ,
          numViews,
          onChange: updateQ,
          onEditAnswer: (idx) => setAnswerEditState({
            questionId: selQ.id,
            answerIdx: idx
          }),
          editingIdx: (answerEditState == null ? void 0 : answerEditState.questionId) === selQ.id ? (answerEditState == null ? void 0 : answerEditState.answerIdx) ?? null : null
        }), selQ && selQ.type === "radio" && /* @__PURE__ */ jsx(RadioEditor, {
          q: selQ,
          onChange: updateQ
        }), selQ && selQ.type === "checkbox" && /* @__PURE__ */ jsx(CheckboxEditor, {
          q: selQ,
          onChange: updateQ
        }), selQ && selQ.type === "label" && /* @__PURE__ */ jsx(LabelEditor, {
          q: selQ,
          numViews,
          onChange: updateQ,
          onSwitchType: (newType) => switchQuestionType(selQ.id, newType),
          onAnswerPreview: (images) => setLabelPreviewImages(images)
        }), selQ && selQ.type === "group" && /* @__PURE__ */ jsx(GroupEditorComp, {
          q: selQ,
          questions,
          onChange: updateQ,
          onAddElement: () => {
            setAddToGroupId(selQ.id);
            setShowAddModal(true);
          }
        }), selQ && selQ.type === "none" && /* @__PURE__ */ jsxs("div", {
          style: {
            padding: "12px 16px 8px"
          },
          children: [/* @__PURE__ */ jsx("label", {
            style: labelSt,
            children: "Title"
          }), /* @__PURE__ */ jsx("input", {
            value: selQ.name,
            onChange: (e) => updateQ({
              ...selQ,
              name: e.target.value
            }),
            style: inputSt
          })]
        }), selQ && !["thumbnail", "label", "file"].includes(selQ.type) && /* @__PURE__ */ jsx(UniversalInputDisplayRow, {
          q: selQ,
          onChange: updateQ,
          onSwitchType: (t) => switchQuestionType(selQ.id, t)
        }), selL && selL.type === "glb-part" ? (
          /* GLB part — show mesh info instead of image upload */
          /* @__PURE__ */ jsxs("div", {
            style: {
              padding: "16px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 14
            },
            children: [/* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsx("label", {
                style: labelSt,
                children: "Mesh ID (use as Layer ID in questions)"
              }), /* @__PURE__ */ jsx("div", {
                style: {
                  ...inputSt,
                  background: "#f3f4f6",
                  userSelect: "all",
                  fontFamily: "monospace",
                  fontSize: 12
                },
                children: selL.id
              })]
            }), /* @__PURE__ */ jsxs("div", {
              children: [/* @__PURE__ */ jsx("label", {
                style: labelSt,
                children: "Display name"
              }), /* @__PURE__ */ jsx("input", {
                style: inputSt,
                value: selL.name,
                onChange: (e) => updateL({
                  ...selL,
                  name: e.target.value
                })
              })]
            }), /* @__PURE__ */ jsxs("p", {
              style: {
                margin: 0,
                fontSize: 12,
                color: "#6b7280",
                lineHeight: 1.6
              },
              children: ["This is a 3D mesh part. To customise it, create a ", /* @__PURE__ */ jsx("strong", {
                children: "Color"
              }), " or ", /* @__PURE__ */ jsx("strong", {
                children: "Thumbnail"
              }), " question and set its layer ID to ", /* @__PURE__ */ jsx("code", {
                style: {
                  background: "#f3f4f6",
                  padding: "1px 4px",
                  borderRadius: 3
                },
                children: selL.id
              }), "."]
            })]
          })
        ) : selL ? /* @__PURE__ */ jsx(LayerEditorComp, {
          layer: selL,
          numViews,
          onChange: updateL,
          layers,
          questions,
          onAddLinkedLayer: addLinkedLayer,
          onConvertToQuestion: convertLayerToQuestion,
          onCreateAndLinkQuestion: createAndLinkQuestion,
          onAnswerPreview: (idx) => setLayerPreviewAnswerIdx((p) => ({
            ...p,
            [selL.id]: idx ?? 0
          }))
        }) : null]
      })]
    })]
  });
});
const route13 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$9,
  default: app_configuratorSetup_$productId,
  loader: loader$7
}, Symbol.toStringTag, { value: "Module" }));
async function loader$6({
  request,
  params
}) {
  await authenticate.admin(request);
  const decodedId = decodeURIComponent(params.productId);
  const config = await prisma.productConfig.findUnique({
    where: {
      productId: decodedId
    }
  });
  const opts = (config == null ? void 0 : config.options) ?? {};
  return {
    productId: decodedId,
    productName: (config == null ? void 0 : config.productName) ?? "Product",
    style: {
      ...DEFAULT_STYLE,
      ...opts.configuratorStyle ?? {}
    }
  };
}
async function action$8({
  request,
  params
}) {
  await authenticate.admin(request);
  const decodedId = decodeURIComponent(params.productId);
  const formData = await request.formData();
  const style = JSON.parse(formData.get("style"));
  const config = await prisma.productConfig.findUnique({
    where: {
      productId: decodedId
    }
  });
  if (!config) return {
    error: "Config not found"
  };
  const existingOpts = config.options ?? {};
  await prisma.productConfig.update({
    where: {
      productId: decodedId
    },
    data: {
      options: {
        ...existingOpts,
        configuratorStyle: style
      }
    }
  });
  return {
    success: true
  };
}
const app_configuratorStyle_$productId = UNSAFE_withComponentProps(function ConfiguratorStylePage() {
  const {
    productId,
    productName,
    style: initStyle
  } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigate = useNavigate();
  const [style, setStyle] = useState(initStyle);
  const update = useCallback((patch) => setStyle((s) => ({
    ...s,
    ...patch
  })), []);
  const handleSave = () => {
    const fd = new FormData();
    fd.append("style", JSON.stringify(style));
    submit(fd, {
      method: "post"
    });
  };
  return /* @__PURE__ */ jsx(Page, {
    title: "Configurator Style",
    subtitle: productName,
    backAction: {
      content: "Setup",
      onAction: () => navigate(`/app/configurator-setup/${encodeURIComponent(productId)}`)
    },
    primaryAction: /* @__PURE__ */ jsx(Button, {
      variant: "primary",
      onClick: handleSave,
      children: "Save Style"
    }),
    secondaryActions: [{
      content: "Preview",
      onAction: () => navigate(`/app/configurator/${encodeURIComponent(productId)}`)
    }],
    children: /* @__PURE__ */ jsxs(BlockStack, {
      gap: "500",
      children: [actionData && "success" in actionData && /* @__PURE__ */ jsx(Banner, {
        tone: "success",
        title: "Style saved successfully!"
      }), actionData && "error" in actionData && /* @__PURE__ */ jsx(Banner, {
        tone: "critical",
        title: actionData.error
      }), /* @__PURE__ */ jsxs(Layout, {
        children: [/* @__PURE__ */ jsx(Layout.Section, {
          variant: "oneThird",
          children: /* @__PURE__ */ jsx(Card, {
            children: /* @__PURE__ */ jsxs(BlockStack, {
              gap: "400",
              children: [/* @__PURE__ */ jsx(Text$1, {
                variant: "headingMd",
                as: "h2",
                children: "Live Preview"
              }), /* @__PURE__ */ jsx(Divider, {}), /* @__PURE__ */ jsx(StylePreview, {
                style
              })]
            })
          })
        }), /* @__PURE__ */ jsx(Layout.Section, {
          children: /* @__PURE__ */ jsxs(BlockStack, {
            gap: "400",
            children: [/* @__PURE__ */ jsx(Card, {
              children: /* @__PURE__ */ jsxs(BlockStack, {
                gap: "400",
                children: [/* @__PURE__ */ jsxs(InlineStack, {
                  gap: "200",
                  blockAlign: "center",
                  children: [/* @__PURE__ */ jsx("div", {
                    style: {
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "#fef3c7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    },
                    children: "🎨"
                  }), /* @__PURE__ */ jsx(Text$1, {
                    variant: "headingMd",
                    as: "h3",
                    children: "Color Swatches"
                  })]
                }), /* @__PURE__ */ jsx(Divider, {}), /* @__PURE__ */ jsxs(BlockStack, {
                  gap: "300",
                  children: [/* @__PURE__ */ jsx(Text$1, {
                    variant: "bodyMd",
                    fontWeight: "semibold",
                    as: "p",
                    children: "Shape"
                  }), /* @__PURE__ */ jsx("div", {
                    style: {
                      display: "flex",
                      gap: 12
                    },
                    children: [{
                      value: "circle",
                      label: "Circle",
                      preview: "50%"
                    }, {
                      value: "rounded",
                      label: "Rounded",
                      preview: "8px"
                    }, {
                      value: "square",
                      label: "Square",
                      preview: "3px"
                    }].map(({
                      value,
                      label: label2,
                      preview
                    }) => /* @__PURE__ */ jsx(ShapeOption, {
                      active: style.swatchShape === value,
                      label: label2,
                      onClick: () => update({
                        swatchShape: value
                      }),
                      shape: preview,
                      color: "#5c6ac4",
                      size: 36
                    }, value))
                  })]
                }), /* @__PURE__ */ jsxs(BlockStack, {
                  gap: "300",
                  children: [/* @__PURE__ */ jsx(Text$1, {
                    variant: "bodyMd",
                    fontWeight: "semibold",
                    as: "p",
                    children: "Size"
                  }), /* @__PURE__ */ jsx("div", {
                    style: {
                      display: "flex",
                      gap: 12
                    },
                    children: [{
                      value: "sm",
                      label: "Small",
                      px: 26
                    }, {
                      value: "md",
                      label: "Medium",
                      px: 36
                    }, {
                      value: "lg",
                      label: "Large",
                      px: 46
                    }].map(({
                      value,
                      label: label2,
                      px
                    }) => /* @__PURE__ */ jsx(SizeOption, {
                      active: style.swatchSize === value,
                      label: label2,
                      onClick: () => update({
                        swatchSize: value
                      }),
                      size: px,
                      shape: style.swatchShape === "circle" ? "50%" : style.swatchShape === "square" ? "3px" : "8px",
                      color: "#5c6ac4"
                    }, value))
                  })]
                })]
              })
            }), /* @__PURE__ */ jsx(Card, {
              children: /* @__PURE__ */ jsxs(BlockStack, {
                gap: "400",
                children: [/* @__PURE__ */ jsxs(InlineStack, {
                  gap: "200",
                  blockAlign: "center",
                  children: [/* @__PURE__ */ jsx("div", {
                    style: {
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "#ede9fe",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    },
                    children: "🖼️"
                  }), /* @__PURE__ */ jsx(Text$1, {
                    variant: "headingMd",
                    as: "h3",
                    children: "Thumbnail Swatches"
                  })]
                }), /* @__PURE__ */ jsx(Divider, {}), /* @__PURE__ */ jsxs(BlockStack, {
                  gap: "300",
                  children: [/* @__PURE__ */ jsx(Text$1, {
                    variant: "bodyMd",
                    fontWeight: "semibold",
                    as: "p",
                    children: "Shape"
                  }), /* @__PURE__ */ jsx("div", {
                    style: {
                      display: "flex",
                      gap: 12
                    },
                    children: [{
                      value: "circle",
                      label: "Circle",
                      preview: "50%"
                    }, {
                      value: "rounded",
                      label: "Rounded",
                      preview: "10px"
                    }, {
                      value: "square",
                      label: "Square",
                      preview: "3px"
                    }].map(({
                      value,
                      label: label2,
                      preview
                    }) => /* @__PURE__ */ jsx(ShapeOption, {
                      active: style.thumbnailShape === value,
                      label: label2,
                      onClick: () => update({
                        thumbnailShape: value
                      }),
                      shape: preview,
                      color: "#8b5cf6",
                      size: 48,
                      isThumb: true
                    }, value))
                  })]
                }), /* @__PURE__ */ jsxs(BlockStack, {
                  gap: "300",
                  children: [/* @__PURE__ */ jsx(Text$1, {
                    variant: "bodyMd",
                    fontWeight: "semibold",
                    as: "p",
                    children: "Size"
                  }), /* @__PURE__ */ jsx("div", {
                    style: {
                      display: "flex",
                      gap: 12
                    },
                    children: [{
                      value: "sm",
                      label: "Small",
                      px: 44
                    }, {
                      value: "md",
                      label: "Medium",
                      px: 56
                    }, {
                      value: "lg",
                      label: "Large",
                      px: 70
                    }].map(({
                      value,
                      label: label2,
                      px
                    }) => /* @__PURE__ */ jsx(SizeOption, {
                      active: style.thumbnailSize === value,
                      label: label2,
                      onClick: () => update({
                        thumbnailSize: value
                      }),
                      size: px,
                      shape: style.thumbnailShape === "circle" ? "50%" : style.thumbnailShape === "square" ? "3px" : "10px",
                      color: "#8b5cf6"
                    }, value))
                  })]
                }), /* @__PURE__ */ jsx(BlockStack, {
                  gap: "200",
                  children: /* @__PURE__ */ jsxs(InlineStack, {
                    gap: "200",
                    blockAlign: "center",
                    children: [/* @__PURE__ */ jsx("input", {
                      type: "checkbox",
                      id: "showLabels",
                      checked: style.showLabels,
                      onChange: (e) => update({
                        showLabels: e.target.checked
                      }),
                      style: {
                        width: 16,
                        height: 16,
                        accentColor: "#5c6ac4",
                        cursor: "pointer"
                      }
                    }), /* @__PURE__ */ jsx("label", {
                      htmlFor: "showLabels",
                      style: {
                        fontSize: 14,
                        cursor: "pointer",
                        color: "#374151"
                      },
                      children: "Show name label under thumbnail"
                    })]
                  })
                })]
              })
            }), /* @__PURE__ */ jsx(Card, {
              children: /* @__PURE__ */ jsxs(BlockStack, {
                gap: "400",
                children: [/* @__PURE__ */ jsxs(InlineStack, {
                  gap: "200",
                  blockAlign: "center",
                  children: [/* @__PURE__ */ jsx("div", {
                    style: {
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "#dcfce7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    },
                    children: "☑️"
                  }), /* @__PURE__ */ jsx(Text$1, {
                    variant: "headingMd",
                    as: "h3",
                    children: "Choice Buttons (Radio / Label)"
                  })]
                }), /* @__PURE__ */ jsx(Divider, {}), /* @__PURE__ */ jsx("div", {
                  style: {
                    display: "flex",
                    gap: 12
                  },
                  children: [{
                    value: "pill",
                    label: "Pill",
                    desc: "Rounded badge style"
                  }, {
                    value: "card",
                    label: "Card",
                    desc: "Box card with border"
                  }, {
                    value: "classic",
                    label: "Classic",
                    desc: "Radio dot + label"
                  }].map(({
                    value,
                    label: label2,
                    desc
                  }) => /* @__PURE__ */ jsx(ChoiceStyleOption, {
                    active: style.choiceStyle === value,
                    label: label2,
                    desc,
                    value,
                    onClick: () => update({
                      choiceStyle: value
                    }),
                    accentColor: style.accentColor
                  }, value))
                })]
              })
            }), /* @__PURE__ */ jsx(Card, {
              children: /* @__PURE__ */ jsxs(BlockStack, {
                gap: "400",
                children: [/* @__PURE__ */ jsxs(InlineStack, {
                  gap: "200",
                  blockAlign: "center",
                  children: [/* @__PURE__ */ jsx("div", {
                    style: {
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "#fee2e2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    },
                    children: "🛒"
                  }), /* @__PURE__ */ jsx(Text$1, {
                    variant: "headingMd",
                    as: "h3",
                    children: "Add to Cart Button"
                  })]
                }), /* @__PURE__ */ jsx(Divider, {}), /* @__PURE__ */ jsx("div", {
                  style: {
                    display: "flex",
                    gap: 12
                  },
                  children: [{
                    value: "default",
                    label: "Default",
                    radius: "10px"
                  }, {
                    value: "pill",
                    label: "Pill",
                    radius: "50px"
                  }, {
                    value: "square",
                    label: "Square",
                    radius: "4px"
                  }].map(({
                    value,
                    label: label2,
                    radius
                  }) => /* @__PURE__ */ jsx("button", {
                    onClick: () => update({
                      buttonRadius: value
                    }),
                    style: {
                      flex: 1,
                      padding: "10px 0",
                      cursor: "pointer",
                      borderRadius: radius,
                      background: style.buttonRadius === value ? `linear-gradient(135deg, ${style.accentColor}, ${adjustColor(style.accentColor, -20)})` : "#f3f4f6",
                      color: style.buttonRadius === value ? "#fff" : "#6b7280",
                      border: style.buttonRadius === value ? "none" : "1.5px solid #e5e7eb",
                      fontWeight: 600,
                      fontSize: 13,
                      transition: "all 0.15s"
                    },
                    children: label2
                  }, value))
                })]
              })
            }), /* @__PURE__ */ jsx(Card, {
              children: /* @__PURE__ */ jsxs(BlockStack, {
                gap: "400",
                children: [/* @__PURE__ */ jsxs(InlineStack, {
                  gap: "200",
                  blockAlign: "center",
                  children: [/* @__PURE__ */ jsx("div", {
                    style: {
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: style.accentColor + "22",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    },
                    children: "🎨"
                  }), /* @__PURE__ */ jsx(Text$1, {
                    variant: "headingMd",
                    as: "h3",
                    children: "Accent Color"
                  }), /* @__PURE__ */ jsx(Box, {
                    paddingInlineStart: "200",
                    children: /* @__PURE__ */ jsx(Badge, {
                      tone: "info",
                      children: "Selected state color"
                    })
                  })]
                }), /* @__PURE__ */ jsx(Divider, {}), /* @__PURE__ */ jsxs(BlockStack, {
                  gap: "300",
                  children: [/* @__PURE__ */ jsx(Text$1, {
                    variant: "bodySm",
                    tone: "subdued",
                    as: "p",
                    children: "Used for selected borders, radio dots, checked states, and the Add to Cart button gradient."
                  }), /* @__PURE__ */ jsxs("div", {
                    style: {
                      display: "flex",
                      gap: 12,
                      alignItems: "center"
                    },
                    children: [/* @__PURE__ */ jsx("input", {
                      type: "color",
                      value: style.accentColor,
                      onChange: (e) => update({
                        accentColor: e.target.value
                      }),
                      style: {
                        width: 48,
                        height: 48,
                        border: "1.5px solid #e5e7eb",
                        borderRadius: 8,
                        cursor: "pointer",
                        padding: 2
                      }
                    }), /* @__PURE__ */ jsx("div", {
                      style: {
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap"
                      },
                      children: ["#5c6ac4", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#111827"].map((c) => /* @__PURE__ */ jsx("button", {
                        onClick: () => update({
                          accentColor: c
                        }),
                        title: c,
                        style: {
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: c,
                          border: "none",
                          cursor: "pointer",
                          outline: style.accentColor === c ? `3px solid ${c}` : "none",
                          outlineOffset: 2,
                          transition: "outline 0.1s"
                        }
                      }, c))
                    })]
                  }), /* @__PURE__ */ jsxs("div", {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      background: "#f9fafb",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb"
                    },
                    children: [/* @__PURE__ */ jsx("span", {
                      style: {
                        fontSize: 12,
                        color: "#6b7280",
                        fontWeight: 500
                      },
                      children: "Hex:"
                    }), /* @__PURE__ */ jsx("input", {
                      value: style.accentColor,
                      onChange: (e) => {
                        if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) update({
                          accentColor: e.target.value
                        });
                      },
                      style: {
                        border: "none",
                        background: "transparent",
                        fontSize: 13,
                        fontFamily: "monospace",
                        outline: "none",
                        flex: 1,
                        color: "#111827"
                      },
                      maxLength: 7
                    })]
                  })]
                })]
              })
            })]
          })
        })]
      })]
    })
  });
});
function adjustColor(hex, amount) {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, (num >> 8 & 255) + amount));
  const b = Math.max(0, Math.min(255, (num & 255) + amount));
  return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
}
function StylePreview({
  style
}) {
  const swatchRadius = style.swatchShape === "circle" ? "50%" : style.swatchShape === "square" ? "4px" : "8px";
  const swatchPx = style.swatchSize === "sm" ? 26 : style.swatchSize === "md" ? 36 : 46;
  const thumbRadius = style.thumbnailShape === "circle" ? "50%" : style.thumbnailShape === "square" ? "4px" : "10px";
  const thumbPx = style.thumbnailSize === "sm" ? 44 : style.thumbnailSize === "md" ? 56 : 70;
  const btnRadius = style.buttonRadius === "pill" ? "50px" : style.buttonRadius === "square" ? "4px" : "10px";
  const colors = ["#f9f9f9", "#1a1a1a", "#9ca3af", "#d4a27a", "#f97316", "#ec4899", "#eab308"];
  const thumbColors = ["#e0e7ff", "#bfdbfe", "#a7f3d0", "#fde68a"];
  return /* @__PURE__ */ jsxs(BlockStack, {
    gap: "400",
    children: [/* @__PURE__ */ jsxs(BlockStack, {
      gap: "200",
      children: [/* @__PURE__ */ jsx(Text$1, {
        variant: "bodySm",
        tone: "subdued",
        as: "p",
        children: "COLOR SWATCHES"
      }), /* @__PURE__ */ jsx("div", {
        style: {
          display: "flex",
          gap: 8,
          flexWrap: "wrap"
        },
        children: colors.map((c, i) => /* @__PURE__ */ jsx("div", {
          style: {
            width: swatchPx,
            height: swatchPx,
            borderRadius: swatchRadius,
            background: c,
            border: i === 0 ? `3px solid ${style.accentColor}` : "2px solid #e5e7eb",
            outline: i === 0 ? `3px solid ${style.accentColor}22` : "none",
            outlineOffset: 1,
            transition: "all 0.15s"
          }
        }, c))
      })]
    }), /* @__PURE__ */ jsx(Divider, {}), /* @__PURE__ */ jsxs(BlockStack, {
      gap: "200",
      children: [/* @__PURE__ */ jsx(Text$1, {
        variant: "bodySm",
        tone: "subdued",
        as: "p",
        children: "THUMBNAIL SWATCHES"
      }), /* @__PURE__ */ jsx("div", {
        style: {
          display: "flex",
          gap: 8,
          flexWrap: "wrap"
        },
        children: thumbColors.map((c, i) => /* @__PURE__ */ jsxs(BlockStack, {
          gap: "100",
          children: [/* @__PURE__ */ jsx("div", {
            style: {
              width: thumbPx,
              height: thumbPx,
              borderRadius: thumbRadius,
              background: c,
              border: i === 0 ? `3px solid ${style.accentColor}` : "2px solid #e5e7eb",
              outline: i === 0 ? `3px solid ${style.accentColor}22` : "none",
              outlineOffset: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden"
            },
            children: /* @__PURE__ */ jsx("span", {
              style: {
                fontSize: thumbPx > 50 ? 18 : 14
              },
              children: "🎨"
            })
          }), style.showLabels && /* @__PURE__ */ jsxs(Text$1, {
            variant: "bodySm",
            tone: "subdued",
            as: "p",
            alignment: "center",
            children: ["Opt ", i + 1]
          })]
        }, c))
      })]
    }), /* @__PURE__ */ jsx(Divider, {}), /* @__PURE__ */ jsxs(BlockStack, {
      gap: "200",
      children: [/* @__PURE__ */ jsx(Text$1, {
        variant: "bodySm",
        tone: "subdued",
        as: "p",
        children: "CHOICES"
      }), /* @__PURE__ */ jsx("div", {
        style: {
          display: "flex",
          flexDirection: "column",
          gap: 8
        },
        children: ["None", "Finger Pad", "Finger Hood"].map((label2, i) => /* @__PURE__ */ jsx(ChoicePreviewItem, {
          label: label2,
          active: i === 0,
          style: style.choiceStyle,
          accentColor: style.accentColor
        }, label2))
      })]
    }), /* @__PURE__ */ jsx(Divider, {}), /* @__PURE__ */ jsxs(BlockStack, {
      gap: "200",
      children: [/* @__PURE__ */ jsx(Text$1, {
        variant: "bodySm",
        tone: "subdued",
        as: "p",
        children: "ADD TO CART"
      }), /* @__PURE__ */ jsx("button", {
        style: {
          width: "100%",
          padding: "12px",
          background: `linear-gradient(135deg, ${style.accentColor}, ${adjustColor(style.accentColor, -20)})`,
          color: "#fff",
          border: "none",
          borderRadius: btnRadius,
          fontWeight: 700,
          fontSize: 14,
          cursor: "default",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8
        },
        children: "🛒 Add to Cart"
      })]
    })]
  });
}
function ShapeOption({
  active,
  label: label2,
  onClick,
  shape,
  color,
  size,
  isThumb = false
}) {
  return /* @__PURE__ */ jsxs("button", {
    onClick,
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 8,
      padding: "14px 8px",
      border: active ? `2px solid ${color}` : "1.5px solid #e5e7eb",
      borderRadius: 10,
      background: active ? color + "0f" : "#fff",
      cursor: "pointer",
      transition: "all 0.15s"
    },
    children: [/* @__PURE__ */ jsx("div", {
      style: {
        width: size,
        height: size,
        borderRadius: shape,
        background: isThumb ? color + "30" : color,
        border: isThumb ? `2px solid ${color}` : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      },
      children: isThumb && /* @__PURE__ */ jsx("span", {
        style: {
          fontSize: 14
        },
        children: "🎨"
      })
    }), /* @__PURE__ */ jsx("span", {
      style: {
        fontSize: 12,
        fontWeight: active ? 700 : 500,
        color: active ? color : "#6b7280"
      },
      children: label2
    })]
  });
}
function SizeOption({
  active,
  label: label2,
  onClick,
  size,
  shape,
  color
}) {
  return /* @__PURE__ */ jsxs("button", {
    onClick,
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 10,
      padding: "14px 8px",
      border: active ? `2px solid ${color}` : "1.5px solid #e5e7eb",
      borderRadius: 10,
      background: active ? color + "0f" : "#fff",
      cursor: "pointer",
      transition: "all 0.15s"
    },
    children: [/* @__PURE__ */ jsx("div", {
      style: {
        width: size,
        height: size,
        borderRadius: shape,
        background: color
      }
    }), /* @__PURE__ */ jsx("span", {
      style: {
        fontSize: 12,
        fontWeight: active ? 700 : 500,
        color: active ? color : "#6b7280"
      },
      children: label2
    })]
  });
}
function ChoiceStyleOption({
  active,
  label: label2,
  desc,
  value,
  onClick,
  accentColor
}) {
  return /* @__PURE__ */ jsxs("button", {
    onClick,
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      padding: "14px 10px",
      border: active ? `2px solid ${accentColor}` : "1.5px solid #e5e7eb",
      borderRadius: 10,
      background: active ? accentColor + "0f" : "#fff",
      cursor: "pointer",
      transition: "all 0.15s",
      textAlign: "left"
    },
    children: [/* @__PURE__ */ jsx(ChoicePreviewItem, {
      label: "Option",
      active: true,
      style: value,
      accentColor,
      compact: true
    }), /* @__PURE__ */ jsxs("div", {
      children: [/* @__PURE__ */ jsx("div", {
        style: {
          fontSize: 12,
          fontWeight: active ? 700 : 600,
          color: active ? accentColor : "#374151"
        },
        children: label2
      }), /* @__PURE__ */ jsx("div", {
        style: {
          fontSize: 11,
          color: "#9ca3af",
          marginTop: 2
        },
        children: desc
      })]
    })]
  });
}
function ChoicePreviewItem({
  label: label2,
  active,
  style: choiceStyle,
  accentColor,
  compact = false
}) {
  if (choiceStyle === "classic") {
    return /* @__PURE__ */ jsxs("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: compact ? "4px 0" : "8px 0"
      },
      children: [/* @__PURE__ */ jsx("div", {
        style: {
          width: 18,
          height: 18,
          borderRadius: "50%",
          border: `2px solid ${active ? accentColor : "#d1d5db"}`,
          background: active ? accentColor : "transparent",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        },
        children: active && /* @__PURE__ */ jsx("div", {
          style: {
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#fff"
          }
        })
      }), /* @__PURE__ */ jsx("span", {
        style: {
          fontSize: compact ? 12 : 13,
          fontWeight: active ? 600 : 400,
          color: active ? accentColor : "#374151"
        },
        children: label2
      })]
    });
  }
  if (choiceStyle === "card") {
    return /* @__PURE__ */ jsx("div", {
      style: {
        padding: compact ? "6px 10px" : "9px 14px",
        borderRadius: 8,
        border: `${active ? 2 : 1.5}px solid ${active ? accentColor : "#e5e7eb"}`,
        background: active ? accentColor + "12" : "#fff",
        display: "flex",
        alignItems: "center",
        gap: 8
      },
      children: /* @__PURE__ */ jsx("span", {
        style: {
          fontSize: compact ? 12 : 13,
          fontWeight: active ? 600 : 400,
          color: active ? accentColor : "#374151"
        },
        children: label2
      })
    });
  }
  return /* @__PURE__ */ jsx("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      padding: compact ? "5px 12px" : "8px 18px",
      borderRadius: 20,
      border: `${active ? 2 : 1.5}px solid ${active ? accentColor : "#d1d5db"}`,
      background: active ? accentColor + "12" : "#fff"
    },
    children: /* @__PURE__ */ jsx("span", {
      style: {
        fontSize: compact ? 12 : 13,
        fontWeight: active ? 600 : 500,
        color: active ? accentColor : "#374151"
      },
      children: label2
    })
  });
}
const route14 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$8,
  default: app_configuratorStyle_$productId,
  loader: loader$6
}, Symbol.toStringTag, { value: "Module" }));
const CANVAS_SIZE = 800;
const COORD_SCALE = CANVAS_SIZE / 800;
async function loader$5({
  request,
  params
}) {
  const {
    admin,
    session
  } = await authenticate.admin(request);
  const decodedId = decodeURIComponent(params.productId);
  const shop = session.shop;
  const [productResponse, config, appSettingsRecord] = await Promise.all([admin.graphql(`query GetProduct($id: ID!) {
        product(id: $id) {
          id title handle
          featuredImage { url }
          variants(first: 20) { edges { node { id title price } } }
        }
      }`, {
    variables: {
      id: decodedId
    }
  }), prisma.productConfig.findUnique({
    where: {
      productId: decodedId
    }
  }), prisma.appSettings.findUnique({
    where: {
      shop
    }
  })]);
  const productJson = await productResponse.json();
  const appSettings = {
    ...DEFAULT_APP_SETTINGS,
    ...(appSettingsRecord == null ? void 0 : appSettingsRecord.settings) ?? {}
  };
  const opts = (config == null ? void 0 : config.options) ?? {};
  const configuratorStyle = {
    ...DEFAULT_STYLE,
    swatchShape: appSettings.swatchShape,
    swatchSize: appSettings.swatchSize,
    ...opts.configuratorStyle ?? {}
  };
  const modelMode = opts.modelMode === true;
  const glbUrl = opts.glbUrl;
  return {
    product: productJson.data.product,
    config,
    appSettings,
    configuratorStyle,
    modelMode,
    glbUrl
  };
}
function isVisible(q, selectedAnswers, hiddenQuestions) {
  var _a;
  if (hiddenQuestions == null ? void 0 : hiddenQuestions.has(q.id)) return false;
  if (!((_a = q.conditions) == null ? void 0 : _a.length)) return true;
  return q.conditions.every((c) => selectedAnswers[c.questionId] === c.value);
}
function getEffectiveLayerIds(q) {
  if (q.linkedLayerId) return [q.linkedLayerId];
  return q.applyOn ?? [];
}
function AdminImageDropdown({
  q,
  selectedVals,
  onToggle,
  onHoverImages,
  qLabel
}) {
  const [open, setOpen] = useState(false);
  const selectedOpts = q.options.filter((o) => selectedVals.includes(o.value));
  const getThumb = (o) => {
    var _a;
    return o.thumbnailUrl ?? ((_a = o.viewImages) == null ? void 0 : _a.find(Boolean)) ?? null;
  };
  return /* @__PURE__ */ jsxs("div", {
    style: {
      marginTop: 22,
      position: "relative"
    },
    children: [/* @__PURE__ */ jsx("div", {
      style: qLabel,
      children: q.name
    }), /* @__PURE__ */ jsxs("button", {
      onClick: () => setOpen((v) => !v),
      style: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "9px 12px",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        background: "#fff",
        cursor: "pointer",
        fontSize: 14,
        textAlign: "left"
      },
      children: [selectedOpts.length === 0 ? /* @__PURE__ */ jsx("span", {
        style: {
          color: "#9ca3af",
          flex: 1
        },
        children: "— select —"
      }) : /* @__PURE__ */ jsx("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 6,
          flex: 1,
          flexWrap: "wrap"
        },
        children: selectedOpts.map((o) => {
          const thumb = getThumb(o);
          return /* @__PURE__ */ jsxs("div", {
            style: {
              display: "flex",
              alignItems: "center",
              gap: 5
            },
            children: [thumb && /* @__PURE__ */ jsx("img", {
              src: thumb,
              alt: o.label,
              style: {
                width: 26,
                height: 26,
                objectFit: "cover",
                borderRadius: 3,
                border: "1px solid #e5e7eb"
              }
            }), /* @__PURE__ */ jsx("span", {
              children: o.label
            })]
          }, o.value);
        })
      }), /* @__PURE__ */ jsx("span", {
        style: {
          color: "#9ca3af",
          fontSize: 10
        },
        children: open ? "▲" : "▼"
      })]
    }), open && /* @__PURE__ */ jsx("div", {
      style: {
        position: "fixed",
        inset: 0,
        zIndex: 98
      },
      onClick: () => {
        setOpen(false);
        onHoverImages == null ? void 0 : onHoverImages(null);
      }
    }), open && /* @__PURE__ */ jsx("div", {
      style: {
        position: "absolute",
        top: "100%",
        left: 0,
        right: 0,
        zIndex: 99,
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
        overflow: "hidden",
        marginTop: 4
      },
      children: q.options.map((o) => {
        var _a;
        const thumb = getThumb(o);
        const isSelected = selectedVals.includes(o.value);
        const hasViewImages = (_a = o.viewImages) == null ? void 0 : _a.some(Boolean);
        return /* @__PURE__ */ jsxs("button", {
          onClick: () => {
            onToggle(o.value);
            if (!q.multipleSelection) setOpen(false);
          },
          onMouseEnter: () => hasViewImages ? onHoverImages == null ? void 0 : onHoverImages(o.viewImages) : void 0,
          onMouseLeave: () => onHoverImages == null ? void 0 : onHoverImages(null),
          style: {
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            padding: "10px 14px",
            border: "none",
            cursor: "pointer",
            fontSize: 14,
            background: isSelected ? "#eff6ff" : "#fff",
            textAlign: "left",
            borderBottom: "1px solid #f3f4f6"
          },
          children: [thumb ? /* @__PURE__ */ jsx("img", {
            src: thumb,
            alt: o.label,
            style: {
              width: 40,
              height: 40,
              objectFit: "cover",
              borderRadius: 6,
              border: `2px solid ${isSelected ? "#3b82f6" : "#e5e7eb"}`,
              flexShrink: 0
            }
          }) : /* @__PURE__ */ jsx("span", {
            style: {
              width: 40,
              height: 40,
              background: "#f3f4f6",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              flexShrink: 0
            },
            children: "🏔"
          }), /* @__PURE__ */ jsx("span", {
            style: {
              flex: 1,
              fontWeight: isSelected ? 600 : 400
            },
            children: o.label
          }), isSelected && /* @__PURE__ */ jsx("span", {
            style: {
              color: "#3b82f6",
              fontSize: 14
            },
            children: "✓"
          })]
        }, o.value);
      })
    })]
  });
}
const app_configurator_$productId = UNSAFE_withComponentProps(function ConfiguratorPage() {
  var _a, _b;
  const {
    product,
    config,
    appSettings,
    configuratorStyle,
    modelMode,
    glbUrl
  } = useLoaderData();
  const appSet = {
    ...DEFAULT_APP_SETTINGS,
    ...appSettings ?? {}
  };
  const cfStyle = {
    ...DEFAULT_STYLE,
    swatchShape: appSet.swatchShape,
    swatchSize: appSet.swatchSize,
    ...configuratorStyle ?? {}
  };
  const swatchPx = cfStyle.swatchSize === "sm" ? 28 : cfStyle.swatchSize === "md" ? 36 : 46;
  const swatchRadius = cfStyle.swatchShape === "circle" ? "50%" : cfStyle.swatchShape === "square" ? "4px" : "8px";
  const thumbPx = cfStyle.thumbnailSize === "sm" ? 44 : cfStyle.thumbnailSize === "md" ? 56 : 70;
  const thumbRadius = cfStyle.thumbnailShape === "circle" ? "50%" : cfStyle.thumbnailShape === "square" ? "4px" : "10px";
  const swatchGap = appSet.spaceBetweenOptions;
  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  const [nodeRefs] = useState({});
  const layers = (config == null ? void 0 : config.layers) ?? [];
  const questions = migrateOptions(config == null ? void 0 : config.options, layers);
  const logicRules = ((_a = config == null ? void 0 : config.options) == null ? void 0 : _a.logicRules) ?? [];
  const numViews = ((_b = config == null ? void 0 : config.options) == null ? void 0 : _b.numViews) ?? 1;
  const [currentView, setCurrentView] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState(() => {
    const init = {};
    for (const q of questions) {
      if (q.type === "thumbnail" && q.displayType === "image" && q.swatches.length > 0) init[q.id] = q.swatches[0].value;
      if (q.type === "dropdown" && q.defaultValue) init[q.id] = q.defaultValue;
      if (q.type === "radio" && q.defaultValue) init[q.id] = q.defaultValue;
      if (q.type === "checkbox") init[q.id] = q.defaultChecked ? "true" : "false";
    }
    return init;
  });
  const [labelAnswerImages, setLabelAnswerImages] = useState({});
  const [hoverViewImages, setHoverViewImages] = useState(null);
  const [layerColors, setLayerColors] = useState({});
  const [layerTextures, setLayerTextures] = useState({});
  const [layerImageOverrides, setLayerImageOverrides] = useState(() => {
    var _a2;
    const init = {};
    for (const q of questions) {
      if (q.type !== "thumbnail" || q.displayType !== "image") continue;
      const layerIds = getEffectiveLayerIds(q);
      if (!layerIds.length || !q.swatches.length) continue;
      const first = q.swatches[0];
      if ((_a2 = first.viewImages) == null ? void 0 : _a2.length) {
        for (const lid of layerIds) init[lid] = first.viewImages.map((v) => v || "");
      }
    }
    return init;
  });
  const [textValues, setTextValues] = useState(() => {
    const init = {};
    for (const q of questions) {
      if (q.type === "text") init[q.id] = q.defaultText;
    }
    return init;
  });
  const [textColors, setTextColors] = useState({});
  const [textSizes, setTextSizes] = useState(() => {
    const init = {};
    for (const q of questions) {
      if (q.type === "text") init[q.id] = q.defaultFontSize;
    }
    return init;
  });
  const [textFonts, setTextFonts] = useState(() => {
    const init = {};
    for (const q of questions) {
      if (q.type === "text") init[q.id] = q.defaultFontFamily;
    }
    return init;
  });
  const [uploadedImages, setUploadedImages] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredPartIds, setHoveredPartIds] = useState([]);
  const glbCustomizations = useMemo(() => {
    const glbIds = new Set(layers.filter((l) => l.type === "glb-part").map((l) => l.id));
    const result = {};
    for (const [id, color] of Object.entries(layerColors)) {
      if (glbIds.has(id)) result[id] = {
        ...result[id],
        color
      };
    }
    for (const [id, textureUrl] of Object.entries(layerTextures)) {
      if (glbIds.has(id)) result[id] = {
        ...result[id],
        textureUrl
      };
    }
    return result;
  }, [layers, layerColors, layerTextures]);
  useEffect(() => {
    var _a2;
    if (!transformerRef.current) return;
    const node = selectedId ? nodeRefs[selectedId] : null;
    transformerRef.current.nodes(node ? [node] : []);
    (_a2 = transformerRef.current.getLayer()) == null ? void 0 : _a2.batchDraw();
  }, [selectedId, nodeRefs]);
  const handleFileUpload = (questionId, file) => {
    const fq = questions.find((q) => q.id === questionId);
    const areas = fq == null ? void 0 : fq.printAreas;
    if (areas == null ? void 0 : areas.length) {
      const targetView = areas[0].visibleViews[0];
      if (targetView) setCurrentView(Math.min(targetView - 1, numViews - 1));
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.src = reader.result;
      img.onload = () => setUploadedImages({
        [questionId]: img
      });
    };
    reader.readAsDataURL(file);
  };
  const handleSwatchClick = (q, swatchValue, imageUrl) => {
    setSelectedAnswers((p) => ({
      ...p,
      [q.id]: swatchValue
    }));
    const allIds = getEffectiveLayerIds(q);
    if (!allIds.length) return;
    const dt = q.displayType ?? "color";
    if (dt === "image") {
      const swatch = q.swatches.find((s) => s.value === swatchValue);
      const views = (swatch == null ? void 0 : swatch.viewImages) ?? [];
      setLayerImageOverrides((p) => {
        const next = {
          ...p
        };
        for (const lid of allIds) next[lid] = views.map((v) => v || "");
        return next;
      });
    } else {
      const textIds = allIds.filter((id) => questions.some((tq) => tq.id === id && tq.type === "text"));
      const layerIds = allIds.filter((id) => !textIds.includes(id));
      if (textIds.length > 0) {
        setTextColors((p) => {
          const next = {
            ...p
          };
          for (const tid of textIds) next[tid] = swatchValue;
          return next;
        });
      }
      setLayerColors((p) => {
        const next = {
          ...p
        };
        for (const lid of layerIds) next[lid] = swatchValue;
        return next;
      });
      setLayerTextures((p) => {
        const next = {
          ...p
        };
        for (const lid of layerIds) {
          if (imageUrl) next[lid] = imageUrl;
          else delete next[lid];
        }
        return next;
      });
    }
  };
  const exportDesign = () => {
    setSelectedId(null);
    setTimeout(() => {
      const uri = stageRef.current.toDataURL({
        pixelRatio: 3
      });
      const a = document.createElement("a");
      a.download = `${product.handle ?? "design"}.png`;
      a.href = uri;
      a.click();
    }, 80);
  };
  if (!config) {
    return /* @__PURE__ */ jsxs("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "70vh",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        gap: 16
      },
      children: [/* @__PURE__ */ jsx("div", {
        style: {
          width: 64,
          height: 64,
          borderRadius: 16,
          background: "#f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 32
        },
        children: "🎨"
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          textAlign: "center"
        },
        children: [/* @__PURE__ */ jsx("p", {
          style: {
            margin: "0 0 6px",
            fontSize: 18,
            fontWeight: 700,
            color: "#111827"
          },
          children: product.title
        }), /* @__PURE__ */ jsx("p", {
          style: {
            margin: 0,
            fontSize: 14,
            color: "#6b7280"
          },
          children: "No configurator set up for this product yet."
        })]
      }), /* @__PURE__ */ jsxs(Link, {
        to: `/app/configurator-setup/${encodeURIComponent(product.id)}`,
        style: {
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 20px",
          background: "#4f46e5",
          color: "#fff",
          borderRadius: 8,
          textDecoration: "none",
          fontWeight: 600,
          fontSize: 14
        },
        children: ["Open Builder", /* @__PURE__ */ jsx("svg", {
          width: "14",
          height: "14",
          viewBox: "0 0 14 14",
          fill: "none",
          children: /* @__PURE__ */ jsx("path", {
            d: "M5 2l5 5-5 5",
            stroke: "#fff",
            strokeWidth: "1.8",
            strokeLinecap: "round",
            strokeLinejoin: "round"
          })
        })]
      })]
    });
  }
  const {
    hiddenQuestions
  } = evaluateLogicRules(logicRules, selectedAnswers);
  const textQuestions = questions.filter((q) => q.type === "text" && q.displayType !== "none" && isVisible(q, selectedAnswers, hiddenQuestions));
  const fileQuestions = questions.filter((q) => q.type === "file" && isVisible(q, selectedAnswers, hiddenQuestions));
  const visibleQuestions = questions.filter((q) => {
    var _a2, _b2;
    if (!isVisible(q, selectedAnswers, hiddenQuestions)) return false;
    if ((q.type === "radio" || q.type === "dropdown") && !((_a2 = q.options) == null ? void 0 : _a2.length)) return false;
    if ((q.type === "color" || q.type === "thumbnail") && !((_b2 = q.swatches) == null ? void 0 : _b2.length)) return false;
    return true;
  });
  const qLabel = {
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: appSet.globalTextColor,
    marginBottom: 8
  };
  return /* @__PURE__ */ jsxs("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "290px 1fr",
      height: "100vh",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    },
    children: [/* @__PURE__ */ jsxs("div", {
      style: {
        borderRight: "1px solid #e5e7eb",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      },
      children: [/* @__PURE__ */ jsxs("div", {
        style: {
          padding: "16px 18px 14px",
          borderBottom: "1px solid #e5e7eb",
          background: "#fafafa"
        },
        children: [/* @__PURE__ */ jsx("p", {
          style: {
            margin: "0 0 2px",
            fontSize: 15,
            fontWeight: 700,
            color: "#111827",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          },
          children: product.title
        }), /* @__PURE__ */ jsxs(Link, {
          to: `/app/configurator-setup/${encodeURIComponent(product.id)}`,
          style: {
            fontSize: 12,
            color: "#6b7280",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 3
          },
          children: ["Edit setup", /* @__PURE__ */ jsx("svg", {
            width: "10",
            height: "10",
            viewBox: "0 0 10 10",
            fill: "none",
            children: /* @__PURE__ */ jsx("path", {
              d: "M3 1.5l3.5 3.5-3.5 3.5",
              stroke: "#6b7280",
              strokeWidth: "1.5",
              strokeLinecap: "round",
              strokeLinejoin: "round"
            })
          })]
        })]
      }), /* @__PURE__ */ jsx("div", {
        style: {
          flex: 1,
          overflowY: "auto",
          padding: "0 18px 24px"
        },
        children: visibleQuestions.map((q) => {
          if (q.type === "label") {
            const labelAnswers = q.answers ?? [];
            if (labelAnswers.length > 0) {
              const activeVals = (selectedAnswers[q.id] ?? "").split(",").filter(Boolean);
              const toggleLabelAnswer = (val) => {
                var _a2;
                const newVal = activeVals[0] === val ? "" : val;
                setSelectedAnswers((p) => ({
                  ...p,
                  [q.id]: newVal
                }));
                if (newVal) {
                  const ans = labelAnswers.find((a) => a.value === newVal);
                  if ((_a2 = ans == null ? void 0 : ans.viewImages) == null ? void 0 : _a2.some(Boolean)) {
                    setLabelAnswerImages((p) => ({
                      ...p,
                      [q.id]: ans.viewImages
                    }));
                  } else {
                    setLabelAnswerImages((p) => {
                      const n = {
                        ...p
                      };
                      delete n[q.id];
                      return n;
                    });
                  }
                } else {
                  setLabelAnswerImages((p) => {
                    const n = {
                      ...p
                    };
                    delete n[q.id];
                    return n;
                  });
                }
              };
              return /* @__PURE__ */ jsxs("div", {
                style: {
                  marginTop: 22
                },
                children: [/* @__PURE__ */ jsx("div", {
                  style: qLabel,
                  children: q.name
                }), /* @__PURE__ */ jsx("div", {
                  style: {
                    display: "flex",
                    flexWrap: "wrap",
                    gap: swatchGap
                  },
                  children: labelAnswers.map((a) => {
                    var _a2;
                    const isActive = activeVals.includes(a.value);
                    const hasViewImages = (_a2 = a.viewImages) == null ? void 0 : _a2.some(Boolean);
                    return /* @__PURE__ */ jsxs("button", {
                      onClick: () => toggleLabelAnswer(a.value),
                      onMouseEnter: () => hasViewImages ? setHoverViewImages(a.viewImages) : void 0,
                      onMouseLeave: () => setHoverViewImages(null),
                      style: {
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 16px",
                        borderRadius: 7,
                        border: isActive ? "2px solid #2563eb" : "1px solid #d1d5db",
                        background: isActive ? "#eff6ff" : "#fff",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 500,
                        color: isActive ? "#2563eb" : "#374151",
                        transition: "border-color 0.12s, background 0.12s"
                      },
                      children: [a.imageUrl && /* @__PURE__ */ jsx("img", {
                        src: a.imageUrl,
                        alt: a.label,
                        style: {
                          width: 20,
                          height: 20,
                          borderRadius: 3,
                          objectFit: "cover",
                          flexShrink: 0
                        }
                      }), a.label]
                    }, a.value);
                  })
                })]
              }, q.id);
            }
            return /* @__PURE__ */ jsxs("div", {
              style: {
                marginTop: 22
              },
              children: [/* @__PURE__ */ jsx("div", {
                style: qLabel,
                children: q.name
              }), /* @__PURE__ */ jsx("p", {
                style: {
                  margin: 0,
                  fontSize: 13,
                  color: "#374151",
                  lineHeight: 1.5
                },
                children: q.content
              })]
            }, q.id);
          }
          if (q.type === "color") {
            const activeVal = selectedAnswers[q.id];
            return /* @__PURE__ */ jsxs("div", {
              style: {
                marginTop: 22
              },
              children: [/* @__PURE__ */ jsx("div", {
                style: qLabel,
                children: q.name
              }), /* @__PURE__ */ jsx("div", {
                style: {
                  display: "flex",
                  gap: swatchGap,
                  flexWrap: "wrap"
                },
                children: q.swatches.map((s) => {
                  const isActive = activeVal === s.value;
                  return /* @__PURE__ */ jsx("button", {
                    title: s.label,
                    onClick: () => handleSwatchClick(q, s.value, s.imageUrl),
                    style: {
                      width: swatchPx,
                      height: swatchPx,
                      borderRadius: s.imageUrl ? 6 : swatchRadius,
                      background: s.imageUrl ? "none" : s.value,
                      backgroundImage: s.imageUrl ? `url(${s.imageUrl})` : "none",
                      backgroundSize: "cover",
                      border: isActive ? "3px solid #111827" : "2px solid #e5e7eb",
                      outline: isActive ? "2px solid #fff" : "none",
                      outlineOffset: -3,
                      cursor: "pointer",
                      padding: 0,
                      overflow: "hidden"
                    }
                  }, s.value);
                })
              })]
            }, q.id);
          }
          if (q.type === "thumbnail") {
            const activeVal = selectedAnswers[q.id];
            return /* @__PURE__ */ jsxs("div", {
              style: {
                marginTop: 22
              },
              children: [/* @__PURE__ */ jsx("div", {
                style: qLabel,
                children: q.name
              }), /* @__PURE__ */ jsx("div", {
                style: {
                  display: "flex",
                  gap: swatchGap,
                  flexWrap: "wrap"
                },
                children: q.swatches.map((s) => {
                  const isActive = activeVal === s.value;
                  return /* @__PURE__ */ jsx("button", {
                    title: s.label,
                    onClick: () => handleSwatchClick(q, s.value, s.imageUrl),
                    style: {
                      width: thumbPx,
                      height: thumbPx,
                      borderRadius: thumbRadius,
                      overflow: "hidden",
                      padding: 0,
                      cursor: "pointer",
                      border: isActive ? "3px solid #111827" : "2px solid #e5e7eb",
                      outline: isActive ? "2px solid #fff" : "none",
                      outlineOffset: -3,
                      background: s.imageUrl ? "none" : s.value
                    },
                    children: s.imageUrl ? /* @__PURE__ */ jsx("img", {
                      src: s.imageUrl,
                      alt: s.label,
                      style: {
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block"
                      }
                    }) : /* @__PURE__ */ jsx("span", {
                      style: {
                        display: "block",
                        width: "100%",
                        height: "100%",
                        background: s.value
                      }
                    })
                  }, s.value);
                })
              })]
            }, q.id);
          }
          if (q.type === "dropdown") {
            const dq = q;
            if (dq.displayType === "image") {
              const selectedVals = dq.multipleSelection ? (selectedAnswers[q.id] ?? "").split(",").filter(Boolean) : [selectedAnswers[q.id] ?? ""].filter(Boolean);
              const toggleVal = (val) => {
                var _a2, _b2;
                if (dq.multipleSelection) {
                  const cur = (selectedAnswers[q.id] ?? "").split(",").filter(Boolean);
                  const isRemoving = cur.includes(val);
                  const next = isRemoving ? cur.filter((v) => v !== val) : [...cur, val];
                  setSelectedAnswers((p) => ({
                    ...p,
                    [q.id]: next.join(",")
                  }));
                  const opt = dq.options.find((o) => o.value === val);
                  if (!isRemoving && ((_a2 = opt == null ? void 0 : opt.viewImages) == null ? void 0 : _a2.some(Boolean))) {
                    setLabelAnswerImages((p) => ({
                      ...p,
                      [q.id]: opt.viewImages
                    }));
                  } else if (isRemoving && next.length === 0) {
                    setLabelAnswerImages((p) => {
                      const n = {
                        ...p
                      };
                      delete n[q.id];
                      return n;
                    });
                  }
                } else {
                  setSelectedAnswers((p) => ({
                    ...p,
                    [q.id]: val
                  }));
                  const opt = dq.options.find((o) => o.value === val);
                  if ((_b2 = opt == null ? void 0 : opt.viewImages) == null ? void 0 : _b2.some(Boolean)) {
                    setLabelAnswerImages((p) => ({
                      ...p,
                      [q.id]: opt.viewImages
                    }));
                  } else {
                    setLabelAnswerImages((p) => {
                      const n = {
                        ...p
                      };
                      delete n[q.id];
                      return n;
                    });
                  }
                }
              };
              return /* @__PURE__ */ jsx(AdminImageDropdown, {
                q: dq,
                selectedVals,
                onToggle: toggleVal,
                onHoverImages: setHoverViewImages,
                qLabel
              }, q.id);
            }
            return /* @__PURE__ */ jsxs("div", {
              style: {
                marginTop: 22
              },
              children: [/* @__PURE__ */ jsx("div", {
                style: qLabel,
                children: q.name
              }), /* @__PURE__ */ jsxs("select", {
                value: selectedAnswers[q.id] || "",
                onChange: (e) => setSelectedAnswers((p) => ({
                  ...p,
                  [q.id]: e.target.value
                })),
                style: {
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 14,
                  boxSizing: "border-box"
                },
                children: [/* @__PURE__ */ jsx("option", {
                  value: "",
                  children: "— select —"
                }), (q.options ?? []).map((o) => /* @__PURE__ */ jsx("option", {
                  value: o.value,
                  children: o.label
                }, o.value))]
              })]
            }, q.id);
          }
          if (q.type === "radio") {
            return /* @__PURE__ */ jsxs("div", {
              style: {
                marginTop: 22
              },
              children: [/* @__PURE__ */ jsx("div", {
                style: qLabel,
                children: q.name
              }), /* @__PURE__ */ jsx("div", {
                style: {
                  display: "flex",
                  flexDirection: "column",
                  gap: 8
                },
                children: (q.options ?? []).map((o) => /* @__PURE__ */ jsxs("label", {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                    padding: "9px 12px",
                    borderRadius: 7,
                    border: selectedAnswers[q.id] === o.value ? "2px solid #111827" : "1px solid #e5e7eb",
                    background: selectedAnswers[q.id] === o.value ? "#f9fafb" : "#fff"
                  },
                  children: [/* @__PURE__ */ jsx("input", {
                    type: "radio",
                    name: q.id,
                    value: o.value,
                    checked: selectedAnswers[q.id] === o.value,
                    onChange: () => setSelectedAnswers((p) => ({
                      ...p,
                      [q.id]: o.value
                    })),
                    style: {
                      accentColor: "#111827"
                    }
                  }), /* @__PURE__ */ jsx("span", {
                    style: {
                      fontSize: 14
                    },
                    children: o.label
                  })]
                }, o.value))
              })]
            }, q.id);
          }
          if (q.type === "checkbox") {
            return /* @__PURE__ */ jsx("div", {
              style: {
                marginTop: 22
              },
              children: /* @__PURE__ */ jsxs("label", {
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  padding: "10px 12px",
                  borderRadius: 7,
                  border: "1px solid #e5e7eb",
                  background: "#fff"
                },
                children: [/* @__PURE__ */ jsx("input", {
                  type: "checkbox",
                  checked: selectedAnswers[q.id] === "true",
                  onChange: (e) => setSelectedAnswers((p) => ({
                    ...p,
                    [q.id]: e.target.checked ? "true" : "false"
                  })),
                  style: {
                    accentColor: "#111827",
                    width: 16,
                    height: 16
                  }
                }), /* @__PURE__ */ jsx("span", {
                  style: {
                    fontSize: 14,
                    fontWeight: 500
                  },
                  children: selectedAnswers[q.id] === "true" ? q.checkedLabel : q.uncheckedLabel
                })]
              })
            }, q.id);
          }
          if (q.type === "text") {
            const maxChars = q.maxChars ?? 15;
            const currentLen = (textValues[q.id] ?? q.defaultText ?? "").length;
            const atLimit = currentLen >= maxChars;
            const pa = q.printArea;
            return /* @__PURE__ */ jsxs("div", {
              style: {
                marginTop: 22
              },
              children: [/* @__PURE__ */ jsx("div", {
                style: qLabel,
                children: q.name
              }), /* @__PURE__ */ jsxs("div", {
                style: {
                  position: "relative"
                },
                children: [/* @__PURE__ */ jsx("textarea", {
                  value: textValues[q.id] ?? q.defaultText,
                  onChange: (e) => setTextValues((p) => ({
                    ...p,
                    [q.id]: e.target.value
                  })),
                  placeholder: q.defaultText || "Enter text…",
                  maxLength: maxChars,
                  rows: 3,
                  style: {
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    fontSize: 14,
                    boxSizing: "border-box",
                    resize: "vertical",
                    fontFamily: "inherit",
                    lineHeight: 1.5,
                    outline: "none"
                  },
                  onFocus: () => {
                    var _a2;
                    if (((_a2 = pa == null ? void 0 : pa.visibleViews) == null ? void 0 : _a2.length) > 0) setCurrentView(Math.min(pa.visibleViews[0] - 1, numViews - 1));
                  }
                }), /* @__PURE__ */ jsxs("span", {
                  style: {
                    position: "absolute",
                    bottom: 6,
                    right: 8,
                    fontSize: 11,
                    color: atLimit ? "#ef4444" : "#9ca3af",
                    fontWeight: atLimit ? 600 : 400,
                    pointerEvents: "none"
                  },
                  children: [currentLen, "/", maxChars]
                })]
              }), q.displayType !== "none" && /* @__PURE__ */ jsx("select", {
                value: textFonts[q.id] ?? q.defaultFontFamily,
                onChange: (e) => setTextFonts((p) => ({
                  ...p,
                  [q.id]: e.target.value
                })),
                style: {
                  width: "100%",
                  marginTop: 8,
                  padding: "7px 10px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  fontSize: 13
                },
                children: ["Arial", "Georgia", "Impact", "Verdana", "Courier New", "Times New Roman"].map((f) => /* @__PURE__ */ jsx("option", {
                  value: f,
                  children: f
                }, f))
              })]
            }, q.id);
          }
          if (q.type === "file") {
            return /* @__PURE__ */ jsxs("div", {
              style: {
                marginTop: 22
              },
              children: [/* @__PURE__ */ jsx("div", {
                style: qLabel,
                children: q.name
              }), /* @__PURE__ */ jsxs("label", {
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 12px",
                  border: "2px dashed #e5e7eb",
                  borderRadius: 8,
                  cursor: "pointer",
                  color: "#6b7280",
                  fontSize: 13
                },
                children: [/* @__PURE__ */ jsx("span", {
                  children: "📁"
                }), /* @__PURE__ */ jsx("span", {
                  children: uploadedImages[q.id] ? "Image uploaded — change" : "Choose file"
                }), /* @__PURE__ */ jsx("input", {
                  type: "file",
                  accept: "image/*",
                  style: {
                    display: "none"
                  },
                  onChange: (e) => {
                    var _a2;
                    const f = (_a2 = e.target.files) == null ? void 0 : _a2[0];
                    if (f) handleFileUpload(q.id, f);
                  }
                })]
              })]
            }, q.id);
          }
          return null;
        })
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          padding: "14px 18px",
          borderTop: "1px solid #e5e7eb",
          background: "#fafafa"
        },
        children: [/* @__PURE__ */ jsx("button", {
          onClick: exportDesign,
          style: {
            width: "100%",
            padding: "11px 0",
            background: "#4f46e5",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            letterSpacing: "0.01em"
          },
          children: "Export Design"
        }), /* @__PURE__ */ jsx(Link, {
          to: "/app/products",
          style: {
            display: "block",
            textAlign: "center",
            marginTop: 10,
            fontSize: 12,
            color: "#9ca3af",
            textDecoration: "none"
          },
          children: "← Back to products"
        })]
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#f3f4f6",
        gap: 12
      },
      onClick: (e) => {
        if (e.target === e.currentTarget) setSelectedId(null);
      },
      children: [modelMode && glbUrl ? /* @__PURE__ */ jsx(ThreeViewer, {
        glbUrl,
        parts: layers.filter((l) => l.type === "glb-part"),
        customizations: glbCustomizations,
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        hoveredPartIds
      }) : /* @__PURE__ */ jsx(Stage, {
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        ref: stageRef,
        onMouseDown: (e) => {
          if (e.target === e.target.getStage()) setSelectedId(null);
        },
        style: {
          boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
          borderRadius: 4
        },
        children: /* @__PURE__ */ jsxs(Layer, {
          children: [hoverViewImages ? (() => {
            const src = hoverViewImages[currentView] || hoverViewImages.find(Boolean) || "";
            return src ? /* @__PURE__ */ jsx(ProductLayer, {
              src,
              width: CANVAS_SIZE,
              height: CANVAS_SIZE
            }, "hover-bg") : null;
          })() : Object.entries(labelAnswerImages).map(([qId, images]) => {
            const src = images[currentView] || images.find(Boolean) || "";
            return src ? /* @__PURE__ */ jsx(ProductLayer, {
              src,
              width: CANVAS_SIZE,
              height: CANVAS_SIZE
            }, `q-bg-${qId}`) : null;
          }), layers.map((layer) => {
            if (layer.type === "glb-part") return null;
            const overrideImages = layerImageOverrides[layer.id];
            let src;
            if (overrideImages) {
              const slot = overrideImages[currentView];
              const baseSrc = getLayerSrc(layer, currentView);
              src = slot != null && slot !== "" ? slot : baseSrc || overrideImages.find((s) => s !== "" && s != null) || "";
            } else {
              src = getLayerSrc(layer, currentView);
            }
            return /* @__PURE__ */ jsx(ProductLayer, {
              src,
              color: layerColors[layer.id],
              textureUrl: layerTextures[layer.id],
              width: CANVAS_SIZE,
              height: CANVAS_SIZE
            }, layer.id);
          }), textQuestions.filter((q) => {
            const pa = q.printArea;
            return !pa || pa.visibleViews.includes(currentView + 1);
          }).map((q) => {
            const pa = q.printArea;
            return /* @__PURE__ */ jsx(Text, {
              ref: (node) => {
                if (node) nodeRefs[q.id] = node;
              },
              text: textValues[q.id] ?? q.defaultText,
              x: ((pa == null ? void 0 : pa.x) ?? q.position.x) * COORD_SCALE,
              y: ((pa == null ? void 0 : pa.y) ?? q.position.y) * COORD_SCALE,
              rotation: (pa == null ? void 0 : pa.rotation) ?? q.rotation ?? 0,
              width: pa ? pa.width * COORD_SCALE : void 0,
              fontSize: (textSizes[q.id] ?? q.defaultFontSize) * COORD_SCALE,
              fontFamily: textFonts[q.id] ?? q.defaultFontFamily,
              fill: textColors[q.id] ?? q.defaultColor,
              align: q.textAlign ?? "left",
              wrap: "word",
              draggable: true,
              onClick: () => setSelectedId(q.id),
              onTap: () => setSelectedId(q.id)
            }, q.id);
          }), fileQuestions.filter((q) => {
            const areas = q.printAreas;
            if (!areas || areas.length === 0) return true;
            return areas.some((pa) => pa.visibleViews.includes(currentView + 1));
          }).map((q) => {
            var _a2, _b2;
            const img = uploadedImages[q.id];
            if (!img) return null;
            const fq = q;
            return /* @__PURE__ */ jsx(Image, {
              image: img,
              x: (((_a2 = fq.position) == null ? void 0 : _a2.x) ?? 100) * COORD_SCALE,
              y: (((_b2 = fq.position) == null ? void 0 : _b2.y) ?? 100) * COORD_SCALE,
              width: (fq.defaultWidth ?? 120) * COORD_SCALE,
              height: (fq.defaultHeight ?? 120) * COORD_SCALE,
              listening: false
            }, q.id);
          }), /* @__PURE__ */ jsx(Transformer, {
            ref: transformerRef,
            boundBoxFunc: (old, nw) => nw.width < 20 || nw.height < 20 ? old : nw
          })]
        })
      }), numViews > 1 && /* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 12
        },
        children: [/* @__PURE__ */ jsx("button", {
          onClick: () => setCurrentView((v) => Math.max(0, v - 1)),
          disabled: currentView === 0,
          style: {
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "1.5px solid #d1d5db",
            background: currentView === 0 ? "#f3f4f6" : "#fff",
            cursor: currentView === 0 ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: currentView === 0 ? 0.4 : 1,
            transition: "opacity 0.15s",
            flexShrink: 0
          },
          "aria-label": "Previous view",
          children: /* @__PURE__ */ jsx("svg", {
            width: "14",
            height: "14",
            viewBox: "0 0 14 14",
            fill: "none",
            children: /* @__PURE__ */ jsx("path", {
              d: "M9 2L4 7l5 5",
              stroke: "#111827",
              strokeWidth: "1.8",
              strokeLinecap: "round",
              strokeLinejoin: "round"
            })
          })
        }), /* @__PURE__ */ jsx("div", {
          style: {
            display: "flex",
            gap: 8,
            alignItems: "center"
          },
          children: Array.from({
            length: numViews
          }).map((_, vi) => /* @__PURE__ */ jsx("button", {
            onClick: () => setCurrentView(vi),
            style: {
              width: vi === currentView ? 22 : 10,
              height: 10,
              borderRadius: 5,
              background: vi === currentView ? "#111827" : "#d1d5db",
              border: "none",
              cursor: "pointer",
              padding: 0,
              transition: "width 0.15s"
            },
            title: `View ${vi + 1}`
          }, vi))
        }), /* @__PURE__ */ jsx("button", {
          onClick: () => setCurrentView((v) => Math.min(numViews - 1, v + 1)),
          disabled: currentView === numViews - 1,
          style: {
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "1.5px solid #d1d5db",
            background: currentView === numViews - 1 ? "#f3f4f6" : "#fff",
            cursor: currentView === numViews - 1 ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: currentView === numViews - 1 ? 0.4 : 1,
            transition: "opacity 0.15s",
            flexShrink: 0
          },
          "aria-label": "Next view",
          children: /* @__PURE__ */ jsx("svg", {
            width: "14",
            height: "14",
            viewBox: "0 0 14 14",
            fill: "none",
            children: /* @__PURE__ */ jsx("path", {
              d: "M5 2l5 5-5 5",
              stroke: "#111827",
              strokeWidth: "1.8",
              strokeLinecap: "round",
              strokeLinejoin: "round"
            })
          })
        })]
      })]
    })]
  });
});
const route15 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: app_configurator_$productId,
  loader: loader$5
}, Symbol.toStringTag, { value: "Module" }));
async function loader$4({
  request,
  params
}) {
  var _a;
  const {
    admin
  } = await authenticate.admin(request);
  const decodedId = decodeURIComponent(params.productId);
  const resp = await admin.graphql(`query GetProductInventory($id: ID!) {
      product(id: $id) {
        id title status
        variants(first: 20) {
          edges {
            node {
              id title price sku
              inventoryItem {
                id tracked
                inventoryLevels(first: 10) {
                  edges {
                    node {
                      id quantities(names: ["available", "on_hand", "reserved"]) { name quantity }
                      location { id name }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }`, {
    variables: {
      id: decodedId
    }
  });
  const data = await resp.json();
  const product = (_a = data.data) == null ? void 0 : _a.product;
  if (!product) throw new Response("Product not found", {
    status: 404
  });
  return {
    product,
    productId: decodedId
  };
}
async function action$7({
  request
}) {
  var _a, _b;
  const {
    admin,
    session
  } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  if (intent === "enableTracking") {
    const inventoryItemId2 = formData.get("inventoryItemId");
    const numericItemId = inventoryItemId2.replace("gid://shopify/InventoryItem/", "");
    await fetch(`https://${session.shop}/admin/api/2024-01/inventory_items/${numericItemId}.json`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": session.accessToken
      },
      body: JSON.stringify({
        inventory_item: {
          id: parseInt(numericItemId, 10),
          tracked: true
        }
      })
    });
    return {
      success: true,
      message: "Inventory tracking enabled."
    };
  }
  const inventoryItemId = formData.get("inventoryItemId");
  const locationId = formData.get("locationId");
  const currentQty = parseInt(formData.get("currentQty"), 10);
  const newQty = parseInt(formData.get("newQty"), 10);
  if (isNaN(newQty) || newQty < 0) {
    return {
      error: "Invalid quantity. Must be 0 or greater."
    };
  }
  const delta = newQty - currentQty;
  if (delta === 0) return {
    success: true,
    message: "No change needed."
  };
  const resp = await admin.graphql(`mutation AdjustInventory($input: InventoryAdjustQuantitiesInput!) {
      inventoryAdjustQuantities(input: $input) {
        userErrors { field message }
        inventoryAdjustmentGroup {
          changes { name delta quantityAfterChange }
        }
      }
    }`, {
    variables: {
      input: {
        name: "available",
        reason: "correction",
        changes: [{
          inventoryItemId,
          locationId,
          delta
        }]
      }
    }
  });
  const data = await resp.json();
  const errs = ((_b = (_a = data.data) == null ? void 0 : _a.inventoryAdjustQuantities) == null ? void 0 : _b.userErrors) ?? [];
  if (errs.length > 0) return {
    error: errs[0].message
  };
  return {
    success: true,
    message: `Stock updated to ${newQty} units.`
  };
}
const app_inventory_$productId = UNSAFE_withComponentProps(function InventoryPage() {
  var _a;
  const {
    product,
    productId
  } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const submit = useSubmit();
  const saving = navigation.state === "submitting";
  const variants = (((_a = product.variants) == null ? void 0 : _a.edges) ?? []).map((e) => e.node);
  const inputSt2 = {
    padding: "8px 10px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: 13,
    outline: "none",
    width: 100,
    boxSizing: "border-box"
  };
  const handleAdjust = (inventoryItemId, locationId, currentQty, input2) => {
    const newQty = parseInt(input2.value, 10);
    if (isNaN(newQty) || newQty === currentQty) return;
    const fd = new FormData();
    fd.append("inventoryItemId", inventoryItemId);
    fd.append("locationId", locationId);
    fd.append("currentQty", String(currentQty));
    fd.append("newQty", String(newQty));
    submit(fd, {
      method: "post"
    });
  };
  return /* @__PURE__ */ jsxs("div", {
    style: {
      padding: 24,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      maxWidth: 900,
      margin: "0 auto"
    },
    children: [/* @__PURE__ */ jsxs("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 24
      },
      children: [/* @__PURE__ */ jsx(Link, {
        to: "/app/products",
        style: {
          color: "#6b7280",
          textDecoration: "none",
          fontSize: 13
        },
        children: "← Products"
      }), /* @__PURE__ */ jsx("span", {
        style: {
          color: "#d1d5db"
        },
        children: "/"
      }), /* @__PURE__ */ jsx("span", {
        style: {
          fontSize: 13,
          color: "#374151"
        },
        children: product.title
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20
      },
      children: [/* @__PURE__ */ jsxs("div", {
        children: [/* @__PURE__ */ jsxs("h1", {
          style: {
            margin: "0 0 4px",
            fontSize: 20,
            fontWeight: 700
          },
          children: ["Inventory — ", product.title]
        }), /* @__PURE__ */ jsx("span", {
          style: {
            fontSize: 13,
            color: product.status === "ACTIVE" ? "#059669" : "#9ca3af",
            fontWeight: 600
          },
          children: product.status
        })]
      }), /* @__PURE__ */ jsx(Link, {
        to: `/app/configurator-setup/${encodeURIComponent(productId)}`,
        style: {
          padding: "8px 16px",
          background: "#111827",
          color: "#fff",
          borderRadius: 7,
          textDecoration: "none",
          fontSize: 13,
          fontWeight: 600
        },
        children: "Edit Builder"
      })]
    }), (actionData == null ? void 0 : actionData.error) && /* @__PURE__ */ jsx("div", {
      style: {
        marginBottom: 16,
        padding: "12px 16px",
        background: "#fef2f2",
        border: "1px solid #fca5a5",
        borderRadius: 8,
        color: "#b91c1c",
        fontSize: 14
      },
      children: actionData.error
    }), (actionData == null ? void 0 : actionData.success) && /* @__PURE__ */ jsxs("div", {
      style: {
        marginBottom: 16,
        padding: "12px 16px",
        background: "#f0fdf4",
        border: "1px solid #86efac",
        borderRadius: 8,
        color: "#15803d",
        fontSize: 14,
        fontWeight: 600
      },
      children: ["✓ ", actionData.message]
    }), variants.map((variant) => {
      var _a2;
      const item = variant.inventoryItem;
      const levels = (((_a2 = item == null ? void 0 : item.inventoryLevels) == null ? void 0 : _a2.edges) ?? []).map((e) => e.node);
      return /* @__PURE__ */ jsxs("div", {
        style: {
          marginBottom: 20,
          border: "1px solid #e5e7eb",
          borderRadius: 10,
          overflow: "hidden"
        },
        children: [/* @__PURE__ */ jsxs("div", {
          style: {
            padding: "12px 18px",
            background: "#f9fafb",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          },
          children: [/* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("span", {
              style: {
                fontWeight: 700,
                fontSize: 14
              },
              children: variant.title === "Default Title" ? "Default Variant" : variant.title
            }), variant.sku && /* @__PURE__ */ jsxs("span", {
              style: {
                marginLeft: 10,
                fontSize: 12,
                color: "#9ca3af"
              },
              children: ["SKU: ", variant.sku]
            })]
          }), /* @__PURE__ */ jsxs("span", {
            style: {
              fontWeight: 700,
              fontSize: 14
            },
            children: ["$", parseFloat(variant.price).toFixed(2)]
          })]
        }), !(item == null ? void 0 : item.tracked) && /* @__PURE__ */ jsxs("div", {
          style: {
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12
          },
          children: [/* @__PURE__ */ jsx("span", {
            style: {
              color: "#9ca3af",
              fontSize: 13
            },
            children: "Inventory tracking is disabled for this variant."
          }), /* @__PURE__ */ jsx("button", {
            disabled: saving,
            onClick: () => {
              const fd = new FormData();
              fd.append("intent", "enableTracking");
              fd.append("inventoryItemId", item.id);
              submit(fd, {
                method: "post"
              });
            },
            style: {
              padding: "7px 14px",
              background: "#4f46e5",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: saving ? "wait" : "pointer",
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: "nowrap"
            },
            children: "Enable Tracking"
          })]
        }), (item == null ? void 0 : item.tracked) && levels.length === 0 && /* @__PURE__ */ jsx("div", {
          style: {
            padding: "14px 18px",
            color: "#9ca3af",
            fontSize: 13
          },
          children: "No locations found. Add a location in your Shopify admin settings."
        }), (item == null ? void 0 : item.tracked) && levels.map((level) => {
          var _a3, _b, _c, _d, _e, _f, _g;
          const available = ((_b = (_a3 = level.quantities) == null ? void 0 : _a3.find((q) => q.name === "available")) == null ? void 0 : _b.quantity) ?? 0;
          const onHand = ((_d = (_c = level.quantities) == null ? void 0 : _c.find((q) => q.name === "on_hand")) == null ? void 0 : _d.quantity) ?? 0;
          const reserved = ((_f = (_e = level.quantities) == null ? void 0 : _e.find((q) => q.name === "reserved")) == null ? void 0 : _f.quantity) ?? 0;
          return /* @__PURE__ */ jsxs("div", {
            style: {
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              gap: 24,
              flexWrap: "wrap"
            },
            children: [/* @__PURE__ */ jsxs("div", {
              style: {
                flex: 1,
                minWidth: 140
              },
              children: [/* @__PURE__ */ jsx("div", {
                style: {
                  fontSize: 13,
                  fontWeight: 600
                },
                children: (_g = level.location) == null ? void 0 : _g.name
              }), /* @__PURE__ */ jsx("div", {
                style: {
                  fontSize: 12,
                  color: "#9ca3af",
                  marginTop: 2
                },
                children: "Location"
              })]
            }), [{
              label: "Available",
              value: available,
              highlight: true
            }, {
              label: "On Hand",
              value: onHand
            }, {
              label: "Reserved",
              value: reserved
            }].map(({
              label: label2,
              value,
              highlight
            }) => /* @__PURE__ */ jsxs("div", {
              style: {
                textAlign: "center"
              },
              children: [/* @__PURE__ */ jsx("div", {
                style: {
                  fontSize: 20,
                  fontWeight: 700,
                  color: highlight ? available < 10 ? "#ef4444" : "#111827" : "#6b7280"
                },
                children: value
              }), /* @__PURE__ */ jsx("div", {
                style: {
                  fontSize: 11,
                  color: "#9ca3af",
                  marginTop: 1
                },
                children: label2
              })]
            }, label2)), /* @__PURE__ */ jsxs("div", {
              style: {
                display: "flex",
                alignItems: "center",
                gap: 8
              },
              children: [/* @__PURE__ */ jsx("label", {
                style: {
                  fontSize: 12,
                  color: "#6b7280",
                  whiteSpace: "nowrap"
                },
                children: "Set available:"
              }), /* @__PURE__ */ jsx("input", {
                id: `qty-${level.id}`,
                type: "number",
                defaultValue: available,
                min: "0",
                step: "1",
                style: inputSt2,
                disabled: saving
              }), /* @__PURE__ */ jsx("button", {
                onClick: () => {
                  const input2 = document.getElementById(`qty-${level.id}`);
                  handleAdjust(item.id, level.location.id, available, input2);
                },
                disabled: saving,
                style: {
                  padding: "8px 14px",
                  background: "#111827",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: saving ? "wait" : "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  whiteSpace: "nowrap"
                },
                children: saving ? "Saving…" : "Update"
              })]
            })]
          }, level.id);
        })]
      }, variant.id);
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        padding: "16px",
        background: "#f0f9ff",
        border: "1px solid #bae6fd",
        borderRadius: 8,
        fontSize: 13,
        color: "#0369a1"
      },
      children: [/* @__PURE__ */ jsx("strong", {
        children: "Tip:"
      }), " Stock decrements automatically when orders are placed in your Shopify store. Use this page to manually correct inventory after returns, damage, or stock counts."]
    })]
  });
});
const route16 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$7,
  default: app_inventory_$productId,
  loader: loader$4
}, Symbol.toStringTag, { value: "Module" }));
async function loader$3({
  request,
  params
}) {
  var _a;
  const {
    admin
  } = await authenticate.admin(request);
  const decodedId = decodeURIComponent(params.productId);
  const [productResp, config] = await Promise.all([admin.graphql(`query GetProduct($id: ID!) {
        product(id: $id) {
          id title
          variants(first: 100) {
            edges { node { id title price sku selectedOptions { name value } } }
          }
        }
      }`, {
    variables: {
      id: decodedId
    }
  }), prisma.productConfig.findUnique({
    where: {
      productId: decodedId
    }
  })]);
  const productJson = await productResp.json();
  const product = (_a = productJson.data) == null ? void 0 : _a.product;
  if (!product) throw new Response("Product not found", {
    status: 404
  });
  const opts = (config == null ? void 0 : config.options) ?? {};
  const questions = migrateOptions(opts, (config == null ? void 0 : config.layers) ?? []) || [];
  const variants = product.variants.edges.map((e) => e.node);
  const hasCustomVariants = variants.length > 1 || variants.length === 1 && variants[0].title !== "Default Title";
  return {
    product,
    productId: decodedId,
    questions,
    variants,
    hasCustomVariants
  };
}
async function action$6({
  request,
  params
}) {
  var _a, _b;
  const {
    session
  } = await authenticate.admin(request);
  const decodedId = decodeURIComponent(params.productId);
  const formData = await request.formData();
  const questionIds = JSON.parse(formData.get("questionIds"));
  const config = await prisma.productConfig.findUnique({
    where: {
      productId: decodedId
    }
  });
  const opts = (config == null ? void 0 : config.options) ?? {};
  const questions = migrateOptions(opts, (config == null ? void 0 : config.layers) ?? []) || [];
  const selectedQuestions = questions.filter((q) => questionIds.includes(q.id));
  const questionAnswers = selectedQuestions.map((q) => ({
    name: q.name,
    answers: getQuestionAnswers(q).map((a) => a.label)
  }));
  const totalCombinations = questionAnswers.reduce((acc, q) => acc * q.answers.length, 1);
  if (totalCombinations > 5e3) {
    return {
      error: `Too many variants (${totalCombinations.toLocaleString()}). Maximum is 5,000.`
    };
  }
  const combinations = cartesian(questionAnswers.map((q) => q.answers));
  const numericId = decodedId.replace("gid://shopify/Product/", "");
  const variants = combinations.map((combo) => {
    const v = {
      price: "0.00"
    };
    if (combo[0]) v.option1 = combo[0];
    if (combo[1]) v.option2 = combo[1];
    if (combo[2]) v.option3 = combo[2];
    return v;
  });
  const resp = await fetch(`https://${session.shop}/admin/api/2024-01/products/${numericId}.json`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": session.accessToken
    },
    body: JSON.stringify({
      product: {
        id: parseInt(numericId, 10),
        options: questionAnswers.map((q) => ({
          name: q.name
        })),
        variants
      }
    })
  });
  if (!resp.ok) {
    const errJson = await resp.json();
    const msg = typeof errJson.errors === "string" ? errJson.errors : JSON.stringify(errJson.errors ?? "Failed to create variants");
    return {
      error: msg
    };
  }
  const data = await resp.json();
  return {
    success: true,
    createdCount: ((_b = (_a = data.product) == null ? void 0 : _a.variants) == null ? void 0 : _b.length) ?? 0
  };
}
function cartesian(arrays) {
  if (arrays.length === 0) return [[]];
  const [first, ...rest] = arrays;
  const restCombinations = cartesian(rest);
  return first.flatMap((item) => restCombinations.map((combo) => [item, ...combo]));
}
function TopBar$1({
  productName,
  productId
}) {
  const enc = encodeURIComponent(productId);
  const tabs = [{
    id: "build",
    label: "Build",
    href: `/app/configurator-setup/${enc}`,
    active: false,
    dot: false
  }, {
    id: "pricing",
    label: "Pricing",
    href: `/app/pricing/${enc}`,
    active: false,
    dot: false
  }, {
    id: "variants",
    label: "Variants",
    href: `/app/variants/${enc}`,
    active: true,
    dot: true
  }, {
    id: "connect",
    label: "Connect",
    href: `/app/pricing/${enc}`,
    active: false,
    dot: false
  }];
  return /* @__PURE__ */ jsxs("div", {
    style: {
      height: 48,
      borderBottom: "1px solid #e5e7eb",
      display: "flex",
      alignItems: "center",
      background: "#fff",
      padding: "0 20px",
      flexShrink: 0,
      gap: 0
    },
    children: [/* @__PURE__ */ jsxs("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginRight: 32
      },
      children: [/* @__PURE__ */ jsx("div", {
        style: {
          width: 28,
          height: 28,
          background: "#111827",
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0
        },
        children: /* @__PURE__ */ jsxs("svg", {
          width: "16",
          height: "16",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "#fff",
          strokeWidth: "2",
          strokeLinecap: "round",
          children: [/* @__PURE__ */ jsx("circle", {
            cx: "12",
            cy: "7",
            r: "4"
          }), /* @__PURE__ */ jsx("path", {
            d: "M6 21v-2a6 6 0 0112 0v2"
          })]
        })
      }), /* @__PURE__ */ jsx("span", {
        style: {
          fontSize: 13,
          fontWeight: 700,
          color: "#111827",
          letterSpacing: "0.02em"
        },
        children: productName.toUpperCase()
      }), /* @__PURE__ */ jsx("svg", {
        width: "12",
        height: "12",
        fill: "none",
        stroke: "#9ca3af",
        strokeWidth: "2",
        viewBox: "0 0 24 24",
        children: /* @__PURE__ */ jsx("path", {
          d: "M6 9l6 6 6-6"
        })
      })]
    }), /* @__PURE__ */ jsx("div", {
      style: {
        display: "flex",
        alignItems: "stretch",
        height: "100%"
      },
      children: tabs.map((tab) => /* @__PURE__ */ jsxs(Link, {
        to: tab.href,
        prefetch: tab.active ? "none" : "intent",
        style: {
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "0 16px",
          fontSize: 13,
          fontWeight: tab.active ? 600 : 400,
          color: tab.active ? "#005bd3" : "#6b7280",
          textDecoration: "none",
          borderBottom: tab.active ? "2px solid #005bd3" : "2px solid transparent",
          boxSizing: "border-box"
        },
        children: [tab.label, tab.dot && /* @__PURE__ */ jsx("span", {
          style: {
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#22c55e",
            flexShrink: 0
          }
        })]
      }, tab.id))
    })]
  });
}
function CreateVariantsModal({
  questions,
  onClose,
  onSubmit,
  loading
}) {
  const eligibleQuestions = questions.filter((q) => getQuestionAnswers(q).length > 0);
  const [rows, setRows] = useState([""]);
  const selectedIds = rows.filter(Boolean);
  const usedIds = new Set(rows.filter(Boolean));
  const availableFor = (rowIdx) => eligibleQuestions.filter((q) => !usedIds.has(q.id) || rows[rowIdx] === q.id);
  const answerCountFor = (id) => {
    const q = eligibleQuestions.find((q2) => q2.id === id);
    return q ? getQuestionAnswers(q).length : 0;
  };
  const totalCombinations = selectedIds.reduce((acc, id) => acc * answerCountFor(id), 1);
  const canCreate = selectedIds.length > 0 && totalCombinations <= 5e3;
  return /* @__PURE__ */ jsx("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 1e3,
      background: "rgba(0,0,0,0.45)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    onClick: (e) => {
      if (e.target === e.currentTarget) onClose();
    },
    children: /* @__PURE__ */ jsxs("div", {
      style: {
        background: "#fff",
        borderRadius: 10,
        width: 500,
        maxWidth: "90vw",
        padding: "24px 24px 20px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.18)"
      },
      children: [/* @__PURE__ */ jsx("h2", {
        style: {
          margin: "0 0 10px",
          fontSize: 15,
          fontWeight: 700,
          color: "#111827"
        },
        children: "Create variants"
      }), /* @__PURE__ */ jsx("p", {
        style: {
          margin: "0 0 4px",
          fontSize: 13,
          color: "#374151",
          lineHeight: 1.55
        },
        children: "Select which questions should be combined to create your variants. We will create a variant for every combination of answers from the selected questions."
      }), /* @__PURE__ */ jsx("p", {
        style: {
          margin: "0 0 16px",
          fontSize: 13,
          color: "#374151"
        },
        children: "A maximum of 5000 variants can be created for a combination."
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 8,
          border: "1px solid #e5e7eb",
          borderRadius: 6,
          padding: "9px 12px",
          marginBottom: 14
        },
        children: [/* @__PURE__ */ jsxs("svg", {
          width: "16",
          height: "16",
          viewBox: "0 0 24 24",
          style: {
            flexShrink: 0
          },
          children: [/* @__PURE__ */ jsx("circle", {
            cx: "12",
            cy: "12",
            r: "10",
            fill: "#3b82f6"
          }), /* @__PURE__ */ jsx("path", {
            d: "M12 8v4m0 4h.01",
            stroke: "#fff",
            strokeWidth: "2",
            strokeLinecap: "round",
            fill: "none"
          })]
        }), /* @__PURE__ */ jsx("span", {
          style: {
            fontSize: 13,
            color: "#374151"
          },
          children: "Text field questions cannot be used to create variants"
        })]
      }), /* @__PURE__ */ jsx("div", {
        style: {
          display: "flex",
          flexDirection: "column",
          gap: 0,
          marginBottom: 0
        },
        children: rows.map((rowId, idx) => {
          const count = rowId ? answerCountFor(rowId) : 0;
          return /* @__PURE__ */ jsxs("div", {
            style: {
              display: "flex",
              alignItems: "center",
              borderBottom: "1px solid #f3f4f6",
              padding: "8px 0"
            },
            children: [/* @__PURE__ */ jsxs("div", {
              style: {
                position: "relative",
                flex: 1
              },
              children: [/* @__PURE__ */ jsxs("select", {
                value: rowId,
                onChange: (e) => {
                  const next = [...rows];
                  next[idx] = e.target.value;
                  setRows(next);
                },
                style: {
                  width: "100%",
                  height: 34,
                  padding: "0 28px 0 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: rowId ? 600 : 400,
                  color: rowId ? "#111827" : "#9ca3af",
                  background: "#fff",
                  cursor: "pointer",
                  appearance: "none"
                },
                children: [/* @__PURE__ */ jsx("option", {
                  value: "",
                  children: "Question"
                }), availableFor(idx).map((q) => /* @__PURE__ */ jsx("option", {
                  value: q.id,
                  children: q.name
                }, q.id))]
              }), /* @__PURE__ */ jsx("svg", {
                width: "12",
                height: "12",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "#6b7280",
                strokeWidth: "2",
                style: {
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none"
                },
                children: /* @__PURE__ */ jsx("path", {
                  d: "M6 9l6 6 6-6"
                })
              })]
            }), /* @__PURE__ */ jsx("button", {
              onClick: () => setRows(rows.length > 1 ? rows.filter((_, i) => i !== idx) : [""]),
              style: {
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#9ca3af",
                fontSize: 16,
                lineHeight: 1,
                padding: "0 10px",
                flexShrink: 0
              },
              children: "×"
            }), /* @__PURE__ */ jsx("span", {
              style: {
                fontSize: 13,
                color: "#6b7280",
                whiteSpace: "nowrap",
                minWidth: 70,
                textAlign: "right",
                flexShrink: 0
              },
              children: rowId && count > 0 ? /* @__PURE__ */ jsxs(Fragment, {
                children: [idx > 0 ? /* @__PURE__ */ jsx("span", {
                  style: {
                    color: "#9ca3af",
                    marginRight: 4
                  },
                  children: "×"
                }) : null, count, " answers"]
              }) : null
            })]
          }, idx);
        })
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 0",
          borderBottom: "1px solid #f3f4f6",
          marginBottom: 20
        },
        children: [/* @__PURE__ */ jsxs("button", {
          onClick: () => setRows([...rows, ""]),
          disabled: rows.length >= 3 || availableFor(rows.length).length === 0,
          style: {
            background: "none",
            border: "none",
            cursor: rows.length < 3 ? "pointer" : "default",
            color: rows.length < 3 ? "#374151" : "#d1d5db",
            fontSize: 13,
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: 5
          },
          children: [/* @__PURE__ */ jsx("span", {
            style: {
              fontSize: 15,
              fontWeight: 700,
              lineHeight: 1
            },
            children: "+"
          }), "Combine another question"]
        }), selectedIds.length > 0 && /* @__PURE__ */ jsxs("span", {
          style: {
            fontSize: 13,
            color: totalCombinations > 5e3 ? "#ef4444" : "#6b7280",
            fontWeight: 500
          },
          children: [totalCombinations.toLocaleString(), " variant", totalCombinations !== 1 ? "s" : "", totalCombinations > 5e3 ? " (limit exceeded)" : ""]
        })]
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        },
        children: [/* @__PURE__ */ jsx("button", {
          onClick: onClose,
          style: {
            background: "#fff",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            padding: "7px 16px",
            fontSize: 13,
            cursor: "pointer",
            color: "#374151"
          },
          children: "Cancel"
        }), /* @__PURE__ */ jsx("button", {
          disabled: !canCreate || loading,
          onClick: () => onSubmit(selectedIds),
          style: {
            background: canCreate && !loading ? "#3b82f6" : "#e5e7eb",
            color: canCreate && !loading ? "#fff" : "#9ca3af",
            border: "none",
            borderRadius: 6,
            padding: "7px 24px",
            fontSize: 13,
            fontWeight: 600,
            cursor: canCreate && !loading ? "pointer" : "default",
            transition: "background 0.15s"
          },
          children: loading ? "Creating…" : "Create"
        })]
      })]
    })
  });
}
const app_variants_$productId = UNSAFE_withComponentProps(function VariantsPage() {
  const {
    product,
    productId,
    questions,
    variants,
    hasCustomVariants
  } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const submit = useSubmit();
  const [showModal, setShowModal] = useState(false);
  const isCreating = navigation.state === "submitting";
  useEffect(() => {
    if (actionData == null ? void 0 : actionData.success) setShowModal(false);
  }, [actionData]);
  const handleCreate = (questionIds) => {
    const formData = new FormData();
    formData.set("questionIds", JSON.stringify(questionIds));
    submit(formData, {
      method: "post"
    });
  };
  return /* @__PURE__ */ jsxs("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      background: "#f9fafb",
      fontFamily: "Inter, system-ui, sans-serif"
    },
    children: [/* @__PURE__ */ jsx(TopBar$1, {
      productName: product.title,
      productId
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        padding: "24px 24px 0",
        display: "flex",
        alignItems: "center",
        gap: 12
      },
      children: [/* @__PURE__ */ jsx("h1", {
        style: {
          fontSize: 18,
          fontWeight: 700,
          color: "#111827",
          margin: 0
        },
        children: "Variants"
      }), /* @__PURE__ */ jsx(Link, {
        to: `/app/inventory/${encodeURIComponent(productId)}`,
        style: {
          fontSize: 13,
          color: "#6b7280",
          textDecoration: "none",
          padding: "2px 8px",
          borderRadius: 4,
          border: "1px solid #e5e7eb",
          background: "#fff"
        },
        children: "Inventory"
      })]
    }), /* @__PURE__ */ jsx("div", {
      style: {
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      },
      children: !hasCustomVariants ? (
        /* ── Empty state ── */
        /* @__PURE__ */ jsxs("div", {
          style: {
            textAlign: "center",
            maxWidth: 420
          },
          children: [/* @__PURE__ */ jsx("div", {
            style: {
              marginBottom: 16,
              display: "flex",
              justifyContent: "center"
            },
            children: /* @__PURE__ */ jsx("svg", {
              width: "40",
              height: "40",
              viewBox: "0 0 24 24",
              fill: "#111827",
              children: /* @__PURE__ */ jsx("path", {
                d: "M21.41 11.58l-9-9A2 2 0 0011 2H4a2 2 0 00-2 2v7a2 2 0 00.59 1.41l9 9a2 2 0 002.83 0l7-7a2 2 0 000-2.83zM7 8a1 1 0 110-2 1 1 0 010 2z"
              })
            })
          }), /* @__PURE__ */ jsx("p", {
            style: {
              fontSize: 14,
              fontWeight: 600,
              color: "#111827",
              margin: "0 0 6px"
            },
            children: "You don't have any variants, yet"
          }), /* @__PURE__ */ jsx("p", {
            style: {
              fontSize: 13,
              color: "#374151",
              margin: "0 0 20px",
              lineHeight: 1.6
            },
            children: "In order to create your variants you have to select a combination of questions from your product"
          }), (actionData == null ? void 0 : actionData.error) && /* @__PURE__ */ jsx("p", {
            style: {
              fontSize: 13,
              color: "#ef4444",
              marginBottom: 12
            },
            children: actionData.error
          }), /* @__PURE__ */ jsx("button", {
            onClick: () => setShowModal(true),
            style: {
              background: "#fff",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              padding: "8px 20px",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              color: "#111827"
            },
            children: "Create variants"
          })]
        })
      ) : (
        /* ── Variants table ── */
        /* @__PURE__ */ jsxs("div", {
          style: {
            width: "100%",
            maxWidth: 860,
            padding: "0 24px",
            alignSelf: "flex-start",
            marginTop: 24
          },
          children: [(actionData == null ? void 0 : actionData.error) && /* @__PURE__ */ jsx("p", {
            style: {
              fontSize: 13,
              color: "#ef4444",
              marginBottom: 12
            },
            children: actionData.error
          }), /* @__PURE__ */ jsxs("div", {
            style: {
              background: "#fff",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              overflow: "hidden"
            },
            children: [/* @__PURE__ */ jsx("div", {
              style: {
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr",
                padding: "10px 16px",
                background: "#f9fafb",
                borderBottom: "1px solid #e5e7eb",
                gap: 8
              },
              children: ["Variant", "Price", "SKU"].map((h) => /* @__PURE__ */ jsx("span", {
                style: {
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em"
                },
                children: h
              }, h))
            }), variants.map((v, i) => /* @__PURE__ */ jsxs("div", {
              style: {
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr",
                padding: "11px 16px",
                gap: 8,
                alignItems: "center",
                borderBottom: i < variants.length - 1 ? "1px solid #f3f4f6" : "none"
              },
              children: [/* @__PURE__ */ jsx("span", {
                style: {
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#111827"
                },
                children: v.title
              }), /* @__PURE__ */ jsx("span", {
                style: {
                  fontSize: 13,
                  color: "#374151"
                },
                children: v.price ? `$${parseFloat(v.price).toFixed(2)}` : "—"
              }), /* @__PURE__ */ jsx("span", {
                style: {
                  fontSize: 12,
                  color: "#6b7280",
                  fontFamily: "monospace"
                },
                children: v.sku || "—"
              })]
            }, v.id))]
          })]
        })
      )
    }), showModal && /* @__PURE__ */ jsx(CreateVariantsModal, {
      questions,
      onClose: () => setShowModal(false),
      onSubmit: handleCreate,
      loading: isCreating
    })]
  });
});
const route17 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$6,
  default: app_variants_$productId,
  loader: loader$3
}, Symbol.toStringTag, { value: "Module" }));
async function loader$2({
  request,
  params
}) {
  const {
    admin
  } = await authenticate.admin(request);
  const decodedId = decodeURIComponent(params.productId);
  const [productResp, shopResp, config] = await Promise.all([admin.graphql(`query GetProduct($id: ID!) { product(id: $id) { id title handle featuredImage { url } } }`, {
    variables: {
      id: decodedId
    }
  }), admin.graphql(`query { shop { name myshopifyDomain currencyCode } }`), prisma.productConfig.findUnique({
    where: {
      productId: decodedId
    }
  })]);
  const productJson = await productResp.json();
  const shopJson = await shopResp.json();
  const shopData = shopJson.data.shop;
  const opts = (config == null ? void 0 : config.options) ?? {};
  const questions = migrateOptions(opts, (config == null ? void 0 : config.layers) ?? []) || [];
  const pricing = opts.pricing ?? {
    basePrice: 0,
    displayTaxes: false,
    extraPrices: [],
    equations: []
  };
  return {
    product: productJson.data.product,
    shop: {
      name: shopData.name,
      domain: shopData.myshopifyDomain,
      currencyCode: shopData.currencyCode ?? "USD"
    },
    questions,
    pricing,
    productId: decodedId
  };
}
async function action$5({
  request,
  params
}) {
  await authenticate.admin(request);
  const decodedId = decodeURIComponent(params.productId);
  const formData = await request.formData();
  const pricing = JSON.parse(formData.get("pricing"));
  const config = await prisma.productConfig.findUnique({
    where: {
      productId: decodedId
    }
  });
  if (!config) return {
    error: "Config not found"
  };
  const existingOpts = config.options ?? {};
  await prisma.productConfig.update({
    where: {
      productId: decodedId
    },
    data: {
      options: {
        ...existingOpts,
        pricing
      }
    }
  });
  return {
    success: true
  };
}
function getCurrencySymbol(code) {
  var _a;
  try {
    return ((_a = new Intl.NumberFormat("en", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).formatToParts(0).find((p) => p.type === "currency")) == null ? void 0 : _a.value) ?? code;
  } catch {
    return code;
  }
}
function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
function TopBar({
  productName,
  productId
}) {
  const enc = encodeURIComponent(productId);
  const tabs = [{
    id: "build",
    label: "Build",
    href: `/app/configurator-setup/${enc}`,
    active: false,
    dot: false
  }, {
    id: "pricing",
    label: "Pricing",
    href: `/app/pricing/${enc}`,
    active: true,
    dot: false
  }, {
    id: "variants",
    label: "Variants",
    href: `/app/variants/${enc}`,
    active: false,
    dot: true
  }, {
    id: "connect",
    label: "Connect",
    href: `/app/pricing/${enc}`,
    active: false,
    dot: false
  }];
  return /* @__PURE__ */ jsxs("div", {
    style: {
      height: 48,
      borderBottom: "1px solid #e5e7eb",
      display: "flex",
      alignItems: "center",
      background: "#fff",
      padding: "0 20px",
      flexShrink: 0,
      gap: 0
    },
    children: [/* @__PURE__ */ jsxs("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginRight: 32
      },
      children: [/* @__PURE__ */ jsx("div", {
        style: {
          width: 28,
          height: 28,
          background: "#111827",
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0
        },
        children: /* @__PURE__ */ jsxs("svg", {
          width: "16",
          height: "16",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "#fff",
          strokeWidth: "2",
          strokeLinecap: "round",
          children: [/* @__PURE__ */ jsx("circle", {
            cx: "12",
            cy: "7",
            r: "4"
          }), /* @__PURE__ */ jsx("path", {
            d: "M6 21v-2a6 6 0 0112 0v2"
          })]
        })
      }), /* @__PURE__ */ jsx("span", {
        style: {
          fontSize: 13,
          fontWeight: 700,
          color: "#111827",
          letterSpacing: "0.02em"
        },
        children: productName.toUpperCase()
      }), /* @__PURE__ */ jsx("svg", {
        width: "12",
        height: "12",
        fill: "none",
        stroke: "#9ca3af",
        strokeWidth: "2",
        viewBox: "0 0 24 24",
        children: /* @__PURE__ */ jsx("path", {
          d: "M6 9l6 6 6-6"
        })
      })]
    }), /* @__PURE__ */ jsx("div", {
      style: {
        display: "flex",
        alignItems: "stretch",
        height: "100%"
      },
      children: tabs.map((tab) => /* @__PURE__ */ jsxs(Link, {
        to: tab.href,
        prefetch: tab.active ? "none" : "intent",
        style: {
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "0 16px",
          fontSize: 13,
          fontWeight: tab.active ? 600 : 400,
          color: tab.active ? "#005bd3" : "#6b7280",
          textDecoration: "none",
          borderBottom: tab.active ? "2px solid #005bd3" : "2px solid transparent",
          boxSizing: "border-box"
        },
        children: [tab.label, tab.dot && /* @__PURE__ */ jsx("span", {
          style: {
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#22c55e",
            flexShrink: 0
          }
        })]
      }, tab.id))
    })]
  });
}
function InlineDropdown({
  placeholder,
  value,
  options,
  onChange,
  disabled
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);
  const selected = options.find((o) => o.value === value);
  return /* @__PURE__ */ jsxs("div", {
    ref,
    style: {
      position: "relative",
      flex: 1
    },
    children: [/* @__PURE__ */ jsxs("button", {
      disabled,
      onClick: () => !disabled && setOpen((v) => !v),
      style: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "7px 10px",
        border: `1px solid ${open ? "#005bd3" : "#e5e7eb"}`,
        borderRadius: 6,
        background: disabled ? "#f9fafb" : "#fff",
        cursor: disabled ? "default" : "pointer",
        fontSize: 13,
        color: value ? "#111827" : "#9ca3af",
        outline: "none"
      },
      children: [/* @__PURE__ */ jsx("span", {
        children: (selected == null ? void 0 : selected.label) ?? placeholder
      }), /* @__PURE__ */ jsx("svg", {
        width: "10",
        height: "10",
        fill: "none",
        stroke: "#9ca3af",
        strokeWidth: "2",
        viewBox: "0 0 24 24",
        children: /* @__PURE__ */ jsx("path", {
          d: "M6 9l6 6 6-6"
        })
      })]
    }), open && /* @__PURE__ */ jsx("div", {
      style: {
        position: "absolute",
        top: "calc(100% + 2px)",
        left: 0,
        right: 0,
        zIndex: 200,
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
        maxHeight: 220,
        overflowY: "auto"
      },
      children: options.map((o) => /* @__PURE__ */ jsx("button", {
        onClick: () => {
          onChange(o.value);
          setOpen(false);
        },
        style: {
          display: "block",
          width: "100%",
          padding: "9px 12px",
          border: "none",
          background: o.value === value ? "#eff6ff" : "none",
          cursor: "pointer",
          fontSize: 13,
          textAlign: "left",
          color: o.value === value ? "#005bd3" : "#111827"
        },
        children: o.label
      }, o.value))
    })]
  });
}
function AddExtraPriceForm({
  questions,
  currencySymbol,
  onAdd,
  onClose
}) {
  const [questionId, setQuestionId] = useState("");
  const [answerId, setAnswerId] = useState("");
  const [price, setPrice] = useState(0);
  const ref = useRef(null);
  const questionOptions = questions.map((q) => ({
    value: q.id,
    label: q.name.toUpperCase()
  }));
  const selQ = questions.find((q) => q.id === questionId);
  const answerOptions = selQ ? getQuestionAnswers(selQ) : [];
  const canAdd = !!(questionId && answerId);
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);
  const handleAdd = (keepOpen) => {
    if (!canAdd) return;
    onAdd({
      questionId,
      answerId,
      price
    }, keepOpen);
    if (keepOpen) {
      setQuestionId("");
      setAnswerId("");
      setPrice(0);
    }
  };
  return /* @__PURE__ */ jsx("div", {
    ref,
    style: {
      position: "absolute",
      top: "calc(100% + 6px)",
      right: 0,
      zIndex: 300,
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 10,
      boxShadow: "0 8px 28px rgba(0,0,0,0.14)",
      padding: 16,
      width: 290
    },
    children: /* @__PURE__ */ jsxs("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 8
      },
      children: [/* @__PURE__ */ jsx(InlineDropdown, {
        placeholder: "Question",
        value: questionId,
        options: questionOptions,
        onChange: (v) => {
          setQuestionId(v);
          setAnswerId("");
        }
      }), /* @__PURE__ */ jsx(InlineDropdown, {
        placeholder: "Answer",
        value: answerId,
        options: answerOptions,
        onChange: setAnswerId,
        disabled: !questionId
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          alignItems: "center",
          border: "1px solid #e5e7eb",
          borderRadius: 6,
          overflow: "hidden"
        },
        children: [/* @__PURE__ */ jsx("span", {
          style: {
            padding: "8px 10px",
            background: "#f9fafb",
            borderRight: "1px solid #e5e7eb",
            fontSize: 13,
            color: "#6b7280",
            flexShrink: 0
          },
          children: currencySymbol
        }), /* @__PURE__ */ jsx("input", {
          type: "number",
          min: "0",
          step: "0.01",
          value: price,
          onChange: (e) => setPrice(parseFloat(e.target.value) || 0),
          style: {
            flex: 1,
            border: "none",
            padding: "8px 10px",
            fontSize: 13,
            outline: "none",
            width: 60
          }
        })]
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          gap: 8,
          justifyContent: "flex-end",
          paddingTop: 4
        },
        children: [/* @__PURE__ */ jsx("button", {
          onClick: () => handleAdd(true),
          disabled: !canAdd,
          style: {
            padding: "7px 14px",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            background: "#fff",
            cursor: canAdd ? "pointer" : "default",
            fontSize: 13,
            color: canAdd ? "#111827" : "#9ca3af"
          },
          children: "Add another"
        }), /* @__PURE__ */ jsx("button", {
          onClick: () => handleAdd(false),
          disabled: !canAdd,
          style: {
            padding: "7px 14px",
            border: "none",
            borderRadius: 6,
            background: canAdd ? "#005bd3" : "#e5e7eb",
            color: canAdd ? "#fff" : "#9ca3af",
            cursor: canAdd ? "pointer" : "default",
            fontSize: 13,
            fontWeight: 600
          },
          children: "Add"
        })]
      })]
    })
  });
}
function DeleteConfirmModal({
  count,
  onConfirm,
  onCancel
}) {
  return /* @__PURE__ */ jsx("div", {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1e3
    },
    children: /* @__PURE__ */ jsxs("div", {
      style: {
        background: "#fff",
        borderRadius: 12,
        padding: 24,
        width: 420,
        maxWidth: "90vw",
        boxShadow: "0 20px 40px rgba(0,0,0,0.16)"
      },
      children: [/* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12
        },
        children: [/* @__PURE__ */ jsxs("span", {
          style: {
            fontSize: 16,
            fontWeight: 700,
            color: "#111827"
          },
          children: ["Delete extra price", count > 1 ? "s" : ""]
        }), /* @__PURE__ */ jsx("button", {
          onClick: onCancel,
          style: {
            background: "none",
            border: "none",
            fontSize: 22,
            cursor: "pointer",
            color: "#6b7280",
            lineHeight: 1
          },
          children: "×"
        })]
      }), /* @__PURE__ */ jsxs("p", {
        style: {
          margin: "0 0 22px",
          fontSize: 14,
          color: "#374151",
          lineHeight: 1.6
        },
        children: ["Are you sure you want to delete ", count > 1 ? `these ${count} extra prices` : "this extra price", "?"]
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          justifyContent: "flex-end",
          gap: 10
        },
        children: [/* @__PURE__ */ jsx("button", {
          onClick: onCancel,
          style: {
            padding: "8px 18px",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            background: "#fff",
            cursor: "pointer",
            fontSize: 14
          },
          children: "Cancel"
        }), /* @__PURE__ */ jsx("button", {
          onClick: onConfirm,
          style: {
            padding: "8px 18px",
            border: "none",
            borderRadius: 6,
            background: "#ef4444",
            color: "#fff",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600
          },
          children: "Delete"
        })]
      })]
    })
  });
}
function BulkUpdateModal({
  count,
  currencySymbol,
  onUpdate,
  onCancel
}) {
  const [price, setPrice] = useState(0);
  return /* @__PURE__ */ jsx("div", {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1e3
    },
    children: /* @__PURE__ */ jsxs("div", {
      style: {
        background: "#fff",
        borderRadius: 12,
        padding: 24,
        width: 380,
        maxWidth: "90vw",
        boxShadow: "0 20px 40px rgba(0,0,0,0.16)"
      },
      children: [/* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10
        },
        children: [/* @__PURE__ */ jsxs("span", {
          style: {
            fontSize: 16,
            fontWeight: 700,
            color: "#111827"
          },
          children: ["Update ", count, " extra price", count !== 1 ? "s" : ""]
        }), /* @__PURE__ */ jsx("button", {
          onClick: onCancel,
          style: {
            background: "none",
            border: "none",
            fontSize: 22,
            cursor: "pointer",
            color: "#6b7280",
            lineHeight: 1
          },
          children: "×"
        })]
      }), /* @__PURE__ */ jsx("p", {
        style: {
          margin: "0 0 14px",
          fontSize: 13,
          color: "#6b7280"
        },
        children: "Set a new price for the selected extra prices."
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          alignItems: "center",
          border: "1px solid #e5e7eb",
          borderRadius: 6,
          overflow: "hidden",
          marginBottom: 18
        },
        children: [/* @__PURE__ */ jsx("span", {
          style: {
            padding: "8px 10px",
            background: "#f9fafb",
            borderRight: "1px solid #e5e7eb",
            fontSize: 13,
            color: "#6b7280",
            flexShrink: 0
          },
          children: currencySymbol
        }), /* @__PURE__ */ jsx("input", {
          type: "number",
          min: "0",
          step: "0.01",
          value: price,
          onChange: (e) => setPrice(parseFloat(e.target.value) || 0),
          style: {
            flex: 1,
            border: "none",
            padding: "8px 10px",
            fontSize: 13,
            outline: "none"
          },
          autoFocus: true
        })]
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          justifyContent: "flex-end",
          gap: 10
        },
        children: [/* @__PURE__ */ jsx("button", {
          onClick: onCancel,
          style: {
            padding: "8px 18px",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            background: "#fff",
            cursor: "pointer",
            fontSize: 14
          },
          children: "Cancel"
        }), /* @__PURE__ */ jsx("button", {
          onClick: () => onUpdate(price),
          style: {
            padding: "8px 18px",
            border: "none",
            borderRadius: 6,
            background: "#005bd3",
            color: "#fff",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600
          },
          children: "Update"
        })]
      })]
    })
  });
}
function CreateEquationModal({
  questions,
  currencySymbol,
  onSave,
  onCancel,
  initial
}) {
  const [displayCumulative, setDisplayCumulative] = useState((initial == null ? void 0 : initial.displayCumulative) ?? true);
  const [lines, setLines] = useState((initial == null ? void 0 : initial.lines) ?? [{
    id: uid(),
    type: "question"
  }, {
    id: uid(),
    type: "question"
  }]);
  const [operators, setOperators] = useState((initial == null ? void 0 : initial.operators) ?? ["+"]);
  const [minResult, setMinResult] = useState((initial == null ? void 0 : initial.minResult) ?? 0);
  const [maxResult, setMaxResult] = useState((initial == null ? void 0 : initial.maxResult) != null ? String(initial.maxResult) : "");
  const [openOpIdx, setOpenOpIdx] = useState(null);
  const questionOptions = questions.map((q) => ({
    value: q.id,
    label: q.name.toUpperCase()
  }));
  const addLine = () => {
    setLines((prev) => [...prev, {
      id: uid(),
      type: "question"
    }]);
    setOperators((prev) => [...prev, "+"]);
  };
  const removeLine = (idx) => {
    if (lines.length <= 2) return;
    setLines((prev) => prev.filter((_, i) => i !== idx));
    setOperators((prev) => {
      const opIdx = Math.min(idx, prev.length - 1);
      return prev.filter((_, i) => i !== opIdx);
    });
  };
  const updateLine = (idx, patch) => setLines((prev) => prev.map((l, i) => i === idx ? {
    ...l,
    ...patch
  } : l));
  const lineName = (line, idx) => {
    if (line.type === "number") return String(line.numberValue ?? 0);
    const q = questions.find((q2) => q2.id === line.questionId);
    return q ? q.name : `Question ${idx + 1}`;
  };
  const equationPreview = lines.map((l, i) => i === 0 ? lineName(l, i) : ` ${operators[i - 1] ?? "+"} ${lineName(l, i)}`).join("");
  const isValid = lines.every((l) => l.type === "number" || !!l.questionId);
  return /* @__PURE__ */ jsx("div", {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1e3
    },
    onClick: (e) => {
      if (e.target === e.currentTarget) onCancel();
    },
    children: /* @__PURE__ */ jsxs("div", {
      style: {
        background: "#fff",
        borderRadius: 12,
        padding: 24,
        width: 520,
        maxWidth: "92vw",
        maxHeight: "90vh",
        overflowY: "auto",
        boxShadow: "0 20px 50px rgba(0,0,0,0.2)"
      },
      children: [/* @__PURE__ */ jsxs("div", {
        style: {
          marginBottom: 16
        },
        children: [/* @__PURE__ */ jsx("div", {
          style: {
            fontSize: 16,
            fontWeight: 700,
            color: "#111827",
            marginBottom: 4
          },
          children: initial ? "Edit equation" : "Create equation"
        }), /* @__PURE__ */ jsx("div", {
          style: {
            fontSize: 13,
            color: "#6b7280"
          },
          children: "Select question(s) or number(s) to add to the equation."
        })]
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 0",
          marginBottom: 16,
          borderBottom: "1px solid #f3f4f6"
        },
        children: [/* @__PURE__ */ jsxs("div", {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 6
          },
          children: [/* @__PURE__ */ jsx("span", {
            style: {
              fontSize: 13,
              fontWeight: 500,
              color: "#374151"
            },
            children: "Display cumulative price"
          }), /* @__PURE__ */ jsx("span", {
            title: "Shows the running total price as the customer makes selections",
            style: {
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "#e5e7eb",
              fontSize: 10,
              color: "#6b7280",
              cursor: "help",
              fontStyle: "italic",
              fontWeight: 700
            },
            children: "i"
          })]
        }), /* @__PURE__ */ jsx("button", {
          onClick: () => setDisplayCumulative((v) => !v),
          style: {
            position: "relative",
            width: 40,
            height: 22,
            borderRadius: 11,
            border: "none",
            cursor: "pointer",
            flexShrink: 0,
            background: displayCumulative ? "#f59e0b" : "#d1d5db",
            padding: 0
          },
          children: /* @__PURE__ */ jsx("span", {
            style: {
              position: "absolute",
              top: 2,
              left: displayCumulative ? 20 : 2,
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "#fff",
              transition: "left 0.15s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
            }
          })
        })]
      }), /* @__PURE__ */ jsx("div", {
        style: {
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginBottom: 12
        },
        children: lines.map((line, idx) => /* @__PURE__ */ jsxs("div", {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 6
          },
          children: [/* @__PURE__ */ jsx("div", {
            style: {
              width: 28,
              height: 28,
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              background: "#f9fafb"
            },
            children: /* @__PURE__ */ jsxs("svg", {
              width: "13",
              height: "13",
              fill: "none",
              stroke: "#6b7280",
              strokeWidth: "2",
              viewBox: "0 0 24 24",
              children: [/* @__PURE__ */ jsx("rect", {
                x: "4",
                y: "3",
                width: "16",
                height: "18",
                rx: "2"
              }), /* @__PURE__ */ jsx("path", {
                d: "M8 8h8M8 12h8M8 16h5"
              })]
            })
          }), /* @__PURE__ */ jsx("button", {
            onClick: () => updateLine(idx, {
              type: line.type === "number" ? "question" : "number",
              questionId: void 0,
              numberValue: 0
            }),
            title: line.type === "number" ? "Switch to question" : "Switch to number",
            style: {
              width: 28,
              height: 28,
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              background: line.type === "number" ? "#eff6ff" : "#f9fafb",
              cursor: "pointer",
              fontSize: 9,
              fontWeight: 700,
              color: line.type === "number" ? "#005bd3" : "#6b7280"
            },
            children: "1/2/3"
          }), line.type === "question" ? /* @__PURE__ */ jsx(InlineDropdown, {
            placeholder: "Question",
            value: line.questionId ?? "",
            options: questionOptions,
            onChange: (v) => updateLine(idx, {
              questionId: v
            })
          }) : /* @__PURE__ */ jsxs("div", {
            style: {
              flex: 1,
              display: "flex",
              alignItems: "center",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              overflow: "hidden"
            },
            children: [/* @__PURE__ */ jsx("span", {
              style: {
                padding: "7px 8px",
                background: "#f9fafb",
                borderRight: "1px solid #e5e7eb",
                fontSize: 12,
                color: "#6b7280"
              },
              children: currencySymbol
            }), /* @__PURE__ */ jsx("input", {
              type: "number",
              min: "0",
              value: line.numberValue ?? 0,
              onChange: (e) => updateLine(idx, {
                numberValue: parseFloat(e.target.value) || 0
              }),
              style: {
                flex: 1,
                border: "none",
                padding: "7px 8px",
                fontSize: 13,
                outline: "none"
              }
            })]
          }), idx < lines.length - 1 && /* @__PURE__ */ jsxs("div", {
            style: {
              position: "relative",
              flexShrink: 0
            },
            children: [/* @__PURE__ */ jsxs("button", {
              onClick: () => setOpenOpIdx((v) => v === idx ? null : idx),
              style: {
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "5px 10px",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                background: "#fff",
                cursor: "pointer",
                fontSize: 15,
                fontWeight: 700,
                color: "#374151"
              },
              children: [operators[idx] ?? "+", /* @__PURE__ */ jsx("svg", {
                width: "10",
                height: "10",
                fill: "none",
                stroke: "#9ca3af",
                strokeWidth: "2",
                viewBox: "0 0 24 24",
                children: /* @__PURE__ */ jsx("path", {
                  d: "M6 9l6 6 6-6"
                })
              })]
            }), openOpIdx === idx && /* @__PURE__ */ jsx("div", {
              style: {
                position: "absolute",
                top: "calc(100% + 2px)",
                left: 0,
                zIndex: 400,
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
                overflow: "hidden"
              },
              children: ["+", "-", "×", "÷"].map((op) => /* @__PURE__ */ jsx("button", {
                onClick: () => {
                  setOperators((prev) => prev.map((o, i) => i === idx ? op : o));
                  setOpenOpIdx(null);
                },
                style: {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 44,
                  height: 38,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 18,
                  fontWeight: 700,
                  background: operators[idx] === op ? "#005bd3" : "#fff",
                  color: operators[idx] === op ? "#fff" : "#111827"
                },
                children: op
              }, op))
            })]
          }), /* @__PURE__ */ jsx("button", {
            onClick: () => removeLine(idx),
            disabled: lines.length <= 2,
            title: "Remove line",
            style: {
              width: 28,
              height: 28,
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#fff",
              cursor: lines.length > 2 ? "pointer" : "default",
              fontSize: 16,
              fontWeight: 700,
              color: lines.length > 2 ? "#6b7280" : "#d1d5db"
            },
            children: "⋮"
          })]
        }, line.id))
      }), /* @__PURE__ */ jsx("button", {
        onClick: addLine,
        style: {
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 14px",
          border: "1px dashed #d1d5db",
          borderRadius: 6,
          background: "#fafafa",
          cursor: "pointer",
          fontSize: 13,
          color: "#374151",
          marginBottom: 18,
          width: "fit-content"
        },
        children: "+ Add line"
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          marginBottom: 16
        },
        children: [/* @__PURE__ */ jsx("label", {
          style: {
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            color: "#6b7280",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            marginBottom: 8
          },
          children: "Result (=)"
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            display: "flex",
            gap: 8
          },
          children: [/* @__PURE__ */ jsxs("div", {
            style: {
              display: "flex",
              alignItems: "center",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              overflow: "hidden",
              flex: 1
            },
            children: [/* @__PURE__ */ jsxs("span", {
              style: {
                padding: "7px 9px",
                background: "#f9fafb",
                borderRight: "1px solid #e5e7eb",
                fontSize: 12,
                color: "#6b7280",
                whiteSpace: "nowrap"
              },
              children: ["Min ", currencySymbol]
            }), /* @__PURE__ */ jsx("input", {
              type: "number",
              min: "0",
              value: minResult,
              onChange: (e) => setMinResult(parseFloat(e.target.value) || 0),
              style: {
                flex: 1,
                border: "none",
                padding: "7px 8px",
                fontSize: 13,
                outline: "none",
                width: 50
              }
            })]
          }), /* @__PURE__ */ jsxs("div", {
            style: {
              display: "flex",
              alignItems: "center",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              overflow: "hidden",
              flex: 1
            },
            children: [/* @__PURE__ */ jsxs("span", {
              style: {
                padding: "7px 9px",
                background: "#f9fafb",
                borderRight: "1px solid #e5e7eb",
                fontSize: 12,
                color: "#6b7280",
                whiteSpace: "nowrap"
              },
              children: ["Max ", currencySymbol]
            }), /* @__PURE__ */ jsx("input", {
              type: "number",
              min: "0",
              value: maxResult,
              onChange: (e) => setMaxResult(e.target.value),
              placeholder: "∞",
              style: {
                flex: 1,
                border: "none",
                padding: "7px 8px",
                fontSize: 13,
                outline: "none",
                width: 50
              }
            })]
          })]
        })]
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: "10px 14px",
          marginBottom: 22
        },
        children: [/* @__PURE__ */ jsx("div", {
          style: {
            fontSize: 11,
            fontWeight: 600,
            color: "#9ca3af",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 4
          },
          children: "Your equation"
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            fontSize: 13,
            color: "#374151"
          },
          children: ["(", equationPreview, ") = Extra price (", currencySymbol, ")"]
        })]
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          justifyContent: "flex-end",
          gap: 10
        },
        children: [/* @__PURE__ */ jsx("button", {
          onClick: onCancel,
          style: {
            padding: "9px 20px",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            background: "#fff",
            cursor: "pointer",
            fontSize: 14
          },
          children: "Cancel"
        }), /* @__PURE__ */ jsx("button", {
          onClick: () => {
            if (!isValid) return;
            onSave({
              id: (initial == null ? void 0 : initial.id) ?? `eq-${uid()}`,
              displayCumulative,
              lines,
              operators,
              minResult,
              maxResult: maxResult !== "" ? parseFloat(maxResult) : null
            });
          },
          disabled: !isValid,
          style: {
            padding: "9px 20px",
            border: "none",
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            background: isValid ? "#005bd3" : "#e5e7eb",
            color: isValid ? "#fff" : "#9ca3af",
            cursor: isValid ? "pointer" : "default"
          },
          children: initial ? "Update" : "Add"
        })]
      })]
    })
  });
}
function FilterChip({
  label: label2,
  options,
  value,
  onChange,
  onClear,
  disabled
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);
  const selected = options.find((o) => o.value === value);
  return /* @__PURE__ */ jsxs("div", {
    ref,
    style: {
      position: "relative"
    },
    children: [/* @__PURE__ */ jsx("button", {
      disabled,
      onClick: () => !disabled && setOpen((v) => !v),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 10px",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        background: value ? "#eff6ff" : "#fff",
        cursor: disabled ? "default" : "pointer",
        fontSize: 12,
        color: value ? "#005bd3" : disabled ? "#9ca3af" : "#374151"
      },
      children: value ? /* @__PURE__ */ jsxs(Fragment, {
        children: [(selected == null ? void 0 : selected.label) ?? value, /* @__PURE__ */ jsx("span", {
          onClick: (e) => {
            e.stopPropagation();
            onClear();
          },
          style: {
            marginLeft: 2,
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 13,
            lineHeight: 1
          },
          children: "×"
        })]
      }) : /* @__PURE__ */ jsxs(Fragment, {
        children: ["⊕ ", label2]
      })
    }), open && options.length > 0 && /* @__PURE__ */ jsx("div", {
      style: {
        position: "absolute",
        top: "calc(100% + 4px)",
        left: 0,
        zIndex: 200,
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
        minWidth: 180,
        maxHeight: 210,
        overflowY: "auto"
      },
      children: options.map((o) => /* @__PURE__ */ jsx("button", {
        onClick: () => {
          onChange(o.value);
          setOpen(false);
        },
        style: {
          display: "block",
          width: "100%",
          padding: "8px 12px",
          border: "none",
          background: o.value === value ? "#eff6ff" : "none",
          cursor: "pointer",
          fontSize: 12,
          textAlign: "left",
          color: o.value === value ? "#005bd3" : "#111827"
        },
        children: o.label
      }, o.value))
    })]
  });
}
const app_pricing_$productId = UNSAFE_withComponentProps(function PricingPage() {
  const {
    product,
    shop,
    questions,
    pricing: initPricing,
    productId
  } = useLoaderData();
  useActionData();
  const submit = useSubmit();
  const [pricing, setPricing] = useState(initPricing);
  const [activeTab, setActiveTab] = useState("extra-prices");
  const [selectedIds, setSelectedIds] = useState(/* @__PURE__ */ new Set());
  const [filterQuestion, setFilterQuestion] = useState(null);
  const [filterAnswer, setFilterAnswer] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteTargetIds, setDeleteTargetIds] = useState(null);
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [showEquationModal, setShowEquationModal] = useState(false);
  const [editingEquation, setEditingEquation] = useState(null);
  const bulkMenuRef = useRef(null);
  const currencyCode = shop.currencyCode;
  const currencySymbol = getCurrencySymbol(currencyCode);
  const answerable = questions.filter((q) => getQuestionAnswers(q).length > 0);
  const questionOptions = answerable.map((q) => ({
    value: q.id,
    label: q.name.toUpperCase()
  }));
  const filterQObj = answerable.find((q) => q.id === filterQuestion) ?? null;
  const filterAnswerOptions = filterQObj ? getQuestionAnswers(filterQObj) : [];
  const filteredPrices = pricing.extraPrices.filter((ep) => {
    if (filterQuestion && ep.questionId !== filterQuestion) return false;
    if (filterAnswer && ep.answerId !== filterAnswer) return false;
    return true;
  });
  const getQName = useCallback((qId) => {
    var _a, _b;
    return ((_b = (_a = answerable.find((q) => q.id === qId)) == null ? void 0 : _a.name) == null ? void 0 : _b.toUpperCase()) ?? qId;
  }, [answerable]);
  const getAName = useCallback((qId, aId) => {
    var _a;
    const q = answerable.find((q2) => q2.id === qId);
    if (!q) return aId;
    return ((_a = getQuestionAnswers(q).find((a) => a.value === aId)) == null ? void 0 : _a.label) ?? aId;
  }, [answerable]);
  const isAllSelected = filteredPrices.length > 0 && filteredPrices.every((ep) => selectedIds.has(ep.id));
  useEffect(() => {
    if (!showBulkMenu) return;
    const handler = (e) => {
      if (bulkMenuRef.current && !bulkMenuRef.current.contains(e.target)) setShowBulkMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showBulkMenu]);
  const handleAddPrice = (entry2, keepOpen) => {
    const newEntry = {
      ...entry2,
      id: `ep-${uid()}`
    };
    setPricing((p) => ({
      ...p,
      extraPrices: [...p.extraPrices, newEntry]
    }));
    if (!keepOpen) setShowAddForm(false);
  };
  const handleDeleteConfirmed = () => {
    if (!deleteTargetIds) return;
    const ids = new Set(deleteTargetIds);
    setPricing((p) => ({
      ...p,
      extraPrices: p.extraPrices.filter((ep) => !ids.has(ep.id))
    }));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      deleteTargetIds.forEach((id) => next.delete(id));
      return next;
    });
    setDeleteTargetIds(null);
  };
  const handleBulkUpdate = (price) => {
    setPricing((p) => ({
      ...p,
      extraPrices: p.extraPrices.map((ep) => selectedIds.has(ep.id) ? {
        ...ep,
        price
      } : ep)
    }));
    setSelectedIds(/* @__PURE__ */ new Set());
    setShowBulkUpdate(false);
  };
  const handleSaveEquation = (eq) => {
    setPricing((p) => {
      const idx = p.equations.findIndex((e) => e.id === eq.id);
      if (idx >= 0) {
        const next = [...p.equations];
        next[idx] = eq;
        return {
          ...p,
          equations: next
        };
      }
      return {
        ...p,
        equations: [...p.equations, eq]
      };
    });
    setShowEquationModal(false);
    setEditingEquation(null);
  };
  const handleDeleteEquation = (id) => setPricing((p) => ({
    ...p,
    equations: p.equations.filter((e) => e.id !== id)
  }));
  const toggleSelect = (id) => setSelectedIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  const toggleSelectAll = () => setSelectedIds(isAllSelected ? /* @__PURE__ */ new Set() : new Set(filteredPrices.map((ep) => ep.id)));
  const handleSave = () => {
    const fd = new FormData();
    fd.append("pricing", JSON.stringify(pricing));
    submit(fd, {
      method: "post"
    });
  };
  const handleDiscard = () => {
    setPricing(initPricing);
    setSelectedIds(/* @__PURE__ */ new Set());
    setFilterQuestion(null);
    setFilterAnswer(null);
  };
  const handleAddButtonClick = () => {
    if (activeTab === "extra-prices") {
      setShowAddForm((v) => !v);
    } else {
      setEditingEquation(null);
      setShowEquationModal(true);
    }
  };
  return /* @__PURE__ */ jsxs("div", {
    style: {
      position: "fixed",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      fontSize: 14,
      color: "#111827",
      background: "#f6f6f7"
    },
    children: [/* @__PURE__ */ jsx(TopBar, {
      productName: product.title,
      productId
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        flex: 1,
        overflow: "auto",
        padding: "20px 24px"
      },
      children: [/* @__PURE__ */ jsx("h1", {
        style: {
          margin: "0 0 18px",
          fontSize: 20,
          fontWeight: 700,
          color: "#111827"
        },
        children: "Pricing"
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          display: "flex",
          gap: 16,
          alignItems: "flex-start"
        },
        children: [/* @__PURE__ */ jsxs("div", {
          style: {
            width: 224,
            flexShrink: 0
          },
          children: [/* @__PURE__ */ jsx("div", {
            style: {
              fontSize: 12,
              fontWeight: 600,
              color: "#374151",
              marginBottom: 10,
              textTransform: "none",
              letterSpacing: 0
            },
            children: "Online stores"
          }), /* @__PURE__ */ jsx("div", {
            style: {
              border: "2px solid #005bd3",
              borderRadius: 10,
              padding: "10px 12px",
              background: "#fff",
              cursor: "pointer"
            },
            children: /* @__PURE__ */ jsxs("div", {
              style: {
                display: "flex",
                alignItems: "center",
                gap: 8
              },
              children: [/* @__PURE__ */ jsx("div", {
                style: {
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  background: "#008060",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                },
                children: /* @__PURE__ */ jsxs("svg", {
                  width: "18",
                  height: "18",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "#fff",
                  strokeWidth: "2",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  children: [/* @__PURE__ */ jsx("path", {
                    d: "M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
                  }), /* @__PURE__ */ jsx("line", {
                    x1: "3",
                    y1: "6",
                    x2: "21",
                    y2: "6"
                  }), /* @__PURE__ */ jsx("path", {
                    d: "M16 10a4 4 0 01-8 0"
                  })]
                })
              }), /* @__PURE__ */ jsxs("div", {
                style: {
                  flex: 1,
                  minWidth: 0
                },
                children: [/* @__PURE__ */ jsx("div", {
                  style: {
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#005bd3",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  },
                  children: shop.name
                }), /* @__PURE__ */ jsx("div", {
                  style: {
                    fontSize: 11,
                    color: "#9ca3af",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    marginTop: 1
                  },
                  children: shop.domain
                })]
              }), /* @__PURE__ */ jsx("span", {
                style: {
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#6b7280",
                  background: "#f3f4f6",
                  padding: "2px 6px",
                  borderRadius: 4,
                  flexShrink: 0
                },
                children: currencyCode
              })]
            })
          })]
        }), /* @__PURE__ */ jsxs("div", {
          style: {
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            minWidth: 0
          },
          children: [/* @__PURE__ */ jsx("div", {
            style: {
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              overflow: "hidden"
            },
            children: /* @__PURE__ */ jsxs("div", {
              style: {
                display: "grid",
                gridTemplateColumns: "180px 1fr 120px",
                borderBottom: "none"
              },
              children: [/* @__PURE__ */ jsxs("div", {
                style: {
                  padding: "14px 16px",
                  borderRight: "1px solid #e5e7eb"
                },
                children: [/* @__PURE__ */ jsx("div", {
                  style: {
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: 10
                  },
                  children: "Base price"
                }), /* @__PURE__ */ jsxs("div", {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    border: "1px solid #e5e7eb",
                    borderRadius: 6,
                    overflow: "hidden",
                    maxWidth: 110
                  },
                  children: [/* @__PURE__ */ jsx("span", {
                    style: {
                      padding: "7px 9px",
                      background: "#f9fafb",
                      borderRight: "1px solid #e5e7eb",
                      fontSize: 13,
                      color: "#6b7280",
                      flexShrink: 0
                    },
                    children: currencySymbol
                  }), /* @__PURE__ */ jsx("input", {
                    type: "number",
                    min: "0",
                    step: "0.01",
                    value: pricing.basePrice,
                    onChange: (e) => setPricing((p) => ({
                      ...p,
                      basePrice: parseFloat(e.target.value) || 0
                    })),
                    style: {
                      flex: 1,
                      border: "none",
                      padding: "7px 8px",
                      fontSize: 13,
                      outline: "none",
                      width: 50
                    }
                  })]
                })]
              }), /* @__PURE__ */ jsxs("div", {
                style: {
                  padding: "14px 16px",
                  borderRight: "1px solid #e5e7eb"
                },
                children: [/* @__PURE__ */ jsx("div", {
                  style: {
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: 10
                  },
                  children: "Display taxes"
                }), /* @__PURE__ */ jsxs("div", {
                  style: {
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10
                  },
                  children: [/* @__PURE__ */ jsx("button", {
                    onClick: () => setPricing((p) => ({
                      ...p,
                      displayTaxes: !p.displayTaxes
                    })),
                    style: {
                      position: "relative",
                      width: 38,
                      height: 22,
                      borderRadius: 11,
                      border: "none",
                      cursor: "pointer",
                      flexShrink: 0,
                      marginTop: 1,
                      padding: 0,
                      background: pricing.displayTaxes ? "#005bd3" : "#d1d5db"
                    },
                    children: /* @__PURE__ */ jsx("span", {
                      style: {
                        position: "absolute",
                        top: 2,
                        left: pricing.displayTaxes ? 18 : 2,
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "#fff",
                        transition: "left 0.15s",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                      }
                    })
                  }), /* @__PURE__ */ jsx("span", {
                    style: {
                      fontSize: 12,
                      color: "#6b7280",
                      lineHeight: 1.6
                    },
                    children: "Enable this to include taxes with the customization price."
                  })]
                })]
              }), /* @__PURE__ */ jsxs("div", {
                style: {
                  padding: "14px 16px"
                },
                children: [/* @__PURE__ */ jsx("div", {
                  style: {
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: 10
                  },
                  children: "Currency"
                }), /* @__PURE__ */ jsx("div", {
                  style: {
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#111827"
                  },
                  children: currencyCode
                })]
              })]
            })
          }), /* @__PURE__ */ jsxs("div", {
            style: {
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              overflow: "visible"
            },
            children: [/* @__PURE__ */ jsxs("div", {
              style: {
                padding: "14px 16px",
                borderBottom: "1px solid #e5e7eb"
              },
              children: [/* @__PURE__ */ jsx("div", {
                style: {
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#111827"
                },
                children: "Additional pricing"
              }), /* @__PURE__ */ jsx("div", {
                style: {
                  fontSize: 12,
                  color: "#9ca3af",
                  marginTop: 3
                },
                children: "Non-published questions and answers won't be available."
              })]
            }), /* @__PURE__ */ jsxs("div", {
              style: {
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 16px",
                borderBottom: "1px solid #e5e7eb"
              },
              children: [/* @__PURE__ */ jsx("div", {
                style: {
                  display: "flex",
                  alignItems: "stretch",
                  height: 44
                },
                children: ["extra-prices", "equations"].map((tab) => {
                  const isActive = activeTab === tab;
                  return /* @__PURE__ */ jsxs("button", {
                    onClick: () => {
                      setActiveTab(tab);
                      setShowAddForm(false);
                    },
                    style: {
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "0 4px",
                      marginRight: 18,
                      fontSize: 13,
                      fontWeight: 500,
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      color: isActive ? "#005bd3" : "#6b7280",
                      borderBottom: isActive ? "2px solid #005bd3" : "2px solid transparent",
                      boxSizing: "border-box"
                    },
                    children: [tab === "extra-prices" ? "Extra prices" : "Equations", tab === "extra-prices" && /* @__PURE__ */ jsx("span", {
                      style: {
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "1px 6px",
                        borderRadius: 10,
                        background: isActive ? "#e8f0fe" : "#f3f4f6",
                        color: isActive ? "#005bd3" : "#6b7280"
                      },
                      children: pricing.extraPrices.length
                    })]
                  }, tab);
                })
              }), /* @__PURE__ */ jsxs("div", {
                style: {
                  position: "relative"
                },
                children: [/* @__PURE__ */ jsxs("button", {
                  onClick: handleAddButtonClick,
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 14px",
                    border: "1px solid #e5e7eb",
                    borderRadius: 6,
                    background: showAddForm ? "#f9fafb" : "#fff",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#374151"
                  },
                  children: ["+ ", activeTab === "extra-prices" ? "Add extra price" : "Add equation"]
                }), showAddForm && activeTab === "extra-prices" && /* @__PURE__ */ jsx(AddExtraPriceForm, {
                  questions: answerable,
                  currencySymbol,
                  onAdd: handleAddPrice,
                  onClose: () => setShowAddForm(false)
                })]
              })]
            }), activeTab === "extra-prices" && /* @__PURE__ */ jsxs(Fragment, {
              children: [/* @__PURE__ */ jsxs("div", {
                style: {
                  padding: "8px 16px",
                  borderBottom: "1px solid #e5e7eb",
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                },
                children: [/* @__PURE__ */ jsx(FilterChip, {
                  label: "Question",
                  options: questionOptions,
                  value: filterQuestion,
                  onChange: (v) => {
                    setFilterQuestion(v);
                    setFilterAnswer(null);
                  },
                  onClear: () => {
                    setFilterQuestion(null);
                    setFilterAnswer(null);
                  }
                }), /* @__PURE__ */ jsx(FilterChip, {
                  label: "Answer",
                  options: filterAnswerOptions,
                  value: filterAnswer,
                  onChange: setFilterAnswer,
                  onClear: () => setFilterAnswer(null),
                  disabled: !filterQuestion
                }), (filterQuestion || filterAnswer) && /* @__PURE__ */ jsx("button", {
                  onClick: () => {
                    setFilterQuestion(null);
                    setFilterAnswer(null);
                  },
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 8px",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    fontSize: 12,
                    color: "#6b7280",
                    marginLeft: "auto"
                  },
                  children: "× Clear filters"
                })]
              }), filteredPrices.length === 0 ? /* @__PURE__ */ jsxs("div", {
                style: {
                  padding: "40px 16px",
                  textAlign: "center",
                  color: "#9ca3af",
                  fontSize: 13
                },
                children: ["No extra prices found.", " ", /* @__PURE__ */ jsx("button", {
                  onClick: () => setShowAddForm(true),
                  style: {
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#005bd3",
                    fontSize: 13,
                    padding: 0
                  },
                  children: "Add one"
                })]
              }) : /* @__PURE__ */ jsxs(Fragment, {
                children: [/* @__PURE__ */ jsxs("div", {
                  style: {
                    padding: "8px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    borderBottom: "1px solid #f3f4f6",
                    background: "#fafafa"
                  },
                  children: [/* @__PURE__ */ jsx("input", {
                    type: "checkbox",
                    checked: isAllSelected,
                    onChange: toggleSelectAll,
                    style: {
                      width: 15,
                      height: 15,
                      cursor: "pointer",
                      accentColor: "#005bd3"
                    }
                  }), selectedIds.size > 0 ? /* @__PURE__ */ jsxs(Fragment, {
                    children: [/* @__PURE__ */ jsxs("span", {
                      style: {
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#374151"
                      },
                      children: [selectedIds.size, " selected"]
                    }), /* @__PURE__ */ jsxs("div", {
                      ref: bulkMenuRef,
                      style: {
                        position: "relative"
                      },
                      children: [/* @__PURE__ */ jsx("button", {
                        onClick: () => setShowBulkMenu((v) => !v),
                        style: {
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "4px 10px",
                          border: "1px solid #e5e7eb",
                          borderRadius: 6,
                          background: "#fff",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 500
                        },
                        children: "⋮ Bulk action"
                      }), showBulkMenu && /* @__PURE__ */ jsxs("div", {
                        style: {
                          position: "absolute",
                          top: "calc(100% + 2px)",
                          left: 0,
                          zIndex: 200,
                          background: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: 8,
                          boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
                          minWidth: 190,
                          overflow: "hidden"
                        },
                        children: [/* @__PURE__ */ jsx("button", {
                          onClick: () => {
                            setShowBulkMenu(false);
                            setShowBulkUpdate(true);
                          },
                          style: {
                            display: "block",
                            width: "100%",
                            padding: "10px 14px",
                            border: "none",
                            background: "none",
                            cursor: "pointer",
                            fontSize: 13,
                            textAlign: "left",
                            color: "#111827"
                          },
                          children: "Update extra prices"
                        }), /* @__PURE__ */ jsx("button", {
                          onClick: () => {
                            setShowBulkMenu(false);
                            setDeleteTargetIds(Array.from(selectedIds));
                          },
                          style: {
                            display: "block",
                            width: "100%",
                            padding: "10px 14px",
                            border: "none",
                            background: "none",
                            cursor: "pointer",
                            fontSize: 13,
                            textAlign: "left",
                            color: "#ef4444"
                          },
                          children: "Delete extra prices"
                        })]
                      })]
                    })]
                  }) : /* @__PURE__ */ jsx("span", {
                    style: {
                      fontSize: 12,
                      color: "#9ca3af"
                    },
                    children: "Select All"
                  })]
                }), filteredPrices.map((ep) => /* @__PURE__ */ jsxs("div", {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    padding: "10px 16px",
                    borderBottom: "1px solid #f3f4f6",
                    background: selectedIds.has(ep.id) ? "#fafbff" : "#fff"
                  },
                  children: [/* @__PURE__ */ jsx("input", {
                    type: "checkbox",
                    checked: selectedIds.has(ep.id),
                    onChange: () => toggleSelect(ep.id),
                    style: {
                      width: 15,
                      height: 15,
                      cursor: "pointer",
                      marginRight: 14,
                      flexShrink: 0,
                      accentColor: "#005bd3"
                    }
                  }), /* @__PURE__ */ jsx("span", {
                    style: {
                      flex: "0 0 160px",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#374151"
                    },
                    children: getQName(ep.questionId)
                  }), /* @__PURE__ */ jsx("span", {
                    style: {
                      flex: 1,
                      fontSize: 13,
                      color: "#374151",
                      minWidth: 0
                    },
                    children: getAName(ep.questionId, ep.answerId)
                  }), /* @__PURE__ */ jsxs("span", {
                    style: {
                      fontSize: 13,
                      color: "#374151",
                      marginRight: 14,
                      minWidth: 90,
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums"
                    },
                    children: [currencySymbol, "  ", ep.price]
                  }), /* @__PURE__ */ jsx("button", {
                    onClick: () => setDeleteTargetIds([ep.id]),
                    style: {
                      background: "none",
                      border: "1px solid transparent",
                      borderRadius: 4,
                      cursor: "pointer",
                      padding: "3px 5px",
                      color: "#9ca3af",
                      display: "flex",
                      alignItems: "center"
                    },
                    onMouseEnter: (e) => {
                      e.currentTarget.style.borderColor = "#fca5a5";
                      e.currentTarget.style.color = "#ef4444";
                    },
                    onMouseLeave: (e) => {
                      e.currentTarget.style.borderColor = "transparent";
                      e.currentTarget.style.color = "#9ca3af";
                    },
                    children: /* @__PURE__ */ jsxs("svg", {
                      width: "15",
                      height: "15",
                      fill: "none",
                      stroke: "currentColor",
                      strokeWidth: "2",
                      viewBox: "0 0 24 24",
                      children: [/* @__PURE__ */ jsx("polyline", {
                        points: "3 6 5 6 21 6"
                      }), /* @__PURE__ */ jsx("path", {
                        d: "M19 6l-1 14H6L5 6"
                      }), /* @__PURE__ */ jsx("path", {
                        d: "M10 11v6M14 11v6"
                      }), /* @__PURE__ */ jsx("path", {
                        d: "M9 6V4h6v2"
                      })]
                    })
                  })]
                }, ep.id))]
              })]
            }), activeTab === "equations" && /* @__PURE__ */ jsxs(Fragment, {
              children: [/* @__PURE__ */ jsxs("div", {
                style: {
                  padding: "8px 16px",
                  borderBottom: "1px solid #e5e7eb",
                  display: "flex",
                  gap: 8
                },
                children: [/* @__PURE__ */ jsx("button", {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 10px",
                    border: "1px solid #e5e7eb",
                    borderRadius: 16,
                    background: "#fff",
                    cursor: "pointer",
                    fontSize: 12,
                    color: "#374151"
                  },
                  children: "⊕ Question"
                }), /* @__PURE__ */ jsx("button", {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 10px",
                    border: "1px solid #e5e7eb",
                    borderRadius: 16,
                    background: "#fff",
                    cursor: "pointer",
                    fontSize: 12,
                    color: "#374151"
                  },
                  children: "⊕ Answer"
                })]
              }), pricing.equations.length === 0 ? /* @__PURE__ */ jsxs("div", {
                style: {
                  padding: "52px 16px",
                  textAlign: "center"
                },
                children: [/* @__PURE__ */ jsx("div", {
                  style: {
                    width: 52,
                    height: 52,
                    background: "#f3f4f6",
                    borderRadius: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 14px",
                    fontSize: 20,
                    fontStyle: "italic",
                    fontWeight: 700,
                    color: "#6b7280"
                  },
                  children: "f(x)"
                }), /* @__PURE__ */ jsx("div", {
                  style: {
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: 6
                  },
                  children: "No equation created"
                }), /* @__PURE__ */ jsx("div", {
                  style: {
                    fontSize: 13,
                    color: "#9ca3af",
                    maxWidth: 320,
                    margin: "0 auto",
                    lineHeight: 1.6
                  },
                  children: "Create your first equation to add extra price based on mathematical operations."
                })]
              }) : /* @__PURE__ */ jsx("div", {
                children: pricing.equations.map((eq) => {
                  const preview = eq.lines.map((l, i) => {
                    var _a;
                    const name = l.type === "number" ? String(l.numberValue ?? 0) : ((_a = answerable.find((q) => q.id === l.questionId)) == null ? void 0 : _a.name) ?? `Q${i + 1}`;
                    return i === 0 ? name : ` ${eq.operators[i - 1] ?? "+"} ${name}`;
                  }).join("");
                  return /* @__PURE__ */ jsxs("div", {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      padding: "12px 16px",
                      borderBottom: "1px solid #f3f4f6",
                      gap: 12
                    },
                    children: [/* @__PURE__ */ jsx("div", {
                      style: {
                        width: 32,
                        height: 32,
                        background: "#f3f4f6",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontStyle: "italic",
                        fontWeight: 700,
                        color: "#6b7280",
                        flexShrink: 0
                      },
                      children: "f(x)"
                    }), /* @__PURE__ */ jsxs("span", {
                      style: {
                        flex: 1,
                        fontSize: 13,
                        color: "#374151",
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      },
                      children: ["(", preview, ") = Extra price (", currencySymbol, ")"]
                    }), /* @__PURE__ */ jsx("button", {
                      onClick: () => {
                        setEditingEquation(eq);
                        setShowEquationModal(true);
                      },
                      style: {
                        padding: "4px 12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: 6,
                        background: "#fff",
                        cursor: "pointer",
                        fontSize: 12,
                        color: "#374151",
                        flexShrink: 0
                      },
                      children: "Edit"
                    }), /* @__PURE__ */ jsx("button", {
                      onClick: () => handleDeleteEquation(eq.id),
                      style: {
                        background: "none",
                        border: "1px solid transparent",
                        borderRadius: 4,
                        cursor: "pointer",
                        padding: "3px 5px",
                        color: "#9ca3af",
                        display: "flex",
                        alignItems: "center",
                        flexShrink: 0
                      },
                      onMouseEnter: (e) => {
                        e.currentTarget.style.borderColor = "#fca5a5";
                        e.currentTarget.style.color = "#ef4444";
                      },
                      onMouseLeave: (e) => {
                        e.currentTarget.style.borderColor = "transparent";
                        e.currentTarget.style.color = "#9ca3af";
                      },
                      children: /* @__PURE__ */ jsxs("svg", {
                        width: "15",
                        height: "15",
                        fill: "none",
                        stroke: "currentColor",
                        strokeWidth: "2",
                        viewBox: "0 0 24 24",
                        children: [/* @__PURE__ */ jsx("polyline", {
                          points: "3 6 5 6 21 6"
                        }), /* @__PURE__ */ jsx("path", {
                          d: "M19 6l-1 14H6L5 6"
                        }), /* @__PURE__ */ jsx("path", {
                          d: "M10 11v6M14 11v6"
                        }), /* @__PURE__ */ jsx("path", {
                          d: "M9 6V4h6v2"
                        })]
                      })
                    })]
                  }, eq.id);
                })
              })]
            })]
          })]
        }), /* @__PURE__ */ jsx("div", {
          style: {
            width: 248,
            flexShrink: 0
          },
          children: /* @__PURE__ */ jsxs("div", {
            style: {
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              padding: 16
            },
            children: [/* @__PURE__ */ jsx("div", {
              style: {
                fontSize: 14,
                fontWeight: 700,
                color: "#111827",
                marginBottom: 8
              },
              children: "Bulk pricing"
            }), /* @__PURE__ */ jsx("div", {
              style: {
                fontSize: 12,
                color: "#9ca3af",
                lineHeight: 1.7
              },
              children: "Set a different price based on the quantity your customers order. Requires a published bulk question to be available."
            })]
          })
        })]
      })]
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        borderTop: "1px solid #e5e7eb",
        background: "#fff",
        padding: "12px 24px",
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        flexShrink: 0
      },
      children: [/* @__PURE__ */ jsx("button", {
        onClick: handleDiscard,
        style: {
          padding: "8px 20px",
          border: "1px solid #e5e7eb",
          borderRadius: 6,
          background: "#fff",
          cursor: "pointer",
          fontSize: 14,
          color: "#374151"
        },
        children: "Discard"
      }), /* @__PURE__ */ jsx("button", {
        onClick: handleSave,
        style: {
          padding: "8px 20px",
          border: "none",
          borderRadius: 6,
          background: "#005bd3",
          color: "#fff",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 600
        },
        children: "Save"
      })]
    }), deleteTargetIds && /* @__PURE__ */ jsx(DeleteConfirmModal, {
      count: deleteTargetIds.length,
      onConfirm: handleDeleteConfirmed,
      onCancel: () => setDeleteTargetIds(null)
    }), showBulkUpdate && /* @__PURE__ */ jsx(BulkUpdateModal, {
      count: selectedIds.size,
      currencySymbol,
      onUpdate: handleBulkUpdate,
      onCancel: () => setShowBulkUpdate(false)
    }), showEquationModal && /* @__PURE__ */ jsx(CreateEquationModal, {
      questions: answerable,
      currencySymbol,
      onSave: handleSaveEquation,
      onCancel: () => {
        setShowEquationModal(false);
        setEditingEquation(null);
      },
      initial: editingEquation ?? void 0
    })]
  });
});
const route18 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$5,
  default: app_pricing_$productId,
  loader: loader$2
}, Symbol.toStringTag, { value: "Module" }));
function is403(e) {
  return (e == null ? void 0 : e.status) === 403;
}
async function action$4({
  request
}) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v;
  const url = new URL(request.url);
  const shopFromUrl = url.searchParams.get("shop") || "";
  let admin, session;
  try {
    ({
      admin,
      session
    } = await authenticate.admin(request));
  } catch (e) {
    if (e instanceof Response && (e.status === 301 || e.status === 302)) {
      return {
        error: "Session expired — please reload the page and try again."
      };
    }
    if (is403(e)) {
      if (shopFromUrl) {
        try {
          await prisma.session.deleteMany({
            where: {
              shop: shopFromUrl
            }
          });
        } catch (_) {
        }
      }
      return {
        error: "Permission error (auth) — please reload this page to refresh your Shopify authorization."
      };
    }
    throw e;
  }
  const formData = await request.formData();
  const title = (_a = formData.get("title")) == null ? void 0 : _a.trim();
  const price = ((_b = formData.get("price")) == null ? void 0 : _b.trim()) || "0.00";
  const description = ((_c = formData.get("description")) == null ? void 0 : _c.trim()) || "";
  const stock = parseInt(((_d = formData.get("stock")) == null ? void 0 : _d.trim()) || "0", 10);
  if (!title) return {
    error: "Product name is required."
  };
  try {
    const createResp = await admin.graphql(`mutation ProductCreate($input: ProductInput!) {
      productCreate(input: $input) {
        product {
          id title handle
          variants(first: 1) {
            edges { node { id inventoryItem { id } } }
          }
        }
        userErrors { field message }
      }
    }`, {
      variables: {
        input: {
          title,
          descriptionHtml: description,
          status: "DRAFT"
        }
      }
    });
    const createData = await createResp.json();
    const errs = ((_f = (_e = createData.data) == null ? void 0 : _e.productCreate) == null ? void 0 : _f.userErrors) ?? [];
    if (errs.length > 0) return {
      error: errs[0].message
    };
    const product = (_h = (_g = createData.data) == null ? void 0 : _g.productCreate) == null ? void 0 : _h.product;
    if (!product) return {
      error: "Failed to create product. Please try again."
    };
    const variantId = (_l = (_k = (_j = (_i = product.variants) == null ? void 0 : _i.edges) == null ? void 0 : _j[0]) == null ? void 0 : _k.node) == null ? void 0 : _l.id;
    const inventoryItemId = (_q = (_p = (_o = (_n = (_m = product.variants) == null ? void 0 : _m.edges) == null ? void 0 : _n[0]) == null ? void 0 : _o.node) == null ? void 0 : _p.inventoryItem) == null ? void 0 : _q.id;
    if (variantId && parseFloat(price) > 0) {
      await admin.graphql(`mutation VariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
          userErrors { field message }
        }
      }`, {
        variables: {
          productId: product.id,
          variants: [{
            id: variantId,
            price
          }]
        }
      });
    }
    if (inventoryItemId) {
      const locResp = await admin.graphql(`query { locations(first: 1) { edges { node { id } } } }`);
      const locData = await locResp.json();
      const locationGid = ((_v = (_u = (_t = (_s = (_r = locData.data) == null ? void 0 : _r.locations) == null ? void 0 : _s.edges) == null ? void 0 : _t[0]) == null ? void 0 : _u.node) == null ? void 0 : _v.id) ?? "";
      if (locationGid) {
        const numericItemId = inventoryItemId.replace("gid://shopify/InventoryItem/", "");
        const numericLocId = locationGid.replace("gid://shopify/Location/", "");
        const baseUrl = `https://${session.shop}/admin/api/2024-01`;
        const restHeaders = {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": session.accessToken
        };
        await fetch(`${baseUrl}/inventory_items/${numericItemId}.json`, {
          method: "PUT",
          headers: restHeaders,
          body: JSON.stringify({
            inventory_item: {
              id: parseInt(numericItemId, 10),
              tracked: true
            }
          })
        });
        if (stock > 0) {
          await fetch(`${baseUrl}/inventory_levels/set.json`, {
            method: "POST",
            headers: restHeaders,
            body: JSON.stringify({
              location_id: parseInt(numericLocId, 10),
              inventory_item_id: parseInt(numericItemId, 10),
              available: stock
            })
          });
        }
      }
    }
    return {
      success: true,
      redirectTo: `/app/configurator-setup/${encodeURIComponent(product.id)}`
    };
  } catch (e) {
    if (is403(e)) {
      try {
        await prisma.session.deleteMany({
          where: {
            shop: session.shop
          }
        });
      } catch (_) {
      }
      return {
        error: "Permission error — Shopify rejected the request (403). Please reload this page and try again to refresh your authorization."
      };
    }
    if (e instanceof Response) throw e;
    return {
      error: String((e == null ? void 0 : e.message) ?? "An unexpected error occurred. Please try again.")
    };
  }
}
const app_productPicker = UNSAFE_withComponentProps(function CreateProductPage() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const submit = useSubmit();
  const navigate = useNavigate();
  useEffect(() => {
    if (actionData == null ? void 0 : actionData.redirectTo) {
      navigate(actionData.redirectTo);
    }
  }, [actionData, navigate]);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("100");
  const [description, setDescription] = useState("");
  const [titleError, setTitleError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const saving = navigation.state !== "idle" || submitting;
  useEffect(() => {
    if (navigation.state === "idle") setSubmitting(false);
  }, [navigation.state]);
  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      setTitleError("Product name is required.");
      return;
    }
    setTitleError("");
    setSubmitting(true);
    const fd = new FormData();
    fd.set("title", title.trim());
    fd.set("price", price || "0.00");
    fd.set("stock", stock || "0");
    fd.set("description", description);
    let action2;
    try {
      const shopify2 = window.shopify;
      if (typeof (shopify2 == null ? void 0 : shopify2.idToken) === "function") {
        const idToken = await shopify2.idToken();
        const params = new URLSearchParams(window.location.search);
        const shop = params.get("shop");
        const host = params.get("host");
        if (idToken && shop && host) {
          action2 = `/app/product-picker?id_token=${encodeURIComponent(idToken)}&shop=${encodeURIComponent(shop)}&host=${encodeURIComponent(host)}&embedded=1`;
        }
      }
    } catch {
    }
    submit(fd, {
      method: "post",
      action: action2
    });
  }, [title, price, stock, description, submit]);
  return /* @__PURE__ */ jsx(Page, {
    title: "New Product",
    subtitle: "Create a product in your Shopify store to start building a configurator",
    backAction: {
      content: "Products",
      onAction: () => navigate("/app/products")
    },
    children: /* @__PURE__ */ jsxs(Layout, {
      children: [/* @__PURE__ */ jsx(Layout.Section, {
        children: /* @__PURE__ */ jsx(Card, {
          children: /* @__PURE__ */ jsxs(BlockStack, {
            gap: "500",
            children: [(actionData == null ? void 0 : actionData.error) && /* @__PURE__ */ jsx(Banner, {
              tone: "critical",
              title: "Could not create product",
              children: /* @__PURE__ */ jsx(Text$1, {
                as: "p",
                variant: "bodyMd",
                children: actionData.error
              })
            }), /* @__PURE__ */ jsx(Banner, {
              tone: "info",
              title: "Saved as Draft",
              children: /* @__PURE__ */ jsx(Text$1, {
                as: "p",
                variant: "bodySm",
                children: "This product won't appear in your store until you publish it from the Products page."
              })
            }), /* @__PURE__ */ jsxs(FormLayout, {
              children: [/* @__PURE__ */ jsx(TextField, {
                label: "Product Name",
                value: title,
                onChange: (v) => {
                  setTitle(v);
                  if (v.trim()) setTitleError("");
                },
                requiredIndicator: true,
                placeholder: "e.g. Custom Baseball Bat",
                autoComplete: "off",
                error: titleError
              }), /* @__PURE__ */ jsxs(FormLayout.Group, {
                children: [/* @__PURE__ */ jsx(TextField, {
                  label: "Price",
                  type: "number",
                  value: price,
                  onChange: setPrice,
                  prefix: "$",
                  placeholder: "0.00",
                  autoComplete: "off",
                  min: 0
                }), /* @__PURE__ */ jsx(TextField, {
                  label: "Starting Stock",
                  type: "number",
                  value: stock,
                  onChange: setStock,
                  suffix: "units",
                  placeholder: "100",
                  autoComplete: "off",
                  min: 0
                })]
              }), /* @__PURE__ */ jsx(TextField, {
                label: "Description",
                value: description,
                onChange: setDescription,
                multiline: 4,
                placeholder: "Describe this product to your customers...",
                autoComplete: "off",
                helpText: "Optional — can be updated anytime in Shopify Admin."
              })]
            }), /* @__PURE__ */ jsx(Box, {
              paddingBlockStart: "100",
              children: /* @__PURE__ */ jsx(Button, {
                variant: "primary",
                onClick: handleSubmit,
                loading: saving,
                size: "large",
                fullWidth: true,
                children: "Create & Open Builder"
              })
            })]
          })
        })
      }), /* @__PURE__ */ jsx(Layout.Section, {
        variant: "oneThird",
        children: /* @__PURE__ */ jsx(Card, {
          children: /* @__PURE__ */ jsxs(BlockStack, {
            gap: "400",
            children: [/* @__PURE__ */ jsx(Text$1, {
              variant: "headingMd",
              as: "h2",
              children: "How it works"
            }), /* @__PURE__ */ jsx(Divider, {}), /* @__PURE__ */ jsx(BlockStack, {
              gap: "400",
              children: HOW_IT_WORKS.map(({
                n,
                title: t,
                desc
              }) => /* @__PURE__ */ jsxs(InlineStack, {
                gap: "300",
                blockAlign: "start",
                wrap: false,
                children: [/* @__PURE__ */ jsx("div", {
                  style: {
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "#4f46e5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  },
                  children: /* @__PURE__ */ jsx(Text$1, {
                    variant: "bodySm",
                    fontWeight: "bold",
                    as: "span",
                    tone: "text-inverse",
                    children: n
                  })
                }), /* @__PURE__ */ jsxs(BlockStack, {
                  gap: "050",
                  children: [/* @__PURE__ */ jsx(Text$1, {
                    variant: "bodyMd",
                    fontWeight: "semibold",
                    as: "p",
                    children: t
                  }), /* @__PURE__ */ jsx(Text$1, {
                    variant: "bodySm",
                    tone: "subdued",
                    as: "p",
                    children: desc
                  })]
                })]
              }, n))
            })]
          })
        })
      })]
    })
  });
});
const HOW_IT_WORKS = [{
  n: "1",
  title: "Create the product",
  desc: "Fill in the name, price, and stock. The product is saved as Draft immediately."
}, {
  n: "2",
  title: "Build the configurator",
  desc: "Add layers, swatches, text fields, and logo upload options in the Builder."
}, {
  n: "3",
  title: "Preview & Publish",
  desc: "Test the configurator experience, then publish when it's ready for customers."
}];
const route19 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$4,
  default: app_productPicker
}, Symbol.toStringTag, { value: "Module" }));
async function action$3({
  request
}) {
  var _a;
  await authenticate.admin(request);
  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || file.size === 0) {
    return Response.json({
      error: "No file provided"
    }, {
      status: 400
    });
  }
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadsDir = join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, {
        recursive: true
      });
    }
    const ext = ((_a = file.name.split(".").pop()) == null ? void 0 : _a.toLowerCase()) || "png";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = join(uploadsDir, filename);
    writeFileSync(filePath, buffer);
    return Response.json({
      url: `/uploads/${filename}`
    });
  } catch (err) {
    return Response.json({
      error: err.message ?? "Upload failed"
    }, {
      status: 500
    });
  }
}
const route20 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$3
}, Symbol.toStringTag, { value: "Module" }));
const app_additional = UNSAFE_withComponentProps(function AdditionalPage() {
  return /* @__PURE__ */ jsxs("s-page", {
    heading: "Additional page",
    children: [/* @__PURE__ */ jsxs("s-section", {
      heading: "Multiple pages",
      children: [/* @__PURE__ */ jsxs("s-paragraph", {
        children: ["The app template comes with an additional page which demonstrates how to create multiple pages within app navigation using", " ", /* @__PURE__ */ jsx("s-link", {
          href: "https://shopify.dev/docs/apps/tools/app-bridge",
          target: "_blank",
          children: "App Bridge"
        }), "."]
      }), /* @__PURE__ */ jsxs("s-paragraph", {
        children: ["To create your own page and have it show up in the app navigation, add a page inside ", /* @__PURE__ */ jsx("code", {
          children: "app/routes"
        }), ", and a link to it in the", " ", /* @__PURE__ */ jsx("code", {
          children: "<ui-nav-menu>"
        }), " component found in", " ", /* @__PURE__ */ jsx("code", {
          children: "app/routes/app.jsx"
        }), "."]
      })]
    }), /* @__PURE__ */ jsx("s-section", {
      slot: "aside",
      heading: "Resources",
      children: /* @__PURE__ */ jsx("s-unordered-list", {
        children: /* @__PURE__ */ jsx("s-list-item", {
          children: /* @__PURE__ */ jsx("s-link", {
            href: "https://shopify.dev/docs/apps/design-guidelines/navigation#app-nav",
            target: "_blank",
            children: "App nav best practices"
          })
        })
      })
    })]
  });
});
const route21 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: app_additional
}, Symbol.toStringTag, { value: "Module" }));
async function action$2({
  request
}) {
  var _a;
  await authenticate.admin(request);
  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || file.size === 0) {
    return Response.json({
      error: "No file provided"
    }, {
      status: 400
    });
  }
  const ext = (_a = file.name.split(".").pop()) == null ? void 0 : _a.toLowerCase();
  if (ext !== "glb") {
    return Response.json({
      error: "Only .glb files are accepted"
    }, {
      status: 400
    });
  }
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadsDir = join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, {
      recursive: true
    });
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.glb`;
    writeFileSync(join(uploadsDir, filename), buffer);
    return Response.json({
      url: `/uploads/${filename}`
    });
  } catch (err) {
    return Response.json({
      error: err.message ?? "Upload failed"
    }, {
      status: 500
    });
  }
}
const route22 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$2
}, Symbol.toStringTag, { value: "Module" }));
async function loader$1({
  request
}) {
  const {
    admin
  } = await authenticate.admin(request);
  const configs = await prisma.productConfig.findMany({
    select: {
      productId: true,
      productName: true,
      layers: true,
      options: true,
      updatedAt: true
    }
  });
  if (configs.length === 0) return {
    products: []
  };
  const resp = await admin.graphql(`query GetNodes($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on Product {
          id title handle status tags
          featuredImage { url }
          priceRangeV2 { minVariantPrice { amount currencyCode } }
        }
      }
    }`, {
    variables: {
      ids: configs.map((c) => c.productId)
    }
  });
  const json = await resp.json();
  const nodeMap = new Map((json.data.nodes ?? []).filter(Boolean).map((n) => [n.id, n]));
  const products = configs.map((c) => ({
    ...c,
    shopify: nodeMap.get(c.productId)
  })).filter((c) => c.shopify);
  const untagged = products.filter((p) => !(p.shopify.tags ?? []).includes("configurator-enabled"));
  if (untagged.length > 0) {
    await Promise.all(untagged.map((p) => admin.graphql(`mutation AddTag($id: ID!, $tags: [String!]!) {
            tagsAdd(id: $id, tags: $tags) {
              node { id }
              userErrors { field message }
            }
          }`, {
      variables: {
        id: p.productId,
        tags: ["configurator-enabled"]
      }
    })));
  }
  return {
    products
  };
}
async function action$1({
  request
}) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
  const {
    admin,
    session
  } = await authenticate.admin(request);
  const formData = await request.formData();
  const productId = formData.get("productId");
  const intent = formData.get("intent") || "publish";
  if (intent === "bulkDelete") {
    const ids = formData.get("productIds").split(",").filter(Boolean);
    await Promise.all(ids.map((id) => Promise.all([prisma.productConfig.deleteMany({
      where: {
        productId: id
      }
    }), admin.graphql(`mutation DeleteProduct($id: ID!) {
              productDelete(input: { id: $id }) {
                deletedProductId
                userErrors { field message }
              }
            }`, {
      variables: {
        id
      }
    })])));
    return {
      success: true,
      deleted: true
    };
  }
  if (intent === "delete") {
    await Promise.all([prisma.productConfig.deleteMany({
      where: {
        productId
      }
    }), admin.graphql(`mutation DeleteProduct($id: ID!) {
          productDelete(input: { id: $id }) {
            deletedProductId
            userErrors { field message }
          }
        }`, {
      variables: {
        id: productId
      }
    })]);
    return {
      success: true,
      deleted: true
    };
  }
  if (intent === "duplicate") {
    const src = await prisma.productConfig.findUnique({
      where: {
        productId
      }
    });
    if (!src) return {
      error: "Config not found"
    };
    const copyResp = await admin.graphql(`mutation ProductDuplicate($productId: ID!, $newTitle: String!) {
        productDuplicate(productId: $productId, newTitle: $newTitle) {
          newProduct { id title }
          userErrors { field message }
        }
      }`, {
      variables: {
        productId,
        newTitle: `${src.productName} (copy)`
      }
    });
    const copyData = await copyResp.json();
    const newProduct = (_b = (_a = copyData.data) == null ? void 0 : _a.productDuplicate) == null ? void 0 : _b.newProduct;
    if (!newProduct) return {
      error: ((_f = (_e = (_d = (_c = copyData.data) == null ? void 0 : _c.productDuplicate) == null ? void 0 : _d.userErrors) == null ? void 0 : _e[0]) == null ? void 0 : _f.message) ?? "Duplicate failed"
    };
    await prisma.productConfig.create({
      data: {
        productId: newProduct.id,
        productName: newProduct.title,
        shop: src.shop,
        layers: src.layers,
        options: src.options
      }
    });
    return {
      success: true,
      duplicated: true
    };
  }
  const newStatus = formData.get("status");
  const statusResp = await admin.graphql(`mutation UpdateProductStatus($id: ID!, $status: ProductStatus!) {
      productUpdate(input: { id: $id, status: $status }) {
        product {
          id status
          variants(first: 100) { edges { node { id } } }
        }
        userErrors { field message }
      }
    }`, {
    variables: {
      id: productId,
      status: newStatus
    }
  });
  const statusData = await statusResp.json();
  const errs = ((_h = (_g = statusData.data) == null ? void 0 : _g.productUpdate) == null ? void 0 : _h.userErrors) ?? [];
  if (errs.length > 0) return {
    error: errs[0].message
  };
  if (newStatus === "ACTIVE") {
    const variantIds = (((_l = (_k = (_j = (_i = statusData.data) == null ? void 0 : _i.productUpdate) == null ? void 0 : _j.product) == null ? void 0 : _k.variants) == null ? void 0 : _l.edges) ?? []).map((e) => e.node.id);
    if (variantIds.length > 0) {
      await admin.graphql(`mutation SetInventoryPolicy($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
          productVariantsBulkUpdate(productId: $productId, variants: $variants) {
            userErrors { field message }
          }
        }`, {
        variables: {
          productId,
          variants: variantIds.map((id) => ({
            id,
            inventoryPolicy: "CONTINUE"
          }))
        }
      });
    }
  }
  const numericProductId = productId.replace("gid://shopify/Product/", "");
  const restResp = await fetch(`https://${session.shop}/admin/api/${apiVersion}/products/${numericProductId}.json`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": session.accessToken
    },
    body: JSON.stringify({
      product: {
        id: parseInt(numericProductId, 10),
        published: newStatus === "ACTIVE"
      }
    })
  });
  if (!restResp.ok) {
    const errBody = await restResp.json().catch(() => ({}));
    return {
      error: String(errBody.errors ?? "Failed to update Online Store visibility")
    };
  }
  return {
    success: true,
    productId,
    status: newStatus
  };
}
const app_products = UNSAFE_withComponentProps(function ProductsPage() {
  const {
    products
  } = useLoaderData();
  const bulkFetcher = useFetcher();
  const navigate = useNavigate();
  const resourceItems = products.map((p) => ({
    ...p,
    id: p.productId
  }));
  const {
    selectedResources,
    allResourcesSelected,
    handleSelectionChange
  } = useIndexResourceState(resourceItems);
  const handleBulkDelete = useCallback(() => {
    if (selectedResources.length === 0) return;
    const names = products.filter((p) => selectedResources.includes(p.productId)).map((p) => {
      var _a;
      return ((_a = p.shopify) == null ? void 0 : _a.title) ?? p.productName;
    }).join(", ");
    if (confirm(`Delete ${selectedResources.length} product${selectedResources.length !== 1 ? "s" : ""}?

${names}

This cannot be undone.`)) {
      const form2 = new FormData();
      form2.set("intent", "bulkDelete");
      form2.set("productIds", selectedResources.join(","));
      bulkFetcher.submit(form2, {
        method: "post"
      });
    }
  }, [selectedResources, products, bulkFetcher]);
  const resourceName = {
    singular: "product",
    plural: "products"
  };
  const rowMarkup = products.map((item, index2) => /* @__PURE__ */ jsx(ProductRow, {
    item,
    index: index2,
    selected: selectedResources.includes(item.productId)
  }, item.productId));
  return /* @__PURE__ */ jsx(Page, {
    title: "Products",
    subtitle: `${products.length} product${products.length !== 1 ? "s" : ""} configured`,
    primaryAction: /* @__PURE__ */ jsx(Link, {
      to: "/app/product-picker",
      style: {
        textDecoration: "none"
      },
      children: /* @__PURE__ */ jsx(Button, {
        variant: "primary",
        children: "Add Product"
      })
    }),
    children: /* @__PURE__ */ jsx(Layout, {
      children: /* @__PURE__ */ jsx(Layout.Section, {
        children: products.length === 0 ? /* @__PURE__ */ jsx(Card, {
          children: /* @__PURE__ */ jsx(EmptyState, {
            heading: "No products configured yet",
            action: {
              content: "Add your first product",
              onAction: () => navigate("/app/product-picker")
            },
            secondaryAction: {
              content: "Learn more",
              onAction: () => navigate("/app")
            },
            image: "https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png",
            children: /* @__PURE__ */ jsx("p", {
              children: "Add a product to start building your customisation configurator."
            })
          })
        }) : /* @__PURE__ */ jsx(Card, {
          padding: "0",
          children: /* @__PURE__ */ jsx(IndexTable, {
            resourceName,
            itemCount: products.length,
            selectedItemsCount: allResourcesSelected ? "All" : selectedResources.length,
            onSelectionChange: handleSelectionChange,
            promotedBulkActions: [{
              content: `Delete ${selectedResources.length} selected`,
              onAction: handleBulkDelete
            }],
            headings: [{
              title: "Product"
            }, {
              title: "Status"
            }, {
              title: "Actions",
              alignment: "end"
            }],
            children: rowMarkup
          })
        })
      })
    })
  });
});
function ProductRow({
  item,
  index: index2,
  selected
}) {
  var _a, _b, _c, _d;
  const {
    shopify: shopify2,
    layers,
    options
  } = item;
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = useCallback(() => setMenuOpen((v) => !v), []);
  const price = (_a = shopify2 == null ? void 0 : shopify2.priceRangeV2) == null ? void 0 : _a.minVariantPrice;
  const viewNames = (options == null ? void 0 : options.viewNames) ?? [];
  const viewCount = viewNames.length || 1;
  const isActive = (shopify2 == null ? void 0 : shopify2.status) === "ACTIVE";
  const firstLayerSrc = Array.isArray(layers) && layers.length > 0 ? (_b = layers[0]) == null ? void 0 : _b.src : null;
  const thumbSrc = ((_c = shopify2 == null ? void 0 : shopify2.featuredImage) == null ? void 0 : _c.url) || firstLayerSrc;
  const saving = fetcher.state !== "idle";
  const rowError = (_d = fetcher.data) == null ? void 0 : _d.error;
  const menuActivator = /* @__PURE__ */ jsx(Button, {
    variant: "plain",
    icon: MenuHorizontalIcon,
    onClick: (e) => {
      e.stopPropagation();
      toggleMenu();
    },
    accessibilityLabel: "More actions"
  });
  return /* @__PURE__ */ jsxs(IndexTable.Row, {
    id: item.productId,
    position: index2,
    selected,
    children: [/* @__PURE__ */ jsx(IndexTable.Cell, {
      children: /* @__PURE__ */ jsxs(InlineStack, {
        gap: "300",
        blockAlign: "center",
        wrap: false,
        children: [/* @__PURE__ */ jsx(Thumbnail, {
          source: thumbSrc || ProductIcon,
          alt: (shopify2 == null ? void 0 : shopify2.title) ?? item.productName,
          size: "small"
        }), /* @__PURE__ */ jsxs(BlockStack, {
          gap: "050",
          children: [/* @__PURE__ */ jsx(Text$1, {
            variant: "bodyMd",
            fontWeight: "semibold",
            as: "span",
            children: (shopify2 == null ? void 0 : shopify2.title) ?? item.productName
          }), /* @__PURE__ */ jsxs(Text$1, {
            variant: "bodySm",
            tone: "subdued",
            as: "span",
            children: [shopify2 == null ? void 0 : shopify2.handle, price ? ` · ${price.currencyCode} ${Number(price.amount).toFixed(2)}` : "", ` · ${viewCount} view${viewCount !== 1 ? "s" : ""}`]
          })]
        })]
      })
    }), /* @__PURE__ */ jsx(IndexTable.Cell, {
      children: /* @__PURE__ */ jsx("div", {
        onClick: (e) => e.stopPropagation(),
        children: /* @__PURE__ */ jsxs(fetcher.Form, {
          method: "post",
          style: {
            display: "inline"
          },
          children: [/* @__PURE__ */ jsx("input", {
            type: "hidden",
            name: "productId",
            value: item.productId
          }), /* @__PURE__ */ jsx("input", {
            type: "hidden",
            name: "status",
            value: isActive ? "DRAFT" : "ACTIVE"
          }), /* @__PURE__ */ jsxs(InlineStack, {
            gap: "200",
            blockAlign: "center",
            children: [/* @__PURE__ */ jsx(Badge, {
              tone: isActive ? "success" : "attention",
              children: isActive ? "Active" : "Draft"
            }), saving ? /* @__PURE__ */ jsx(Spinner, {
              size: "small"
            }) : /* @__PURE__ */ jsx(Button, {
              variant: "plain",
              submit: true,
              size: "slim",
              tone: isActive ? "critical" : void 0,
              children: isActive ? "Unpublish" : "Publish"
            })]
          }), rowError && /* @__PURE__ */ jsx(Text$1, {
            variant: "bodySm",
            tone: "critical",
            as: "p",
            children: rowError
          })]
        })
      })
    }), /* @__PURE__ */ jsx(IndexTable.Cell, {
      children: /* @__PURE__ */ jsx("div", {
        onClick: (e) => e.stopPropagation(),
        children: /* @__PURE__ */ jsxs(InlineStack, {
          gap: "200",
          align: "end",
          blockAlign: "center",
          wrap: false,
          children: [/* @__PURE__ */ jsx(Link, {
            to: `/app/configurator-setup/${encodeURIComponent(item.productId)}`,
            style: {
              textDecoration: "none"
            },
            children: /* @__PURE__ */ jsx(Button, {
              size: "slim",
              variant: "secondary",
              children: "Builder"
            })
          }), /* @__PURE__ */ jsx(Link, {
            to: `/app/configurator/${encodeURIComponent(item.productId)}`,
            style: {
              textDecoration: "none"
            },
            children: /* @__PURE__ */ jsx(Button, {
              size: "slim",
              variant: "primary",
              children: "Preview"
            })
          }), /* @__PURE__ */ jsx(Popover, {
            active: menuOpen,
            activator: menuActivator,
            autofocusTarget: "first-node",
            onClose: toggleMenu,
            children: /* @__PURE__ */ jsx(ActionList, {
              actionRole: "menuitem",
              items: [{
                content: "Pricing",
                onAction: () => {
                  setMenuOpen(false);
                  navigate(`/app/pricing/${encodeURIComponent(item.productId)}`);
                }
              }, {
                content: "Style",
                onAction: () => {
                  setMenuOpen(false);
                  navigate(`/app/configurator-style/${encodeURIComponent(item.productId)}`);
                }
              }, {
                content: "Inventory",
                onAction: () => {
                  setMenuOpen(false);
                  navigate(`/app/inventory/${encodeURIComponent(item.productId)}`);
                }
              }, {
                content: "Duplicate",
                onAction: () => {
                  setMenuOpen(false);
                  const form2 = new FormData();
                  form2.set("productId", item.productId);
                  form2.set("intent", "duplicate");
                  fetcher.submit(form2, {
                    method: "post"
                  });
                }
              }, {
                content: "Delete",
                destructive: true,
                onAction: () => {
                  setMenuOpen(false);
                  if (confirm(`Delete "${shopify2 == null ? void 0 : shopify2.title}"? This cannot be undone.`)) {
                    const form2 = new FormData();
                    form2.set("productId", item.productId);
                    form2.set("intent", "delete");
                    fetcher.submit(form2, {
                      method: "post"
                    });
                  }
                }
              }]
            })
          })]
        })
      })
    })]
  }, item.productId);
}
const route23 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$1,
  default: app_products,
  loader: loader$1
}, Symbol.toStringTag, { value: "Module" }));
async function loader({
  request
}) {
  try {
    const {
      session
    } = await authenticate.admin(request);
    const shop = session.shop;
    const record = await prisma.appSettings.findUnique({
      where: {
        shop
      }
    });
    const settings = {
      ...DEFAULT_APP_SETTINGS,
      ...(record == null ? void 0 : record.settings) ?? {}
    };
    return {
      shop,
      settings
    };
  } catch (error) {
    console.error("[Settings 403 Debug] status:", error == null ? void 0 : error.status, "message:", error == null ? void 0 : error.message, "stack:", error == null ? void 0 : error.stack);
    throw error;
  }
}
async function action({
  request
}) {
  const {
    session
  } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const settings = JSON.parse(formData.get("settings"));
  await prisma.appSettings.upsert({
    where: {
      shop
    },
    create: {
      shop,
      settings
    },
    update: {
      settings
    }
  });
  return {
    success: true
  };
}
const app_settings = UNSAFE_withComponentProps(function AppSettingsPage() {
  const {
    settings: initSettings
  } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const [s, setS] = useState(initSettings);
  const set = useCallback((patch) => setS((prev) => ({
    ...prev,
    ...patch
  })), []);
  const handleSave = () => {
    const fd = new FormData();
    fd.append("settings", JSON.stringify(s));
    submit(fd, {
      method: "post"
    });
  };
  return /* @__PURE__ */ jsx(Page, {
    title: "App Settings",
    subtitle: "Global defaults for all configurators",
    primaryAction: /* @__PURE__ */ jsx(Button, {
      variant: "primary",
      onClick: handleSave,
      children: "Save Settings"
    }),
    children: /* @__PURE__ */ jsxs(BlockStack, {
      gap: "500",
      children: [actionData && "success" in actionData && /* @__PURE__ */ jsx(Banner, {
        tone: "success",
        title: "Settings saved successfully!"
      }), /* @__PURE__ */ jsxs(Layout, {
        children: [/* @__PURE__ */ jsx(Layout.Section, {
          children: /* @__PURE__ */ jsxs(BlockStack, {
            gap: "500",
            children: [/* @__PURE__ */ jsx(Card, {
              children: /* @__PURE__ */ jsxs(BlockStack, {
                gap: "400",
                children: [/* @__PURE__ */ jsxs(InlineStack, {
                  gap: "200",
                  blockAlign: "center",
                  children: [/* @__PURE__ */ jsx("div", {
                    style: {
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "#fef3c7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16
                    },
                    children: "🎨"
                  }), /* @__PURE__ */ jsx(Text$1, {
                    variant: "headingMd",
                    as: "h2",
                    children: "Styling"
                  })]
                }), /* @__PURE__ */ jsx(Divider, {}), /* @__PURE__ */ jsxs(InlineStack, {
                  gap: "400",
                  blockAlign: "center",
                  children: [/* @__PURE__ */ jsx(Text$1, {
                    variant: "bodyMd",
                    as: "p",
                    fontWeight: "semibold",
                    children: "Global text color"
                  }), /* @__PURE__ */ jsxs("div", {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: 10
                    },
                    children: [/* @__PURE__ */ jsx("input", {
                      type: "color",
                      value: s.globalTextColor,
                      onChange: (e) => set({
                        globalTextColor: e.target.value
                      }),
                      style: {
                        width: 40,
                        height: 40,
                        border: "1.5px solid #e5e7eb",
                        borderRadius: 8,
                        cursor: "pointer",
                        padding: 2
                      }
                    }), /* @__PURE__ */ jsx("span", {
                      style: {
                        fontSize: 13,
                        color: "#6b7280",
                        fontFamily: "monospace"
                      },
                      children: s.globalTextColor
                    })]
                  })]
                }), /* @__PURE__ */ jsx(Divider, {}), /* @__PURE__ */ jsxs(BlockStack, {
                  gap: "300",
                  children: [/* @__PURE__ */ jsx(Text$1, {
                    variant: "bodyMd",
                    as: "p",
                    fontWeight: "semibold",
                    children: "Swatches styling"
                  }), /* @__PURE__ */ jsx(Text$1, {
                    variant: "bodySm",
                    tone: "subdued",
                    as: "p",
                    children: "Choose the shape displayed to customers for color swatches"
                  }), /* @__PURE__ */ jsx("div", {
                    style: {
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: 10
                    },
                    children: SWATCH_STYLE_OPTIONS.map((opt) => /* @__PURE__ */ jsx(SwatchStyleCard, {
                      ...opt,
                      active: s.swatchShape === opt.shape && s.swatchSize === opt.size,
                      onClick: () => set({
                        swatchShape: opt.shape,
                        swatchSize: opt.size
                      })
                    }, opt.shape + opt.size))
                  })]
                })]
              })
            }), /* @__PURE__ */ jsx(Card, {
              children: /* @__PURE__ */ jsxs(BlockStack, {
                gap: "400",
                children: [/* @__PURE__ */ jsxs(InlineStack, {
                  gap: "200",
                  blockAlign: "center",
                  children: [/* @__PURE__ */ jsx("div", {
                    style: {
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "#fce7f3",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16
                    },
                    children: "📐"
                  }), /* @__PURE__ */ jsx(Text$1, {
                    variant: "headingMd",
                    as: "h2",
                    children: "Spacing"
                  })]
                }), /* @__PURE__ */ jsx(Divider, {}), /* @__PURE__ */ jsx(SpinnerField, {
                  label: "Space between options",
                  value: s.spaceBetweenOptions,
                  onChange: (v) => set({
                    spaceBetweenOptions: v
                  })
                }), /* @__PURE__ */ jsxs(BlockStack, {
                  gap: "200",
                  children: [/* @__PURE__ */ jsx(Text$1, {
                    variant: "bodyMd",
                    as: "p",
                    fontWeight: "semibold",
                    children: "Global Margins"
                  }), /* @__PURE__ */ jsxs("div", {
                    style: {
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12
                    },
                    children: [/* @__PURE__ */ jsx(SpinnerField, {
                      label: "Top",
                      value: s.marginTop,
                      onChange: (v) => set({
                        marginTop: v
                      })
                    }), /* @__PURE__ */ jsx(SpinnerField, {
                      label: "Bottom",
                      value: s.marginBottom,
                      onChange: (v) => set({
                        marginBottom: v
                      })
                    }), /* @__PURE__ */ jsx(SpinnerField, {
                      label: "Left",
                      value: s.marginLeft,
                      onChange: (v) => set({
                        marginLeft: v
                      })
                    }), /* @__PURE__ */ jsx(SpinnerField, {
                      label: "Right",
                      value: s.marginRight,
                      onChange: (v) => set({
                        marginRight: v
                      })
                    })]
                  })]
                }), /* @__PURE__ */ jsx(SpinnerField, {
                  label: "Option Fields Left Margin",
                  value: s.optionFieldLeftMargin,
                  onChange: (v) => set({
                    optionFieldLeftMargin: v
                  })
                }), /* @__PURE__ */ jsx(SpinnerField, {
                  label: "Left Margin for Sub-Options",
                  value: s.subOptionLeftMargin,
                  onChange: (v) => set({
                    subOptionLeftMargin: v
                  })
                })]
              })
            }), /* @__PURE__ */ jsx(Card, {
              children: /* @__PURE__ */ jsxs(BlockStack, {
                gap: "400",
                children: [/* @__PURE__ */ jsxs(InlineStack, {
                  gap: "200",
                  blockAlign: "center",
                  children: [/* @__PURE__ */ jsx("div", {
                    style: {
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "#dcfce7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16
                    },
                    children: "✨"
                  }), /* @__PURE__ */ jsx(Text$1, {
                    variant: "headingMd",
                    as: "h2",
                    children: "Display Effects"
                  })]
                }), /* @__PURE__ */ jsx(Divider, {}), /* @__PURE__ */ jsx(CheckboxRow, {
                  label: "Disable Zoom effect (when product image is hovered)",
                  checked: s.disableZoom,
                  onChange: (v) => set({
                    disableZoom: v
                  })
                }), /* @__PURE__ */ jsx(CheckboxRow, {
                  label: "Disable Shadow effect from preview image",
                  checked: s.disableShadow,
                  onChange: (v) => set({
                    disableShadow: v
                  })
                })]
              })
            }), /* @__PURE__ */ jsx(Card, {
              children: /* @__PURE__ */ jsxs(BlockStack, {
                gap: "400",
                children: [/* @__PURE__ */ jsxs(InlineStack, {
                  gap: "200",
                  blockAlign: "center",
                  children: [/* @__PURE__ */ jsx("div", {
                    style: {
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "#e0f2fe",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16
                    },
                    children: "⚙️"
                  }), /* @__PURE__ */ jsx(Text$1, {
                    variant: "headingMd",
                    as: "h2",
                    children: "Advanced Settings"
                  })]
                }), /* @__PURE__ */ jsx(Divider, {}), /* @__PURE__ */ jsx(Select, {
                  label: "Action after a product is added to the cart",
                  options: [{
                    label: "Redirect to the cart page",
                    value: "redirect_cart"
                  }, {
                    label: "Open cart drawer",
                    value: "open_cart"
                  }, {
                    label: "Do nothing",
                    value: "nothing"
                  }],
                  value: s.cartAction,
                  onChange: (v) => set({
                    cartAction: v
                  })
                }), /* @__PURE__ */ jsx(Banner, {
                  tone: "info",
                  children: /* @__PURE__ */ jsx(Text$1, {
                    as: "p",
                    variant: "bodySm",
                    children: "When a product requires custom pricing and is added to the cart, the app creates a temporary copy of that product. It will be automatically deleted after the specified time."
                  })
                }), /* @__PURE__ */ jsx(Select, {
                  label: "Temporary products lifetime",
                  options: [{
                    label: "15 minutes",
                    value: "15min"
                  }, {
                    label: "30 minutes",
                    value: "30min"
                  }, {
                    label: "1 hour",
                    value: "1h"
                  }, {
                    label: "2 hours",
                    value: "2h"
                  }, {
                    label: "4 hours",
                    value: "4h"
                  }, {
                    label: "Never delete",
                    value: "never"
                  }],
                  value: s.tempProductLifetime,
                  onChange: (v) => set({
                    tempProductLifetime: v
                  })
                }), /* @__PURE__ */ jsx(TextField, {
                  label: "Temporary products prefix",
                  value: s.tempProductPrefix,
                  onChange: (v) => set({
                    tempProductPrefix: v
                  }),
                  autoComplete: "off",
                  helpText: "This prefix is prepended to temporary product names so you can identify them."
                })]
              })
            })]
          })
        }), /* @__PURE__ */ jsx(Layout.Section, {
          variant: "oneThird",
          children: /* @__PURE__ */ jsx(Card, {
            children: /* @__PURE__ */ jsxs(BlockStack, {
              gap: "400",
              children: [/* @__PURE__ */ jsx(Text$1, {
                variant: "headingMd",
                as: "h2",
                children: "Preview"
              }), /* @__PURE__ */ jsx(Divider, {}), /* @__PURE__ */ jsx(SwatchPreviewPanel, {
                settings: s
              })]
            })
          })
        })]
      }), /* @__PURE__ */ jsx(Box, {
        paddingBlockEnd: "800"
      })]
    })
  });
});
const SWATCH_STYLE_OPTIONS = [{
  shape: "circle",
  size: "sm",
  label: "Small circles"
}, {
  shape: "circle",
  size: "lg",
  label: "Large circles"
}, {
  shape: "square",
  size: "sm",
  label: "Small squares"
}, {
  shape: "square",
  size: "lg",
  label: "Large squares"
}, {
  shape: "rounded",
  size: "sm",
  label: "Small rounded"
}, {
  shape: "rounded",
  size: "lg",
  label: "Large rounded"
}];
const DEMO_COLORS = ["#e53e3e", "#38a169", "#3182ce", "#d69e2e"];
function SwatchStyleCard({
  shape,
  size,
  label: label2,
  active,
  onClick
}) {
  const radius = shape === "circle" ? "50%" : shape === "square" ? "3px" : "8px";
  const px = size === "sm" ? 22 : size === "md" ? 32 : 42;
  return /* @__PURE__ */ jsxs("button", {
    onClick,
    style: {
      padding: "12px 8px",
      border: active ? "2px solid #5c6ac4" : "1.5px solid #e5e7eb",
      borderRadius: 10,
      background: active ? "#f0f0ff" : "#fff",
      cursor: "pointer",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 8,
      transition: "all 0.15s"
    },
    children: [/* @__PURE__ */ jsx("div", {
      style: {
        display: "flex",
        gap: 5
      },
      children: DEMO_COLORS.map((c, i) => /* @__PURE__ */ jsx("div", {
        style: {
          width: px,
          height: px,
          borderRadius: radius,
          background: c,
          border: i === 0 ? "2px solid #5c6ac4" : "1.5px solid rgba(0,0,0,0.1)"
        }
      }, c))
    }), /* @__PURE__ */ jsx("span", {
      style: {
        fontSize: 11,
        fontWeight: active ? 700 : 500,
        color: active ? "#5c6ac4" : "#6b7280"
      },
      children: label2
    })]
  });
}
function SpinnerField({
  label: label2,
  value,
  onChange
}) {
  return /* @__PURE__ */ jsxs(InlineStack, {
    gap: "300",
    blockAlign: "center",
    wrap: false,
    children: [/* @__PURE__ */ jsx(Box, {
      minWidth: "220px",
      children: /* @__PURE__ */ jsx(Text$1, {
        variant: "bodyMd",
        as: "p",
        children: label2
      })
    }), /* @__PURE__ */ jsxs("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6
      },
      children: [/* @__PURE__ */ jsx("button", {
        onClick: () => onChange(Math.max(0, value - 1)),
        style: {
          width: 28,
          height: 28,
          border: "1px solid #e5e7eb",
          borderRadius: 4,
          background: "#f9fafb",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 700,
          color: "#374151",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        },
        children: "−"
      }), /* @__PURE__ */ jsx("input", {
        type: "number",
        value,
        min: 0,
        onChange: (e) => onChange(Math.max(0, Number(e.target.value))),
        style: {
          width: 56,
          padding: "4px 8px",
          border: "1px solid #e5e7eb",
          borderRadius: 6,
          fontSize: 13,
          textAlign: "center",
          outline: "none"
        }
      }), /* @__PURE__ */ jsx("button", {
        onClick: () => onChange(value + 1),
        style: {
          width: 28,
          height: 28,
          border: "1px solid #e5e7eb",
          borderRadius: 4,
          background: "#f9fafb",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 700,
          color: "#374151",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        },
        children: "+"
      }), /* @__PURE__ */ jsx("span", {
        style: {
          fontSize: 12,
          color: "#9ca3af"
        },
        children: "px"
      })]
    })]
  });
}
function CheckboxRow({
  label: label2,
  checked,
  onChange
}) {
  return /* @__PURE__ */ jsxs(InlineStack, {
    gap: "300",
    blockAlign: "center",
    children: [/* @__PURE__ */ jsx("input", {
      type: "checkbox",
      checked,
      onChange: (e) => onChange(e.target.checked),
      style: {
        width: 16,
        height: 16,
        cursor: "pointer",
        accentColor: "#5c6ac4",
        flexShrink: 0
      }
    }), /* @__PURE__ */ jsx(Text$1, {
      variant: "bodyMd",
      as: "p",
      children: label2
    })]
  });
}
function SwatchPreviewPanel({
  settings: s
}) {
  const radius = s.swatchShape === "circle" ? "50%" : s.swatchShape === "square" ? "4px" : "8px";
  const px = s.swatchSize === "sm" ? 26 : s.swatchSize === "md" ? 36 : 46;
  const colors = ["#e53e3e", "#38a169", "#3182ce", "#d69e2e", "#805ad5", "#dd6b20"];
  return /* @__PURE__ */ jsxs(BlockStack, {
    gap: "400",
    children: [/* @__PURE__ */ jsxs(BlockStack, {
      gap: "200",
      children: [/* @__PURE__ */ jsx(Text$1, {
        variant: "bodySm",
        tone: "subdued",
        as: "p",
        children: "COLOR SWATCHES"
      }), /* @__PURE__ */ jsx("div", {
        style: {
          display: "flex",
          gap: s.spaceBetweenOptions,
          flexWrap: "wrap"
        },
        children: colors.map((c, i) => /* @__PURE__ */ jsx("div", {
          style: {
            width: px,
            height: px,
            borderRadius: radius,
            background: c,
            border: i === 0 ? "2.5px solid #5c6ac4" : "1.5px solid rgba(0,0,0,0.12)"
          }
        }, c))
      })]
    }), /* @__PURE__ */ jsx(Divider, {}), /* @__PURE__ */ jsxs(BlockStack, {
      gap: "200",
      children: [/* @__PURE__ */ jsx(Text$1, {
        variant: "bodySm",
        tone: "subdued",
        as: "p",
        children: "SAMPLE OPTION"
      }), /* @__PURE__ */ jsxs("div", {
        style: {
          padding: `${s.marginTop}px ${s.marginRight}px ${s.marginBottom}px ${s.marginLeft}px`,
          border: "1px dashed #e5e7eb",
          borderRadius: 6
        },
        children: [/* @__PURE__ */ jsx("p", {
          style: {
            margin: 0,
            fontSize: 13,
            color: s.globalTextColor,
            fontWeight: 500
          },
          children: "Select a Color"
        }), /* @__PURE__ */ jsx("div", {
          style: {
            display: "flex",
            gap: s.spaceBetweenOptions,
            marginTop: 8,
            flexWrap: "wrap"
          },
          children: colors.slice(0, 4).map((c, i) => /* @__PURE__ */ jsx("div", {
            style: {
              width: px,
              height: px,
              borderRadius: radius,
              background: c,
              border: i === 0 ? "2.5px solid #5c6ac4" : "1.5px solid rgba(0,0,0,0.12)",
              boxShadow: s.disableShadow ? "none" : "0 1px 4px rgba(0,0,0,0.1)"
            }
          }, c))
        })]
      })]
    })]
  });
}
const route24 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action,
  default: app_settings,
  loader
}, Symbol.toStringTag, { value: "Module" }));
const app__index = UNSAFE_withComponentProps(function HomePage() {
  return /* @__PURE__ */ jsx(Page, {
    title: "Product Configurator",
    subtitle: "Let customers personalise your products with custom colors, text & logos",
    children: /* @__PURE__ */ jsxs(BlockStack, {
      gap: "600",
      children: [/* @__PURE__ */ jsxs(Layout, {
        children: [/* @__PURE__ */ jsx(Layout.Section, {
          variant: "oneThird",
          children: /* @__PURE__ */ jsx(FeatureCard, {
            icon: ProductIcon,
            accentColor: "#4f46e5",
            title: "Products",
            description: "View all configured products and manage their publish status from one place.",
            href: "/app/products",
            cta: "Manage Products"
          })
        }), /* @__PURE__ */ jsx(Layout.Section, {
          variant: "oneThird",
          children: /* @__PURE__ */ jsx(FeatureCard, {
            icon: PaintBrushFlatIcon,
            accentColor: "#0891b2",
            title: "Setup Builder",
            description: "Define layers, color swatches, text inputs and logo upload options.",
            href: "/app/products",
            cta: "Open Builder"
          })
        }), /* @__PURE__ */ jsx(Layout.Section, {
          variant: "oneThird",
          children: /* @__PURE__ */ jsx(FeatureCard, {
            icon: ViewIcon,
            accentColor: "#059669",
            title: "Live Preview",
            description: "Test the full customer customisation experience before going live.",
            href: "/app/products",
            cta: "Open Preview"
          })
        })]
      }), /* @__PURE__ */ jsx(Card, {
        children: /* @__PURE__ */ jsxs(BlockStack, {
          gap: "400",
          children: [/* @__PURE__ */ jsx(InlineStack, {
            align: "space-between",
            blockAlign: "center",
            children: /* @__PURE__ */ jsxs(InlineStack, {
              gap: "200",
              blockAlign: "center",
              children: [/* @__PURE__ */ jsx(Box, {
                background: "bg-fill-magic",
                borderRadius: "200",
                padding: "150",
                children: /* @__PURE__ */ jsx(Icon, {
                  source: StarFilledIcon,
                  tone: "magic"
                })
              }), /* @__PURE__ */ jsx(Text$1, {
                variant: "headingMd",
                as: "h2",
                children: "Getting Started"
              })]
            })
          }), /* @__PURE__ */ jsx(Divider, {}), /* @__PURE__ */ jsxs(BlockStack, {
            gap: "300",
            children: [/* @__PURE__ */ jsx(StepRow, {
              number: 1,
              title: "Add a Product",
              description: /* @__PURE__ */ jsxs(Fragment, {
                children: ["Go to", " ", /* @__PURE__ */ jsx(Link, {
                  to: "/app/products",
                  style: {
                    color: "#4f46e5",
                    fontWeight: 600,
                    textDecoration: "none"
                  },
                  children: "Products"
                }), " ", "and select the product you want to customise."]
              })
            }), /* @__PURE__ */ jsx(StepRow, {
              number: 2,
              title: "Build the Configurator",
              description: "Click Set Up to define layers, color swatches, text, and logo placement on the canvas."
            }), /* @__PURE__ */ jsx(StepRow, {
              number: 3,
              title: "Publish & Preview",
              description: "Click Publish to make it live, then Open Configurator to test the full customer experience."
            })]
          }), /* @__PURE__ */ jsx(Box, {
            paddingBlockStart: "200",
            children: /* @__PURE__ */ jsx(Link, {
              to: "/app/products",
              style: {
                textDecoration: "none"
              },
              children: /* @__PURE__ */ jsx(Button, {
                variant: "primary",
                icon: ChevronRightIcon,
                children: "Get Started"
              })
            })
          })]
        })
      }), /* @__PURE__ */ jsx(Card, {
        children: /* @__PURE__ */ jsxs(BlockStack, {
          gap: "400",
          children: [/* @__PURE__ */ jsxs(InlineStack, {
            align: "space-between",
            blockAlign: "center",
            children: [/* @__PURE__ */ jsx(Text$1, {
              variant: "headingMd",
              as: "h2",
              children: "What you can configure"
            }), /* @__PURE__ */ jsx(Link, {
              to: "/app/settings",
              style: {
                textDecoration: "none"
              },
              children: /* @__PURE__ */ jsx(Button, {
                variant: "plain",
                children: "Global Settings"
              })
            })]
          }), /* @__PURE__ */ jsx(Divider, {}), /* @__PURE__ */ jsx(Layout, {
            children: FEATURES.map(({
              label: label2,
              desc,
              href
            }) => /* @__PURE__ */ jsx(Layout.Section, {
              variant: "oneThird",
              children: /* @__PURE__ */ jsx(Link, {
                to: href,
                style: {
                  textDecoration: "none"
                },
                children: /* @__PURE__ */ jsx(Box, {
                  background: "bg-surface-secondary",
                  borderRadius: "200",
                  padding: "400",
                  children: /* @__PURE__ */ jsxs(BlockStack, {
                    gap: "150",
                    children: [/* @__PURE__ */ jsx(Text$1, {
                      variant: "headingSm",
                      as: "h3",
                      children: label2
                    }), /* @__PURE__ */ jsx(Text$1, {
                      variant: "bodySm",
                      tone: "subdued",
                      as: "p",
                      children: desc
                    })]
                  })
                })
              })
            }, label2))
          })]
        })
      })]
    })
  });
});
const FEATURES = [{
  label: "Color Swatches",
  desc: "Let customers pick from predefined swatches or a full color picker.",
  href: "/app/settings"
}, {
  label: "Custom Text",
  desc: "Add personalised text with font, size, and color controls.",
  href: "/app/products"
}, {
  label: "Logo Upload",
  desc: "Allow customers to upload their own logo or artwork.",
  href: "/app/products"
}, {
  label: "Layer System",
  desc: "Stack multiple layers and apply colorization effects per layer.",
  href: "/app/products"
}, {
  label: "Conditional Logic",
  desc: "Show or hide options based on previous selections.",
  href: "/app/products"
}, {
  label: "Multi-View",
  desc: "Support front, back, and side views on the same product.",
  href: "/app/products"
}];
function FeatureCard({
  icon,
  accentColor,
  title,
  description,
  href,
  cta
}) {
  return /* @__PURE__ */ jsx(Card, {
    children: /* @__PURE__ */ jsxs(BlockStack, {
      gap: "400",
      children: [/* @__PURE__ */ jsxs(InlineStack, {
        gap: "300",
        blockAlign: "center",
        children: [/* @__PURE__ */ jsx("div", {
          style: {
            width: 40,
            height: 40,
            borderRadius: 8,
            background: `${accentColor}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          },
          children: /* @__PURE__ */ jsx(Icon, {
            source: icon
          })
        }), /* @__PURE__ */ jsx(Text$1, {
          variant: "headingMd",
          as: "h3",
          children: title
        })]
      }), /* @__PURE__ */ jsx(Text$1, {
        variant: "bodySm",
        tone: "subdued",
        as: "p",
        children: description
      }), /* @__PURE__ */ jsx(Link, {
        to: href,
        style: {
          textDecoration: "none"
        },
        children: /* @__PURE__ */ jsx(Button, {
          variant: "secondary",
          fullWidth: true,
          children: cta
        })
      })]
    })
  });
}
function StepRow({
  number,
  title,
  description
}) {
  return /* @__PURE__ */ jsxs(InlineStack, {
    gap: "400",
    blockAlign: "start",
    wrap: false,
    children: [/* @__PURE__ */ jsx("div", {
      style: {
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: "#4f46e5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        marginTop: 1
      },
      children: /* @__PURE__ */ jsx(Text$1, {
        variant: "bodySm",
        fontWeight: "bold",
        as: "span",
        tone: "text-inverse",
        children: number
      })
    }), /* @__PURE__ */ jsxs(BlockStack, {
      gap: "050",
      children: [/* @__PURE__ */ jsx(Text$1, {
        variant: "bodyMd",
        fontWeight: "semibold",
        as: "p",
        children: title
      }), /* @__PURE__ */ jsx(Text$1, {
        variant: "bodySm",
        tone: "subdued",
        as: "p",
        children: description
      })]
    })]
  });
}
const route25 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: app__index
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-CBG9gWr7.js", "imports": ["/assets/chunk-4N6VE7H7-MeczOpdo.js", "/assets/index-rpFy-Kpx.js", "/assets/index-CoSDG3-6.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/root-B-uol03-.js", "imports": ["/assets/chunk-4N6VE7H7-MeczOpdo.js", "/assets/index-rpFy-Kpx.js", "/assets/index-CoSDG3-6.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/webhooks.customers.data_request": { "id": "routes/webhooks.customers.data_request", "parentId": "root", "path": "webhooks/customers/data_request", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/webhooks.customers.data_request-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/apps.product-configurator.data": { "id": "routes/apps.product-configurator.data", "parentId": "root", "path": "apps/product-configurator/data", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/apps.product-configurator.data-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/webhooks.app.scopes_update": { "id": "routes/webhooks.app.scopes_update", "parentId": "root", "path": "webhooks/app/scopes_update", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/webhooks.app.scopes_update-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/webhooks.customers.redact": { "id": "routes/webhooks.customers.redact", "parentId": "root", "path": "webhooks/customers/redact", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/webhooks.customers.redact-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/webhooks.app.uninstalled": { "id": "routes/webhooks.app.uninstalled", "parentId": "root", "path": "webhooks/app/uninstalled", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/webhooks.app.uninstalled-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/configurator.$productId": { "id": "routes/configurator.$productId", "parentId": "root", "path": "configurator/:productId", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/configurator._productId-D9wxAth6.js", "imports": ["/assets/chunk-4N6VE7H7-MeczOpdo.js", "/assets/ThreeViewer-BPibY7Q-.js", "/assets/configurator-Bs0Bmczv.js", "/assets/index-CoSDG3-6.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/webhooks.shop.redact": { "id": "routes/webhooks.shop.redact", "parentId": "root", "path": "webhooks/shop/redact", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/webhooks.shop.redact-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/upload-preview": { "id": "routes/upload-preview", "parentId": "root", "path": "upload-preview", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/upload-preview-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/auth.login": { "id": "routes/auth.login", "parentId": "root", "path": "auth/login", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/route-DtiItvyd.js", "imports": ["/assets/chunk-4N6VE7H7-MeczOpdo.js", "/assets/AppProxyProvider-BoWZ72lL.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/_index": { "id": "routes/_index", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/route-22iwizJ1.js", "imports": ["/assets/chunk-4N6VE7H7-MeczOpdo.js"], "css": ["/assets/route-Xpdx9QZl.css"], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/auth.$": { "id": "routes/auth.$", "parentId": "root", "path": "auth/*", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/auth._-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app": { "id": "routes/app", "parentId": "root", "path": "app", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": true, "module": "/assets/app-_Jf78N2h.js", "imports": ["/assets/chunk-4N6VE7H7-MeczOpdo.js", "/assets/AppProxyProvider-BoWZ72lL.js", "/assets/context-CC90ckuS.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app.configurator-setup.$productId": { "id": "routes/app.configurator-setup.$productId", "parentId": "routes/app", "path": "configurator-setup/:productId", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/app.configurator-setup._productId-DGywAqPn.js", "imports": ["/assets/chunk-4N6VE7H7-MeczOpdo.js", "/assets/ThreeViewer-BPibY7Q-.js", "/assets/configurator-Bs0Bmczv.js", "/assets/index-CoSDG3-6.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app.configurator-style.$productId": { "id": "routes/app.configurator-style.$productId", "parentId": "routes/app", "path": "configurator-style/:productId", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/app.configurator-style._productId-BNttGptw.js", "imports": ["/assets/chunk-4N6VE7H7-MeczOpdo.js", "/assets/Page-BH3Os2fx.js", "/assets/Banner-B9GlMWRw.js", "/assets/Divider-CWt5q4K2.js", "/assets/context-CC90ckuS.js", "/assets/index-rpFy-Kpx.js", "/assets/index-CoSDG3-6.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app.configurator.$productId": { "id": "routes/app.configurator.$productId", "parentId": "routes/app", "path": "configurator/:productId", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/app.configurator._productId-DXWOnLVF.js", "imports": ["/assets/chunk-4N6VE7H7-MeczOpdo.js", "/assets/ThreeViewer-BPibY7Q-.js", "/assets/configurator-Bs0Bmczv.js", "/assets/index-CoSDG3-6.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app.inventory.$productId": { "id": "routes/app.inventory.$productId", "parentId": "routes/app", "path": "inventory/:productId", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/app.inventory._productId-khdIU5eE.js", "imports": ["/assets/chunk-4N6VE7H7-MeczOpdo.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app.variants.$productId": { "id": "routes/app.variants.$productId", "parentId": "routes/app", "path": "variants/:productId", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/app.variants._productId-qLv90q0P.js", "imports": ["/assets/chunk-4N6VE7H7-MeczOpdo.js", "/assets/configurator-Bs0Bmczv.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app.pricing.$productId": { "id": "routes/app.pricing.$productId", "parentId": "routes/app", "path": "pricing/:productId", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/app.pricing._productId-ZEyfMviD.js", "imports": ["/assets/chunk-4N6VE7H7-MeczOpdo.js", "/assets/configurator-Bs0Bmczv.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app.product-picker": { "id": "routes/app.product-picker", "parentId": "routes/app", "path": "product-picker", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/app.product-picker-KbEzVuvJ.js", "imports": ["/assets/chunk-4N6VE7H7-MeczOpdo.js", "/assets/Page-BH3Os2fx.js", "/assets/Banner-B9GlMWRw.js", "/assets/Divider-CWt5q4K2.js", "/assets/context-CC90ckuS.js", "/assets/index-rpFy-Kpx.js", "/assets/index-CoSDG3-6.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app.upload-image": { "id": "routes/app.upload-image", "parentId": "routes/app", "path": "upload-image", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/app.upload-image-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app.additional": { "id": "routes/app.additional", "parentId": "routes/app", "path": "additional", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/app.additional-CB4TE1pb.js", "imports": ["/assets/chunk-4N6VE7H7-MeczOpdo.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app.upload-glb": { "id": "routes/app.upload-glb", "parentId": "routes/app", "path": "upload-glb", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/app.upload-glb-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app.products": { "id": "routes/app.products", "parentId": "routes/app", "path": "products", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/app.products-C9l_ReZx.js", "imports": ["/assets/chunk-4N6VE7H7-MeczOpdo.js", "/assets/Page-BH3Os2fx.js", "/assets/context-CC90ckuS.js", "/assets/ProductIcon.svg-DT7AoPQ4.js", "/assets/index-rpFy-Kpx.js", "/assets/index-CoSDG3-6.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app.settings": { "id": "routes/app.settings", "parentId": "routes/app", "path": "settings", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/app.settings-n39XoXHG.js", "imports": ["/assets/chunk-4N6VE7H7-MeczOpdo.js", "/assets/Page-BH3Os2fx.js", "/assets/Banner-B9GlMWRw.js", "/assets/Divider-CWt5q4K2.js", "/assets/context-CC90ckuS.js", "/assets/index-rpFy-Kpx.js", "/assets/index-CoSDG3-6.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app._index": { "id": "routes/app._index", "parentId": "routes/app", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/app._index-DIdDpSfw.js", "imports": ["/assets/chunk-4N6VE7H7-MeczOpdo.js", "/assets/Page-BH3Os2fx.js", "/assets/ProductIcon.svg-DT7AoPQ4.js", "/assets/Divider-CWt5q4K2.js", "/assets/context-CC90ckuS.js", "/assets/index-rpFy-Kpx.js", "/assets/index-CoSDG3-6.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/assets/manifest-2d9c3bc0.js", "version": "2d9c3bc0", "sri": void 0 };
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "unstable_optimizeDeps": false, "v8_passThroughRequests": false, "unstable_trailingSlashAwareDataRequests": false, "unstable_previewServerPrerendering": false, "v8_middleware": false, "v8_splitRouteModules": false, "v8_viteEnvironmentApi": false };
const ssr = true;
const isSpaMode = false;
const prerender = [];
const routeDiscovery = { "mode": "lazy", "manifestPath": "/__manifest" };
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/webhooks.customers.data_request": {
    id: "routes/webhooks.customers.data_request",
    parentId: "root",
    path: "webhooks/customers/data_request",
    index: void 0,
    caseSensitive: void 0,
    module: route1
  },
  "routes/apps.product-configurator.data": {
    id: "routes/apps.product-configurator.data",
    parentId: "root",
    path: "apps/product-configurator/data",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/webhooks.app.scopes_update": {
    id: "routes/webhooks.app.scopes_update",
    parentId: "root",
    path: "webhooks/app/scopes_update",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/webhooks.customers.redact": {
    id: "routes/webhooks.customers.redact",
    parentId: "root",
    path: "webhooks/customers/redact",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  },
  "routes/webhooks.app.uninstalled": {
    id: "routes/webhooks.app.uninstalled",
    parentId: "root",
    path: "webhooks/app/uninstalled",
    index: void 0,
    caseSensitive: void 0,
    module: route5
  },
  "routes/configurator.$productId": {
    id: "routes/configurator.$productId",
    parentId: "root",
    path: "configurator/:productId",
    index: void 0,
    caseSensitive: void 0,
    module: route6
  },
  "routes/webhooks.shop.redact": {
    id: "routes/webhooks.shop.redact",
    parentId: "root",
    path: "webhooks/shop/redact",
    index: void 0,
    caseSensitive: void 0,
    module: route7
  },
  "routes/upload-preview": {
    id: "routes/upload-preview",
    parentId: "root",
    path: "upload-preview",
    index: void 0,
    caseSensitive: void 0,
    module: route8
  },
  "routes/auth.login": {
    id: "routes/auth.login",
    parentId: "root",
    path: "auth/login",
    index: void 0,
    caseSensitive: void 0,
    module: route9
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route10
  },
  "routes/auth.$": {
    id: "routes/auth.$",
    parentId: "root",
    path: "auth/*",
    index: void 0,
    caseSensitive: void 0,
    module: route11
  },
  "routes/app": {
    id: "routes/app",
    parentId: "root",
    path: "app",
    index: void 0,
    caseSensitive: void 0,
    module: route12
  },
  "routes/app.configurator-setup.$productId": {
    id: "routes/app.configurator-setup.$productId",
    parentId: "routes/app",
    path: "configurator-setup/:productId",
    index: void 0,
    caseSensitive: void 0,
    module: route13
  },
  "routes/app.configurator-style.$productId": {
    id: "routes/app.configurator-style.$productId",
    parentId: "routes/app",
    path: "configurator-style/:productId",
    index: void 0,
    caseSensitive: void 0,
    module: route14
  },
  "routes/app.configurator.$productId": {
    id: "routes/app.configurator.$productId",
    parentId: "routes/app",
    path: "configurator/:productId",
    index: void 0,
    caseSensitive: void 0,
    module: route15
  },
  "routes/app.inventory.$productId": {
    id: "routes/app.inventory.$productId",
    parentId: "routes/app",
    path: "inventory/:productId",
    index: void 0,
    caseSensitive: void 0,
    module: route16
  },
  "routes/app.variants.$productId": {
    id: "routes/app.variants.$productId",
    parentId: "routes/app",
    path: "variants/:productId",
    index: void 0,
    caseSensitive: void 0,
    module: route17
  },
  "routes/app.pricing.$productId": {
    id: "routes/app.pricing.$productId",
    parentId: "routes/app",
    path: "pricing/:productId",
    index: void 0,
    caseSensitive: void 0,
    module: route18
  },
  "routes/app.product-picker": {
    id: "routes/app.product-picker",
    parentId: "routes/app",
    path: "product-picker",
    index: void 0,
    caseSensitive: void 0,
    module: route19
  },
  "routes/app.upload-image": {
    id: "routes/app.upload-image",
    parentId: "routes/app",
    path: "upload-image",
    index: void 0,
    caseSensitive: void 0,
    module: route20
  },
  "routes/app.additional": {
    id: "routes/app.additional",
    parentId: "routes/app",
    path: "additional",
    index: void 0,
    caseSensitive: void 0,
    module: route21
  },
  "routes/app.upload-glb": {
    id: "routes/app.upload-glb",
    parentId: "routes/app",
    path: "upload-glb",
    index: void 0,
    caseSensitive: void 0,
    module: route22
  },
  "routes/app.products": {
    id: "routes/app.products",
    parentId: "routes/app",
    path: "products",
    index: void 0,
    caseSensitive: void 0,
    module: route23
  },
  "routes/app.settings": {
    id: "routes/app.settings",
    parentId: "routes/app",
    path: "settings",
    index: void 0,
    caseSensitive: void 0,
    module: route24
  },
  "routes/app._index": {
    id: "routes/app._index",
    parentId: "routes/app",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route25
  }
};
const allowedActionOrigins = false;
export {
  allowedActionOrigins,
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  prerender,
  publicPath,
  routeDiscovery,
  routes,
  ssr
};
