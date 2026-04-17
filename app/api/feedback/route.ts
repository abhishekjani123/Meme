import { NextRequest, NextResponse } from "next/server";
import { saveFeedback } from "@/lib/feedback-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, rating, categories, comment } = body;

    if (!sessionId || typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "sessionId and rating (1-5) are required" },
        { status: 400 }
      );
    }

    saveFeedback({
      sessionId,
      rating,
      categories: Array.isArray(categories) ? categories : [],
      comment: comment ?? "",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
