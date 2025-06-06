
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftCircle, ListPlus, History, Receipt, UserCircle, Loader2, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

const quickActions = [
  { title: "طلب خدمة جديدة", description: "ابدأ بطلب خدمة جديدة لتلبية احتياجاتك.", icon: <ListPlus className="h-8 w-8 text-primary" />, href: "/client/requests", dataAiHint: "service request" },
  { title: "تتبع حالة طلباتك", description: "اطلع على آخر تحديثات طلباتك الحالية.", icon: <History className="h-8 w-8 text-primary" />, href: "/client/tracking", dataAiHint: "order tracking" },
  { title: "عرض الفواتير", description: "راجع فواتيرك وقم بإدارتها بسهولة.", icon: <Receipt className="h-8 w-8 text-primary" />, href: "/client/invoices", dataAiHint: "invoice management" },
  { title: "تعديل الملف الشخصي", description: "حدّث معلوماتك الشخصية وتفضيلات الحساب.", icon: <UserCircle className="h-8 w-8 text-primary" />, href: "/client/profile", dataAiHint: "profile update" },
];

interface RecentServiceRequest {
  id: string;
  requestTitle: string;
  status: "جديد" | "قيد المعالجة" | "مكتمل" | "ملغى";
  createdAt: Timestamp;
  serviceType: string; // Added for potential display if needed
}

export default function ClientDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recentRequests, setRecentRequests] = useState<RecentServiceRequest[]>([]);
  const [isLoadingRecentRequests, setIsLoadingRecentRequests] = useState(true);

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
    return new Intl.DateTimeFormat('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
  };

  const getStatusVariant = (status: RecentServiceRequest["status"]): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "جديد": return "default";
      case "قيد المعالجة": return "secondary";
      case "مكتمل": return "outline";
      case "ملغى": return "destructive";
      default: return "default";
    }
  };

  useEffect(() => {
    if (!user) {
      setIsLoadingRecentRequests(false);
      return;
    }

    const fetchRecentRequests = async () => {
      setIsLoadingRecentRequests(true);
      try {
        const q = query(
          collection(db, "serviceRequests"),
          where("clientId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(3) // Fetch the last 3 requests
        );
        const querySnapshot = await getDocs(q);
        const fetchedRequests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RecentServiceRequest));
        setRecentRequests(fetchedRequests);
      } catch (error) {
        console.error("Error fetching recent service requests:", error);
        toast({ title: "خطأ", description: "لم نتمكن من تحميل طلباتك الأخيرة.", variant: "destructive" });
      } finally {
        setIsLoadingRecentRequests(false);
      }
    };

    fetchRecentRequests();
  }, [user, toast]);

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
          <CardTitle className="font-headline text-xl text-primary">آخر طلباتك</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingRecentRequests ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="ms-2 text-muted-foreground">جارٍ تحميل الطلبات الأخيرة...</p>
            </div>
          ) : recentRequests.length > 0 ? (
            <div className="space-y-4">
              <ul className="space-y-3">
                {recentRequests.map(request => (
                  <li key={request.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-secondary/50 rounded-md hover:bg-secondary/70 transition-colors">
                    <div>
                      <p className="font-semibold text-foreground">{request.requestTitle}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(request.createdAt)}</p>
                    </div>
                    <Badge variant={getStatusVariant(request.status)} className="mt-2 sm:mt-0">{request.status}</Badge>
                  </li>
                ))}
              </ul>
              <Button asChild variant="link" className="p-0 h-auto text-primary">
                <Link href="/client/tracking">عرض جميع الطلبات <ArrowLeftCircle className="ms-1 h-4 w-4" /></Link>
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-primary/30" />
              <p className="mb-2">لا توجد طلبات حديثة لعرضها.</p>
              <Button asChild variant="default" size="sm">
                <Link href="/client/requests">ابدأ بتقديم طلب خدمة جديد</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
