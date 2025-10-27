import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/activity-log/stats - Get activity log statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const lastDay = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get total count
    const total = await prisma.activityLog.count();

    // Get counts by time periods
    const [lastDayCount, lastWeekCount, lastMonthCount] = await Promise.all([
      prisma.activityLog.count({
        where: {
          createdAt: {
            gte: lastDay
          }
        }
      }),
      prisma.activityLog.count({
        where: {
          createdAt: {
            gte: lastWeek
          }
        }
      }),
      prisma.activityLog.count({
        where: {
          createdAt: {
            gte: lastMonth
          }
        }
      })
    ]);

    // Get activity counts by type
    const byTypeResults = await prisma.activityLog.groupBy({
      by: ['actionType'],
      _count: {
        actionType: true
      },
      orderBy: {
        _count: {
          actionType: 'desc'
        }
      },
      take: 10
    });

    const byType = byTypeResults.reduce((acc, item) => {
      acc[item.actionType] = item._count.actionType;
      return acc;
    }, {} as Record<string, number>);

    // Get activity counts by user (top 10)
    const byUserResults = await prisma.activityLog.groupBy({
      by: ['userId'],
      _count: {
        userId: true
      },
      where: {
        userId: {
          not: null
        }
      },
      orderBy: {
        _count: {
          userId: 'desc'
        }
      },
      take: 10
    });

    // Get user details for the top active users
    const userIds = byUserResults.map(item => item.userId).filter(id => id !== null);
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds as string[]
        }
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    const byUser = byUserResults.reduce((acc, item) => {
      if (item.userId) {
        const user = users.find(u => u.id === item.userId);
        const userLabel = user?.name || user?.email || 'مستخدم غير معروف';
        acc[userLabel] = item._count.userId;
      }
      return acc;
    }, {} as Record<string, number>);

    // Get recent errors and warnings
    const recentIssues = await prisma.activityLog.findMany({
      where: {
        actionType: {
          in: ['ERROR', 'WARNING']
        },
        createdAt: {
          gte: lastWeek
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    const stats = {
      total,
      lastDay: lastDayCount,
      lastWeek: lastWeekCount,
      lastMonth: lastMonthCount,
      byType,
      byUser,
      recentIssues,
      averagePerDay: Math.round(lastWeekCount / 7),
      healthStatus: {
        database: 'healthy',
        logging: 'active',
        performance: lastDayCount < 1000 ? 'good' : lastDayCount < 5000 ? 'moderate' : 'high'
      }
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching activity log statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity log statistics" },
      { status: 500 }
    );
  }
}