import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { activityLogService } from "@/lib/database-service";
import { prisma } from "@/lib/db";

// GET /api/activity-log - Get activity logs with advanced filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log("Activity log API - session:", JSON.stringify(session, null, 2));
    console.log("Activity log API - user role:", session?.user?.role);
    
    if (!session) {
      console.log("No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role - if not in session, fetch from database
    let userRole = session.user.role;
    if (!userRole && session.user.id) {
      console.log("Role not in session, fetching from database...");
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
      });
      userRole = user?.role || "";
      console.log("Role from database:", userRole);
    }
    
    if (userRole !== "ADMIN") {
      console.log("User is not admin, role:", userRole);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const search = searchParams.get('search') || '';
    const actionType = searchParams.get('actionType') || '';
    const userId = searchParams.get('userId') || '';
    const dateRange = searchParams.get('dateRange') || '7d';
    const isExport = searchParams.get('export') === 'true';

    // Calculate date filter
    let dateFilter: Date | undefined;
    const now = new Date();
    
    switch (dateRange) {
      case '1d':
        dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        dateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        dateFilter = undefined;
        break;
    }

    // Build where clause
    const whereClause: any = {};
    
    if (actionType) {
      whereClause.actionType = actionType;
    }
    
    if (userId) {
      whereClause.userId = userId;
    }
    
    if (dateFilter) {
      whereClause.createdAt = {
        gte: dateFilter
      };
    }

    // Add search filter
    if (search) {
      whereClause.OR = [
        {
          description: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          user: {
            OR: [
              {
                name: {
                  contains: search,
                  mode: 'insensitive'
                }
              },
              {
                email: {
                  contains: search,
                  mode: 'insensitive'
                }
              }
            ]
          }
        }
      ];
    }

    const activityLogs = await prisma.activityLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: isExport ? undefined : limit
    });

    // If export is requested, return CSV
    if (isExport) {
      const csvHeaders = ['التاريخ', 'نوع النشاط', 'الوصف', 'المستخدم', 'البريد الإلكتروني', 'الدور'];
      const csvData = activityLogs.map(log => [
        new Date(log.createdAt).toLocaleString('ar-EG'),
        log.actionType,
        log.description,
        log.user?.name || 'غير محدد',
        log.user?.email || 'غير محدد',
        log.user?.role || 'غير محدد'
      ]);

      const csvContent = [csvHeaders, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="activity-log-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    return NextResponse.json(activityLogs);
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity logs" },
      { status: 500 }
    );
  }
}

// POST /api/activity-log - Create new activity log
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { actionType, description, metadata } = await request.json();

    if (!actionType || !description) {
      return NextResponse.json(
        { error: "Action type and description are required" },
        { status: 400 }
      );
    }

    const activityLog = await activityLogService.create({
      userId: session.user.id,
      actionType,
      description,
      metadata: metadata || {}
    });

    return NextResponse.json(activityLog, { status: 201 });
  } catch (error) {
    console.error("Error creating activity log:", error);
    return NextResponse.json(
      { error: "Failed to create activity log" },
      { status: 500 }
    );
  }
}

// DELETE /api/activity-log - Bulk delete old activity logs (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const olderThanDays = parseInt(searchParams.get('olderThanDays') || '90');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await prisma.activityLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      }
    });

    // Log this cleanup action
    await activityLogService.create({
      userId: session.user.id,
      actionType: 'SYSTEM',
      description: `تم حذف ${result.count} سجل نشاط أقدم من ${olderThanDays} يوم`,
      metadata: { deletedCount: result.count, olderThanDays }
    });

    return NextResponse.json({ 
      message: `تم حذف ${result.count} سجل نشاط بنجاح`,
      deletedCount: result.count 
    });
  } catch (error) {
    console.error("Error deleting activity logs:", error);
    return NextResponse.json(
      { error: "Failed to delete activity logs" },
      { status: 500 }
    );
  }
}