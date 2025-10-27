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
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    // Fetch durations map and merge
    const durations = await prisma.$queryRaw<{ id: string; duration: string | null }[]>`
      SELECT "id", "duration" FROM "Service"`;
    const durationMap = new Map(durations.map(d => [d.id, d.duration]));
    const withDuration = services.map((s: any) => ({
      ...s,
      duration: durationMap.get(s.id) || null,
      features: Array.isArray(s.features) ? s.features : []
    }));

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

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const slugInput = normalizeSlug(body.slug) || normalizeSlug(name);

    if (!name) {
      return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 });
    }

    if (!slugInput) {
      return NextResponse.json({ error: "المعرف النصي (Slug) مطلوب" }, { status: 400 });
    }

    const features = Array.isArray(body.features)
      ? body.features
          .map((item: unknown) => (typeof item === "string" ? item.trim() : ""))
          .filter((item: string) => item.length > 0)
      : null;

    const parsedPrice = typeof body.price === "number" ? body.price : body.price ? Number(body.price) : undefined;
    const normalizedPrice = typeof parsedPrice === "number" && Number.isFinite(parsedPrice) ? parsedPrice : null;

    const parsedDisplayOrder = body.displayOrder ?? 0;
    const numericDisplayOrder = Number(parsedDisplayOrder);
    const normalizedDisplayOrder = Number.isFinite(numericDisplayOrder) ? Math.trunc(numericDisplayOrder) : 0;

    const status = typeof body.status === "string" ? body.status.toUpperCase() : "ACTIVE";

    const faqsPayload = Array.isArray(body.faqs)
      ? body.faqs
          .map((faq: { question?: unknown; answer?: unknown }) => ({
            question: typeof faq?.question === "string" ? faq.question.trim() : "",
            answer: typeof faq?.answer === "string" ? faq.answer.trim() : ""
          }))
          .filter((faq: { question: string; answer: string }) => faq.question.length > 0 || faq.answer.length > 0)
      : [];

    const service = await prisma.service.create({
      data: {
        name,
        slug: slugInput,
        description: sanitizeOptional(body.description),
        shortDescription: sanitizeOptional(body.shortDescription),
        category: sanitizeOptional(body.category),
        price: normalizedPrice,
        status,
        icon: sanitizeOptional(body.icon),
        displayOrder: normalizedDisplayOrder,
        isFeatured: Boolean(body.isFeatured),
        features,
        ctaLabel: sanitizeOptional(body.ctaLabel),
        ctaUrl: sanitizeOptional(body.ctaUrl),
        faqs: faqsPayload.length
          ? {
              create: faqsPayload.map((faq: { question: string; answer: string }, index: number) => ({
                question: faq.question,
                answer: faq.answer,
                order: index
              }))
            }
          : undefined
      },
      include: {
        faqs: true
      }
    });

    if (typeof body.duration === 'string' && body.duration.length > 0) {
      await prisma.$executeRaw`UPDATE "Service" SET "duration" = ${body.duration} WHERE "id" = ${service.id}`;
    }

    const [row] = await prisma.$queryRaw<{ duration: string | null }[]>`
      SELECT "duration" FROM "Service" WHERE "id" = ${service.id}`;
    const merged = {
      ...service,
      duration: row?.duration || null,
      features: features ?? []
    } as any;

    return NextResponse.json(merged, { status: 201 });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}