
"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Save, Bell, ShieldCheck, Palette, Loader2, Settings as SettingsIcon, Phone, Mail, MapPin } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/context/AuthContext";
import { logActivity } from "@/lib/activityLogger";
import { Textarea } from "@/components/ui/textarea";

const settingsSchema = z.object({
  portalName: z.string().min(3, { message: "اسم البوابة يجب أن لا يقل عن 3 أحرف." }),
  adminEmail: z.string().email({ message: "البريد الإلكتروني للمسؤول غير صالح." }),
  maintenanceMode: z.boolean(),
  companyPhone: z.string().optional(),
  companyAddress: z.string().max(250, { message: "العنوان يجب ألا يتجاوز 250 حرفًا."}).optional(),
  publicEmail: z.string().email({ message: "البريد الإلكتروني العام غير صالح." }).optional().or(z.literal('')),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const { user: adminUser } = useAuth();
  const [isFetchingSettings, setIsFetchingSettings] = useState(true); // Renamed from isLoading
  
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      portalName: "سيف مصر الوطنية للأمن",
      adminEmail: "admin@saifmasr.com",
      maintenanceMode: false,
      companyPhone: "",
      companyAddress: "",
      publicEmail: "",
    },
  });
  const { handleSubmit, control, reset, formState: {isSubmitting} } = form;

  const settingsDocRef = doc(db, "systemSettings", "general");

  useEffect(() => {
    const fetchSettings = async () => {
      setIsFetchingSettings(true);
      try {
        const docSnap = await getDoc(settingsDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Ensure all fields have fallbacks if not present in Firestore
          reset({
            portalName: data?.portalName || "سيف مصر الوطنية للأمن",
            adminEmail: data?.adminEmail || "admin@saifmasr.com",
            maintenanceMode: data?.maintenanceMode || false,
            companyPhone: data?.companyPhone || "",
            companyAddress: data?.companyAddress || "",
            publicEmail: data?.publicEmail || "",
          });
        } else {
          console.log("No settings document found, using defaults.");
          // Default values are already set in useForm via defaultValues
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast({
          title: "خطأ في تحميل الإعدادات",
          description: "لم نتمكن من تحميل الإعدادات الحالية.",
          variant: "destructive",
        });
      } finally {
        setIsFetchingSettings(false);
      }
    };
    fetchSettings();
  }, [reset, toast]);

  const handleSaveSettings = async (data: SettingsFormValues) => {
    try {
      // Filter out empty optional fields so they don't overwrite with empty strings if not intended
      const dataToSave = { ...data };
      if (dataToSave.companyPhone === "") delete dataToSave.companyPhone;
      if (dataToSave.companyAddress === "") delete dataToSave.companyAddress;
      if (dataToSave.publicEmail === "") delete dataToSave.publicEmail;


      await setDoc(settingsDocRef, dataToSave, { merge: true });
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم تحديث إعدادات النظام.",
      });
       if (adminUser) {
        await logActivity({
          actionType: "SETTINGS_UPDATED",
          description: `Admin ${adminUser.displayName || adminUser.email} updated system settings.`,
          actor: { id: adminUser.uid, role: adminUser.role, name: adminUser.displayName },
          details: dataToSave, 
        });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "خطأ في حفظ الإعدادات",
        description: "لم نتمكن من حفظ التغييرات. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  if (isFetchingSettings) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ms-2">جارٍ تحميل الإعدادات...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl text-primary">إعدادات النظام</CardTitle>
          <CardDescription>إدارة الإعدادات العامة ومعلومات الاتصال لـ سيف مصر الوطنية للأمن.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general" className="w-full" dir="rtl">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" /> عامة ومعلومات الاتصال
              </TabsTrigger>
              <TabsTrigger value="notifications" disabled className="flex items-center gap-2">
                <Bell className="h-5 w-5" /> الإشعارات
              </TabsTrigger>
              <TabsTrigger value="security" disabled className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" /> الأمان
              </TabsTrigger>
              <TabsTrigger value="appearance" disabled className="flex items-center gap-2">
                <Palette className="h-5 w-5" /> المظهر
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="mt-6 space-y-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><SettingsIcon className="h-5 w-5" />الإعدادات العامة</CardTitle></CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={handleSubmit(handleSaveSettings)} className="space-y-6">
                      <FormField
                        control={control}
                        name="portalName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>اسم البوابة</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={isSubmitting} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name="adminEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>بريد المسؤول الرئيسي</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} disabled={isSubmitting} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name="maintenanceMode"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>تفعيل وضع الصيانة</FormLabel>
                              <FormMessage />
                            </div>
                            <FormControl>
                               <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={isSubmitting}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <div className="pt-6 border-t">
                        <h3 className="text-lg font-medium mb-4 text-primary flex items-center gap-2">
                            <Phone className="h-5 w-5" />
                            معلومات الاتصال العامة
                        </h3>
                        <div className="space-y-6">
                            <FormField
                                control={control}
                                name="publicEmail"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-1"><Mail className="h-4 w-4 text-muted-foreground" />البريد الإلكتروني العام (للتواصل)</FormLabel>
                                    <FormControl>
                                    <Input type="email" placeholder="contact@example.com" {...field} disabled={isSubmitting} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={control}
                                name="companyPhone"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-1"><Phone className="h-4 w-4 text-muted-foreground" />رقم الهاتف</FormLabel>
                                    <FormControl>
                                    <Input placeholder="مثال: +201234567890" {...field} disabled={isSubmitting} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={control}
                                name="companyAddress"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-1"><MapPin className="h-4 w-4 text-muted-foreground" />العنوان الفعلي</FormLabel>
                                    <FormControl>
                                    <Textarea placeholder="مثال: 123 شارع النصر، القاهرة، مصر" {...field} disabled={isSubmitting} rows={3} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                      </div>

                      <div className="mt-8 flex justify-end">
                        <Button type="submit" disabled={isSubmitting || isFetchingSettings}>
                          {isSubmitting ? <Loader2 className="me-2 h-5 w-5 animate-spin" /> : <Save className="me-2 h-5 w-5" />}
                          حفظ الإعدادات
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Other TabsContent sections remain for structure but are not functional yet */}
            <TabsContent value="notifications" className="mt-6 space-y-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />إعدادات الإشعارات</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                   <p className="text-muted-foreground">هذه الميزة غير متاحة بعد.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="mt-6 space-y-6">
               <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />إعدادات الأمان</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">هذه الميزة غير متاحة بعد.</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="appearance" className="mt-6 space-y-6">
               <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" />إعدادات المظهر</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                   <p className="text-muted-foreground">هذه الميزة غير متاحة بعد.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
