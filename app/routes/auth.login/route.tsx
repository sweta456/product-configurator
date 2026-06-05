import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, useActionData, useLoaderData, useSearchParams } from "react-router";

import { login } from "../../shopify.server";
import prisma from "../../db.server";
import { loginErrorMessage } from "./error.server";

// accounts.shopify.com sets X-Frame-Options: DENY, so OAuth CANNOT happen
// inside the Shopify Admin iframe. This helper intercepts any redirect that
// login() returns or throws and converts it to a 200 HTML page that breaks
// out of the iframe via window.top.location.href before navigating to OAuth.
async function loginExitIframe(request: Request): Promise<Response | { errors: any }> {
  let resp: any;
  try {
    resp = await login(request);
  } catch (e) {
    resp = e; // login() throws the redirect Response in some versions
  }

  if (resp instanceof Response) {
    const location = resp.headers.get("Location");
    if (location && (resp.status === 301 || resp.status === 302)) {
      // Preserve Set-Cookie headers (OAuth state/nonce) in our 200 response
      const headers = new Headers({ "Content-Type": "text/html" });
      for (const [k, v] of resp.headers.entries()) {
        if (k.toLowerCase() === "set-cookie") headers.append(k, v);
      }
      return new Response(
        `<!DOCTYPE html><html><head><meta charset="utf-8">` +
          `<script>window.top.location.href=${JSON.stringify(location)}</script>` +
          `</head><body>Redirecting to Shopify...</body></html>`,
        { status: 200, headers },
      );
    }
    // Non-redirect response (e.g. login success) — pass through
    return resp;
  }

  return { errors: loginErrorMessage(resp) };
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  // Auto-detect shop from any stored session or DEFAULT_SHOP env var
  if (!url.searchParams.get("shop")) {
    const known = await prisma.session.findFirst({ select: { shop: true } });
    const fallback = known?.shop || process.env.DEFAULT_SHOP;
    if (fallback) url.searchParams.set("shop", fallback);
  }

  return loginExitIframe(new Request(url.toString(), request));
};

export const action = async ({ request }: ActionFunctionArgs) => {
  return loginExitIframe(request);
};

export default function Auth() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  const [shop, setShop] = useState(searchParams.get("shop") ?? "");
  const { errors } = ((actionData || loaderData) as any) ?? { errors: {} };

  return (
    <AppProvider embedded={false}>
      <s-page>
        <Form method="post">
          {/* Hidden input ensures shop value is always included in form data */}
          <input type="hidden" name="shop" value={shop} />
          <s-section heading="Log in">
            <s-text-field
              name="_shop_display"
              label="Shop domain"
              details="example.myshopify.com"
              value={shop}
              onChange={(e: any) => setShop(e.target?.value ?? e.currentTarget?.value ?? "")}
              autocomplete="on"
              error={errors?.shop}
            ></s-text-field>
            {/* Use native button so React Router Form submission works reliably */}
            <button
              type="submit"
              style={{
                marginTop: 12,
                padding: "10px 20px",
                background: "#008060",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Log in
            </button>
          </s-section>
        </Form>
      </s-page>
    </AppProvider>
  );
}
