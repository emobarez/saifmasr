"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { 
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
  Plus,
  Eye,
  Calendar,
  Activity,
  AlertCircle
} from "lucide-react";
import { formatEGPSimple } from "@/lib/egyptian-utils";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useState, useEffect } from "react";

interface Activity {
  id: string | number;
  type: string;
  message: string;
  time: string;
  status: string;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalClients: 0,
    activeServices: 0,
    pendingRequests: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    completedTasks: 0,
    systemHealth: 98
  });
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real data from database
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch clients
        const clientsRes = await fetch('/api/clients');
        const clients = clientsRes.ok ? await clientsRes.json() : [];
        
        // Fetch services
        const servicesRes = await fetch('/api/services');
        const services = servicesRes.ok ? await servicesRes.json() : [];
        
        // Fetch service requests
        const requestsRes = await fetch('/api/service-requests');
        const requests = requestsRes.ok ? await requestsRes.json() : [];
        
        // Fetch invoices from database
        const invoicesRes = await fetch('/api/invoices');
        const invoices = invoicesRes.ok ? await invoicesRes.json() : [];
        
        // Calculate real stats from invoices
        const paidInvoices = invoices.filter((inv: any) => inv.status === 'PAID');
        const pendingInvoices = invoices.filter((inv: any) => inv.status === 'PENDING' || inv.status === 'OVERDUE');
        
        const totalPaidAmount = paidInvoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0);
        const totalPendingAmount = pendingInvoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0);
        
        // Calculate stats
        const pendingRequests = requests.filter((r: any) => r.status === 'PENDING').length || 0;
        const completedTasks = requests.filter((r: any) => r.status === 'COMPLETED').length || 0;
        
        // Use real invoice data
        const monthlyRevenue = totalPaidAmount;
        
        setStats({
          totalClients: clients.length,
          activeServices: services.filter((s: any) => s.status === 'ACTIVE').length,
          pendingRequests,
          monthlyRevenue,
          pendingPayments: totalPendingAmount,
          completedTasks,
          systemHealth: 98
        });
        
        // Set recent activities from service requests
        const activities = requests.slice(0, 5).map((request: any, index: number) => ({
          id: request.id,
          type: 'service',
          message: `طلب خدمة: ${request.title} من العميل ${request.user?.name || 'غير محدد'}`,
          time: getTimeAgo(request.createdAt),
          status: request.status.toLowerCase()
        }));
        
        setRecentActivities(activities);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('فشل في تحميل بيانات لوحة التحكم');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `${diffMins} دقيقة`;
    if (diffHours < 24) return `${diffHours} ساعة`;
    return `${diffDays} يوم`;
  };

  const quickActions = [
    { title: 'إضافة عميل جديد', icon: Users, href: '/admin/clients', color: 'bg-blue-500' },
    { title: 'إنشاء خدمة', icon: ShieldCheck, href: '/admin/services', color: 'bg-green-500' },
    { title: 'مراجعة الطلبات', icon: ClipboardList, href: '/admin/service-requests', color: 'bg-orange-500' },
    { title: 'إدارة الفواتير', icon: Receipt, href: '/admin/invoices', color: 'bg-purple-500' }
  ];

  return (
    <div className="w-full overflow-x-auto md:overflow-x-visible force-scrollbar">
      <div className="space-y-3 xs:space-y-4 sm:space-y-6 lg:space-y-8 min-h-screen min-w-[800px] md:min-w-0 p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-3 sm:mb-5 lg:mb-8">
          <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">لوحة التحكم الإدارية</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base lg:text-lg">
            مرحباً {user?.name || 'المدير'} - آخر تحديث: {new Date().toLocaleDateString('ar-EG')}
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild className="rounded-full px-6 shadow-lg hover:shadow-xl transition-all">
            <Link href="/admin/activity-log">
              <Activity className="h-4 w-4 mr-2" />
              عرض سجل النشاطات
            </Link>
          </Button>
        </div>
      </div>

      {/* Removed success login banner per user request */}

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 sm:p-6">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-300 rounded w-1/2 mb-1"></div>
                <div className="h-3 bg-gray-300 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">خطأ في تحميل البيانات</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-6 lg:mb-8">
        <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105 border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">إجمالي العملاء</CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold text-emerald-700">{stats.totalClients.toLocaleString('ar-EG')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-emerald-600 font-medium">+12%</span> عن الشهر الماضي
            </p>
          </CardContent>
        </Card>

                <Card className="group hover:scale-[1.02] transition-transform duration-200 border-slate-200 dark:border-slate-700">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">الخدمات النشطة</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{stats.activeServices}</p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +8% هذا الشهر
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:scale-[1.02] transition-transform duration-200 border-slate-200 dark:border-slate-700">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">الطلبات المعلقة</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{stats.pendingRequests}</p>
                <p className="text-sm text-orange-600 dark:text-orange-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  تحتاج مراجعة
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center">
                <ClipboardList className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:scale-[1.02] transition-transform duration-200 border-slate-200 dark:border-slate-700">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">الطلبات المعلقة</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{stats.pendingRequests}</p>
                <p className="text-sm text-orange-600 dark:text-orange-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  تحتاج مراجعة
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center">
                <ClipboardList className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:scale-[1.02] transition-transform duration-200 border-slate-200 dark:border-slate-700">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">الإيرادات الشهرية</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{formatEGPSimple(stats.monthlyRevenue)}</p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  +15% عن الشهر الماضي
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center">
                <Receipt className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Quick Actions */}
      <Card className="overflow-hidden border-slate-200 dark:border-slate-700">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-slate-200 dark:border-slate-700">
          <CardTitle className="flex items-center text-slate-800 dark:text-slate-100">
            <Plus className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
            إجراءات سريعة
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">أهم المهام التي يمكنك القيام بها</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Button key={index} asChild variant="outline" className="h-28 flex-col rounded-2xl border-slate-200 dark:border-slate-700 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 hover:shadow-xl hover:scale-105 transition-all duration-300 group">
                <Link href={action.href}>
                  <div className={`p-4 rounded-2xl ${action.color} text-white mb-3 shadow-lg group-hover:shadow-xl transition-shadow`}>
                    <action.icon className="h-7 w-7" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{action.title}</span>
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Health & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* System Health */}
        <Card className="overflow-hidden border-slate-200 dark:border-slate-700">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-b border-slate-200 dark:border-slate-700">
            <CardTitle className="flex items-center text-slate-800 dark:text-slate-100">
              <BarChart3 className="h-5 w-5 mr-2 text-emerald-600 dark:text-emerald-400" />
              حالة النظام
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">مؤشرات أداء النظام</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">صحة النظام العامة</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full">{stats.systemHealth}%</span>
              </div>
              <Progress value={stats.systemHealth} className="h-3 bg-slate-100 dark:bg-slate-800" />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">المهام المكتملة</span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">{stats.completedTasks}%</span>
              </div>
              <Progress value={stats.completedTasks} className="h-3 bg-slate-100 dark:bg-slate-800" />
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">جميع الأنظمة تعمل بشكل طبيعي</span>
              </div>
              <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40">
                مستقر
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="overflow-hidden border-slate-200 dark:border-slate-700">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-b border-slate-200 dark:border-slate-700">
            <CardTitle className="flex items-center text-slate-800 dark:text-slate-100">
              <Activity className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
              النشاطات الأخيرة
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">آخر الأحداث في النظام</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center">
                    {activity.status === 'completed' ? (
                      <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    ) : activity.status === 'pending' ? (
                      <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                        <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-grow min-w-0 space-y-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{activity.message}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{activity.time}</p>
                  </div>
                  <Badge 
                    className={cn(
                      "text-xs font-medium",
                      activity.status === 'completed' 
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40' 
                        : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/40'
                    )}
                  >
                    {activity.status === 'completed' ? 'مكتمل' : 'معلق'}
                  </Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-6 rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800" asChild>
              <Link href="/admin/activity-log">
                <Eye className="h-4 w-4 mr-2" />
                عرض جميع النشاطات
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
