import type { LoaderFunctionArgs } from "react-router";
import prisma from "../db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const productId = url.searchParams.get("productId");

  if (!shop || !productId) {
    return Response.json({ error: "Missing shop or productId" }, { status: 400 });
  }

  const config = await prisma.productConfig.findFirst({
    where: { productId, shop },
  });

  return Response.json({ config });
}
