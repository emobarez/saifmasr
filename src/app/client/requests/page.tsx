
"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { db, storage } from "@/lib/firebase"; // Import db and storage
import { collection, addDoc, serverTimestamp } from "firebase/firestore"; 
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"; // Import Storage functions
import { useAuth } from "@/context/AuthContext";

const serviceRequestSchema = z.object({
  serviceType: z.string({ required_error: "يرجى اختيار نوع الخدمة" }).min(1, "يرجى اختيار نوع الخدمة"),
  requestTitle: z.string().min(5, { message: "عنوان الطلب يجب أن لا يقل عن 5 أحرف" }).max(100, { message: "عنوان الطلب يجب أن لا يتجاوز 100 حرف" }),
  requestDetails: z.string().min(10, { message: "تفاصيل الطلب يجب أن لا تقل عن 10 أحرف" }).max(1000, { message: "تفاصيل الطلب يجب أن لا تتجاوز 1000 حرف" }),
  attachments: z.any().optional(), 
});

type ServiceRequestFormValues = z.infer<typeof serviceRequestSchema>;

export default function ClientServiceRequestsPage() {
  const { toast } = useToast();
  const { user } = useAuth(); 
  const form = useForm<ServiceRequestFormValues>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      serviceType: "",
      requestTitle: "",
      requestDetails: "",
      attachments: undefined,
    },
  });
  
  const {formState: {isSubmitting}, reset} = form;

  const onSubmit = async (data: ServiceRequestFormValues) => {
    if (!user) {
      toast({
        title: "خطأ في المصادقة",
        description: "يجب أن تكون مسجلاً الدخول لتقديم طلب.",
        variant: "destructive",
      });
      return;
    }

    let attachmentURL: string | null = null;
    let originalFilename: string | null = null;

    try {
      form.control.handleSubmit // to ensure isSubmitting is true
      
      const file = data.attachments?.[0] as File | undefined;

      if (file) {
        toast({ title: "جارٍ رفع المرفق...", description: "قد يستغرق هذا بعض الوقت." });
        const uniqueFilename = `${Date.now()}-${file.name}`;
        const storageRef = ref(storage, `service-request-attachments/${user.uid}/${uniqueFilename}`);
        
        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on('state_changed',
            (snapshot) => {
              // Optional: handle progress
            },
            (error) => {
              console.error("Upload failed:", error);
              reject(error);
            },
            async () => {
              attachmentURL = await getDownloadURL(uploadTask.snapshot.ref);
              originalFilename = file.name;
              resolve();
            }
          );
        });
        toast({ title: "تم رفع المرفق بنجاح", description: "يتم الآن إرسال طلبك." });
      }

      const { attachments, ...requestDataToSave } = data;

      await addDoc(collection(db, "serviceRequests"), {
        ...requestDataToSave,
        clientId: user.uid,
        clientName: user.displayName || "غير متوفر", 
        clientEmail: user.email || "غير متوفر", 
        status: "جديد", 
        createdAt: serverTimestamp(),
        ...(attachmentURL && { attachmentURL }),
        ...(originalFilename && { attachmentFilename: originalFilename }),
      });

      toast({
        title: "تم إرسال الطلب بنجاح",
        description: "سنقوم بمراجعة طلبك والتواصل معك قريباً.",
      });
      reset(); // Reset form fields, including file input
    } catch (error: any) {
      console.error("Error submitting service request:", error);
      let errorMessage = "حدث خطأ أثناء محاولة إرسال طلبك. يرجى المحاولة مرة أخرى.";
      if (error.code && error.code.startsWith('storage/')) {
        errorMessage = "حدث خطأ أثناء رفع المرفق. يرجى المحاولة مرة أخرى أو إرسال الطلب بدون مرفق.";
      }
      toast({
        title: "خطأ في إرسال الطلب",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl text-primary">طلب خدمة جديدة</CardTitle>
          <CardDescription>املأ النموذج أدناه لتقديم طلب خدمة جديد. سنقوم بمراجعته والتواصل معك في أقرب وقت.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="serviceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع الخدمة</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                      <FormControl>
                        <SelectTrigger disabled={isSubmitting}>
                          <SelectValue placeholder="اختر نوع الخدمة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="consulting">خدمات استشارية</SelectItem>
                        <SelectItem value="security">حلول أمنية</SelectItem>
                        <SelectItem value="reports">إدارة التقارير</SelectItem>
                        <SelectItem value="audit">التدقيق والمراجعة</SelectItem>
                        <SelectItem value="other">أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="requestTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عنوان الطلب</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: طلب استشارة أمنية لمشروع جديد" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="requestDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تفاصيل الطلب</FormLabel>
                    <FormControl>
                      <Textarea placeholder="يرجى تقديم وصف تفصيلي لطلبك، بما في ذلك أي معلومات ذات صلة..." rows={5} {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="attachments"
                render={({ field: { onChange, value, ...restField } }) => ( 
                  <FormItem>
                    <FormLabel>مرفقات (اختياري)</FormLabel>
                    <FormControl>
                      <Input 
                        type="file" 
                        onChange={(e) => onChange(e.target.files)} 
                        {...restField}
                        disabled={isSubmitting}
                        className="pt-2" // Added padding for better visual alignment
                      />
                    </FormControl>
                    <FormDescription>
                      يمكنك إرفاق ملفات ذات صلة بطلبك (مثل مستندات، صور، إلخ). الحد الأقصى للحجم: 5 ميجا.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <PlusCircle className="me-2 h-5 w-5" />}
                {isSubmitting ? 'جارٍ الإرسال...' : 'إرسال الطلب'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
