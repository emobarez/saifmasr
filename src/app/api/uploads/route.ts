import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ActivityLogger } from "@/lib/activityLogger";
import path from "path";
import { promises as fs } from "fs";

// Cloudinary configuration for Vercel deployment
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET;
// Only use Cloudinary if explicitly configured (both vars must be set)
const USE_CLOUDINARY = CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET;

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

    // Use Cloudinary if configured, otherwise use local filesystem
    if (USE_CLOUDINARY) {

      for (const fileEntry of files) {
        if (!(fileEntry instanceof File)) continue;
        const file = fileEntry as File;
        const maxSize = 25 * 1024 * 1024; // 25MB
        if (file.size > maxSize) {
          return NextResponse.json({ error: `File ${file.name} is too large (max 25MB)` }, { status: 413 });
        }

        try {
          // Convert file to base64 for Cloudinary upload
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64 = buffer.toString('base64');
          const dataUrl = `data:${file.type || 'application/octet-stream'};base64,${base64}`;

          // Upload to Cloudinary
          const cloudinaryFormData = new FormData();
          cloudinaryFormData.append('file', dataUrl);
          if (CLOUDINARY_UPLOAD_PRESET) {
            cloudinaryFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
          }
          cloudinaryFormData.append('folder', 'saifmasr-attachments');
          cloudinaryFormData.append('resource_type', 'auto');

          const uploadRes = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
            {
              method: 'POST',
              body: cloudinaryFormData,
            }
          );

          if (!uploadRes.ok) {
            const errorText = await uploadRes.text();
            console.error('Cloudinary upload failed:', errorText);
            throw new Error(`Cloudinary upload failed: ${uploadRes.statusText}`);
          }

          const cloudinaryResult = await uploadRes.json();
          saved.push({
            url: cloudinaryResult.secure_url,
            name: file.name || 'upload',
            mimeType: file.type || 'application/octet-stream',
            size: file.size,
          });
        } catch (uploadError: any) {
          console.error('Error uploading file to Cloudinary:', uploadError);
          return NextResponse.json({ 
            error: `Failed to upload ${file.name}: ${uploadError.message}` 
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
