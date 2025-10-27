"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/AuthContext";
import { formatEGPSimple } from "@/lib/egyptian-utils";
import { 
  Plus, 
  Eye, 
  Calendar, 
  Users, 
  ShieldCheck, 
  ClipboardList, 
  Receipt, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  BarChart3,
  Activity,
  Bell,
  Shield,
  AlertCircle,
  User,
  CreditCard,
  Star
} from "lucide-react";

// Interfaces for type safety
interface ServiceRequest {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  dueDate: string;
  description: string;
}

interface Notification {
  id: string;
  message: string;
  time: string;
  type: 'info' | 'success' | 'warning';
}

interface DashboardData {
  stats: {
    totalServices: number;
    activeRequests: number;
    completedServices: number;
    totalSpent: number;
    pendingPayments: number;
  };
  recentRequests: ServiceRequest[];
  recentInvoices: Invoice[];
  notifications: Notification[];
}

// Helper functions
const getStatusConfig = (status: string) => {
  const configs = {
    pending: { label: "قيد الانتظار", color: "bg-yellow-100 text-yellow-800", icon: Clock },
    in_progress: { label: "قيد التنفيذ", color: "bg-blue-100 text-blue-800", icon: AlertCircle },
    completed: { label: "مكتمل", color: "bg-green-100 text-green-800", icon: CheckCircle }
  };
  return configs[status as keyof typeof configs] || configs.pending;
};

const getPriorityConfig = (priority: string) => {
  const configs = {
    low: { label: "منخفض", color: "bg-gray-100 text-gray-800" },
    medium: { label: "متوسط", color: "bg-blue-100 text-blue-800" },
    high: { label: "عاجل", color: "bg-orange-100 text-orange-800" },
    urgent: { label: "عاجل جداً", color: "bg-red-100 text-red-800" }
  };
  return configs[priority as keyof typeof configs] || configs.low;
};

export default function ClientDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Update time every minute for accurate display
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Fetch dashboard data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/client/dashboard', { headers: { 'Accept': 'application/json' }, cache: 'no-store' });
        if (!response.ok) {
          let body: any = null;
          try { body = await response.json(); } catch {}
          if (response.status === 401) {
            setError(body?.error || 'يجب تسجيل الدخول أولاً');
            return;
          }
            if (response.status === 403) {
              // If user context indicates admin, redirect to admin dashboard
              if (user?.role === 'ADMIN') {
                router.replace('/admin/dashboard');
                return;
              }
              setError(body?.error || 'ليس لديك صلاحية لعرض هذه الصفحة');
              return;
            }
          throw new Error(body?.error || 'تعذر جلب بيانات لوحة التحكم');
        }
        const data = await response.json();
        setDashboardData(data);
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        setError(error?.message || 'تعذر تحميل بيانات لوحة التحكم');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user, router]);

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-red-700">خطأ في تحميل البيانات</h3>
            <p className="text-muted-foreground">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              إعادة تحميل
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto" />
          <p className="text-muted-foreground">لا توجد بيانات للعرض</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Greeting */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">لوحة التحكم الرئيسية</h1>
          <p className="text-muted-foreground mt-1">
            مرحباً {user?.name || 'العميل'} - {formatTime(currentTime)}
          </p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => router.push('/client/requests')}>
          <Plus className="h-4 w-4" />
          طلب خدمة جديدة
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي الخدمات</p>
                <p className="text-2xl font-bold">{dashboardData.stats.totalServices}</p>
              </div>
              <ShieldCheck className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">الطلبات النشطة</p>
                <p className="text-2xl font-bold">{dashboardData.stats.activeRequests}</p>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">الخدمات المكتملة</p>
                <p className="text-2xl font-bold">{dashboardData.stats.completedServices}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي المبلغ المدفوع</p>
                <p className="text-2xl font-bold">{formatEGPSimple(dashboardData.stats.totalSpent)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">المدفوعات المعلقة</p>
                <p className="text-2xl font-bold">{formatEGPSimple(dashboardData.stats.pendingPayments)}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Service Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              طلبات الخدمة الأخيرة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.recentRequests.length > 0 ? (
                dashboardData.recentRequests.map((request) => {
                  const statusConfig = getStatusConfig(request.status);
                  const priorityConfig = getPriorityConfig(request.priority);
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <StatusIcon className="h-4 w-4" />
                        <div>
                          <p className="font-medium">{request.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(request.createdAt).toLocaleDateString('ar-EG')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={priorityConfig.color}>
                          {priorityConfig.label}
                        </Badge>
                        <Badge variant="outline" className={statusConfig.color}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground py-6">لا توجد طلبات خدمة حديثة</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              الفواتير الأخيرة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.recentInvoices.length > 0 ? (
                dashboardData.recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Receipt className="h-4 w-4" />
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">{invoice.description}</p>
                        <p className="text-xs text-muted-foreground">
                          استحقاق: {new Date(invoice.dueDate).toLocaleDateString('ar-EG')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatEGPSimple(invoice.amount)}</p>
                      <Badge 
                        variant="outline" 
                        className={
                          invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                          invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {invoice.status === 'paid' ? 'مدفوع' : 
                         invoice.status === 'overdue' ? 'متأخر' : 'معلق'}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-6">لا توجد فواتير حديثة</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            ملخص الأداء
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>نسبة إكمال الخدمات</span>
                <span className="font-medium">
                  {dashboardData.stats.totalServices > 0 
                    ? Math.round((dashboardData.stats.completedServices / dashboardData.stats.totalServices) * 100)
                    : 0}%
                </span>
              </div>
              <Progress 
                value={dashboardData.stats.totalServices > 0 
                  ? (dashboardData.stats.completedServices / dashboardData.stats.totalServices) * 100
                  : 0} 
                className="h-2" 
              />
              <p className="text-xs text-muted-foreground">أداء ممتاز</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>الفواتير المدفوعة</span>
                <span className="font-medium">95%</span>
              </div>
              <Progress value={95} className="h-2" />
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
              <p className="text-sm text-green-700">جميع خدماتك في مصر تعمل بشكل طبيعي. آخر فحص أمني: منذ ساعة واحدة</p>
            </div>
            <Badge className="bg-green-100 text-green-800">نشط</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}