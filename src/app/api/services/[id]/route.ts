import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const normalizeSlug = (input?: string | null) => {
  if (!input || typeof input !== "string") {
    return "";
  }
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/gu, "-")
    .replace(/[^\p{Letter}\p{Number}-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

const sanitizeOptional = (value: unknown) => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

// Remove a trailing token like "-c0cb" often appended to slugs for uniqueness
function stripTrailingToken(input: string) {
  if (!input) return input;
  const m = input.match(/^(.*?)-([a-z0-9]{3,8})$/i);
  return m ? m[1] : input;
}

// Helper to map flexible status strings to Prisma enum
function normalizeStatus(input?: string | null) {
  if (!input) return undefined;
  const s = String(input).toUpperCase();
  if (["ACTIVE", "INACTIVE", "DRAFT"].includes(s)) return s as "ACTIVE" | "INACTIVE" | "DRAFT";
  // try lowercase common values
  if (input === "active") return "ACTIVE";
  if (input === "inactive") return "INACTIVE";
  if (input === "draft") return "DRAFT";
  return undefined;
}

// GET /api/services/[id]
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Ensure duration column exists
    await prisma.$executeRawUnsafe('ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "duration" TEXT');

    const pid = params.id;
    const cleaned = stripTrailingToken(pid);
    const norm = normalizeSlug(pid);
    const normCleaned = normalizeSlug(cleaned);

    // Try by primary id first
    let service = await prisma.service.findUnique({
      where: { id: pid },
      include: {
        faqs: { orderBy: { order: 'asc' } },
        _count: { select: { serviceRequests: true } }
      }
    });

    // If not found, try by slug (exact or normalized and with trailing token stripped)
    if (!service) {
      service = await prisma.service.findFirst({
        where: {
          OR: [
            { slug: pid },
            ...(norm ? [{ slug: norm }] : []),
            ...(cleaned && cleaned !== pid ? [{ slug: cleaned }] : []),
            ...(normCleaned && normCleaned !== norm ? [{ slug: normCleaned }] : [])
          ]
        },
        include: {
          faqs: { orderBy: { order: 'asc' } },
          _count: { select: { serviceRequests: true } }
        }
      });
    }

    // If still not found, try to parse an id token appended to slug (match by id endsWith or startsWith)
    if (!service) {
      const parts = pid.split('-');
      const token = parts[parts.length - 1];
      if (token && /^[a-z0-9]{3,8}$/i.test(token)) {
        service = await prisma.service.findFirst({
          where: {
            OR: [
              { id: { startsWith: token } },
              { id: { endsWith: token } }
            ]
          },
          include: {
            faqs: { orderBy: { order: 'asc' } },
            _count: { select: { serviceRequests: true } }
          }
        });
      }
    }

    if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const [row] = await prisma.$queryRaw<{ duration: string | null }[]>`SELECT "duration" FROM "Service" WHERE "id" = ${params.id}`;
    return NextResponse.json({
      ...service,
      duration: row?.duration || null,
      features: Array.isArray(service.features) ? service.features : []
    });
  } catch (error) {
    console.error("Error fetching service: ", error);
    return NextResponse.json({ error: "Failed to fetch service" }, { status: 500 });
  }
}

// PATCH /api/services/[id]
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const status = normalizeStatus(body.status);
    const data: any = {};
    if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim();
    if (body.description !== undefined) data.description = sanitizeOptional(body.description);
    if (body.shortDescription !== undefined) data.shortDescription = sanitizeOptional(body.shortDescription);
    if (body.category !== undefined) data.category = sanitizeOptional(body.category);
    if (typeof body.price !== 'undefined') {
      const p = Number(body.price);
      data.price = Number.isFinite(p) ? p : null;
    }
    if (body.icon !== undefined) {
      data.icon = sanitizeOptional(body.icon);
    }
    if (typeof body.displayOrder !== 'undefined') {
      const orderValue = Number(body.displayOrder);
      data.displayOrder = Number.isFinite(orderValue) ? Math.trunc(orderValue) : 0;
    }
    if (typeof body.isFeatured !== 'undefined') {
      data.isFeatured = Boolean(body.isFeatured);
    }
    if (body.features !== undefined) {
      data.features = Array.isArray(body.features)
        ? body.features
            .map((item: unknown) => (typeof item === 'string' ? item.trim() : ''))
            .filter((item: string) => item.length > 0)
        : null;
    }
    if (body.ctaLabel !== undefined) {
      data.ctaLabel = sanitizeOptional(body.ctaLabel);
    }
    if (body.ctaUrl !== undefined) {
      data.ctaUrl = sanitizeOptional(body.ctaUrl);
    }
    if (status) data.status = status;

    const slugInput = normalizeSlug(body.slug);
    if (slugInput) {
      data.slug = slugInput;
    }

    const updated = await prisma.service.update({
      where: { id: params.id },
      data,
      include: { faqs: true }
    });
    if (typeof body.duration === 'string') {
      await prisma.$executeRaw`UPDATE "Service" SET "duration" = ${body.duration} WHERE "id" = ${params.id}`;
    }
    const [row] = await prisma.$queryRaw<{ duration: string | null }[]>`SELECT "duration" FROM "Service" WHERE "id" = ${params.id}`;
    return NextResponse.json({ ...updated, duration: row?.duration || null });
  } catch (error) {
    console.error("Error updating service: ", error);
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 });
  }
}

// DELETE /api/services/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.service.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting service: ", error);
    return NextResponse.json({ error: "Failed to delete service" }, { status: 500 });
  }
}
