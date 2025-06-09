
"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Printer, Loader2, Eye, Filter } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { InvoiceDetailsDialog } from "@/components/client/InvoiceDetailsDialog"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Invoice {
  id: string; 
  invoiceNumber: string;
  issueDate: Timestamp;
  dueDate: Timestamp;
  totalAmount: number;
  status: "مستحقة" | "مدفوعة" | "متأخرة" | "ملغاة";
  description: string; 
}

type InvoiceStatus = Invoice["status"];
const invoiceStatusOptions: InvoiceStatus[] = ["مستحقة", "مدفوعة", "متأخرة", "ملغاة"];
const filterInvoiceStatusOptions: ("all" | InvoiceStatus)[] = ["all", ...invoiceStatusOptions];


export default function ClientInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | InvoiceStatus>("all");
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const q = query(
          collection(db, "invoices"),
          where("clientId", "==", user.uid),
          orderBy("issueDate", "desc")
        );
        const querySnapshot = await getDocs(q);
        const fetchedInvoices = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
        setInvoices(fetchedInvoices);
      } catch (error) {
        console.error("Error fetching invoices:", error);
        toast({ title: "خطأ", description: "لم نتمكن من تحميل قائمة فواتيرك.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, [user, toast]);

  const filteredInvoices = useMemo(() => {
    if (statusFilter === "all") {
      return invoices;
    }
    return invoices.filter(invoice => invoice.status === statusFilter);
  }, [invoices, statusFilter]);

  const formatDateForDisplay = (dateValue: Timestamp | Date | undefined): string => {
    if (!dateValue) return "غير متوفر";
    let date: Date;
    if (dateValue instanceof Timestamp) {
      date = dateValue.toDate();
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      return "تاريخ غير صالح";
    }
    return new Intl.DateTimeFormat('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(amount);
  };

  const getStatusVariant = (status: Invoice["status"]): "default" | "secondary" | "destructive" | "outline" => {
    if (status === "مدفوعة") return "outline"; 
    if (status === "مستحقة") return "default"; 
    if (status === "متأخرة") return "secondary"; 
    if (status === "ملغاة") return "destructive";
    return "default";
  };

  const handleViewDetails = (invoice: Invoice) => {
    setViewingInvoice(invoice);
    setIsViewDetailsDialogOpen(true);
  };

  const handleDownloadInvoice = () => {
    toast({
      title: "قيد التطوير",
      description: "ميزة تحميل الفاتورة كملف PDF لا تزال تحت التطوير.",
    });
  };

  const handlePrintInvoice = () => {
    toast({
      title: "قيد التطوير",
      description: "ميزة طباعة الفاتورة لا تزال تحت التطوير.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl text-primary">الفواتير</CardTitle>
          <CardDescription>عرض وإدارة فواتير الخدمات الخاصة بك.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as "all" | InvoiceStatus)}
              dir="rtl"
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="تصفية حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                {filterInvoiceStatusOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === "all" ? "الكل" : option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ms-2">جارٍ تحميل الفواتير...</p></div>
          ) : filteredInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="min-w-[120px]">رقم الفاتورة</TableHead>
                    <TableHead className="min-w-[120px]">تاريخ الإصدار</TableHead>
                    <TableHead className="min-w-[120px]">تاريخ الاستحقاق</TableHead>
                    <TableHead className="min-w-[100px]">المبلغ</TableHead>
                    <TableHead className="min-w-[100px]">الحالة</TableHead>
                    <TableHead className="min-w-[120px]">إجراءات</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{formatDateForDisplay(invoice.issueDate)}</TableCell>
                    <TableCell>{formatDateForDisplay(invoice.dueDate)}</TableCell>
                    <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                    <TableCell>
                        <Badge variant={getStatusVariant(invoice.status)}>{invoice.status}</Badge>
                    </TableCell>
                    <TableCell className="space-x-1 space-x-reverse">
                        <Button variant="ghost" size="icon" aria-label="عرض تفاصيل الفاتورة" onClick={() => handleViewDetails(invoice)}>
                        <Eye className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="تحميل الفاتورة" onClick={handleDownloadInvoice}>
                        <Download className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="طباعة الفاتورة" onClick={handlePrintInvoice}>
                        <Printer className="h-5 w-5" />
                        </Button>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
          </div>
           ) : (
            <p className="text-muted-foreground text-center py-8">
              {statusFilter !== "all" ? "لا توجد فواتير تطابق حالة التصفية المختارة." : "لا توجد فواتير لعرضها حالياً."}
            </p>
          )}
        </CardContent>
      </Card>

      {viewingInvoice && (
        <InvoiceDetailsDialog
          invoice={viewingInvoice}
          isOpen={isViewDetailsDialogOpen}
          onOpenChange={setIsViewDetailsDialogOpen}
        />
      )}
    </div>
  );
}
