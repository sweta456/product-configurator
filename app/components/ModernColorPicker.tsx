import { useState, useRef, useEffect, useCallback } from "react";

// ─── Color math ───────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "").padEnd(6, "0").slice(0, 6);
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return [255, 255, 255];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("").toUpperCase();
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = h / 6;
    if (h < 0) h += 1;
  }
  return [h, max === 0 ? 0 : d / max, max];
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const i = Math.floor(h * 6), f = h * 6 - i;
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  let r = 0, g = 0, b = 0;
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// ─── Preset palette ───────────────────────────────────────────────────────────

const PRESETS = [
  "#FF0000", "#FF8C00", "#8B4513", "#C8A96E", "#D2B48C", "#556B2F", "#228B22", "#800000", "#6A0DAD", "#0044FF",
  "#00CED1", "#000000", "#808080", "#A9A9A9", "#D3D3D3", "#FFFFFF", "#FF69B4", "#FFD700", "#87CEEB", "#98FFB3",
];

// ─── ModernColorPicker ────────────────────────────────────────────────────────

export function ModernColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastEmitted = useRef(value);

  const parseHsv = (hex: string): [number, number, number] => {
    const [r, g, b] = hexToRgb(hex || "#FF0000");
    return rgbToHsv(r, g, b);
  };

  const [h, setH] = useState(() => parseHsv(value)[0]);
  const [s, setS] = useState(() => parseHsv(value)[1]);
  const [v, setV] = useState(() => parseHsv(value)[2]);
  const [hexText, setHexText] = useState((value || "#FFFFFF").replace("#", "").toUpperCase());

  // Sync if external value changes
  useEffect(() => {
    if (value && value !== lastEmitted.current) {
      lastEmitted.current = value;
      const [nh, ns, nv] = parseHsv(value);
      setH(nh);
      setS(ns);
      setV(nv);
      setHexText(value.replace("#", "").toUpperCase());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Draw gradient on canvas whenever hue changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width, height } = canvas;
    const [hr, hg, hb] = hsvToRgb(h, 1, 1);

    const hueGrad = ctx.createLinearGradient(0, 0, width, 0);
    hueGrad.addColorStop(0, "#FFFFFF");
    hueGrad.addColorStop(1, `rgb(${hr},${hg},${hb})`);
    ctx.fillStyle = hueGrad;
    ctx.fillRect(0, 0, width, height);

    const darkGrad = ctx.createLinearGradient(0, 0, 0, height);
    darkGrad.addColorStop(0, "rgba(0,0,0,0)");
    darkGrad.addColorStop(1, "rgba(0,0,0,1)");
    ctx.fillStyle = darkGrad;
    ctx.fillRect(0, 0, width, height);
  }, [h]);

  const emit = useCallback((newH: number, newS: number, newV: number) => {
    const [r, g, b] = hsvToRgb(newH, newS, newV);
    const hex = rgbToHex(r, g, b);
    lastEmitted.current = hex;
    setHexText(hex.replace("#", ""));
    onChange(hex);
  }, [onChange]);

  // ── Canvas (saturation × value) interaction ──
  const handleCanvasPointer = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const newS = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      const newV = 1 - Math.max(0, Math.min(1, (ev.clientY - rect.top) / rect.height));
      setS(newS);
      setV(newV);
      emit(h, newS, newV);
    };
    move(e.nativeEvent);
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }, [h, emit]);

  // ── Hue slider interaction ──
  const handleHuePointer = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    const move = (ev: PointerEvent) => {
      const newH = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      setH(newH);
      emit(newH, s, v);
    };
    move(e.nativeEvent);
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }, [s, v, emit]);

  const [r, g, b] = hsvToRgb(h, s, v);
  const [hr, hg, hb] = hsvToRgb(h, 1, 1);
  const currentHex = rgbToHex(r, g, b);

  const handleHexInput = (raw: string) => {
    const clean = raw.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
    setHexText(clean.toUpperCase());
    if (clean.length === 6) {
      const [rr, gg, bb] = hexToRgb("#" + clean);
      const [nh, ns, nv] = rgbToHsv(rr, gg, bb);
      setH(nh); setS(ns); setV(nv);
      const hex = rgbToHex(rr, gg, bb);
      lastEmitted.current = hex;
      onChange(hex);
    }
  };

  const handleRgbInput = (channel: "r" | "g" | "b", val: number) => {
    const clamped = Math.max(0, Math.min(255, val));
    const nr = channel === "r" ? clamped : r;
    const ng = channel === "g" ? clamped : g;
    const nb = channel === "b" ? clamped : b;
    const [nh, ns, nv] = rgbToHsv(nr, ng, nb);
    setH(nh); setS(ns); setV(nv);
    const hex = rgbToHex(nr, ng, nb);
    lastEmitted.current = hex;
    setHexText(hex.replace("#", ""));
    onChange(hex);
  };

  return (
    <div style={{ width: "100%", userSelect: "none" }}>
      {/* ── 2D saturation/value canvas ── */}
      <div style={{ position: "relative", width: "100%", paddingBottom: "60%", borderRadius: 8, overflow: "hidden", marginBottom: 10, cursor: "crosshair" }}>
        <canvas
          ref={canvasRef}
          width={300}
          height={180}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
          onPointerDown={handleCanvasPointer}
        />
        {/* Picker dot */}
        <div
          style={{
            position: "absolute",
            left: `${s * 100}%`,
            top: `${(1 - v) * 100}%`,
            transform: "translate(-50%, -50%)",
            width: 14,
            height: 14,
            borderRadius: "50%",
            border: "2.5px solid #fff",
            boxShadow: "0 0 0 1.5px rgba(0,0,0,0.35)",
            background: currentHex,
            pointerEvents: "none",
          }}
        />
      </div>

      {/* ── Hue slider ── */}
      <div
        onPointerDown={handleHuePointer}
        style={{
          height: 14,
          borderRadius: 7,
          background: "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)",
          position: "relative",
          cursor: "pointer",
          marginBottom: 8,
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: `${h * 100}%`,
            top: "50%",
            transform: "translate(-50%,-50%)",
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: `rgb(${hr},${hg},${hb})`,
            border: "2.5px solid #fff",
            boxShadow: "0 0 0 1.5px rgba(0,0,0,0.25)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* ── Alpha/opacity bar (visual only — brightens color toward white) ── */}
      <div
        style={{
          height: 14,
          borderRadius: 7,
          background: `linear-gradient(to right, rgba(${hr},${hg},${hb},0) 0%, rgb(${hr},${hg},${hb}) 100%)`,
          position: "relative",
          marginBottom: 14,
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
          backgroundImage: `repeating-conic-gradient(#ccc 0% 25%, transparent 0% 50%) 0/12px 12px, linear-gradient(to right, rgba(${hr},${hg},${hb},0), rgb(${hr},${hg},${hb}))`,
        }}
      >
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: `rgb(${hr},${hg},${hb})`,
            border: "2.5px solid #fff",
            boxShadow: "0 0 0 1.5px rgba(0,0,0,0.25)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* ── Hex + RGB inputs ── */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <div style={{ flex: 2, minWidth: 0 }}>
          <input
            value={hexText}
            onChange={(e) => handleHexInput(e.target.value)}
            maxLength={6}
            style={{
              width: "100%", padding: "6px 8px", border: "1px solid #e5e7eb",
              borderRadius: 6, fontSize: 12, fontFamily: "monospace",
              boxSizing: "border-box", textAlign: "center", outline: "none",
            }}
          />
          <div style={{ fontSize: 10, color: "#9ca3af", textAlign: "center", marginTop: 3 }}>Hex</div>
        </div>
        {(["R", "G", "B"] as const).map((ch) => {
          const channelVal = ch === "R" ? r : ch === "G" ? g : b;
          return (
            <div key={ch} style={{ flex: 1, minWidth: 0 }}>
              <input
                type="number"
                min={0}
                max={255}
                value={channelVal}
                onChange={(e) => handleRgbInput(ch.toLowerCase() as "r" | "g" | "b", Number(e.target.value))}
                style={{
                  width: "100%", padding: "6px 4px", border: "1px solid #e5e7eb",
                  borderRadius: 6, fontSize: 12, boxSizing: "border-box", textAlign: "center", outline: "none",
                }}
              />
              <div style={{ fontSize: 10, color: "#9ca3af", textAlign: "center", marginTop: 3 }}>{ch}</div>
            </div>
          );
        })}
      </div>

      {/* ── Preset swatches ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 5 }}>
        {PRESETS.map((preset) => (
          <button
            key={preset}
            title={preset}
            onClick={() => {
              const [rr, gg, bb] = hexToRgb(preset);
              const [nh, ns, nv] = rgbToHsv(rr, gg, bb);
              setH(nh); setS(ns); setV(nv);
              setHexText(preset.replace("#", ""));
              lastEmitted.current = preset;
              onChange(preset);
            }}
            style={{
              width: "100%",
              aspectRatio: "1",
              borderRadius: "50%",
              background: preset,
              border: currentHex.toUpperCase() === preset.toUpperCase()
                ? "2.5px solid #3b82f6"
                : "1.5px solid rgba(0,0,0,0.18)",
              cursor: "pointer",
              padding: 0,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Popup wrapper ─────────────────────────────────────────────────────────────
// Use this where space is tight (e.g. alongside text inputs in the configurator).

export function ColorPickerPopup({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: 34,
          height: 30,
          borderRadius: 6,
          background: value || "#fff",
          border: "1.5px solid #d1d5db",
          cursor: "pointer",
          padding: 0,
          boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
          outline: "none",
          flexShrink: 0,
        }}
        title={value}
      />
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 9999,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
            padding: 14,
            width: 260,
          }}
        >
          <ModernColorPicker value={value} onChange={onChange} />
        </div>
      )}
    </div>
  );
}
