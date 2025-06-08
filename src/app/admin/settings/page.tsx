"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Save, Bell, ShieldCheck, Palette, Loader2, Settings as SettingsIcon, Phone, Mail, MapPin, Paintbrush, Link as LinkIcon, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";
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
import { useSiteSettings, type SiteSettings } from '@/hooks/useSiteSettings';

const hslFormatRegex = /^\s*\d{1,3}\s+\d{1,3}%\s+\d{1,3}%\s*$/;
const optionalHslString = z.string().optional().refine(
  (val) => !val || val.trim() === '' || hslFormatRegex.test(val),
  { message: "تنسيق HSL غير صالح. يجب أن يكون مثل '240 10% 15%'" }
);
const optionalUrl = z.string().url({ message: "الرابط غير صالح. تأكد من تضمين http:// أو https://" }).optional().or(z.literal(''));

const settingsSchema = z.object({
  portalName: z.string().min(3, { message: "اسم البوابة يجب أن لا يقل عن 3 أحرف." }),
  adminEmail: z.string().email({ message: "البريد الإلكتروني للمسؤول غير صالح." }),
  maintenanceMode: z.boolean(),
  companyPhone: z.string().optional(),
  companyAddress: z.string().max(250, { message: "العنوان يجب ألا يتجاوز 250 حرفًا."}).optional(),
  publicEmail: z.string().email({ message: "البريد الإلكتروني العام غير صالح." }).optional().or(z.literal('')),
  themeBackground: optionalHslString,
  themeForeground: optionalHslString,
  themePrimary: optionalHslString,
  themePrimaryForeground: optionalHslString,
  themeAccent: optionalHslString,
  themeAccentForeground: optionalHslString,
  themeCard: optionalHslString,
  themeCardForeground: optionalHslString,
  socialFacebookUrl: optionalUrl,
  socialTwitterUrl: optionalUrl,
  socialLinkedinUrl: optionalUrl,
  socialInstagramUrl: optionalUrl,
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

// Helper function to check HSL format for preview, distinct from Zod validation for submission
const isValidHslForPreview = (value: string | undefined): boolean => {
  if (!value) return false;
  return hslFormatRegex.test(value.trim());
};

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const { user: adminUser } = useAuth();
  const siteSettingsHook = useSiteSettings();
  const { isLoadingSiteSettings: isFetchingSettings, ...initialSettings } = siteSettingsHook;
  
  const DEFAULT_SETTINGS: SiteSettings = {
    portalName: "سيف مصر الوطنية للأمن",
    adminEmail: "admin@saifmasr.com",
    maintenanceMode: false,
    companyPhone: "",
    companyAddress: "",
    publicEmail: "",
    themeBackground: "240 11% 89%",
    themeForeground: "238 10% 20%",
    themePrimary: "238 53% 37%",
    themePrimaryForeground: "0 0% 98%",
    themeAccent: "191 54% 41%",
    themeAccentForeground: "0 0% 98%",
    themeCard: "0 0% 100% / 0.85",
    themeCardForeground: "238 10% 20%",
    socialFacebookUrl: "",
    socialTwitterUrl: "",
    socialLinkedinUrl: "",
    socialInstagramUrl: "",
  };

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: DEFAULT_SETTINGS,
  });
  const { handleSubmit, control, reset, formState: {isSubmitting}, watch } = form;

  const settingsDocRef = doc(db, "systemSettings", "general");
  
  useEffect(() => {
    if (!isFetchingSettings && initialSettings) {
      reset({
        portalName: initialSettings.portalName || DEFAULT_SETTINGS.portalName,
        adminEmail: initialSettings.adminEmail || DEFAULT_SETTINGS.adminEmail,
        maintenanceMode: initialSettings.maintenanceMode || DEFAULT_SETTINGS.maintenanceMode,
        companyPhone: initialSettings.companyPhone || DEFAULT_SETTINGS.companyPhone,
        companyAddress: initialSettings.companyAddress || DEFAULT_SETTINGS.companyAddress,
        publicEmail: initialSettings.publicEmail || DEFAULT_SETTINGS.publicEmail,
        themeBackground: initialSettings.themeBackground || DEFAULT_SETTINGS.themeBackground,
        themeForeground: initialSettings.themeForeground || DEFAULT_SETTINGS.themeForeground,
        themePrimary: initialSettings.themePrimary || DEFAULT_SETTINGS.themePrimary,
        themePrimaryForeground: initialSettings.themePrimaryForeground || DEFAULT_SETTINGS.themePrimaryForeground,
        themeAccent: initialSettings.themeAccent || DEFAULT_SETTINGS.themeAccent,
        themeAccentForeground: initialSettings.themeAccentForeground || DEFAULT_SETTINGS.themeAccentForeground,
        themeCard: initialSettings.themeCard || DEFAULT_SETTINGS.themeCard,
        themeCardForeground: initialSettings.themeCardForeground || DEFAULT_SETTINGS.themeCardForeground,
        socialFacebookUrl: initialSettings.socialFacebookUrl || DEFAULT_SETTINGS.socialFacebookUrl,
        socialTwitterUrl: initialSettings.socialTwitterUrl || DEFAULT_SETTINGS.socialTwitterUrl,
        socialLinkedinUrl: initialSettings.socialLinkedinUrl || DEFAULT_SETTINGS.socialLinkedinUrl,
        socialInstagramUrl: initialSettings.socialInstagramUrl || DEFAULT_SETTINGS.socialInstagramUrl,
      });
    }
  }, [isFetchingSettings, initialSettings, reset, DEFAULT_SETTINGS]);


  const handleSaveSettings = async (data: SettingsFormValues) => {
    try {
      const dataToSave = {
        ...data,
        portalName: data.portalName.trim() || DEFAULT_SETTINGS.portalName,
        adminEmail: data.adminEmail.trim() || DEFAULT_SETTINGS.adminEmail,
        companyPhone: data.companyPhone?.trim() || "",
        companyAddress: data.companyAddress?.trim() || "",
        publicEmail: data.publicEmail?.trim() || "",
        themeBackground: data.themeBackground?.trim() || DEFAULT_SETTINGS.themeBackground,
        themeForeground: data.themeForeground?.trim() || DEFAULT_SETTINGS.themeForeground,
        themePrimary: data.themePrimary?.trim() || DEFAULT_SETTINGS.themePrimary,
        themePrimaryForeground: data.themePrimaryForeground?.trim() || DEFAULT_SETTINGS.themePrimaryForeground,
        themeAccent: data.themeAccent?.trim() || DEFAULT_SETTINGS.themeAccent,
        themeAccentForeground: data.themeAccentForeground?.trim() || DEFAULT_SETTINGS.themeAccentForeground,
        themeCard: data.themeCard?.trim() || DEFAULT_SETTINGS.themeCard,
        themeCardForeground: data.themeCardForeground?.trim() || DEFAULT_SETTINGS.themeCardForeground,
        socialFacebookUrl: data.socialFacebookUrl?.trim() || "",
        socialTwitterUrl: data.socialTwitterUrl?.trim() || "",
        socialLinkedinUrl: data.socialLinkedinUrl?.trim() || "",
        socialInstagramUrl: data.socialInstagramUrl?.trim() || "",
      };

      await setDoc(settingsDocRef, dataToSave, { merge: true });
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم تحديث إعدادات النظام.",
      });
       if (adminUser) {
        await logActivity({
          actionType: "SETTINGS_UPDATED",
          description: `Admin ${adminUser.displayName || adminUser.email} updated system settings.`,
          actor: { id: adminUser.uid, role: adminUser.role || undefined, name: adminUser.displayName },
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

  const themeColorFields: Array<{name: keyof SettingsFormValues, label: string, placeholder: string}> = [
    { name: "themeBackground", label: "لون الخلفية الرئيسي", placeholder: "مثال: 240 11% 89%" },
    { name: "themeForeground", label: "لون النص الرئيسي", placeholder: "مثال: 238 10% 20%" },
    { name: "themePrimary", label: "اللون الأساسي (Primary)", placeholder: "مثال: 238 53% 37%" },
    { name: "themePrimaryForeground", label: "لون النص على الأساسي", placeholder: "مثال: 0 0% 98%" },
    { name: "themeAccent", label: "اللون الثانوي (Accent)", placeholder: "مثال: 191 54% 41%" },
    { name: "themeAccentForeground", label: "لون النص على الثانوي", placeholder: "مثال: 0 0% 98%" },
    { name: "themeCard", label: "لون خلفية البطاقات", placeholder: "مثال: 0 0% 100% / 0.85" },
    { name: "themeCardForeground", label: "لون نص البطاقات", placeholder: "مثال: 238 10% 20%" },
  ];

  const socialMediaFields: Array<{name: keyof SettingsFormValues, label: string, placeholder: string, icon: React.ElementType}> = [
    { name: "socialFacebookUrl", label: "رابط فيسبوك", placeholder: "https://facebook.com/yourpage", icon: Facebook },
    { name: "socialTwitterUrl", label: "رابط تويتر (X)", placeholder: "https://x.com/yourprofile", icon: Twitter },
    { name: "socialLinkedinUrl", label: "رابط لينكدإن", placeholder: "https://linkedin.com/company/yourcompany", icon: Linkedin },
    { name: "socialInstagramUrl", label: "رابط انستغرام", placeholder: "https://instagram.com/yourprofile", icon: Instagram },
  ];


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
          <CardDescription>إدارة الإعدادات العامة ومعلومات الاتصال وتخصيص المظهر وروابط التواصل الاجتماعي لـ سيف مصر الوطنية للأمن.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit(handleSaveSettings)} className="space-y-8">
              <Tabs defaultValue="general" className="w-full" dir="rtl">
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-6">
                  <TabsTrigger value="general" className="flex items-center gap-2">
                    <SettingsIcon className="h-5 w-5" /> عامة واتصال
                  </TabsTrigger>
                  <TabsTrigger value="appearance" className="flex items-center gap-2">
                    <Paintbrush className="h-5 w-5" /> تخصيص المظهر
                  </TabsTrigger>
                  <TabsTrigger value="notifications" disabled className="flex items-center gap-2">
                    <Bell className="h-5 w-5" /> الإشعارات
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="general" className="space-y-6">
                  <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><SettingsIcon className="h-5 w-5" />الإعدادات العامة</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                      <FormField control={control} name="portalName" render={({ field }) => (
                          <FormItem><FormLabel>اسم البوابة</FormLabel><FormControl><Input {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                        )}
                      />
                      <FormField control={control} name="adminEmail" render={({ field }) => (
                          <FormItem><FormLabel>بريد المسؤول الرئيسي</FormLabel><FormControl><Input type="email" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                        )}
                      />
                      <FormField control={control} name="maintenanceMode" render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5"><FormLabel>تفعيل وضع الصيانة</FormLabel><FormMessage /></div>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} /></FormControl>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5" />معلومات الاتصال العامة</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <FormField control={control} name="publicEmail" render={({ field }) => (
                            <FormItem><FormLabel className="flex items-center gap-1"><Mail className="h-4 w-4 text-muted-foreground" />البريد الإلكتروني العام (للتواصل)</FormLabel><FormControl><Input type="email" placeholder="contact@example.com" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                          )}
                        />
                        <FormField control={control} name="companyPhone" render={({ field }) => (
                            <FormItem><FormLabel className="flex items-center gap-1"><Phone className="h-4 w-4 text-muted-foreground" />رقم الهاتف</FormLabel><FormControl><Input placeholder="مثال: +201234567890" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                          )}
                        />
                        <FormField control={control} name="companyAddress" render={({ field }) => (
                            <FormItem><FormLabel className="flex items-center gap-1"><MapPin className="h-4 w-4 text-muted-foreground" />العنوان الفعلي</FormLabel><FormControl><Textarea placeholder="مثال: 123 شارع النصر، القاهرة، مصر" {...field} disabled={isSubmitting} rows={3} /></FormControl><FormMessage /></FormItem>
                          )}
                        />
                    </CardContent>
                  </Card>
                   <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><LinkIcon className="h-5 w-5" />روابط التواصل الاجتماعي</CardTitle><CardDescription>أدخل روابط صفحات شركتك على منصات التواصل الاجتماعي. اترك الحقل فارغًا لعدم عرض الأيقونة في الفوتر.</CardDescription></CardHeader>
                    <CardContent className="space-y-4">
                      {socialMediaFields.map(item => (
                        <FormField key={item.name} control={control} name={item.name as keyof SettingsFormValues} render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <item.icon className="h-5 w-5 text-muted-foreground" />
                              {item.label}
                            </FormLabel>
                            <FormControl>
                              <Input placeholder={item.placeholder} {...field} value={field.value || ""} disabled={isSubmitting} className="dir-ltr text-left"/>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="appearance" className="space-y-6">
                  <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Paintbrush className="h-5 w-5" />ألوان الواجهة (HSL)</CardTitle><CardDescription>اترك الحقل فارغًا لاستخدام القيمة الافتراضية. يجب أن تكون القيم بتنسيق HSL بدون الأقواس، مثال: <code className="dir-ltr text-xs p-1 bg-muted rounded">240 10% 15%</code>.</CardDescription></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      {themeColorFields.map(item => {
                        const fieldValue = watch(item.name as keyof SettingsFormValues); 
                        return (
                          <FormField key={item.name} control={control} name={item.name as keyof SettingsFormValues} render={({ field }) => (
                              <FormItem>
                                <FormLabel>{item.label}</FormLabel>
                                <div className="flex items-center gap-3">
                                  <FormControl>
                                    <Input placeholder={item.placeholder} {...field} value={field.value || ""} disabled={isSubmitting} className="dir-ltr text-left" />
                                  </FormControl>
                                  {isValidHslForPreview(fieldValue) && (
                                    <div
                                      className="h-8 w-8 rounded-md border-2 border-border shadow-sm shrink-0"
                                      style={{ backgroundColor: `hsl(${fieldValue})` }}
                                      title={`Preview for ${fieldValue}`}
                                    />
                                  )}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        );
                      })}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="notifications" className="mt-6 space-y-6">
                  <Card><CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />إعدادات الإشعارات</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">هذه الميزة غير متاحة بعد.</p></CardContent></Card>
                </TabsContent>
              </Tabs>

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
    </div>
  );
}

    
