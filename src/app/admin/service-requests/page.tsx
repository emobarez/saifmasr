
"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, Info, ThumbsUp, MinusCircle, Eye, Search, ClipboardList, Filter, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useAuth } from "@/context/AuthContext";
import { logActivity } from "@/lib/activityLogger";
import { AdminServiceRequestDetailsDialog } from "@/components/admin/ServiceRequestDetailsDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

type ServiceRequestStatus = "جديد" | "قيد المعالجة" | "مكتمل" | "ملغى";
const statusOptions: ServiceRequestStatus[] = ["جديد", "قيد المعالجة", "مكتمل", "ملغى"];
const filterStatusOptions: ("all" | ServiceRequestStatus)[] = ["all", ...statusOptions];


const getServiceTypeName = (typeKey: string): string => {
  const types: {[key: string]: string} = {
      "consulting": "خدمات استشارية",
      "security": "حلول أمنية",
      "reports": "إدارة التقارير",
      "audit": "التدقيق والمراجعة",
      "other": "أخرى"
  };
  return types[typeKey] || typeKey;
};


export default function AdminServiceRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequestWithPriority[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user: adminUser } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequestWithPriority | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ServiceRequestStatus>("all");

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
    const originalRequest = requests.find(req => req.id === requestId);
    if (!originalRequest) return;

    try {
      const requestRef = doc(db, "serviceRequests", requestId);
      await updateDoc(requestRef, { status: newStatus });
      
      setRequests(prevRequests => 
        prevRequests.map(req => req.id === requestId ? { ...req, status: newStatus } : req)
      );
      toast({ title: "تم التحديث", description: `تم تحديث حالة الطلب إلى ${newStatus}.` });

      if (adminUser) {
        await logActivity({
          actionType: "SERVICE_REQUEST_STATUS_UPDATED",
          description: `Admin ${adminUser.displayName || adminUser.email} updated status for request "${originalRequest.requestTitle}" to ${newStatus}.`,
          actor: { id: adminUser.uid, role: "admin", name: adminUser.displayName },
          target: { id: requestId, type: "serviceRequest", name: originalRequest.requestTitle },
          details: { clientId: originalRequest.clientId, clientName: originalRequest.clientName, newStatus: newStatus, oldStatus: originalRequest.status },
        });
      }

    } catch (error) {
      console.error("Error updating request status:", error);
      toast({ title: "خطأ", description: "لم نتمكن من تحديث حالة الطلب.", variant: "destructive" });
    }
  };

  const handleViewDetails = (request: ServiceRequestWithPriority) => {
    setSelectedRequest(request);
    setIsDetailsDialogOpen(true);
  };

  const getStatusVariant = (status: ServiceRequest["status"]): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "جديد": return "default"; 
      case "قيد المعالجة": return "secondary"; 
      case "مكتمل": return "outline"; 
      case "ملغى": return "destructive";
      default: return "default";
    }
  };
  
  const getPriorityIcon = (priority?: PrioritizeClientRequestOutput["priority"]) => {
    if (!priority) return <MinusCircle className="h-5 w-5 text-muted-foreground" />;
    switch (priority) {
      case "عالية": return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case "متوسطة": return <Info className="h-5 w-5 text-yellow-500" />; 
      case "منخفضة": return <ThumbsUp className="h-5 w-5 text-green-500" />; 
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

  const filteredRequests = useMemo(() => {
    let tempRequests = requests;

    if (searchTerm) {
        const lowercasedFilter = searchTerm.toLowerCase();
        tempRequests = tempRequests.filter(req => 
            req.requestTitle.toLowerCase().includes(lowercasedFilter) ||
            req.clientName.toLowerCase().includes(lowercasedFilter) ||
            req.clientEmail.toLowerCase().includes(lowercasedFilter) ||
            getServiceTypeName(req.serviceType).toLowerCase().includes(lowercasedFilter) ||
            req.status.toLowerCase().includes(lowercasedFilter)
        );
    }

    if (statusFilter !== "all") {
        tempRequests = tempRequests.filter(req => req.status === statusFilter);
    }

    return tempRequests;
  }, [requests, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-7 w-7 text-primary" />
            <CardTitle className="font-headline text-xl text-primary">طلبات الخدمة الواردة</CardTitle>
          </div>
          <CardDescription>عرض وإدارة طلبات الخدمة المقدمة من العملاء مع اقتراحات الأولوية من الذكاء الاصطناعي.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-grow sm:max-w-md">
              <Input 
                placeholder="ابحث عن طلب (بالعنوان، العميل، نوع الخدمة، الحالة)..." 
                className="ps-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-muted-foreground"/>
                <Select 
                    value={statusFilter} 
                    onValueChange={(value) => setStatusFilter(value as "all" | ServiceRequestStatus)}
                    dir="rtl"
                >
                    <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="تصفية بالحالة" />
                    </SelectTrigger>
                    <SelectContent>
                    {filterStatusOptions.map(option => (
                        <SelectItem key={option} value={option}>
                        {option === "all" ? "الكل" : option}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
            </div>
           </div>
          {isLoading ? (
            <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ms-2">جارٍ تحميل طلبات الخدمة...</p></div>
          ) : filteredRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">عنوان الطلب</TableHead>
                      <TableHead className="min-w-[120px]">اسم العميل</TableHead>
                      <TableHead className="min-w-[130px]">نوع الخدمة</TableHead>
                      <TableHead className="min-w-[150px]">تاريخ التقديم</TableHead>
                      <TableHead className="min-w-[100px]">الحالة</TableHead>
                      <TableHead className="min-w-[130px]">الأولوية (AI)</TableHead>
                      <TableHead className="min-w-[150px]">تغيير الحالة</TableHead>
                      <TableHead className="min-w-[80px]">إجراءات</TableHead> 
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id} className="text-xs sm:text-sm align-top">
                        <TableCell className="font-medium">
                          {request.requestTitle}
                          {request.attachmentURL && (
                             <a 
                              href={request.attachmentURL} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="block text-xs text-primary hover:underline mt-1 items-center gap-1"
                              title={request.attachmentFilename || 'عرض المرفق'}
                            >
                              <Paperclip className="h-3 w-3 inline me-0.5" />
                              ({request.attachmentFilename || 'مرفق'})
                            </a>
                          )}
                        </TableCell>
                        <TableCell>{request.clientName}</TableCell>
                        <TableCell>{getServiceTypeName(request.serviceType)}</TableCell>
                        <TableCell>{formatDate(request.createdAt)}</TableCell>
                        <TableCell><Badge variant={getStatusVariant(request.status)}>{request.status}</Badge></TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2 cursor-default">
                                {getPriorityIcon(request.aiPriority)}
                                {request.aiPriority || request.aiError || "N/A"}
                              </div>
                            </TooltipTrigger>
                            {(request.aiReasoning || request.aiError) && (
                              <TooltipContent side="top" className="max-w-xs">
                                <p className="text-xs">
                                  {request.aiReasoning}
                                  {request.aiReasoning && request.aiError && <br />}
                                  {request.aiError && <span className="text-destructive">{request.aiError}</span>}
                                </p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TableCell>
                         <TableCell>
                          <Select 
                            value={request.status} 
                            onValueChange={(value) => handleStatusChange(request.id, value as ServiceRequest["status"])}
                            dir="rtl"
                          >
                            <SelectTrigger className="h-9 w-full text-xs">
                              <SelectValue placeholder="تغيير الحالة" />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map(option => (
                                <SelectItem key={option} value={option}>{option}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleViewDetails(request)} aria-label="عرض التفاصيل">
                            <Eye className="h-5 w-5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TooltipProvider>
            </div>
          ) : (
             <p className="text-muted-foreground text-center py-8">
               {searchTerm || statusFilter !== "all" ? "لم يتم العثور على طلبات تطابق معايير البحث والتصفية الحالية." : "لا توجد طلبات خدمة لعرضها حالياً."}
            </p>
          )}
        </CardContent>
      </Card>

      {selectedRequest && (
        <AdminServiceRequestDetailsDialog
          request={selectedRequest}
          isOpen={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
        />
      )}
    </div>
  );
}

    
