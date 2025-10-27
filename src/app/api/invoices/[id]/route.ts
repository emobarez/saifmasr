import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { invoiceService } from '@/lib/database-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const invoice = await invoiceService.getById(params.id);
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      amount,
      taxAmount,
      totalAmount,
      description,
      dueDate,
      status,
      paymentMethod,
      paidAt
    } = body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    if (!['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Check if invoice exists
    const existingInvoice = await invoiceService.getById(params.id);
    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const updateData: any = {
      amount: parseFloat(amount),
      taxAmount: parseFloat(taxAmount),
      totalAmount: parseFloat(totalAmount),
      status,
    };

    if (description !== undefined) {
      updateData.description = description;
    }

    if (dueDate) {
      updateData.dueDate = new Date(dueDate);
    }

    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }

    if (paidAt) {
      updateData.paidAt = new Date(paidAt);
    }

    const updatedInvoice = await invoiceService.update(params.id, updateData);

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}