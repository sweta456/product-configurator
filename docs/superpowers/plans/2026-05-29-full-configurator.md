# Full Kickflip-Style Configurator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the product configurator from 3 question types (color/text/file) to a full Kickflip-style builder with 10 input types, display type filtering, conditional visibility, multi-view storefront navigation, and grouped questions.

**Architecture:** Extend the `Question` union type with 5 new variants (dropdown, radio, checkbox, label, group) and alias thumbnail → color. Add an `AddQuestionModal` component for the admin builder. Update both the admin builder and customer storefront to render all types with conditional visibility.

**Tech Stack:** React 18, React Router 7, Konva (canvas), TypeScript 5, Prisma, Shopify Polaris

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `app/types/configurator.ts` | Modify | Add 5 new question interfaces, `conditions` field, `DISPLAY_TYPE_MAP` |
| `app/components/AddQuestionModal.tsx` | Create | Two-step input/display type selection modal |
| `app/routes/app.configurator-setup.$productId.tsx` | Modify | Wire modal, add 5 new editors, add ConditionsEditor |
| `app/routes/configurator.$productId.tsx` | Modify | Per-type renderers, conditional visibility, multi-view dots |

---

## Task 1: Extend the Question type system

**Files:**
- Modify: `app/types/configurator.ts`

- [ ] **Step 1: Add conditions type + new question interfaces**

Replace the contents of `app/types/configurator.ts` with:

```typescript
export interface LayerConfig {
  id: string;
  name: string;
  type: "static" | "colorable";
  src: string;
  extraViews?: string[];
  defaultColor?: string;
}

/** Returns the image URL for a given view index (0-based). Falls back to src. */
export function getLayerSrc(layer: LayerConfig, viewIndex: number): string {
  if (viewIndex === 0 || !layer.extraViews) return layer.src;
  return layer.extraViews[viewIndex - 1] || layer.src;
}

export interface ColorSwatch {
  value: string;
  label: string;
  imageUrl?: string;
}

export type Condition = { questionId: string; value: string };

export interface ColorQuestion {
  id: string;
  name: string;
  type: "color";
  linkedLayerId: string;
  swatches: ColorSwatch[];
  conditions?: Condition[];
}

export interface ThumbnailQuestion {
  id: string;
  name: string;
  type: "thumbnail";
  linkedLayerId?: string;
  swatches: ColorSwatch[];
  conditions?: Condition[];
}

export interface TextQuestion {
  id: string;
  name: string;
  type: "text";
  defaultText: string;
  defaultColor: string;
  defaultFontSize: number;
  defaultFontFamily: string;
  position: { x: number; y: number };
  conditions?: Condition[];
}

export interface FileQuestion {
  id: string;
  name: string;
  type: "file";
  position: { x: number; y: number };
  defaultWidth: number;
  defaultHeight: number;
  conditions?: Condition[];
}

export interface DropdownQuestion {
  id: string;
  name: string;
  type: "dropdown";
  options: { value: string; label: string }[];
  defaultValue?: string;
  conditions?: Condition[];
}

export interface RadioQuestion {
  id: string;
  name: string;
  type: "radio";
  options: { value: string; label: string }[];
  defaultValue?: string;
  conditions?: Condition[];
}

export interface CheckboxQuestion {
  id: string;
  name: string;
  type: "checkbox";
  checkedLabel: string;
  uncheckedLabel: string;
  defaultChecked: boolean;
  conditions?: Condition[];
}

export interface LabelQuestion {
  id: string;
  name: string;
  type: "label";
  content: string;
  conditions?: Condition[];
}

export interface GroupQuestion {
  id: string;
  name: string;
  type: "group";
  childIds: string[];
  conditions?: Condition[];
}

export type Question =
  | ColorQuestion
  | ThumbnailQuestion
  | TextQuestion
  | FileQuestion
  | DropdownQuestion
  | RadioQuestion
  | CheckboxQuestion
  | LabelQuestion
  | GroupQuestion;

export type InputType = Question["type"];

export const DISPLAY_TYPE_MAP: Record<InputType, string[]> = {
  thumbnail: ["color", "image"],
  color: ["color"],
  text: ["text", "font", "font-size", "text-color", "text-outline"],
  file: ["logo", "image"],
  dropdown: ["none"],
  radio: ["none"],
  checkbox: ["none"],
  label: ["none"],
  group: ["none"],
};

export const INPUT_TYPE_LABELS: Record<InputType, string> = {
  thumbnail: "Thumbnail",
  dropdown: "Dropdown",
  radio: "Radio button",
  label: "Label",
  file: "File upload",
  text: "Text input",
  checkbox: "Checkbox",
  color: "Color picker",
  group: "Group",
};

export interface ConfigOptions {
  questions: Question[];
  productImageUrl?: string;
  productHandle?: string;
  numViews?: number;
}

export const DEFAULT_LAYERS: LayerConfig[] = [
  { id: "shadow", name: "Shadow", type: "static", src: "/products/baseball-bat/shadow.png" },
  { id: "handle", name: "Handle", type: "colorable", src: "/products/baseball-bat/handle.png", defaultColor: "#8B4513" },
  { id: "barrel", name: "Barrel", type: "colorable", src: "/products/baseball-bat/barrel.png", defaultColor: "#ff0000" },
  { id: "ring", name: "Ring", type: "colorable", src: "/products/baseball-bat/ring.png", defaultColor: "#000000" },
];

export const DEFAULT_QUESTIONS: Question[] = [
  {
    id: "barrel-color",
    name: "Barrel Color",
    type: "color",
    linkedLayerId: "barrel",
    swatches: [
      { value: "#ff0000", label: "Red" },
      { value: "#000000", label: "Black" },
      { value: "#0044ff", label: "Blue" },
      { value: "#ffffff", label: "White" },
      { value: "#FFD700", label: "Gold" },
    ],
  },
  {
    id: "handle-color",
    name: "Handle Color",
    type: "color",
    linkedLayerId: "handle",
    swatches: [
      { value: "#8B4513", label: "Natural Wood" },
      { value: "#000000", label: "Black" },
      { value: "#ff0000", label: "Red" },
      { value: "#0044ff", label: "Blue" },
    ],
  },
  {
    id: "custom-text",
    name: "Custom Text",
    type: "text",
    defaultText: "Your Name",
    defaultColor: "#ffffff",
    defaultFontSize: 48,
    defaultFontFamily: "Arial",
    position: { x: 240, y: 180 },
  },
  {
    id: "upload-logo",
    name: "Upload Logo",
    type: "file",
    position: { x: 240, y: 280 },
    defaultWidth: 120,
    defaultHeight: 120,
  },
];

export function migrateOptions(options: any, layers: LayerConfig[]): Question[] {
  if (options?.questions) return options.questions;

  const questions: Question[] = [];

  if (options?.colorOptions) {
    for (const [layerId, swatches] of Object.entries(options.colorOptions)) {
      const layer = layers.find((l) => l.id === layerId);
      questions.push({
        id: `color-${layerId}`,
        name: `${layer?.name ?? layerId} Color`,
        type: "color",
        linkedLayerId: layerId,
        swatches: (swatches as any[]).map((s) => ({ value: s.value, label: s.label || s.value })),
      });
    }
  }

  if (options?.textOption?.enabled) {
    questions.push({
      id: "custom-text",
      name: options.textOption.label || "Custom Text",
      type: "text",
      defaultText: options.textOption.defaultText || "Your Name",
      defaultColor: options.textOption.defaultColor || "#ffffff",
      defaultFontSize: options.textOption.defaultFontSize || 48,
      defaultFontFamily: "Arial",
      position: options.textOption.position || { x: 240, y: 180 },
    });
  }

  if (options?.logoOption?.enabled) {
    questions.push({
      id: "upload-logo",
      name: "Upload Logo",
      type: "file",
      position: options.logoOption.position || { x: 240, y: 280 },
      defaultWidth: 120,
      defaultHeight: 120,
    });
  }

  return questions;
}
```

