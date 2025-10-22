import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { logActivity } from "@/lib/activityLogger";

// POST /api/service-requests - Create a new service request
const RequestSchema = z.object({
  serviceId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  attachmentUrl: z.string().url().optional(),
  userId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  details: z.any().optional(),
  attachments: z.array(z.object({ url: z.string().url(), name: z.string() }).passthrough()).optional(),
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().optional(),
  locationAddress: z.string().optional(),
  locationLat: z.coerce.number().optional(),
  locationLng: z.coerce.number().optional(),
  armamentLevel: z.enum(["NONE", "SOUND_WEAPON", "FIREARM"]).optional(),
  headcount: z.coerce.number().int().positive().optional(),
  unitPrice: z.coerce.number().nonnegative().optional(),
  extraCost: z.coerce.number().nonnegative().optional(),
  remindBefore24h: z.coerce.boolean().optional(),
  isDraft: z.coerce.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = RequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }
    const {
      serviceId,
      title,
      description,
      attachmentUrl,
      userId,
      priority,
      status,
      details,
      attachments,
      startAt,
      endAt,
      locationAddress,
      locationLat,
      locationLng,
      armamentLevel,
      headcount,
      unitPrice,
      extraCost,
      remindBefore24h,
      isDraft
    } = parsed.data as any;

    // Admin can create requests for any user, regular users create for themselves
    const requestUserId = (session.user.role === "ADMIN" && userId) ? userId : session.user.id;
    const requestPriority = (session.user.role === "ADMIN" && priority) ? priority : "MEDIUM";
    const requestStatus = (session.user.role === "ADMIN" && status) ? status : "PENDING";

    // Compute totals if pricing provided
    const parsedHeadcount = typeof headcount === 'number' ? headcount : undefined;
    const parsedUnitPrice = typeof unitPrice === 'number' ? unitPrice : undefined;
    const parsedExtra = typeof extraCost === 'number' ? extraCost : 0;
    const totalCost = parsedHeadcount && parsedUnitPrice ? (parsedHeadcount * parsedUnitPrice) + (parsedExtra || 0) : undefined;

    const serviceRequest = await (prisma as any).serviceRequest.create({
      data: {
        userId: requestUserId,
        serviceId,
        title,
        description,
        attachmentUrl,
        // New fields
        details: { ...(details ?? {}), ...(armamentLevel ? { armamentLevel } : {}) },
        attachments: attachments ?? undefined,
        startAt: startAt ?? undefined,
        endAt: endAt ?? undefined,
        locationAddress: locationAddress ?? undefined,
        locationLat: typeof locationLat === 'number' ? locationLat : undefined,
        locationLng: typeof locationLng === 'number' ? locationLng : undefined,
        // armamentLevel top-level intentionally omitted to avoid enum conflicts on existing DB
        headcount: parsedHeadcount,
        unitPrice: parsedUnitPrice,
        extraCost: parsedExtra,
        totalCost: totalCost,
        remindBefore24h: !!remindBefore24h,
        isDraft: !!isDraft,
        status: requestStatus,
        priority: requestPriority
      },
      include: {
        service: true,
        user: true
      }
    });

    // Log activity for admin in-app notifications
    try {
      await logActivity({
        actionType: 'SERVICE_REQUEST_SUBMITTED',
        description: `طلب خدمة جديد: ${serviceRequest.title} (${serviceRequest.service?.name || ''})`,
        actor: {
          id: serviceRequest.userId,
          role: 'client',
          name: (serviceRequest as any).user?.name,
          email: (serviceRequest as any).user?.email,
        },
        target: {
          id: serviceRequest.id,
          type: 'service_request',
          name: serviceRequest.title,
        },
        details: {
          serviceId,
          requestId: serviceRequest.id,
          priority: serviceRequest.priority,
          status: serviceRequest.status,
          totalCost: (serviceRequest as any).totalCost ?? null,
        },
      });
    } catch (e) {
      console.error('Failed to log activity for service request submission', e);
    }

    // Create follow-up reminder if requested and startAt is provided
    if ((serviceRequest as any).remindBefore24h && (serviceRequest as any).startAt) {
      const dueAt = new Date(((serviceRequest as any).startAt as Date).getTime() - 24 * 60 * 60 * 1000);
      try {
        await (prisma as any).reminder.create({
          data: {
            serviceRequestId: serviceRequest.id,
            type: 'FOLLOW_UP_24H',
            dueAt,
            channel: 'EMAIL'
          }
        });
      } catch (e) {
        console.error('Failed to create reminder record:', e);
      }
    }

    return NextResponse.json(serviceRequest, { status: 201 });
  } catch (error) {
    console.error("Error creating service request:", error);
    return NextResponse.json(
      { error: "Failed to create service request" },
      { status: 500 }
    );
  }
}

// GET /api/service-requests - Get service requests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let whereClause = {};
    
    // If not admin, only show own requests
    if (session.user.role !== "ADMIN") {
      whereClause = { userId: session.user.id };
    } else if (userId) {
      whereClause = { userId };
    }

    const serviceRequests = await prisma.serviceRequest.findMany({
      where: whereClause,
      include: {
        service: true,
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(serviceRequests);
  } catch (error) {
    console.error("Error fetching service requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch service requests" },
      { status: 500 }
    );
  }
}