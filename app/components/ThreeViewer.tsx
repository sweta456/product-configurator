import { useRef, useState, useEffect, forwardRef, useImperativeHandle, useMemo, Suspense, Component, type ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Bounds, useBounds } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneScene } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { LayerConfig } from "../types/configurator";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PartCustomization {
  color?: string;
  textureUrl?: string;
  text?: string;
  textColor?: string;
  textSize?: number;
  textFont?: string;
  logoImage?: HTMLImageElement | null;
}

export interface ThreeViewerHandle {
  toDataURL: () => string;
}

// ─── Canvas texture builder ───────────────────────────────────────────────────

function buildCanvasTexture(custom: PartCustomization): THREE.CanvasTexture | null {
  const { text, textColor, textSize, textFont, logoImage } = custom;
  if (!text && !logoImage) return null;

  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);

  if (logoImage) {
    const aspect = logoImage.naturalWidth / logoImage.naturalHeight;
    const w = aspect >= 1 ? size * 0.6 : size * 0.6 * aspect;
    const h = aspect >= 1 ? (size * 0.6) / aspect : size * 0.6;
    ctx.drawImage(logoImage, (size - w) / 2, (size - h) / 2, w, h);
  }

  if (text) {
    ctx.font = `${textSize ?? 64}px ${textFont ?? "Arial"}`;
    ctx.fillStyle = textColor ?? "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, size / 2, size / 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ─── Per-mesh material updater ────────────────────────────────────────────────

function MeshApplier({
  mesh,
  custom,
  loader,
  isHighlighted,
  isHovered,
}: {
  mesh: THREE.Mesh;
  custom: PartCustomization;
  loader: THREE.TextureLoader;
  isHighlighted: boolean;
  isHovered?: boolean;
}) {
  useEffect(() => {
    const mats = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as THREE.MeshStandardMaterial[];
    for (const mat of mats) {
      if (!mat) continue;
      if (custom.color) {
        mat.color.set(custom.color);
      }
      if (isHighlighted && !custom.text && !custom.logoImage) {
        // Admin selection: purple glow
        mat.emissive.set("#4f46e5");
        mat.emissiveIntensity = 0.4;
        mat.needsUpdate = true;
      } else if (isHovered && !custom.text && !custom.logoImage) {
        // Storefront hover: teal pulse to show which part this section affects
        mat.emissive.set("#22d3ee");
        mat.emissiveIntensity = 0.35;
        mat.needsUpdate = true;
      } else if (!custom.text && !custom.logoImage) {
        mat.emissive.set("#000000");
        mat.emissiveIntensity = 0;
        mat.needsUpdate = true;
      }
    }
  }, [mesh, custom.color, isHighlighted, isHovered]);

  useEffect(() => {
    if (!custom.textureUrl) return;
    const mats = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as THREE.MeshStandardMaterial[];
    let cancelled = false;

    loader.load(custom.textureUrl, (tex) => {
      if (cancelled) { tex.dispose(); return; }
      for (const mat of mats) {
        if (!mat) continue;
        const old = mat.map;
        mat.map = tex;
        mat.needsUpdate = true;
        old?.dispose();
      }
    });

    return () => { cancelled = true; };
  }, [mesh, custom.textureUrl, loader]);

  useEffect(() => {
    const mats = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as THREE.MeshStandardMaterial[];
    const canvasTex = buildCanvasTexture(custom);

    for (const mat of mats) {
      if (!mat) continue;
      if (canvasTex) {
        const old = mat.emissiveMap;
        mat.emissiveMap = canvasTex;
        mat.emissive.set("#ffffff");
        mat.emissiveIntensity = 1;
        mat.needsUpdate = true;
        old?.dispose();
      } else if (mat.emissiveMap) {
        mat.emissiveMap.dispose();
        mat.emissiveMap = null;
        mat.emissive.set("#000000");
        mat.needsUpdate = true;
      }
    }

    return () => { canvasTex?.dispose(); };
  }, [mesh, custom.text, custom.textColor, custom.textSize, custom.textFont, custom.logoImage]);

  return null;
}

// ─── Auto-fit helper: fits camera after scene loads ──────────────────────────

function AutoFit() {
  const bounds = useBounds();
  useEffect(() => {
    bounds.refresh().fit();
  }, []);
  return null;
}

// ─── GLB scene ────────────────────────────────────────────────────────────────

interface SceneProps {
  glbUrl: string;
  parts: LayerConfig[];
  customizations: Record<string, PartCustomization>;
  selectedPartId?: string | null;
  hoveredPartIds?: string[];
  onPartClick?: (meshName: string) => void;
}

function GlbScene({ glbUrl, parts, customizations, selectedPartId, hoveredPartIds, onPartClick }: SceneProps) {
  const { scene: rawScene } = useGLTF(glbUrl);
  const textureLoader = useMemo(() => new THREE.TextureLoader(), []);

  const scene = useMemo(() => cloneScene(rawScene) as THREE.Group, [rawScene]);

  const meshMap = useMemo(() => {
    const map: Record<string, THREE.Mesh> = {};
    scene.traverse((obj: THREE.Object3D) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh && mesh.name) {
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((m) => m.clone());
        } else {
          mesh.material = mesh.material.clone();
        }
        map[mesh.name] = mesh;
      }
    });
    return map;
  }, [scene]);

  const glbPartIds = parts.filter((p) => p.type === "glb-part").map((p) => p.id);

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 7]} intensity={1.2} />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} />

      {/* Bounds auto-fits the camera to wrap the entire model on load */}
      <Bounds fit clip observe margin={1.4}>
        <primitive
          object={scene}
          onClick={(e: any) => {
            e.stopPropagation();
            const clickedName = e.object?.name as string | undefined;
            if (clickedName && onPartClick) onPartClick(clickedName);
          }}
        />
        <AutoFit />
      </Bounds>

      {glbPartIds.map((id) => {
        const mesh = meshMap[id];
        if (!mesh) return null;
        return (
          <MeshApplier
            key={id}
            mesh={mesh}
            custom={customizations[id] ?? {}}
            loader={textureLoader}
            isHighlighted={selectedPartId === id}
            isHovered={hoveredPartIds?.includes(id)}
          />
        );
      })}
    </>
  );
}

