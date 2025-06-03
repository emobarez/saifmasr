
"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Keep for non-RHF labels for password section
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit3, Save, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const updateProfileSchema = z.object({
  name: z.string().min(2, { message: "الاسم يجب أن لا يقل عن حرفين" }),
  email: z.string().email({ message: "البريد الإلكتروني غير صالح" }),
  // Password fields are handled separately for now, not part of this schema
});

type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;

export default function ClientProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const { formState: {isSubmitting}, setValue, reset } = form;

  useEffect(() => {
    if (user) {
      setValue("name", user.displayName || "");
      setValue("email", user.email || "");
    }
  }, [user, setValue]);

  const getInitials = (name?: string | null) => {
    if (!name) return "CM";
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // If was editing and clicked cancel (Save icon becomes Edit3 icon again)
      if (user) { // Reset form to original user values
        reset({ name: user.displayName || "", email: user.email || "" });
      }
    }
    setIsEditing(!isEditing);
  };

  const onSubmit = async (data: UpdateProfileFormValues) => {
    console.log("Updating profile with data:", data);
    // Here you would typically call an API (e.g., Firebase updateProfile)
    // For now, we simulate an API call and log to console
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: "تم تحديث الملف الشخصي",
      description: "تم حفظ تغييرات ملفك الشخصي بنجاح. (بيانات مسجلة في الكونسول)",
    });
    setIsEditing(false);
    // Potentially update user in AuthContext if displayName/email changed and API call was successful
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ms-2">جاري تحميل بيانات المستخدم...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row justify-between items-start">
          <div>
            <CardTitle className="font-headline text-xl text-primary">الملف الشخصي</CardTitle>
            <CardDescription>إدارة معلومات حسابك وتفضيلاتك.</CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={handleEditToggle} aria-label={isEditing ? "إلغاء التعديل" : "تعديل الملف الشخصي"}>
            {isEditing ? <Edit3 className="h-5 w-5" /> : <Edit3 className="h-5 w-5" />} 
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || "User"} />
              <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{form.watch("name") || user?.displayName || "اسم المستخدم"}</h3>
              <p className="text-sm text-muted-foreground">{form.watch("email") || user?.email}</p>
            </div>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم الكامل</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!isEditing || isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} disabled={!isEditing || isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {isEditing && (
                <>
                  <div className="pt-4 border-t mt-6">
                    <Label htmlFor="currentPassword">كلمة المرور الحالية (لتغيير كلمة المرور)</Label>
                    <Input id="currentPassword" type="password" placeholder="اتركها فارغة لعدم التغيير" disabled={isSubmitting} />
                    <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                    <Input id="newPassword" type="password" disabled={isSubmitting} />
                    <Label htmlFor="confirmNewPassword">تأكيد كلمة المرور الجديدة</Label>
                    <Input id="confirmNewPassword" type="password" disabled={isSubmitting} />
                    <p className="text-xs text-muted-foreground mt-1">ميزة تغيير كلمة المرور لم يتم ربطها بعد.</p>
                  </div>
                  <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                    <Save className="me-2 h-5 w-5" />
                    حفظ التغييرات
                  </Button>
                </>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
