import { NextRequest, NextResponse } from "next/server";
import { generateMemeCaptions, roastTweet } from "@/lib/claude";
import { saveSession, getTopExamples } from "@/lib/feedback-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tweetContext, userPrompt, memeStyle, includeRoast } = body;

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Fetch top examples from feedback to use as few-shot prompts
    const fewShotExamples = getTopExamples(memeStyle ?? "dank", 5);

    const [captions, roast] = await Promise.all([
      generateMemeCaptions({ tweetContext, userPrompt, memeStyle, fewShotExamples }),
      includeRoast && tweetContext ? roastTweet(tweetContext) : Promise.resolve(null),
    ]);

    // Persist the session so feedback can reference it
    const sessionIds = captions.map((cap) =>
      saveSession({
        tweetContext: tweetContext ?? "",
        userPrompt: userPrompt ?? "",
        memeStyle: memeStyle ?? "dank",
        topText: cap.topText,
        bottomText: cap.bottomText,
        vibe: cap.vibe,
      })
    );

    return NextResponse.json({
      captions: captions.map((cap, i) => ({ ...cap, sessionId: sessionIds[i] })),
      roast,
      fewShotCount: fewShotExamples.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
