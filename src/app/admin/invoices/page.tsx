
"use client";
import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Trash2, Loader2, FileText, CalendarIcon, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format as formatDateFn } from "date-fns";
import { arSA } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, serverTimestamp, Timestamp, query, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { InvoiceDetailsDialog } from "@/components/admin/InvoiceDetailsDialog";
import { useAuth } from "@/context/AuthContext";
import { logActivity } from "@/lib/activityLogger";

interface Invoice {
  id: string;
  clientId: string;
  clientName: string; 
  invoiceNumber: string;
  issueDate: Timestamp;
  dueDate: Timestamp;
  totalAmount: number;
  status: "مستحقة" | "مدفوعة" | "متأخرة" | "ملغاة";
  description: string;
  createdAt: Timestamp;
}

const invoiceSchema = z.object({
  clientId: z.string({ required_error: "يرجى اختيار العميل" }),
  invoiceNumber: z.string().min(1, { message: "رقم الفاتورة مطلوب" }),
  description: z.string().min(5, { message: "وصف الفاتورة يجب أن لا يقل عن 5 أحرف" }),
  issueDate: z.date({ required_error: "يرجى اختيار تاريخ الإصدار" }),
  dueDate: z.date({ required_error: "يرجى اختيار تاريخ الاستحقاق" }),
  totalAmount: z.coerce.number().positive({ message: "المبلغ الإجمالي يجب أن يكون رقماً موجباً" }),
  status: z.enum(["مستحقة", "مدفوعة", "متأخرة", "ملغاة"], { required_error: "يرجى اختيار حالة الفاتورة" }),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface ClientOption {
  id: string;
  name: string;
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [isAddInvoiceDialogOpen, setIsAddInvoiceDialogOpen] = useState(false);
  const [isEditInvoiceDialogOpen, setIsEditInvoiceDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { user: adminUser } = useAuth();

  const [clients, setClients] = useState<ClientOption[]>([]);

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

  const fetchClientsForSelect = async () => {
    try {
      const q = query(collection(db, "clients"), orderBy("name", "asc"));
      const querySnapshot = await getDocs(q);
      const clientsData = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name as string }));
      setClients(clientsData);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast({ title: "خطأ", description: "لم نتمكن من تحميل قائمة العملاء لاختيارهم.", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchClientsForSelect();
  }, []);

  const addInvoiceForm = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      clientId: "",
      invoiceNumber: "",
      description: "",
      issueDate: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)), 
      totalAmount: 0,
      status: "مستحقة",
    },
  });

  const editInvoiceForm = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
  });

  const handleAddInvoiceSubmit = async (data: InvoiceFormValues) => {
    const selectedClient = clients.find(c => c.id === data.clientId);
    if (!selectedClient) {
      toast({ title: "خطأ", description: "العميل المحدد غير موجود.", variant: "destructive" });
      return;
    }

    try {
      const docRef = await addDoc(collection(db, "invoices"), {
        ...data,
        clientName: selectedClient.name, 
        issueDate: Timestamp.fromDate(data.issueDate),
        dueDate: Timestamp.fromDate(data.dueDate),
        createdAt: serverTimestamp(),
      });
      toast({ title: "تم بنجاح", description: `تمت إضافة الفاتورة رقم ${data.invoiceNumber} بنجاح.` });
      
      if (adminUser) {
        await logActivity({
          actionType: "INVOICE_CREATED",
          description: `Admin ${adminUser.displayName || adminUser.email} created invoice: ${data.invoiceNumber} for client ${selectedClient.name}.`,
          actor: { id: adminUser.uid, role: adminUser.role, name: adminUser.displayName },
          target: { id: docRef.id, type: "invoice", name: data.invoiceNumber },
          details: { clientId: selectedClient.id, clientName: selectedClient.name, totalAmount: data.totalAmount, status: data.status },
        });
      }

      addInvoiceForm.reset();
      setIsAddInvoiceDialogOpen(false);
      fetchInvoices(); 
    } catch (error) {
      console.error("Error adding invoice:", error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء إضافة الفاتورة.", variant: "destructive" });
    }
  };
  
  const handleEditInvoiceSubmit = async (data: InvoiceFormValues) => {
    if (!editingInvoice) return;
    
    const selectedClient = clients.find(c => c.id === data.clientId);
     if (!selectedClient) {
      toast({ title: "خطأ", description: "العميل المحدد غير موجود.", variant: "destructive" });
      return;
    }

    try {
      const invoiceRef = doc(db, "invoices", editingInvoice.id);
      await updateDoc(invoiceRef, {
        ...data,
        clientName: selectedClient.name, 
        issueDate: Timestamp.fromDate(data.issueDate),
        dueDate: Timestamp.fromDate(data.dueDate),
      });
      toast({ title: "تم التعديل بنجاح", description: `تم تعديل الفاتورة رقم ${data.invoiceNumber}.` });

      if (adminUser) {
        await logActivity({
          actionType: "INVOICE_UPDATED",
          description: `Admin ${adminUser.displayName || adminUser.email} updated invoice: ${data.invoiceNumber} for client ${selectedClient.name}.`,
          actor: { id: adminUser.uid, role: adminUser.role, name: adminUser.displayName },
          target: { id: editingInvoice.id, type: "invoice", name: data.invoiceNumber },
          details: { clientId: selectedClient.id, clientName: selectedClient.name, totalAmount: data.totalAmount, status: data.status },
        });
      }

      setIsEditInvoiceDialogOpen(false);
      setEditingInvoice(null);
      fetchInvoices();
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء تعديل الفاتورة.", variant: "destructive" });
    }
  };

  const openEditDialog = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    editInvoiceForm.reset({
      clientId: invoice.clientId,
      invoiceNumber: invoice.invoiceNumber,
      description: invoice.description,
      issueDate: invoice.issueDate.toDate(), 
      dueDate: invoice.dueDate.toDate(),     
      totalAmount: invoice.totalAmount,
      status: invoice.status,
    });
    setIsEditInvoiceDialogOpen(true);
  };

  const openViewDetailsDialog = (invoice: Invoice) => {
    setViewingInvoice(invoice);
    setIsViewDetailsDialogOpen(true);
  };

  const handleDeleteInvoice = async (invoiceId: string, invoiceNumber: string) => { 
    if (!window.confirm(`هل أنت متأكد أنك تريد حذف الفاتورة رقم ${invoiceNumber}؟ هذا الإجراء لا يمكن التراجع عنه.`)) return;
    try {
      const deletedInvoice = invoices.find(inv => inv.id === invoiceId); 
      await deleteDoc(doc(db, "invoices", invoiceId));
      toast({ title: "تم الحذف", description: `تم حذف الفاتورة رقم ${invoiceNumber} بنجاح.` });

      if (adminUser && deletedInvoice) {
        await logActivity({
          actionType: "INVOICE_DELETED",
          description: `Admin ${adminUser.displayName || adminUser.email} deleted invoice: ${invoiceNumber} for client ${deletedInvoice.clientName}.`,
          actor: { id: adminUser.uid, role: adminUser.role, name: adminUser.displayName },
          target: { id: invoiceId, type: "invoice", name: invoiceNumber },
          details: { clientName: deletedInvoice.clientName, totalAmount: deletedInvoice.totalAmount },
        });
      }
      fetchInvoices(); 
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء حذف الفاتورة.", variant: "destructive" });
    }
  };
  
  const getStatusVariant = (status: Invoice["status"]): "default" | "secondary" | "destructive" | "outline" => {
    if (status === "مدفوعة") return "outline"; 
    if (status === "مستحقة") return "default"; 
    if (status === "متأخرة") return "secondary"; 
    if (status === "ملغاة") return "destructive";
    return "default";
  };

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

  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return invoices;
    const lowercasedFilter = searchTerm.toLowerCase();
    return invoices.filter(invoice =>
      invoice.invoiceNumber.toLowerCase().includes(lowercasedFilter) ||
      invoice.clientName.toLowerCase().includes(lowercasedFilter) ||
      invoice.status.toLowerCase().includes(lowercasedFilter)
    );
  }, [invoices, searchTerm]);

  const renderInvoiceFormFields = (formInstance: typeof addInvoiceForm | typeof editInvoiceForm, isEditing = false) => (
    <>
      <FormField
        control={formInstance.control}
        name="clientId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>العميل</FormLabel>
            <Select onValueChange={field.onChange} value={field.value} dir="rtl" disabled={clients.length === 0}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={clients.length === 0 ? "جارٍ تحميل العملاء..." : "اختر العميل"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={formInstance.control}
        name="invoiceNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>رقم الفاتورة</FormLabel>
            <FormControl><Input placeholder="مثال: INV-2024-001" {...field} /></FormControl> 
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={formInstance.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>الوصف/البيان</FormLabel>
            <FormControl><Textarea placeholder="وصف موجز لمحتويات الفاتورة..." {...field} rows={3} /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={formInstance.control}
          name="issueDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>تاريخ الإصدار</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                    >
                      <CalendarIcon className="me-2 h-4 w-4" />
                      {field.value ? formatDateFn(field.value, "PPP", { locale: arSA }) : <span>اختر تاريخ</span>}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus captionLayout="dropdown-buttons" fromYear={2020} toYear={new Date().getFullYear() + 5} />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={formInstance.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>تاريخ الاستحقاق</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                    >
                      <CalendarIcon className="me-2 h-4 w-4" />
                      {field.value ? formatDateFn(field.value, "PPP", { locale: arSA }) : <span>اختر تاريخ</span>}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus captionLayout="dropdown-buttons" fromYear={2020} toYear={new Date().getFullYear() + 10} />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={formInstance.control}
        name="totalAmount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>المبلغ الإجمالي (ج.م)</FormLabel>
            <FormControl><Input type="number" placeholder="مثال: 1500.50" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={formInstance.control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>حالة الفاتورة</FormLabel>
            <Select onValueChange={field.onChange} value={field.value} dir="rtl">
              <FormControl><SelectTrigger><SelectValue placeholder="اختر حالة الفاتورة" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="مستحقة">مستحقة</SelectItem>
                <SelectItem value="مدفوعة">مدفوعة</SelectItem>
                <SelectItem value="متأخرة">متأخرة</SelectItem>
                <SelectItem value="ملغاة">ملغاة</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <CardTitle className="font-headline text-xl text-primary">إدارة الفواتير</CardTitle>
            <CardDescription>إنشاء، عرض، وتعديل فواتير العملاء.</CardDescription>
          </div>
          <Dialog open={isAddInvoiceDialogOpen} onOpenChange={setIsAddInvoiceDialogOpen}>
            <DialogTrigger asChild>
                <Button className="mt-4 md:mt-0">
                    <PlusCircle className="me-2 h-5 w-5" />
                    إضافة فاتورة جديدة
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl" dir="rtl">
              <DialogHeader>
                <DialogTitle>إضافة فاتورة جديدة</DialogTitle>
                <DialogDescription>
                  املأ النموذج أدناه لإنشاء فاتورة جديدة.
                </DialogDescription>
              </DialogHeader>
              <Form {...addInvoiceForm}>
                <form onSubmit={addInvoiceForm.handleSubmit(handleAddInvoiceSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-2">
                  {renderInvoiceFormFields(addInvoiceForm)}
                  <DialogFooter className="pt-4 sticky bottom-0 bg-card pb-4">
                    <Button type="button" variant="outline" onClick={() => setIsAddInvoiceDialogOpen(false)} disabled={addInvoiceForm.formState.isSubmitting}>إلغاء</Button>
                    <Button type="submit" disabled={addInvoiceForm.formState.isSubmitting}>
                      {addInvoiceForm.formState.isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                      إنشاء الفاتورة
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="mb-4 relative max-w-md">
            <Input 
              placeholder="ابحث عن فاتورة (بالرقم، اسم العميل، أو الحالة)..." 
              className="ps-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
          {isLoadingInvoices ? (
            <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ms-2">جارٍ تحميل الفواتير...</p></div>
          ) : filteredInvoices.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">رقم الفاتورة</TableHead>
                    <TableHead className="min-w-[150px]">اسم العميل</TableHead>
                    <TableHead className="min-w-[120px]">تاريخ الإصدار</TableHead>
                    <TableHead className="min-w-[120px]">تاريخ الاستحقاق</TableHead>
                    <TableHead className="min-w-[100px]">المبلغ</TableHead>
                    <TableHead className="min-w-[100px]">الحالة</TableHead>
                    <TableHead className="min-w-[120px]">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className="text-xs sm:text-sm">
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.clientName}</TableCell>
                      <TableCell>{formatDateForDisplay(invoice.issueDate)}</TableCell>
                      <TableCell>{formatDateForDisplay(invoice.dueDate)}</TableCell>
                      <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                      <TableCell><Badge variant={getStatusVariant(invoice.status)}>{invoice.status}</Badge></TableCell>
                      <TableCell className="space-x-1 space-x-reverse">
                        <Button variant="ghost" size="icon" aria-label="عرض الفاتورة" onClick={() => openViewDetailsDialog(invoice)}> 
                          <FileText className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="تعديل الفاتورة" onClick={() => openEditDialog(invoice)}>
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
            </div>
          ) : (
             <p className="text-muted-foreground text-center py-8">{searchTerm ? "لم يتم العثور على فواتير تطابق بحثك." : "لا توجد فواتير لعرضها حالياً."}</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditInvoiceDialogOpen} onOpenChange={setIsEditInvoiceDialogOpen}>
        <DialogContent className="sm:max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل الفاتورة</DialogTitle>
            <DialogDescription>
              قم بتحديث بيانات الفاتورة رقم {editingInvoice?.invoiceNumber}.
            </DialogDescription>
          </DialogHeader>
          {editingInvoice && (
            <Form {...editInvoiceForm}>
              <form onSubmit={editInvoiceForm.handleSubmit(handleEditInvoiceSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-2">
                {renderInvoiceFormFields(editInvoiceForm, true)}
                <DialogFooter className="pt-4 sticky bottom-0 bg-card pb-4">
                  <Button type="button" variant="outline" onClick={() => setIsEditInvoiceDialogOpen(false)} disabled={editInvoiceForm.formState.isSubmitting}>إلغاء</Button>
                  <Button type="submit" disabled={editInvoiceForm.formState.isSubmitting}>
                    {editInvoiceForm.formState.isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                    حفظ التعديلات
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

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

    
