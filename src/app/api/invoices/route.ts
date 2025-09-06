import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { invoiceService } from "@/lib/database-service";

// GET /api/invoices - Get all invoices
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoices = await invoiceService.getAll();
    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

// POST /api/invoices - Create a new invoice
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { 
      userId, 
      clientId, 
      amount, 
      description, 
      dueDate, 
      taxAmount,
      items 
    } = await request.json();

    if (!userId || !clientId || !amount) {
      return NextResponse.json(
        { error: "User ID, client ID, and amount are required" },
        { status: 400 }
      );
    }

    const invoice = await invoiceService.create({
      userId,
      clientId,
      amount: parseFloat(amount),
      currency: "EGP", // Egyptian Pounds
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      taxAmount: taxAmount ? parseFloat(taxAmount) : undefined,
      items
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}