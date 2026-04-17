"use client";

import { FONTS } from "./MemeCanvas";
import type { TextStyle } from "./MemeCanvas";

interface MemeControlsProps {
  textStyle: TextStyle;
  onChange: (updates: Partial<TextStyle>) => void;
}

const PRESETS = [
  { label: "🔥 Classic", style: { fontFamily: FONTS[0].value, fontColor: "#ffffff", strokeColor: "#000000", strokeWidth: 4, textShadow: false, rainbow: false, allCaps: true }},
  { label: "💀 Dark Mode", style: { fontFamily: FONTS[0].value, fontColor: "#ff0000", strokeColor: "#000000", strokeWidth: 5, textShadow: true, rainbow: false, allCaps: true }},
  { label: "🌈 Rainbow", style: { fontFamily: FONTS[0].value, fontColor: "#ffffff", strokeColor: "#000000", strokeWidth: 4, textShadow: true, rainbow: true, allCaps: true }},
  { label: "😂 Comic", style: { fontFamily: FONTS[2].value, fontColor: "#000000", strokeColor: "#ffff00", strokeWidth: 3, textShadow: false, rainbow: false, allCaps: false }},
  { label: "💻 Hacker", style: { fontFamily: FONTS[3].value, fontColor: "#39ff14", strokeColor: "#000000", strokeWidth: 2, textShadow: true, rainbow: false, allCaps: false }},
  { label: "👑 Gold", style: { fontFamily: FONTS[0].value, fontColor: "#f1c40f", strokeColor: "#7d6608", strokeWidth: 4, textShadow: true, rainbow: false, allCaps: true }},
];

const POSITIONS = [
  { value: "classic", label: "Top + Bottom" },
  { value: "top-only", label: "Top Only" },
  { value: "bottom-only", label: "Bottom Only" },
  { value: "center", label: "Center" },
] as const;

export default function MemeControls({ textStyle, onChange }: MemeControlsProps) {
  return (
    <div className="space-y-5">
      {/* Text Inputs */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-[#666] uppercase tracking-wider mb-1">Top Text</label>
          <input
            type="text"
            value={textStyle.topText}
            onChange={(e) => onChange({ topText: e.target.value })}
            placeholder="WHEN YOU..."
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#39ff14] transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-[#666] uppercase tracking-wider mb-1">Bottom Text</label>
          <input
            type="text"
            value={textStyle.bottomText}
            onChange={(e) => onChange({ bottomText: e.target.value })}
            placeholder="BUT THEN..."
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#39ff14] transition-colors"
          />
        </div>
      </div>

      {/* Style Presets */}
      <div>
        <label className="block text-xs text-[#666] uppercase tracking-wider mb-2">Quick Presets</label>
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => onChange(preset.style)}
              className="px-2 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-xs hover:border-[#39ff14] hover:bg-[rgba(57,255,20,0.05)] transition-all text-white"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Text Position */}
      <div>
        <label className="block text-xs text-[#666] uppercase tracking-wider mb-2">Position</label>
        <div className="grid grid-cols-2 gap-2">
          {POSITIONS.map((pos) => (
            <button
              key={pos.value}
              onClick={() => onChange({ textPosition: pos.value })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                textStyle.textPosition === pos.value
                  ? "bg-[#39ff14] text-black"
                  : "bg-[#1a1a1a] border border-[#2a2a2a] text-white hover:border-[#39ff14]"
              }`}
            >
              {pos.label}
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div>
        <label className="block text-xs text-[#666] uppercase tracking-wider mb-2">
          Font Size: <span className="text-[#39ff14]">{textStyle.fontSize}px</span>
        </label>
        <input
          type="range"
          min={16}
          max={120}
          value={textStyle.fontSize}
          onChange={(e) => onChange({ fontSize: parseInt(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Stroke Width */}
      <div>
        <label className="block text-xs text-[#666] uppercase tracking-wider mb-2">
          Outline: <span className="text-[#39ff14]">{textStyle.strokeWidth}px</span>
        </label>
        <input
          type="range"
          min={0}
          max={12}
          value={textStyle.strokeWidth}
          onChange={(e) => onChange({ strokeWidth: parseInt(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Font Family */}
      <div>
        <label className="block text-xs text-[#666] uppercase tracking-wider mb-2">Font</label>
        <select
          value={textStyle.fontFamily}
          onChange={(e) => onChange({ fontFamily: e.target.value })}
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#39ff14] transition-colors"
        >
          {FONTS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-[#666] uppercase tracking-wider mb-2">Text Color</label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={textStyle.fontColor}
              onChange={(e) => onChange({ fontColor: e.target.value })}
              className="w-10 h-8 rounded border border-[#2a2a2a] bg-[#1a1a1a] cursor-pointer"
            />
            <input
              type="text"
              value={textStyle.fontColor}
              onChange={(e) => onChange({ fontColor: e.target.value })}
              className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-[#39ff14]"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-[#666] uppercase tracking-wider mb-2">Outline Color</label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={textStyle.strokeColor}
              onChange={(e) => onChange({ strokeColor: e.target.value })}
              className="w-10 h-8 rounded border border-[#2a2a2a] bg-[#1a1a1a] cursor-pointer"
            />
            <input
              type="text"
              value={textStyle.strokeColor}
              onChange={(e) => onChange({ strokeColor: e.target.value })}
              className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-[#39ff14]"
            />
          </div>
        </div>
      </div>

      {/* Toggles */}
      <div className="flex gap-3 flex-wrap">
        {[
          { key: "allCaps" as const, label: "ALL CAPS" },
          { key: "textShadow" as const, label: "Shadow" },
          { key: "rainbow" as const, label: "🌈 Rainbow" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onChange({ [key]: !textStyle[key] })}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              textStyle[key]
                ? "bg-[#39ff14] text-black"
                : "bg-[#1a1a1a] border border-[#2a2a2a] text-[#666] hover:border-[#39ff14] hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
