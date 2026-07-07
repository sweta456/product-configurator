import { unauthenticated } from "../shopify.server";
import { uploadFileToShopify } from "../utils/shopifyFiles.server";

// Public (no admin session) endpoint -- the storefront iframe POSTs the
// canvas screenshot here to get a URL stored as a Shopify line item
// property. Uses the app's stored offline access token for the given shop
// (via unauthenticated.admin) since there's no interactive admin session
// on a customer-facing request.
export async function action({ request }: any) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  if (!shop) {
    return Response.json({ error: "Missing shop parameter" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { dataUrl } = body as { dataUrl?: string };

    if (!dataUrl || !dataUrl.startsWith("data:image/")) {
      return Response.json({ error: "Invalid image data" }, { status: 400 });
    }

    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // 5 MB limit (canvas screenshots are typically 200-800 KB at 2x pixel ratio)
    if (buffer.length > 5 * 1024 * 1024) {
      return Response.json({ error: "Image too large" }, { status: 413 });
    }

    let admin;
    try {
      ({ admin } = await unauthenticated.admin(shop));
    } catch {
      return Response.json({ error: "Unable to process this store's request" }, { status: 502 });
    }

    const filename = `preview-${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
    const result = await uploadFileToShopify(admin, {
      buffer,
      filename,
      mimeType: "image/png",
      resourceType: "IMAGE",
    });

    if ("error" in result) {
      return Response.json({ error: result.error }, { status: 502 });
    }

    return Response.json({ url: result.url });
  } catch (err: any) {
    return Response.json({ error: err.message ?? "Upload failed" }, { status: 500 });
  }
}
