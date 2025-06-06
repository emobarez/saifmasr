
"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit3, Save, Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { updateProfile, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

const updateProfileSchema = z.object({
  name: z.string().min(2, { message: "الاسم يجب أن لا يقل عن حرفين" }),
  email: z.string().email({ message: "البريد الإلكتروني غير صالح" }), // Kept for form structure, but will be read-only
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmNewPassword: z.string().optional(),
}).refine(data => {
  if (data.newPassword && (!data.currentPassword)) {
    return false; // Current password is required if new password is set
  }
  return true;
}, {
  message: "كلمة المرور الحالية مطلوبة لتغيير كلمة المرور.",
  path: ["currentPassword"],
}).refine(data => {
  if (data.newPassword && data.newPassword.length < 6) {
    return false; // New password minimum length
  }
  return true;
}, {
  message: "كلمة المرور الجديدة يجب أن لا تقل عن 6 أحرف.",
  path: ["newPassword"],
})
.refine(data => data.newPassword === data.confirmNewPassword, {
  message: "كلمتا المرور الجديدتان غير متطابقتين",
  path: ["confirmNewPassword"],
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
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const { formState: {isSubmitting, errors}, setValue, reset, control, handleSubmit, watch } = form;

  useEffect(() => {
    if (user) {
      reset({ 
        name: user.displayName || "", 
        email: user.email || "",
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    }
  }, [user, reset]);

  const getInitials = (name?: string | null) => {
    if (!name) return "CM";
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const handleEditToggle = () => {
    if (isEditing) { // If currently editing, revert to non-editing and reset form
      if (user) { 
        reset({ 
          name: user.displayName || "", 
          email: user.email || "",
          currentPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        });
      }
    }
    setIsEditing(!isEditing);
  };

  const onSubmit = async (data: UpdateProfileFormValues) => {
    if (!auth.currentUser) {
      toast({ title: "خطأ", description: "المستخدم غير مسجل الدخول.", variant: "destructive" });
      return;
    }

    let nameUpdated = false;
    let passwordChanged = false;

    // Update Display Name
    if (data.name !== user?.displayName) {
      try {
        await updateProfile(auth.currentUser, { displayName: data.name });
        nameUpdated = true;
      } catch (error: any) {
        console.error("Error updating display name:", error);
        toast({ title: "خطأ في تحديث الاسم", description: error.message || "لم نتمكن من حفظ اسمك.", variant: "destructive" });
        return; // Stop if name update fails
      }
    }

    // Change Password if newPassword is provided
    if (data.newPassword && data.currentPassword) {
      try {
        if (!auth.currentUser.email) {
          toast({ title: "خطأ", description: "لا يمكن تغيير كلمة المرور بدون بريد إلكتروني مسجل.", variant: "destructive"});
          return;
        }
        const credential = EmailAuthProvider.credential(auth.currentUser.email, data.currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
        await updatePassword(auth.currentUser, data.newPassword);
        passwordChanged = true;
      } catch (error: any) {
        console.error("Error updating password:", error);
        let desc = "لم نتمكن من تحديث كلمة المرور.";
        if (error.code === "auth/wrong-password") {
          desc = "كلمة المرور الحالية غير صحيحة.";
        } else if (error.code === "auth/too-many-requests") {
          desc = "محاولات كثيرة خاطئة. يرجى المحاولة مرة أخرى لاحقًا.";
        }
        toast({ title: "خطأ في تغيير كلمة المرور", description: desc, variant: "destructive" });
        return; // Stop if password update fails
      }
    }


    if (nameUpdated && passwordChanged) {
      toast({ title: "تم التحديث بنجاح", description: "تم تحديث اسمك وكلمة المرور." });
    } else if (nameUpdated) {
      toast({ title: "تم تحديث الاسم", description: "تم حفظ تغييرات اسمك بنجاح." });
    } else if (passwordChanged) {
      toast({ title: "تم تغيير كلمة المرور", description: "تم تحديث كلمة المرور بنجاح." });
    } else if (isEditing) { // No actual changes were made but save was clicked
      toast({ title: "لا تغييرات", description: "لم يتم إجراء أي تعديلات على ملفك الشخصي." });
    }
    
    setIsEditing(false);
     if (user) { // Re-fetch user data to update the form and UI if needed (especially display name)
        reset({ 
          name: auth.currentUser.displayName || "", 
          email: auth.currentUser.email || "",
          currentPassword: "",
          newPassword: "",
          confirmNewPassword: "",
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
  
  const watchedNewPassword = watch("newPassword");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row justify-between items-start">
          <div>
            <CardTitle className="font-headline text-xl text-primary">الملف الشخصي</CardTitle>
            <CardDescription>إدارة معلومات حسابك وتفضيلاتك.</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={handleEditToggle} aria-label={isEditing ? "إلغاء التعديل" : "تعديل الملف الشخصي"}>
            <Edit3 className="h-5 w-5 text-primary" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || "User"} />
              <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{isEditing ? form.watch("name") : user?.displayName || "اسم المستخدم"}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
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
                      <Input type="email" {...field} disabled /* Email is not editable here */ />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground mt-1">تعديل البريد الإلكتروني يتطلب إجراءات أمان إضافية وغير متاح حالياً عبر هذا النموذج.</p>
                  </FormItem>
                )}
              />
              
              {isEditing && (
                <div className="pt-4 border-t mt-6 space-y-4">
                  <h3 className="text-md font-semibold text-primary flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5" />
                    تغيير كلمة المرور (اختياري)
                  </h3>
                   <FormField
                    control={control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كلمة المرور الحالية</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="اتركها فارغة لعدم التغيير" {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كلمة المرور الجديدة</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="6 أحرف على الأقل" {...field} disabled={isSubmitting || !watch("currentPassword")} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="confirmNewPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تأكيد كلمة المرور الجديدة</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="تأكيد كلمة المرور الجديدة" {...field} disabled={isSubmitting || !watchedNewPassword} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {isEditing && (
                <div className="flex justify-end pt-4">
                  <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                    <Save className="me-2 h-5 w-5" />
                    حفظ التغييرات
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

    