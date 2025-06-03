
"use client";
import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, Info, ThumbsUp, MinusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, Timestamp, doc, updateDoc } from "firebase/firestore";
import { prioritizeClientRequest, PrioritizeClientRequestOutput } from "@/ai/flows/prioritize-client-request";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ServiceRequest {
  id: string;
  serviceType: string;
  requestTitle: string;
  requestDetails: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  status: "جديد" | "قيد المعالجة" | "مكتمل" | "ملغى";
  createdAt: Timestamp;
  attachmentURL?: string;
  attachmentFilename?: string;
}

interface ServiceRequestWithPriority extends ServiceRequest {
  aiPriority?: PrioritizeClientRequestOutput["priority"];
  aiReasoning?: PrioritizeClientRequestOutput["reasoning"];
  aiError?: string;
}

const statusOptions: ServiceRequest["status"][] = ["جديد", "قيد المعالجة", "مكتمل", "ملغى"];

export default function AdminServiceRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequestWithPriority[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchAndPrioritizeRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, "serviceRequests"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedRequests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRequest));

      const requestsWithPriorityPromises = fetchedRequests.map(async (req) => {
        try {
          const priorityResult = await prioritizeClientRequest({
            requestTitle: req.requestTitle,
            requestDetails: req.requestDetails,
          });
          return { ...req, aiPriority: priorityResult.priority, aiReasoning: priorityResult.reasoning };
        } catch (aiError: any) {
          console.error(`Error prioritizing request ${req.id}:`, aiError);
          return { ...req, aiError: "فشل في تحديد الأولوية بالذكاء الاصطناعي" };
        }
      });

      const settledRequests = await Promise.all(requestsWithPriorityPromises);
      setRequests(settledRequests);

    } catch (error) {
      console.error("Error fetching service requests:", error);
      toast({ title: "خطأ", description: "لم نتمكن من تحميل قائمة طلبات الخدمة.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAndPrioritizeRequests();
  }, [fetchAndPrioritizeRequests]);

  const handleStatusChange = async (requestId: string, newStatus: ServiceRequest["status"]) => {
    try {
      const requestRef = doc(db, "serviceRequests", requestId);
      await updateDoc(requestRef, { status: newStatus });
      setRequests(prevRequests => 
        prevRequests.map(req => req.id === requestId ? { ...req, status: newStatus } : req)
      );
      toast({ title: "تم التحديث", description: `تم تحديث حالة الطلب إلى ${newStatus}.` });
    } catch (error) {
      console.error("Error updating request status:", error);
      toast({ title: "خطأ", description: "لم نتمكن من تحديث حالة الطلب.", variant: "destructive" });
    }
  };


  const getStatusVariant = (status: ServiceRequest["status"]): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "جديد": return "default"; 
      case "قيد المعالجة": return "secondary"; 
      case "مكتمل": return "outline"; // Using outline for success. A dedicated 'success' variant would be green.
      case "ملغى": return "destructive";
      default: return "default";
    }
  };
  
  const getPriorityIcon = (priority?: PrioritizeClientRequestOutput["priority"]) => {
    if (!priority) return <MinusCircle className="h-5 w-5 text-muted-foreground" />;
    switch (priority) {
      case "عالية": return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case "متوسطة": return <Info className="h-5 w-5 text-yellow-500" />; // text-yellow-500 might need to be added or use an existing color
      case "منخفضة": return <ThumbsUp className="h-5 w-5 text-green-500" />; // text-green-500 might need to be added or use an existing color
      default: return <MinusCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const formatDate = (timestamp: Timestamp | Date | undefined): string => {
    if (!timestamp) return "غير متوفر";
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate().toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
     if (timestamp instanceof Date) { 
      return timestamp.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    return "تاريخ غير صالح";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl text-primary">طلبات الخدمة الواردة</CardTitle>
          <CardDescription>عرض وإدارة طلبات الخدمة المقدمة من العملاء مع اقتراحات الأولوية من الذكاء الاصطناعي.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ms-2">جارٍ تحميل طلبات الخدمة...</p></div>
          ) : requests.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">عنوان الطلب</TableHead>
                    <TableHead className="min-w-[120px]">اسم العميل</TableHead>
                    <TableHead className="min-w-[150px]">تاريخ التقديم</TableHead>
                    <TableHead className="min-w-[120px]">الحالة</TableHead>
                    <TableHead className="min-w-[150px]">الأولوية (AI)</TableHead>
                    <TableHead className="min-w-[200px]">سبب الأولوية (AI)</TableHead>
                    <TableHead className="min-w-[180px]">تغيير الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium align-top">
                        {request.requestTitle}
                        {request.attachmentURL && (
                           <a 
                            href={request.attachmentURL} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="block text-xs text-primary hover:underline mt-1"
                          >
                            عرض المرفق ({request.attachmentFilename || 'مرفق'})
                          </a>
                        )}
                      </TableCell>
                      <TableCell className="align-top">{request.clientName} <span className="text-xs text-muted-foreground">({request.clientEmail})</span></TableCell>
                      <TableCell className="align-top">{formatDate(request.createdAt)}</TableCell>
                      <TableCell className="align-top"><Badge variant={getStatusVariant(request.status)}>{request.status}</Badge></TableCell>
                      <TableCell className="align-top">
                        <div className="flex items-center gap-2">
                          {getPriorityIcon(request.aiPriority)}
                          {request.aiPriority || request.aiError || "N/A"}
                        </div>
                      </TableCell>
                       <TableCell className="text-xs align-top">{request.aiReasoning || request.aiError || "-"}</TableCell>
                       <TableCell className="align-top">
                        <Select 
                          value={request.status} 
                          onValueChange={(value) => handleStatusChange(request.id, value as ServiceRequest["status"])}
                          dir="rtl"
                        >
                          <SelectTrigger className="h-9 w-full">
                            <SelectValue placeholder="تغيير الحالة" />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map(option => (
                              <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
             <p className="text-muted-foreground text-center py-8">لا توجد طلبات خدمة لعرضها حالياً.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

