import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "meme_feedback.db");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  _db.exec(`
    CREATE TABLE IF NOT EXISTS meme_sessions (
      id          TEXT PRIMARY KEY,
      tweet_context TEXT,
      user_prompt TEXT,
      meme_style  TEXT NOT NULL,
      top_text    TEXT NOT NULL,
      bottom_text TEXT NOT NULL DEFAULT '',
      vibe        TEXT,
      prompt_version INTEGER DEFAULT 1,
      created_at  INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id            TEXT PRIMARY KEY,
      session_id    TEXT NOT NULL REFERENCES meme_sessions(id),
      rating        INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      -- categorical boolean flags (stored as 0/1)
      cat_funny       INTEGER DEFAULT 0,
      cat_relatable   INTEGER DEFAULT 0,
      cat_dank        INTEGER DEFAULT 0,
      cat_cringe      INTEGER DEFAULT 0,
      cat_would_share INTEGER DEFAULT 0,
      cat_too_dark    INTEGER DEFAULT 0,
      cat_clever      INTEGER DEFAULT 0,
      cat_cursed      INTEGER DEFAULT 0,
      comment       TEXT,
      created_at    INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS prompt_versions (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      version      INTEGER NOT NULL,
      meme_style   TEXT NOT NULL,
      avg_rating   REAL NOT NULL,
      sample_count INTEGER NOT NULL,
      examples_used INTEGER DEFAULT 0,
      created_at   INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_feedback_session ON feedback(session_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_style   ON meme_sessions(meme_style);
    CREATE INDEX IF NOT EXISTS idx_sessions_created ON meme_sessions(created_at DESC);
  `);

  return _db;
}
