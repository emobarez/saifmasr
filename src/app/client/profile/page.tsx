
"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit3, Save, Loader2, ShieldAlert, Camera } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { updateProfile, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";
import { auth, storage } from "@/lib/firebase"; // Added storage
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage"; // Added storage functions
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
  const { user, loading: authLoading, setUser: setAuthUser } = useAuth(); // Added setAuthUser
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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
    }
  }, [user, reset]);

  const getInitials = (name?: string | null) => {
    if (!name) return "CM";
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
    let profileImageUpdated = false;

    // Update Display Name
    if (data.name !== auth.currentUser.displayName) {
      try {
        await updateProfile(auth.currentUser, { displayName: data.name });
        nameUpdated = true;
      } catch (error: any) {
        toast({ title: "خطأ في تحديث الاسم", description: error.message || "لم نتمكن من حفظ اسمك.", variant: "destructive" });
        return; 
      }
    }
    
    // Update Profile Image
    const imageFile = data.profileImage?.[0];
    if (imageFile) {
      setIsUploadingImage(true);
      try {
        // Delete old image if it exists (optional, but good practice to avoid orphaned files)
        // This part is tricky because we don't store the old file path. 
        // For simplicity, we'll just overwrite or upload new. A more robust solution might store path in Firestore user profile.
        
        const fileExtension = imageFile.name.split('.').pop();
        const imagePath = `profile-pictures/${auth.currentUser.uid}/profile.${fileExtension}`;
        const storageRef = ref(storage, imagePath);
        
        toast({ title: "جارٍ رفع الصورة...", description: "قد يستغرق هذا بعض الوقت."});
        const uploadTask = uploadBytesResumable(storageRef, imageFile);
        
        await new Promise<void>((resolve, reject) => {
          uploadTask.on('state_changed', 
            null, // Can add progress indicator here if needed
            (error) => {
              console.error("Upload failed:", error);
              reject(error);
            }, 
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              await updateProfile(auth.currentUser!, { photoURL: downloadURL });
              profileImageUpdated = true;
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
        // Update user in AuthContext to reflect new displayName or photoURL
        const updatedUser = {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
            displayName: auth.currentUser.displayName,
            role: user?.role, // preserve existing role
            photoURL: auth.currentUser.photoURL, // for avatar update
        };
        setAuthUser(updatedUser as any); // Type assertion might be needed depending on User interface
         if (profileImageUpdated && adminUser) { // Log activity if image was updated
          await logActivity({
            actionType: "CLIENT_PROFILE_PICTURE_UPDATED",
            description: `Client ${auth.currentUser.displayName || auth.currentUser.email} updated their profile picture.`,
            actor: { id: auth.currentUser.uid, role: "client", name: auth.currentUser.displayName },
            target: { id: auth.currentUser.uid, type: "userProfile" },
          });
        }
      }
    } else if (isEditing) {
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
  const watchedProfileImage = watch("profileImage");
  const [imagePreview, setImagePreview] = useState<string | null>(user?.photoURL || null);

  useEffect(() => {
    if (watchedProfileImage && watchedProfileImage.length > 0) {
      const file = watchedProfileImage[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (!isEditing) {
      // When not editing or image is cleared, revert to user's current photoURL or null
      setImagePreview(user?.photoURL || null);
    }
  }, [watchedProfileImage, user, isEditing]);


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
              <AvatarImage src={imagePreview || user?.photoURL || undefined} alt={user?.displayName || "User"} />
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
                <FormField
                  control={control}
                  name="profileImage"
                  render={({ field: { onChange, value, ...restField } }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Camera className="h-5 w-5"/>
                        تغيير الصورة الشخصية (اختياري)
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => onChange(e.target.files)}
                          {...restField}
                          disabled={isSubmitting || isUploadingImage}
                        />
                      </FormControl>
                       <FormMessage />
                    </FormItem>
                  )}
                />
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
    
