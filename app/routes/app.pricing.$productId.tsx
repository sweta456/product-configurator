import { useLoaderData, useSubmit, useActionData, Link } from "react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import {
  type Question,
  type PriceOperator as Operator,
  type ExtraPrice,
  type EquationLine,
  type Equation,
  type PricingData,
  getQuestionAnswers,
  migrateOptions,
} from "../types/configurator";

// ─── Loader ───────────────────────────────────────────────────────────────────

export async function loader({ request, params }: any) {
  const { admin } = await authenticate.admin(request);
  const decodedId = decodeURIComponent(params.productId);

  const [productResp, shopResp, config] = await Promise.all([
    admin.graphql(
      `query GetProduct($id: ID!) { product(id: $id) { id title handle featuredImage { url } } }`,
      { variables: { id: decodedId } },
    ),
    admin.graphql(`query { shop { name myshopifyDomain currencyCode } }`),
    prisma.productConfig.findUnique({ where: { productId: decodedId } }),
  ]);

  const productJson = await productResp.json();
  const shopJson = await shopResp.json();
  const shopData = shopJson.data.shop;

  const opts = (config as any)?.options ?? {};
  const questions: Question[] = migrateOptions(opts, (config?.layers as any[]) ?? []) || [];
  const pricing: PricingData = opts.pricing ?? { basePrice: 0, displayTaxes: false, extraPrices: [], equations: [] };

  return {
    product: productJson.data.product,
    shop: { name: shopData.name, domain: shopData.myshopifyDomain, currencyCode: shopData.currencyCode ?? "USD" },
    questions,
    pricing,
    productId: decodedId,
  };
}

// ─── Action ───────────────────────────────────────────────────────────────────

