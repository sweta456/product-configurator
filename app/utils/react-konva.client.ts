// Re-exports react-konva through a `.client` module so React Router excludes
// it from the server bundle entirely (see app/routes/configurator.$productId.tsx
// and friends). Konva is a browser-only canvas library; its CJS build doesn't
// expose named exports cleanly under stricter Node ESM/CJS interop, which
// crashes the SSR bundle at import time on some Node runtimes even though the
// components themselves are already only ever rendered client-side.
export { Stage, Layer, Text, Image, Transformer, Group, Rect } from "react-konva";
