import { authenticate } from "../shopify.server";
import { uploadFileToShopify } from "../utils/shopifyFiles.server";

export async function action({ request }: any) {
  // Verify the request is from an authenticated admin session
  const { admin } = await authenticate.admin(request);

  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file || file.size === 0) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || "image/png";

    const result = await uploadFileToShopify(admin, {
      buffer,
      filename: file.name,
      mimeType,
      resourceType: "IMAGE",
    });

    if ("error" in result) {
      return Response.json({ error: result.error }, { status: 502 });
    }

    return Response.json({ url: result.url });
  } catch (err: any) {
    return Response.json(
      { error: err.message ?? "Upload failed" },
      { status: 500 },
    );
  }
}
