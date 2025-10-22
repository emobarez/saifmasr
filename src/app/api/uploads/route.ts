import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const filename = (form.get("filename") as string) || file.name || `upload-${Date.now()}`;
    const folder = (form.get("folder") as string) || "service-requests";
    const key = `${folder}/${Date.now()}-${filename}`;

    const { url } = await put(key, file, {
      access: "public",
      contentType: file.type || "application/octet-stream",
    });

    return NextResponse.json({
      url,
      name: filename,
      type: file.type,
      size: file.size,
      key,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Upload failed" }, { status: 500 });
  }
}
