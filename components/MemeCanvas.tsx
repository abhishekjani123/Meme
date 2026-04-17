"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface TextStyle {
  topText: string;
  bottomText: string;
  fontSize: number;
  fontColor: string;
  strokeColor: string;
  strokeWidth: number;
  textPosition: "classic" | "bottom-only" | "top-only" | "center";
  fontFamily: string;
  textShadow: boolean;
  allCaps: boolean;
  rainbow: boolean;
}

interface MemeCanvasProps {
  imageData: string;
  imageWidth: number;
  imageHeight: number;
  textStyle: TextStyle;
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
}

const FONTS = [
  { label: "Impact (Classic)", value: "Impact, Arial Black, sans-serif" },
  { label: "Arial Black", value: "'Arial Black', Gadget, sans-serif" },
  { label: "Comic Sans (cursed)", value: "'Comic Sans MS', cursive" },
  { label: "Courier (hacker)", value: "'Courier New', monospace" },
  { label: "Papyrus (legendary)", value: "Papyrus, fantasy" },
];

export { FONTS };

export default function MemeCanvas({
  imageData,
  imageWidth,
  imageHeight,
  textStyle,
  onCanvasReady,
}: MemeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(false);

  const drawMeme = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageData) return;

    setIsRendering(true);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = imageWidth;
      canvas.height = imageHeight;

      // Draw base image
      ctx.drawImage(img, 0, 0, imageWidth, imageHeight);

      const text = {
        top: textStyle.allCaps ? textStyle.topText.toUpperCase() : textStyle.topText,
        bottom: textStyle.allCaps ? textStyle.bottomText.toUpperCase() : textStyle.bottomText,
      };

      const fontSize = Math.max(
        20,
        Math.min(textStyle.fontSize, Math.floor(imageWidth / 8))
      );

      ctx.font = `900 ${fontSize}px ${textStyle.fontFamily}`;
      ctx.textAlign = "center";
      ctx.lineJoin = "round";

      const drawText = (str: string, x: number, y: number) => {
        if (!str.trim()) return;

        // Word wrap
        const maxWidth = imageWidth * 0.9;
        const words = str.split(" ");
        const lines: string[] = [];
        let current = "";

        for (const word of words) {
          const test = current ? `${current} ${word}` : word;
          if (ctx.measureText(test).width > maxWidth && current) {
            lines.push(current);
            current = word;
          } else {
            current = test;
          }
        }
        if (current) lines.push(current);

        lines.forEach((line, i) => {
          const lineY = y + i * (fontSize * 1.2);

          if (textStyle.textShadow) {
            ctx.shadowColor = "rgba(0,0,0,0.8)";
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 3;
          }

          // Stroke (outline)
          ctx.strokeStyle = textStyle.strokeColor;
          ctx.lineWidth = textStyle.strokeWidth;
          ctx.strokeText(line, x, lineY);

          // Fill
          if (textStyle.rainbow) {
            const gradient = ctx.createLinearGradient(
              x - ctx.measureText(line).width / 2,
              lineY - fontSize,
              x + ctx.measureText(line).width / 2,
              lineY
            );
            gradient.addColorStop(0, "#ff0000");
            gradient.addColorStop(0.2, "#ff8800");
            gradient.addColorStop(0.4, "#ffff00");
            gradient.addColorStop(0.6, "#00ff00");
            gradient.addColorStop(0.8, "#0088ff");
            gradient.addColorStop(1, "#8800ff");
            ctx.fillStyle = gradient;
          } else {
            ctx.fillStyle = textStyle.fontColor;
          }

          ctx.fillText(line, x, lineY);
          ctx.shadowColor = "transparent";
        });

        return lines.length;
      };

      const padding = fontSize * 0.8;
      const cx = imageWidth / 2;

      if (textStyle.textPosition === "classic" || textStyle.textPosition === "top-only") {
        drawText(text.top, cx, padding + fontSize);
      }

      if (textStyle.textPosition === "classic" || textStyle.textPosition === "bottom-only") {
        // Count lines for bottom text positioning
        const maxWidth = imageWidth * 0.9;
        const words = text.bottom.split(" ");
        let lineCount = 1;
        let current = "";
        for (const word of words) {
          const test = current ? `${current} ${word}` : word;
          if (ctx.measureText(test).width > maxWidth && current) {
            lineCount++;
            current = word;
          } else {
            current = test;
          }
        }
        const bottomY = imageHeight - padding - (lineCount - 1) * fontSize * 1.2;
        drawText(text.bottom, cx, bottomY);
      }

      if (textStyle.textPosition === "center") {
        const midY = imageHeight / 2;
        drawText(text.top, cx, midY - fontSize / 2);
        if (text.bottom) {
          drawText(text.bottom, cx, midY + fontSize);
        }
      }

      setIsRendering(false);
      onCanvasReady(canvas);
    };

    img.src = imageData;
  }, [imageData, imageWidth, imageHeight, textStyle, onCanvasReady]);

  useEffect(() => {
    drawMeme();
  }, [drawMeme]);

  return (
    <div className="relative">
      {isRendering && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg z-10">
          <div className="text-[#39ff14] font-bold animate-pulse">RENDERING DANKNESS...</div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="w-full h-auto rounded-lg"
        style={{ maxHeight: "500px", objectFit: "contain" }}
      />
    </div>
  );
}
