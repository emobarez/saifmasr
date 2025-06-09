
"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, Loader2, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { ServiceRequestDetailsDialog } from "@/components/client/ServiceRequestDetailsDialog";

interface ServiceRequest {
  id: string;
  serviceType: string;
  requestTitle: string;
  requestDetails: string; 
  status: "جديد" | "قيد المعالجة" | "مكتمل" | "ملغى";
  createdAt: Timestamp;
  attachmentURL?: string;
  attachmentFilename?: string;
}

type ServiceRequestStatus = ServiceRequest["status"];
const statusOptions: ServiceRequestStatus[] = ["جديد", "قيد المعالجة", "مكتمل", "ملغى"];
const filterStatusOptions: ("all" | ServiceRequestStatus)[] = ["all", ...statusOptions];

export default function ClientTrackingPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ServiceRequestStatus>("all");
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

  const filteredRequests = useMemo(() => {
    let tempRequests = requests;
    if (searchTerm) {
      const lowercasedFilter = searchTerm.toLowerCase();
      tempRequests = tempRequests.filter(req =>
        req.requestTitle.toLowerCase().includes(lowercasedFilter)
      );
    }
    if (statusFilter !== "all") {
      tempRequests = tempRequests.filter(req => req.status === statusFilter);
    }
    return tempRequests;
  }, [requests, searchTerm, statusFilter]);

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
      case "مكتمل": return "outline";
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

  const handleViewDetails = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setIsDetailsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl text-primary">تتبع حالة الطلبات</CardTitle>
          <CardDescription>هنا يمكنك متابعة حالة جميع طلباتك المقدمة.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-grow sm:max-w-sm">
              <Input 
                placeholder="ابحث عن طلب (بالعنوان)..." 
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
            <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ms-2">جارٍ تحميل الطلبات...</p></div>
          ) : filteredRequests.length > 0 ? (
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
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.requestTitle}</TableCell>
                    <TableCell>{getServiceTypeName(request.serviceType)}</TableCell>
                    <TableCell>{formatDate(request.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(request.status)}>{request.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" aria-label="عرض التفاصيل" onClick={() => handleViewDetails(request)}>
                        <Eye className="h-5 w-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              {searchTerm || statusFilter !== "all" 
                ? "لم يتم العثور على طلبات تطابق معايير البحث والتصفية الحالية." 
                : "لا توجد طلبات لعرضها حالياً."}
              {!requests.length && <span className="block mt-2"> يمكنك تقديم طلب جديد من <Link href="/client/requests" className="text-primary hover:underline">هنا</Link>.</span>}
            </p>
          )}
        </CardContent>
      </Card>

      {selectedRequest && (
        <ServiceRequestDetailsDialog
          request={selectedRequest}
          isOpen={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
        />
      )}
    </div>
  );
}

