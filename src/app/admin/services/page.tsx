
"use client";
import { useState } from "react";
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

const sampleServices = [
  { id: "SVC-001", name: "خدمات استشارية", category: "استشارات", price: "حسب الطلب", status: "متاحة", statusVariant: "default" },
  { id: "SVC-002", name: "حلول أمنية متقدمة", category: "أمن سيبراني", price: "تبدأ من 10,000 ج.م", status: "متاحة", statusVariant: "default" },
  { id: "SVC-003", name: "إدارة تقارير مخصصة", category: "تقارير", price: "5,000 ج.م/شهرياً", status: "قيد التطوير", statusVariant: "secondary" },
];

const addServiceSchema = z.object({
  name: z.string().min(3, { message: "اسم الخدمة يجب أن لا يقل عن 3 أحرف" }),
  category: z.string().min(2, { message: "فئة الخدمة مطلوبة" }),
  price: z.string().min(1, { message: "سعر الخدمة مطلوب" }),
  description: z.string().min(10, { message: "وصف الخدمة يجب أن لا يقل عن 10 أحرف" }).max(500, {message: "وصف الخدمة يجب أن لا يتجاوز 500 حرف"}),
  status: z.enum(["متاحة", "قيد التطوير", "متوقفة مؤقتاً"], { required_error: "يرجى اختيار حالة الخدمة" }),
});

type AddServiceFormValues = z.infer<typeof addServiceSchema>;

export default function AdminServicesPage() {
  const [isAddServiceDialogOpen, setIsAddServiceDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<AddServiceFormValues>({
    resolver: zodResolver(addServiceSchema),
    defaultValues: {
      name: "",
      category: "",
      price: "",
      description: "",
      status: "متاحة",
    },
  });

  const {formState: {isSubmitting}} = form;

  const onSubmit = async (data: AddServiceFormValues) => {
    console.log("New service data:", data);
    // Here you would typically call an API to save the service
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    toast({
      title: "تم بنجاح",
      description: `تمت إضافة الخدمة ${data.name} بنجاح. (بيانات مسجلة في الكونسول)`,
    });
    form.reset();
    setIsAddServiceDialogOpen(false);
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
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم الخدمة</FormLabel>
                        <FormControl>
                          <Input placeholder="مثال: استشارة أمنية متقدمة" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>فئة الخدمة</FormLabel>
                        <FormControl>
                          <Input placeholder="مثال: أمن سيبراني" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>السعر</FormLabel>
                        <FormControl>
                          <Input placeholder="مثال: 500 ج.م / ساعة أو حسب الطلب" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>وصف الخدمة</FormLabel>
                        <FormControl>
                          <Textarea placeholder="وصف تفصيلي للخدمة المقدمة..." {...field} rows={4}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>حالة الخدمة</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر حالة الخدمة" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="متاحة">متاحة</SelectItem>
                            <SelectItem value="قيد التطوير">قيد التطوير</SelectItem>
                            <SelectItem value="متوقفة مؤقتاً">متوقفة مؤقتاً</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsAddServiceDialogOpen(false)} disabled={isSubmitting}>
                      إلغاء
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                       {isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
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
          {sampleServices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المعرف</TableHead>
                  <TableHead>اسم الخدمة</TableHead>
                  <TableHead>الفئة</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.id}</TableCell>
                    <TableCell>{service.name}</TableCell>
                    <TableCell>{service.category}</TableCell>
                    <TableCell>{service.price}</TableCell>
                    <TableCell>
                      <Badge variant={service.statusVariant as any}>{service.status}</Badge>
                    </TableCell>
                    <TableCell className="space-x-1 space-x-reverse">
                      <Button variant="ghost" size="icon" aria-label="تعديل الخدمة">
                        <Edit className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="حذف الخدمة" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">لا توجد خدمات لعرضها حالياً.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