- [ ] **Step 2: Verify types compile**

```
npm run typecheck
```

Expected: May show errors in the two route files that import `Question` — that's expected and will be fixed in later tasks. Zero errors in `app/types/configurator.ts` itself.

- [ ] **Step 3: Commit**

```
git add app/types/configurator.ts
git commit -m "feat: extend Question union with 5 new types + conditions"
```

---

## Task 2: Create AddQuestionModal component

**Files:**
- Create: `app/components/AddQuestionModal.tsx`

- [ ] **Step 1: Create the file**

```typescript
import { useState } from "react";
import { DISPLAY_TYPE_MAP, INPUT_TYPE_LABELS, type InputType } from "../types/configurator";

const INPUT_TYPES: { type: InputType; icon: string }[] = [
  { type: "thumbnail", icon: "⊞" },
  { type: "dropdown", icon: "▾" },
  { type: "radio", icon: "◉" },
  { type: "label", icon: "≡" },
  { type: "file", icon: "↑" },
  { type: "text", icon: "T" },
  { type: "checkbox", icon: "☑" },
  { type: "color", icon: "●" },
  { type: "group", icon: "▣" },
];

const DISPLAY_TYPE_LABELS: Record<string, string> = {
  none: "None",
  color: "Color",
  image: "Image",
  logo: "Logo",
  text: "Text",
  font: "Font",
  "font-size": "Font size",
  "text-color": "Text color",
  "text-outline": "Text outline",
};

const ALL_DISPLAY_TYPES = ["none", "image", "color", "logo", "text", "font", "font-size", "text-color", "text-outline"];

interface Props {
  onClose: () => void;
  onCreate: (inputType: InputType, displayType: string) => void;
}

export default function AddQuestionModal({ onClose, onCreate }: Props) {
  const [selectedInput, setSelectedInput] = useState<InputType | null>(null);
  const [selectedDisplay, setSelectedDisplay] = useState<string | null>(null);

  const allowedDisplayTypes = selectedInput ? DISPLAY_TYPE_MAP[selectedInput] : [];
  const canCreate = selectedInput !== null && (allowedDisplayTypes.length <= 1 || selectedDisplay !== null);

  const handleCreate = () => {
    if (!selectedInput) return;
    const display = selectedDisplay ?? allowedDisplayTypes[0] ?? "none";
    onCreate(selectedInput, display);
    onClose();
  };

  const handleSelectInput = (t: InputType) => {
    setSelectedInput(t);
    const allowed = DISPLAY_TYPE_MAP[t];
    // Auto-select if only one option
    setSelectedDisplay(allowed.length === 1 ? allowed[0] : null);
  };

  const cellSt = (active: boolean, disabled = false): React.CSSProperties => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: "10px 6px",
    border: `2px solid ${active ? "#3b82f6" : "#e5e7eb"}`,
    borderRadius: 8,
    background: active ? "#eff6ff" : disabled ? "#f9fafb" : "#fff",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
    fontSize: 11,
    fontWeight: 600,
    color: active ? "#1d4ed8" : disabled ? "#9ca3af" : "#374151",
    textAlign: "center",
    minHeight: 64,
    userSelect: "none",
  });

  const iconSt: React.CSSProperties = {
    fontSize: 20,
    lineHeight: 1,
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          width: 480,
          maxWidth: "95vw",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid #f3f4f6" }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Add a question</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#9ca3af", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: "16px 18px" }}>
          {/* Step 1: Input type */}
          <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
            1. Select an input type
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 20 }}>
            {INPUT_TYPES.map(({ type, icon }) => (
              <div
                key={type}
                style={cellSt(selectedInput === type)}
                onClick={() => handleSelectInput(type)}
              >
                <span style={iconSt}>{icon}</span>
                <span>{INPUT_TYPE_LABELS[type]}</span>
              </div>
            ))}
          </div>

          {/* Step 2: Display type */}
          <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
            2. Select a display type
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {ALL_DISPLAY_TYPES.map((dt) => {
              const allowed = allowedDisplayTypes.includes(dt);
              const active = selectedDisplay === dt;
              return (
                <div
                  key={dt}
                  style={cellSt(active, !allowed)}
                  onClick={() => { if (allowed) setSelectedDisplay(dt); }}
                >
                  <span style={{ ...iconSt, fontSize: 14 }}>
                    {dt === "none" ? "⊘" : dt === "color" ? "●" : dt === "image" ? "🖼" : dt === "logo" ? "★" : dt === "text" ? "T" : dt === "font" ? "F" : dt === "font-size" ? "Tⁱ" : dt === "text-color" ? "A" : "Ā"}
                  </span>
                  <span>{DISPLAY_TYPE_LABELS[dt]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 18px", borderTop: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>
            {!selectedInput ? "Please select what you want to create" : !canCreate ? "Select a display type" : "Ready to create"}
          </span>
          <button
            onClick={handleCreate}
            disabled={!canCreate}
            style={{
              padding: "8px 20px",
              background: canCreate ? "#111827" : "#e5e7eb",
              color: canCreate ? "#fff" : "#9ca3af",
              border: "none",
              borderRadius: 7,
              cursor: canCreate ? "pointer" : "not-allowed",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

```
npm run typecheck
```

Expected: No new errors from this file.

- [ ] **Step 3: Commit**

```
git add app/components/AddQuestionModal.tsx
git commit -m "feat: add AddQuestionModal component"
```

---

## Task 3: Update admin builder — new editors + modal wiring

**Files:**
- Modify: `app/routes/app.configurator-setup.$productId.tsx`

- [ ] **Step 1: Add import for AddQuestionModal at the top of the file**

After the existing imports, add:
```typescript
import AddQuestionModal from "../components/AddQuestionModal";
import type {
  DropdownQuestion,
  RadioQuestion,
  CheckboxQuestion,
  LabelQuestion,
  GroupQuestion,
  ThumbnailQuestion,
  InputType,
} from "../types/configurator";
```

- [ ] **Step 2: Add ConditionsEditor component** (add before `ColorEditor`, around line 341)

```typescript
// ─── Shared – Conditions editor ──────────────────────────────────────────────

