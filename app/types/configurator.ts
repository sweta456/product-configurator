export interface LayerAnswer {
  id: string;
  label: string;
  value?: string;
  imageUrl?: string;
  viewImages?: (string | null)[];
  thumbnailUrl?: string;
  description?: string;
  productionCode?: string;
  fontSize?: number;
  outlineSize?: number;
  outlineColor?: string;
}

export interface LayerConfig {
  id: string;
  name: string;
  type: "static" | "colorable" | "glb-part";
  src: string;
  displayType?: string;
  answers?: LayerAnswer[];
  applyOn?: string[];
  extraViews?: string[];
  defaultColor?: string;
  fromGlb?: boolean;
}

/** Returns the image URL for a given view index (0-based). Falls back gracefully. */
export function getLayerSrc(layer: LayerConfig, viewIndex: number, answerIdx = 0): string {
  // Answer-based layers store per-view images in answers[].viewImages[], not src/extraViews
  if (!layer.src && layer.answers?.length) {
    const answer = layer.answers[answerIdx] ?? layer.answers[0];
    if (answer?.viewImages?.length) {
      const slot = answer.viewImages[viewIndex];
      if (slot != null && slot !== "") return slot;
      // Only fall back to another view's image when NO view has been configured yet.
      // If at least one view has an image, this layer is multi-view — return nothing for
      // unconfigured views so a Front-only image never bleeds onto Back/Side/Detail.
      const hasAnyConfiguredView = answer.viewImages.some((v) => v != null && v !== "");
      if (hasAnyConfiguredView) return "";
      return answer.viewImages.find((v) => v != null && v !== "") ?? "";
    }
    // Single-view imageUrl fallback — show on every view
    return answer?.imageUrl ?? "";
  }
  if (viewIndex === 0) return layer.src;
  // No extraViews at all → single-view layer; show src on every view.
  if (!layer.extraViews) return layer.src;
  const extraSlot = layer.extraViews[viewIndex - 1];
  if (extraSlot != null && extraSlot !== "") return extraSlot;
  // Has extraViews array: only fall back to src when no extra-view slot has been set.
  // This prevents a Front-only image from incorrectly appearing on Back/Side/Detail views
  // when those views have separate layer images.
  const hasAnyExtraViewSet = layer.extraViews.some((v) => v != null && v !== "");
  return hasAnyExtraViewSet ? "" : layer.src;
}

export interface ColorSwatch {
  value: string;
  label: string;
  imageUrl?: string;
  viewImages?: (string | null)[];
  description?: string;
  productionCode?: string;
  lighting?: boolean;
  lightingBrightness?: number;
  lightingIntensity?: number;
}

export type Condition = { questionId: string; value: string };

export type LogicOperator = "is" | "is_not" | "matches" | "doesnt_match";
export type LogicEffect =
  | "should_be"
  | "should_not_be"
  | "should_be_unavailable"
  | "should_be_one_of"
  | "should_not_be_one_of";

export interface LogicCondition {
  questionId: string;
  operator: LogicOperator;
  value: string;
}

export interface LogicAction {
  questionId: string;
  effect: LogicEffect;
  value?: string;
}

export interface LogicRule {
  id: string;
  conditions: LogicCondition[];
  actions: LogicAction[];
}

export interface ConfiguratorStyle {
  swatchShape: "circle" | "rounded" | "square";
  swatchSize: "sm" | "md" | "lg";
  thumbnailShape: "circle" | "rounded" | "square";
  thumbnailSize: "sm" | "md" | "lg";
  choiceStyle: "pill" | "card" | "classic";
  accentColor: string;
  buttonRadius: "default" | "pill" | "square";
  showLabels: boolean;
}

export const DEFAULT_STYLE: ConfiguratorStyle = {
  swatchShape: "rounded",
  swatchSize: "md",
  thumbnailShape: "rounded",
  thumbnailSize: "md",
  choiceStyle: "pill",
  accentColor: "#5c6ac4",
  buttonRadius: "default",
  showLabels: false,
};

