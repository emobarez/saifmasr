
"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Search, Edit, Trash2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, serverTimestamp, Timestamp, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";

interface Service {
  id: string;
  name: string;
  category: string;
  price: string;
  description: string;
  status: "متاحة" | "قيد التطوير" | "متوقفة مؤقتاً";
  createdAt: Timestamp | Date;
}

const serviceSchema = z.object({
  name: z.string().min(3, { message: "اسم الخدمة يجب أن لا يقل عن 3 أحرف" }),
  category: z.string().min(2, { message: "فئة الخدمة مطلوبة" }),
  price: z.string().min(1, { message: "سعر الخدمة مطلوب" }),
  description: z.string().min(10, { message: "وصف الخدمة يجب أن لا يقل عن 10 أحرف" }).max(500, {message: "وصف الخدمة يجب أن لا يتجاوز 500 حرف"}),
  status: z.enum(["متاحة", "قيد التطوير", "متوقفة مؤقتاً"], { required_error: "يرجى اختيار حالة الخدمة" }),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [isAddServiceDialogOpen, setIsAddServiceDialogOpen] = useState(false);
  const [isEditServiceDialogOpen, setIsEditServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const { toast } = useToast();

  const fetchServices = async () => {
    setIsLoadingServices(true);
    try {
      const q = query(collection(db, "services"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const servicesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
      setServices(servicesData);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast({ title: "خطأ", description: "لم نتمكن من تحميل قائمة الخدمات.", variant: "destructive" });
    } finally {
      setIsLoadingServices(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const addServiceForm = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { name: "", category: "", price: "", description: "", status: "متاحة" },
  });

  const editServiceForm = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
  });

  const handleAddServiceSubmit = async (data: ServiceFormValues) => {
    try {
      await addDoc(collection(db, "services"), {
        ...data,
        createdAt: serverTimestamp(),
      });
      toast({ title: "تم بنجاح", description: `تمت إضافة الخدمة ${data.name} بنجاح.` });
      addServiceForm.reset();
      setIsAddServiceDialogOpen(false);
      fetchServices(); // Refresh list
    } catch (error) {
      console.error("Error adding service:", error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء إضافة الخدمة.", variant: "destructive" });
    }
  };

  const handleEditServiceSubmit = async (data: ServiceFormValues) => {
    if (!editingService) return;
    try {
      const serviceRef = doc(db, "services", editingService.id);
      await updateDoc(serviceRef, data);
      toast({ title: "تم التعديل بنجاح", description: `تم تعديل بيانات الخدمة ${data.name}.` });
      setIsEditServiceDialogOpen(false);
      setEditingService(null);
      fetchServices();
    } catch (error) {
      console.error("Error updating service:", error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء تعديل الخدمة.", variant: "destructive" });
    }
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    editServiceForm.reset(service);
    setIsEditServiceDialogOpen(true);
  };

  const handleDeleteService = async (serviceId: string, serviceName: string) => {
    if (!window.confirm(`هل أنت متأكد أنك تريد حذف الخدمة ${serviceName}؟`)) return;
    try {
      await deleteDoc(doc(db, "services", serviceId));
      toast({ title: "تم الحذف", description: `تم حذف الخدمة ${serviceName} بنجاح.` });
      fetchServices();
    } catch (error) {
      console.error("Error deleting service:", error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء حذف الخدمة.", variant: "destructive" });
    }
  };

  const getStatusVariant = (status: Service["status"]): "default" | "secondary" | "destructive" => {
    if (status === "متاحة") return "default";
    if (status === "قيد التطوير") return "secondary";
    if (status === "متوقفة مؤقتاً") return "destructive";
    return "default";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <CardTitle className="font-headline text-xl text-primary">إدارة الخدمات</CardTitle>
            <CardDescription>إضافة، تعديل، وحذف الخدمات المقدمة عبر البوابة.</CardDescription>
          </div>
          <Dialog open={isAddServiceDialogOpen} onOpenChange={setIsAddServiceDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4 md:mt-0">
                <PlusCircle className="me-2 h-5 w-5" />
                إضافة خدمة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg" dir="rtl">
              <DialogHeader>
                <DialogTitle>إضافة خدمة جديدة</DialogTitle>
                <DialogDescription>
                  املأ النموذج أدناه لإضافة خدمة جديدة إلى النظام.
                </DialogDescription>
              </DialogHeader>
              <Form {...addServiceForm}>
                <form onSubmit={addServiceForm.handleSubmit(handleAddServiceSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-2">
                  <FormField control={addServiceForm.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>اسم الخدمة</FormLabel><FormControl><Input placeholder="مثال: استشارة أمنية متقدمة" {...field} /></FormControl><FormMessage /></FormItem>
                    )}
                  />
                  <FormField control={addServiceForm.control} name="category" render={({ field }) => (
                      <FormItem><FormLabel>فئة الخدمة</FormLabel><FormControl><Input placeholder="مثال: أمن سيبراني" {...field} /></FormControl><FormMessage /></FormItem>
                    )}
                  />
                  <FormField control={addServiceForm.control} name="price" render={({ field }) => (
                      <FormItem><FormLabel>السعر</FormLabel><FormControl><Input placeholder="مثال: 500 ج.م / ساعة أو حسب الطلب" {...field} /></FormControl><FormMessage /></FormItem>
                    )}
                  />
                  <FormField control={addServiceForm.control} name="description" render={({ field }) => (
                      <FormItem><FormLabel>وصف الخدمة</FormLabel><FormControl><Textarea placeholder="وصف تفصيلي للخدمة المقدمة..." {...field} rows={4}/></FormControl><FormMessage /></FormItem>
                    )}
                  />
                  <FormField control={addServiceForm.control} name="status" render={({ field }) => (
                      <FormItem><FormLabel>حالة الخدمة</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                          <FormControl><SelectTrigger><SelectValue placeholder="اختر حالة الخدمة" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="متاحة">متاحة</SelectItem>
                            <SelectItem value="قيد التطوير">قيد التطوير</SelectItem>
                            <SelectItem value="متوقفة مؤقتاً">متوقفة مؤقتاً</SelectItem>
                          </SelectContent>
                        </Select><FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsAddServiceDialogOpen(false)} disabled={addServiceForm.formState.isSubmitting}>إلغاء</Button>
                    <Button type="submit" disabled={addServiceForm.formState.isSubmitting}>
                       {addServiceForm.formState.isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                      إضافة الخدمة
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            <Input placeholder="ابحث عن خدمة..." className="max-w-sm" />
            <Button variant="outline" size="icon"><Search className="h-5 w-5"/></Button>
          </div>
          {isLoadingServices ? (
            <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ms-2">جارٍ تحميل الخدمات...</p></div>
          ) : services.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم الخدمة</TableHead>
                  <TableHead>الفئة</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>{service.category}</TableCell>
                    <TableCell>{service.price}</TableCell>
                    <TableCell><Badge variant={getStatusVariant(service.status)}>{service.status}</Badge></TableCell>
                    <TableCell className="space-x-1 space-x-reverse">
                      <Button variant="ghost" size="icon" aria-label="تعديل الخدمة" onClick={() => openEditDialog(service)}>
                        <Edit className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="حذف الخدمة" className="text-destructive hover:text-destructive" onClick={() => handleDeleteService(service.id, service.name)}>
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">لا توجد خدمات لعرضها حالياً. قم بإضافة خدمة جديدة.</p>
          )}
        </CardContent>
      </Card>

      {/* Edit Service Dialog */}
      <Dialog open={isEditServiceDialogOpen} onOpenChange={setIsEditServiceDialogOpen}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل الخدمة</DialogTitle>
            <DialogDescription>
              قم بتحديث بيانات الخدمة {editingService?.name}.
            </DialogDescription>
          </DialogHeader>
          <Form {...editServiceForm}>
            <form onSubmit={editServiceForm.handleSubmit(handleEditServiceSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-2">
            <FormField control={editServiceForm.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>اسم الخدمة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )}
            />
            <FormField control={editServiceForm.control} name="category" render={({ field }) => (
                <FormItem><FormLabel>فئة الخدمة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )}
            />
            <FormField control={editServiceForm.control} name="price" render={({ field }) => (
                <FormItem><FormLabel>السعر</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )}
            />
            <FormField control={editServiceForm.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>وصف الخدمة</FormLabel><FormControl><Textarea {...field} rows={4}/></FormControl><FormMessage /></FormItem>
              )}
            />
            <FormField control={editServiceForm.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>حالة الخدمة</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="متاحة">متاحة</SelectItem>
                      <SelectItem value="قيد التطوير">قيد التطوير</SelectItem>
                      <SelectItem value="متوقفة مؤقتاً">متوقفة مؤقتاً</SelectItem>
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )}
            />
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditServiceDialogOpen(false)} disabled={editServiceForm.formState.isSubmitting}>إلغاء</Button>
                <Button type="submit" disabled={editServiceForm.formState.isSubmitting}>
                  {editServiceForm.formState.isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                  حفظ التعديلات
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
