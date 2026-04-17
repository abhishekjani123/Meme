"use client";

import { useEffect, useState } from "react";

interface Stats {
  overall: { total_feedback: number; avg_rating: number | null; total_sessions: number };
  byStyle: Array<{
    meme_style: string; count: number; avg_rating: number;
    funny_count: number; relatable_count: number; dank_count: number;
    would_share_count: number; cringe_count: number;
  }>;
  catTotals: Record<string, number>;
  ratingDist: Array<{ rating: number; count: number }>;
  versions: Array<{
    version: number; meme_style: string; avg_rating: number;
    sample_count: number; examples_used: number; created_at: number;
  }>;
  topMemes: Array<{
    top_text: string; bottom_text: string; meme_style: string;
    vibe: string; rating: number; score: number;
  }>;
}

const STYLE_EMOJI: Record<string, string> = {
  dank: "🐸", edgy: "💀", relatable: "😭", cursed: "🚨", chad: "💪", wholesome: "🥺",
};

const CAT_LABELS: Record<string, { label: string; emoji: string }> = {
  funny: { label: "Funny", emoji: "😂" },
  relatable: { label: "Relatable", emoji: "😭" },
  dank: { label: "Dank", emoji: "🐸" },
  cringe: { label: "Cringe", emoji: "😬" },
  would_share: { label: "Would Share", emoji: "📤" },
  too_dark: { label: "Too Dark", emoji: "💀" },
  clever: { label: "Clever", emoji: "🧠" },
  cursed: { label: "Cursed", emoji: "🚨" },
};

function RatingBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#39ff14] to-[#2ecc71] rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-[#666] w-8 text-right">{value}</span>
    </div>
  );
}

function ScoreBadge({ score }: { score: number | null }) {
  const val = score ?? 0;
  const color =
    val >= 4 ? "#39ff14" : val >= 3 ? "#f1c40f" : val >= 2 ? "#e67e22" : "#e74c3c";
  return (
    <span className="font-black text-lg" style={{ color }}>
      {val > 0 ? val.toFixed(1) : "—"}
    </span>
  );
}

