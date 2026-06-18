import { useLoaderData, useSubmit, useActionData, Link, useNavigation } from "react-router";
import { useState, useEffect } from "react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { type Question, getQuestionAnswers, migrateOptions } from "../types/configurator";

// ─── Loader ───────────────────────────────────────────────────────────────────

export async function loader({ request, params }: any) {
  const { admin } = await authenticate.admin(request);
  const decodedId = decodeURIComponent(params.productId);

  const [productResp, config] = await Promise.all([
    admin.graphql(
      `query GetProduct($id: ID!) {
        product(id: $id) {
          id title
          variants(first: 100) {
            edges { node { id title price sku selectedOptions { name value } } }
          }
        }
      }`,
      { variables: { id: decodedId } },
    ),
    prisma.productConfig.findUnique({ where: { productId: decodedId } }),
  ]);

  const productJson = await productResp.json();
  const product = productJson.data?.product;
  if (!product) throw new Response("Product not found", { status: 404 });

  const opts = (config as any)?.options ?? {};
  const questions: Question[] = migrateOptions(opts, (config?.layers as any[]) ?? []) || [];

  const variants = product.variants.edges.map((e: any) => e.node);
  const hasCustomVariants =
    variants.length > 1 || (variants.length === 1 && variants[0].title !== "Default Title");

  return { product, productId: decodedId, questions, variants, hasCustomVariants };
}

// ─── Action ───────────────────────────────────────────────────────────────────

export async function action({ request, params }: any) {
  const { session } = await authenticate.admin(request);
  const decodedId = decodeURIComponent(params.productId);
  const formData = await request.formData();
  const questionIds = JSON.parse(formData.get("questionIds") as string) as string[];

  const config = await prisma.productConfig.findUnique({ where: { productId: decodedId } });
  const opts = (config as any)?.options ?? {};
  const questions: Question[] = migrateOptions(opts, (config?.layers as any[]) ?? []) || [];

  const selectedQuestions = questions.filter((q) => questionIds.includes(q.id));
  const questionAnswers = selectedQuestions.map((q) => ({
    name: q.name,
    answers: getQuestionAnswers(q).map((a) => a.label),
  }));

  const totalCombinations = questionAnswers.reduce((acc, q) => acc * q.answers.length, 1);
  if (totalCombinations > 5000) {
    return { error: `Too many variants (${totalCombinations.toLocaleString()}). Maximum is 5,000.` };
  }

  // Generate every combination of answers across the selected questions
  const combinations = cartesian(questionAnswers.map((q) => q.answers));
  const numericId = decodedId.replace("gid://shopify/Product/", "");

  // Build REST variant objects — option1/option2/option3 are Shopify's positional fields
  const variants = combinations.map((combo) => {
    const v: Record<string, string> = { price: "0.00" };
    if (combo[0]) v.option1 = combo[0];
    if (combo[1]) v.option2 = combo[1];
    if (combo[2]) v.option3 = combo[2];
    return v;
  });

  // Use REST Admin API — same pattern as the inventory route, avoids GraphQL schema validation issues
  const resp = await fetch(
    `https://${session.shop}/admin/api/2024-01/products/${numericId}.json`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": session.accessToken as string,
      },
      body: JSON.stringify({
        product: {
          id: parseInt(numericId, 10),
          options: questionAnswers.map((q) => ({ name: q.name })),
          variants,
        },
      }),
    },
  );

  if (!resp.ok) {
    const errJson = await resp.json();
    const msg =
      typeof errJson.errors === "string"
        ? errJson.errors
        : JSON.stringify(errJson.errors ?? "Failed to create variants");
    return { error: msg };
  }

  const data = await resp.json();
  return { success: true, createdCount: data.product?.variants?.length ?? 0 };
}

function cartesian(arrays: string[][]): string[][] {
  if (arrays.length === 0) return [[]];
  const [first, ...rest] = arrays;
  const restCombinations = cartesian(rest);
  return first.flatMap((item) => restCombinations.map((combo) => [item, ...combo]));
}

// ─── TopBar ───────────────────────────────────────────────────────────────────

