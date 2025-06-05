
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeftCircle, Users, BriefcaseBusiness, FilePieChart, Sparkles, Loader2, ClipboardList, Activity, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit, Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { ActivityActionType } from "@/lib/activityLogger";

const adminQuickActions = [
  { title: "إدارة العملاء", description: "عرض وتعديل بيانات العملاء.", icon: <Users className="h-8 w-8 text-primary" />, href: "/admin/clients", dataAiHint: "client management" },
  { title: "إدارة الخدمات", description: "إضافة وتحديث الخدمات المقدمة.", icon: <BriefcaseBusiness className="h-8 w-8 text-primary" />, href: "/admin/services", dataAiHint: "service management" },
  { title: "طلبات الخدمة", description: "مراجعة طلبات الخدمة المقدمة من العملاء.", icon: <ClipboardList className="h-8 w-8 text-primary" />, href: "/admin/service-requests", dataAiHint: "service requests" },
  { title: "إنشاء تقرير", description: "استخدم أدواتنا لإنشاء تقارير مفصلة.", icon: <FilePieChart className="h-8 w-8 text-primary" />, href: "/admin/reports", dataAiHint: "report generation" },
  { title: "أداة الذكاء الاصطناعي", description: "استفد من الذكاء الاصطناعي لتحليل البيانات.", icon: <Sparkles className="h-8 w-8 text-primary" />, href: "/admin/ai-tool", dataAiHint: "ai analytics" },
];

interface QuickStats {
  totalClients: number;
  totalServices: number;
  totalServiceRequests: number;
}

interface ActivityLogEntry {
  id: string;
  actionType: ActivityActionType;
  description: string;
  timestamp: Timestamp;
  actor?: {
    id: string | null;
    role?: "client" | "admin" | string | null;
    name?: string | null;
  };
  target?: {
    id?: string | null;
    type?: string | null;
    name?: string | null;
  };
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);

  const formatDate = (timestamp: Timestamp | undefined): string => {
    if (!timestamp) return "غير متوفر";
    return timestamp.toDate().toLocaleString('ar-EG', {
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
        const clientsSnapshot = await getDocs(collection(db, "clients"));
        const servicesSnapshot = await getDocs(collection(db, "services"));
        const serviceRequestsSnapshot = await getDocs(collection(db, "serviceRequests"));
        
        setStats({
          totalClients: clientsSnapshot.size,
          totalServices: servicesSnapshot.size,
          totalServiceRequests: serviceRequestsSnapshot.size,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
        toast({ title: "خطأ", description: "لم نتمكن من تحميل الإحصائيات.", variant: "destructive" });
        setStats({ totalClients: 0, totalServices: 0, totalServiceRequests: 0 }); // Fallback
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
        toast({ title: "خطأ", description: "لم نتمكن من تحميل سجل الأنشطة.", variant: "destructive" });
      } finally {
        setIsLoadingActivities(false);
      }
    };

    fetchStats();
    fetchActivities();
  }, [toast]);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-md">
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
                   <div className="flex items-center gap-2 text-muted-foreground"><ClipboardList className="h-5 w-5" /><span>إجمالي طلبات الخدمة:</span></div>
                   <span className="font-semibold text-lg text-foreground">{stats.totalServiceRequests}</span>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-center py-4">لا توجد إحصائيات لعرضها.</p>
            )}
          </CardContent>
        </Card>
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
              <ul className="space-y-3 text-sm">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
