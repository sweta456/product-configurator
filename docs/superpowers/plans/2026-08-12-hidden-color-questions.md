# Hidden ("Behind the scene") Color Questions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a color question be marked "Behind the scene" so it's hidden from customers and from the builder's main Questions list, while still being configurable and able to drive a part's color via a working Logic `should_be` rule.

**Architecture:** Add a `hidden` boolean to color-capable question types. The builder excludes hidden questions from the Questions list and surfaces them as clickable entries nested under their linked part in the Behind the scene panel instead. The storefront (and its in-admin preview) permanently excludes hidden questions from rendering, independent of the existing Logic-based conditional visibility. Separately, the Logic engine's `should_be` effect — defined in the UI but never implemented at runtime — gets implemented, and the storefront applies any forced value through the exact same code path a real customer click uses.

**Tech Stack:** React Router 7 (Remix-style file routes), TypeScript, React state (no external state library), no test framework in this repo (verification is `npm run typecheck` + manual checks in the running app via `npm run dev`).

## Global Constraints

- This repository has no automated test framework (no jest/vitest/testing-library in `package.json`). Every task's verification step is `npm run typecheck` plus a manual check in the running app, not an automated test. Do not introduce a test framework as part of this work — out of scope.
- Follow the existing codebase convention of `(x as any).field` casts for optional/loosely-typed question fields rather than fighting the `Question` discriminated union — this file already does this extensively (e.g. `(q as any).swatches?.length`).
- Do not touch the WordPress plugin variant (`assets/js/builder.js` / `assets/js/storefront.js`) — separate codebase, out of scope per the design spec.
- Do not touch Logic rules whose condition/action target a "Behind the Scene" **layer** directly (as opposed to a question) — out of scope per the design spec, leave that pathway exactly as inert as it is today.
- Spec: `docs/superpowers/specs/2026-08-12-hidden-color-questions-design.md`

---

### Task 1: Builder — hide toggle, Questions list filter, auto-hide on Behind-the-scene creation

**Files:**
- Modify: `app/types/configurator.ts:156-178` (add `hidden?: boolean` to `ColorQuestion` and `ThumbnailQuestion`)
- Modify: `app/routes/app.configurator-setup.$productId.tsx:1067-1084` (add toggle)
- Modify: `app/routes/app.configurator-setup.$productId.tsx:4233-4238` (filter top-level Questions list)
- Modify: `app/routes/app.configurator-setup.$productId.tsx:4254-4257` (filter grouped children)
- Modify: `app/routes/app.configurator-setup.$productId.tsx:3959-3966` (default `hidden: true` on Behind-the-scene-created questions)

**Interfaces:**
- Produces: `ColorQuestion.hidden?: boolean`, `ThumbnailQuestion.hidden?: boolean` — read by Tasks 2, 3, 4 and by the builder's Questions-list filter.

- [ ] **Step 1: Add `hidden` to the question types**

In `app/types/configurator.ts`, add `hidden?: boolean;` to both interfaces:

```ts
export interface ColorQuestion {
  id: string;
  name: string;
  type: "color";
  displayType?: "none" | "color" | "text-color";
  linkedLayerId?: string;
  swatches: ColorSwatch[];
  conditions?: Condition[];
  hidden?: boolean;
}
```

