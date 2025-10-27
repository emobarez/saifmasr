import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

function periodBounds(period: string) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  switch (period) {
    case 'week': {
      const day = now.getDay();
      const diffToMonday = (day + 6) % 7; // 0=>Sunday
      start.setDate(now.getDate() - diffToMonday);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end, prevStart: new Date(start.getTime() - 7 * 86400000), prevEnd: new Date(end.getTime() - 7 * 86400000) };
    }
    case 'quarter': {
      const q = Math.floor(now.getMonth() / 3);
      start.setMonth(q * 3, 1); start.setHours(0, 0, 0, 0);
      end.setMonth(q * 3 + 3, 0); end.setHours(23, 59, 59, 999);
      const prevStart = new Date(start); prevStart.setMonth(start.getMonth() - 3);
      const prevEnd = new Date(end); prevEnd.setMonth(end.getMonth() - 3);
      return { start, end, prevStart, prevEnd };
    }
    case 'year': {
      start.setMonth(0, 1); start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31); end.setHours(23, 59, 59, 999);
      const prevStart = new Date(start); prevStart.setFullYear(start.getFullYear() - 1);
      const prevEnd = new Date(end); prevEnd.setFullYear(end.getFullYear() - 1);
      return { start, end, prevStart, prevEnd };
    }
    case 'month':
    default: {
      start.setDate(1); start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1, 0); end.setHours(23, 59, 59, 999);
      const prevStart = new Date(start); prevStart.setMonth(start.getMonth() - 1);
      const prevEnd = new Date(end); prevEnd.setMonth(end.getMonth() - 1);
      return { start, end, prevStart, prevEnd };
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'month';
    const { start, end, prevStart, prevEnd } = periodBounds(period);

    // Totals
    const [
      totalRevenueRow,
      totalClientsRow,
      activeServicesRow,
      completedTasksRow,
      revenueCurrentRow,
      revenuePrevRow,
      clientsCurrentRow,
      clientsPrevRow,
      activePrevRow
    ] = await Promise.all([
      prisma.$queryRaw<{ sum: number }[]>`SELECT COALESCE(SUM("totalAmount"),0)::float as sum FROM "Invoice" WHERE "status" = 'PAID'`,
      prisma.$queryRaw<{ cnt: number }[]>`SELECT COUNT(DISTINCT "clientId")::int as cnt FROM "Invoice"`,
      prisma.$queryRaw<{ cnt: number }[]>`SELECT COUNT(*)::int as cnt FROM "Service" WHERE "status" = 'ACTIVE'`,
      prisma.$queryRaw<{ cnt: number }[]>`SELECT COUNT(*)::int as cnt FROM "Assignment" WHERE "status" = 'COMPLETED' AND ("endDate" BETWEEN ${start} AND ${end} OR ("endDate" IS NULL AND "updatedAt" BETWEEN ${start} AND ${end}))`,
      prisma.$queryRaw<{ sum: number }[]>`SELECT COALESCE(SUM("totalAmount"),0)::float as sum FROM "Invoice" WHERE "status"='PAID' AND "createdAt" BETWEEN ${start} AND ${end}`,
      prisma.$queryRaw<{ sum: number }[]>`SELECT COALESCE(SUM("totalAmount"),0)::float as sum FROM "Invoice" WHERE "status"='PAID' AND "createdAt" BETWEEN ${prevStart} AND ${prevEnd}`,
      prisma.$queryRaw<{ cnt: number }[]>`SELECT COUNT(DISTINCT "clientId")::int as cnt FROM "Invoice" WHERE "createdAt" BETWEEN ${start} AND ${end}`,
      prisma.$queryRaw<{ cnt: number }[]>`SELECT COUNT(DISTINCT "clientId")::int as cnt FROM "Invoice" WHERE "createdAt" BETWEEN ${prevStart} AND ${prevEnd}`,
      prisma.$queryRaw<{ cnt: number }[]>`SELECT COUNT(*)::int as cnt FROM "Service" WHERE "status" = 'ACTIVE'`
    ]);

    const totalRevenue = totalRevenueRow[0]?.sum || 0;
    const totalClients = totalClientsRow[0]?.cnt || 0;
    const activeServices = activeServicesRow[0]?.cnt || 0;
    const completedTasks = completedTasksRow[0]?.cnt || 0;
    const revenueCurrent = revenueCurrentRow[0]?.sum || 0;
    const revenuePrev = revenuePrevRow[0]?.sum || 0;
    const clientCurrent = clientsCurrentRow[0]?.cnt || 0;
    const clientPrev = clientsPrevRow[0]?.cnt || 0;
    const activePrev = activePrevRow[0]?.cnt || 0; // fallback; no historical snapshot

    const pct = (a: number, b: number) => (b === 0 ? (a > 0 ? 100 : 0) : Math.round(((a - b) / b) * 100));

    // Monthly revenue series (last 6 months)
    const monthlyRows = await prisma.$queryRaw<any[]>`
      SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') as month,
             COALESCE(SUM("totalAmount"),0)::float as revenue,
             COUNT(DISTINCT "clientId")::int as clients
      FROM "Invoice"
      WHERE "status"='PAID' AND "createdAt" >= (CURRENT_DATE - INTERVAL '6 months')
      GROUP BY 1
      ORDER BY 1 ASC`;

    const monthlyRevenue = monthlyRows.map(r => ({ month: r.month, revenue: Number(r.revenue) || 0, clients: Number(r.clients) || 0 }));

    // Service distribution by revenue per category
    const distRows = await prisma.$queryRaw<any[]>`
      SELECT COALESCE(s."category", 'غير محدد') as name, COALESCE(SUM(i."totalAmount"),0)::float as value
      FROM "Invoice" i
      LEFT JOIN "ServiceRequest" sr ON i."serviceRequestId" = sr."id"
      LEFT JOIN "Service" s ON sr."serviceId" = s."id"
      WHERE i."status"='PAID'
      GROUP BY 1
      ORDER BY 2 DESC`;
    const totalDist = distRows.reduce((acc, r) => acc + Number(r.value || 0), 0) || 1;
    const serviceDistribution = distRows.map(r => ({ name: r.name, value: Number(r.value) || 0, percentage: Math.round(((Number(r.value) || 0) / totalDist) * 100) }));

    // Region performance not available (no region field). Return empty for now.
    const regionPerformance: any[] = [];

    const data = {
      overview: {
        totalRevenue,
        totalClients,
        activeServices,
        completedTasks,
        revenueGrowth: pct(revenueCurrent, revenuePrev),
        clientGrowth: pct(clientCurrent, clientPrev),
        serviceGrowth: pct(activeServices, activePrev)
      },
      monthlyRevenue,
      serviceDistribution,
      regionPerformance
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error generating analytics reports:", error);
    return NextResponse.json({ error: "Failed to generate analytics" }, { status: 500 });
  }
}
