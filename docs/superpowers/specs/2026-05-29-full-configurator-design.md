# Full Kickflip-Style Configurator — Design Spec
Date: 2026-05-29

## Overview
Expand the existing Shopify product configurator (currently: color/text/file question types) into a full Kickflip-style builder with 10 input types, display type filtering, conditional visibility, multi-view storefront navigation, and grouped questions.

---

## 1. Type System Changes (`app/types/configurator.ts`)

### New Question Variants (extending the `Question` union)

```ts
type InputType = "thumbnail" | "dropdown" | "radio" | "checkbox" | "label" | "text" | "file" | "color" | "none" | "group";
type DisplayType = "color" | "image" | "logo" | "text" | "font" | "font-size" | "text-color" | "text-outline" | "none";
```

All questions get two new optional fields:
- `inputType: InputType` — the UI control shown to the customer
- `displayType: DisplayType` — how the answer affects the product canvas
- `conditions?: { questionId: string; value: string }[]` — show only when all conditions match

New question type interfaces added to the union:

**ThumbnailQuestion** (`type: "thumbnail"`)
- Reuses `swatches: ColorSwatch[]`
- `linkedLayerId: string` (optional — if set, colorizes that layer)

**DropdownQuestion** (`type: "dropdown"`)
- `options: { value: string; label: string }[]`
- `defaultValue?: string`

**RadioQuestion** (`type: "radio"`)
- `options: { value: string; label: string }[]`
- `defaultValue?: string`

**CheckboxQuestion** (`type: "checkbox"`)
- `checkedLabel: string`
- `uncheckedLabel: string`
- `defaultChecked: boolean`

**LabelQuestion** (`type: "label"`)
- `content: string` — info text shown to customer

**GroupQuestion** (`type: "group"`)
- `childIds: string[]` — IDs of child questions contained in this group

Existing `ColorQuestion`, `TextQuestion`, `FileQuestion` remain unchanged (backward compatible).

### Display Type Filtering Map
| Input Type | Allowed Display Types |
|---|---|
| thumbnail | color, image |
| dropdown | none |
| radio | none |
| checkbox | none |
| label | none |
| text (text input) | text, font, font-size, text-color, text-outline |
| file | logo, image |
| color (color picker) | color |
| none | none |
| group | none |

---

## 2. Admin Builder Changes

### 2.1 Add Question Modal
Triggered by the `+` button area in the left panel questions section.

**Layout** — two-step within one modal:
1. Top section: "1. Select an input type" — 3-column icon grid with all 10 input types (Thumbnail, Dropdown, Radio button, Label, File upload, Text input, Checkbox, Color picker, None, Group)
2. Bottom section: "2. Select a display type" — icon grid filtered to only allowed types for the selected input type (grayed out until input type selected)
3. "Create" button at bottom right — enabled only when both input + display type are chosen (or input type is one that doesn't require a display type selection)

**File:** `app/components/AddQuestionModal.tsx` (new component)

### 2.2 Right Panel Editors (new editors)
- `ThumbnailEditor` — same as `ColorEditor` (shares swatch list UI)
- `DropdownEditor` — add/remove `{value, label}` option rows
- `RadioEditor` — same list UI as dropdown
- `CheckboxEditor` — label fields + default state toggle
- `LabelEditor` — textarea for content
- `GroupEditor` — shows child question IDs; allows adding existing questions to the group

**Conditional logic** — every editor gets a "Show only when..." section at the bottom:
- Dropdown to pick a parent question (any other question in the list)
- Second dropdown to pick a specific answer value from that question
- "Add condition" / "Remove" buttons
- Multiple conditions are AND-ed together

### 2.3 Left Panel Updates
- Group questions show their child questions indented beneath them
- Question row icons updated to reflect all 10 input types
- The existing `🎨 T ↑` quick-add buttons become just `+` opening the modal

---

## 3. Storefront Changes (`app/routes/configurator.$productId.tsx`)

### 3.1 Per-Input-Type Rendering (left panel)
| Type | Rendered As |
|---|---|
| thumbnail / color | Circle/swatch grid (existing) |
| dropdown | `<select>` element |
| radio | `<input type="radio">` list |
| checkbox | `<input type="checkbox">` toggle |
| label | `<p>` read-only text |
| text | `<input type="text">` (existing) |
| file | File picker (existing) |
| group | Collapsible `<details>/<summary>` accordion containing child questions |

### 3.2 Conditional Visibility
`useVisibleQuestions(questions, selections)` hook — returns filtered list of questions where all conditions are met. Called on every render; questions not meeting conditions are hidden.

### 3.3 Multi-View Navigation
Add view dots (already in admin builder) + prev/next arrow buttons to the storefront canvas area. Uses `currentView` state + `getLayerSrc(layer, currentView)` (already implemented in the type system).

---

## 4. File Changes Summary

| File | Action |
|---|---|
| `app/types/configurator.ts` | Add 6 new question interfaces + `conditions` field to all questions |
| `app/components/AddQuestionModal.tsx` | New file — the add question modal |
| `app/routes/app.configurator-setup.$productId.tsx` | Replace quick-add buttons with modal; add new editors; add conditional UI |
| `app/routes/configurator.$productId.tsx` | Add per-type renderers; conditional visibility; multi-view dots |

---

## 5. Out of Scope
- Bulk order input type
- Logic/formula builder (complex AND/OR rules beyond simple equality)
- Variant-based pricing from question answers
- Drag-and-drop question reordering
