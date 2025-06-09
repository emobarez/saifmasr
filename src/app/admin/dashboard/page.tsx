
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeftCircle, Users, BriefcaseBusiness, FilePieChart, Sparkles, Loader2, ClipboardList, Activity, TrendingUp, Receipt, CalendarClock, BarChart2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit, Timestamp, where, getCountFromServer } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { ActivityLogEntry } from "@/lib/activityLogger"; 
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const adminQuickActions = [
  { title: "إدارة العملاء", description: "عرض وتعديل بيانات العملاء.", icon: <Users className="h-8 w-8 text-primary" />, href: "/admin/clients", dataAiHint: "client management" },
  { title: "إدارة الخدمات", description: "إضافة وتحديث الخدمات المقدمة.", icon: <BriefcaseBusiness className="h-8 w-8 text-primary" />, href: "/admin/services", dataAiHint: "service management" },
  { title: "طلبات الخدمة", description: "مراجعة طلبات الخدمة المقدمة من العملاء.", icon: <ClipboardList className="h-8 w-8 text-primary" />, href: "/admin/service-requests", dataAiHint: "service requests" },
  { title: "إدارة الفواتير", description: "إنشاء ومتابعة فواتير العملاء.", icon: <Receipt className="h-8 w-8 text-primary" />, href: "/admin/invoices", dataAiHint: "invoice management" },
  { title: "إدارة الموظفين", description: "إدارة بيانات الموظفين وأفراد الأمن.", icon: <Users className="h-8 w-8 text-primary" />, href: "/admin/employees", dataAiHint: "employee management" },
  { title: "إنشاء تقرير", description: "استخدم أدواتنا لإنشاء تقارير مفصلة.", icon: <FilePieChart className="h-8 w-8 text-primary" />, href: "/admin/reports", dataAiHint: "report generation" },
  { title: "أداة الذكاء الاصطناعي", description: "استفد من الذكاء الاصطناعي لتحليل البيانات.", icon: <Sparkles className="h-8 w-8 text-primary" />, href: "/admin/ai-tool", dataAiHint: "ai analytics" },
];

