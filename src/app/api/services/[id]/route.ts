import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

    const service = await prisma.service.findUnique({
      where: { id: params.id },
      include: {
        faqs: { orderBy: { order: 'asc' } },
        _count: { select: { serviceRequests: true } }
      }
    });
    if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const [row] = await prisma.$queryRaw<{ duration: string | null }[]>`SELECT "duration" FROM "Service" WHERE "id" = ${params.id}`;
    return NextResponse.json({ ...service, duration: row?.duration || null });
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
    if (typeof body.name === 'string') data.name = body.name;
    if (typeof body.description === 'string') data.description = body.description;
    if (typeof body.category === 'string') data.category = body.category;
    if (typeof body.price !== 'undefined') {
      const p = Number(body.price);
      data.price = Number.isFinite(p) ? p : null;
    }
    if (status) data.status = status;

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
