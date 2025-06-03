
"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface ServiceRequest {
  id: string;
  serviceType: string;
  requestTitle: string;
  status: "جديد" | "قيد المعالجة" | "مكتمل" | "ملغى";
  createdAt: Timestamp;
  // Add other fields you might want to display from the serviceRequest document
}

export default function ClientTrackingPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const q = query(
          collection(db, "serviceRequests"),
          where("clientId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const fetchedRequests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRequest));
        setRequests(fetchedRequests);
      } catch (error) {
        console.error("Error fetching service requests:", error);
        toast({ title: "خطأ", description: "لم نتمكن من تحميل قائمة طلباتك.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, [user, toast]);

  const formatDate = (timestamp: Timestamp | Date | undefined): string => {
    if (!timestamp) return "غير متوفر";
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate().toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    return "تاريخ غير صالح";
  };

  const getStatusVariant = (status: ServiceRequest["status"]): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "جديد": return "default";
      case "قيد المعالجة": return "secondary";
      case "مكتمل": return "outline"; // Using outline for 'completed'
      case "ملغى": return "destructive";
      default: return "default";
    }
  };
  
  const getServiceTypeName = (typeKey: string): string => {
    const types: {[key: string]: string} = {
        "consulting": "خدمات استشارية",
        "security": "حلول أمنية",
        "reports": "إدارة التقارير",
        "audit": "التدقيق والمراجعة",
        "other": "أخرى"
    };
    return types[typeKey] || typeKey;
  }


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl text-primary">تتبع حالة الطلبات</CardTitle>
          <CardDescription>هنا يمكنك متابعة حالة جميع طلباتك المقدمة.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ms-2">جارٍ تحميل الطلبات...</p></div>
          ) : requests.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>عنوان الطلب</TableHead>
                  <TableHead>نوع الخدمة</TableHead>
                  <TableHead>تاريخ التقديم</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.requestTitle}</TableCell>
                    <TableCell>{getServiceTypeName(request.serviceType)}</TableCell>
                    <TableCell>{formatDate(request.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(request.status)}>{request.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" aria-label="عرض التفاصيل" onClick={() => alert(`تفاصيل الطلب ${request.id} (لم يتم التنفيذ بعد)`)}>
                        <Eye className="h-5 w-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">لا توجد طلبات لعرضها حالياً. يمكنك تقديم طلب جديد من <Link href="/client/requests" className="text-primary hover:underline">هنا</Link>.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