export interface AppSettings {
  globalTextColor: string;
  swatchShape: "circle" | "rounded" | "square";
  swatchSize: "sm" | "md" | "lg";
  spaceBetweenOptions: number;
  marginTop: number;
  marginLeft: number;
  marginRight: number;
  marginBottom: number;
  optionFieldLeftMargin: number;
  subOptionLeftMargin: number;
  disableZoom: boolean;
  disableShadow: boolean;
  cartAction: "redirect_cart" | "open_cart" | "nothing";
  tempProductLifetime: "15min" | "30min" | "1h" | "2h" | "4h" | "never";
  tempProductPrefix: string;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  globalTextColor: "#333333",
  swatchShape: "rounded",
  swatchSize: "md",
  spaceBetweenOptions: 10,
  marginTop: 8,
  marginLeft: 0,
  marginRight: 0,
  marginBottom: 8,
  optionFieldLeftMargin: 10,
  subOptionLeftMargin: 55,
  disableZoom: false,
  disableShadow: false,
  cartAction: "redirect_cart",
  tempProductLifetime: "30min",
  tempProductPrefix: "[CUSTOM]",
};

export interface ColorQuestion {
  id: string;
  name: string;
  type: "color";
  displayType?: "none" | "color" | "text-color";
  linkedLayerId?: string;
  swatches: ColorSwatch[];
  conditions?: Condition[];
}

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
}

export interface TextQuestion {
  id: string;
  name: string;
  type: "text";
  displayType?: "none" | "text";
  defaultText: string;
  defaultColor: string;
  defaultFontSize: number;
  defaultFontFamily: string;
  textAlign?: "left" | "center" | "right";
  position: { x: number; y: number };
  rotation?: number;
  printAreaId?: string;
  printArea?: PrintArea;
  allowedTransforms?: { move: boolean; resize: boolean; rotate: boolean };
  maxChars?: number;
  conditions?: Condition[];
}

export interface PrintArea {
  id: string;
  name: string;
  customerEditingView: number;
  dpi: number;
  units: "in" | "cm" | "px";
  width: number;
  height: number;
  bleedArea: number;
  showQualityIndicator: boolean;
  safeAreaWidth: number;
  safeAreaHeight: number;
  outlineColor: string;
  showOutline: boolean;
  clipToLayerId?: string;
  visibleViews: number[];
  x: number;
  y: number;
  rotation?: number;
}

export interface LogoAnswer {
  id: string;
  label: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  description?: string;
  productionCode?: string;
}

export interface FileQuestion {
  id: string;
  name: string;
  type: "file";
  displayType?: "none" | "logo";
  position: { x: number; y: number };
  defaultWidth: number;
  defaultHeight: number;
  printAreas?: PrintArea[];
  allowedTransforms?: { move: boolean; resize: boolean; rotate: boolean };
  answers?: LogoAnswer[];
  conditions?: Condition[];
}

export interface DropdownOption {
  value: string;
  label: string;
  imageUrl?: string;
  viewImages?: (string | null)[];
  thumbnailUrl?: string;
  description?: string;
  productionCode?: string;
}

export interface DropdownQuestion {
  id: string;
  name: string;
  type: "dropdown";
  displayType?: "none" | "image";
  multipleSelection?: boolean;
  options: DropdownOption[];
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

export interface LabelAnswer {
  value: string;
  label: string;
  imageUrl?: string;
  viewImages?: (string | null)[];
  description?: string;
  productionCode?: string;
}

export interface LabelQuestion {
  id: string;
  name: string;
  type: "label";
  content: string;
  answers?: LabelAnswer[];
  displayType?: string;
  multipleSelection?: boolean;
  conditions?: Condition[];
}

export interface GroupQuestion {
  id: string;
  name: string;
  type: "group";
  childIds: string[];
  conditions?: Condition[];
}

export interface NoneQuestion {
  id: string;
  name: string;
  type: "none";
  displayType?: string;
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
  | GroupQuestion
  | NoneQuestion;

export type InputType = Question["type"];

export function getQuestionAnswers(q: Question): { value: string; label: string }[] {
  switch (q.type) {
    case "color":
    case "thumbnail":
      return q.swatches.map((s) => ({ value: s.value, label: s.label }));
    case "radio":
      return q.options;
    case "dropdown":
      return q.options.map((o) => ({ value: o.value, label: o.label }));
    case "checkbox":
      return [
        { value: "true", label: q.checkedLabel || "Yes" },
        { value: "false", label: q.uncheckedLabel || "No" },
      ];
    case "label":
      return (q.answers ?? []).map((a) => ({ value: a.value, label: a.label }));
    default:
      return [];
  }
}

export function evaluateLogicRules(
  rules: LogicRule[],
  selectedAnswers: Record<string, string>,
): { hiddenQuestions: Set<string>; unavailableAnswers: Map<string, Set<string>> } {
  const hiddenQuestions = new Set<string>();
  const unavailableAnswers = new Map<string, Set<string>>();

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
      }
    }
  }

  return { hiddenQuestions, unavailableAnswers };
}

