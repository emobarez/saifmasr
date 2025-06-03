
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeftCircle, Users, BriefcaseBusiness, FilePieChart, Sparkles, Settings } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const adminQuickActions = [
  { title: "إدارة العملاء", description: "عرض وتعديل بيانات العملاء.", icon: <Users className="h-8 w-8 text-primary" />, href: "/admin/clients", dataAiHint: "client management" },
  { title: "إدارة الخدمات", description: "إضافة وتحديث الخدمات المقدمة.", icon: <BriefcaseBusiness className="h-8 w-8 text-primary" />, href: "/admin/services", dataAiHint: "service management" },
  { title: "إنشاء تقرير جديد", description: "استخدم أدواتنا لإنشاء تقارير مفصلة.", icon: <FilePieChart className="h-8 w-8 text-primary" />, href: "/admin/reports", dataAiHint: "report generation" },
  { title: "أداة الذكاء الاصطناعي", description: "استفد من الذكاء الاصطناعي لتحليل البيانات.", icon: <Sparkles className="h-8 w-8 text-primary" />, href: "/admin/ai-tool", dataAiHint: "ai analytics" },
];

export default function AdminDashboardPage() {
  const { user } = useAuth();

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
            <div className="flex justify-between"><span>إجمالي العملاء:</span> <span className="font-semibold">125</span></div>
            <div className="flex justify-between"><span>الطلبات قيد المعالجة:</span> <span className="font-semibold">15</span></div>
            <div className="flex justify-between"><span>التقارير المنشأة هذا الشهر:</span> <span className="font-semibold">8</span></div>
            {/* Placeholder for stats */}
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-primary">آخر الأنشطة</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>- تم تسجيل عميل جديد: أحمد محمود</li>
              <li>- تم إكمال طلب خدمة SRV-002</li>
              <li>- تم إنشاء تقرير أداء الربع السنوي</li>
            </ul>
            {/* Placeholder for recent activity */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
