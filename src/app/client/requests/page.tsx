
"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label"; // Keep for non-RHF labels if any, or remove if all replaced by FormLabel
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const serviceRequestSchema = z.object({
  serviceType: z.string({ required_error: "يرجى اختيار نوع الخدمة" }).min(1, "يرجى اختيار نوع الخدمة"),
  requestTitle: z.string().min(5, { message: "عنوان الطلب يجب أن لا يقل عن 5 أحرف" }).max(100, { message: "عنوان الطلب يجب أن لا يتجاوز 100 حرف" }),
  requestDetails: z.string().min(10, { message: "تفاصيل الطلب يجب أن لا تقل عن 10 أحرف" }).max(1000, { message: "تفاصيل الطلب يجب أن لا تتجاوز 1000 حرف" }),
  attachments: z.any().optional(), // Basic file handling for now
});

type ServiceRequestFormValues = z.infer<typeof serviceRequestSchema>;

export default function ClientServiceRequestsPage() {
  const { toast } = useToast();
  const form = useForm<ServiceRequestFormValues>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      serviceType: "",
      requestTitle: "",
      requestDetails: "",
      attachments: undefined,
    },
  });
  
  const {formState: {isSubmitting}} = form;

  const onSubmit = async (data: ServiceRequestFormValues) => {
    console.log("Service request data:", data);
    // Handle file upload if data.attachments exists
    if (data.attachments && data.attachments.length > 0) {
      console.log("Attachment:", data.attachments[0]);
      // In a real app, you would upload this file
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    toast({
      title: "تم إرسال الطلب بنجاح",
      description: "سنقوم بمراجعة طلبك والتواصل معك قريباً. (بيانات مسجلة في الكونسول)",
    });
    form.reset();
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
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع الخدمة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="consulting">خدمات استشارية</SelectItem>
                        <SelectItem value="security">حلول أمنية</SelectItem>
                        <SelectItem value="reports">إدارة التقارير</SelectItem>
                        <SelectItem value="audit">التدقيق والمراجعة</SelectItem>
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
                      <Input placeholder="مثال: طلب استشارة مالية" {...field} />
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
                      <Textarea placeholder="يرجى تقديم وصف تفصيلي لطلبك..." rows={5} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="attachments"
                render={({ field: { onChange, value, ...restField } }) => ( // Destructure to handle file input correctly
                  <FormItem>
                    <FormLabel>مرفقات (اختياري)</FormLabel>
                    <FormControl>
                      <Input 
                        type="file" 
                        onChange={(e) => onChange(e.target.files)} // Pass FileList to RHF
                        {...restField} // Pass other props like name, ref
                      />
                    </FormControl>
                    <FormDescription>
                      يمكنك إرفاق ملفات ذات صلة بطلبك.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                <PlusCircle className="me-2 h-5 w-5" />
                إرسال الطلب
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
