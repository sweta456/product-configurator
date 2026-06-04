import { writeFileSync, mkdirSync, existsSync, readdirSync, statSync, unlinkSync } from "fs";
import { join } from "path";

const KEEP_DAYS = 10;
const KEEP_MS   = KEEP_DAYS * 24 * 60 * 60 * 1000;

// Delete preview files older than KEEP_DAYS. Runs on every upload so no
// separate cron job is needed — old files are pruned as new ones come in.
function cleanupOldPreviews(uploadsDir: string) {
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
    // Non-fatal — cleanup failure should never block an upload
  }
}

// Public (no auth) endpoint — the storefront iframe POSTs the canvas screenshot
// here to get a short-lived URL stored as a Shopify line item property.
export async function action({ request }: any) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { dataUrl } = body as { dataUrl?: string };

    if (!dataUrl || !dataUrl.startsWith("data:image/")) {
      return Response.json({ error: "Invalid image data" }, { status: 400 });
    }

    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // 5 MB limit (canvas screenshots are typically 200–800 KB at 2× pixel ratio)
    if (buffer.length > 5 * 1024 * 1024) {
      return Response.json({ error: "Image too large" }, { status: 413 });
    }

    const uploadsDir = join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }

    // Prune files older than 10 days before writing the new one
    cleanupOldPreviews(uploadsDir);

    const filename = `preview-${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
    writeFileSync(join(uploadsDir, filename), buffer);

    return Response.json({ url: `/uploads/${filename}` });
  } catch (err: any) {
    return Response.json({ error: err.message ?? "Upload failed" }, { status: 500 });
  }
}
