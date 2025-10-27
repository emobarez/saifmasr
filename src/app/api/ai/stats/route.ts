import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/ai/stats - Get AI usage statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get AI tool usage statistics
    const aiUsageStats = await prisma.activityLog.groupBy({
      by: ['actionType'],
      where: {
        actionType: {
          in: ['AI_TOOL_USAGE', 'AI_REPORT_SUMMARY_GENERATED', 'AI_SERVICE_FAQS_GENERATED', 'AI_SERVICE_CATEGORY_SUGGESTED']
        },
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        _all: true
      }
    });

    // Get daily usage
    const dailyUsage = await prisma.activityLog.groupBy({
      by: ['createdAt'],
      where: {
        actionType: 'AI_TOOL_USAGE',
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        _all: true
      }
    });

    // Get top users
    const topUsers = await prisma.activityLog.groupBy({
      by: ['userId'],
      where: {
        actionType: 'AI_TOOL_USAGE',
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        userId: true
      },
      orderBy: {
        _count: {
          userId: 'desc'
        }
      },
      take: 5
    });

    // Get user details for top users
    const userIds = topUsers.map(u => u.userId).filter(Boolean);
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

    const topUsersWithDetails = topUsers.map(usage => {
      const user = users.find(u => u.id === usage.userId);
      return {
        user: user || { name: 'غير محدد', email: 'غير محدد' },
        count: usage._count.userId || 0
      };
    });

    // Calculate totals
    const totalUsage = aiUsageStats.reduce((sum, stat) => sum + stat._count._all, 0);
    const totalErrors = await prisma.activityLog.count({
      where: {
        actionType: 'AI_TOOL_ERROR',
        createdAt: {
          gte: startDate
        }
      }
    });

    return NextResponse.json({
      totalUsage,
      totalErrors,
      successRate: totalUsage > 0 ? ((totalUsage - totalErrors) / totalUsage * 100).toFixed(1) : '100',
      usageByType: aiUsageStats.map(stat => ({
        type: stat.actionType,
        count: stat._count._all
      })),
      dailyUsage: dailyUsage.map(day => ({
        date: day.createdAt,
        count: day._count._all
      })),
      topUsers: topUsersWithDetails,
      period: `آخر ${days} يوم`
    });

  } catch (error) {
    console.error("Error fetching AI stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI statistics" },
      { status: 500 }
    );
  }
}