function ConditionsEditor({
  conditions,
  allQuestions,
  currentId,
  onChange,
}: {
  conditions: { questionId: string; value: string }[];
  allQuestions: Question[];
  currentId: string;
  onChange: (c: { questionId: string; value: string }[]) => void;
}) {
  const candidates = allQuestions.filter((q) => q.id !== currentId);

  const addCondition = () =>
    onChange([...conditions, { questionId: candidates[0]?.id ?? "", value: "" }]);

  const update = (i: number, patch: Partial<{ questionId: string; value: string }>) =>
    onChange(conditions.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  const remove = (i: number) => onChange(conditions.filter((_, idx) => idx !== i));

  const getAnswers = (qId: string): string[] => {
    const q = allQuestions.find((x) => x.id === qId);
    if (!q) return [];
    if (q.type === "color" || q.type === "thumbnail") return q.swatches.map((s) => s.value);
    if (q.type === "dropdown" || q.type === "radio") return q.options.map((o) => o.value);
    if (q.type === "checkbox") return ["true", "false"];
    return [];
  };

  return (
    <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #f3f4f6" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <label style={{ ...labelSt, marginTop: 0 }}>Show only when…</label>
        {candidates.length > 0 && (
          <button onClick={addCondition} style={smallBtnSt}>+ Add</button>
        )}
      </div>
      {conditions.length === 0 && (
        <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>Always visible</p>
      )}
      {conditions.map((c, i) => {
        const answers = getAnswers(c.questionId);
        return (
          <div key={i} style={{ display: "flex", gap: 5, marginBottom: 6, alignItems: "center" }}>
            <select
              value={c.questionId}
              onChange={(e) => update(i, { questionId: e.target.value, value: "" })}
              style={{ flex: 1, padding: "5px 7px", border: "1px solid #e5e7eb", borderRadius: 5, fontSize: 12 }}
            >
              {candidates.map((q) => (
                <option key={q.id} value={q.id}>{q.name}</option>
              ))}
            </select>
            <span style={{ fontSize: 11, color: "#9ca3af" }}>=</span>
            {answers.length > 0 ? (
              <select
                value={c.value}
                onChange={(e) => update(i, { value: e.target.value })}
                style={{ flex: 1, padding: "5px 7px", border: "1px solid #e5e7eb", borderRadius: 5, fontSize: 12 }}
              >
                <option value="">—</option>
                {answers.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            ) : (
              <input
                value={c.value}
                onChange={(e) => update(i, { value: e.target.value })}
                placeholder="value"
                style={{ flex: 1, padding: "5px 7px", border: "1px solid #e5e7eb", borderRadius: 5, fontSize: 12 }}
              />
            )}
            <button
              onClick={() => remove(i)}
              style={{ background: "none", border: "none", color: "#fca5a5", cursor: "pointer", fontSize: 14, padding: 0 }}
            >×</button>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Add ThumbnailEditor component** (add right after `ColorEditor` ends, ~line 477)

`ThumbnailQuestion` shares the same swatch UI as `ColorQuestion`. Add this component:

```typescript
// ─── Right panel – Thumbnail question editor (same swatch UI as Color) ───────

function ThumbnailEditor({
  q,
  layers,
  onChange,
  allQuestions,
  previewValue,
  onPreview,
}: {
  q: ThumbnailQuestion;
  layers: LayerConfig[];
  onChange: (updated: Question) => void;
  allQuestions: Question[];
  previewValue?: string;
  onPreview: (value: string) => void;
}) {
  const [newColor, setNewColor] = useState("#ff0000");
  const [newLabel, setNewLabel] = useState("");
  const [showPalette, setShowPalette] = useState(false);
  const fetcher = useFetcher<{ url?: string; error?: string }>();

  const addSwatch = (swatch: ColorSwatch) => {
    if (q.swatches.some((s) => s.value.toLowerCase() === swatch.value.toLowerCase())) return;
    onChange({ ...q, swatches: [...q.swatches, swatch] });
  };

  return (
    <div style={{ padding: 16 }}>
      <label style={labelSt}>Title</label>
      <input value={q.name} onChange={(e) => onChange({ ...q, name: e.target.value })} style={inputSt} />

      <label style={labelSt}>Linked Layer (optional)</label>
      <select
        value={q.linkedLayerId ?? ""}
        onChange={(e) => onChange({ ...q, linkedLayerId: e.target.value || undefined })}
        style={inputSt}
      >
        <option value="">— None —</option>
        {layers.filter((l) => l.type === "colorable").map((l) => (
          <option key={l.id} value={l.id}>{l.name}</option>
        ))}
      </select>

      <label style={labelSt}>Thumbnail Options</label>
      {q.swatches.length === 0 && (
        <p style={{ fontSize: 12, color: "#9ca3af", margin: "4px 0 8px" }}>No thumbnails yet.</p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
        {q.swatches.map((s, i) => (
          <SwatchRow
            key={i}
            swatch={s}
            isActive={previewValue === s.value}
            onSelect={() => onPreview(s.value)}
            onRemove={() => onChange({ ...q, swatches: q.swatches.filter((_, idx) => idx !== i) })}
            onImageUpload={(imageUrl) =>
              onChange({ ...q, swatches: q.swatches.map((sw, idx) => idx === i ? { ...sw, imageUrl } : sw) })
            }
          />
        ))}
      </div>

      <button
        onClick={() => setShowPalette((p) => !p)}
        style={{ width: "100%", padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#f9fafb", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#374151", textAlign: "left", marginBottom: 6 }}
      >
        {showPalette ? "▲ Hide standard palette" : "▼ Add from standard palette"}
      </button>
      {showPalette && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 5, marginBottom: 10, padding: "8px", background: "#f9fafb", borderRadius: 6, border: "1px solid #e5e7eb" }}>
          {STANDARD_PALETTE.map((s) => {
            const already = q.swatches.some((sw) => sw.value.toLowerCase() === s.value.toLowerCase());
            return (
              <button
                key={s.value}
                title={s.label}
                onClick={() => addSwatch(s)}
                disabled={already}
                style={{ width: "100%", aspectRatio: "1", borderRadius: "50%", background: s.value, border: already ? "3px solid #3b82f6" : "2px solid rgba(0,0,0,0.1)", cursor: already ? "default" : "pointer", opacity: already ? 0.5 : 1, outline: "none" }}
              />
            );
          })}
        </div>
      )}

      <label style={labelSt}>Custom Thumbnail</label>
      <div style={{ display: "flex", gap: 6 }}>
        <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} style={{ width: 36, height: 32, borderRadius: 4, border: "1px solid #e5e7eb", padding: 1, flexShrink: 0 }} />
        <input
          placeholder="Label"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newLabel.trim()) {
              addSwatch({ value: newColor, label: newLabel.trim() });
              setNewLabel("");
            }
          }}
          style={{ flex: 1, padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13 }}
        />
        <button
          onClick={() => { if (!newLabel.trim()) return; addSwatch({ value: newColor, label: newLabel.trim() }); setNewLabel(""); }}
          style={{ padding: "6px 12px", background: "#111827", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}
        >+</button>
      </div>

      <ConditionsEditor
        conditions={q.conditions ?? []}
        allQuestions={allQuestions}
        currentId={q.id}
        onChange={(c) => onChange({ ...q, conditions: c })}
      />
    </div>
  );
}
```

- [ ] **Step 4: Add DropdownEditor, RadioEditor, CheckboxEditor, LabelEditor, GroupEditor** (add after ThumbnailEditor)

```typescript
// ─── Right panel – Dropdown question editor ───────────────────────────────────

function DropdownEditor({
  q,
  allQuestions,
  onChange,
}: {
  q: DropdownQuestion;
  allQuestions: Question[];
  onChange: (updated: Question) => void;
}) {
  const [newValue, setNewValue] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const addOption = () => {
    if (!newValue.trim() || !newLabel.trim()) return;
    onChange({ ...q, options: [...q.options, { value: newValue.trim(), label: newLabel.trim() }] });
    setNewValue("");
    setNewLabel("");
  };

  return (
    <div style={{ padding: 16 }}>
      <label style={labelSt}>Title</label>
      <input value={q.name} onChange={(e) => onChange({ ...q, name: e.target.value })} style={inputSt} />

      <label style={labelSt}>Options</label>
      {q.options.length === 0 && <p style={{ fontSize: 12, color: "#9ca3af", margin: "4px 0 8px" }}>No options yet.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
        {q.options.map((opt, i) => (
          <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", padding: "5px 8px", background: "#f9fafb", borderRadius: 6, border: "1px solid #e5e7eb" }}>
            <span style={{ flex: 1, fontSize: 13 }}>{opt.label}</span>
            <span style={{ fontSize: 11, color: "#9ca3af" }}>{opt.value}</span>
            <button onClick={() => onChange({ ...q, options: q.options.filter((_, idx) => idx !== i) })} style={{ background: "none", border: "none", color: "#d1d5db", cursor: "pointer", fontSize: 14, padding: 0 }}>×</button>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 5 }}>
        <input placeholder="Value" value={newValue} onChange={(e) => setNewValue(e.target.value)} style={{ ...inputSt, padding: "6px 8px" }} />
        <input placeholder="Label" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addOption(); }} style={{ ...inputSt, padding: "6px 8px" }} />
        <button onClick={addOption} style={{ padding: "6px 12px", background: "#111827", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+</button>
      </div>

      <label style={labelSt}>Default Value</label>
      <select value={q.defaultValue ?? ""} onChange={(e) => onChange({ ...q, defaultValue: e.target.value || undefined })} style={inputSt}>
        <option value="">— None —</option>
        {q.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <ConditionsEditor conditions={q.conditions ?? []} allQuestions={allQuestions} currentId={q.id} onChange={(c) => onChange({ ...q, conditions: c })} />
    </div>
  );
}

// ─── Right panel – Radio question editor ─────────────────────────────────────

function RadioEditor({
  q,
  allQuestions,
  onChange,
}: {
  q: RadioQuestion;
  allQuestions: Question[];
  onChange: (updated: Question) => void;
}) {
  const [newValue, setNewValue] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const addOption = () => {
    if (!newValue.trim() || !newLabel.trim()) return;
    onChange({ ...q, options: [...q.options, { value: newValue.trim(), label: newLabel.trim() }] });
    setNewValue("");
    setNewLabel("");
  };

  return (
    <div style={{ padding: 16 }}>
      <label style={labelSt}>Title</label>
      <input value={q.name} onChange={(e) => onChange({ ...q, name: e.target.value })} style={inputSt} />

      <label style={labelSt}>Options</label>
      {q.options.length === 0 && <p style={{ fontSize: 12, color: "#9ca3af", margin: "4px 0 8px" }}>No options yet.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
        {q.options.map((opt, i) => (
          <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", padding: "5px 8px", background: "#f9fafb", borderRadius: 6, border: "1px solid #e5e7eb" }}>
            <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #6b7280", display: "inline-block", flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 13 }}>{opt.label}</span>
            <span style={{ fontSize: 11, color: "#9ca3af" }}>{opt.value}</span>
            <button onClick={() => onChange({ ...q, options: q.options.filter((_, idx) => idx !== i) })} style={{ background: "none", border: "none", color: "#d1d5db", cursor: "pointer", fontSize: 14, padding: 0 }}>×</button>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 5 }}>
        <input placeholder="Value" value={newValue} onChange={(e) => setNewValue(e.target.value)} style={{ ...inputSt, padding: "6px 8px" }} />
        <input placeholder="Label" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addOption(); }} style={{ ...inputSt, padding: "6px 8px" }} />
        <button onClick={addOption} style={{ padding: "6px 12px", background: "#111827", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+</button>
      </div>

      <label style={labelSt}>Default Value</label>
      <select value={q.defaultValue ?? ""} onChange={(e) => onChange({ ...q, defaultValue: e.target.value || undefined })} style={inputSt}>
        <option value="">— None —</option>
        {q.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <ConditionsEditor conditions={q.conditions ?? []} allQuestions={allQuestions} currentId={q.id} onChange={(c) => onChange({ ...q, conditions: c })} />
    </div>
  );
}

// ─── Right panel – Checkbox question editor ───────────────────────────────────

function CheckboxEditor({
  q,
  allQuestions,
  onChange,
}: {
  q: CheckboxQuestion;
  allQuestions: Question[];
  onChange: (updated: Question) => void;
}) {
  return (
    <div style={{ padding: 16 }}>
      <label style={labelSt}>Title</label>
      <input value={q.name} onChange={(e) => onChange({ ...q, name: e.target.value })} style={inputSt} />

      <label style={labelSt}>Checked Label</label>
      <input value={q.checkedLabel} onChange={(e) => onChange({ ...q, checkedLabel: e.target.value })} style={inputSt} placeholder="e.g. Yes, add engraving" />

      <label style={labelSt}>Unchecked Label</label>
      <input value={q.uncheckedLabel} onChange={(e) => onChange({ ...q, uncheckedLabel: e.target.value })} style={inputSt} placeholder="e.g. No thanks" />

      <label style={labelSt}>Default State</label>
      <select value={q.defaultChecked ? "true" : "false"} onChange={(e) => onChange({ ...q, defaultChecked: e.target.value === "true" })} style={inputSt}>
        <option value="false">Unchecked</option>
        <option value="true">Checked</option>
      </select>

      <ConditionsEditor conditions={q.conditions ?? []} allQuestions={allQuestions} currentId={q.id} onChange={(c) => onChange({ ...q, conditions: c })} />
    </div>
  );
}

// ─── Right panel – Label question editor ──────────────────────────────────────

function LabelEditor({
  q,
  allQuestions,
  onChange,
}: {
  q: LabelQuestion;
  allQuestions: Question[];
  onChange: (updated: Question) => void;
}) {
  return (
    <div style={{ padding: 16 }}>
      <label style={labelSt}>Title</label>
      <input value={q.name} onChange={(e) => onChange({ ...q, name: e.target.value })} style={inputSt} />

      <label style={labelSt}>Content</label>
      <textarea
        value={q.content}
        onChange={(e) => onChange({ ...q, content: e.target.value })}
        rows={4}
        style={{ ...inputSt, resize: "vertical", fontFamily: "inherit" }}
        placeholder="Informational text shown to the customer"
      />

      <ConditionsEditor conditions={q.conditions ?? []} allQuestions={allQuestions} currentId={q.id} onChange={(c) => onChange({ ...q, conditions: c })} />
    </div>
  );
}

// ─── Right panel – Group question editor ──────────────────────────────────────

function GroupEditor({
  q,
  allQuestions,
  onChange,
}: {
  q: GroupQuestion;
  allQuestions: Question[];
  onChange: (updated: Question) => void;
}) {
  const available = allQuestions.filter((x) => x.id !== q.id && x.type !== "group" && !q.childIds.includes(x.id));

  return (
    <div style={{ padding: 16 }}>
      <label style={labelSt}>Group Name</label>
      <input value={q.name} onChange={(e) => onChange({ ...q, name: e.target.value })} style={inputSt} />

      <label style={labelSt}>Questions in this group</label>
      {q.childIds.length === 0 && <p style={{ fontSize: 12, color: "#9ca3af", margin: "4px 0 8px" }}>No questions yet.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
        {q.childIds.map((cid) => {
          const child = allQuestions.find((x) => x.id === cid);
          return (
            <div key={cid} style={{ display: "flex", gap: 6, alignItems: "center", padding: "5px 8px", background: "#f9fafb", borderRadius: 6, border: "1px solid #e5e7eb" }}>
              <span style={{ flex: 1, fontSize: 13 }}>{child?.name ?? cid}</span>
              <button onClick={() => onChange({ ...q, childIds: q.childIds.filter((id) => id !== cid) })} style={{ background: "none", border: "none", color: "#d1d5db", cursor: "pointer", fontSize: 14, padding: 0 }}>×</button>
            </div>
          );
        })}
      </div>

      {available.length > 0 && (
        <>
          <label style={labelSt}>Add question to group</label>
          <div style={{ display: "flex", gap: 5 }}>
            <select id={`group-add-${q.id}`} style={{ flex: 1, ...inputSt }}>
              {available.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
            <button
              onClick={() => {
                const sel = (document.getElementById(`group-add-${q.id}`) as HTMLSelectElement)?.value;
                if (sel && !q.childIds.includes(sel)) onChange({ ...q, childIds: [...q.childIds, sel] });
              }}
              style={{ padding: "6px 12px", background: "#111827", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}
            >Add</button>
          </div>
        </>
      )}

      <ConditionsEditor conditions={q.conditions ?? []} allQuestions={allQuestions} currentId={q.id} onChange={(c) => onChange({ ...q, conditions: c })} />
    </div>
  );
}
```

- [ ] **Step 5: Add ConditionsEditor to ColorEditor and TextEditor and FileEditor**

In `ColorEditor`, `TextEditor`, and `FileEditor`, add an `allQuestions` prop and render `<ConditionsEditor>` at the bottom:

In `ColorEditor` — add `allQuestions: Question[]` to props and at the end of the returned JSX (before closing `</div>`):
```typescript
<ConditionsEditor
  conditions={q.conditions ?? []}
  allQuestions={allQuestions}
  currentId={q.id}
  onChange={(c) => onChange({ ...q, conditions: c })}
/>
```

In `TextEditor` — same pattern with `allQuestions` prop:
```typescript
<ConditionsEditor
  conditions={q.conditions ?? []}
  allQuestions={allQuestions}
  currentId={q.id}
  onChange={(c) => onChange({ ...q, conditions: c })}
/>
```

In `FileEditor` — same pattern with `allQuestions` prop:
```typescript
<ConditionsEditor
  conditions={q.conditions ?? []}
  allQuestions={allQuestions}
  currentId={q.id}
  onChange={(c) => onChange({ ...q, conditions: c })}
/>
```

- [ ] **Step 6: Add modal state and wire up the + button**

In `BuilderPage`, add state for the modal (after the `selected` state):
```typescript
const [showAddModal, setShowAddModal] = useState(false);
```

Replace the existing `addQuestion` function with this expanded version:
```typescript
const addQuestion = (inputType: InputType, _displayType: string) => {
  const id = `${inputType}-${Date.now()}`;
  let q: Question;
  switch (inputType) {
    case "color": {
      const first = layers.find((l) => l.type === "colorable");
      if (!first) { alert("Add a colorable layer first."); return; }
      q = { id, name: "Color Option", type: "color", linkedLayerId: first.id, swatches: [] };
      break;
    }
    case "thumbnail": {
      q = { id, name: "Thumbnail Option", type: "thumbnail", swatches: [] };
      break;
    }
    case "text":
      q = { id, name: "Custom Text", type: "text", defaultText: "Your Name", defaultColor: "#ffffff", defaultFontSize: 48, defaultFontFamily: "Arial", position: { x: 200, y: 180 } };
      break;
    case "file":
      q = { id, name: "Upload Logo", type: "file", position: { x: 200, y: 280 }, defaultWidth: 120, defaultHeight: 120 };
      break;
    case "dropdown":
      q = { id, name: "Dropdown Option", type: "dropdown", options: [] };
      break;
    case "radio":
      q = { id, name: "Radio Option", type: "radio", options: [] };
      break;
    case "checkbox":
      q = { id, name: "Checkbox Option", type: "checkbox", checkedLabel: "Yes", uncheckedLabel: "No", defaultChecked: false };
      break;
    case "label":
      q = { id, name: "Info Label", type: "label", content: "" };
      break;
    case "group":
      q = { id, name: "Group", type: "group", childIds: [] };
      break;
    default:
      return;
  }
  setQuestions((p) => [...p, q]);
  setSelected({ kind: "question", id });
};
```

Replace the questions header in the left panel (the 3 emoji buttons `🎨 T ↑`) with a single `+` button that opens the modal:
```typescript
{/* Replace the 3 quick-add buttons with: */}
<button onClick={() => setShowAddModal(true)} title="Add question" style={smallBtnSt}>+</button>
```

Add the modal at the very end of the returned JSX, just before the closing outer `</div>`:
```typescript
{showAddModal && (
  <AddQuestionModal
    onClose={() => setShowAddModal(false)}
    onCreate={(inputType, displayType) => addQuestion(inputType, displayType)}
  />
)}
```

- [ ] **Step 7: Update the right panel to render all new editor types**

In the right panel `<div style={{ flex: 1, overflowY: "auto" }}>` section, after the existing editor conditions, add:

```typescript
{selQ && selQ.type === "thumbnail" && (
  <ThumbnailEditor
    q={selQ as ThumbnailQuestion}
    layers={layers}
    allQuestions={questions}
    onChange={updateQ}
    previewValue={selectedSwatches[selQ.id]}
    onPreview={(value) => setSelectedSwatches((p) => ({ ...p, [selQ.id]: value }))}
  />
)}
{selQ && selQ.type === "dropdown" && (
  <DropdownEditor q={selQ as DropdownQuestion} allQuestions={questions} onChange={updateQ} />
)}
{selQ && selQ.type === "radio" && (
  <RadioEditor q={selQ as RadioQuestion} allQuestions={questions} onChange={updateQ} />
)}
{selQ && selQ.type === "checkbox" && (
  <CheckboxEditor q={selQ as CheckboxQuestion} allQuestions={questions} onChange={updateQ} />
)}
{selQ && selQ.type === "label" && (
  <LabelEditor q={selQ as LabelQuestion} allQuestions={questions} onChange={updateQ} />
)}
{selQ && selQ.type === "group" && (
  <GroupEditor q={selQ as GroupQuestion} allQuestions={questions} onChange={updateQ} />
)}
```

Also pass `allQuestions={questions}` to the existing `ColorEditor`, `TextEditor`, and `FileEditor` call sites.

- [ ] **Step 8: Update QuestionRow icons for new types**

In `QuestionRow`, update the `icon` logic to cover all types:
```typescript
const icon =
  q.type === "color" ? (
    <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: q.swatches?.[0]?.value ?? "#888", border: "1px solid rgba(0,0,0,0.1)", flexShrink: 0 }} />
  ) : q.type === "thumbnail" ? (
    <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: (q as any).swatches?.[0]?.value ?? "#888", border: "1px solid rgba(0,0,0,0.1)", flexShrink: 0 }} />
  ) : q.type === "text" ? (
    <span style={{ fontWeight: 800, fontSize: 12, color: "#10b981", lineHeight: 1 }}>T</span>
  ) : q.type === "file" ? (
    <span style={{ fontSize: 11, color: "#6366f1" }}>↑</span>
  ) : q.type === "dropdown" ? (
    <span style={{ fontSize: 11, color: "#f59e0b" }}>▾</span>
  ) : q.type === "radio" ? (
    <span style={{ fontSize: 11, color: "#8b5cf6" }}>◉</span>
  ) : q.type === "checkbox" ? (
    <span style={{ fontSize: 11, color: "#06b6d4" }}>☑</span>
  ) : q.type === "label" ? (
    <span style={{ fontSize: 11, color: "#6b7280" }}>≡</span>
  ) : q.type === "group" ? (
    <span style={{ fontSize: 11, color: "#374151" }}>▣</span>
  ) : (
    <span style={{ fontSize: 11, color: "#9ca3af" }}>?</span>
  );
```

- [ ] **Step 9: Verify types compile**

```
npm run typecheck
```

Expected: Zero type errors.

- [ ] **Step 10: Commit**

```
git add app/routes/app.configurator-setup.$productId.tsx
git commit -m "feat: add 5 new editors, AddQuestionModal wiring, and conditions UI to admin builder"
```

---

## Task 4: Update storefront — per-type renderers, conditional visibility, multi-view

**Files:**
- Modify: `app/routes/configurator.$productId.tsx`

- [ ] **Step 1: Add useVisibleQuestions hook and multi-view state**

At the top of `StorefrontConfiguratorPage`, after the existing state declarations, add:

```typescript
// Multi-view navigation
const numViews: number = (config?.options as any)?.numViews ?? 1;
const [currentView, setCurrentView] = useState(0);

// Selections for all question types (used by conditional visibility)
const [dropdownValues, setDropdownValues] = useState<Record<string, string>>(() => {
  const init: Record<string, string> = {};
  for (const q of questions) {
    if (q.type === "dropdown" || q.type === "radio") init[q.id] = (q as any).defaultValue ?? "";
  }
  return init;
});
const [checkboxValues, setCheckboxValues] = useState<Record<string, boolean>>(() => {
  const init: Record<string, boolean> = {};
  for (const q of questions) {
    if (q.type === "checkbox") init[q.id] = (q as any).defaultChecked ?? false;
  }
  return init;
});
```

Add this helper function just before the `return` statement:

```typescript
// Returns true if all conditions for a question are met
const isVisible = (q: Question): boolean => {
  const conds = (q as any).conditions as { questionId: string; value: string }[] | undefined;
  if (!conds || conds.length === 0) return true;
  return conds.every((c) => {
    const parent = questions.find((x) => x.id === c.questionId);
    if (!parent) return true;
    if (parent.type === "color" || parent.type === "thumbnail") {
      return layerColors[(parent as any).linkedLayerId] === c.value;
    }
    if (parent.type === "dropdown" || parent.type === "radio") {
      return dropdownValues[parent.id] === c.value;
    }
    if (parent.type === "checkbox") {
      return String(checkboxValues[parent.id]) === c.value;
    }
    if (parent.type === "text") {
      return (textValues[parent.id] ?? (parent as any).defaultText) === c.value;
    }
    return true;
  });
};
```

- [ ] **Step 2: Update layer rendering to use currentView**

In the `<KonvaLayer>` section, change the `ProductLayer` `src` prop from `layer.src` to use multi-view:

```typescript
{layers.map((layer) => (
  <ProductLayer
    key={layer.id}
    src={getLayerSrc(layer, currentView)}
    color={layer.type === "colorable" ? layerColors[layer.id] : undefined}
    textureUrl={layer.type === "colorable" ? layerTextures[layer.id] : undefined}
    width={CANVAS_SIZE}
    height={CANVAS_SIZE}
  />
))}
```

Also add the import: `import { getLayerSrc } from "../types/configurator";` (add `getLayerSrc` to the existing import from `"../types/configurator"`).

- [ ] **Step 3: Replace the left controls section with per-type renderers**

Replace the existing `colorQuestions.map(...)`, `textQuestions.map(...)`, and `fileQuestions.map(...)` blocks with this unified renderer that handles all types and applies conditional visibility:

```typescript
{questions.filter(isVisible).map((q) => {
  if (q.type === "group") {
    const groupQ = q as GroupQuestion;
    const children = groupQ.childIds
      .map((cid) => questions.find((x) => x.id === cid))
      .filter((x): x is Question => !!x && isVisible(x));
    return (
      <details key={q.id} style={{ marginTop: 16, border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }} open>
        <summary style={{ padding: "10px 14px", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "#374151", cursor: "pointer", background: "#f9fafb", userSelect: "none" }}>
          {q.name}
        </summary>
        <div style={{ padding: "4px 14px 12px" }}>
          {children.map((child) => renderQuestion(child))}
        </div>
      </details>
    );
  }
  // Skip questions that are children of a group (they render inside the group)
  const isChildOfGroup = questions.some((x) => x.type === "group" && (x as GroupQuestion).childIds.includes(q.id));
  if (isChildOfGroup) return null;
  return renderQuestion(q);
})}
```

Add the `renderQuestion` function just before the `return` statement (after `isVisible`):

```typescript
const renderQuestion = (q: Question) => {
  if (q.type === "color" || q.type === "thumbnail") {
    const cq = q as ColorQuestion | ThumbnailQuestion;
    const linkedId = (cq as any).linkedLayerId as string | undefined;
    const active = linkedId ? layerColors[linkedId] : undefined;
    return (
      <div key={q.id} style={{ marginTop: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6b7280", marginBottom: 10 }}>
          {q.name}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {cq.swatches.map((s) => {
            const isActive = active === s.value;
            return (
              <button
                key={s.value}
                title={s.label}
                onClick={() => {
                  if (!linkedId) return;
                  setLayerColors((p) => ({ ...p, [linkedId]: s.value }));
                  setLayerTextures((p) => {
                    const next = { ...p };
                    if (s.imageUrl) next[linkedId] = s.imageUrl;
                    else delete next[linkedId];
                    return next;
                  });
                }}
                style={{ width: 34, height: 34, borderRadius: s.imageUrl ? 6 : "50%", background: s.imageUrl ? "none" : s.value, backgroundImage: s.imageUrl ? `url(${s.imageUrl})` : "none", backgroundSize: "cover", border: isActive ? "3px solid #111827" : "2px solid #e5e7eb", outline: isActive ? "2px solid #fff" : "none", outlineOffset: -3, cursor: linkedId ? "pointer" : "default", padding: 0, overflow: "hidden" }}
              />
            );
          })}
          {linkedId && (
            <input type="color" value={active || "#000000"} onChange={(e) => setLayerColors((p) => ({ ...p, [linkedId]: e.target.value }))} title="Custom colour" style={{ width: 34, height: 34, borderRadius: "50%", border: "2px solid #e5e7eb", padding: 2, cursor: "pointer" }} />
          )}
        </div>
      </div>
    );
  }

  if (q.type === "dropdown") {
    const dq = q as DropdownQuestion;
    return (
      <div key={q.id} style={{ marginTop: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6b7280", marginBottom: 8 }}>{q.name}</div>
        <select
          value={dropdownValues[q.id] ?? dq.defaultValue ?? ""}
          onChange={(e) => setDropdownValues((p) => ({ ...p, [q.id]: e.target.value }))}
          style={{ width: "100%", padding: "9px 10px", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 13, boxSizing: "border-box" }}
        >
          {dq.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    );
  }

  if (q.type === "radio") {
    const rq = q as RadioQuestion;
    return (
      <div key={q.id} style={{ marginTop: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6b7280", marginBottom: 8 }}>{q.name}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {rq.options.map((o) => (
            <label key={o.value} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
              <input
                type="radio"
                name={q.id}
                value={o.value}
                checked={(dropdownValues[q.id] ?? rq.defaultValue ?? "") === o.value}
                onChange={() => setDropdownValues((p) => ({ ...p, [q.id]: o.value }))}
              />
              {o.label}
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (q.type === "checkbox") {
    const cq = q as CheckboxQuestion;
    const checked = checkboxValues[q.id] ?? cq.defaultChecked;
    return (
      <div key={q.id} style={{ marginTop: 20 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setCheckboxValues((p) => ({ ...p, [q.id]: e.target.checked }))}
            style={{ width: 16, height: 16 }}
          />
          <span style={{ fontSize: 13 }}>{checked ? cq.checkedLabel : cq.uncheckedLabel}</span>
        </label>
      </div>
    );
  }

  if (q.type === "label") {
    const lq = q as LabelQuestion;
    return (
      <div key={q.id} style={{ marginTop: 20, padding: "10px 12px", background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6b7280", marginBottom: 4 }}>{q.name}</div>
        <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{lq.content}</p>
      </div>
    );
  }

  if (q.type === "text") {
    const tq = q as TextQuestion;
    return (
      <div key={q.id} style={{ marginTop: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6b7280", marginBottom: 8 }}>{q.name}</div>
        <input
          value={textValues[q.id] ?? tq.defaultText}
          onChange={(e) => setTextValues((p) => ({ ...p, [q.id]: e.target.value }))}
          placeholder={tq.defaultText}
          style={{ width: "100%", padding: "9px 10px", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 13, boxSizing: "border-box" }}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 8, alignItems: "flex-end" }}>
          <div>
            <label style={{ fontSize: 11, color: "#9ca3af", display: "block", marginBottom: 3 }}>Colour</label>
            <input type="color" value={textColors[q.id] ?? tq.defaultColor} onChange={(e) => setTextColors((p) => ({ ...p, [q.id]: e.target.value }))} style={{ width: 32, height: 28, borderRadius: 4, border: "1px solid #e5e7eb" }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: "#9ca3af", display: "block", marginBottom: 3 }}>Size: {textSizes[q.id] ?? tq.defaultFontSize}px</label>
            <input type="range" min={14} max={120} value={textSizes[q.id] ?? tq.defaultFontSize} onChange={(e) => setTextSizes((p) => ({ ...p, [q.id]: Number(e.target.value) }))} style={{ width: "100%" }} />
          </div>
        </div>
        <select value={textFonts[q.id] ?? tq.defaultFontFamily} onChange={(e) => setTextFonts((p) => ({ ...p, [q.id]: e.target.value }))} style={{ width: "100%", marginTop: 7, padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12 }}>
          {["Arial", "Georgia", "Impact", "Verdana", "Courier New", "Times New Roman"].map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>
    );
  }

  if (q.type === "file") {
    const fq = q as FileQuestion;
    return (
      <div key={q.id} style={{ marginTop: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6b7280", marginBottom: 8 }}>{q.name}</div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", border: "2px dashed #e5e7eb", borderRadius: 8, cursor: "pointer", color: "#6b7280", fontSize: 12 }}>
          <span>📁</span>
          <span>{uploadedImages[q.id] ? "Uploaded — change" : "Choose image"}</span>
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(q.id, f); }} />
        </label>
      </div>
    );
  }

  return null;
};
```

Also add these imports to the existing import from `"../types/configurator"`:
```typescript
import {
  type LayerConfig,
  type Question,
  type ColorQuestion,
  type ThumbnailQuestion,
  type TextQuestion,
  type FileQuestion,
  type DropdownQuestion,
  type RadioQuestion,
  type CheckboxQuestion,
  type LabelQuestion,
  type GroupQuestion,
  migrateOptions,
  getLayerSrc,
} from "../types/configurator";
```

- [ ] **Step 4: Add multi-view navigation dots below the canvas**

Add view navigation below the `<Stage>` canvas, inside the canvas container div:

```typescript
{/* View navigation */}
{numViews > 1 && (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12 }}>
    <button
      onClick={() => setCurrentView((v) => Math.max(0, v - 1))}
      disabled={currentView === 0}
      style={{ background: "none", border: "1px solid #d1d5db", borderRadius: 5, width: 28, height: 28, cursor: currentView === 0 ? "not-allowed" : "pointer", color: "#6b7280", fontSize: 14, opacity: currentView === 0 ? 0.4 : 1 }}
    >‹</button>
    {Array.from({ length: numViews }).map((_, vi) => (
      <button
        key={vi}
        onClick={() => setCurrentView(vi)}
        style={{ width: vi === currentView ? 22 : 10, height: 10, borderRadius: 5, background: vi === currentView ? "#111827" : "#d1d5db", border: "none", cursor: "pointer", padding: 0, transition: "width 0.15s" }}
        title={`View ${vi + 1}`}
      />
    ))}
    <button
      onClick={() => setCurrentView((v) => Math.min(numViews - 1, v + 1))}
      disabled={currentView === numViews - 1}
      style={{ background: "none", border: "1px solid #d1d5db", borderRadius: 5, width: 28, height: 28, cursor: currentView === numViews - 1 ? "not-allowed" : "pointer", color: "#6b7280", fontSize: 14, opacity: currentView === numViews - 1 ? 0.4 : 1 }}
    >›</button>
  </div>
)}
```

- [ ] **Step 5: Update handleAddToCart to include new question types**

Replace the `handleAddToCart` function:

```typescript
const handleAddToCart = () => {
  const properties: Record<string, string> = {};

  for (const q of questions) {
    if (q.type === "color" || q.type === "thumbnail") {
      const linkedId = (q as any).linkedLayerId as string | undefined;
      if (linkedId && layerColors[linkedId]) properties[q.name] = layerColors[linkedId];
    }
    if (q.type === "text") {
      const val = textValues[q.id];
      if (val) properties[q.name] = val;
    }
    if (q.type === "dropdown" || q.type === "radio") {
      const val = dropdownValues[q.id];
      if (val) properties[q.name] = val;
    }
    if (q.type === "checkbox") {
      properties[q.name] = String(checkboxValues[q.id] ?? (q as CheckboxQuestion).defaultChecked);
    }
  }

  setSelectedId(null);
  setTimeout(() => {
    const previewDataUrl = stageRef.current?.toDataURL({ pixelRatio: 2 });
    window.parent.postMessage({ type: "configurator:add-to-cart", properties, previewDataUrl }, "*");
  }, 80);
};
```

- [ ] **Step 6: Verify types compile**

```
npm run typecheck
```

Expected: Zero type errors.

- [ ] **Step 7: Commit**

```
git add app/routes/configurator.$productId.tsx
git commit -m "feat: add per-type storefront renderers, conditional visibility, and multi-view navigation"
```

---

## Task 5: Final verification

- [ ] **Step 1: Run typecheck one final time**

```
npm run typecheck
```

Expected: Zero errors.

- [ ] **Step 2: Start dev server and verify admin builder**

```
npm run dev
```

Open the admin builder for any product. Verify:
- Clicking `+` opens the AddQuestionModal
- Each input type is selectable
- Display type grid filters based on input type selected
- Create button is disabled until both are selected
- Creating a question adds it to the left panel with the correct icon
- Selecting a question shows the correct editor in the right panel
- Conditions editor appears at the bottom of every editor

- [ ] **Step 3: Verify storefront**

Navigate to the storefront configurator URL. Verify:
- All question types render correctly in the left panel
- Selecting a dropdown/radio/checkbox shows the selection
- Conditional questions show/hide based on parent selections
- If multiple views are configured, view dots appear and clicking switches the product image

- [ ] **Step 4: Final commit**

```
git add -A
git commit -m "feat: complete Kickflip-style configurator with 10 input types, conditions, multi-view"
```
