import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { serviceRequestService } from '@/lib/database-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    // Get all service requests for the current user (client)
    const requests = await serviceRequestService.getAll({
      userId: session.user.id
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching client service requests:', error);
    return NextResponse.json(
      { error: 'خطأ في جلب طلبات الخدمة' },
      { status: 500 }
    );
  }
}