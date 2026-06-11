import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { authenticate } from "../shopify.server";

export async function action({ request }: any) {
  await authenticate.admin(request);

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

    const uploadsDir = join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.glb`;
    writeFileSync(join(uploadsDir, filename), buffer);

    return Response.json({ url: `/uploads/${filename}` });
  } catch (err: any) {
    return Response.json({ error: err.message ?? "Upload failed" }, { status: 500 });
  }
}
