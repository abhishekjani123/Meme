import { getDb } from "./db";
import { v4 as uuid } from "uuid";
import { CATEGORIES } from "./categories";

export { CATEGORIES } from "./categories";
export type { CategoryKey } from "./categories";

export interface MemeSession {
  id: string;
  tweetContext: string;
  userPrompt: string;
  memeStyle: string;
  topText: string;
  bottomText: string;
  vibe?: string;
  promptVersion: number;
}

export interface FeedbackPayload {
  sessionId: string;
  rating: number;
  categories: string[];
  comment?: string;
}

export interface FewShotExample {
  topText: string;
  bottomText: string;
  vibe: string;
  rating: number;
  categories: string[];
}

// ── Write ops ──────────────────────────────────────────────

export function saveSession(session: Omit<MemeSession, "id" | "promptVersion"> & { promptVersion?: number }): string {
  const db = getDb();
  const id = uuid();
  const version = session.promptVersion ?? getCurrentVersion(session.memeStyle);

  db.prepare(`
    INSERT INTO meme_sessions (id, tweet_context, user_prompt, meme_style, top_text, bottom_text, vibe, prompt_version)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, session.tweetContext ?? "", session.userPrompt ?? "", session.memeStyle, session.topText, session.bottomText, session.vibe ?? "", version);

  return id;
}

export function saveFeedback(payload: FeedbackPayload): void {
  const db = getDb();

  const catFlags: Record<string, number> = {};
  for (const c of CATEGORIES) {
    catFlags[c.key] = payload.categories.includes(c.key) ? 1 : 0;
  }

  db.prepare(`
    INSERT INTO feedback (id, session_id, rating, cat_funny, cat_relatable, cat_dank, cat_cringe, cat_would_share, cat_too_dark, cat_clever, cat_cursed, comment)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuid(),
    payload.sessionId,
    payload.rating,
    catFlags.cat_funny,
    catFlags.cat_relatable,
    catFlags.cat_dank,
    catFlags.cat_cringe,
    catFlags.cat_would_share,
    catFlags.cat_too_dark,
    catFlags.cat_clever,
    catFlags.cat_cursed,
    payload.comment ?? ""
  );

  // After saving feedback, check if we should snapshot a new prompt version
  maybeSnapshotVersion(payload.sessionId);
}

// ── Read ops ───────────────────────────────────────────────

function getCurrentVersion(memeStyle: string): number {
  const db = getDb();
  const row = db.prepare(`
    SELECT MAX(version) as v FROM prompt_versions WHERE meme_style = ?
  `).get(memeStyle) as { v: number | null };
  return (row?.v ?? 0) + 1;
}

/** Top-rated examples for a given style to use as few-shot prompts */
export function getTopExamples(memeStyle: string, limit = 5): FewShotExample[] {
  const db = getDb();

  const rows = db.prepare(`
    SELECT
      s.top_text,
      s.bottom_text,
      s.vibe,
      f.rating,
      f.cat_funny, f.cat_relatable, f.cat_dank, f.cat_clever, f.cat_would_share, f.cat_cursed
    FROM feedback f
    JOIN meme_sessions s ON s.id = f.session_id
    WHERE s.meme_style = ?
      AND f.rating >= 4
      AND f.cat_cringe = 0
      AND f.cat_too_dark = 0
    ORDER BY f.rating DESC, (f.cat_funny + f.cat_relatable + f.cat_dank + f.cat_would_share) DESC
    LIMIT ?
  `).all(memeStyle, limit) as Array<{
    top_text: string; bottom_text: string; vibe: string | null;
    rating: number;
    cat_funny: number; cat_relatable: number; cat_dank: number;
    cat_clever: number; cat_would_share: number; cat_cursed: number;
  }>;

  return rows.map((r) => ({
    topText: r.top_text,
    bottomText: r.bottom_text,
    vibe: r.vibe ?? "",
    rating: r.rating,
    categories: CATEGORIES
      .filter((c) => r[c.key as keyof typeof r] === 1)
      .map((c) => c.label),
  }));
}

