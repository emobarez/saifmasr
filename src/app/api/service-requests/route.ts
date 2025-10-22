import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ActivityLogger } from "@/lib/activityLogger";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/service-requests - Create a new service request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await request.json();
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
      attachments,
    } = payload as Record<string, any>;

    // Permissions and defaults
    const requestUserId = session.user.role === "ADMIN" && userId ? userId : session.user.id;
    const requestPriority = session.user.role === "ADMIN" && priority ? String(priority) : "MEDIUM";
    const requestStatus = session.user.role === "ADMIN" && status ? String(status) : "PENDING";

    // Minimal validation
    const missing: string[] = [];
    if (!serviceId) missing.push("serviceId");
    if (!title) missing.push("title");
    if (missing.length) {
      return NextResponse.json({ error: `Missing required fields: ${missing.join(", ")}` }, { status: 400 });
    }

    // Parse and coerce types
    const parsedPersonnel = personnelCount === undefined || personnelCount === null || personnelCount === "" ? null : Number(personnelCount);
    const parsedNotify = typeof notifyBeforeHours === "number" ? notifyBeforeHours : Number(notifyBeforeHours) || 24;
    const parsedLocationLat = locationLat === undefined || locationLat === null || locationLat === "" ? null : Number(locationLat);
    const parsedLocationLng = locationLng === undefined || locationLng === null || locationLng === "" ? null : Number(locationLng);
    const startDateObj = startAt ? new Date(startAt) : null;
    const endDateObj = endAt ? new Date(endAt) : null;
    if (startDateObj && isNaN(startDateObj.getTime())) return NextResponse.json({ error: "Invalid startAt" }, { status: 400 });
    if (endDateObj && isNaN(endDateObj.getTime())) return NextResponse.json({ error: "Invalid endAt" }, { status: 400 });
    if (startDateObj && endDateObj && endDateObj <= startDateObj) return NextResponse.json({ error: "endAt must be after startAt" }, { status: 400 });

    const attachmentCreates = Array.isArray(attachments)
      ? attachments
          .filter((a: any) => a && a.url)
          .map((a: any) => ({ url: String(a.url), name: a.name ? String(a.name) : null, mimeType: a.mimeType ? String(a.mimeType) : null }))
      : [];

    const created = await prisma.serviceRequest.create({
      data: {
        userId: requestUserId,
        serviceId: String(serviceId),
        title: String(title),
        description: description ? String(description) : "",
        attachmentUrl: attachmentUrl ? String(attachmentUrl) : null,
        status: requestStatus as any,
        priority: requestPriority as any,
        personnelCount: parsedPersonnel,
        durationUnit: durationUnit || null,
        startAt: startDateObj,
        endAt: endDateObj,
        locationText: locationText ? String(locationText) : null,
        locationLat: typeof parsedLocationLat === "number" && !isNaN(parsedLocationLat) ? parsedLocationLat : null,
        locationLng: typeof parsedLocationLng === "number" && !isNaN(parsedLocationLng) ? parsedLocationLng : null,
        armamentLevel: armamentLevel || null,
        notes: notes ? String(notes) : null,
        notifyBeforeHours: parsedNotify,
        isDraft: !!isDraft,
        attachments: attachmentCreates.length ? { create: attachmentCreates } : undefined,
      },
      include: { service: true, user: { select: { id: true, name: true, email: true } }, attachments: true },
    });

    try {
      if (created.isDraft) {
        await ActivityLogger.serviceRequestDraftCreated(session.user.id, created.id, {
          serviceId,
          personnelCount,
          armamentLevel,
          notifyBeforeHours: parsedNotify,
        });
      } else {
        await ActivityLogger.serviceRequestDraftSubmitted(session.user.id, created.id);
      }
      if (Array.isArray(attachments) && attachments.length) {
        await ActivityLogger.serviceRequestAttachmentAdded(session.user.id, created.id, attachments.length);
      }
    } catch {}

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    const code = (error && (error as any).code) || undefined;
    const meta = (error && (error as any).meta) || undefined;
    console.error("[service-requests][POST] Error:", error);
    return NextResponse.json({ error: "Failed to create service request", code, meta, message: error?.message }, { status: 500 });
  }
}

// GET /api/service-requests - List service requests with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const serviceType = searchParams.get("serviceType");
    const armament = searchParams.get("armamentLevel");
    const draft = searchParams.get("draft");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const extended = searchParams.get("extended");

    let whereClause: any = {};
    if (session.user.role !== "ADMIN") {
      whereClause = { userId: session.user.id };
    } else if (userId) {
      whereClause = { userId };
    }

    const filters: any = { ...whereClause };
    if (armament) filters.armamentLevel = armament.toUpperCase();
    if (draft) filters.isDraft = draft === "true";
    if (from || to) {
      filters.startAt = {};
      if (from) filters.startAt.gte = new Date(from);
      if (to) filters.endAt = { lte: new Date(to) };
    }
    if (serviceType) {
      filters.service = { name: serviceType } as any;
    }

    const results = await prisma.serviceRequest.findMany({
      where: filters,
      include: {
        service: true,
        user: { select: { id: true, name: true, email: true } },
        attachments: extended === "1" ? true : undefined,
      } as any,
      orderBy: { createdAt: "desc" },
    });

    if (extended === "1") {
      for (const r of results as any[]) {
        if (!(r as any).attachments) {
          const atts = await prisma.$queryRaw<any[]>`SELECT id, url, name, mimeType, "createdAt" FROM "RequestAttachment" WHERE "requestId" = ${r.id} ORDER BY "createdAt" DESC`;
          (r as any).attachments = atts;
        }
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching service requests:", error);
    return NextResponse.json({ error: "Failed to fetch service requests" }, { status: 500 });
  }
}
/*
import { prisma } from "@/lib/db";
import { ActivityLogger } from "@/lib/activityLogger";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

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
 
      personnelCount,
      durationUnit,
      startAt,
      endAt,
      const payload = await request.json();
      console.log('[service-requests][POST] Incoming payload:', JSON.stringify(payload, null, 2));

    // Admin can create requests for any user, regular users create for themselves
    const requestUserId = (session.user.role === "ADMIN" && userId) ? userId : session.user.id;
    const requestPriority = (session.user.role === "ADMIN" && priority) ? priority : "MEDIUM";
    const requestStatus = (session.user.role === "ADMIN" && status) ? status : "PENDING";

<<<<<<< HEAD
    // Compute totals if pricing provided
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
=======
    // Basic validation
    if (!serviceId) missing.push('serviceId');
    if (!title) missing.push('title');
    if (missing.length) {
      console.warn('[service-requests][POST] Missing required fields:', missing);
      return NextResponse.json({ error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 });

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
            armamentLevel,
            notifyBeforeHours
          });
        } else {
          // If created not as draft treat as submitted immediately
    
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
*/