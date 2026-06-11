import { useRef, useState, useEffect } from "react";
import { useFetcher } from "react-router";
import type { LayerConfig } from "../types/configurator";

interface Props {
  glbUrl: string | undefined;
  parts: LayerConfig[];
  selectedPartId?: string | null;
  onPartSelect?: (id: string) => void;
  onGlbUploaded: (url: string, detectedParts: LayerConfig[]) => void;
  onPartsChange: (parts: LayerConfig[]) => void;
}

async function extractMeshNames(glbUrl: string): Promise<string[]> {
  const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
  const { DRACOLoader } = await import("three/examples/jsm/loaders/DRACOLoader.js");

  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
    loader.setDRACOLoader(draco);

    loader.load(
      glbUrl,
      (gltf) => {
        const names: string[] = [];
        gltf.scene.traverse((obj: any) => {
          if (obj.isMesh && obj.name) names.push(obj.name);
        });
        resolve([...new Set(names)]);
      },
      undefined,
      reject,
    );
  });
}

export function GlbPartSetup({ glbUrl, parts, selectedPartId, onPartSelect, onGlbUploaded, onPartsChange }: Props) {
  const fetcher = useFetcher<{ url?: string; error?: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const processedUrl = useRef<string | undefined>(undefined);

  const isUploading = fetcher.state !== "idle";

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtractError(null);
    const fd = new FormData();
    fd.append("file", file);
    fetcher.submit(fd, { method: "post", action: "/app/upload-glb", encType: "multipart/form-data" });
  }

  // React-safe: run side-effects in useEffect, not during render
  useEffect(() => {
    const url = fetcher.data?.url;
    if (!url || url === processedUrl.current) return;
    processedUrl.current = url;
    setExtracting(true);
    setExtractError(null);
    extractMeshNames(url)
      .then((names) => {
        const newParts: LayerConfig[] = names.map((name) => ({
          id: name,
          name: name,
          type: "glb-part" as const,
          src: "",
        }));
        onGlbUploaded(url, newParts);
      })
      .catch((err) => setExtractError("Could not read mesh names: " + (err?.message ?? "unknown error")))
      .finally(() => setExtracting(false));
  }, [fetcher.data?.url]);

  function updatePartName(partId: string, newName: string) {
    onPartsChange(parts.map((p) => (p.id === partId ? { ...p, name: newName } : p)));
  }

  function togglePartCustomizable(partId: string) {
    onPartsChange(
      parts.map((p) => {
        if (p.id !== partId) return p;
        return { ...p, type: p.type === "glb-part" ? ("static" as const) : ("glb-part" as const) };
      }),
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Upload area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: "2px dashed #c4cdd6",
          borderRadius: 8,
          padding: "24px 16px",
          textAlign: "center",
          cursor: isUploading || extracting ? "not-allowed" : "pointer",
          background: "#f9fafb",
          opacity: isUploading || extracting ? 0.6 : 1,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".glb"
          style={{ display: "none" }}
          onChange={handleFileChange}
          disabled={isUploading || extracting}
        />
        {isUploading ? (
          <p style={{ margin: 0, color: "#637381" }}>Uploading .glb file…</p>
        ) : extracting ? (
          <p style={{ margin: 0, color: "#637381" }}>Reading mesh parts…</p>
        ) : glbUrl ? (
          <div>
            <p style={{ margin: "0 0 4px", fontWeight: 600, color: "#202223" }}>
              3D model uploaded ✓
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "#637381" }}>
              {glbUrl.split("/").pop()} — click to replace
            </p>
          </div>
        ) : (
          <div>
            <p style={{ margin: "0 0 4px", fontWeight: 600, color: "#202223" }}>
              Upload a .glb file
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "#637381" }}>
              Mesh parts will be auto-detected
            </p>
          </div>
        )}
      </div>

      {fetcher.data?.error && (
        <p style={{ color: "#d82c0d", margin: 0, fontSize: 13 }}>{fetcher.data.error}</p>
      )}
      {extractError && (
        <p style={{ color: "#d82c0d", margin: 0, fontSize: 13 }}>{extractError}</p>
      )}

      {/* Part list */}
      {parts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: "#637381", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Detected parts ({parts.length})
          </p>
          {parts.map((part) => {
            const isCustomizable = part.type === "glb-part";
            const isSelected = selectedPartId === part.id;
            return (
              <div
                key={part.id}
                onClick={() => isCustomizable && onPartSelect?.(part.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  background: isSelected ? "#eef2ff" : "#fff",
                  border: isSelected ? "1.5px solid #4f46e5" : "1px solid #e1e3e5",
                  borderRadius: 6,
                  opacity: isCustomizable ? 1 : 0.55,
                  cursor: isCustomizable ? "pointer" : "default",
                }}
              >
                <input
                  type="checkbox"
                  checked={isCustomizable}
                  onChange={() => togglePartCustomizable(part.id)}
                  style={{ flexShrink: 0, width: 16, height: 16, cursor: "pointer" }}
                />
                <input
                  type="text"
                  value={part.name}
                  onChange={(e) => updatePartName(part.id, e.target.value)}
                  disabled={!isCustomizable}
                  style={{
                    flex: 1,
                    border: "1px solid transparent",
                    background: "transparent",
                    fontSize: 13,
                    color: "#202223",
                    padding: "2px 4px",
                    borderRadius: 4,
                    outline: "none",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#458fff")}
                  onBlur={(e) => (e.target.style.borderColor = "transparent")}
                />
                <span style={{ fontSize: 11, color: "#637381", flexShrink: 0 }}>
                  {isCustomizable ? "customizable" : "hidden"}
                </span>
              </div>
            );
          })}
          <p style={{ margin: 0, fontSize: 12, color: "#637381" }}>
            Checked parts are visible to customers. Use the mesh ID as the layer ID when creating questions.
          </p>
        </div>
      )}
    </div>
  );
}
