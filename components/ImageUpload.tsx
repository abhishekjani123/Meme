"use client";

import { useCallback, useRef, useState } from "react";

interface ImageUploadProps {
  onImageLoad: (imageData: string, width: number, height: number) => void;
  onTweetTextExtracted?: (text: string) => void;
}

export default function ImageUpload({ onImageLoad, onTweetTextExtracted }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");

  const processImage = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("bruh that's not even an image 💀");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("image too thicc (max 20MB) 🐋");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/process-meme", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to process image");
      }

      const { imageData, width, height } = await res.json();
      const dataUrl = `data:image/jpeg;base64,${imageData}`;
      setPreview(dataUrl);
      onImageLoad(dataUrl, width, height);
    } catch (err) {
      setError(err instanceof Error ? err.message : "something broke lmao");
    } finally {
      setIsProcessing(false);
    }
  }, [onImageLoad]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processImage(file);
    },
    [processImage]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processImage(file);
    },
    [processImage]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = Array.from(e.clipboardData.items);
      const imageItem = items.find((item) => item.type.startsWith("image/"));
      if (imageItem) {
        const file = imageItem.getAsFile();
        if (file) processImage(file);
      }
    },
    [processImage]
  );

  if (preview) {
    return (
      <div className="relative group">
        <div className="relative rounded-xl overflow-hidden border border-[rgba(57,255,20,0.3)]">
          <img
            src={preview}
            alt="Uploaded tweet"
            className="w-full h-auto max-h-[400px] object-contain bg-[#111]"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setPreview(null);
                setFileName("");
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="px-4 py-2 bg-[#e74c3c] text-white rounded-lg font-bold text-sm hover:bg-[#c0392b] transition-colors meme-btn"
            >
              🗑️ YEET IT
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-[#39ff14] text-black rounded-lg font-bold text-sm hover:bg-[#2ecc71] transition-colors meme-btn"
            >
              🔄 SWAP IT
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-[#666] text-center truncate">{fileName}</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    );
  }

  return (
    <div
      className={`upload-zone rounded-xl p-8 text-center cursor-pointer select-none ${isDragging ? "drag-over" : ""}`}
      onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onPaste={handlePaste}
      onClick={() => fileInputRef.current?.click()}
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {isProcessing ? (
        <div className="flex flex-col items-center gap-3">
          <div className="text-4xl animate-spin">⚙️</div>
          <p className="text-[#39ff14] font-bold">PROCESSING YOUR MASTERPIECE...</p>
          <div className="loading-dots text-[#39ff14] text-2xl font-bold">
            <span>.</span><span>.</span><span>.</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="text-6xl animate-float">🐸</div>
          <div>
            <p className="text-xl font-bold text-[#39ff14]">DROP THAT TWEET SCREENSHOT</p>
            <p className="text-[#666] text-sm mt-1">or click to browse • or paste (Ctrl+V)</p>
          </div>
          <div className="flex gap-3 text-xs text-[#444] flex-wrap justify-center">
            <span className="px-2 py-1 bg-[#1a1a1a] rounded">PNG</span>
            <span className="px-2 py-1 bg-[#1a1a1a] rounded">JPG</span>
            <span className="px-2 py-1 bg-[#1a1a1a] rounded">WEBP</span>
            <span className="px-2 py-1 bg-[#1a1a1a] rounded">GIF</span>
            <span className="px-2 py-1 bg-[#1a1a1a] rounded">up to 20MB</span>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-4 text-[#e74c3c] text-sm font-bold animate-shake">{error}</p>
      )}
    </div>
  );
}
