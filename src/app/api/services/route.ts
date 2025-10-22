import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/services - Get all services
export async function GET() {
  try {
    // Ensure duration column exists (idempotent)
    await prisma.$executeRawUnsafe('ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "duration" TEXT');

    const services = await prisma.service.findMany({
      include: {
        faqs: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: { serviceRequests: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Fetch durations map and merge
    const durations = await prisma.$queryRaw<{ id: string; duration: string | null }[]>`
      SELECT "id", "duration" FROM "Service"`;
    const durationMap = new Map(durations.map(d => [d.id, d.duration]));
    const withDuration = services.map((s: any) => ({ ...s, duration: durationMap.get(s.id) || null }));

    return NextResponse.json(withDuration);
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

// POST /api/services - Create a new service
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

  const { name, description, category, price, status, duration, faqs } = await request.json();

    const service = await prisma.service.create({
      data: {
        name,
        description,
        category,
        price: price ? parseFloat(price) : null,
        status: status || "ACTIVE",
        faqs: faqs ? {
          create: faqs.map((faq: any, index: number) => ({
            question: faq.question,
            answer: faq.answer,
            order: index
          }))
        } : undefined
      },
      include: {
        faqs: true
      }
    });

    // Persist duration via raw SQL (works even if Prisma client types are stale)
    if (typeof duration === 'string' && duration.length > 0) {
      await prisma.$executeRaw`UPDATE "Service" SET "duration" = ${duration} WHERE "id" = ${service.id}`;
    }

    const [row] = await prisma.$queryRaw<{ duration: string | null }[]>`
      SELECT "duration" FROM "Service" WHERE "id" = ${service.id}`;
    const merged = { ...service, duration: row?.duration || null } as any;

    return NextResponse.json(merged, { status: 201 });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}