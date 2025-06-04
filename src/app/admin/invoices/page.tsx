
"use client";
import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Trash2, Loader2, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import * as z from "zod";
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Textarea } from "@/components/ui/textarea";
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import { CalendarIcon } from "lucide-react";
// import { Calendar } from "@/components/ui/calendar";
// import { format } from "date-fns";
// import { arSA } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, serverTimestamp, Timestamp, query, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";

interface Invoice {
  id: string;
  clientId: string;
  clientName: string; // Denormalized for easy display
  invoiceNumber: string;
  issueDate: Timestamp;
  dueDate: Timestamp;
  totalAmount: number;
  status: "مستحقة" | "مدفوعة" | "متأخرة" | "ملغاة";
  description: string; // For invoice details/notes
  createdAt: Timestamp;
}

// const invoiceSchema = z.object({ /* ... To be defined later ... */ });
// type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [isAddInvoiceDialogOpen, setIsAddInvoiceDialogOpen] = useState(false);
  // const [isEditInvoiceDialogOpen, setIsEditInvoiceDialogOpen] = useState(false);
  // const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // const [clients, setClients] = useState<{ id: string; name: string }[]>([]);

  const fetchInvoices = async () => {
    setIsLoadingInvoices(true);
    try {
      const q = query(collection(db, "invoices"), orderBy("issueDate", "desc"));
      const querySnapshot = await getDocs(q);
      const invoicesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
      setInvoices(invoicesData);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast({ title: "خطأ", description: "لم نتمكن من تحميل قائمة الفواتير.", variant: "destructive" });
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  // const fetchClientsForSelect = async () => { /* ... To be implemented later ... */ };

  useEffect(() => {
    fetchInvoices();
    // fetchClientsForSelect();
  }, []);

  // const addInvoiceForm = useForm<InvoiceFormValues>({ /* ... */ });
  // const editInvoiceForm = useForm<InvoiceFormValues>({ /* ... */ });

  // const handleAddInvoiceSubmit = async (data: InvoiceFormValues) => { /* ... To be implemented later ... */ };
  // const handleEditInvoiceSubmit = async (data: InvoiceFormValues) => { /* ... To be implemented later ... */ };
  // const openEditDialog = (invoice: Invoice) => { /* ... To be implemented later ... */ };
  const handleDeleteInvoice = async (invoiceId: string, invoiceNumber: string) => { 
    if (!window.confirm(\`هل أنت متأكد أنك تريد حذف الفاتورة رقم \${invoiceNumber}؟ هذا الإجراء لا يمكن التراجع عنه.\`)) return;
    try {
      await deleteDoc(doc(db, "invoices", invoiceId));
      toast({ title: "تم الحذف", description: \`تم حذف الفاتورة رقم \${invoiceNumber} بنجاح.\` });
      fetchInvoices(); // Refresh list
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء حذف الفاتورة.", variant: "destructive" });
    }
  };
  
  const getStatusVariant = (status: Invoice["status"]): "default" | "secondary" | "destructive" | "outline" => {
    if (status === "مدفوعة") return "outline"; // Using outline for "Paid" (often green or distinct)
    if (status === "مستحقة") return "default"; // Using default for "Due" (often blue/primary)
    if (status === "متأخرة") return "secondary"; // Using secondary for "Overdue" (often yellow/orange)
    if (status === "ملغاة") return "destructive"; // Using destructive for "Cancelled"
    return "default";
  };

  const formatDate = (dateValue: Timestamp | Date | undefined): string => {
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


  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return invoices;
    return invoices.filter(invoice =>
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [invoices, searchTerm]);


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <CardTitle className="font-headline text-xl text-primary">إدارة الفواتير</CardTitle>
            <CardDescription>إنشاء، عرض، وتعديل فواتير العملاء.</CardDescription>
          </div>
          <Button className="mt-4 md:mt-0" onClick={() => setIsAddInvoiceDialogOpen(true)} disabled>
            <PlusCircle className="me-2 h-5 w-5" />
            إضافة فاتورة جديدة (قريبا)
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input 
              placeholder="ابحث عن فاتورة (بالرقم، اسم العميل، أو الحالة)..." 
              className="max-w-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {isLoadingInvoices ? (
            <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ms-2">جارٍ تحميل الفواتير...</p></div>
          ) : filteredInvoices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الفاتورة</TableHead>
                  <TableHead>اسم العميل</TableHead>
                  <TableHead>تاريخ الإصدار</TableHead>
                  <TableHead>تاريخ الاستحقاق</TableHead>
                  <TableHead>المبلغ الإجمالي</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.clientName}</TableCell>
                    <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                    <TableCell><Badge variant={getStatusVariant(invoice.status)}>{invoice.status}</Badge></TableCell>
                    <TableCell className="space-x-1 space-x-reverse">
                      <Button variant="ghost" size="icon" aria-label="عرض الفاتورة" disabled>
                        <FileText className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="تعديل الفاتورة" disabled>
                        <Edit className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="حذف الفاتورة" className="text-destructive hover:text-destructive" onClick={() => handleDeleteInvoice(invoice.id, invoice.invoiceNumber)}>
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
             <p className="text-muted-foreground text-center py-8">{searchTerm ? "لم يتم العثور على فواتير تطابق بحثك." : "لا توجد فواتير لعرضها حالياً."}</p>
          )}
        </CardContent>
      </Card>

      {/* Add Invoice Dialog - To be implemented later */}
      <Dialog open={isAddInvoiceDialogOpen} onOpenChange={setIsAddInvoiceDialogOpen}>
        <DialogContent className="sm:max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة فاتورة جديدة</DialogTitle>
            <DialogDescription>
              املأ النموذج أدناه لإنشاء فاتورة جديدة. (هذه الميزة قيد التطوير)
            </DialogDescription>
          </DialogHeader>
          <div className="py-8 text-center text-muted-foreground">
            ميزة إضافة الفواتير سيتم تفعيلها قريباً.
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAddInvoiceDialogOpen(false)}>إلغاء</Button>
            <Button type="submit" disabled>إنشاء الفاتورة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Dialog - To be implemented later */}
      {/* ... */}
    </div>
  );
}