function TopBar({ productName, productId }: { productName: string; productId: string }) {
  const enc = encodeURIComponent(productId);
  const tabs = [
    { id: "build", label: "Build", href: `/app/configurator-setup/${enc}`, active: false, dot: false },
    { id: "pricing", label: "Pricing", href: `/app/pricing/${enc}`, active: false, dot: false },
    { id: "variants", label: "Variants", href: `/app/variants/${enc}`, active: true, dot: true },
    { id: "connect", label: "Connect", href: `/app/pricing/${enc}`, active: false, dot: false },
  ];

  return (
    <div style={{ height: 48, borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", background: "#fff", padding: "0 20px", flexShrink: 0, gap: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 32 }}>
        <div style={{ width: 28, height: 28, background: "#111827", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="7" r="4" /><path d="M6 21v-2a6 6 0 0112 0v2" />
          </svg>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#111827", letterSpacing: "0.02em" }}>
          {productName.toUpperCase()}
        </span>
        <svg width="12" height="12" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
      <div style={{ display: "flex", alignItems: "stretch", height: "100%" }}>
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            to={tab.href}
            prefetch={tab.active ? "none" : "intent"}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5, padding: "0 16px",
              fontSize: 13, fontWeight: tab.active ? 600 : 400,
              color: tab.active ? "#005bd3" : "#6b7280", textDecoration: "none",
              borderBottom: tab.active ? "2px solid #005bd3" : "2px solid transparent",
              boxSizing: "border-box",
            }}
          >
            {tab.label}
            {tab.dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />}
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Create Variants Modal ────────────────────────────────────────────────────

function CreateVariantsModal({
  questions,
  onClose,
  onSubmit,
  loading,
}: {
  questions: Question[];
  onClose: () => void;
  onSubmit: (ids: string[]) => void;
  loading: boolean;
}) {
  const eligibleQuestions = questions.filter((q) => getQuestionAnswers(q).length > 0);
  const [rows, setRows] = useState<string[]>([""]);

  const selectedIds = rows.filter(Boolean);
  const usedIds = new Set(rows.filter(Boolean));

  const availableFor = (rowIdx: number) =>
    eligibleQuestions.filter((q) => !usedIds.has(q.id) || rows[rowIdx] === q.id);

  const answerCountFor = (id: string) => {
    const q = eligibleQuestions.find((q) => q.id === id);
    return q ? getQuestionAnswers(q).length : 0;
  };

  const totalCombinations = selectedIds.reduce((acc, id) => acc * answerCountFor(id), 1);
  const canCreate = selectedIds.length > 0 && totalCombinations <= 5000;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#fff", borderRadius: 10, width: 500, maxWidth: "90vw", padding: "24px 24px 20px", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>

        {/* Title + description */}
        <h2 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 700, color: "#111827" }}>
          Create variants
        </h2>
        <p style={{ margin: "0 0 4px", fontSize: 13, color: "#374151", lineHeight: 1.55 }}>
          Select which questions should be combined to create your variants. We will create a variant for every combination of answers from the selected questions.
        </p>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "#374151" }}>
          A maximum of 5000 variants can be created for a combination.
        </p>

        {/* Info note */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid #e5e7eb", borderRadius: 6, padding: "9px 12px", marginBottom: 14 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" fill="#3b82f6" />
            <path d="M12 8v4m0 4h.01" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
          <span style={{ fontSize: 13, color: "#374151" }}>Text field questions cannot be used to create variants</span>
        </div>

        {/* Question rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 0 }}>
          {rows.map((rowId, idx) => {
            const count = rowId ? answerCountFor(rowId) : 0;
            return (
              <div
                key={idx}
                style={{
                  display: "flex", alignItems: "center",
                  borderBottom: "1px solid #f3f4f6",
                  padding: "8px 0",
                }}
              >
                {/* Selector */}
                <div style={{ position: "relative", flex: 1 }}>
                  <select
                    value={rowId}
                    onChange={(e) => {
                      const next = [...rows];
                      next[idx] = e.target.value;
                      setRows(next);
                    }}
                    style={{
                      width: "100%", height: 34, padding: "0 28px 0 10px",
                      border: "1px solid #d1d5db", borderRadius: 6,
                      fontSize: 13, fontWeight: rowId ? 600 : 400,
                      color: rowId ? "#111827" : "#9ca3af",
                      background: "#fff", cursor: "pointer", appearance: "none",
                    }}
                  >
                    <option value="">Question</option>
                    {availableFor(idx).map((q) => (
                      <option key={q.id} value={q.id}>{q.name}</option>
                    ))}
                  </select>
                  {/* chevron */}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"
                    style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => setRows(rows.length > 1 ? rows.filter((_, i) => i !== idx) : [""])}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 16, lineHeight: 1, padding: "0 10px", flexShrink: 0 }}
                >
                  ×
                </button>

                {/* Answer count */}
                <span style={{ fontSize: 13, color: "#6b7280", whiteSpace: "nowrap", minWidth: 70, textAlign: "right", flexShrink: 0 }}>
                  {rowId && count > 0 ? (
                    <>{idx > 0 ? <span style={{ color: "#9ca3af", marginRight: 4 }}>×</span> : null}{count} answers</>
                  ) : null}
                </span>
              </div>
            );
          })}
        </div>

        {/* Bottom row: combine button + variant count */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f3f4f6", marginBottom: 20 }}>
          <button
            onClick={() => setRows([...rows, ""])}
            disabled={rows.length >= 3 || availableFor(rows.length).length === 0}
            style={{
              background: "none", border: "none", cursor: rows.length < 3 ? "pointer" : "default",
              color: rows.length < 3 ? "#374151" : "#d1d5db",
              fontSize: 13, padding: 0, display: "flex", alignItems: "center", gap: 5,
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1 }}>+</span>
            Combine another question
          </button>
          {selectedIds.length > 0 && (
            <span style={{ fontSize: 13, color: totalCombinations > 5000 ? "#ef4444" : "#6b7280", fontWeight: 500 }}>
              {totalCombinations.toLocaleString()} variant{totalCombinations !== 1 ? "s" : ""}
              {totalCombinations > 5000 ? " (limit exceeded)" : ""}
            </span>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={onClose}
            style={{ background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, padding: "7px 16px", fontSize: 13, cursor: "pointer", color: "#374151" }}
          >
            Cancel
          </button>
          <button
            disabled={!canCreate || loading}
            onClick={() => onSubmit(selectedIds)}
            style={{
              background: canCreate && !loading ? "#3b82f6" : "#e5e7eb",
              color: canCreate && !loading ? "#fff" : "#9ca3af",
              border: "none", borderRadius: 6, padding: "7px 24px",
              fontSize: 13, fontWeight: 600,
              cursor: canCreate && !loading ? "pointer" : "default",
              transition: "background 0.15s",
            }}
          >
            {loading ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VariantsPage() {
  const { product, productId, questions, variants, hasCustomVariants } = useLoaderData() as {
    product: any; productId: string; questions: Question[];
    variants: any[]; hasCustomVariants: boolean;
  };
  const actionData = useActionData() as any;
  const navigation = useNavigation();
  const submit = useSubmit();

  const [showModal, setShowModal] = useState(false);
  const isCreating = navigation.state === "submitting";

  // Close modal on success
  useEffect(() => {
    if (actionData?.success) setShowModal(false);
  }, [actionData]);

  const handleCreate = (questionIds: string[]) => {
    const formData = new FormData();
    formData.set("questionIds", JSON.stringify(questionIds));
    submit(formData, { method: "post" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f9fafb", fontFamily: "Inter, system-ui, sans-serif" }}>
      <TopBar productName={product.title} productId={productId} />

      {/* Page header */}
      <div style={{ padding: "24px 24px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>Variants</h1>
        <Link
          to={`/app/inventory/${encodeURIComponent(productId)}`}
          style={{ fontSize: 13, color: "#6b7280", textDecoration: "none", padding: "2px 8px", borderRadius: 4, border: "1px solid #e5e7eb", background: "#fff" }}
        >
          Inventory
        </Link>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {!hasCustomVariants ? (
          /* ── Empty state ── */
          <div style={{ textAlign: "center", maxWidth: 420 }}>
            <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="#111827">
                <path d="M21.41 11.58l-9-9A2 2 0 0011 2H4a2 2 0 00-2 2v7a2 2 0 00.59 1.41l9 9a2 2 0 002.83 0l7-7a2 2 0 000-2.83zM7 8a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 6px" }}>
              You don't have any variants, yet
            </p>
            <p style={{ fontSize: 13, color: "#374151", margin: "0 0 20px", lineHeight: 1.6 }}>
              In order to create your variants you have to select a combination of questions from your product
            </p>
            {actionData?.error && (
              <p style={{ fontSize: 13, color: "#ef4444", marginBottom: 12 }}>{actionData.error}</p>
            )}
            <button
              onClick={() => setShowModal(true)}
              style={{
                background: "#fff", border: "1px solid #d1d5db", borderRadius: 6,
                padding: "8px 20px", fontSize: 13, fontWeight: 500,
                cursor: "pointer", color: "#111827",
              }}
            >
              Create variants
            </button>
          </div>
        ) : (
          /* ── Variants table ── */
          <div style={{ width: "100%", maxWidth: 860, padding: "0 24px", alignSelf: "flex-start", marginTop: 24 }}>
            {actionData?.error && (
              <p style={{ fontSize: 13, color: "#ef4444", marginBottom: 12 }}>{actionData.error}</p>
            )}
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", padding: "10px 16px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", gap: 8 }}>
                {["Variant", "Price", "SKU"].map((h) => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
                ))}
              </div>
              {variants.map((v: any, i: number) => (
                <div
                  key={v.id}
                  style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", padding: "11px 16px", gap: 8, alignItems: "center", borderBottom: i < variants.length - 1 ? "1px solid #f3f4f6" : "none" }}
                >
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{v.title}</span>
                  <span style={{ fontSize: 13, color: "#374151" }}>{v.price ? `$${parseFloat(v.price).toFixed(2)}` : "—"}</span>
                  <span style={{ fontSize: 12, color: "#6b7280", fontFamily: "monospace" }}>{v.sku || "—"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <CreateVariantsModal
          questions={questions}
          onClose={() => setShowModal(false)}
          onSubmit={handleCreate}
          loading={isCreating}
        />
      )}
    </div>
  );
}
