import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

// Shopify sends this when a customer requests their data.
// You must respond within 30 days. Log or email the request to your privacy contact.
export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);
  console.log(`${topic} for shop ${shop}`, JSON.stringify(payload));
  // TODO: email s.harsh4094@gmail.com with the customer data request details
  return new Response();
};
