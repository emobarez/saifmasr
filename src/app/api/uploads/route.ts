import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ActivityLogger } from "@/lib/activityLogger";
import path from "path";
import { promises as fs } from "fs";

// Check if running on Vercel (serverless environment)
// On Vercel, we'll store files as base64 data URLs in the database
const IS_VERCEL = process.env.VERCEL === '1';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const files = formData.getAll("file");
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const saved: Array<{ url: string; name: string; mimeType: string; size: number }> = [];

    // On Vercel: store files as base64 data URLs (saved in database)
    // Local dev: store files in public/uploads/ folder
    if (IS_VERCEL) {
      // Vercel deployment - store as base64 data URLs
      for (const fileEntry of files) {
        if (!(fileEntry instanceof File)) continue;
        const file = fileEntry as File;
        const maxSize = 25 * 1024 * 1024; // 25MB
        if (file.size > maxSize) {
          return NextResponse.json({ error: `File ${file.name} is too large (max 25MB)` }, { status: 413 });
        }

        try {
          // Convert file to base64 data URL for database storage
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64 = buffer.toString('base64');
          const dataUrl = `data:${file.type || 'application/octet-stream'};base64,${base64}`;

          saved.push({
            url: dataUrl, // This will be stored in the database
            name: file.name || 'upload',
            mimeType: file.type || 'application/octet-stream',
            size: file.size,
          });
        } catch (uploadError: any) {
          console.error('Error processing file:', uploadError);
          return NextResponse.json({ 
            error: `فشل رفع ${file.name}: ${uploadError.message}` 
          }, { status: 500 });
        }
      }
    } else {
      // Local filesystem storage (development only)
      const now = new Date();
      const yyyy = String(now.getFullYear());
      const mm = String(now.getMonth() + 1).padStart(2, "0");

      const baseDir = path.join(process.cwd(), "public", "uploads", yyyy, mm);
      await fs.mkdir(baseDir, { recursive: true });

      for (const fileEntry of files) {
        if (!(fileEntry instanceof File)) continue;
        const file = fileEntry as File;
        const maxSize = 25 * 1024 * 1024; // 25MB
        if (file.size > maxSize) {
          return NextResponse.json({ error: "File too large" }, { status: 413 });
        }

        const originalName = (file.name || "upload.bin").replace(/[^\w.\-]+/g, "_");
        const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${originalName}`;
        const fullPath = path.join(baseDir, unique);

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await fs.writeFile(fullPath, buffer);

        const publicUrl = `/uploads/${yyyy}/${mm}/${unique}`;
        saved.push({ url: publicUrl, name: originalName, mimeType: file.type || "application/octet-stream", size: file.size });
      }
    }

    try {
      await ActivityLogger.serviceRequestAttachmentAdded(session.user.id, 'N/A', saved.length);
    } catch (e) {}
    
    return NextResponse.json({ files: saved }, { status: 201 });
  } catch (e: any) {
    console.error("/api/uploads error", e);
    return NextResponse.json({ error: "Failed to upload", details: e.message }, { status: 500 });
  }
}