export type PriceOperator = "+" | "-" | "×" | "÷";

export interface ExtraPrice {
  id: string;
  questionId: string;
  answerId: string;
  price: number;
}

export interface EquationLine {
  id: string;
  type: "question" | "number";
  questionId?: string;
  numberValue?: number;
}

export interface Equation {
  id: string;
  displayCumulative: boolean;
  lines: EquationLine[];
  operators: PriceOperator[];
  minResult: number | null;
  maxResult: number | null;
}

export interface PricingData {
  basePrice: number;
  displayTaxes: boolean;
  extraPrices: ExtraPrice[];
  equations: Equation[];
}

export const DEFAULT_PRICING: PricingData = {
  basePrice: 0,
  displayTaxes: false,
  extraPrices: [],
  equations: [],
};

/**
 * Single source of truth for configurator pricing math -- used both for the
 * live on-screen total and the authoritative server-side charge, so the two
 * can never drift apart.
 */
export function computeConfiguratorPrice(
  pricing: PricingData,
  selectedAnswers: Record<string, string>,
): number {
  const extraPriceForQuestion = (questionId: string): number => {
    const answerId = selectedAnswers[questionId];
    if (!answerId) return 0;
    const match = pricing.extraPrices.find(
      (ep) => ep.questionId === questionId && ep.answerId === answerId,
    );
    return match?.price ?? 0;
  };

  let total = pricing.basePrice;

  for (const ep of pricing.extraPrices) {
    if (selectedAnswers[ep.questionId] === ep.answerId) {
      total += ep.price;
    }
  }

  for (const eq of pricing.equations) {
    if (eq.lines.length === 0) continue;

    const lineValue = (line: EquationLine): number =>
      line.type === "number"
        ? (line.numberValue ?? 0)
        : extraPriceForQuestion(line.questionId ?? "");

    let result = lineValue(eq.lines[0]);
    for (let i = 1; i < eq.lines.length; i++) {
      const op = eq.operators[i - 1] ?? "+";
      const value = lineValue(eq.lines[i]);
      if (op === "+") result += value;
      else if (op === "-") result -= value;
      else if (op === "×") result *= value;
      else if (op === "÷") result = value === 0 ? result : result / value;
    }

    const min = eq.minResult ?? -Infinity;
    const max = eq.maxResult ?? Infinity;
    result = Math.min(Math.max(result, min), max);

    total += result;
  }

  return Math.round(total * 100) / 100;
}

const ALL_DISPLAY_TYPES = ["none", "image", "color", "logo", "text", "font", "font-size", "text-color", "text-outline"] as const;
const VISUAL_DISPLAY_TYPES = ["image", "color", "logo", "text", "font", "font-size", "text-color", "text-outline"] as const;

export const DISPLAY_TYPE_MAP: Record<InputType, string[]> = {
  thumbnail: [...ALL_DISPLAY_TYPES],
  color:     ["none", "color", "text-color"],
  text:      ["none", "text"],
  file:      ["none", "logo"],
  dropdown:  [...ALL_DISPLAY_TYPES],
  radio:     [...ALL_DISPLAY_TYPES],
  checkbox:  [...ALL_DISPLAY_TYPES],
  label:     [...ALL_DISPLAY_TYPES],
  group:     ["none"],
  none:      [...VISUAL_DISPLAY_TYPES],
};

export const DISPLAY_TYPE_META: Record<string, { label: string; icon: string; desc?: string }> = {
  none:         { label: "None",         icon: "⊘",  desc: "Not shown on product" },
  image:        { label: "Image",        icon: "🏔" },
  color:        { label: "Color",        icon: "💧" },
  logo:         { label: "Logo",         icon: "⭐" },
  text:         { label: "Text",         icon: "T"  },
  font:         { label: "Font",         icon: "F"  },
  "font-size":  { label: "Font size",    icon: "↕"  },
  "text-color": { label: "Text color",   icon: "A"  },
  "text-outline":{ label: "Text outline", icon: "Ā" },
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
  none: "None",
};

export interface ConfigOptions {
  questions: Question[];
  productImageUrl?: string;
  productHandle?: string;
  numViews?: number;
  logicRules?: LogicRule[];
  modelMode?: boolean;
  glbUrl?: string;
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
    defaultFontSize: 38,
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
      defaultFontSize: options.textOption.defaultFontSize || 38,
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
