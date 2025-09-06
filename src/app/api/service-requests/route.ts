import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/service-requests - Create a new service request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { serviceId, title, description, attachmentUrl } = await request.json();

    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        userId: session.user.id,
        serviceId,
        title,
        description,
        attachmentUrl,
        status: "PENDING",
        priority: "MEDIUM"
      },
      include: {
        service: true,
        user: true
      }
    });

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