// ─── Model load error boundary ───────────────────────────────────────────────
// useGLTF throws when the .glb fetch fails (e.g. a 404). Suspense only covers
// the loading state, not errors, so without this the failure crashes the
// entire page instead of just this viewer.

interface ModelErrorBoundaryState {
  hasError: boolean;
}

class ModelErrorBoundary extends Component<{ children: ReactNode; onError: () => void }, ModelErrorBoundaryState> {
  state: ModelErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Failed to load 3D model:", error);
    this.props.onError();
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

// ─── Public component ─────────────────────────────────────────────────────────

interface ThreeViewerProps {
  glbUrl: string;
  parts: LayerConfig[];
  customizations: Record<string, PartCustomization>;
  width?: number;
  height?: number;
  /** Admin only: currently selected part ID for highlight */
  selectedPartId?: string | null;
  /** Storefront: part IDs to glow on sidebar section hover */
  hoveredPartIds?: string[];
  /** Admin only: called when customer clicks a mesh in the 3D view */
  onPartClick?: (meshName: string) => void;
}

export const ThreeViewer = forwardRef<ThreeViewerHandle, ThreeViewerProps>(
  function ThreeViewer({ glbUrl, parts, customizations, width = 560, height = 560, selectedPartId, hoveredPartIds, onPartClick }, ref) {
    const glRef = useRef<THREE.WebGLRenderer | null>(null);
    const [modelError, setModelError] = useState(false);

    useImperativeHandle(ref, () => ({
      toDataURL: () => glRef.current?.domElement.toDataURL("image/png") ?? "",
    }));

    if (modelError) {
      return (
        <div style={{
          width, height, borderRadius: 8, overflow: "hidden", background: "#f9fafb",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 8, padding: 20, boxSizing: "border-box", textAlign: "center",
        }}>
          <span style={{ fontSize: 28 }} aria-hidden="true">⚠️</span>
          <span style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>
            Unable to load the 3D preview
          </span>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>
            Please contact the store if this keeps happening.
          </span>
        </div>
      );
    }

    return (
      <div style={{ width, height, borderRadius: 8, overflow: "hidden", background: "#ffffff", cursor: "grab" }}>
        <Canvas
          gl={{ preserveDrawingBuffer: true }}
          camera={{ position: [0, 0, 5], fov: 45 }}
          style={{ width: "100%", height: "100%" }}
          onCreated={({ gl }) => { glRef.current = gl; }}
        >
          <ModelErrorBoundary onError={() => setModelError(true)}>
            <Suspense fallback={null}>
              <GlbScene
                glbUrl={glbUrl}
                parts={parts}
                customizations={customizations}
                selectedPartId={selectedPartId}
                hoveredPartIds={hoveredPartIds}
                onPartClick={onPartClick}
              />
            </Suspense>
          </ModelErrorBoundary>
          <OrbitControls makeDefault enablePan={false} minDistance={0.5} maxDistance={20} />
        </Canvas>
      </div>
    );
  },
);
