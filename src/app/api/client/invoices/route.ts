import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { invoiceService } from '@/lib/database-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    // Get all invoices for the current user (client)
    const invoices = await invoiceService.getByUserId(session.user.id);

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching client invoices:', error);
    return NextResponse.json(
      { error: 'خطأ في جلب الفواتير' },
      { status: 500 }
    );
  }
}