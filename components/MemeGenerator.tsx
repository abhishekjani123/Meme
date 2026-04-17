"use client";

import { useCallback, useRef, useState } from "react";
import ImageUpload from "./ImageUpload";
import MemeCanvas from "./MemeCanvas";
import MemeControls from "./MemeControls";
import type { TextStyle } from "./MemeCanvas";
import type { MemeCaption } from "@/lib/claude";

const DEFAULT_STYLE: TextStyle = {
  topText: "",
  bottomText: "",
  fontSize: 48,
  fontColor: "#ffffff",
  strokeColor: "#000000",
  strokeWidth: 4,
  textPosition: "classic",
  fontFamily: "Impact, Arial Black, sans-serif",
  textShadow: false,
  allCaps: true,
  rainbow: false,
};

const MEME_STYLES = [
  { value: "dank", label: "🐸 Ultra Dank", desc: "Surreal & absurdist" },
  { value: "edgy", label: "💀 Dark Humor", desc: "Edge lord approved" },
  { value: "relatable", label: "😭 Relatable", desc: "We all feel this" },
  { value: "cursed", label: "🚨 Cursed", desc: "Wrong but funny" },
  { value: "chad", label: "💪 Chad Energy", desc: "Sigma grindset" },
  { value: "wholesome", label: "🥺 Wholesomely Dank", desc: "Pure & unhinged" },
];