```ts
export interface ThumbnailQuestion {
  id: string;
  name: string;
  type: "thumbnail";
  displayType?: "image" | "color" | "none";
  linkedLayerId?: string;
  swatches: ColorSwatch[];
  conditions?: Condition[];
  multipleSelection?: boolean;
  largeThumbnail?: boolean;
  showNameLabel?: boolean;
  applyOn?: string[];
  hidden?: boolean;
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: passes with no new errors.

- [ ] **Step 3: Add the "Behind the scene" toggle to the Thumbnail question panel**

In `app/routes/app.configurator-setup.$productId.tsx`, the "Apply on" section (lines 1031-1083) is currently `{displayType === "color" && ( <div style={{ marginTop: 12 }}> ... </div> )}` — a single JSX element inside those parens. Adding a second sibling `<div>` next to it requires wrapping both in a Fragment, or the JSX won't compile. Replace the whole block (from the `{/* Apply on */}` comment at line 1031 through its closing `)}` at line 1083) with:

```tsx
        {/* Apply on — visible only for color display type */}
        {displayType === "color" && (
          <>
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: "#9ca3af" }}>↳</span>
                <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>Apply on</span>
                <div ref={applyPickerRef} style={{ marginLeft: "auto", position: "relative" }}>
                  <button onClick={() => { setShowApplyPicker((v) => !v); setApplySearchColor(""); }}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer", fontSize: 12, background: showApplyPicker ? "#eff6ff" : "#f9fafb", color: "#374151" }}>
                    <span>🏔</span><span>Image question</span><span style={{ fontWeight: 700 }}>+</span>
                  </button>
                  {showApplyPicker && (
                    <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 50, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", minWidth: 200, padding: "8px 8px 6px" }}>
                      <input
                        autoFocus
                        value={applySearchColor}
                        onChange={(e) => setApplySearchColor(e.target.value)}
                        placeholder="Search..."
                        style={{ width: "100%", padding: "5px 8px", fontSize: 12, border: "1px solid #e5e7eb", borderRadius: 5, marginBottom: 6, boxSizing: "border-box", outline: "none" }}
                      />
                      <div style={{ maxHeight: 180, overflowY: "auto" }}>
                        {allImageItems
                          .filter((item) => !linkedIds.includes(item.id) && item.name.toLowerCase().includes(applySearchColor.toLowerCase()))
                          .map((item) => (
                            <button key={item.id} onClick={() => { onChange({ ...q, applyOn: [...linkedIds, item.id] }); setShowApplyPicker(false); setApplySearchColor(""); }}
                              style={{ display: "block", width: "100%", textAlign: "left", padding: "7px 10px", border: "none", borderRadius: 5, background: "none", cursor: "pointer", fontSize: 13, color: "#374151" }}>
                              {item.name}
                            </button>
                          ))}
                        {allImageItems.filter((item) => !linkedIds.includes(item.id) && item.name.toLowerCase().includes(applySearchColor.toLowerCase())).length === 0 && (
                          <p style={{ padding: "6px 10px", fontSize: 12, color: "#9ca3af", margin: 0 }}>No matches.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {linkedIds.map((lid) => {
                const linkedQ = questions.find((oq) => oq.id === lid);
                const linkedL = !linkedQ ? layers.find((l) => l.id === lid) : null;
                const linkedName = (linkedQ || linkedL)?.name;
                if (!linkedName) return null;
                return (
                  <div key={lid} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "#f9fafb", borderRadius: 6, border: "1px solid #e5e7eb", marginBottom: 4 }}>
                    <span style={{ fontSize: 13 }}>🏔</span>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{linkedName}</span>
                    <button onClick={() => onChange({ ...q, applyOn: linkedIds.filter((id) => id !== lid) })}
                      style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 16, padding: 0, lineHeight: 1, flexShrink: 0 }}>×</button>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #f3f4f6" }}>
              <ToggleRow label="Behind the scene" checked={q.hidden ?? false} onChange={(v) => onChange({ ...q, hidden: v })} />
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9ca3af" }}>
                Hide this question from customers. Drive its color with a Logic rule instead.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

Everything above the new `<div style={{ marginTop: 10, ...}}>` block is unchanged existing code, now wrapped in a Fragment (`<>...</>`) instead of being the sole child of the `{displayType === "color" && ( ... )}` expression, so it can have the new toggle block as a sibling. `ToggleRow` is already defined in this file at line 644 and used elsewhere in the same panel, e.g. line 991.

- [ ] **Step 4: Run typecheck**

Run: `npm run typecheck`
Expected: passes.

- [ ] **Step 5: Filter hidden questions out of the Questions list**

In `app/routes/app.configurator-setup.$productId.tsx`, top-level loop (~line 4237):

```tsx
              return questions.map((q, idx) => {
                if (childIdsInGroups.has(q.id)) return null;
                if ((q as any).hidden) return null;
```

Grouped-children loop (~line 4255):

```tsx
                      {isExpanded && gq.childIds.map((childId) => {
                        const child = questions.find((oq) => oq.id === childId);
                        if (!child) return null;
                        if ((child as any).hidden) return null;
```

- [ ] **Step 6: Default new Behind-the-scene-created questions to hidden**

In `app/routes/app.configurator-setup.$productId.tsx`, inside `addLinkedLayer`'s color branch (~line 3959):

```tsx
      const newQ: ThumbnailQuestion = {
        id,
        name: `Untitled Question ${count} colors`,
        type: "thumbnail",
        displayType: "color",
        swatches: [],
        applyOn: [sourceId],
        hidden: true,
      };
```

- [ ] **Step 7: Run typecheck**

Run: `npm run typecheck`
Expected: passes.

- [ ] **Step 8: Manual verification**

Run: `npm run dev`, open the builder for any product with an existing color question applied to a part.
1. Select a `Thumbnail` question with Display type "Color". Confirm the new "Behind the scene" toggle appears below "Apply on".
2. Turn it on. Confirm the question immediately disappears from the top **Questions** list.
3. In the **Behind the scene** panel, click the "+" on a part that has no color question yet, and add a linked color question. Confirm the newly created question does **not** appear in the Questions list (it should only be reachable via the part, per Step 6 — full clickability lands in Task 2).
4. Turn the toggle back off on the first question. Confirm it reappears in the Questions list.

- [ ] **Step 9: Commit**

```bash
git add app/types/configurator.ts "app/routes/app.configurator-setup.\$productId.tsx"
git commit -m "feat: add Behind the scene hide toggle for color questions"
```

---

### Task 2: Builder — clickable linked entries in the Behind the scene panel

**Files:**
- Modify: `app/routes/app.configurator-setup.$productId.tsx:439-490` (`LayerRow`)
- Modify: `app/routes/app.configurator-setup.$productId.tsx:4307-4324` (call site)

**Interfaces:**
- Consumes: `ColorQuestion.hidden` / `ThumbnailQuestion.hidden` (Task 1) — not read directly here, but this is what makes clicking through necessary (a hidden question is otherwise unreachable from the Questions list).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Change `LayerRow` to accept linked `{id, name}` pairs and make them clickable**

Replace the `LayerRow` function signature and body in `app/routes/app.configurator-setup.$productId.tsx`:

```tsx
function LayerRow({ layer, selected, linkedItems, onSelect, onSelectLinked, onRemove, isDragging, isDragOver, onDragStart, onDragOver, onDrop, onDragEnd }: {
  layer: LayerConfig; selected: boolean;
  linkedItems?: { id: string; name: string }[];
  onSelect: () => void; onSelectLinked?: (id: string) => void; onRemove: () => void;
  isDragging?: boolean; isDragOver?: boolean;
  onDragStart?: () => void; onDragOver?: (e: React.DragEvent) => void; onDrop?: () => void; onDragEnd?: () => void;
}) {
  const dt = layer.displayType;
  const dtMeta = dt ? DISPLAY_TYPE_META[dt] : null;
  const dtBg = dt ? (LAYER_DISPLAY_COLORS[dt] ?? "#6b7280") : "#d1d5db";

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      style={{ position: "relative", opacity: isDragging ? 0.35 : 1 }}
    >
      <div
        onClick={onSelect}
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 10px 7px 10px", cursor: "pointer", background: isDragOver ? "#f0f9ff" : selected ? "#eff6ff" : "transparent", borderLeft: `3px solid ${isDragOver ? "#0ea5e9" : selected ? "#3b82f6" : "transparent"}` }}
      >
        <span style={{ cursor: "grab", color: "#d1d5db", fontSize: 12, letterSpacing: 1, flexShrink: 0, userSelect: "none" }}>⠿</span>
        {dtMeta
          ? <span style={{ width: 18, height: 18, background: dtBg, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 700, flexShrink: 0 }}>{dtMeta.icon}</span>
          : <span style={{ display: "inline-block", width: 4, height: 18, borderRadius: 2, background: layer.type === "colorable" ? "#6366f1" : "#d1d5db", flexShrink: 0 }} />
        }
        <span style={{ flex: 1, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{layer.name}</span>
        {!dtMeta && (
          <span style={{ fontSize: 10, color: "#9ca3af", textTransform: "uppercase", flexShrink: 0 }}>
            {layer.type === "colorable" ? "color" : "static"}
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          style={{ background: "none", border: "none", color: "#d1d5db", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }}
        >
          ×
        </button>
      </div>
      {linkedItems && linkedItems.length > 0 && (
        <div style={{ paddingLeft: 36, paddingBottom: 4, display: "flex", flexDirection: "column", gap: 2 }}>
          {linkedItems.map((item) => (
            <span
              key={item.id}
              onClick={(e) => { e.stopPropagation(); onSelectLinked?.(item.id); }}
              style={{ fontSize: 11, color: "#9ca3af", cursor: onSelectLinked ? "pointer" : "default" }}
            >
              ↳ {item.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update the call site to build `linkedItems` and pass `onSelectLinked`**

Replace the layers-rendering block in `app/routes/app.configurator-setup.$productId.tsx` (~line 4307):

```tsx
            {layers.filter((l) => l.type !== "glb-part").map((l, idx) => {
              const forwardQs = (l.applyOn ?? []).map((qid) => questions.find((q) => q.id === qid)).filter((q): q is Question => !!q);
              const reverseQs = questions.filter((q) => (q as any).applyOn?.includes(l.id));
              const linkedMap = new Map<string, string>();
              for (const q of [...forwardQs, ...reverseQs]) linkedMap.set(q.id, q.name);
              const linkedItems = Array.from(linkedMap, ([id, name]) => ({ id, name }));
              return (
                <LayerRow key={l.id} layer={l}
                  selected={selected?.id === l.id}
                  linkedItems={linkedItems}
                  onSelect={() => setSelected({ kind: "layer", id: l.id })}
                  onSelectLinked={(id) => setSelected({ kind: "question", id })}
                  onRemove={() => removeL(l.id)}
                  isDragging={dragLId === l.id} isDragOver={dragOverLId === l.id && dragLId !== l.id}
                  onDragStart={() => handleLDragStart(l.id)}
                  onDragOver={(e) => handleLDragOver(e, l.id)}
                  onDrop={() => handleLDrop(l.id)}
                  onDragEnd={handleLDragEnd}
                />
              );
            })}
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: passes (no remaining references to the old `linkedNames` prop).

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, open the builder.
1. In **Behind the scene**, find a part with a nested `↳ QuestionName` entry underneath it (from a hidden or visible linked question).
2. Click the nested entry. Confirm the right-hand panel switches to that question's editor (same as clicking it in the Questions list would have).
3. Repeat for the question created in Task 1 Step 8.3 — confirm it's now reachable and editable purely from Behind the scene.

- [ ] **Step 5: Commit**

```bash
git add "app/routes/app.configurator-setup.\$productId.tsx"
git commit -m "feat: make Behind the scene linked question entries clickable"
```

---

### Task 3: Storefront — permanently hide `hidden` questions

**Files:**
- Modify: `app/routes/configurator.$productId.tsx:85-89` (`isVisible`)
- Modify: `app/routes/app.configurator.$productId.tsx:68-72` (`isVisible`)

**Interfaces:**
- Consumes: `ColorQuestion.hidden` / `ThumbnailQuestion.hidden` (Task 1).

Both files define an identical `isVisible` helper used by every question-visibility filter (`visibleQuestions`, `textQuestions`, `fileQuestions`, `sidebarGroups`). Adding the check there covers all of them in one place.

- [ ] **Step 1: Update `isVisible` in the live storefront route**

In `app/routes/configurator.$productId.tsx`:

```ts
function isVisible(q: Question, selectedAnswers: Record<string, string>, hiddenQuestions?: Set<string>): boolean {
  if ((q as any).hidden) return false;
  if (hiddenQuestions?.has(q.id)) return false;
  if (!q.conditions?.length) return true;
  return q.conditions.every((c) => selectedAnswers[c.questionId] === c.value);
}
```

- [ ] **Step 2: Update `isVisible` in the admin preview route**

In `app/routes/app.configurator.$productId.tsx`, the same change:

```ts
function isVisible(q: Question, selectedAnswers: Record<string, string>, hiddenQuestions?: Set<string>): boolean {
  if ((q as any).hidden) return false;
  if (hiddenQuestions?.has(q.id)) return false;
  if (!q.conditions?.length) return true;
  return q.conditions.every((c) => selectedAnswers[c.questionId] === c.value);
}
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: passes.

- [ ] **Step 4: Manual verification**

1. In the builder, open "Preview customer view" for a product with a hidden color question (from Task 1). Confirm the hidden question never renders as a question card, even though its swatches/Apply-on are still configured.
2. If you can reach the live storefront embed for the same product, confirm the same there.
3. Confirm a question that is hidden *and* has a `should_be_unavailable`-style Logic rule targeting a different, non-hidden question still behaves as before (unrelated hiddenQuestions logic unaffected).

- [ ] **Step 5: Commit**

```bash
git add "app/routes/configurator.\$productId.tsx" "app/routes/app.configurator.\$productId.tsx"
git commit -m "fix: permanently hide Behind the scene questions on the storefront"
```

---

### Task 4: Logic engine — implement `should_be` and apply it on the storefront

**Files:**
- Modify: `app/types/configurator.ts:354-387` (`evaluateLogicRules`)
- Modify: `app/routes/configurator.$productId.tsx:729` (new effect, after `handleColorSwatchClick`)
- Modify: `app/routes/app.configurator.$productId.tsx:320` (new effect, after `handleSwatchClick`)

**Interfaces:**
- Consumes: `LogicRule`, `LogicAction.effect === "should_be"` (already defined in `app/types/configurator.ts:73-78`); `handleColorSwatchClick(q, swatchValue, swatchImageUrl?)` in `configurator.$productId.tsx`; `handleSwatchClick(q, swatchValue, imageUrl?)` in `app.configurator.$productId.tsx` (both pre-existing).
- Produces: `evaluateLogicRules()` return type gains `forcedAnswers: Map<string, string>`.

- [ ] **Step 1: Implement `should_be` in `evaluateLogicRules`**

In `app/types/configurator.ts`, replace the function:

```ts
export function evaluateLogicRules(
  rules: LogicRule[],
  selectedAnswers: Record<string, string>,
): { hiddenQuestions: Set<string>; unavailableAnswers: Map<string, Set<string>>; forcedAnswers: Map<string, string> } {
  const hiddenQuestions = new Set<string>();
  const unavailableAnswers = new Map<string, Set<string>>();
  const forcedAnswers = new Map<string, string>();

  for (const rule of rules) {
    const conditionsMet = rule.conditions.every((cond) => {
      const val = selectedAnswers[cond.questionId] ?? "";
      if (cond.operator === "is") return val === cond.value;
      if (cond.operator === "is_not") return val !== cond.value;
      if (cond.operator === "matches") return val.toLowerCase().includes(cond.value.toLowerCase());
      if (cond.operator === "doesnt_match") return !val.toLowerCase().includes(cond.value.toLowerCase());
      return false;
    });

    if (!conditionsMet) continue;

    for (const action of rule.actions) {
      if (action.effect === "should_be_unavailable") {
        hiddenQuestions.add(action.questionId);
      } else if (
        (action.effect === "should_not_be" || action.effect === "should_not_be_one_of") &&
        action.value
      ) {
        if (!unavailableAnswers.has(action.questionId)) unavailableAnswers.set(action.questionId, new Set());
        unavailableAnswers.get(action.questionId)!.add(action.value);
      } else if (action.effect === "should_be" && action.value) {
        forcedAnswers.set(action.questionId, action.value);
      }
    }
  }

  return { hiddenQuestions, unavailableAnswers, forcedAnswers };
}
```

Rules are evaluated in array order and `forcedAnswers.set()` overwrites, so if two rules force the same question to different values, the later rule in the array wins — same conflict behavior as the pre-existing `unavailableAnswers`/`hiddenQuestions` handling.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: passes. (If any other caller destructures `evaluateLogicRules()`'s return value with a type annotation that doesn't include `forcedAnswers`, this will surface it — there are two known callers, both updated in Steps 3-4 below.)

- [ ] **Step 3: Apply forced answers on the live storefront**

In `app/routes/configurator.$productId.tsx`, add a new `useEffect` immediately after `handleColorSwatchClick` ends (~line 729), before `handleAddToCart`:

```tsx
  useEffect(() => {
    const { forcedAnswers } = evaluateLogicRules(logicRules, selectedAnswers);
    for (const [questionId, value] of forcedAnswers) {
      if (selectedAnswers[questionId] === value) continue;
      const q = questions.find((oq) => oq.id === questionId);
      if (!q || (q.type !== "color" && q.type !== "thumbnail")) continue;
      const swatch = (q as any).swatches?.find((s: any) => s.value === value);
      handleColorSwatchClick(q as ColorQuestion | ThumbnailQuestion, value, swatch?.imageUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logicRules, selectedAnswers, questions]);
```

The `if (selectedAnswers[questionId] === value) continue;` guard is what prevents an infinite effect loop: `handleColorSwatchClick` updates `selectedAnswers`, which reruns this effect, but the next run sees the value already matches and skips it.

- [ ] **Step 4: Apply forced answers on the in-admin preview**

In `app/routes/app.configurator.$productId.tsx`, add the equivalent effect immediately after `handleSwatchClick` ends (~line 320), before `exportDesign`:

```tsx
  useEffect(() => {
    const { forcedAnswers } = evaluateLogicRules(logicRules, selectedAnswers);
    for (const [questionId, value] of forcedAnswers) {
      if (selectedAnswers[questionId] === value) continue;
      const q = questions.find((oq) => oq.id === questionId);
      if (!q || (q.type !== "color" && q.type !== "thumbnail")) continue;
      const swatch = (q as any).swatches?.find((s: any) => s.value === value);
      handleSwatchClick(q as ColorQuestion | ThumbnailQuestion, value, swatch?.imageUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logicRules, selectedAnswers, questions]);
```

- [ ] **Step 5: Run typecheck**

Run: `npm run typecheck`
Expected: passes.

- [ ] **Step 6: Manual verification**

Run: `npm run dev`, open the builder for a product that has:
- A visible color question (e.g. "Body Color") with at least two swatches.
- A hidden color question (from Task 1) applied to a different part, with at least one swatch whose value matches one of "Body Color"'s swatch values.

1. Open the Logic tab, add a rule: condition `Body Color is <swatch value>`, action `<hidden question> should be <matching swatch value>`.
2. Open "Preview customer view". Change "Body Color" to the swatch value from the rule.
3. Confirm the part linked to the hidden question updates to the matching color — even though the hidden question itself never rendered as a UI element.
4. Change "Body Color" to a different swatch not covered by the rule. Confirm the hidden question's part color does not change (no matching rule fires, no crash).
5. Confirm existing `should_be_unavailable` / `should_not_be` rules (built before this change) still behave as before.

- [ ] **Step 7: Commit**

```bash
git add app/types/configurator.ts "app/routes/configurator.\$productId.tsx" "app/routes/app.configurator.\$productId.tsx"
git commit -m "feat: implement should_be Logic effect and apply it on the storefront"
```
