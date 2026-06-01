import { useEffect, useState } from "react";
import { Image as KonvaImage } from "react-konva";
import useImage from "use-image";

interface ProductLayerProps {
  src: string;
  color?: string;
  textureUrl?: string; // if provided, tile/stretch this image as the fill instead of a flat color
  width?: number;
  height?: number;
}

function useColorizedLayer(
  src: string,
  color: string | undefined,
  textureUrl: string | undefined,
  width: number,
  height: number,
) {
  const [sourceImage] = useImage(src, "anonymous");
  const [textureImage] = useImage(textureUrl || "", "anonymous");
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!sourceImage) {
      setCanvas(null);
      return;
    }
    if (!color && !textureUrl) {
      setCanvas(null);
      return;
    }

    const offscreen = document.createElement("canvas");
    offscreen.width = width;
    offscreen.height = height;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return;

    if (textureUrl && textureImage) {
      // Draw texture stretched over the canvas, then mask with the layer PNG alpha
      ctx.drawImage(textureImage, 0, 0, width, height);
    } else if (color) {
      // Flat colour fill, then mask with the layer PNG alpha
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, height);
    }

    // destination-in: keep only pixels that overlap with the layer PNG's alpha channel
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(sourceImage, 0, 0, width, height);

    setCanvas(offscreen);
  }, [sourceImage, textureImage, color, textureUrl, width, height]);

  return { sourceImage, canvas };
}

export default function ProductLayer({
  src,
  color,
  textureUrl,
  width = 900,
  height = 900,
}: ProductLayerProps) {
  const { sourceImage, canvas } = useColorizedLayer(src, color, textureUrl, width, height);

  const hasEffect = color || textureUrl;
  const imageSource = hasEffect ? canvas : sourceImage;

  if (!imageSource) return null;

  return (
    <KonvaImage
      image={imageSource as any}
      x={0}
      y={0}
      width={width}
      height={height}
      listening={false}
    />
  );
}
