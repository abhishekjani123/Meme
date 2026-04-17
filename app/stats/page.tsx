import FeedbackStats from "@/components/FeedbackStats";
import Link from "next/link";

export const metadata = {
  title: "AI Training Stats | DANK MEME GENERATOR 9000",
  description: "Feedback loop analytics — watch the AI get smarter from your ratings",
};

export default function StatsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="border-b border-[#1a1a1a] sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link
            href="/"
            className="text-[#444] hover:text-[#39ff14] transition-colors text-sm"
          >
            ← Back
          </Link>
          <div>
            <h1 className="text-lg font-black gradient-dank">AI TRAINING DASHBOARD</h1>
            <p className="text-[10px] text-[#333] uppercase tracking-widest">
              Feedback loop • Few-shot learning • Prompt versioning
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* How it works */}
        <div className="bg-[#0f1a0f] border border-[rgba(57,255,20,0.2)] rounded-xl p-4 mb-6">
          <h2 className="text-xs font-bold text-[#39ff14] uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>🧠</span> How the AI learns from your feedback
          </h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { icon: "📸", title: "You Rate", desc: "Rate memes 1–5 stars + categorical tags" },
              { icon: "💾", title: "We Store", desc: "High-rated (4–5★) memes saved as examples, split by style" },
              { icon: "🚀", title: "AI Improves", desc: "Top examples injected as few-shot prompts next generation" },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="p-3 bg-[#111] rounded-lg">
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-xs font-bold text-white mb-1">{title}</div>
                <div className="text-[10px] text-[#444]">{desc}</div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[#333] mt-3 text-center">
            Every 10 feedbacks → new prompt version snapshot → track improvement score
          </p>
        </div>

        <FeedbackStats />
      </main>
    </div>
  );
}
