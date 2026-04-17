export const CATEGORIES = [
  { key: "cat_funny",       label: "Funny",       emoji: "😂" },
  { key: "cat_relatable",   label: "Relatable",   emoji: "😭" },
  { key: "cat_dank",        label: "Dank",        emoji: "🐸" },
  { key: "cat_cringe",      label: "Cringe",      emoji: "😬" },
  { key: "cat_would_share", label: "Would Share", emoji: "📤" },
  { key: "cat_too_dark",    label: "Too Dark",    emoji: "💀" },
  { key: "cat_clever",      label: "Clever",      emoji: "🧠" },
  { key: "cat_cursed",      label: "Cursed",      emoji: "🚨" },
] as const;

export type CategoryKey = typeof CATEGORIES[number]["key"];
