
"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress"; 
import { PlusCircle, Loader2, Paperclip } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { db, storage } from "@/lib/firebase"; 
import { collection, addDoc, serverTimestamp } from "firebase/firestore"; 
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"; 
import { useAuth } from "@/context/AuthContext";
import { logActivity } from "@/lib/activityLogger";
import { useState } from "react"; 

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const serviceRequestSchema = z.object({
  serviceType: z.string({ required_error: "يرجى اختيار نوع الخدمة" }).min(1, "يرجى اختيار نوع الخدمة"),
  requestTitle: z.string().min(5, { message: "عنوان الطلب يجب أن لا يقل عن 5 أحرف" }).max(100, { message: "عنوان الطلب يجب أن لا يتجاوز 100 حرف" }),
  requestDetails: z.string().min(10, { message: "تفاصيل الطلب يجب أن لا تقل عن 10 أحرف" }).max(1000, { message: "تفاصيل الطلب يجب أن لا تتجاوز 1000 حرف" }),
  attachments: z
    .custom<FileList>()
    .optional()
    .refine(
      (files) => (!files || files.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE),
      `حجم الملف يجب أن لا يتجاوز ${MAX_FILE_SIZE / 1024 / 1024} ميجا بايت.`
    )
    .refine(
      (files) => (!files || files.length === 0 || ALLOWED_FILE_TYPES.includes(files?.[0]?.type)),
      "نوع الملف غير مدعوم. الأنواع المسموح بها: صور، PDF، مستندات Word، ملفات نصية."
    ),
});

type ServiceRequestFormValues = z.infer<typeof serviceRequestSchema>;

export default function ClientServiceRequestsPage() {
  const { toast } = useToast();
  const { user } = useAuth(); 
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<ServiceRequestFormValues>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      serviceType: "",
      requestTitle: "",
      requestDetails: "",
      attachments: undefined,
    },
  });
  
  const {formState: {isSubmitting}, reset, control} = form;

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
    let docRefId: string | null = null; 

    try {
      const file = data.attachments?.[0] as File | undefined;

      if (file) {
        if (!storage) {
          toast({ title: "خطأ في الخدمة", description: "خدمة تخزين الملفات غير متاحة حالياً. لا يمكن رفع المرفق.", variant: "destructive" });
          setIsUploading(false);
          setUploadProgress(null);
          return;
        }
        setIsUploading(true);
        setUploadProgress(0);
        toast({ title: "جارٍ رفع المرفق...", description: `اسم الملف: ${file.name}`, duration: 3000 });
        const uniqueFilename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
        const storageRef = ref(storage, `service-request-attachments/${user.uid}/${uniqueFilename}`);
        
        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on('state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => {
              console.error("Upload failed:", error);
              setIsUploading(false);
              setUploadProgress(null);
              reject(error);
            },
            async () => {
              attachmentURL = await getDownloadURL(uploadTask.snapshot.ref);
              originalFilename = file.name;
              setUploadProgress(100); 
              resolve();
            }
          );
        });
        // Do not turn off isUploading here, wait for Firestore write.
      }

      const { attachments, ...requestDataToSave } = data;

      const docRef = await addDoc(collection(db, "serviceRequests"), {
        ...requestDataToSave,
        clientId: user.uid,
        clientName: user.displayName || "غير متوفر", 
        clientEmail: user.email || "غير متوفر", 
        status: "جديد", 
        createdAt: serverTimestamp(),
        ...(attachmentURL && { attachmentURL }),
        ...(originalFilename && { attachmentFilename: originalFilename }),
      });
      docRefId = docRef.id;

      toast({
        title: "تم إرسال الطلب بنجاح",
        description: "سنقوم بمراجعة طلبك والتواصل معك قريباً.",
      });
      
      if (user && docRefId) { 
          try {
            await logActivity({
                actionType: "SERVICE_REQUEST_SUBMITTED",
                description: `Client ${user.displayName || user.email} submitted service request: ${data.requestTitle}.`,
                actor: { id: user.uid, role: "client", name: user.displayName },
                target: { id: docRefId, type: "serviceRequest", name: data.requestTitle },
                details: { serviceType: data.serviceType, hasAttachment: !!attachmentURL },
            });
          } catch (logError) {
            console.error("Error logging activity after request submission:", logError);
            // Non-critical error, user request was successful
          }
      }
      reset(); 
    } catch (error: any) {
      console.error("Error submitting service request:", error);
      let errorMessage = "حدث خطأ أثناء محاولة إرسال طلبك. يرجى المحاولة مرة أخرى.";
      if (error.code && error.code.startsWith('storage/')) {
        errorMessage = "حدث خطأ أثناء رفع المرفق. يرجى التحقق من حجم الملف ونوعه أو إرسال الطلب بدون مرفق.";
      } else if (error.message && error.message.includes("Firebase Storage is not initialized")) {
        errorMessage = "خدمة تخزين الملفات غير متاحة حالياً. لا يمكن رفع المرفق.";
      }
      toast({
        title: "خطأ في إرسال الطلب",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
        setIsUploading(false); 
        setUploadProgress(null); 
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
                control={control}
                name="serviceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع الخدمة</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                      <FormControl>
                        <SelectTrigger disabled={isSubmitting || isUploading}>
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
                control={control}
                name="requestTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عنوان الطلب</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: طلب استشارة أمنية لمشروع جديد" {...field} disabled={isSubmitting || isUploading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="requestDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تفاصيل الطلب</FormLabel>
                    <FormControl>
                      <Textarea placeholder="يرجى تقديم وصف تفصيلي لطلبك، بما في ذلك أي معلومات ذات صلة..." rows={5} {...field} disabled={isSubmitting || isUploading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="attachments"
                render={({ field: { onChange, value, ...restField } }) => ( 
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Paperclip className="h-5 w-5" />
                      مرفقات (اختياري)
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="file" 
                        onChange={(e) => onChange(e.target.files)} // Pass FileList
                        {...restField}
                        disabled={isSubmitting || isUploading}
                      />
                    </FormControl>
                    <FormDescription>
                      الأنواع المسموح بها: صور، PDF، مستندات Word، ملفات نصية. الحد الأقصى للحجم: 5 ميجا.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isUploading && uploadProgress !== null && uploadProgress < 100 && (
                <div className="space-y-1 mt-2">
                  <Progress value={uploadProgress} className="w-full h-2" />
                  <p className="text-sm text-muted-foreground text-center">جارٍ رفع الملف: {Math.round(uploadProgress)}%</p>
                </div>
              )}
               {isUploading && uploadProgress === 100 && ( // Still uploading overall, but file part is done
                <p className="text-sm text-green-600 dark:text-green-500 mt-2 text-center">اكتمل رفع الملف، جارٍ إرسال الطلب...</p>
              )}


              <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting || isUploading}>
                {(isSubmitting || isUploading) ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <PlusCircle className="me-2 h-5 w-5" />}
                {(isSubmitting || isUploading) ? 'جارٍ الإرسال...' : 'إرسال الطلب'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

    
