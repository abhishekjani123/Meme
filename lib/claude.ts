import Anthropic from "@anthropic-ai/sdk";
import type { FewShotExample } from "./feedback-store";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface MemeCaption {
  topText: string;
  bottomText: string;
  vibe: string;
  emoji: string;
  sessionId?: string;
}

export interface GenerateCaptionsRequest {
  tweetContext: string;
  userPrompt: string;
  memeStyle: string;
  fewShotExamples?: FewShotExample[];
}

const MEME_STYLES: Record<string, string> = {
  dank: "ultra dank internet meme humor - surreal, absurdist, layer upon layer of irony",
  edgy: "dark humor, edgy, pushing boundaries but still funny (no hate speech)",
  relatable: "painfully relatable millennial/gen-z humor about life struggles",
  cursed: "cursed, unsettling, deeply wrong but somehow funny",
  wholesome: "wholesomely dank - pure, innocent but still meme format",
  chad: "gigachad energy, sigma grindset, absolute unit vibes",
};

function buildFewShotBlock(examples: FewShotExample[]): string {
  if (!examples.length) return "";

  const lines = examples.map(
    (ex, i) =>
      `Example ${i + 1} (⭐${ex.rating}/5, tags: ${ex.categories.join(", ") || "none"}):
  Top: "${ex.topText}"
  Bottom: "${ex.bottomText}"
  Vibe: ${ex.vibe}`
  );

  return `\nHIGH-PERFORMING EXAMPLES (from real user feedback — learn their style and beat them):\n${lines.join("\n\n")}\n`;
}

export async function generateMemeCaptions(
  req: GenerateCaptionsRequest
): Promise<MemeCaption[]> {
  const styleDesc =
    MEME_STYLES[req.memeStyle] ?? MEME_STYLES.dank;

  const fewShotBlock = buildFewShotBlock(req.fewShotExamples ?? []);
  const hasFewShot = (req.fewShotExamples?.length ?? 0) > 0;

  const prompt = `You are the GOAT meme creator on the internet. Your memes are so dank they have achieved sentience. Generate 5 different meme caption sets for this tweet/image.

TWEET CONTEXT:
${req.tweetContext || "No tweet text provided - create based on the vibe"}

USER'S MEME VISION:
${req.userPrompt || "Make it as dank as possible"}

MEME STYLE: ${styleDesc}
${fewShotBlock}
RULES FOR MAXIMUM DANKNESS:
1. Use internet slang, meme speak, and zoomer/millennial humor
2. Reference relevant memes, copypastas, or internet culture when appropriate
3. Keep top text SHORT and punchy (max 8 words)
4. Bottom text should be the PUNCHLINE that lands hard
5. Each set should have a different angle/approach
6. Use ALL CAPS where it adds IMPACT
7. Be genuinely funny, not just trying to be funny
8. Subvert expectations - the best memes have a twist
${hasFewShot ? "9. The high-performing examples above show what real users rated highly — match their energy but be ORIGINAL and try to EXCEED them\n" : ""}
Respond with ONLY a valid JSON array (no markdown, no code blocks):
[
  {
    "topText": "TOP TEXT HERE",
    "bottomText": "BOTTOM TEXT PUNCHLINE",
    "vibe": "brief vibe like 'galaxy brain' or 'absolutely unhinged'",
    "emoji": "single relevant emoji"
  }
]

Generate exactly 5 caption sets. Make them progressively more unhinged.`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  let parsed: MemeCaption[];
  try {
    const cleaned = content.text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Failed to parse AI response as JSON");
  }

  return parsed;
}

export async function roastTweet(tweetText: string): Promise<string> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `Roast this tweet in one brutally funny sentence using internet humor and meme speak. Be savage but funny, not mean-spirited. Tweet: "${tweetText}"\n\nRespond with ONLY the roast, nothing else.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") return "ratio + L + no cap + skill issue";
  return content.text.trim();
}
