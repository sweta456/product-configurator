import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

// Shopify sends this when a customer requests deletion of their data (48 days after uninstall).
// Your app stores no customer PII — only product config data — so no action needed.
export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop } = await authenticate.webhook(request);
  console.log(`${topic} for shop ${shop} — no customer PII stored`);
  return new Response();
};
