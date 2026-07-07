import { authenticate } from "../shopify.server";
import { uploadFileToShopify } from "../utils/shopifyFiles.server";

export async function action({ request }: any) {
  const { admin } = await authenticate.admin(request);

  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file || file.size === 0) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext !== "glb") {
    return Response.json({ error: "Only .glb files are accepted" }, { status: 400 });
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await uploadFileToShopify(admin, {
      buffer,
      filename: file.name,
      mimeType: "model/gltf-binary",
      resourceType: "MODEL_3D",
    });

    if ("error" in result) {
      return Response.json({ error: result.error }, { status: 502 });
    }

    return Response.json({ url: result.url });
  } catch (err: any) {
    return Response.json({ error: err.message ?? "Upload failed" }, { status: 500 });
  }
}
