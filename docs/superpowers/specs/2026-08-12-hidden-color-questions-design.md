# Hidden ("Behind the scene") color questions + working `should_be` logic

## Problem

A merchant wants a color question (e.g. "Palm Series Color") to apply a color to
a part without the customer ever seeing it as its own question — the color
should instead be driven by another visible question (e.g. one "Body Color"
picker that colors several parts at once). Reference: a competitor app
("PITCHER GLOVE BUILDER", Kickflip-powered) already does this — the color
question doesn't appear in the main question list; it shows up only nested
under its target part inside "Behind the scene".

Today, every question always appears in the builder's top **Questions** list
and always renders on the storefront. There's no way to mark a question as
permanently hidden from the customer while still keeping it configurable
(swatches, "Apply on") and having it receive a value.

Separately, while investigating this, we found that the Logic engine's
`should_be` effect — "when X, question Y should be value Z" — is exposed in
the rule-builder UI (`app.configurator-setup.$productId.tsx:3230`) and stored
on saved rules, but `evaluateLogicRules()` (`app/types/configurator.ts:354`)
never actually implements it. Rules built with this effect are silently
no-ops today. This blocks the "sync via Logic" approach chosen for sourcing a
hidden question's value, so fixing it is part of this work.

## Scope

In scope:
- A `hidden` flag on color-capable questions (`ThumbnailQuestion`,
  `ColorQuestion`), settable from the builder.
- Builder UI: hidden questions are excluded from the top Questions list and
  surfaced only as clickable nested entries under their linked part in
  **Behind the scene**.
- Storefront (`configurator.$productId.tsx`) and the in-admin preview
  (`app.configurator.$productId.tsx`): hidden questions never render as a
  question, unconditionally (independent of any Logic-based conditional
  hiding, which is a separate existing mechanism).
- Logic engine: implement the `should_be` effect so a rule can force another
  question's answer value, and apply that forced value on the storefront
  exactly as if the customer had clicked that swatch (same color/texture/text
  propagation path as `handleColorSwatchClick`).

Out of scope (explicitly not touched):
- Logic rules whose condition or action targets a "Behind the Scene" **layer**
  directly (rather than a question) — this pathway is already effectively
  inert today (conditions read `selectedAnswers[cond.questionId]`, which is
  never populated for a layer id) and stays that way. Only question-targeted
  `should_be` actions are wired up.
- The WordPress plugin variant (`assets/js/builder.js` /
  `assets/js/storefront.js`) — this is a separate codebase from the Shopify
  app pictured in both screenshots and isn't touched.
- Any visual restyling of the "Behind the scene" panel beyond making nested
  entries clickable (e.g. we are not inverting the grouping to
  question-then-part the way the reference app displays it — parts remain the
  top-level rows, linked questions remain nested underneath, which already
  conveys the same relationship).

## Data model changes (`app/types/configurator.ts`)

- `ThumbnailQuestion.hidden?: boolean`
- `ColorQuestion.hidden?: boolean`
- `evaluateLogicRules()` return type gains `forcedAnswers: Map<string, string>`.
  Built by iterating `should_be` actions on rules whose conditions are met,
  same pattern as the existing `unavailableAnswers` map — later matching rules
  in array order win on conflict (consistent with existing effects).

## Builder UI (`app.configurator-setup.$productId.tsx`)

- New toggle "Behind the scene" in the Thumbnail question detail panel,
  shown only when `displayType === "color"` (same condition that currently
  gates the "Apply on" section, ~line 1031). Wired to `q.hidden`.
- Top Questions list rendering (~line 4237): skip any question where
  `hidden === true`.
- `LayerRow`'s `linkedNames: string[]` prop becomes `linkedItems: {id, name}[]`.
  Each nested `↳ name` entry becomes a clickable element that calls
  `onSelect({ kind: "question", id })`, so a hidden question (or any linked
  question) can still be opened and edited from Behind the scene even though
  it no longer appears in the main list.

## Logic engine + storefront application

- `evaluateLogicRules()` gains a `forcedAnswers` map as described above.
- In both `configurator.$productId.tsx` and `app.configurator.$productId.tsx`
  (admin preview), add a `useEffect` that recomputes `forcedAnswers` whenever
  `selectedAnswers` or `logicRules` change, and for each forced
  `(questionId, value)` pair whose value differs from the question's current
  stored answer, applies it via the same logic `handleColorSwatchClick` uses
  today (updating `selectedAnswers`, and depending on question type/displayType:
  `layerColors`/`layerTextures` for parts, or `textColors` for text questions).
  Guarded so it only writes when the forced value actually changes, to avoid
  render loops.
- `visibleQuestions` filter (`configurator.$productId.tsx:834`) gets an added
  unconditional check: `if ((q as any).hidden) return false;`. This is
  separate from and in addition to the existing Logic-driven
  `hiddenQuestions` conditional check.

## Open behavior decision: default value with no matching rule yet

If a hidden question has no Logic rule forcing a value yet (e.g. mid-setup, or
the merchant never adds one), it will simply never populate
`selectedAnswers[q.id]`, and its linked part/layer keeps whatever base
texture/color it already has — no auto-selection of the first swatch. This
matches how visible questions behave before the customer makes a choice, and
avoids the layer visibly changing color on load without merchant intent.

## Testing

- Manual verification in the builder: toggle a color question hidden, confirm
  it disappears from Questions and appears as a clickable nested entry under
  its "Apply on" part in Behind the scene; click it to confirm it's still
  editable (swatches, Apply on, un-hiding).
- Manual verification on the storefront preview: build a `should_be` rule
  (visible "Body Color" question → hidden "Palm Series Color" should be swatch
  X), change the visible question's answer, confirm the 3D/2D layer for the
  hidden question's applied part updates to match, and confirm the hidden
  question itself never renders as a UI question.
- Confirm `unavailableAnswers`/`hiddenQuestions` behavior (existing effects)
  is unchanged by the `forcedAnswers` addition.