export default function FeedbackStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/feedback/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setStats(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-[#39ff14]">
        <span className="animate-spin mr-2">⚙️</span> Loading stats...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 text-[#e74c3c]">
        Failed to load stats: {error}
      </div>
    );
  }

  if (!stats) return null;

  const { overall, byStyle, catTotals, ratingDist, versions, topMemes } = stats;
  const maxRatingCount = Math.max(...ratingDist.map((r) => r.count), 1);

  // Group versions by style for the improvement chart
  const versionsByStyle = versions.reduce<Record<string, typeof versions>>(
    (acc, v) => {
      (acc[v.meme_style] ??= []).push(v);
      return acc;
    },
    {}
  );

  const noData = (overall.total_feedback ?? 0) === 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Feedback", value: overall.total_feedback ?? 0, icon: "📊" },
          { label: "Avg Rating", value: <ScoreBadge score={overall.avg_rating} />, icon: "⭐" },
          { label: "Memes Created", value: overall.total_sessions ?? 0, icon: "🐸" },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-xl font-black text-white">{value}</div>
            <div className="text-[10px] text-[#444] uppercase tracking-wider mt-1">{label}</div>
          </div>
        ))}
      </div>

      {noData ? (
        <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-12 text-center">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-[#666] font-bold">No feedback yet</p>
          <p className="text-[#333] text-sm mt-1">
            Generate some memes and rate them — the AI learns from your feedback
          </p>
        </div>
      ) : (
        <>
          {/* Rating Distribution */}
          <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4">
            <h3 className="text-xs font-bold text-[#39ff14] uppercase tracking-wider mb-4">
              ⭐ Rating Distribution
            </h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const entry = ratingDist.find((r) => r.rating === star);
                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-xs w-8 text-[#666]">{"⭐".repeat(star)}</span>
                    <div className="flex-1">
                      <RatingBar value={entry?.count ?? 0} max={maxRatingCount} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4">
            <h3 className="text-xs font-bold text-[#39ff14] uppercase tracking-wider mb-4">
              🏷️ Category Breakdown (How memes are tagged)
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(CAT_LABELS).map(([key, { label, emoji }]) => {
                const count = catTotals[key] ?? 0;
                const total = overall.total_feedback ?? 1;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={key} className="flex items-center gap-2 p-2 bg-[#1a1a1a] rounded-lg">
                    <span className="text-lg">{emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white truncate">{label}</span>
                        <span className="text-[#666]">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-[#0a0a0a] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#39ff14] rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Performance by Style */}
          <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4">
            <h3 className="text-xs font-bold text-[#39ff14] uppercase tracking-wider mb-4">
              🎨 Performance by Meme Style
            </h3>
            {byStyle.length === 0 ? (
              <p className="text-[#444] text-sm text-center py-4">No style data yet</p>
            ) : (
              <div className="space-y-3">
                {byStyle.map((s) => (
                  <div key={s.meme_style} className="p-3 bg-[#1a1a1a] rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm">
                        {STYLE_EMOJI[s.meme_style] ?? "🎭"} {s.meme_style}
                      </span>
                      <div className="flex items-center gap-2">
                        <ScoreBadge score={s.avg_rating} />
                        <span className="text-[#444] text-xs">({s.count} ratings)</span>
                      </div>
                    </div>
                    <div className="flex gap-3 text-[10px] text-[#555]">
                      <span>😂 {s.funny_count} funny</span>
                      <span>😭 {s.relatable_count} relatable</span>
                      <span>📤 {s.would_share_count} shareable</span>
                      <span>😬 {s.cringe_count} cringe</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Model Iteration History */}
          {versions.length > 0 && (
            <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4">
              <h3 className="text-xs font-bold text-[#39ff14] uppercase tracking-wider mb-1">
                🧠 Prompt Version History
              </h3>
              <p className="text-[10px] text-[#444] mb-4">
                Every 10 feedbacks a new version is snapshotted — tracking improvement over time
              </p>
              <div className="space-y-2">
                {Object.entries(versionsByStyle).map(([style, vers]) => (
                  <div key={style}>
                    <p className="text-xs text-[#666] mb-1">
                      {STYLE_EMOJI[style] ?? "🎭"} {style}
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {[...vers].reverse().map((v) => (
                        <div
                          key={`${v.meme_style}-${v.version}`}
                          className="flex-shrink-0 px-3 py-2 bg-[#1a1a1a] rounded-lg text-center min-w-[80px]"
                        >
                          <div className="text-[10px] text-[#444]">v{v.version}</div>
                          <div className="font-bold text-sm" style={{
                            color: v.avg_rating >= 4 ? "#39ff14" : v.avg_rating >= 3 ? "#f1c40f" : "#e74c3c"
                          }}>
                            {v.avg_rating.toFixed(1)}⭐
                          </div>
                          <div className="text-[9px] text-[#333]">{v.sample_count} samples</div>
                          {v.examples_used > 0 && (
                            <div className="text-[9px] text-[#39ff14]">+{v.examples_used} shots</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Memes Hall of Fame */}
          {topMemes.length > 0 && (
            <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4">
              <h3 className="text-xs font-bold text-[#39ff14] uppercase tracking-wider mb-4">
                🏆 Hall of Fame (Top Rated)
              </h3>
              <div className="space-y-2">
                {topMemes.map((m, i) => (
                  <div key={i} className="p-3 bg-[#1a1a1a] rounded-xl flex gap-3">
                    <div className="text-2xl flex-shrink-0">{["🥇", "🥈", "🥉", "4️⃣", "5️⃣"][i]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm truncate">{m.top_text}</p>
                      {m.bottom_text && (
                        <p className="text-[#aaa] text-xs truncate">{m.bottom_text}</p>
                      )}
                      <div className="flex gap-2 mt-1 text-[10px] text-[#444]">
                        <span>{STYLE_EMOJI[m.meme_style] ?? "🎭"} {m.meme_style}</span>
                        <span>{"⭐".repeat(m.rating)}</span>
                        {m.vibe && <span>· {m.vibe}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
