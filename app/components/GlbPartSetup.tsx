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

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      style={{
        position: "relative",
        width: 36,
        height: 20,
        borderRadius: 10,
        border: "none",
        background: checked ? "#4f46e5" : "#d1d5db",
        cursor: "pointer",
        flexShrink: 0,
        transition: "background 0.2s",
        padding: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: checked ? 18 : 2,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          transition: "left 0.2s",
        }}
      />
    </button>
  );
}

export function GlbPartSetup({ glbUrl, parts, selectedPartId, onPartSelect, onGlbUploaded, onPartsChange }: Props) {
  const fetcher = useFetcher<{ url?: string; error?: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const processedUrl = useRef<string | undefined>(undefined);
  const [editingId, setEditingId] = useState<string | null>(null);

  const isUploading = fetcher.state !== "idle";

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtractError(null);
    const fd = new FormData();
    fd.append("file", file);
    fetcher.submit(fd, { method: "post", action: "/app/upload-glb", encType: "multipart/form-data" });
  }

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
          fromGlb: true,
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

  function deletePart(partId: string) {
    onPartsChange(parts.filter((p) => p.id !== partId));
  }

  const visibleParts = parts.filter((p) => p.type === "glb-part");
  const hiddenParts = parts.filter((p) => p.type !== "glb-part");
  const allVisible = parts.length > 0 && visibleParts.length === parts.length;
  const allHidden = parts.length > 0 && hiddenParts.length === parts.length;

  function setAllVisible() {
    onPartsChange(parts.map((p) => ({ ...p, type: "glb-part" as const })));
  }
  function setAllHidden() {
    onPartsChange(parts.map((p) => ({ ...p, type: "static" as const })));
  }

  const isBusy = isUploading || extracting;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Upload zone ── */}
      <div
        onClick={() => !isBusy && fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isBusy ? "#c4cdd6" : glbUrl ? "#4f46e5" : "#c4cdd6"}`,
          borderRadius: 10,
          padding: "20px 16px",
          textAlign: "center",
          cursor: isBusy ? "not-allowed" : "pointer",
          background: glbUrl && !isBusy ? "#f5f3ff" : "#f9fafb",
          transition: "border-color 0.2s, background 0.2s",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".glb"
          style={{ display: "none" }}
          onChange={handleFileChange}
          disabled={isBusy}
        />

        {isUploading ? (
          <div>
            <div style={{ fontSize: 24, marginBottom: 6 }}>⏫</div>
            <p style={{ margin: 0, fontWeight: 600, color: "#4f46e5", fontSize: 13 }}>Uploading…</p>
          </div>
        ) : extracting ? (
          <div>
            <div style={{ fontSize: 24, marginBottom: 6 }}>🔍</div>
            <p style={{ margin: 0, fontWeight: 600, color: "#4f46e5", fontSize: 13 }}>Reading mesh parts…</p>
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#9ca3af" }}>This may take a moment</p>
          </div>
        ) : glbUrl ? (
          <div>
            <div style={{ fontSize: 24, marginBottom: 6 }}>✅</div>
            <p style={{ margin: "0 0 2px", fontWeight: 600, color: "#202223", fontSize: 13 }}>3D model uploaded</p>
            <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>
              {glbUrl.split("/").pop()}
            </p>
            <p style={{ margin: "6px 0 0", fontSize: 11, color: "#4f46e5", fontWeight: 500 }}>Click to replace</p>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📦</div>
            <p style={{ margin: "0 0 4px", fontWeight: 600, color: "#202223", fontSize: 13 }}>Upload your 3D model</p>
            <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>Drag & drop or click to browse · .glb format</p>
          </div>
        )}
      </div>

      {(fetcher.data?.error || extractError) && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", background: "#fff1f0", border: "1px solid #fca5a5", borderRadius: 8 }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
          <p style={{ margin: 0, fontSize: 12, color: "#b91c1c" }}>{fetcher.data?.error || extractError}</p>
        </div>
      )}

      {/* ── Parts section ── */}
      {parts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Header + bulk actions */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#202223" }}>Mesh parts</span>
              <span style={{ marginLeft: 6, fontSize: 12, color: "#9ca3af" }}>{parts.length} detected</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={setAllVisible}
                disabled={allVisible}
                style={{
                  fontSize: 11, padding: "4px 10px", borderRadius: 6, cursor: allVisible ? "default" : "pointer",
                  border: "1px solid #e5e7eb", background: allVisible ? "#f3f4f6" : "#fff",
                  color: allVisible ? "#9ca3af" : "#374151", fontWeight: 500,
                }}
              >
                Show all
              </button>
              <button
                onClick={setAllHidden}
                disabled={allHidden}
                style={{
                  fontSize: 11, padding: "4px 10px", borderRadius: 6, cursor: allHidden ? "default" : "pointer",
                  border: "1px solid #e5e7eb", background: allHidden ? "#f3f4f6" : "#fff",
                  color: allHidden ? "#9ca3af" : "#374151", fontWeight: 500,
                }}
              >
                Hide all
              </button>
            </div>
          </div>

          {/* Summary bar */}
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1, padding: "8px 12px", background: "#f0fdf4", borderRadius: 8, border: "1px solid #bbf7d0" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#16a34a" }}>{visibleParts.length}</div>
              <div style={{ fontSize: 11, color: "#4ade80", fontWeight: 500 }}>Visible to customers</div>
            </div>
            <div style={{ flex: 1, padding: "8px 12px", background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#6b7280" }}>{hiddenParts.length}</div>
              <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>Behind the scene</div>
            </div>
          </div>

          {/* Visible parts */}
          {visibleParts.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>Visible to customers</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {visibleParts.map((part) => (
                  <PartRow
                    key={part.id}
                    part={part}
                    isSelected={selectedPartId === part.id}
                    isEditing={editingId === part.id}
                    onToggle={() => togglePartCustomizable(part.id)}
                    onSelect={() => onPartSelect?.(part.id)}
                    onNameChange={(name) => updatePartName(part.id, name)}
                    onEditStart={() => setEditingId(part.id)}
                    onEditEnd={() => setEditingId(null)}
                    onDelete={() => deletePart(part.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Hidden parts */}
          {hiddenParts.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#d1d5db", flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>Behind the scene</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {hiddenParts.map((part) => (
                  <PartRow
                    key={part.id}
                    part={part}
                    isSelected={false}
                    isEditing={editingId === part.id}
                    onToggle={() => togglePartCustomizable(part.id)}
                    onSelect={() => {}}
                    onNameChange={(name) => updatePartName(part.id, name)}
                    onEditStart={() => setEditingId(part.id)}
                    onEditEnd={() => setEditingId(null)}
                    onDelete={() => deletePart(part.id)}
                  />
                ))}
              </div>
            </div>
          )}

          <p style={{ margin: 0, fontSize: 11, color: "#9ca3af", lineHeight: 1.5 }}>
            Toggle parts on to make them customisable by customers. Hidden parts are always shown but cannot be changed.
          </p>
        </div>
      )}
    </div>
  );
}

function PartRow({
  part, isSelected, isEditing, onToggle, onSelect, onNameChange, onEditStart, onEditEnd, onDelete,
}: {
  part: LayerConfig;
  isSelected: boolean;
  isEditing: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onNameChange: (name: string) => void;
  onEditStart: () => void;
  onEditEnd: () => void;
  onDelete: () => void;
}) {
  const isVisible = part.type === "glb-part";
  const inputRef = useRef<HTMLInputElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (isEditing) inputRef.current?.select();
  }, [isEditing]);

  // Auto-cancel confirm after 3 seconds if user doesn't act
  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 3000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  return (
    <div
      onClick={() => isVisible && !confirmDelete && onSelect()}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 12px",
        background: confirmDelete ? "#fff1f0" : isSelected ? "#eef2ff" : isVisible ? "#fff" : "#fafafa",
        border: confirmDelete ? "1.5px solid #fca5a5" : isSelected ? "1.5px solid #4f46e5" : "1px solid #e5e7eb",
        borderRadius: 8,
        cursor: isVisible && !confirmDelete ? "pointer" : "default",
        transition: "background 0.15s, border-color 0.15s",
        opacity: isVisible ? 1 : 0.6,
      }}
    >
      {/* 3D part icon */}
      <span
        style={{
          width: 28, height: 28, borderRadius: 6, flexShrink: 0,
          background: confirmDelete ? "#fee2e2" : isVisible ? "#ede9fe" : "#f3f4f6",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14,
        }}
      >
        🧩
      </span>

      {/* Name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {confirmDelete ? (
          <span style={{ fontSize: 12, color: "#b91c1c", fontWeight: 500 }}>Delete this part?</span>
        ) : isEditing ? (
          <input
            ref={inputRef}
            value={part.name}
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={onEditEnd}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") onEditEnd(); }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", border: "1px solid #4f46e5", borderRadius: 4,
              fontSize: 13, padding: "2px 6px", outline: "none", boxSizing: "border-box",
              background: "#fff", color: "#202223",
            }}
          />
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <span style={{ fontSize: 13, color: "#202223", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {part.name}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onEditStart(); }}
              title="Rename"
              style={{ background: "none", border: "none", cursor: "pointer", padding: "0 2px", color: "#9ca3af", fontSize: 11, flexShrink: 0, lineHeight: 1 }}
            >
              ✎
            </button>
          </div>
        )}
        {!confirmDelete && (
          <span style={{ fontSize: 10, color: "#9ca3af", fontFamily: "monospace" }}>{part.id}</span>
        )}
      </div>

      {/* Actions */}
      {confirmDelete ? (
        <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            style={{ fontSize: 11, padding: "4px 10px", borderRadius: 5, border: "none", background: "#ef4444", color: "#fff", cursor: "pointer", fontWeight: 600 }}
          >
            Delete
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
            style={{ fontSize: 11, padding: "4px 10px", borderRadius: 5, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", cursor: "pointer" }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <ToggleSwitch checked={isVisible} onChange={onToggle} />
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
            title="Delete part"
            style={{ background: "none", border: "none", cursor: "pointer", padding: "3px 4px", color: "#d1d5db", fontSize: 14, lineHeight: 1, borderRadius: 4, transition: "color 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#d1d5db")}
          >
            🗑
          </button>
        </div>
      )}
    </div>
  );
}
