
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeftCircle, ListPlus, History, Receipt, UserCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const quickActions = [
  { title: "طلب خدمة جديدة", description: "ابدأ بطلب خدمة جديدة لتلبية احتياجاتك.", icon: <ListPlus className="h-8 w-8 text-primary" />, href: "/client/requests", dataAiHint: "service request" },
  { title: "تتبع حالة طلباتك", description: "اطلع على آخر تحديثات طلباتك الحالية.", icon: <History className="h-8 w-8 text-primary" />, href: "/client/tracking", dataAiHint: "order tracking" },
  { title: "عرض الفواتير", description: "راجع فواتيرك وقم بإدارتها بسهولة.", icon: <Receipt className="h-8 w-8 text-primary" />, href: "/client/invoices", dataAiHint: "invoice management" },
  { title: "تعديل الملف الشخصي", description: "حدّث معلوماتك الشخصية وتفضيلات الحساب.", icon: <UserCircle className="h-8 w-8 text-primary" />, href: "/client/profile", dataAiHint: "profile update" },
];

export default function ClientDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary">مرحباً بك، {user?.displayName || "عميلنا العزيز"}!</CardTitle>
          <CardDescription>هذه لوحة التحكم الخاصة بك في سيف مصر الوطنية للأمن. يمكنك من هنا إدارة خدماتك وطلباتك بكل سهولة.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>نأمل أن تجد كل ما تحتاجه هنا. إذا كان لديك أي استفسارات، لا تتردد في التواصل مع فريق الدعم.</p>
        </CardContent>
      </Card>

      <section>
        <h2 className="text-xl font-semibold font-headline mb-4 text-foreground">إجراءات سريعة</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map(action => (
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
                    {action.title.split(" ")[0]} الآن <ArrowLeftCircle className="ms-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="font-headline text-xl text-primary">آخر التحديثات</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">لا توجد تحديثات جديدة في الوقت الحالي.</p>
          {/* Placeholder for recent activity or notifications */}
        </CardContent>
      </Card>
    </div>
  );
}
