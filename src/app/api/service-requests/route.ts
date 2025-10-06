import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ActivityLogger } from "@/lib/activityLogger";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/service-requests - Create a new service request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    console.log('[service-requests][POST] Incoming payload:', JSON.stringify(payload, null, 2));
    const {
      serviceId,
      title,
      description,
      attachmentUrl,
      userId,
      priority,
      status,
      personnelCount,
      durationUnit,
      startAt,
      endAt,
      locationText,
      locationLat,
      locationLng,
      armamentLevel,
      notes,
      notifyBeforeHours,
      isDraft,
      attachments
    } = payload as Record<string, any>;

    // Admin can create requests for any user, regular users create for themselves
    const requestUserId = (session.user.role === "ADMIN" && userId) ? userId : session.user.id;
    const requestPriority = (session.user.role === "ADMIN" && priority) ? priority : "MEDIUM";
    const requestStatus = (session.user.role === "ADMIN" && status) ? status : "PENDING";

    // Basic validation
    const missing: string[] = [];
    if (!serviceId) missing.push('serviceId');
    if (!title) missing.push('title');
    if (missing.length) {
      console.warn('[service-requests][POST] Missing required fields:', missing);
      return NextResponse.json({ error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 });
    }

    // Transform & validate types
    const parsedPersonnel = personnelCount === undefined || personnelCount === null || personnelCount === '' ? null : Number(personnelCount);
    const parsedNotify = typeof notifyBeforeHours === 'number' ? notifyBeforeHours : Number(notifyBeforeHours) || 24;
    const parsedLocationLat = (locationLat === '' || locationLat === undefined || locationLat === null) ? null : Number(locationLat);
    const parsedLocationLng = (locationLng === '' || locationLng === undefined || locationLng === null) ? null : Number(locationLng);
    const startDateObj = startAt ? new Date(startAt) : null;
    const endDateObj = endAt ? new Date(endAt) : null;
    if (startDateObj && isNaN(startDateObj.getTime())) return NextResponse.json({ error: 'Invalid startAt' }, { status: 400 });
    if (endDateObj && isNaN(endDateObj.getTime())) return NextResponse.json({ error: 'Invalid endAt' }, { status: 400 });
    if (startDateObj && endDateObj && endDateObj <= startDateObj) return NextResponse.json({ error: 'endAt must be after startAt' }, { status: 400 });

    const attachmentCreates = Array.isArray(attachments)
      ? attachments.filter((a: any) => a && a.url).map((a: any) => ({
          url: String(a.url),
          name: a.name ? String(a.name) : null,
          mimeType: a.mimeType ? String(a.mimeType) : null
        }))
      : [];

    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        userId: requestUserId,
        serviceId: String(serviceId),
        title: String(title),
  description: description ? String(description) : '',
        attachmentUrl: attachmentUrl ? String(attachmentUrl) : null,
        status: requestStatus,
        priority: requestPriority,
        personnelCount: parsedPersonnel,
        durationUnit: durationUnit || null,
        startAt: startDateObj,
        endAt: endDateObj,
        locationText: locationText ? String(locationText) : null,
        locationLat: typeof parsedLocationLat === 'number' && !isNaN(parsedLocationLat) ? parsedLocationLat : null,
        locationLng: typeof parsedLocationLng === 'number' && !isNaN(parsedLocationLng) ? parsedLocationLng : null,
        armamentLevel: armamentLevel || null,
        notes: notes ? String(notes) : null,
        notifyBeforeHours: parsedNotify,
        isDraft: !!isDraft,
        attachments: attachmentCreates.length ? { create: attachmentCreates } : undefined
      },
      include: { service: true, user: { select: { id: true, name: true, email: true } }, attachments: true }
    });

    const merged = serviceRequest; // attachments already included

    // Telemetry
    try {
      if (merged.isDraft) {
        await ActivityLogger.serviceRequestDraftCreated(session.user.id, merged.id, {
          serviceId,
          personnelCount,
          armamentLevel,
          notifyBeforeHours
        });
      } else {
        // If created not as draft treat as submitted immediately
        await ActivityLogger.serviceRequestDraftSubmitted(session.user.id, merged.id);
      }
      if (Array.isArray(attachments) && attachments.length) {
        await ActivityLogger.serviceRequestAttachmentAdded(session.user.id, merged.id, attachments.length);
      }
    } catch (e) { /* swallow telemetry errors */ }

  return NextResponse.json(merged, { status: 201 });
  } catch (error: any) {
    // Prisma known error shape detection
    const code = error?.code;
    const meta = error?.meta;
    console.error('[service-requests][POST] Error creating service request:', error);
    return NextResponse.json({
      error: 'Failed to create service request',
      code,
      meta,
      message: error?.message
    }, { status: 500 });
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
  const serviceType = searchParams.get('serviceType');
  const armament = searchParams.get('armamentLevel');
  const draft = searchParams.get('draft');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const extended = searchParams.get('extended');

    let whereClause = {};
    
    // If not admin, only show own requests
    if (session.user.role !== "ADMIN") {
      whereClause = { userId: session.user.id };
    } else if (userId) {
      whereClause = { userId };
    }

    // Build Prisma where filters for extended filtering
    const filters: any = { ...(whereClause as any) };
    if (armament) filters.armamentLevel = armament.toUpperCase();
    if (draft) filters.isDraft = draft === 'true';
    if (from || to) {
      filters.startAt = {};
      if (from) filters.startAt.gte = new Date(from);
      if (to) {
        // If endAt is used as an upper bound for the whole request period, keep both; basic approach
        filters.endAt = { lte: new Date(to) };
      }
    }
    // Filter by service name indirectly (requires relation filter)
    if (serviceType) {
      filters.service = { name: serviceType } as any;
    }

    const serviceRequests = await prisma.serviceRequest.findMany({
      where: filters,
      include: {
        service: true,
        user: { select: { id: true, name: true, email: true } },
        // attachments optional; if type mismatch, fallback will ignore
        attachments: extended === '1' ? true : undefined
      } as any,
      orderBy: { createdAt: 'desc' }
    });

    // If attachments not included (older client or extended flag off), optionally fetch counts when extended requested
    if (extended === '1') {
      for (const r of serviceRequests as any[]) {
        if (!(r as any).attachments) {
          const atts = await prisma.$queryRaw<any[]>`SELECT id, url, name, mimeType, "createdAt" FROM "RequestAttachment" WHERE "requestId" = ${r.id} ORDER BY "createdAt" DESC`;
          (r as any).attachments = atts;
        }
      }
    }
    return NextResponse.json(serviceRequests);
  } catch (error) {
    console.error("Error fetching service requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch service requests" },
      { status: 500 }
    );
  }
}