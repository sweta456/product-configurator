import type { HeadersFunction, LoaderFunctionArgs, ShouldRevalidateFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider as ShopifyAppProvider } from "@shopify/shopify-app-react-router/react";
import { AppProvider as PolarisProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";

import { authenticate } from "../shopify.server";

// Declare Shopify admin web components so TypeScript doesn't error on them
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "s-app-nav": React.HTMLAttributes<HTMLElement>;
      "s-link": React.HTMLAttributes<HTMLElement> & { href?: string };
    }
  }
}

import React from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

// apiKey never changes between navigations — skip re-running authenticate.admin on every child route change
export const shouldRevalidate = (_args: ShouldRevalidateFunctionArgs) => false;

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <ShopifyAppProvider embedded apiKey={apiKey}>
      <PolarisProvider i18n={enTranslations}>
        <s-app-nav>
          <s-link href="/app">Home</s-link>
          <s-link href="/app/products">Products</s-link>
          <s-link href="/app/settings">Settings</s-link>
        </s-app-nav>
        <Outlet />
      </PolarisProvider>
    </ShopifyAppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
