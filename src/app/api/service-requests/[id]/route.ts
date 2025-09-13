import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
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

    // Only admins can update service requests
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { status, priority, title, description } = await request.json();

    // Validate the request exists
    const existingRequest = await prisma.serviceRequest.findUnique({
      where: { id: params.id },
      include: {
        service: true,
        user: true
      }
    });

    if (!existingRequest) {
      return NextResponse.json({ error: "Service request not found" }, { status: 404 });
    }

    const previousStatus = existingRequest.status;

    // Update the service request
    const updatedRequest = await prisma.serviceRequest.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(title && { title }),
        ...(description && { description }),
        updatedAt: new Date()
      },
      include: {
        service: true,
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Auto-create invoice if status changed to COMPLETED and no invoice exists
    if (status === 'COMPLETED' && previousStatus !== 'COMPLETED') {
      try {
        if (existingRequest.service.price) {
          // Create invoice using the existing service
          const { invoiceService } = await import('@/lib/database-service');
          
          await invoiceService.createFromServiceRequest(
            params.id,
            session.user.id
          );
          
          console.log(`✅ Auto-created invoice for completed service request ${params.id}`);
        }
      } catch (invoiceError) {
        console.error('Error auto-creating invoice:', invoiceError);
        // Don't fail the status update if invoice creation fails
      }
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("Error updating service request:", error);
    return NextResponse.json(
      { error: "Failed to update service request" },
      { status: 500 }
    );
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