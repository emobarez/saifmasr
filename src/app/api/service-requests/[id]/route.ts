import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ActivityLogger } from "@/lib/activityLogger";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/service-requests/[id] - Get a specific service request
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: params.id },
      include: {
        service: true,
        user: {
          select: { id: true, name: true, email: true }
        },
        attachments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    }) as any;

    if (!serviceRequest) {
      return NextResponse.json({ error: "Service request not found" }, { status: 404 });
    }

    // Check authorization - admins can view all, users can only view their own
    if (session.user.role !== "ADMIN" && serviceRequest.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(serviceRequest);
  } catch (error) {
    console.error("Error fetching service request:", error);
    return NextResponse.json(
      { error: "Failed to fetch service request" },
      { status: 500 }
    );
  }
}

// PATCH /api/service-requests/[id] - Update a service request
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      status, priority, title, description,
      personnelCount, durationUnit, startAt, endAt,
      locationText, locationLat, locationLng,
      armamentLevel, notes, notifyBeforeHours,
      isDraft, attachments
    } = body;

    const existing = await prisma.serviceRequest.findUnique({
      where: { id: params.id },
      include: { service: true, user: true }
    }) as any;
    if (!existing) {
      return NextResponse.json({ error: "Service request not found" }, { status: 404 });
    }

    const isOwner = existing.userId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';

    // Rules:
    // - Admin can always update basic fields and status/priority
    // - Owner can update ONLY if draft (isDraft = true) and cannot set final status other than leaving it draft or submitting (isDraft false -> status becomes PENDING)
    if (!isAdmin) {
      if (!isOwner) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (!existing.isDraft) {
        return NextResponse.json({ error: 'Cannot edit a submitted request' }, { status: 400 });
      }
      if (status && status !== 'PENDING') {
        return NextResponse.json({ error: 'Invalid status change by client' }, { status: 400 });
      }
    }

    const previousStatus = existing.status;

    // Admin update path (pure Prisma)
    if (isAdmin) {
      const adminData: any = {
        updatedAt: new Date(),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(title && { title }),
        ...(description && { description })
      };
      if (personnelCount !== undefined) adminData.personnelCount = personnelCount;
      if (durationUnit) adminData.durationUnit = durationUnit;
      if (startAt) adminData.startAt = new Date(startAt);
      if (endAt) adminData.endAt = new Date(endAt);
      if (locationText !== undefined) adminData.locationText = locationText;
      if (locationLat !== undefined) adminData.locationLat = typeof locationLat === 'number' ? locationLat : null;
      if (locationLng !== undefined) adminData.locationLng = typeof locationLng === 'number' ? locationLng : null;
      if (armamentLevel) adminData.armamentLevel = armamentLevel;
      if (notes !== undefined) adminData.notes = notes;
      if (notifyBeforeHours !== undefined) adminData.notifyBeforeHours = notifyBeforeHours;
      if (isDraft !== undefined) adminData.isDraft = isDraft;

      // Replace attachments if provided
      let attachmentOps: any = undefined;
      if (Array.isArray(attachments)) {
        attachmentOps = {
          deleteMany: { requestId: params.id },
          create: attachments.filter((a: any) => a?.url).map((a: any) => ({
            url: a.url,
            name: a.name ?? null,
            mimeType: a.mimeType ?? null
          }))
        };
      }

      const updated = await prisma.serviceRequest.update({
        where: { id: params.id },
        data: {
          ...adminData,
          ...(attachmentOps && { attachments: attachmentOps })
        },
        include: { service: true, user: { select: { id: true, name: true, email: true } } } as any
      });

      // Auto invoice on completion (only if no invoice exists yet)
      if (status === 'COMPLETED' && previousStatus !== 'COMPLETED') {
        try {
          if (existing.service.price) {
            // Check if an invoice already exists for this service request
            const existingInvoice = await prisma.invoice.findFirst({
              where: { serviceRequestId: params.id }
            });
            
            // Only create invoice if one doesn't exist
            if (!existingInvoice) {
              const { invoiceService } = await import('@/lib/database-service');
              await invoiceService.createFromServiceRequest(params.id, session.user.id);
            }
          }
        } catch (e) { console.error('Invoice create failed', e); }
      }

      try {
        if (status && status !== previousStatus) {
          await ActivityLogger.serviceRequestDraftUpdated(session.user.id, params.id, { statusChange: { from: previousStatus, to: status } });
        } else {
          await ActivityLogger.serviceRequestDraftUpdated(session.user.id, params.id, { adminUpdate: true });
        }
        if (Array.isArray(attachments) && attachments.length) {
          await ActivityLogger.serviceRequestAttachmentAdded(session.user.id, params.id, attachments.length);
        }
      } catch (e) {}
      return NextResponse.json(updated);
    }

    // Owner draft update path
  const newIsDraft = typeof isDraft === 'boolean' ? isDraft : existing.isDraft;
    const effectiveStatus = newIsDraft ? existing.status : 'PENDING';

    // Update core editable fields for client draft
    if (title || description) {
      await prisma.serviceRequest.update({
        where: { id: params.id },
        data: {
          ...(title && { title }),
          ...(description && { description }),
          status: effectiveStatus,
          updatedAt: new Date()
        }
      });
    }

    const clientData: any = {
      personnelCount: personnelCount ?? existing.personnelCount,
      durationUnit: durationUnit ?? existing.durationUnit,
      startAt: startAt ? new Date(startAt) : existing.startAt,
      endAt: endAt ? new Date(endAt) : existing.endAt,
      locationText: locationText ?? existing.locationText,
      locationLat: typeof locationLat === 'number' ? locationLat : existing.locationLat,
      locationLng: typeof locationLng === 'number' ? locationLng : existing.locationLng,
      armamentLevel: armamentLevel ?? existing.armamentLevel,
      notes: notes ?? existing.notes,
      notifyBeforeHours: typeof notifyBeforeHours === 'number' ? notifyBeforeHours : existing.notifyBeforeHours,
      isDraft: newIsDraft,
      updatedAt: new Date()
    };

    let attachmentOpsClient: any = undefined;
    if (Array.isArray(attachments)) {
      attachmentOpsClient = {
        deleteMany: { requestId: params.id },
        create: attachments.filter((a: any) => a?.url).map((a: any) => ({
          url: a.url,
          name: a.name ?? null,
          mimeType: a.mimeType ?? null
        }))
      };
    }

    const updatedClient = await prisma.serviceRequest.update({
      where: { id: params.id },
      data: {
        ...clientData,
        ...(attachmentOpsClient && { attachments: attachmentOpsClient })
      },
      include: { attachments: true } as any
    });
    const payload = updatedClient as any;
    try {
      if (existing.isDraft && !newIsDraft) {
        await ActivityLogger.serviceRequestDraftSubmitted(session.user.id, params.id);
      } else if (existing.isDraft && newIsDraft) {
        await ActivityLogger.serviceRequestDraftUpdated(session.user.id, params.id, { personnelCount, armamentLevel, notifyBeforeHours });
      } else {
        // Non-draft minor update
        await ActivityLogger.serviceRequestDraftUpdated(session.user.id, params.id, { postSubmitEdit: true });
      }
      if (Array.isArray(attachments) && attachments.length) {
        await ActivityLogger.serviceRequestAttachmentAdded(session.user.id, params.id, attachments.length);
      }
    } catch (e) { }
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Error updating service request:", error);
    return NextResponse.json({ error: 'Failed to update service request' }, { status: 500 });
  }
}

// DELETE /api/service-requests/[id] - Delete a service request
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can delete service requests
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate the request exists
    const existingRequest = await prisma.serviceRequest.findUnique({
      where: { id: params.id }
    });

    if (!existingRequest) {
      return NextResponse.json({ error: "Service request not found" }, { status: 404 });
    }

    // Delete the service request
    await prisma.serviceRequest.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: "Service request deleted successfully" });
  } catch (error) {
    console.error("Error deleting service request:", error);
    return NextResponse.json(
      { error: "Failed to delete service request" },
      { status: 500 }
    );
  }
}