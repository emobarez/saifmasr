import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/client/dashboard - Get client dashboard data
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "لم يتم العثور على جلسة المستخدم" }, { status: 401 });
    }
    if (session.user.role !== "CLIENT") {
      return NextResponse.json({ error: "غير مسموح لهذا الدور بالوصول إلى لوحة تحكم العميل" }, { status: 403 });
    }

    const userId = session.user.id;

    // Get client's service requests
    let serviceRequests;
    try {
      // Try full selection (if schema migrated)
      serviceRequests = await prisma.serviceRequest.findMany({
        where: { userId },
        include: { service: { select: { name: true, price: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10
      });
    } catch (e: any) {
      if (e.code === 'P2022') {
        // Fallback: select only core legacy columns present before extended migration
        serviceRequests = await prisma.$queryRaw<any[]>`SELECT r.id, r."userId" as "userId", r."serviceId" as "serviceId", r.title, r.description, r.status, r.priority, r."attachmentUrl", r."createdAt", r."updatedAt", s.name as service_name, s.price as service_price FROM "ServiceRequest" r LEFT JOIN "Service" s ON s.id = r."serviceId" WHERE r."userId" = ${userId} ORDER BY r."createdAt" DESC LIMIT 10`;
        // Map to shape similar to Prisma result set
        serviceRequests = serviceRequests.map((r: any) => ({
          id: r.id,
          userId: r.userId,
          serviceId: r.serviceId,
          title: r.title,
          description: r.description,
          status: r.status,
          priority: r.priority,
          attachmentUrl: r.attachmentUrl,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          service: { name: r.service_name, price: r.service_price }
        }));
      } else { throw e; }
    }

    // Get client's invoices (where clientId matches the logged-in user)
    const invoices = await prisma.invoice.findMany({
      where: { clientId: userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Calculate stats matching the UI schema
    const totalServices = serviceRequests.length;
    const activeRequests = serviceRequests.filter(r => r.status === 'PENDING' || r.status === 'IN_PROGRESS').length;
    const completedServices = serviceRequests.filter(r => r.status === 'COMPLETED').length;
    const totalSpent = invoices
      .filter(i => i.status === 'PAID')
      .reduce((sum, i) => sum + Number(i.totalAmount ?? i.amount ?? 0), 0);
    const pendingPayments = invoices
      .filter(i => i.status === 'PENDING' || i.status === 'OVERDUE')
      .reduce((sum, i) => sum + Number(i.totalAmount ?? i.amount ?? 0), 0);

    const stats = {
      totalServices,
      activeRequests,
      completedServices,
      totalSpent: Number(totalSpent) || 0,
      pendingPayments: Number(pendingPayments) || 0,
    };

    // Get recent activities (last 5 service requests)
  const recentRequests = serviceRequests.slice(0, 5).map((request: any) => ({
      id: request.id,
      title: request.title,
      status: request.status.toLowerCase(), // expected by UI: 'pending' | 'in_progress' | 'completed'
      createdAt: request.createdAt.toISOString(), // UI expects createdAt
      priority: request.priority.toLowerCase(), // 'low' | 'medium' | 'high' | 'urgent'
      serviceName: request.service.name,
      servicePrice: request.service.price
    }));

    // Get recent invoices (last 5)
    const recentInvoices = invoices.slice(0, 5).map(invoice => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.totalAmount ?? invoice.amount,
      status: invoice.status.toLowerCase(), // 'pending' | 'paid' | 'overdue'
      dueDate: (invoice.dueDate ?? invoice.createdAt).toISOString(),
      description: invoice.description ?? `فاتورة رقم ${invoice.invoiceNumber}`,
    }));

    // Create notifications based on recent activity
    const notifications = [];
    
    // Add notifications for pending invoices
    const pendingInvoices = invoices.filter(i => i.status === 'PENDING');
    if (pendingInvoices.length > 0) {
      notifications.push({
        id: Date.now(),
        message: `لديك ${pendingInvoices.length} فاتورة معلقة تحتاج للمراجعة`,
        time: "حديث",
        type: "info"
      });
    }

    // Add notifications for overdue invoices
    const overdueInvoices = invoices.filter(i => i.status === 'OVERDUE');
    if (overdueInvoices.length > 0) {
      notifications.push({
        id: Date.now() + 1,
        message: `لديك ${overdueInvoices.length} فاتورة متأخرة السداد`,
        time: "عاجل",
        type: "warning"
      });
    }

    // Add notifications for recent completed requests
    const recentCompleted = serviceRequests.filter(r => r.status === 'COMPLETED').slice(0, 1);
    if (recentCompleted.length > 0) {
      notifications.push({
        id: Date.now() + 2,
        message: `تم إنجاز طلب الخدمة: ${recentCompleted[0].title}`,
        time: "منذ قليل",
        type: "success"
      });
    }

    return NextResponse.json({
      stats,
      recentRequests,
      recentInvoices,
      notifications: notifications.slice(0, 5) // Limit to 5 notifications
    });

  } catch (error: any) {
    console.error("[CLIENT_DASHBOARD_API] Error fetching client dashboard data", {
      message: error?.message,
      stack: error?.stack
    });
    return NextResponse.json(
      { error: "فشل تحميل بيانات لوحة التحكم" },
      { status: 500 }
    );
  }
}