/** Aggregate stats for the analytics dashboard */
export function getStats() {
  const db = getDb();

  const overall = db.prepare(`
    SELECT
      COUNT(f.id)          AS total_feedback,
      ROUND(AVG(f.rating), 2) AS avg_rating,
      COUNT(DISTINCT s.id) AS total_sessions
    FROM feedback f
    JOIN meme_sessions s ON s.id = f.session_id
  `).get() as { total_feedback: number; avg_rating: number | null; total_sessions: number };

  const byStyle = db.prepare(`
    SELECT
      s.meme_style,
      COUNT(f.id)             AS count,
      ROUND(AVG(f.rating), 2) AS avg_rating,
      SUM(f.cat_funny)        AS funny_count,
      SUM(f.cat_relatable)    AS relatable_count,
      SUM(f.cat_dank)         AS dank_count,
      SUM(f.cat_would_share)  AS would_share_count,
      SUM(f.cat_cringe)       AS cringe_count
    FROM feedback f
    JOIN meme_sessions s ON s.id = f.session_id
    GROUP BY s.meme_style
    ORDER BY avg_rating DESC
  `).all() as Array<{
    meme_style: string; count: number; avg_rating: number;
    funny_count: number; relatable_count: number; dank_count: number;
    would_share_count: number; cringe_count: number;
  }>;

  const catTotals = db.prepare(`
    SELECT
      SUM(cat_funny)       AS funny,
      SUM(cat_relatable)   AS relatable,
      SUM(cat_dank)        AS dank,
      SUM(cat_cringe)      AS cringe,
      SUM(cat_would_share) AS would_share,
      SUM(cat_too_dark)    AS too_dark,
      SUM(cat_clever)      AS clever,
      SUM(cat_cursed)      AS cursed
    FROM feedback
  `).get() as Record<string, number>;

  const ratingDist = db.prepare(`
    SELECT rating, COUNT(*) AS count FROM feedback GROUP BY rating ORDER BY rating
  `).all() as Array<{ rating: number; count: number }>;

  const versions = db.prepare(`
    SELECT version, meme_style, avg_rating, sample_count, examples_used, created_at
    FROM prompt_versions
    ORDER BY created_at DESC
    LIMIT 50
  `).all() as Array<{
    version: number; meme_style: string; avg_rating: number;
    sample_count: number; examples_used: number; created_at: number;
  }>;

  // Top 5 most-shared examples
  const topMemes = db.prepare(`
    SELECT s.top_text, s.bottom_text, s.meme_style, s.vibe, f.rating,
           (f.cat_funny + f.cat_relatable + f.cat_dank + f.cat_would_share) AS score
    FROM feedback f
    JOIN meme_sessions s ON s.id = f.session_id
    WHERE f.rating >= 4
    ORDER BY score DESC, f.rating DESC
    LIMIT 5
  `).all() as Array<{
    top_text: string; bottom_text: string; meme_style: string;
    vibe: string; rating: number; score: number;
  }>;

  return { overall, byStyle, catTotals, ratingDist, versions, topMemes };
}

// ── Version snapshotting ───────────────────────────────────

const SNAPSHOT_EVERY = 10; // snapshot a new version every N feedbacks

function maybeSnapshotVersion(sessionId: string): void {
  const db = getDb();

  const session = db.prepare(`SELECT meme_style FROM meme_sessions WHERE id = ?`).get(sessionId) as { meme_style: string } | undefined;
  if (!session) return;

  const { meme_style } = session;

  const { count } = db.prepare(`
    SELECT COUNT(f.id) AS count
    FROM feedback f
    JOIN meme_sessions s ON s.id = f.session_id
    WHERE s.meme_style = ?
  `).get(meme_style) as { count: number };

  if (count % SNAPSHOT_EVERY !== 0) return;

  const { avg_rating } = db.prepare(`
    SELECT ROUND(AVG(f.rating), 2) AS avg_rating
    FROM feedback f
    JOIN meme_sessions s ON s.id = f.session_id
    WHERE s.meme_style = ?
  `).get(meme_style) as { avg_rating: number };

  const lastVersion = db.prepare(`
    SELECT MAX(version) AS v FROM prompt_versions WHERE meme_style = ?
  `).get(meme_style) as { v: number | null };

  const newVersion = (lastVersion.v ?? 0) + 1;
  const examplesUsed = getTopExamples(meme_style).length;

  db.prepare(`
    INSERT INTO prompt_versions (version, meme_style, avg_rating, sample_count, examples_used)
    VALUES (?, ?, ?, ?, ?)
  `).run(newVersion, meme_style, avg_rating, count, examplesUsed);
}
