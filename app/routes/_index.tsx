import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

export const loader = ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  if (shop) {
    return redirect(`/app?shop=${shop}`);
  }
  return redirect("/app");
};