export async function action({ request, params }: any) {
  await authenticate.admin(request);
  const decodedId = decodeURIComponent(params.productId);
  const formData = await request.formData();
  const pricing: PricingData = JSON.parse(formData.get("pricing") as string);

  const config = await prisma.productConfig.findUnique({ where: { productId: decodedId } });
  if (!config) return { error: "Config not found" };

  const existingOpts = (config.options as any) ?? {};
  await prisma.productConfig.update({
    where: { productId: decodedId },
    data: { options: { ...existingOpts, pricing } },
  });

  return { success: true };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCurrencySymbol(code: string): string {
  try {
    return (
      new Intl.NumberFormat("en", {
        style: "currency",
        currency: code,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
        .formatToParts(0)
        .find((p) => p.type === "currency")?.value ?? code
    );
  } catch {
    return code;
  }
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── TopBar ───────────────────────────────────────────────────────────────────

function TopBar({ productName, productId }: { productName: string; productId: string }) {
  const enc = encodeURIComponent(productId);
  const tabs = [
    { id: "build", label: "Build", href: `/app/configurator-setup/${enc}`, active: false, dot: false },
    { id: "pricing", label: "Pricing", href: `/app/pricing/${enc}`, active: true, dot: false },
    { id: "variants", label: "Variants", href: `/app/variants/${enc}`, active: false, dot: true },
    { id: "connect", label: "Connect", href: `/app/pricing/${enc}`, active: false, dot: false },
  ];

  return (
    <div
      style={{
        height: 48, borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center",
        background: "#fff", padding: "0 20px", flexShrink: 0, gap: 0,
      }}
    >
      {/* Product brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 32 }}>
        <div
          style={{
            width: 28, height: 28, background: "#111827", borderRadius: 6,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >
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

      {/* Tab navigation */}
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
            {tab.dot && (
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── InlineDropdown ───────────────────────────────────────────────────────────

function InlineDropdown({
  placeholder,
  value,
  options,
  onChange,
  disabled,
}: {
  placeholder: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} style={{ position: "relative", flex: 1 }}>
      <button
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "7px 10px", border: `1px solid ${open ? "#005bd3" : "#e5e7eb"}`, borderRadius: 6,
          background: disabled ? "#f9fafb" : "#fff",
          cursor: disabled ? "default" : "pointer", fontSize: 13,
          color: value ? "#111827" : "#9ca3af", outline: "none",
        }}
      >
        <span>{selected?.label ?? placeholder}</span>
        <svg width="10" height="10" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0, zIndex: 200,
            background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8,
            boxShadow: "0 6px 20px rgba(0,0,0,0.12)", maxHeight: 220, overflowY: "auto",
          }}
        >
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              style={{
                display: "block", width: "100%", padding: "9px 12px", border: "none",
                background: o.value === value ? "#eff6ff" : "none",
                cursor: "pointer", fontSize: 13, textAlign: "left",
                color: o.value === value ? "#005bd3" : "#111827",
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AddExtraPriceForm ────────────────────────────────────────────────────────

function AddExtraPriceForm({
  questions,
  currencySymbol,
  onAdd,
  onClose,
}: {
  questions: Question[];
  currencySymbol: string;
  onAdd: (entry: Omit<ExtraPrice, "id">, keepOpen: boolean) => void;
  onClose: () => void;
}) {
  const [questionId, setQuestionId] = useState("");
  const [answerId, setAnswerId] = useState("");
  const [price, setPrice] = useState<number>(0);
  const ref = useRef<HTMLDivElement>(null);

  const questionOptions = questions.map((q) => ({ value: q.id, label: q.name.toUpperCase() }));
  const selQ = questions.find((q) => q.id === questionId);
  const answerOptions = selQ ? getQuestionAnswers(selQ) : [];
  const canAdd = !!(questionId && answerId);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const handleAdd = (keepOpen: boolean) => {
    if (!canAdd) return;
    onAdd({ questionId, answerId, price }, keepOpen);
    if (keepOpen) { setQuestionId(""); setAnswerId(""); setPrice(0); }
  };

  return (
    <div
      ref={ref}
      style={{
        position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 300,
        background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
        boxShadow: "0 8px 28px rgba(0,0,0,0.14)", padding: 16, width: 290,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <InlineDropdown
          placeholder="Question"
          value={questionId}
          options={questionOptions}
          onChange={(v) => { setQuestionId(v); setAnswerId(""); }}
        />
        <InlineDropdown
          placeholder="Answer"
          value={answerId}
          options={answerOptions}
          onChange={setAnswerId}
          disabled={!questionId}
        />
        <div style={{ display: "flex", alignItems: "center", border: "1px solid #e5e7eb", borderRadius: 6, overflow: "hidden" }}>
          <span style={{ padding: "8px 10px", background: "#f9fafb", borderRight: "1px solid #e5e7eb", fontSize: 13, color: "#6b7280", flexShrink: 0 }}>
            {currencySymbol}
          </span>
          <input
            type="number" min="0" step="0.01" value={price}
            onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
            style={{ flex: 1, border: "none", padding: "8px 10px", fontSize: 13, outline: "none", width: 60 }}
          />
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 4 }}>
          <button
            onClick={() => handleAdd(true)}
            disabled={!canAdd}
            style={{
              padding: "7px 14px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff",
              cursor: canAdd ? "pointer" : "default", fontSize: 13,
              color: canAdd ? "#111827" : "#9ca3af",
            }}
          >
            Add another
          </button>
          <button
            onClick={() => handleAdd(false)}
            disabled={!canAdd}
            style={{
              padding: "7px 14px", border: "none", borderRadius: 6,
              background: canAdd ? "#005bd3" : "#e5e7eb",
              color: canAdd ? "#fff" : "#9ca3af",
              cursor: canAdd ? "pointer" : "default", fontSize: 13, fontWeight: 600,
            }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DeleteConfirmModal ───────────────────────────────────────────────────────

function DeleteConfirmModal({
  count,
  onConfirm,
  onCancel,
}: {
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff", borderRadius: 12, padding: 24, width: 420,
          maxWidth: "90vw", boxShadow: "0 20px 40px rgba(0,0,0,0.16)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
            Delete extra price{count > 1 ? "s" : ""}
          </span>
          <button
            onClick={onCancel}
            style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#6b7280", lineHeight: 1 }}
          >
            ×
          </button>
        </div>
        <p style={{ margin: "0 0 22px", fontSize: 14, color: "#374151", lineHeight: 1.6 }}>
          Are you sure you want to delete {count > 1 ? `these ${count} extra prices` : "this extra price"}?
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{ padding: "8px 18px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 14 }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ padding: "8px 18px", border: "none", borderRadius: 6, background: "#ef4444", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── BulkUpdateModal ──────────────────────────────────────────────────────────

function BulkUpdateModal({
  count,
  currencySymbol,
  onUpdate,
  onCancel,
}: {
  count: number;
  currencySymbol: string;
  onUpdate: (price: number) => void;
  onCancel: () => void;
}) {
  const [price, setPrice] = useState(0);
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff", borderRadius: 12, padding: 24, width: 380,
          maxWidth: "90vw", boxShadow: "0 20px 40px rgba(0,0,0,0.16)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
            Update {count} extra price{count !== 1 ? "s" : ""}
          </span>
          <button onClick={onCancel} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#6b7280", lineHeight: 1 }}>×</button>
        </div>
        <p style={{ margin: "0 0 14px", fontSize: 13, color: "#6b7280" }}>
          Set a new price for the selected extra prices.
        </p>
        <div style={{ display: "flex", alignItems: "center", border: "1px solid #e5e7eb", borderRadius: 6, overflow: "hidden", marginBottom: 18 }}>
          <span style={{ padding: "8px 10px", background: "#f9fafb", borderRight: "1px solid #e5e7eb", fontSize: 13, color: "#6b7280", flexShrink: 0 }}>
            {currencySymbol}
          </span>
          <input
            type="number" min="0" step="0.01" value={price}
            onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
            style={{ flex: 1, border: "none", padding: "8px 10px", fontSize: 13, outline: "none" }}
            autoFocus
          />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onCancel} style={{ padding: "8px 18px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 14 }}>
            Cancel
          </button>
          <button
            onClick={() => onUpdate(price)}
            style={{ padding: "8px 18px", border: "none", borderRadius: 6, background: "#005bd3", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 }}
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CreateEquationModal ──────────────────────────────────────────────────────

function CreateEquationModal({
  questions,
  currencySymbol,
  onSave,
  onCancel,
  initial,
}: {
  questions: Question[];
  currencySymbol: string;
  onSave: (eq: Equation) => void;
  onCancel: () => void;
  initial?: Equation;
}) {
  const [displayCumulative, setDisplayCumulative] = useState(initial?.displayCumulative ?? true);
  const [lines, setLines] = useState<EquationLine[]>(
    initial?.lines ?? [
      { id: uid(), type: "question" },
      { id: uid(), type: "question" },
    ],
  );
  const [operators, setOperators] = useState<Operator[]>(initial?.operators ?? ["+"]);
  const [minResult, setMinResult] = useState<number>(initial?.minResult ?? 0);
  const [maxResult, setMaxResult] = useState<string>(
    initial?.maxResult != null ? String(initial.maxResult) : "",
  );
  const [openOpIdx, setOpenOpIdx] = useState<number | null>(null);

  const questionOptions = questions.map((q) => ({ value: q.id, label: q.name.toUpperCase() }));

  const addLine = () => {
    setLines((prev) => [...prev, { id: uid(), type: "question" }]);
    setOperators((prev) => [...prev, "+"]);
  };

  const removeLine = (idx: number) => {
    if (lines.length <= 2) return;
    setLines((prev) => prev.filter((_, i) => i !== idx));
    setOperators((prev) => {
      const opIdx = Math.min(idx, prev.length - 1);
      return prev.filter((_, i) => i !== opIdx);
    });
  };

  const updateLine = (idx: number, patch: Partial<EquationLine>) =>
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  const lineName = (line: EquationLine, idx: number) => {
    if (line.type === "number") return String(line.numberValue ?? 0);
    const q = questions.find((q) => q.id === line.questionId);
    return q ? q.name : `Question ${idx + 1}`;
  };

  const equationPreview = lines
    .map((l, i) => (i === 0 ? lineName(l, i) : ` ${operators[i - 1] ?? "+"} ${lineName(l, i)}`))
    .join("");

  const isValid = lines.every((l) => l.type === "number" || !!l.questionId);

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        style={{
          background: "#fff", borderRadius: 12, padding: 24, width: 520,
          maxWidth: "92vw", maxHeight: "90vh", overflowY: "auto",
          boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
            {initial ? "Edit equation" : "Create equation"}
          </div>
          <div style={{ fontSize: 13, color: "#6b7280" }}>
            Select question(s) or number(s) to add to the equation.
          </div>
        </div>

        {/* Display cumulative toggle */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 0", marginBottom: 16, borderBottom: "1px solid #f3f4f6",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>Display cumulative price</span>
            <span
              title="Shows the running total price as the customer makes selections"
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 16, height: 16, borderRadius: "50%", background: "#e5e7eb",
                fontSize: 10, color: "#6b7280", cursor: "help", fontStyle: "italic", fontWeight: 700,
              }}
            >
              i
            </span>
          </div>
          <button
            onClick={() => setDisplayCumulative((v) => !v)}
            style={{
              position: "relative", width: 40, height: 22, borderRadius: 11,
              border: "none", cursor: "pointer", flexShrink: 0,
              background: displayCumulative ? "#f59e0b" : "#d1d5db", padding: 0,
            }}
          >
            <span
              style={{
                position: "absolute", top: 2,
                left: displayCumulative ? 20 : 2,
                width: 18, height: 18, borderRadius: "50%", background: "#fff",
                transition: "left 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }}
            />
          </button>
        </div>

        {/* Lines */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {lines.map((line, idx) => (
            <div key={line.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {/* Type icon: document */}
              <div
                style={{
                  width: 28, height: 28, border: "1px solid #e5e7eb", borderRadius: 6,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  background: "#f9fafb",
                }}
              >
                <svg width="13" height="13" fill="none" stroke="#6b7280" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="4" y="3" width="16" height="18" rx="2" />
                  <path d="M8 8h8M8 12h8M8 16h5" />
                </svg>
              </div>

              {/* Toggle question/number */}
              <button
                onClick={() => updateLine(idx, { type: line.type === "number" ? "question" : "number", questionId: undefined, numberValue: 0 })}
                title={line.type === "number" ? "Switch to question" : "Switch to number"}
                style={{
                  width: 28, height: 28, border: "1px solid #e5e7eb", borderRadius: 6,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  background: line.type === "number" ? "#eff6ff" : "#f9fafb",
                  cursor: "pointer", fontSize: 9, fontWeight: 700, color: line.type === "number" ? "#005bd3" : "#6b7280",
                }}
              >
                1/2/3
              </button>

              {/* Selector */}
              {line.type === "question" ? (
                <InlineDropdown
                  placeholder="Question"
                  value={line.questionId ?? ""}
                  options={questionOptions}
                  onChange={(v) => updateLine(idx, { questionId: v })}
                />
              ) : (
                <div style={{ flex: 1, display: "flex", alignItems: "center", border: "1px solid #e5e7eb", borderRadius: 6, overflow: "hidden" }}>
                  <span style={{ padding: "7px 8px", background: "#f9fafb", borderRight: "1px solid #e5e7eb", fontSize: 12, color: "#6b7280" }}>
                    {currencySymbol}
                  </span>
                  <input
                    type="number" min="0" value={line.numberValue ?? 0}
                    onChange={(e) => updateLine(idx, { numberValue: parseFloat(e.target.value) || 0 })}
                    style={{ flex: 1, border: "none", padding: "7px 8px", fontSize: 13, outline: "none" }}
                  />
                </div>
              )}

              {/* Operator (between lines, not on last) */}
              {idx < lines.length - 1 && (
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <button
                    onClick={() => setOpenOpIdx((v) => (v === idx ? null : idx))}
                    style={{
                      display: "flex", alignItems: "center", gap: 4, padding: "5px 10px",
                      border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff",
                      cursor: "pointer", fontSize: 15, fontWeight: 700, color: "#374151",
                    }}
                  >
                    {operators[idx] ?? "+"}
                    <svg width="10" height="10" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {openOpIdx === idx && (
                    <div
                      style={{
                        position: "absolute", top: "calc(100% + 2px)", left: 0, zIndex: 400,
                        background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8,
                        boxShadow: "0 4px 14px rgba(0,0,0,0.12)", overflow: "hidden",
                      }}
                    >
                      {(["+", "-", "×", "÷"] as Operator[]).map((op) => (
                        <button
                          key={op}
                          onClick={() => { setOperators((prev) => prev.map((o, i) => (i === idx ? op : o))); setOpenOpIdx(null); }}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "center",
                            width: 44, height: 38, border: "none", cursor: "pointer", fontSize: 18, fontWeight: 700,
                            background: operators[idx] === op ? "#005bd3" : "#fff",
                            color: operators[idx] === op ? "#fff" : "#111827",
                          }}
                        >
                          {op}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Three-dot / remove */}
              <button
                onClick={() => removeLine(idx)}
                disabled={lines.length <= 2}
                title="Remove line"
                style={{
                  width: 28, height: 28, border: "1px solid #e5e7eb", borderRadius: 6, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center", background: "#fff",
                  cursor: lines.length > 2 ? "pointer" : "default", fontSize: 16, fontWeight: 700,
                  color: lines.length > 2 ? "#6b7280" : "#d1d5db",
                }}
              >
                ⋮
              </button>
            </div>
          ))}
        </div>

        {/* Add line */}
        <button
          onClick={addLine}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
            border: "1px dashed #d1d5db", borderRadius: 6, background: "#fafafa",
            cursor: "pointer", fontSize: 13, color: "#374151", marginBottom: 18, width: "fit-content",
          }}
        >
          + Add line
        </button>

        {/* Result */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
            Result (=)
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", border: "1px solid #e5e7eb", borderRadius: 6, overflow: "hidden", flex: 1 }}>
              <span style={{ padding: "7px 9px", background: "#f9fafb", borderRight: "1px solid #e5e7eb", fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>
                Min {currencySymbol}
              </span>
              <input
                type="number" min="0" value={minResult}
                onChange={(e) => setMinResult(parseFloat(e.target.value) || 0)}
                style={{ flex: 1, border: "none", padding: "7px 8px", fontSize: 13, outline: "none", width: 50 }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", border: "1px solid #e5e7eb", borderRadius: 6, overflow: "hidden", flex: 1 }}>
              <span style={{ padding: "7px 9px", background: "#f9fafb", borderRight: "1px solid #e5e7eb", fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>
                Max {currencySymbol}
              </span>
              <input
                type="number" min="0" value={maxResult}
                onChange={(e) => setMaxResult(e.target.value)}
                placeholder="∞"
                style={{ flex: 1, border: "none", padding: "7px 8px", fontSize: 13, outline: "none", width: 50 }}
              />
            </div>
          </div>
        </div>

        {/* Equation preview */}
        <div
          style={{
            background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8,
            padding: "10px 14px", marginBottom: 22,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
            Your equation
          </div>
          <div style={{ fontSize: 13, color: "#374151" }}>
            ({equationPreview}) = Extra price ({currencySymbol})
          </div>
        </div>

        {/* Footer buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{ padding: "9px 20px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 14 }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!isValid) return;
              onSave({
                id: initial?.id ?? `eq-${uid()}`,
                displayCumulative,
                lines,
                operators,
                minResult,
                maxResult: maxResult !== "" ? parseFloat(maxResult) : null,
              });
            }}
            disabled={!isValid}
            style={{
              padding: "9px 20px", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 600,
              background: isValid ? "#005bd3" : "#e5e7eb",
              color: isValid ? "#fff" : "#9ca3af",
              cursor: isValid ? "pointer" : "default",
            }}
          >
            {initial ? "Update" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── FilterChip ───────────────────────────────────────────────────────────────

function FilterChip({
  label,
  options,
  value,
  onChange,
  onClear,
  disabled,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string | null;
  onChange: (v: string) => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 4, padding: "4px 10px",
          border: "1px solid #e5e7eb", borderRadius: 16,
          background: value ? "#eff6ff" : "#fff",
          cursor: disabled ? "default" : "pointer", fontSize: 12,
          color: value ? "#005bd3" : disabled ? "#9ca3af" : "#374151",
        }}
      >
        {value ? (
          <>
            {selected?.label ?? value}
            <span
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              style={{ marginLeft: 2, fontWeight: 700, cursor: "pointer", fontSize: 13, lineHeight: 1 }}
            >
              ×
            </span>
          </>
        ) : (
          <>⊕ {label}</>
        )}
      </button>
      {open && options.length > 0 && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 200,
            background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8,
            boxShadow: "0 4px 14px rgba(0,0,0,0.1)", minWidth: 180, maxHeight: 210, overflowY: "auto",
          }}
        >
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              style={{
                display: "block", width: "100%", padding: "8px 12px", border: "none",
                background: o.value === value ? "#eff6ff" : "none",
                cursor: "pointer", fontSize: 12, textAlign: "left",
                color: o.value === value ? "#005bd3" : "#111827",
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const { product, shop, questions, pricing: initPricing, productId } = useLoaderData() as {
    product: any;
    shop: { name: string; domain: string; currencyCode: string };
    questions: Question[];
    pricing: PricingData;
    productId: string;
  };
  const actionData = useActionData() as any;
  const submit = useSubmit();

  const [pricing, setPricing] = useState<PricingData>(initPricing);
  const [activeTab, setActiveTab] = useState<"extra-prices" | "equations">("extra-prices");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterQuestion, setFilterQuestion] = useState<string | null>(null);
  const [filterAnswer, setFilterAnswer] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteTargetIds, setDeleteTargetIds] = useState<string[] | null>(null);
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [showEquationModal, setShowEquationModal] = useState(false);
  const [editingEquation, setEditingEquation] = useState<Equation | null>(null);
  const bulkMenuRef = useRef<HTMLDivElement>(null);

  const currencyCode = shop.currencyCode;
  const currencySymbol = getCurrencySymbol(currencyCode);

  const answerable = questions.filter((q) => getQuestionAnswers(q).length > 0);

  const questionOptions = answerable.map((q) => ({ value: q.id, label: q.name.toUpperCase() }));
  const filterQObj = answerable.find((q) => q.id === filterQuestion) ?? null;
  const filterAnswerOptions = filterQObj ? getQuestionAnswers(filterQObj) : [];

  const filteredPrices = pricing.extraPrices.filter((ep) => {
    if (filterQuestion && ep.questionId !== filterQuestion) return false;
    if (filterAnswer && ep.answerId !== filterAnswer) return false;
    return true;
  });

  const getQName = useCallback(
    (qId: string) => answerable.find((q) => q.id === qId)?.name?.toUpperCase() ?? qId,
    [answerable],
  );
  const getAName = useCallback(
    (qId: string, aId: string) => {
      const q = answerable.find((q) => q.id === qId);
      if (!q) return aId;
      return getQuestionAnswers(q).find((a) => a.value === aId)?.label ?? aId;
    },
    [answerable],
  );

  const isAllSelected = filteredPrices.length > 0 && filteredPrices.every((ep) => selectedIds.has(ep.id));

  // Close bulk menu on outside click
  useEffect(() => {
    if (!showBulkMenu) return;
    const handler = (e: MouseEvent) => {
      if (bulkMenuRef.current && !bulkMenuRef.current.contains(e.target as Node)) setShowBulkMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showBulkMenu]);

  const handleAddPrice = (entry: Omit<ExtraPrice, "id">, keepOpen: boolean) => {
    const newEntry: ExtraPrice = { ...entry, id: `ep-${uid()}` };
    setPricing((p) => ({ ...p, extraPrices: [...p.extraPrices, newEntry] }));
    if (!keepOpen) setShowAddForm(false);
  };

  const handleDeleteConfirmed = () => {
    if (!deleteTargetIds) return;
    const ids = new Set(deleteTargetIds);
    setPricing((p) => ({ ...p, extraPrices: p.extraPrices.filter((ep) => !ids.has(ep.id)) }));
    setSelectedIds((prev) => { const next = new Set(prev); deleteTargetIds.forEach((id) => next.delete(id)); return next; });
    setDeleteTargetIds(null);
  };

  const handleBulkUpdate = (price: number) => {
    setPricing((p) => ({
      ...p,
      extraPrices: p.extraPrices.map((ep) => (selectedIds.has(ep.id) ? { ...ep, price } : ep)),
    }));
    setSelectedIds(new Set());
    setShowBulkUpdate(false);
  };

  const handleSaveEquation = (eq: Equation) => {
    setPricing((p) => {
      const idx = p.equations.findIndex((e) => e.id === eq.id);
      if (idx >= 0) {
        const next = [...p.equations];
        next[idx] = eq;
        return { ...p, equations: next };
      }
      return { ...p, equations: [...p.equations, eq] };
    });
    setShowEquationModal(false);
    setEditingEquation(null);
  };

  const handleDeleteEquation = (id: string) =>
    setPricing((p) => ({ ...p, equations: p.equations.filter((e) => e.id !== id) }));

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });

  const toggleSelectAll = () =>
    setSelectedIds(isAllSelected ? new Set() : new Set(filteredPrices.map((ep) => ep.id)));

  const handleSave = () => {
    const fd = new FormData();
    fd.append("pricing", JSON.stringify(pricing));
    submit(fd, { method: "post" });
  };

  const handleDiscard = () => {
    setPricing(initPricing);
    setSelectedIds(new Set());
    setFilterQuestion(null);
    setFilterAnswer(null);
  };

  const handleAddButtonClick = () => {
    if (activeTab === "extra-prices") {
      setShowAddForm((v) => !v);
    } else {
      setEditingEquation(null);
      setShowEquationModal(true);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, display: "flex", flexDirection: "column",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontSize: 14, color: "#111827", background: "#f6f6f7",
      }}
    >
      <TopBar productName={product.title} productId={productId} />

      {/* ── Content ── */}
      <div style={{ flex: 1, overflow: "auto", padding: "20px 24px" }}>
        <h1 style={{ margin: "0 0 18px", fontSize: 20, fontWeight: 700, color: "#111827" }}>Pricing</h1>

        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>

          {/* Left sidebar — Online stores */}
          <div style={{ width: 224, flexShrink: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 10, textTransform: "none", letterSpacing: 0 }}>
              Online stores
            </div>
            <div
              style={{
                border: "2px solid #005bd3", borderRadius: 10, padding: "10px 12px",
                background: "#fff", cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 32, height: 32, borderRadius: 6, background: "#008060",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 01-8 0" />
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#005bd3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {shop.name}
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>
                    {shop.domain}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 10, fontWeight: 600, color: "#6b7280", background: "#f3f4f6",
                    padding: "2px 6px", borderRadius: 4, flexShrink: 0,
                  }}
                >
                  {currencyCode}
                </span>
              </div>
            </div>
          </div>

          {/* Center content */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>

            {/* Base price / taxes / currency card */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 120px", borderBottom: "none" }}>
                {/* Base price */}
                <div style={{ padding: "14px 16px", borderRight: "1px solid #e5e7eb" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 10 }}>Base price</div>
                  <div style={{ display: "flex", alignItems: "center", border: "1px solid #e5e7eb", borderRadius: 6, overflow: "hidden", maxWidth: 110 }}>
                    <span style={{ padding: "7px 9px", background: "#f9fafb", borderRight: "1px solid #e5e7eb", fontSize: 13, color: "#6b7280", flexShrink: 0 }}>
                      {currencySymbol}
                    </span>
                    <input
                      type="number" min="0" step="0.01" value={pricing.basePrice}
                      onChange={(e) => setPricing((p) => ({ ...p, basePrice: parseFloat(e.target.value) || 0 }))}
                      style={{ flex: 1, border: "none", padding: "7px 8px", fontSize: 13, outline: "none", width: 50 }}
                    />
                  </div>
                </div>

                {/* Display taxes */}
                <div style={{ padding: "14px 16px", borderRight: "1px solid #e5e7eb" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 10 }}>Display taxes</div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <button
                      onClick={() => setPricing((p) => ({ ...p, displayTaxes: !p.displayTaxes }))}
                      style={{
                        position: "relative", width: 38, height: 22, borderRadius: 11, border: "none",
                        cursor: "pointer", flexShrink: 0, marginTop: 1, padding: 0,
                        background: pricing.displayTaxes ? "#005bd3" : "#d1d5db",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute", top: 2,
                          left: pricing.displayTaxes ? 18 : 2,
                          width: 18, height: 18, borderRadius: "50%", background: "#fff",
                          transition: "left 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        }}
                      />
                    </button>
                    <span style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>
                      Enable this to include taxes with the customization price.
                    </span>
                  </div>
                </div>

                {/* Currency */}
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 10 }}>Currency</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>{currencyCode}</div>
                </div>
              </div>
            </div>

            {/* Additional pricing card */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "visible" }}>
              {/* Card header */}
              <div style={{ padding: "14px 16px", borderBottom: "1px solid #e5e7eb" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Additional pricing</div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 3 }}>
                  Non-published questions and answers won't be available.
                </div>
              </div>

              {/* Tabs + Add button */}
              <div
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "0 16px", borderBottom: "1px solid #e5e7eb",
                }}
              >
                <div style={{ display: "flex", alignItems: "stretch", height: 44 }}>
                  {(["extra-prices", "equations"] as const).map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                      <button
                        key={tab}
                        onClick={() => { setActiveTab(tab); setShowAddForm(false); }}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          padding: "0 4px", marginRight: 18, fontSize: 13, fontWeight: 500,
                          border: "none", background: "none", cursor: "pointer",
                          color: isActive ? "#005bd3" : "#6b7280",
                          borderBottom: isActive ? "2px solid #005bd3" : "2px solid transparent",
                          boxSizing: "border-box",
                        }}
                      >
                        {tab === "extra-prices" ? "Extra prices" : "Equations"}
                        {tab === "extra-prices" && (
                          <span
                            style={{
                              fontSize: 11, fontWeight: 600, padding: "1px 6px", borderRadius: 10,
                              background: isActive ? "#e8f0fe" : "#f3f4f6",
                              color: isActive ? "#005bd3" : "#6b7280",
                            }}
                          >
                            {pricing.extraPrices.length}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Add button */}
                <div style={{ position: "relative" }}>
                  <button
                    onClick={handleAddButtonClick}
                    style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
                      border: "1px solid #e5e7eb", borderRadius: 6, background: showAddForm ? "#f9fafb" : "#fff",
                      cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#374151",
                    }}
                  >
                    + {activeTab === "extra-prices" ? "Add extra price" : "Add equation"}
                  </button>
                  {showAddForm && activeTab === "extra-prices" && (
                    <AddExtraPriceForm
                      questions={answerable}
                      currencySymbol={currencySymbol}
                      onAdd={handleAddPrice}
                      onClose={() => setShowAddForm(false)}
                    />
                  )}
                </div>
              </div>

              {/* ── Extra prices tab ── */}
              {activeTab === "extra-prices" && (
                <>
                  {/* Filter row */}
                  <div
                    style={{
                      padding: "8px 16px", borderBottom: "1px solid #e5e7eb",
                      display: "flex", alignItems: "center", gap: 8,
                    }}
                  >
                    <FilterChip
                      label="Question"
                      options={questionOptions}
                      value={filterQuestion}
                      onChange={(v) => { setFilterQuestion(v); setFilterAnswer(null); }}
                      onClear={() => { setFilterQuestion(null); setFilterAnswer(null); }}
                    />
                    <FilterChip
                      label="Answer"
                      options={filterAnswerOptions}
                      value={filterAnswer}
                      onChange={setFilterAnswer}
                      onClear={() => setFilterAnswer(null)}
                      disabled={!filterQuestion}
                    />
                    {(filterQuestion || filterAnswer) && (
                      <button
                        onClick={() => { setFilterQuestion(null); setFilterAnswer(null); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 4, padding: "4px 8px",
                          border: "none", background: "none", cursor: "pointer", fontSize: 12,
                          color: "#6b7280", marginLeft: "auto",
                        }}
                      >
                        × Clear filters
                      </button>
                    )}
                  </div>

                  {filteredPrices.length === 0 ? (
                    <div style={{ padding: "40px 16px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                      No extra prices found.{" "}
                      <button
                        onClick={() => setShowAddForm(true)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#005bd3", fontSize: 13, padding: 0 }}
                      >
                        Add one
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Select-all / bulk row */}
                      <div
                        style={{
                          padding: "8px 16px", display: "flex", alignItems: "center", gap: 10,
                          borderBottom: "1px solid #f3f4f6", background: "#fafafa",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={toggleSelectAll}
                          style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#005bd3" }}
                        />
                        {selectedIds.size > 0 ? (
                          <>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                              {selectedIds.size} selected
                            </span>
                            <div ref={bulkMenuRef} style={{ position: "relative" }}>
                              <button
                                onClick={() => setShowBulkMenu((v) => !v)}
                                style={{
                                  display: "flex", alignItems: "center", gap: 5, padding: "4px 10px",
                                  border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff",
                                  cursor: "pointer", fontSize: 12, fontWeight: 500,
                                }}
                              >
                                ⋮ Bulk action
                              </button>
                              {showBulkMenu && (
                                <div
                                  style={{
                                    position: "absolute", top: "calc(100% + 2px)", left: 0, zIndex: 200,
                                    background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8,
                                    boxShadow: "0 4px 14px rgba(0,0,0,0.1)", minWidth: 190, overflow: "hidden",
                                  }}
                                >
                                  <button
                                    onClick={() => { setShowBulkMenu(false); setShowBulkUpdate(true); }}
                                    style={{
                                      display: "block", width: "100%", padding: "10px 14px", border: "none",
                                      background: "none", cursor: "pointer", fontSize: 13, textAlign: "left", color: "#111827",
                                    }}
                                  >
                                    Update extra prices
                                  </button>
                                  <button
                                    onClick={() => { setShowBulkMenu(false); setDeleteTargetIds(Array.from(selectedIds)); }}
                                    style={{
                                      display: "block", width: "100%", padding: "10px 14px", border: "none",
                                      background: "none", cursor: "pointer", fontSize: 13, textAlign: "left", color: "#ef4444",
                                    }}
                                  >
                                    Delete extra prices
                                  </button>
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <span style={{ fontSize: 12, color: "#9ca3af" }}>Select All</span>
                        )}
                      </div>

                      {/* Rows */}
                      {filteredPrices.map((ep) => (
                        <div
                          key={ep.id}
                          style={{
                            display: "flex", alignItems: "center", padding: "10px 16px",
                            borderBottom: "1px solid #f3f4f6",
                            background: selectedIds.has(ep.id) ? "#fafbff" : "#fff",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.has(ep.id)}
                            onChange={() => toggleSelect(ep.id)}
                            style={{ width: 15, height: 15, cursor: "pointer", marginRight: 14, flexShrink: 0, accentColor: "#005bd3" }}
                          />
                          <span style={{ flex: "0 0 160px", fontSize: 13, fontWeight: 500, color: "#374151" }}>
                            {getQName(ep.questionId)}
                          </span>
                          <span style={{ flex: 1, fontSize: 13, color: "#374151", minWidth: 0 }}>
                            {getAName(ep.questionId, ep.answerId)}
                          </span>
                          <span style={{ fontSize: 13, color: "#374151", marginRight: 14, minWidth: 90, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                            {currencySymbol}&nbsp;&nbsp;{ep.price}
                          </span>
                          <button
                            onClick={() => setDeleteTargetIds([ep.id])}
                            style={{
                              background: "none", border: "1px solid transparent", borderRadius: 4,
                              cursor: "pointer", padding: "3px 5px", color: "#9ca3af", display: "flex", alignItems: "center",
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#fca5a5"; (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#9ca3af"; }}
                          >
                            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}

              {/* ── Equations tab ── */}
              {activeTab === "equations" && (
                <>
                  {/* Filter row */}
                  <div style={{ padding: "8px 16px", borderBottom: "1px solid #e5e7eb", display: "flex", gap: 8 }}>
                    <button style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", border: "1px solid #e5e7eb", borderRadius: 16, background: "#fff", cursor: "pointer", fontSize: 12, color: "#374151" }}>
                      ⊕ Question
                    </button>
                    <button style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", border: "1px solid #e5e7eb", borderRadius: 16, background: "#fff", cursor: "pointer", fontSize: 12, color: "#374151" }}>
                      ⊕ Answer
                    </button>
                  </div>

                  {pricing.equations.length === 0 ? (
                    <div style={{ padding: "52px 16px", textAlign: "center" }}>
                      <div
                        style={{
                          width: 52, height: 52, background: "#f3f4f6", borderRadius: 14,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          margin: "0 auto 14px", fontSize: 20, fontStyle: "italic", fontWeight: 700, color: "#6b7280",
                        }}
                      >
                        f(x)
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                        No equation created
                      </div>
                      <div style={{ fontSize: 13, color: "#9ca3af", maxWidth: 320, margin: "0 auto", lineHeight: 1.6 }}>
                        Create your first equation to add extra price based on mathematical operations.
                      </div>
                    </div>
                  ) : (
                    <div>
                      {pricing.equations.map((eq) => {
                        const preview = eq.lines
                          .map((l, i) => {
                            const name = l.type === "number"
                              ? String(l.numberValue ?? 0)
                              : (answerable.find((q) => q.id === l.questionId)?.name ?? `Q${i + 1}`);
                            return i === 0 ? name : ` ${eq.operators[i - 1] ?? "+"} ${name}`;
                          })
                          .join("");

                        return (
                          <div
                            key={eq.id}
                            style={{
                              display: "flex", alignItems: "center", padding: "12px 16px",
                              borderBottom: "1px solid #f3f4f6", gap: 12,
                            }}
                          >
                            <div
                              style={{
                                width: 32, height: 32, background: "#f3f4f6", borderRadius: 8,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 12, fontStyle: "italic", fontWeight: 700, color: "#6b7280", flexShrink: 0,
                              }}
                            >
                              f(x)
                            </div>
                            <span style={{ flex: 1, fontSize: 13, color: "#374151", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              ({preview}) = Extra price ({currencySymbol})
                            </span>
                            <button
                              onClick={() => { setEditingEquation(eq); setShowEquationModal(true); }}
                              style={{ padding: "4px 12px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 12, color: "#374151", flexShrink: 0 }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteEquation(eq.id)}
                              style={{ background: "none", border: "1px solid transparent", borderRadius: 4, cursor: "pointer", padding: "3px 5px", color: "#9ca3af", display: "flex", alignItems: "center", flexShrink: 0 }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#fca5a5"; (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#9ca3af"; }}
                            >
                              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                              </svg>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right sidebar — Bulk pricing */}
          <div style={{ width: 248, flexShrink: 0 }}>
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Bulk pricing</div>
              <div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.7 }}>
                Set a different price based on the quantity your customers order. Requires a published bulk question to be available.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid #e5e7eb", background: "#fff",
          padding: "12px 24px", display: "flex", justifyContent: "center", gap: 10, flexShrink: 0,
        }}
      >
        <button
          onClick={handleDiscard}
          style={{ padding: "8px 20px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 14, color: "#374151" }}
        >
          Discard
        </button>
        <button
          onClick={handleSave}
          style={{ padding: "8px 20px", border: "none", borderRadius: 6, background: "#005bd3", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 }}
        >
          Save
        </button>
      </div>

      {/* Modals */}
      {deleteTargetIds && (
        <DeleteConfirmModal
          count={deleteTargetIds.length}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setDeleteTargetIds(null)}
        />
      )}
      {showBulkUpdate && (
        <BulkUpdateModal
          count={selectedIds.size}
          currencySymbol={currencySymbol}
          onUpdate={handleBulkUpdate}
          onCancel={() => setShowBulkUpdate(false)}
        />
      )}
      {showEquationModal && (
        <CreateEquationModal
          questions={answerable}
          currencySymbol={currencySymbol}
          onSave={handleSaveEquation}
          onCancel={() => { setShowEquationModal(false); setEditingEquation(null); }}
          initial={editingEquation ?? undefined}
        />
      )}
    </div>
  );
}
