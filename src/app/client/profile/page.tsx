
"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit3, Save, Loader2, ShieldAlert, Camera } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { updateProfile, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";
import { auth, storage } from "@/lib/firebase"; 
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"; 
import { logActivity } from "@/lib/activityLogger";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const updateProfileSchema = z.object({
  name: z.string().min(2, { message: "الاسم يجب أن لا يقل عن حرفين" }),
  email: z.string().email({ message: "البريد الإلكتروني غير صالح" }),
  profileImage: z
    .custom<FileList>()
    .optional()
    .refine(
      (files) => (!files || files.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE),
      `حجم الصورة يجب أن لا يتجاوز ${MAX_FILE_SIZE / 1024 / 1024} ميجا بايت.`
    )
    .refine(
      (files) => (!files || files.length === 0 || ALLOWED_IMAGE_TYPES.includes(files?.[0]?.type)),
      "نوع الصورة غير مدعوم. الأنواع المسموح بها: JPG, PNG, GIF, WEBP."
    ),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmNewPassword: z.string().optional(),
}).refine(data => {
  if (data.newPassword && (!data.currentPassword)) {
    return false;
  }
  return true;
}, {
  message: "كلمة المرور الحالية مطلوبة لتغيير كلمة المرور.",
  path: ["currentPassword"],
}).refine(data => {
  if (data.newPassword && data.newPassword.length < 6) {
    return false;
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
  const { user, loading: authLoading, setUser: setAuthUser } = useAuth(); 
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: "",
      email: "",
      profileImage: undefined,
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const { formState: {isSubmitting}, reset, control, handleSubmit, watch } = form;

  useEffect(() => {
    if (user) {
      reset({ 
        name: user.displayName || "", 
        email: user.email || "",
        profileImage: undefined,
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      setImagePreview(user.photoURL || null);
    }
  }, [user, reset]);

  const getInitials = (name?: string | null) => {
    if (!name) return "SM"; // Consistent fallback
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const handleEditToggle = () => {
    if (isEditing) {
      if (user) { 
        reset({ 
          name: user.displayName || "", 
          email: user.email || "",
          profileImage: undefined,
          currentPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        });
        setImagePreview(user.photoURL || null);
        if (fileInputRef.current) {
          fileInputRef.current.value = ""; // Clear file input on cancel
        }
      }
    }
    setIsEditing(!isEditing);
  };

  const handleProfileImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Validate file size and type here *before* setting preview
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: "خطأ في الملف", description: `حجم الصورة يجب أن لا يتجاوز ${MAX_FILE_SIZE / 1024 / 1024} ميجا بايت.`, variant: "destructive" });
        setImagePreview(user?.photoURL || null); // Revert to original
        if (fileInputRef.current) fileInputRef.current.value = ""; // Clear input
        form.setValue("profileImage", undefined); // Clear from form state
        return;
      }
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast({ title: "خطأ في الملف", description: "نوع الصورة غير مدعوم. الأنواع المسموح بها: JPG, PNG, GIF, WEBP.", variant: "destructive" });
        setImagePreview(user?.photoURL || null); // Revert to original
        if (fileInputRef.current) fileInputRef.current.value = ""; // Clear input
        form.setValue("profileImage", undefined); // Clear from form state
        return;
      }
      // File is valid, proceed with preview and form update
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      form.setValue("profileImage", files); // Update React Hook Form state
    } else {
      // No file selected or selection cleared
      setImagePreview(user?.photoURL || null);
      form.setValue("profileImage", undefined);
    }
  };


  const onSubmit = async (data: UpdateProfileFormValues) => {
    if (!auth.currentUser) {
      toast({ title: "خطأ", description: "المستخدم غير مسجل الدخول.", variant: "destructive" });
      return;
    }

    let nameUpdated = false;
    let passwordChanged = false;
    let profileImageUpdated = false;

    if (data.name !== auth.currentUser.displayName) {
      try {
        await updateProfile(auth.currentUser, { displayName: data.name });
        nameUpdated = true;
         await logActivity({
            actionType: "CLIENT_PROFILE_INFO_UPDATED",
            description: `Client ${auth.currentUser.displayName || auth.currentUser.email} updated their display name to: ${data.name}.`,
            actor: { id: auth.currentUser.uid, role: "client", name: data.name }, 
            target: { id: auth.currentUser.uid, type: "userProfile" },
            details: { oldName: auth.currentUser.displayName, newName: data.name }
          });
      } catch (error: any) {
        toast({ title: "خطأ في تحديث الاسم", description: error.message || "لم نتمكن من حفظ اسمك.", variant: "destructive" });
        return; 
      }
    }
    
    const imageFile = data.profileImage?.[0];
    if (imageFile) {
      setIsUploadingImage(true);
      try {
        const fileExtension = imageFile.name.split('.').pop();
        const imagePath = `profile-pictures/${auth.currentUser.uid}/profile.${fileExtension}`;
        const storageRefInstance = ref(storage, imagePath);
        
        toast({ title: "جارٍ رفع الصورة...", description: "قد يستغرق هذا بعض الوقت."});
        const uploadTask = uploadBytesResumable(storageRefInstance, imageFile);
        
        await new Promise<void>((resolve, reject) => {
          uploadTask.on('state_changed', 
            null, 
            (error) => {
              console.error("Upload failed:", error);
              reject(error);
            }, 
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              await updateProfile(auth.currentUser!, { photoURL: downloadURL });
              profileImageUpdated = true;
              setImagePreview(downloadURL); // Update preview with final URL
              await logActivity({
                actionType: "CLIENT_PROFILE_PICTURE_UPDATED",
                description: `Client ${auth.currentUser?.displayName || auth.currentUser?.email} updated their profile picture.`,
                actor: { id: auth.currentUser!.uid, role: "client", name: auth.currentUser!.displayName },
                target: { id: auth.currentUser!.uid, type: "userProfile" },
              });
              resolve();
            }
          );
        });
      } catch (error: any) {
        toast({ title: "خطأ في رفع الصورة", description: error.message || "لم نتمكن من حفظ صورتك الشخصية.", variant: "destructive" });
        setIsUploadingImage(false);
        return;
      } finally {
        setIsUploadingImage(false);
      }
    }


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
        await logActivity({
            actionType: "CLIENT_PASSWORD_CHANGED",
            description: `Client ${auth.currentUser.displayName || auth.currentUser.email} changed their password.`,
            actor: { id: auth.currentUser.uid, role: "client", name: auth.currentUser.displayName },
            target: { id: auth.currentUser.uid, type: "userProfile" },
          });
      } catch (error: any) {
        let desc = "لم نتمكن من تحديث كلمة المرور.";
        if (error.code === "auth/wrong-password") {
          desc = "كلمة المرور الحالية غير صحيحة.";
        } else if (error.code === "auth/too-many-requests") {
          desc = "محاولات كثيرة خاطئة. يرجى المحاولة مرة أخرى لاحقًا.";
        }
        toast({ title: "خطأ في تغيير كلمة المرور", description: desc, variant: "destructive" });
        return;
      }
    }
    
    let successMessage = "";
    if (nameUpdated) successMessage += "تم تحديث الاسم. ";
    if (profileImageUpdated) successMessage += "تم تحديث الصورة الشخصية. ";
    if (passwordChanged) successMessage += "تم تغيير كلمة المرور. ";

    if (successMessage) {
      toast({ title: "تم التحديث بنجاح", description: successMessage.trim() });
      if (auth.currentUser && (nameUpdated || profileImageUpdated)) {
        const updatedUser = {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
            displayName: auth.currentUser.displayName,
            role: user?.role, 
            photoURL: auth.currentUser.photoURL,
        };
        setAuthUser(updatedUser as any); 
      }
    } else if (isEditing && !data.profileImage && !data.newPassword && data.name === auth.currentUser.displayName) {
      toast({ title: "لا تغييرات", description: "لم يتم إجراء أي تعديلات على ملفك الشخصي." });
    }
    
    setIsEditing(false);
    if (auth.currentUser) { 
        reset({ 
          name: auth.currentUser.displayName || "", 
          email: auth.currentUser.email || "",
          profileImage: undefined,
          currentPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = ""; // Clear file input after successful submission
        }
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
              <AvatarImage src={imagePreview || undefined} alt={user?.displayName || "User"} />
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
                      <Input {...field} disabled={!isEditing || isSubmitting || isUploadingImage} />
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
                      <Input type="email" {...field} disabled />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground mt-1">تعديل البريد الإلكتروني يتطلب إجراءات أمان إضافية وغير متاح حالياً عبر هذا النموذج.</p>
                  </FormItem>
                )}
              />
              {isEditing && (
                // Use a controlled input, but react-hook-form handles the FileList.
                // We use a ref to clear it manually if needed.
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Camera className="h-5 w-5"/>
                    تغيير الصورة الشخصية (اختياري)
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="file" 
                      accept="image/*"
                      ref={fileInputRef} // For manual clearing
                      onChange={handleProfileImageChange} // Custom handler
                      disabled={isSubmitting || isUploadingImage}
                    />
                  </FormControl>
                  <FormMessage>{form.formState.errors.profileImage?.message}</FormMessage> 
                </FormItem>
              )}
              
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
                          <Input type="password" placeholder="اتركها فارغة لعدم التغيير" {...field} disabled={isSubmitting || isUploadingImage} />
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
                          <Input type="password" placeholder="6 أحرف على الأقل" {...field} disabled={isSubmitting || isUploadingImage || !watch("currentPassword")} />
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
                          <Input type="password" placeholder="تأكيد كلمة المرور الجديدة" {...field} disabled={isSubmitting || isUploadingImage || !watchedNewPassword} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {isEditing && (
                <div className="flex justify-end pt-4">
                  <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting || isUploadingImage}>
                    {(isSubmitting || isUploadingImage) && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
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
    