interface ServiceRequestStatusCounts {
  'جديد': number;
  'قيد المعالجة': number;
  'مكتمل': number;
  'ملغى': number;
}
interface QuickStats {
  totalClients: number;
  totalServices: number;
  totalEmployees: number;
  totalInvoices: number;
  serviceRequestStatusCounts: ServiceRequestStatusCounts;
  totalServiceRequests: number; 
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);

  const formatDate = (timestamp: Timestamp | Date | undefined): string => {
    if (!timestamp) return "غير متوفر";
    let date: Date;
    if (timestamp instanceof Timestamp) {
        date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
        date = timestamp;
    } else {
        return "تاريخ غير صالح";
    }
    return date.toLocaleString('ar-EG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoadingStats(true);
      try {
        const clientsSnapshot = await getCountFromServer(collection(db, "clients"));
        const servicesSnapshot = await getCountFromServer(collection(db, "services"));
        const employeesSnapshot = await getCountFromServer(collection(db, "employees"));
        const invoicesSnapshot = await getCountFromServer(collection(db, "invoices"));

        const serviceRequestStatuses: Array<keyof ServiceRequestStatusCounts> = ['جديد', 'قيد المعالجة', 'مكتمل', 'ملغى'];
        let statusCounts: Partial<ServiceRequestStatusCounts> = {};
        let totalRequests = 0;

        for (const status of serviceRequestStatuses) {
          const q = query(collection(db, "serviceRequests"), where("status", "==", status));
          const snapshot = await getCountFromServer(q);
          statusCounts[status] = snapshot.data().count;
          totalRequests += snapshot.data().count;
        }
        
        setStats({
          totalClients: clientsSnapshot.data().count,
          totalServices: servicesSnapshot.data().count,
          totalEmployees: employeesSnapshot.data().count,
          totalInvoices: invoicesSnapshot.data().count,
          serviceRequestStatusCounts: statusCounts as ServiceRequestStatusCounts,
          totalServiceRequests: totalRequests,
        });

      } catch (error) {
        console.error("Error fetching stats:", error);
        toast({ title: "خطأ", description: "لم نتمكن من تحميل الإحصائيات.", variant: "destructive" });
        setStats({ 
            totalClients: 0, 
            totalServices: 0, 
            totalEmployees: 0, 
            totalInvoices: 0, 
            serviceRequestStatusCounts: { 'جديد': 0, 'قيد المعالجة': 0, 'مكتمل': 0, 'ملغى': 0 },
            totalServiceRequests: 0,
        }); 
      } finally {
        setIsLoadingStats(false);
      }
    };

    const fetchActivities = async () => {
      setIsLoadingActivities(true);
      try {
        const q = query(collection(db, "activityLogs"), orderBy("timestamp", "desc"), limit(7));
        const querySnapshot = await getDocs(q);
        const fetchedActivities = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLogEntry));
        setActivities(fetchedActivities);
      } catch (error) {
        console.error("Error fetching activities:", error);
        toast({ title: "خطأ", description: "لم نتمكن من تحميل سجل الأنشطة. يرجى مراجعة وحدة التحكم للمزيد من التفاصيل.", variant: "destructive" });
      } finally {
        setIsLoadingActivities(false);
      }
    };

    fetchStats();
    fetchActivities();
  }, [toast]);

  const serviceRequestChartData = stats?.serviceRequestStatusCounts ? 
    Object.entries(stats.serviceRequestStatusCounts).map(([name, count]) => ({ name, count })) 
    : [];

  return (
    <div className="space-y-8">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary">لوحة تحكم المسؤول</CardTitle>
          <CardDescription>مرحباً بك، {user?.displayName || "أيها المسؤول"}. قم بإدارة النظام والعمليات من هنا.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>هذه هي لوحة التحكم المركزية لإدارة جميع جوانب سيف مصر الوطنية للأمن. استخدم القائمة الجانبية للتنقل بين الأقسام المختلفة.</p>
        </CardContent>
      </Card>

       <section>
        <h2 className="text-xl font-semibold font-headline mb-4 text-foreground">إجراءات سريعة</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {adminQuickActions.map(action => (
            <Card key={action.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="p-3 bg-primary/10 rounded-md">{action.icon}</div>
                <div>
                  <CardTitle className="font-headline text-lg text-primary">{action.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{action.description}</p>
                <Button asChild variant="outline" size="sm">
                  <Link href={action.href}>
                    الانتقال إلى {action.title.split(" ")[1] || action.title.split(" ")[0]} <ArrowLeftCircle className="ms-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-md lg:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <CardTitle className="font-headline text-xl text-primary">إحصائيات سريعة</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoadingStats ? (
              <div className="flex justify-center items-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /><p className="ms-2 text-sm">جارٍ تحميل الإحصائيات...</p></div>
            ) : stats ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground"><Users className="h-5 w-5" /><span>إجمالي العملاء:</span></div>
                  <span className="font-semibold text-lg text-foreground">{stats.totalClients}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground"><BriefcaseBusiness className="h-5 w-5" /><span>إجمالي الخدمات:</span></div>
                   <span className="font-semibold text-lg text-foreground">{stats.totalServices}</span>
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2 text-muted-foreground"><Users className="h-5 w-5" /><span>إجمالي الموظفين:</span></div>
                   <span className="font-semibold text-lg text-foreground">{stats.totalEmployees}</span>
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2 text-muted-foreground"><Receipt className="h-5 w-5" /><span>إجمالي الفواتير:</span></div>
                   <span className="font-semibold text-lg text-foreground">{stats.totalInvoices}</span>
                </div>
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2 text-muted-foreground"><ClipboardList className="h-5 w-5" /><span>إجمالي طلبات الخدمة:</span></div>
                   <span className="font-semibold text-lg text-foreground">{stats.totalServiceRequests}</span>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-center py-4">لا توجد إحصائيات لعرضها.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart2 className="h-6 w-6 text-primary" />
              <CardTitle className="font-headline text-xl text-primary">نظرة عامة على طلبات الخدمة</CardTitle>
            </div>
            <CardDescription>توزيع طلبات الخدمة حسب الحالة.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ms-2">جارٍ تحميل بيانات الرسم البياني...</p></div>
            ) : serviceRequestChartData.length > 0 && serviceRequestChartData.some(d => d.count > 0) ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={serviceRequestChartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        borderColor: 'hsl(var(--border))', 
                        borderRadius: 'var(--radius)',
                        color: 'hsl(var(--card-foreground))' 
                      }}
                      cursor={{ fill: 'hsl(var(--secondary))' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="count" name="عدد الطلبات" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-10 h-64 flex items-center justify-center">لا توجد بيانات طلبات خدمة لعرضها في الرسم البياني حاليًا.</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-md"> 
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              <CardTitle className="font-headline text-xl text-primary">آخر الأنشطة</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingActivities ? (
               <div className="flex justify-center items-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /><p className="ms-2 text-sm">جارٍ تحميل الأنشطة...</p></div>
            ) : activities.length > 0 ? (
              <ul className="space-y-3 text-sm max-h-72 overflow-y-auto">
                {activities.map((activity) => (
                  <li key={activity.id} className="border-b border-border pb-2 last:border-b-0">
                    <p className="text-foreground leading-tight">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(activity.timestamp)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center py-4">لا توجد أنشطة حديثة لعرضها.</p>
            )}
             <div className="mt-4">
                <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/admin/activity-log">
                        عرض سجل الأنشطة الكامل <ArrowLeftCircle className="ms-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}

