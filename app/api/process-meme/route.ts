import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const metadata = await sharp(buffer).metadata();
    const { width = 800, height = 600, format } = metadata;

    // Normalize image: convert to JPEG, resize if too large
    const maxDim = 1200;
    const needsResize = width > maxDim || height > maxDim;

    const processed = await sharp(buffer)
      .rotate() // auto-rotate based on EXIF
      .resize(needsResize ? { width: maxDim, height: maxDim, fit: "inside" } : undefined)
      .jpeg({ quality: 90 })
      .toBuffer();

    const finalMeta = await sharp(processed).metadata();

    return NextResponse.json({
      imageData: processed.toString("base64"),
      width: finalMeta.width,
      height: finalMeta.height,
      originalFormat: format,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const maxDuration = 30;
