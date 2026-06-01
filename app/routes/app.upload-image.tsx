import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { authenticate } from "../shopify.server";

export async function action({ request }: any) {
  // Verify the request is from an authenticated admin session
  await authenticate.admin(request);

  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file || file.size === 0) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure public/uploads directory exists
    const uploadsDir = join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }

    // Unique filename to avoid collisions
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = join(uploadsDir, filename);

    writeFileSync(filePath, buffer);

    return Response.json({ url: `/uploads/${filename}` });
  } catch (err: any) {
    return Response.json(
      { error: err.message ?? "Upload failed" },
      { status: 500 },
    );
  }
}
