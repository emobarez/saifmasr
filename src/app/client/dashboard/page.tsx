"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/AuthContext";
import { 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  DollarSign,
  TrendingUp,
  Calendar,
  Shield,
  ArrowRight,
  Bell,
  CreditCard,
  FileText,
  Users,
  BarChart3,
  Activity,
  Zap
} from "lucide-react";
import Link from "next/link";

// Mock data for demonstration
const dashboardData = {
  stats: {
    totalRequests: 12,
    activeServices: 3,
    completedServices: 9,
    totalSpent: 85000,
    pendingInvoices: 2,
    overdueInvoices: 0
  },
  recentRequests: [
    {
      id: "REQ-001",
      title: "حراسة أمنية للمكتب",
      status: "in_progress",
      date: "2024-01-15",
      priority: "high"
    },
    {
      id: "REQ-002",
      title: "تأمين فعالية",
      status: "completed",
      date: "2024-01-10",
      priority: "medium"
    },
    {
      id: "REQ-003",
      title: "استشارة أمنية",
      status: "pending",
      date: "2024-01-18",
      priority: "low"
    }
  ],
  recentInvoices: [
    {
      id: "INV-2024-001",
      amount: 15000,
      status: "paid",
      dueDate: "2024-02-15"
    },
    {
      id: "INV-2024-002",
      amount: 8500,
      status: "pending",
      dueDate: "2024-02-20"
    }
  ],
  notifications: [
    {
      id: 1,
      message: "تم قبول طلب الخدمة REQ-001",
      time: "منذ ساعتين",
      type: "success"
    },
    {
      id: 2,
      message: "فاتورة جديدة متاحة للمراجعة",
      time: "منذ 4 ساعات",
      type: "info"
    }
  ]
};

const statusConfig = {
  pending: { label: "قيد الانتظار", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  in_progress: { label: "قيد التنفيذ", color: "bg-blue-100 text-blue-800", icon: AlertCircle },
  completed: { label: "مكتمل", color: "bg-green-100 text-green-800", icon: CheckCircle }
};

export default function ClientDashboardPage() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "صباح الخير";
    if (hour < 17) return "مساء الخير";
    return "مساء الخير";
  };

  return (
    <div className="space-y-6">
      {/* Header with Greeting */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">لوحة التحكم الرئيسية</h1>
          <p className="text-muted-foreground mt-1">
            {getGreeting()}، {user?.name || "عزيزي العميل"} - {currentTime.toLocaleDateString('ar-SA')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/client/requests">
              <Plus className="h-4 w-4 mr-2" />
              طلب خدمة جديدة
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي الطلبات</p>
                <p className="text-3xl font-bold text-blue-600">{dashboardData.stats.totalRequests}</p>
                <p className="text-xs text-muted-foreground mt-1">+2 هذا الشهر</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">الخدمات النشطة</p>
                <p className="text-3xl font-bold text-green-600">{dashboardData.stats.activeServices}</p>
                <p className="text-xs text-muted-foreground mt-1">جاري التنفيذ</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي الإنفاق</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(dashboardData.stats.totalSpent)}</p>
                <p className="text-xs text-muted-foreground mt-1">هذا العام</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">الفواتير المعلقة</p>
                <p className="text-3xl font-bold text-orange-600">{dashboardData.stats.pendingInvoices}</p>
                <p className="text-xs text-muted-foreground mt-1">تحتاج دفع</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <CreditCard className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            إجراءات سريعة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button asChild variant="outline" className="h-auto p-4">
              <Link href="/client/requests" className="flex flex-col items-center gap-2">
                <Plus className="h-6 w-6" />
                <span className="text-sm">طلب خدمة</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4">
              <Link href="/client/tracking" className="flex flex-col items-center gap-2">
                <Clock className="h-6 w-6" />
                <span className="text-sm">تتبع الطلبات</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4">
              <Link href="/client/invoices" className="flex flex-col items-center gap-2">
                <CreditCard className="h-6 w-6" />
                <span className="text-sm">الفواتير</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4">
              <Link href="/client/profile" className="flex flex-col items-center gap-2">
                <Users className="h-6 w-6" />
                <span className="text-sm">الملف الشخصي</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>الطلبات الأخيرة</CardTitle>
              <CardDescription>آخر 3 طلبات خدمة</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/client/tracking" className="flex items-center gap-1">
                عرض الكل
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData.recentRequests.map((request) => {
              const StatusIcon = statusConfig[request.status as keyof typeof statusConfig].icon;
              return (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{request.title}</h4>
                      <Badge className={statusConfig[request.status as keyof typeof statusConfig].color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig[request.status as keyof typeof statusConfig].label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{request.id} • {request.date}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    عرض
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>الفواتير الأخيرة</CardTitle>
              <CardDescription>آخر الفواتير والمدفوعات</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/client/invoices" className="flex items-center gap-1">
                عرض الكل
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData.recentInvoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{invoice.id}</h4>
                    <Badge className={invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {invoice.status === 'paid' ? 'مدفوعة' : 'قيد الانتظار'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">استحقاق: {invoice.dueDate}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(invoice.amount)}</p>
                  {invoice.status === 'pending' && (
                    <Button variant="outline" size="sm" className="mt-1">
                      دفع الآن
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            نظرة عامة على الأداء
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>معدل إنجاز الطلبات</span>
                <span className="font-medium">85%</span>
              </div>
              <Progress value={85} className="h-2" />
              <p className="text-xs text-muted-foreground">9 من 12 طلب مكتمل</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>الدفع في الوقت المحدد</span>
                <span className="font-medium">92%</span>
              </div>
              <Progress value={92} className="h-2" />
              <p className="text-xs text-muted-foreground">لا توجد متأخرات</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>رضا الخدمة</span>
                <span className="font-medium">98%</span>
              </div>
              <Progress value={98} className="h-2" />
              <p className="text-xs text-muted-foreground">تقييم ممتاز</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            الإشعارات الأخيرة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dashboardData.notifications.map((notification) => (
              <div key={notification.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className={`p-2 rounded-full ${notification.type === 'success' ? 'bg-green-100' : 'bg-blue-100'}`}>
                  {notification.type === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Bell className="h-4 w-4 text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{notification.message}</p>
                  <p className="text-xs text-muted-foreground">{notification.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Status */}
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-full">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-800">حسابك آمن ومحمي</h3>
              <p className="text-sm text-green-700">جميع خدماتك تعمل بشكل طبيعي. آخر فحص أمني: منذ ساعة واحدة</p>
            </div>
            <Badge className="bg-green-100 text-green-800">نشط</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
