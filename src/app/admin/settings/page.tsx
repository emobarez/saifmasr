
"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Save, Bell, ShieldCheck, Palette, Loader2, Settings as SettingsIcon, Phone, Mail, MapPin, Paintbrush, Link as LinkIcon, Facebook, Twitter, Linkedin, Instagram, Sun, Moon } from "lucide-react";
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
  
  themeBackgroundLight: optionalHslString,
  themeForegroundLight: optionalHslString,
  themePrimaryLight: optionalHslString,
  themePrimaryForegroundLight: optionalHslString,
  themeAccentLight: optionalHslString,
  themeAccentForegroundLight: optionalHslString,
  themeCardLight: optionalHslString,
  themeCardForegroundLight: optionalHslString,
  themeBorderLight: optionalHslString,
  themeInputLight: optionalHslString,
  themeRingLight: optionalHslString,

  themeBackgroundDark: optionalHslString,
  themeForegroundDark: optionalHslString,
  themePrimaryDark: optionalHslString,
  themePrimaryForegroundDark: optionalHslString,
  themeAccentDark: optionalHslString,
  themeAccentForegroundDark: optionalHslString,
  themeCardDark: optionalHslString,
  themeCardForegroundDark: optionalHslString,
  themeBorderDark: optionalHslString,
  themeInputDark: optionalHslString,
  themeRingDark: optionalHslString,

  socialFacebookUrl: optionalUrl,
  socialTwitterUrl: optionalUrl,
  socialLinkedinUrl: optionalUrl,
  socialInstagramUrl: optionalUrl,
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const isValidHslForPreview = (value: string | undefined): boolean => {
  if (!value) return false;
  return hslFormatRegex.test(value.trim());
};

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const { user: adminUser } = useAuth();
  const siteSettingsHook = useSiteSettings();
  const { isLoadingSiteSettings: isFetchingSettings, ...initialSettings } = siteSettingsHook;
  
  const DEFAULT_SETTINGS_FORM: SettingsFormValues = {
    portalName: "سيف مصر الوطنية للأمن",
    adminEmail: "admin@saifmasr.com",
    maintenanceMode: false,
    companyPhone: "",
    companyAddress: "",
    publicEmail: "",

    themeBackgroundLight: "240 11% 89%",
    themeForegroundLight: "238 10% 20%",
    themePrimaryLight: "238 53% 37%",
    themePrimaryForegroundLight: "0 0% 98%",
    themeAccentLight: "191 54% 41%",
    themeAccentForegroundLight: "0 0% 98%",
    themeCardLight: "0 0% 100% / 0.85",
    themeCardForegroundLight: "238 10% 20%",
    themeBorderLight: "240 10% 80%",
    themeInputLight: "240 10% 85%",
    themeRingLight: "191 54% 41%",

    themeBackgroundDark: "238 10% 15%",
    themeForegroundDark: "0 0% 95%",
    themePrimaryDark: "238 60% 55%",
    themePrimaryForegroundDark: "0 0% 98%",
    themeAccentDark: "191 60% 50%",
    themeAccentForegroundDark: "0 0% 98%",
    themeCardDark: "238 10% 20% / 0.85",
    themeCardForegroundDark: "0 0% 95%",
    themeBorderDark: "238 10% 30%",
    themeInputDark: "238 10% 30%",
    themeRingDark: "191 60% 50%",
    
    socialFacebookUrl: "",
    socialTwitterUrl: "",
    socialLinkedinUrl: "",
    socialInstagramUrl: "",
  };

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: DEFAULT_SETTINGS_FORM,
  });
  const { handleSubmit, control, reset, formState: {isSubmitting}, watch } = form;

  const settingsDocRef = doc(db, "systemSettings", "general");
  
  useEffect(() => {
    if (!isFetchingSettings && initialSettings) {
      reset({
        portalName: initialSettings.portalName || DEFAULT_SETTINGS_FORM.portalName,
        adminEmail: initialSettings.adminEmail || DEFAULT_SETTINGS_FORM.adminEmail,
        maintenanceMode: initialSettings.maintenanceMode || DEFAULT_SETTINGS_FORM.maintenanceMode,
        companyPhone: initialSettings.companyPhone || DEFAULT_SETTINGS_FORM.companyPhone,
        companyAddress: initialSettings.companyAddress || DEFAULT_SETTINGS_FORM.companyAddress,
        publicEmail: initialSettings.publicEmail || DEFAULT_SETTINGS_FORM.publicEmail,
        
        themeBackgroundLight: initialSettings.themeBackgroundLight || DEFAULT_SETTINGS_FORM.themeBackgroundLight,
        themeForegroundLight: initialSettings.themeForegroundLight || DEFAULT_SETTINGS_FORM.themeForegroundLight,
        themePrimaryLight: initialSettings.themePrimaryLight || DEFAULT_SETTINGS_FORM.themePrimaryLight,
        themePrimaryForegroundLight: initialSettings.themePrimaryForegroundLight || DEFAULT_SETTINGS_FORM.themePrimaryForegroundLight,
        themeAccentLight: initialSettings.themeAccentLight || DEFAULT_SETTINGS_FORM.themeAccentLight,
        themeAccentForegroundLight: initialSettings.themeAccentForegroundLight || DEFAULT_SETTINGS_FORM.themeAccentForegroundLight,
        themeCardLight: initialSettings.themeCardLight || DEFAULT_SETTINGS_FORM.themeCardLight,
        themeCardForegroundLight: initialSettings.themeCardForegroundLight || DEFAULT_SETTINGS_FORM.themeCardForegroundLight,
        themeBorderLight: initialSettings.themeBorderLight || DEFAULT_SETTINGS_FORM.themeBorderLight,
        themeInputLight: initialSettings.themeInputLight || DEFAULT_SETTINGS_FORM.themeInputLight,
        themeRingLight: initialSettings.themeRingLight || DEFAULT_SETTINGS_FORM.themeRingLight,

        themeBackgroundDark: initialSettings.themeBackgroundDark || DEFAULT_SETTINGS_FORM.themeBackgroundDark,
        themeForegroundDark: initialSettings.themeForegroundDark || DEFAULT_SETTINGS_FORM.themeForegroundDark,
        themePrimaryDark: initialSettings.themePrimaryDark || DEFAULT_SETTINGS_FORM.themePrimaryDark,
        themePrimaryForegroundDark: initialSettings.themePrimaryForegroundDark || DEFAULT_SETTINGS_FORM.themePrimaryForegroundDark,
        themeAccentDark: initialSettings.themeAccentDark || DEFAULT_SETTINGS_FORM.themeAccentDark,
        themeAccentForegroundDark: initialSettings.themeAccentForegroundDark || DEFAULT_SETTINGS_FORM.themeAccentForegroundDark,
        themeCardDark: initialSettings.themeCardDark || DEFAULT_SETTINGS_FORM.themeCardDark,
        themeCardForegroundDark: initialSettings.themeCardForegroundDark || DEFAULT_SETTINGS_FORM.themeCardForegroundDark,
        themeBorderDark: initialSettings.themeBorderDark || DEFAULT_SETTINGS_FORM.themeBorderDark,
        themeInputDark: initialSettings.themeInputDark || DEFAULT_SETTINGS_FORM.themeInputDark,
        themeRingDark: initialSettings.themeRingDark || DEFAULT_SETTINGS_FORM.themeRingDark,

        socialFacebookUrl: initialSettings.socialFacebookUrl || DEFAULT_SETTINGS_FORM.socialFacebookUrl,
        socialTwitterUrl: initialSettings.socialTwitterUrl || DEFAULT_SETTINGS_FORM.socialTwitterUrl,
        socialLinkedinUrl: initialSettings.socialLinkedinUrl || DEFAULT_SETTINGS_FORM.socialLinkedinUrl,
        socialInstagramUrl: initialSettings.socialInstagramUrl || DEFAULT_SETTINGS_FORM.socialInstagramUrl,
      });
    }
  }, [isFetchingSettings, initialSettings, reset, DEFAULT_SETTINGS_FORM]);


  const handleSaveSettings = async (data: SettingsFormValues) => {
    try {
      const dataToSave = {
        ...data,
        portalName: data.portalName.trim() || DEFAULT_SETTINGS_FORM.portalName,
        adminEmail: data.adminEmail.trim() || DEFAULT_SETTINGS_FORM.adminEmail,
        companyPhone: data.companyPhone?.trim() || "",
        companyAddress: data.companyAddress?.trim() || "",
        publicEmail: data.publicEmail?.trim() || "",

        themeBackgroundLight: data.themeBackgroundLight?.trim() || DEFAULT_SETTINGS_FORM.themeBackgroundLight,
        themeForegroundLight: data.themeForegroundLight?.trim() || DEFAULT_SETTINGS_FORM.themeForegroundLight,
        themePrimaryLight: data.themePrimaryLight?.trim() || DEFAULT_SETTINGS_FORM.themePrimaryLight,
        themePrimaryForegroundLight: data.themePrimaryForegroundLight?.trim() || DEFAULT_SETTINGS_FORM.themePrimaryForegroundLight,
        themeAccentLight: data.themeAccentLight?.trim() || DEFAULT_SETTINGS_FORM.themeAccentLight,
        themeAccentForegroundLight: data.themeAccentForegroundLight?.trim() || DEFAULT_SETTINGS_FORM.themeAccentForegroundLight,
        themeCardLight: data.themeCardLight?.trim() || DEFAULT_SETTINGS_FORM.themeCardLight,
        themeCardForegroundLight: data.themeCardForegroundLight?.trim() || DEFAULT_SETTINGS_FORM.themeCardForegroundLight,
        themeBorderLight: data.themeBorderLight?.trim() || DEFAULT_SETTINGS_FORM.themeBorderLight,
        themeInputLight: data.themeInputLight?.trim() || DEFAULT_SETTINGS_FORM.themeInputLight,
        themeRingLight: data.themeRingLight?.trim() || DEFAULT_SETTINGS_FORM.themeRingLight,

        themeBackgroundDark: data.themeBackgroundDark?.trim() || DEFAULT_SETTINGS_FORM.themeBackgroundDark,
        themeForegroundDark: data.themeForegroundDark?.trim() || DEFAULT_SETTINGS_FORM.themeForegroundDark,
        themePrimaryDark: data.themePrimaryDark?.trim() || DEFAULT_SETTINGS_FORM.themePrimaryDark,
        themePrimaryForegroundDark: data.themePrimaryForegroundDark?.trim() || DEFAULT_SETTINGS_FORM.themePrimaryForegroundDark,
        themeAccentDark: data.themeAccentDark?.trim() || DEFAULT_SETTINGS_FORM.themeAccentDark,
        themeAccentForegroundDark: data.themeAccentForegroundDark?.trim() || DEFAULT_SETTINGS_FORM.themeAccentForegroundDark,
        themeCardDark: data.themeCardDark?.trim() || DEFAULT_SETTINGS_FORM.themeCardDark,
        themeCardForegroundDark: data.themeCardForegroundDark?.trim() || DEFAULT_SETTINGS_FORM.themeCardForegroundDark,
        themeBorderDark: data.themeBorderDark?.trim() || DEFAULT_SETTINGS_FORM.themeBorderDark,
        themeInputDark: data.themeInputDark?.trim() || DEFAULT_SETTINGS_FORM.themeInputDark,
        themeRingDark: data.themeRingDark?.trim() || DEFAULT_SETTINGS_FORM.themeRingDark,
        
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
          details: { portalName: dataToSave.portalName, maintenanceMode: dataToSave.maintenanceMode }, 
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

  const themeColorFields: Array<{nameBase: string, label: string, placeholder: string}> = [
    { nameBase: "themeBackground", label: "لون الخلفية", placeholder: "مثال: 240 10% 15%" },
    { nameBase: "themeForeground", label: "لون النص", placeholder: "مثال: 0 0% 98%" },
    { nameBase: "themePrimary", label: "اللون الأساسي", placeholder: "مثال: 238 60% 55%" },
    { nameBase: "themePrimaryForeground", label: "لون النص على الأساسي", placeholder: "مثال: 0 0% 98%" },
    { nameBase: "themeAccent", label: "اللون الثانوي", placeholder: "مثال: 191 60% 50%" },
    { nameBase: "themeAccentForeground", label: "لون النص على الثانوي", placeholder: "مثال: 0 0% 98%" },
    { nameBase: "themeCard", label: "لون خلفية البطاقات", placeholder: "مثال: 238 10% 20% / 0.85" },
    { nameBase: "themeCardForeground", label: "لون نص البطاقات", placeholder: "مثال: 0 0% 95%" },
    { nameBase: "themeBorder", label: "لون الحدود", placeholder: "مثال: 238 10% 30%" },
    { nameBase: "themeInput", label: "لون حقول الإدخال", placeholder: "مثال: 238 10% 30%" },
    { nameBase: "themeRing", label: "لون حلقة التركيز (Ring)", placeholder: "مثال: 191 60% 50%" },
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
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Paintbrush className="h-5 w-5" />ألوان الواجهة (HSL)</CardTitle>
                        <CardDescription>
                            اترك الحقل فارغًا لاستخدام القيمة الافتراضية من <code className="text-xs p-1 bg-muted rounded">globals.css</code>. 
                            يجب أن تكون القيم بتنسيق HSL بدون الأقواس، مثال: <code className="dir-ltr text-xs p-1 bg-muted rounded">240 10% 15%</code>.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {themeColorFields.map(item => {
                        const lightFieldName = `${item.nameBase}Light` as keyof SettingsFormValues;
                        const darkFieldName = `${item.nameBase}Dark` as keyof SettingsFormValues;
                        const lightFieldValue = watch(lightFieldName);
                        const darkFieldValue = watch(darkFieldName);

                        return (
                          <div key={item.nameBase} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 border-b pb-4 last:border-b-0 last:pb-0">
                            <h4 className="col-span-1 md:col-span-2 text-md font-medium text-muted-foreground mb-1">{item.label}</h4>
                            <FormField control={control} name={lightFieldName} render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center gap-1"><Sun className="h-4 w-4" /> الوضع الفاتح</FormLabel>
                                  <div className="flex items-center gap-2">
                                    <FormControl>
                                      <Input placeholder={item.placeholder} {...field} value={field.value || ""} disabled={isSubmitting} className="dir-ltr text-left" />
                                    </FormControl>
                                    {isValidHslForPreview(lightFieldValue) && (
                                      <div
                                        className="h-8 w-8 rounded-md border-2 border-border shadow-sm shrink-0"
                                        style={{ backgroundColor: `hsl(${lightFieldValue})` }}
                                        title={`Preview for ${lightFieldValue}`}
                                      />
                                    )}
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField control={control} name={darkFieldName} render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center gap-1"><Moon className="h-4 w-4" /> الوضع الداكن</FormLabel>
                                  <div className="flex items-center gap-2">
                                  <FormControl>
                                    <Input placeholder={item.placeholder} {...field} value={field.value || ""} disabled={isSubmitting} className="dir-ltr text-left" />
                                  </FormControl>
                                  {isValidHslForPreview(darkFieldValue) && (
                                      <div
                                        className="h-8 w-8 rounded-md border-2 border-border shadow-sm shrink-0"
                                        style={{ backgroundColor: `hsl(${darkFieldValue})` }}
                                        title={`Preview for ${darkFieldValue}`}
                                      />
                                    )}
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
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

