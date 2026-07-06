import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October25,
  scopes: "write_products,read_products,write_orders,read_orders,read_inventory,write_inventory,read_locations,write_publications,read_publications",
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {
    expiringOfflineAccessTokens: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
  hooks: {
    afterAuth: async ({ admin }) => {
      // Liquid has no built-in way to read an app's URL (`app.url` isn't a real
      // property), so the theme block reads this shop metafield instead.
      const shopResponse = await admin.graphql(`#graphql
        query { shop { id } }
      `);
      const { data } = await shopResponse.json();

      await admin.graphql(
        `#graphql
        mutation SetConfiguratorAppUrl($ownerId: ID!, $value: String!) {
          metafieldsSet(metafields: [{
            ownerId: $ownerId
            namespace: "$app"
            key: "configurator_app_url"
            type: "single_line_text_field"
            value: $value
          }]) {
            userErrors { field message }
          }
        }`,
        {
          variables: {
            ownerId: data.shop.id,
            value: process.env.SHOPIFY_APP_URL || "",
          },
        },
      );
    },
  },
});

export default shopify;
export const apiVersion = ApiVersion.October25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
