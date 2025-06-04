
"use client";
import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Search, Edit, Trash2, Loader2, Lightbulb, MessageSquareQuote } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, serverTimestamp, Timestamp, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { suggestServiceCategory } from "@/ai/flows/suggest-service-category";
import { generateServiceFAQs, GenerateServiceFAQsOutput, GenerateServiceFAQsInput } from "@/ai/flows/generate-service-faqs";

interface Service {
  id: string;
  name: string;
  category: string;
  price: string;
  description: string;
  status: "متاحة" | "قيد التطوير" | "متوقفة مؤقتاً";
  createdAt: Timestamp | Date;
  faqs?: Array<{ question: string; answer: string }>;
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
  const [isSuggestingCategory, setIsSuggestingCategory] = useState(false);
  const [isGeneratingFAQs, setIsGeneratingFAQs] = useState(false);
  const [generatedFAQs, setGeneratedFAQs] = useState<GenerateServiceFAQsOutput['faqs'] | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
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
  
  const resetDialogStates = () => {
    setGeneratedFAQs(null);
    // Keep setIsSuggestingCategory and setIsGeneratingFAQs as they are managed per interaction
  };

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
        ...(generatedFAQs && generatedFAQs.length > 0 && { faqs: generatedFAQs }),
      });
      toast({ title: "تم بنجاح", description: `تمت إضافة الخدمة ${data.name} بنجاح.` });
      addServiceForm.reset();
      setIsAddServiceDialogOpen(false);
      resetDialogStates();
      fetchServices(); 
    } catch (error) {
      console.error("Error adding service:", error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء إضافة الخدمة.", variant: "destructive" });
    }
  };

  const handleEditServiceSubmit = async (data: ServiceFormValues) => {
    if (!editingService) return;
    try {
      const serviceRef = doc(db, "services", editingService.id);
      await updateDoc(serviceRef, {
        ...data, 
        ...(generatedFAQs && generatedFAQs.length > 0 && { faqs: generatedFAQs }),
        ...(generatedFAQs === null && editingService.faqs ? { faqs: editingService.faqs } : {}),
      });
      toast({ title: "تم التعديل بنجاح", description: `تم تعديل بيانات الخدمة ${data.name}.` });
      setIsEditServiceDialogOpen(false);
      setEditingService(null);
      resetDialogStates();
      fetchServices();
    } catch (error) {
      console.error("Error updating service:", error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء تعديل الخدمة.", variant: "destructive" });
    }
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    editServiceForm.reset({
        name: service.name,
        category: service.category,
        price: service.price,
        description: service.description,
        status: service.status,
    });
    setGeneratedFAQs(service.faqs || null); 
    setIsEditServiceDialogOpen(true);
  };
  
  const openAddDialog = () => {
    addServiceForm.reset();
    resetDialogStates();
    setIsAddServiceDialogOpen(true);
  }

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
  
  const handleSuggestCategory = async (formInstance: typeof addServiceForm | typeof editServiceForm) => {
    const serviceName = formInstance.getValues("name");
    const serviceDescription = formInstance.getValues("description");

    if (!serviceName || !serviceDescription) {
      toast({
        title: "معلومات ناقصة",
        description: "يرجى إدخال اسم الخدمة ووصفها أولاً لاقتراح فئة.",
        variant: "destructive",
      });
      return;
    }

    setIsSuggestingCategory(true);
    try {
      const result = await suggestServiceCategory({ serviceName, serviceDescription });
      if (result.suggestedCategory) {
        formInstance.setValue("category", result.suggestedCategory, { shouldValidate: true });
        toast({ title: "تم اقتراح فئة", description: `الفئة المقترحة: ${result.suggestedCategory}` });
      } else {
        toast({ title: "لم يتم العثور على اقتراح", description: "لم يتمكن الذكاء الاصطناعي من اقتراح فئة.", variant: "default" });
      }
    } catch (error) {
      console.error("Error suggesting category:", error);
      toast({ title: "خطأ في الاقتراح", description: "حدث خطأ أثناء محاولة اقتراح فئة.", variant: "destructive" });
    } finally {
      setIsSuggestingCategory(false);
    }
  };

  const handleGenerateFAQs = async (formInstance: typeof addServiceForm | typeof editServiceForm) => {
    const serviceName = formInstance.getValues("name");
    const serviceDescription = formInstance.getValues("description");

    if (!serviceName || !serviceDescription) {
      toast({
        title: "معلومات ناقصة",
        description: "يرجى إدخال اسم الخدمة ووصفها أولاً لإنشاء الأسئلة الشائعة.",
        variant: "destructive",
      });
      return;
    }
    setGeneratedFAQs(null); 
    setIsGeneratingFAQs(true);
    try {
      const input: GenerateServiceFAQsInput = { serviceName, serviceDescription, faqCount: 3 };
      const result = await generateServiceFAQs(input);
      if (result.faqs && result.faqs.length > 0) {
        setGeneratedFAQs(result.faqs);
        toast({ title: "تم إنشاء الأسئلة الشائعة", description: `تم إنشاء ${result.faqs.length} أسئلة.` });
      } else {
        setGeneratedFAQs([]); 
        toast({ title: "لم يتم إنشاء أسئلة", description: "لم يتمكن الذكاء الاصطناعي من إنشاء أسئلة شائعة. يمكنك المحاولة مرة أخرى.", variant: "default" });
      }
    } catch (error) {
      console.error("Error generating FAQs:", error);
      toast({ title: "خطأ في إنشاء الأسئلة", description: "حدث خطأ أثناء محاولة إنشاء الأسئلة الشائعة.", variant: "destructive" });
    } finally {
      setIsGeneratingFAQs(false);
    }
  };


  const getStatusVariant = (status: Service["status"]): "default" | "secondary" | "destructive" => {
    if (status === "متاحة") return "default";
    if (status === "قيد التطوير") return "secondary";
    if (status === "متوقفة مؤقتاً") return "destructive";
    return "default";
  };

  const renderServiceFormFields = (formInstance: typeof addServiceForm | typeof editServiceForm, currentService?: Service | null) => (
    <>
      <FormField control={formInstance.control} name="name" render={({ field }) => (
        <FormItem><FormLabel>اسم الخدمة</FormLabel><FormControl><Input placeholder="مثال: استشارة أمنية متقدمة" {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={formInstance.control} name="description" render={({ field }) => (
        <FormItem><FormLabel>وصف الخدمة</FormLabel><FormControl><Textarea placeholder="وصف تفصيلي للخدمة المقدمة..." {...field} rows={3} /></FormControl><FormMessage /></FormItem>
      )} />
       <FormField control={formInstance.control} name="category" render={({ field }) => (
        <FormItem>
          <FormLabel>فئة الخدمة</FormLabel>
          <div className="flex gap-2 items-center">
            <FormControl><Input placeholder="مثال: أمن سيبراني" {...field} className="flex-grow"/></FormControl>
            <Button type="button" variant="outline" size="icon" onClick={() => handleSuggestCategory(formInstance)} disabled={isSuggestingCategory || isGeneratingFAQs || formInstance.formState.isSubmitting}>
              {isSuggestingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
              <span className="sr-only">اقترح فئة</span>
            </Button>
          </div>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={formInstance.control} name="price" render={({ field }) => (
        <FormItem><FormLabel>السعر</FormLabel><FormControl><Input placeholder="مثال: 500 ج.م / ساعة أو حسب الطلب" {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={formInstance.control} name="status" render={({ field }) => (
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
      )} />
      <div className="pt-4">
        <Button type="button" variant="outline" className="w-full" onClick={() => handleGenerateFAQs(formInstance)} disabled={isSuggestingCategory || isGeneratingFAQs || formInstance.formState.isSubmitting}>
          {isGeneratingFAQs ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <MessageSquareQuote className="me-2 h-4 w-4" />}
          إنشاء أسئلة شائعة (AI)
        </Button>
      </div>
      {(generatedFAQs && generatedFAQs.length > 0) && (
        <div className="pt-4">
          <h4 className="text-md font-semibold mb-2">الأسئلة الشائعة المقترحة:</h4>
          <Accordion type="single" collapsible className="w-full" defaultValue={generatedFAQs.length > 0 ? "faq-0" : undefined}>
            {generatedFAQs.map((faq, index) => (
              <AccordionItem value={`faq-${index}`} key={index}>
                <AccordionTrigger className="text-sm text-start">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-xs whitespace-pre-wrap p-2 bg-secondary/30 rounded-md">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
       {(generatedFAQs && generatedFAQs.length === 0 && !isGeneratingFAQs) && (
          <p className="pt-4 text-sm text-muted-foreground">لم يتم إنشاء أسئلة شائعة. يمكنك المحاولة مرة أخرى أو إضافتها يدوياً لاحقاً.</p>
       )}
       {currentService && currentService.faqs && currentService.faqs.length > 0 && generatedFAQs === null && !isGeneratingFAQs && (
          <div className="pt-4">
            <h4 className="text-md font-semibold mb-2">الأسئلة الشائعة الحالية:</h4>
             <Accordion type="single" collapsible className="w-full" defaultValue={currentService.faqs.length > 0 ? "faq-0" : undefined}>
                {currentService.faqs.map((faq, index) => (
                <AccordionItem value={`faq-${index}`} key={`existing-faq-${index}`}>
                    <AccordionTrigger className="text-sm text-start">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-xs whitespace-pre-wrap p-2 bg-secondary/30 rounded-md">
                    {faq.answer}
                    </AccordionContent>
                </AccordionItem>
                ))}
            </Accordion>
          </div>
       )}
    </>
  );

  const filteredServices = useMemo(() => {
    if (!searchTerm) return services;
    return services.filter(service =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [services, searchTerm]);


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <CardTitle className="font-headline text-xl text-primary">إدارة الخدمات</CardTitle>
            <CardDescription>إضافة، تعديل، وحذف الخدمات المقدمة عبر البوابة.</CardDescription>
          </div>
          <Dialog open={isAddServiceDialogOpen} onOpenChange={(open) => { setIsAddServiceDialogOpen(open); if(!open) resetDialogStates(); }}>
            <DialogTrigger asChild>
              <Button className="mt-4 md:mt-0" onClick={openAddDialog}>
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
                  {renderServiceFormFields(addServiceForm)}
                  <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => {setIsAddServiceDialogOpen(false); resetDialogStates();}} disabled={addServiceForm.formState.isSubmitting || isSuggestingCategory || isGeneratingFAQs}>إلغاء</Button>
                    <Button type="submit" disabled={addServiceForm.formState.isSubmitting || isSuggestingCategory || isGeneratingFAQs}>
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
          <div className="mb-4">
            <Input 
              placeholder="ابحث عن خدمة (بالاسم، الفئة، أو الوصف)..." 
              className="max-w-md" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {isLoadingServices ? (
            <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ms-2">جارٍ تحميل الخدمات...</p></div>
          ) : filteredServices.length > 0 ? (
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
                {filteredServices.map((service) => (
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
            <p className="text-muted-foreground text-center py-8">
              {searchTerm ? "لم يتم العثور على خدمات تطابق بحثك." : "لا توجد خدمات لعرضها حالياً. قم بإضافة خدمة جديدة."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Edit Service Dialog */}
      <Dialog open={isEditServiceDialogOpen} onOpenChange={(open) => { setIsEditServiceDialogOpen(open); if(!open) resetDialogStates(); }}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل الخدمة</DialogTitle>
            <DialogDescription>
              قم بتحديث بيانات الخدمة {editingService?.name}.
            </DialogDescription>
          </DialogHeader>
          <Form {...editServiceForm}>
            <form onSubmit={editServiceForm.handleSubmit(handleEditServiceSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-2">
              {renderServiceFormFields(editServiceForm, editingService)}
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => {setIsEditServiceDialogOpen(false); resetDialogStates();}} disabled={editServiceForm.formState.isSubmitting || isSuggestingCategory || isGeneratingFAQs}>إلغاء</Button>
                <Button type="submit" disabled={editServiceForm.formState.isSubmitting || isSuggestingCategory || isGeneratingFAQs}>
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
    

    

    