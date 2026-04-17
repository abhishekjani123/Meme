"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/categories";

interface MemeFeedbackProps {
  sessionId: string;
  onFeedbackSubmitted?: (rating: number) => void;
}

const STAR_LABELS = ["", "💩 Trash", "😐 Meh", "😄 Decent", "🔥 Fire", "🐐 GOAT"];

export default function MemeFeedback({ sessionId, onFeedbackSubmitted }: MemeFeedbackProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCategory = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const submit = async () => {
    if (rating === 0) {
      setError("pick a rating first bestie 💀");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          rating,
          categories: Array.from(selected),
          comment,
        }),
      });
      if (!res.ok) throw new Error("submission failed");
      setSubmitted(true);
      onFeedbackSubmitted?.(rating);
    } catch {
      setError("failed to save feedback, try again");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-[rgba(57,255,20,0.08)] border border-[rgba(57,255,20,0.3)] rounded-xl p-4 text-center">
        <div className="text-2xl mb-1">
          {rating >= 4 ? "🐐" : rating >= 3 ? "👍" : "📝"}
        </div>
        <p className="text-[#39ff14] font-bold text-sm">
          {rating >= 4
            ? "BASED. This gets added to the training pool 🔥"
            : rating >= 3
            ? "Noted. AI will learn from this W"
            : "Feedback saved. AI will do better next time 📈"}
        </p>
        {rating >= 4 && (
          <p className="text-[#555] text-xs mt-1">
            Your top-rated memes become few-shot examples for future generations
          </p>
        )}
      </div>
    );
  }

  const displayRating = hovered || rating;

  return (
    <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">📊</span>
        <span className="text-xs font-bold text-[#39ff14] uppercase tracking-wider">
          Rate This Meme
        </span>
        <span className="text-[10px] text-[#444] ml-auto">trains the AI</span>
      </div>

      {/* Star Rating */}
      <div>
        <div className="flex gap-2 justify-center mb-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="text-3xl transition-transform hover:scale-125 active:scale-110"
            >
              {star <= displayRating ? "⭐" : "☆"}
            </button>
          ))}
        </div>
        {displayRating > 0 && (
          <p className="text-center text-xs text-[#666] h-4">
            {STAR_LABELS[displayRating]}
          </p>
        )}
      </div>

      {/* Category Tags */}
      <div>
        <p className="text-[10px] text-[#444] uppercase tracking-wider mb-2">
          Tag it (helps split the data)
        </p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(({ key, label, emoji }) => (
            <button
              key={key}
              onClick={() => toggleCategory(key)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                selected.has(key)
                  ? "bg-[#39ff14] text-black"
                  : "bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] hover:border-[#444] hover:text-white"
              }`}
            >
              {emoji} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Optional comment */}
      <div>
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="optional: what would make it better? (AI reads this)"
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-xs placeholder-[#333] focus:outline-none focus:border-[#444] transition-colors"
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
      </div>

      {error && <p className="text-[#e74c3c] text-xs font-bold">{error}</p>}

      <button
        onClick={submit}
        disabled={submitting || rating === 0}
        className="w-full py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed meme-btn"
        style={{
          background: rating > 0 ? "linear-gradient(135deg, #39ff14, #2ecc71)" : "#1a1a1a",
          color: rating > 0 ? "black" : "#444",
          border: rating > 0 ? "none" : "1px solid #2a2a2a",
        }}
      >
        {submitting ? "⏳ Saving..." : "📤 Submit Feedback"}
      </button>
    </div>
  );
}
