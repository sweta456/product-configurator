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
