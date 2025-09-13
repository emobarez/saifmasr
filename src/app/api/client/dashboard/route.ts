import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/client/dashboard - Get client dashboard data
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "CLIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get client's service requests
    const serviceRequests = await prisma.serviceRequest.findMany({
      where: { userId },
      include: {
        service: {
          select: { name: true, price: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get client's invoices
    const invoices = await prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Calculate stats
    const stats = {
      totalRequests: serviceRequests.length,
      activeServices: serviceRequests.filter(r => r.status === 'IN_PROGRESS').length,
      completedServices: serviceRequests.filter(r => r.status === 'COMPLETED').length,
      totalSpent: invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.totalAmount, 0),
      pendingInvoices: invoices.filter(i => i.status === 'PENDING').length,
      overdueInvoices: invoices.filter(i => i.status === 'OVERDUE').length
    };

    // Get recent activities (last 5 service requests)
    const recentRequests = serviceRequests.slice(0, 5).map(request => ({
      id: request.id,
      title: request.title,
      status: request.status.toLowerCase(),
      date: request.createdAt.toISOString(),
      priority: request.priority.toLowerCase(),
      serviceName: request.service.name,
      servicePrice: request.service.price
    }));

    // Get recent invoices (last 5)
    const recentInvoices = invoices.slice(0, 5).map(invoice => ({
      id: invoice.invoiceNumber || invoice.id,
      amount: invoice.totalAmount,
      status: invoice.status.toLowerCase(),
      dueDate: invoice.dueDate?.toISOString() || null,
      createdAt: invoice.createdAt.toISOString()
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

  } catch (error) {
    console.error("Error fetching client dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}