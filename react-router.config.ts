import { vercelPreset } from "@vercel/react-router/vite";
import type { Config } from "@react-router/dev/config";

// Only apply the Vercel preset when actually building on Vercel (it sets
// VERCEL=1 automatically). The preset nests the server bundle under a
// runtime-config subfolder, which breaks Railway's `react-router-serve
// ./build/server/index.js` start command if applied unconditionally.
export default {
  ssr: true,
  presets: process.env.VERCEL ? [vercelPreset()] : [],
} satisfies Config;