export default function MemeGenerator() {
  const [imageData, setImageData] = useState<string>("");
  const [imageWidth, setImageWidth] = useState(800);
  const [imageHeight, setImageHeight] = useState(600);
  const [textStyle, setTextStyle] = useState<TextStyle>(DEFAULT_STYLE);
  const [tweetContext, setTweetContext] = useState("");
  const [userPrompt, setUserPrompt] = useState("");
  const [memeStyle, setMemeStyle] = useState("dank");
  const [captions, setCaptions] = useState<MemeCaption[]>([]);
  const [roast, setRoast] = useState<string | null>(null);
  const [selectedCaption, setSelectedCaption] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"create" | "style">("create");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleImageLoad = useCallback((data: string, w: number, h: number) => {
    setImageData(data);
    setImageWidth(w);
    setImageHeight(h);
    setCaptions([]);
    setSelectedCaption(null);
    setRoast(null);
  }, []);

  const handleStyleChange = useCallback((updates: Partial<TextStyle>) => {
    setTextStyle((prev) => ({ ...prev, ...updates }));
    setSelectedCaption(null);
  }, []);

  const handleCaptionSelect = useCallback((idx: number, caption: MemeCaption) => {
    setSelectedCaption(idx);
    setTextStyle((prev) => ({
      ...prev,
      topText: caption.topText,
      bottomText: caption.bottomText,
    }));
  }, []);

  const generateCaptions = useCallback(async () => {
    if (!tweetContext && !userPrompt) {
      setError("bro give me something to work with 💀");
      return;
    }
    setIsGenerating(true);
    setError(null);
    setCaptions([]);
    setRoast(null);

    try {
      const res = await fetch("/api/generate-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tweetContext,
          userPrompt,
          memeStyle,
          includeRoast: !!tweetContext,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "AI had a skill issue");
      }

      const data = await res.json();
      setCaptions(data.captions || []);
      setRoast(data.roast || null);

      // Auto-select first caption
      if (data.captions?.length > 0) {
        handleCaptionSelect(0, data.captions[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "something went terribly wrong");
    } finally {
      setIsGenerating(false);
    }
  }, [tweetContext, userPrompt, memeStyle, handleCaptionSelect]);

  const downloadMeme = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDownloading(true);
    try {
      const link = document.createElement("a");
      link.download = `dank-meme-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setTimeout(() => setIsDownloading(false), 1000);
    }
  }, []);

  const copyToClipboard = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
      });
    } catch {
      // Clipboard API not supported
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] noise-bg">
      {/* Header */}
      <header className="border-b border-[#1a1a1a] sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-float">🐸</span>
            <div>
              <h1 className="text-xl font-black gradient-dank tracking-tight">
                DANK MEME GENERATOR 9000
              </h1>
              <p className="text-[10px] text-[#444] uppercase tracking-widest">
                AI-POWERED • ULTRA DANK • NO CAP
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#444]">
            <span className="w-2 h-2 rounded-full bg-[#39ff14] animate-pulse inline-block"></span>
            powered by claude
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEFT PANEL - Upload + Controls */}
          <div className="space-y-4">
            {/* Upload */}
            <div className="bg-[#111] rounded-2xl p-4 border border-[#1a1a1a]">
              <h2 className="text-sm font-bold text-[#39ff14] uppercase tracking-wider mb-3 flex items-center gap-2">
                <span>📸</span> Step 1: Upload Tweet Screenshot
              </h2>
              <ImageUpload
                onImageLoad={handleImageLoad}
                onTweetTextExtracted={setTweetContext}
              />
            </div>

            {/* AI Controls */}
            <div className="bg-[#111] rounded-2xl p-4 border border-[#1a1a1a]">
              <h2 className="text-sm font-bold text-[#39ff14] uppercase tracking-wider mb-3 flex items-center gap-2">
                <span>🤖</span> Step 2: AI Caption Generator
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[#666] uppercase tracking-wider mb-1">
                    Tweet Text / Context
                  </label>
                  <textarea
                    value={tweetContext}
                    onChange={(e) => setTweetContext(e.target.value)}
                    placeholder="paste the tweet text here... or describe what's happening in the image"
                    rows={3}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#39ff14] transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#666] uppercase tracking-wider mb-1">
                    Your Meme Vision 👁️
                  </label>
                  <input
                    type="text"
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    placeholder="e.g. 'make it about programming pain' or 'monday morning energy'"
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#39ff14] transition-colors"
                    onKeyDown={(e) => e.key === "Enter" && generateCaptions()}
                  />
                </div>

                {/* Meme Style */}
                <div>
                  <label className="block text-xs text-[#666] uppercase tracking-wider mb-2">
                    Dankness Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {MEME_STYLES.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setMemeStyle(s.value)}
                        className={`px-2 py-2 rounded-lg text-left transition-all ${
                          memeStyle === s.value
                            ? "bg-[rgba(57,255,20,0.15)] border border-[#39ff14]"
                            : "bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#444]"
                        }`}
                      >
                        <div className="text-sm">{s.label}</div>
                        <div className="text-[10px] text-[#555] mt-0.5">{s.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={generateCaptions}
                  disabled={isGenerating || (!tweetContext && !userPrompt)}
                  className="w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider meme-btn transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: isGenerating
                      ? "#1a1a1a"
                      : "linear-gradient(135deg, #39ff14, #2ecc71)",
                    color: "black",
                  }}
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⚙️</span>
                      AI IS COOKING...
                      <span className="loading-dots">
                        <span>.</span><span>.</span><span>.</span>
                      </span>
                    </span>
                  ) : (
                    "🔥 GENERATE DANK CAPTIONS"
                  )}
                </button>

                {error && (
                  <p className="text-[#e74c3c] text-sm font-bold text-center">
                    ❌ {error}
                  </p>
                )}
              </div>
            </div>

            {/* AI Roast */}
            {roast && (
              <div className="bg-[#1a0a0a] rounded-2xl p-4 border border-[rgba(231,76,60,0.3)]">
                <div className="flex items-center gap-2 mb-2">
                  <span>🔥</span>
                  <span className="text-xs font-bold text-[#e74c3c] uppercase tracking-wider">
                    AI ROAST OF THIS TWEET
                  </span>
                </div>
                <p className="text-sm text-[#ccc] italic">&ldquo;{roast}&rdquo;</p>
              </div>
            )}

            {/* Generated Captions */}
            {captions.length > 0 && (
              <div className="bg-[#111] rounded-2xl p-4 border border-[#1a1a1a]">
                <h3 className="text-sm font-bold text-[#39ff14] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span>✨</span> AI Generated Bangers ({captions.length})
                </h3>
                <div className="space-y-2">
                  {captions.map((cap, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleCaptionSelect(idx, cap)}
                      className={`caption-card w-full p-3 rounded-xl text-left ${
                        selectedCaption === idx ? "selected" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="text-white font-bold text-sm">
                            {cap.topText}
                          </div>
                          {cap.bottomText && (
                            <div className="text-[#aaa] text-sm mt-0.5">
                              {cap.bottomText}
                            </div>
                          )}
                          <div className="text-[10px] text-[#555] mt-1 uppercase tracking-wider">
                            {cap.vibe}
                          </div>
                        </div>
                        <span className="text-2xl flex-shrink-0">{cap.emoji}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL - Canvas + Style */}
          <div className="space-y-4">
            {/* Canvas Preview */}
            <div className="bg-[#111] rounded-2xl p-4 border border-[#1a1a1a]">
              <h2 className="text-sm font-bold text-[#39ff14] uppercase tracking-wider mb-3 flex items-center gap-2">
                <span>🎨</span> Step 3: Your Meme
              </h2>

              {imageData ? (
                <MemeCanvas
                  imageData={imageData}
                  imageWidth={imageWidth}
                  imageHeight={imageHeight}
                  textStyle={textStyle}
                  onCanvasReady={(canvas) => { canvasRef.current = canvas; }}
                />
              ) : (
                <div className="aspect-video bg-[#0a0a0a] rounded-xl border-2 border-dashed border-[#1a1a1a] flex flex-col items-center justify-center text-[#333]">
                  <span className="text-5xl mb-3">🖼️</span>
                  <p className="font-bold">No image uploaded yet</p>
                  <p className="text-sm mt-1">Upload a tweet screenshot to begin</p>
                </div>
              )}

              {/* Download Actions */}
              {imageData && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={downloadMeme}
                    disabled={isDownloading}
                    className="flex-1 py-2.5 rounded-xl font-black text-sm uppercase tracking-wider meme-btn text-black"
                    style={{ background: "linear-gradient(135deg, #39ff14, #2ecc71)" }}
                  >
                    {isDownloading ? "📥 SAVING..." : "📥 DOWNLOAD MEME"}
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2.5 rounded-xl font-black text-sm meme-btn bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#39ff14] transition-colors"
                    title="Copy to clipboard"
                  >
                    📋
                  </button>
                </div>
              )}
            </div>

            {/* Style Controls */}
            {imageData && (
              <div className="bg-[#111] rounded-2xl border border-[#1a1a1a] overflow-hidden">
                <div className="flex border-b border-[#1a1a1a]">
                  {(["create", "style"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
                        activeTab === tab
                          ? "bg-[rgba(57,255,20,0.1)] text-[#39ff14] border-b-2 border-[#39ff14]"
                          : "text-[#666] hover:text-white"
                      }`}
                    >
                      {tab === "create" ? "✏️ Edit Text" : "🎨 Style"}
                    </button>
                  ))}
                </div>
                <div className="p-4">
                  <MemeControls textStyle={textStyle} onChange={handleStyleChange} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-[#333] text-xs pb-6">
          <p>made with 🐸 and questionable AI judgment</p>
          <p className="mt-1">no memes were harmed in the making of this app</p>
        </footer>
      </main>
    </div>
  );
}
