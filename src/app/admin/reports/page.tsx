
"use client";
import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Trash2, Loader2, FilePieChart, Search, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, serverTimestamp, Timestamp, query, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { ReportDetailsDialog } from "@/components/admin/ReportDetailsDialog"; 
import { useAuth } from "@/context/AuthContext";
import { logActivity } from "@/lib/activityLogger";

interface Report {
  id: string;
  title: string;
  description: string;
  content: string; 
  status: "مسودة" | "قيد المراجعة" | "منشور" | "مؤرشف";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

const reportSchema = z.object({
  title: z.string().min(3, { message: "عنوان التقرير يجب أن لا يقل عن 3 أحرف" }),
  description: z.string().min(10, { message: "وصف التقرير يجب أن لا يقل عن 10 أحرف" }).max(500, { message: "وصف التقرير يجب أن لا يتجاوز 500 حرف" }),
  content: z.string().optional(), 
  status: z.enum(["مسودة", "قيد المراجعة", "منشور", "مؤرشف"], { required_error: "يرجى اختيار حالة التقرير" }),
});

type ReportFormValues = z.infer<typeof reportSchema>;

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [isAddReportDialogOpen, setIsAddReportDialogOpen] = useState(false);
  const [isEditReportDialogOpen, setIsEditReportDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [viewingReport, setViewingReport] = useState<Report | null>(null); 
  const [isViewReportDialogOpen, setIsViewReportDialogOpen] = useState(false); 
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { user: adminUser } = useAuth();

  const fetchReports = async () => {
    setIsLoadingReports(true);
    try {
      const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const reportsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
      setReports(reportsData);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast({ title: "خطأ", description: "لم نتمكن من تحميل قائمة التقارير.", variant: "destructive" });
    } finally {
      setIsLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const addReportForm = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: { title: "", description: "", content: "", status: "مسودة" },
  });

  const editReportForm = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
  });

  const handleAddReportSubmit = async (data: ReportFormValues) => {
    try {
      const docRef = await addDoc(collection(db, "reports"), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({ title: "تم بنجاح", description: `تم إنشاء التقرير "${data.title}" بنجاح.` });

      if (adminUser) {
        await logActivity({
          actionType: "REPORT_CREATED",
          description: `Admin ${adminUser.displayName || adminUser.email} created report: ${data.title}.`,
          actor: { id: adminUser.uid, role: adminUser.role, name: adminUser.displayName },
          target: { id: docRef.id, type: "report", name: data.title },
          details: { status: data.status },
        });
      }

      addReportForm.reset();
      setIsAddReportDialogOpen(false);
      fetchReports(); 
    } catch (error) {
      console.error("Error adding report:", error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء إنشاء التقرير.", variant: "destructive" });
    }
  };

  const handleEditReportSubmit = async (data: ReportFormValues) => {
    if (!editingReport) return;
    try {
      const reportRef = doc(db, "reports", editingReport.id);
      await updateDoc(reportRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      toast({ title: "تم التعديل بنجاح", description: `تم تعديل بيانات التقرير "${data.title}".` });

      if (adminUser) {
        await logActivity({
          actionType: "REPORT_UPDATED",
          description: `Admin ${adminUser.displayName || adminUser.email} updated report: ${data.title}.`,
          actor: { id: adminUser.uid, role: adminUser.role, name: adminUser.displayName },
          target: { id: editingReport.id, type: "report", name: data.title },
          details: { status: data.status },
        });
      }

      setIsEditReportDialogOpen(false);
      setEditingReport(null);
      fetchReports();
    } catch (error) {
      console.error("Error updating report:", error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء تعديل بيانات التقرير.", variant: "destructive" });
    }
  };
  
  const openEditDialog = (report: Report) => {
    setEditingReport(report);
    editReportForm.reset({
      title: report.title,
      description: report.description,
      content: report.content || "", 
      status: report.status,
    });
    setIsEditReportDialogOpen(true);
  };

  const openViewDialog = (report: Report) => {
    setViewingReport(report);
    setIsViewReportDialogOpen(true);
  };

  const handleDeleteReport = async (reportId: string, reportTitle: string) => {
    if (!window.confirm('هل أنت متأكد أنك تريد حذف التقرير "' + reportTitle + '"؟')) return;
    try {
      await deleteDoc(doc(db, "reports", reportId));
      toast({ title: "تم الحذف", description: 'تم حذف التقرير "' + reportTitle + '" بنجاح.' });

      if (adminUser) {
        await logActivity({
          actionType: "REPORT_DELETED",
          description: 'Admin ' + (adminUser.displayName || adminUser.email || 'N/A') + ' deleted report: ' + reportTitle + '.',
          actor: { id: adminUser.uid, role: adminUser.role, name: adminUser.displayName },
          target: { id: reportId, type: "report", name: reportTitle },
        });
      }
      fetchReports();
    } catch (error) {
      console.error("Error deleting report:", error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء حذف التقرير.", variant: "destructive" });
    }
  };
  
  const getStatusVariant = (status: Report["status"]): "default" | "secondary" | "destructive" | "outline" => {
    if (status === "منشور") return "outline";
    if (status === "قيد المراجعة") return "secondary";
    if (status === "مسودة") return "default";
    if (status === "مؤرشف") return "destructive";
    return "default";
  };

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
    return new Intl.DateTimeFormat('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
  };

  const filteredReports = useMemo(() => {
    if (!searchTerm) return reports;
    return reports.filter(report =>
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [reports, searchTerm]);

  const renderReportFormFields = (formInstance: typeof addReportForm | typeof editReportForm) => (
    <>
      <FormField control={formInstance.control} name="title" render={({ field }) => (
        <FormItem><FormLabel>عنوان التقرير</FormLabel><FormControl><Input placeholder="مثال: التقرير الأمني للربع الأول" {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={formInstance.control} name="description" render={({ field }) => (
        <FormItem><FormLabel>وصف موجز للتقرير</FormLabel><FormControl><Textarea placeholder="وصف قصير لمحتوى التقرير والغرض منه..." {...field} rows={3} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={formInstance.control} name="content" render={({ field }) => (
        <FormItem><FormLabel>محتوى التقرير</FormLabel><FormControl><Textarea placeholder="أدخل محتوى التقرير هنا..." {...field} rows={10} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={formInstance.control} name="status" render={({ field }) => (
        <FormItem><FormLabel>حالة التقرير</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
            <FormControl><SelectTrigger><SelectValue placeholder="اختر حالة التقرير" /></SelectTrigger></FormControl>
            <SelectContent>
              <SelectItem value="مسودة">مسودة</SelectItem>
              <SelectItem value="قيد المراجعة">قيد المراجعة</SelectItem>
              <SelectItem value="منشور">منشور</SelectItem>
              <SelectItem value="مؤرشف">مؤرشف</SelectItem>
            </SelectContent>
          </Select><FormMessage />
        </FormItem>
      )} />
    </>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <CardTitle className="font-headline text-xl text-primary flex items-center gap-2"><FilePieChart className="h-6 w-6"/> إدارة التقارير</CardTitle>
            <CardDescription>إنشاء، عرض، وتعديل التقارير الخاصة بالنظام.</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0">
            <Button asChild variant="outline">
              <Link href="/admin/ai-tool">
                أداة إنشاء التقارير (AI)
              </Link>
            </Button>
            <Dialog open={isAddReportDialogOpen} onOpenChange={setIsAddReportDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="me-2 h-5 w-5" />
                  إنشاء تقرير جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl" dir="rtl">
                <DialogHeader>
                  <DialogTitle>إنشاء تقرير جديد</DialogTitle>
                  <DialogDescription>
                    املأ النموذج أدناه لإنشاء تقرير جديد.
                  </DialogDescription>
                </DialogHeader>
                <Form {...addReportForm}>
                  <form onSubmit={addReportForm.handleSubmit(handleAddReportSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-2">
                    {renderReportFormFields(addReportForm)}
                    <DialogFooter className="pt-4 sticky bottom-0 bg-card pb-4">
                      <Button type="button" variant="outline" onClick={() => setIsAddReportDialogOpen(false)} disabled={addReportForm.formState.isSubmitting}>إلغاء</Button>
                      <Button type="submit" disabled={addReportForm.formState.isSubmitting}>
                        {addReportForm.formState.isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                        إنشاء التقرير
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 relative max-w-md">
            <Input 
              placeholder="ابحث عن تقرير (بالعنوان، الوصف، أو الحالة)..." 
              className="ps-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
          {isLoadingReports ? (
            <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ms-2">جارٍ تحميل التقارير...</p></div>
          ) : filteredReports.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">عنوان التقرير</TableHead>
                    <TableHead className="min-w-[150px]">الحالة</TableHead>
                    <TableHead className="min-w-[180px]">تاريخ الإنشاء</TableHead>
                    <TableHead className="min-w-[180px]">آخر تحديث</TableHead>
                    <TableHead className="min-w-[150px]">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.id} className="text-xs sm:text-sm">
                      <TableCell className="font-medium">{report.title}</TableCell>
                      <TableCell><Badge variant={getStatusVariant(report.status)}>{report.status}</Badge></TableCell>
                      <TableCell>{formatDate(report.createdAt)}</TableCell>
                      <TableCell>{formatDate(report.updatedAt)}</TableCell>
                      <TableCell className="space-x-1 space-x-reverse">
                        <Button variant="ghost" size="icon" aria-label="عرض التقرير" onClick={() => openViewDialog(report)}>
                          <Eye className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="تعديل التقرير" onClick={() => openEditDialog(report)}>
                          <Edit className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="حذف التقرير" className="text-destructive hover:text-destructive" onClick={() => handleDeleteReport(report.id, report.title)}>
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
             <p className="text-muted-foreground text-center py-8">{searchTerm ? "لم يتم العثور على تقارير تطابق بحثك." : "لا توجد تقارير لعرضها حالياً."}</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditReportDialogOpen} onOpenChange={setIsEditReportDialogOpen}>
        <DialogContent className="sm:max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل بيانات التقرير</DialogTitle>
            <DialogDescription>
              قم بتحديث بيانات التقرير "{editingReport?.title}".
            </DialogDescription>
          </DialogHeader>
          {editingReport && (
            <Form {...editReportForm}>
              <form onSubmit={editReportForm.handleSubmit(handleEditReportSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-2">
                {renderReportFormFields(editReportForm)}
                <DialogFooter className="pt-4 sticky bottom-0 bg-card pb-4">
                  <Button type="button" variant="outline" onClick={() => setIsEditReportDialogOpen(false)} disabled={editReportForm.formState.isSubmitting}>إلغاء</Button>
                  <Button type="submit" disabled={editReportForm.formState.isSubmitting}>
                    {editReportForm.formState.isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                    حفظ التعديلات
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {viewingReport && (
        <ReportDetailsDialog
          report={viewingReport}
          isOpen={isViewReportDialogOpen}
          onOpenChange={setIsViewReportDialogOpen}
        />
      )}
    </div>
  );
}
    

    
