import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { useEffect, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, useActionData, useLoaderData, useSearchParams } from "react-router";

import { login } from "../../shopify.server";
import prisma from "../../db.server";
import { loginErrorMessage } from "./error.server";

// Extract the OAuth redirect URL from login() without trying to break the iframe
// server-side. React Router's <Form> uses fetch, so a server-rendered HTML page
// with window.top.location.href is never executed — the component must do the
// redirect via useEffect instead.
async function getLoginResult(request: Request): Promise<{ redirectUrl?: string; errors?: any; shop?: string }> {
  let resp: any;
  try {
    resp = await login(request);
  } catch (e) {
    resp = e;
  }

  if (resp instanceof Response) {
    const location = resp.headers.get("Location");
    if (location && (resp.status === 301 || resp.status === 302)) {
      return { redirectUrl: location };
    }
  }

  return { errors: loginErrorMessage(resp) };
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (!url.searchParams.get("shop")) {
    const known = await prisma.session.findFirst({ select: { shop: true } });
    const fallback = known?.shop || process.env.DEFAULT_SHOP;
    if (fallback) url.searchParams.set("shop", fallback);
  }

  return getLoginResult(new Request(url.toString(), request));
};

export const action = async ({ request }: ActionFunctionArgs) => {
  return getLoginResult(request);
};

export default function Auth() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  const [shop, setShop] = useState(searchParams.get("shop") ?? "");
  const data = (actionData || loaderData) as any;
  const { errors, redirectUrl } = data ?? { errors: {} };

  // When we have a redirect URL (OAuth install flow), break out of the Shopify
  // admin iframe so the OAuth page can load in the top-level frame.
  useEffect(() => {
    if (redirectUrl) {
      (window.top ?? window).location.href = redirectUrl;
    }
  }, [redirectUrl]);

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
