
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeftCircle, Users, BriefcaseBusiness, FilePieChart, Sparkles, Settings, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react"; // Added for state management

const adminQuickActions = [
  { title: "إدارة العملاء", description: "عرض وتعديل بيانات العملاء.", icon: <Users className="h-8 w-8 text-primary" />, href: "/admin/clients", dataAiHint: "client management" },
  { title: "إدارة الخدمات", description: "إضافة وتحديث الخدمات المقدمة.", icon: <BriefcaseBusiness className="h-8 w-8 text-primary" />, href: "/admin/services", dataAiHint: "service management" },
  { title: "إنشاء تقرير جديد", description: "استخدم أدواتنا لإنشاء تقارير مفصلة.", icon: <FilePieChart className="h-8 w-8 text-primary" />, href: "/admin/reports", dataAiHint: "report generation" },
  { title: "أداة الذكاء الاصطناعي", description: "استفد من الذكاء الاصطناعي لتحليل البيانات.", icon: <Sparkles className="h-8 w-8 text-primary" />, href: "/admin/ai-tool", dataAiHint: "ai analytics" },
];

// Interface for stats (can be expanded)
interface QuickStats {
  totalClients: number | string;
  pendingOrders: number | string;
  reportsThisMonth: number | string;
}

// Interface for activity (can be expanded)
interface ActivityLog {
  id: string;
  description: string;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call for stats and activities
    setTimeout(() => {
      setStats({
        totalClients: "N/A",
        pendingOrders: "N/A",
        reportsThisMonth: "N/A"
      });
      setActivities([]);
      setIsLoading(false);
    }, 1000);
  }, []);

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    الانتقال إلى {action.title.split(" ")[1]} <ArrowLeftCircle className="ms-2 h-4 w-4" />
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
            <CardTitle className="font-headline text-xl text-primary">إحصائيات سريعة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <div className="flex justify-center items-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /><p className="ms-2 text-sm">جارٍ تحميل الإحصائيات...</p></div>
            ) : stats ? (
              <>
                <div className="flex justify-between"><span>إجمالي العملاء:</span> <span className="font-semibold">{stats.totalClients}</span></div>
                <div className="flex justify-between"><span>الطلبات قيد المعالجة:</span> <span className="font-semibold">{stats.pendingOrders}</span></div>
                <div className="flex justify-between"><span>التقارير المنشأة هذا الشهر:</span> <span className="font-semibold">{stats.reportsThisMonth}</span></div>
              </>
            ) : (
              <p className="text-muted-foreground text-center py-4">لا توجد إحصائيات لعرضها.</p>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-primary">آخر الأنشطة</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
               <div className="flex justify-center items-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /><p className="ms-2 text-sm">جارٍ تحميل الأنشطة...</p></div>
            ) : activities.length > 0 ? (
              <ul className="space-y-2 text-sm text-muted-foreground">
                {activities.map((activity) => (
                  <li key={activity.id}>- {activity.description}</li>
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
