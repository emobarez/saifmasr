import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { invoiceService } from "@/lib/database-service";

// POST /api/invoices/from-service-request - Create invoice from service request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { serviceRequestId, dueDate } = await request.json();

    if (!serviceRequestId) {
      return NextResponse.json(
        { error: "Service Request ID is required" },
        { status: 400 }
      );
    }

    // Create invoice from service request
    const invoice = await invoiceService.createFromServiceRequest(
      serviceRequestId,
      session.user.id,
      dueDate ? new Date(dueDate) : undefined
    );

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice from service request:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create invoice from service request" },
      { status: 500 }
    );
  }
}