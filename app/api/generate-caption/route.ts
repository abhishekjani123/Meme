import { NextRequest, NextResponse } from "next/server";
import { generateMemeCaptions, roastTweet } from "@/lib/claude";

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

    const [captions, roast] = await Promise.all([
      generateMemeCaptions({ tweetContext, userPrompt, memeStyle }),
      includeRoast && tweetContext ? roastTweet(tweetContext) : Promise.resolve(null),
    ]);

    return NextResponse.json({ captions, roast });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
