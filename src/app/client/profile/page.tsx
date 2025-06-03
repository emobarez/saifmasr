
"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit3, Save, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";

const updateProfileSchema = z.object({
  name: z.string().min(2, { message: "الاسم يجب أن لا يقل عن حرفين" }),
  email: z.string().email({ message: "البريد الإلكتروني غير صالح" }),
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

  const { formState: {isSubmitting}, setValue, reset, control, handleSubmit } = form;

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
      if (user) { 
        reset({ name: user.displayName || "", email: user.email || "" });
      }
    }
    setIsEditing(!isEditing);
  };

  const onSubmit = async (data: UpdateProfileFormValues) => {
    if (!auth.currentUser) {
      toast({
        title: "خطأ",
        description: "المستخدم غير مسجل الدخول.",
        variant: "destructive",
      });
      return;
    }
    try {
      await updateProfile(auth.currentUser, {
        displayName: data.name,
      });
      // Note: Email update (updateEmail(auth.currentUser, data.email)) is more complex
      // and often requires re-authentication. It's omitted for this step.
      // The AuthContext's onAuthStateChanged listener should pick up the displayName change.
      toast({
        title: "تم تحديث الملف الشخصي",
        description: "تم حفظ تغييرات اسمك بنجاح.",
      });
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "خطأ في تحديث الملف الشخصي",
        description: error.message || "لم نتمكن من حفظ التغييرات. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={control}
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
                control={control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} disabled={!isEditing || isSubmitting} 
                             aria-describedby="email-update-info" />
                    </FormControl>
                    <FormMessage />
                     {!isEditing && <p id="email-update-info" className="text-xs text-muted-foreground mt-1">تعديل البريد الإلكتروني غير متاح حالياً عبر هذا النموذج.</p>}
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
