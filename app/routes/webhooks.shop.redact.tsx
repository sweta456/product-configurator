import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

// Shopify sends this 48 days after a shop uninstalls the app.
// Final cleanup — remove any remaining shop data.
export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop } = await authenticate.webhook(request);
  console.log(`${topic} for shop ${shop} — final data purge`);

  await db.productConfig.deleteMany({ where: { shop } });
  await db.configurator.deleteMany({ where: { shop } });
  await db.appSettings.deleteMany({ where: { shop } });

  const store = await db.store.findUnique({ where: { shop } });
  if (store) {
    await db.product.deleteMany({ where: { storeId: store.id } });
    await db.store.delete({ where: { shop } });
  }

  return new Response();
};
