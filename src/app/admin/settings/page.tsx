
"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Save, Bell, ShieldCheck, Palette, Loader2, Settings as SettingsIcon, Phone, Mail, MapPin, Paintbrush, Link as LinkIcon, Facebook, Twitter, Linkedin, Instagram, Sun, Moon, Sidebar } from "lucide-react";
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
import { useSiteSettings, type SiteSettings, DEFAULT_SETTINGS } from '@/hooks/useSiteSettings';

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
  themePopoverLight: optionalHslString,
  themePopoverForegroundLight: optionalHslString,
  themeSecondaryLight: optionalHslString,
  themeSecondaryForegroundLight: optionalHslString,
  themeMutedLight: optionalHslString,
  themeMutedForegroundLight: optionalHslString,
  themeBorderLight: optionalHslString,
  themeInputLight: optionalHslString,
  themeRingLight: optionalHslString,
  themeDestructiveLight: optionalHslString,
  themeDestructiveForegroundLight: optionalHslString,

  themeBackgroundDark: optionalHslString,
  themeForegroundDark: optionalHslString,
  themePrimaryDark: optionalHslString,
  themePrimaryForegroundDark: optionalHslString,
  themeAccentDark: optionalHslString,
  themeAccentForegroundDark: optionalHslString,
  themeCardDark: optionalHslString,
  themeCardForegroundDark: optionalHslString,
  themePopoverDark: optionalHslString,
  themePopoverForegroundDark: optionalHslString,
  themeSecondaryDark: optionalHslString,
  themeSecondaryForegroundDark: optionalHslString,
  themeMutedDark: optionalHslString,
  themeMutedForegroundDark: optionalHslString,
  themeBorderDark: optionalHslString,
  themeInputDark: optionalHslString,
  themeRingDark: optionalHslString,
  themeDestructiveDark: optionalHslString,
  themeDestructiveForegroundDark: optionalHslString,

  socialFacebookUrl: optionalUrl,
  socialTwitterUrl: optionalUrl,
  socialLinkedinUrl: optionalUrl,
  socialInstagramUrl: optionalUrl,

  themeSidebarBackgroundLight: optionalHslString,
  themeSidebarForegroundLight: optionalHslString,
  themeSidebarPrimaryLight: optionalHslString,
  themeSidebarPrimaryForegroundLight: optionalHslString,
  themeSidebarAccentLight: optionalHslString,
  themeSidebarAccentForegroundLight: optionalHslString,
  themeSidebarBorderLight: optionalHslString,
  themeSidebarRingLight: optionalHslString,

  themeSidebarBackgroundDark: optionalHslString,
  themeSidebarForegroundDark: optionalHslString,
  themeSidebarPrimaryDark: optionalHslString,
  themeSidebarPrimaryForegroundDark: optionalHslString,
  themeSidebarAccentDark: optionalHslString,
  themeSidebarAccentForegroundDark: optionalHslString,
  themeSidebarBorderDark: optionalHslString,
  themeSidebarRingDark: optionalHslString,
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

// Moved outside the component for stable reference
const DEFAULT_SETTINGS_FORM_OUTSIDE_COMPONENT: SettingsFormValues = {
  portalName: DEFAULT_SETTINGS.portalName,
  adminEmail: DEFAULT_SETTINGS.adminEmail,
  maintenanceMode: DEFAULT_SETTINGS.maintenanceMode,
  companyPhone: DEFAULT_SETTINGS.companyPhone,
  companyAddress: DEFAULT_SETTINGS.companyAddress,
  publicEmail: DEFAULT_SETTINGS.publicEmail,

  themeBackgroundLight: DEFAULT_SETTINGS.themeBackgroundLight,
  themeForegroundLight: DEFAULT_SETTINGS.themeForegroundLight,
  themePrimaryLight: DEFAULT_SETTINGS.themePrimaryLight,
  themePrimaryForegroundLight: DEFAULT_SETTINGS.themePrimaryForegroundLight,
  themeAccentLight: DEFAULT_SETTINGS.themeAccentLight,
  themeAccentForegroundLight: DEFAULT_SETTINGS.themeAccentForegroundLight,
  themeCardLight: DEFAULT_SETTINGS.themeCardLight,
  themeCardForegroundLight: DEFAULT_SETTINGS.themeCardForegroundLight,
  themePopoverLight: DEFAULT_SETTINGS.themePopoverLight,
  themePopoverForegroundLight: DEFAULT_SETTINGS.themePopoverForegroundLight,
  themeSecondaryLight: DEFAULT_SETTINGS.themeSecondaryLight,
  themeSecondaryForegroundLight: DEFAULT_SETTINGS.themeSecondaryForegroundLight,
  themeMutedLight: DEFAULT_SETTINGS.themeMutedLight,
  themeMutedForegroundLight: DEFAULT_SETTINGS.themeMutedForegroundLight,
  themeBorderLight: DEFAULT_SETTINGS.themeBorderLight,
  themeInputLight: DEFAULT_SETTINGS.themeInputLight,
  themeRingLight: DEFAULT_SETTINGS.themeRingLight,
  themeDestructiveLight: DEFAULT_SETTINGS.themeDestructiveLight,
  themeDestructiveForegroundLight: DEFAULT_SETTINGS.themeDestructiveForegroundLight,

  themeBackgroundDark: DEFAULT_SETTINGS.themeBackgroundDark,
  themeForegroundDark: DEFAULT_SETTINGS.themeForegroundDark,
  themePrimaryDark: DEFAULT_SETTINGS.themePrimaryDark,
  themePrimaryForegroundDark: DEFAULT_SETTINGS.themePrimaryForegroundDark,
  themeAccentDark: DEFAULT_SETTINGS.themeAccentDark,
  themeAccentForegroundDark: DEFAULT_SETTINGS.themeAccentForegroundDark,
  themeCardDark: DEFAULT_SETTINGS.themeCardDark,
  themeCardForegroundDark: DEFAULT_SETTINGS.themeCardForegroundDark,
  themePopoverDark: DEFAULT_SETTINGS.themePopoverDark,
  themePopoverForegroundDark: DEFAULT_SETTINGS.themePopoverForegroundDark,
  themeSecondaryDark: DEFAULT_SETTINGS.themeSecondaryDark,
  themeSecondaryForegroundDark: DEFAULT_SETTINGS.themeSecondaryForegroundDark,
  themeMutedDark: DEFAULT_SETTINGS.themeMutedDark,
  themeMutedForegroundDark: DEFAULT_SETTINGS.themeMutedForegroundDark,
  themeBorderDark: DEFAULT_SETTINGS.themeBorderDark,
  themeInputDark: DEFAULT_SETTINGS.themeInputDark,
  themeRingDark: DEFAULT_SETTINGS.themeRingDark,
  themeDestructiveDark: DEFAULT_SETTINGS.themeDestructiveDark,
  themeDestructiveForegroundDark: DEFAULT_SETTINGS.themeDestructiveForegroundDark,
  
  socialFacebookUrl: DEFAULT_SETTINGS.socialFacebookUrl,
  socialTwitterUrl: DEFAULT_SETTINGS.socialTwitterUrl,
  socialLinkedinUrl: DEFAULT_SETTINGS.socialLinkedinUrl,
  socialInstagramUrl: DEFAULT_SETTINGS.socialInstagramUrl,

  themeSidebarBackgroundLight: DEFAULT_SETTINGS.themeSidebarBackgroundLight,
  themeSidebarForegroundLight: DEFAULT_SETTINGS.themeSidebarForegroundLight,
  themeSidebarPrimaryLight: DEFAULT_SETTINGS.themeSidebarPrimaryLight,
  themeSidebarPrimaryForegroundLight: DEFAULT_SETTINGS.themeSidebarPrimaryForegroundLight,
  themeSidebarAccentLight: DEFAULT_SETTINGS.themeSidebarAccentLight,
  themeSidebarAccentForegroundLight: DEFAULT_SETTINGS.themeSidebarAccentForegroundLight,
  themeSidebarBorderLight: DEFAULT_SETTINGS.themeSidebarBorderLight,
  themeSidebarRingLight: DEFAULT_SETTINGS.themeSidebarRingLight,

  themeSidebarBackgroundDark: DEFAULT_SETTINGS.themeSidebarBackgroundDark,
  themeSidebarForegroundDark: DEFAULT_SETTINGS.themeSidebarForegroundDark,
  themeSidebarPrimaryDark: DEFAULT_SETTINGS.themeSidebarPrimaryDark,
  themeSidebarPrimaryForegroundDark: DEFAULT_SETTINGS.themeSidebarPrimaryForegroundDark,
  themeSidebarAccentDark: DEFAULT_SETTINGS.themeSidebarAccentDark,
  themeSidebarAccentForegroundDark: DEFAULT_SETTINGS.themeSidebarAccentForegroundDark,
  themeSidebarBorderDark: DEFAULT_SETTINGS.themeSidebarBorderDark,
  themeSidebarRingDark: DEFAULT_SETTINGS.themeSidebarRingDark,
};


// Helper function for HSL preview
const isValidHslForPreview = (value: string | undefined): boolean => {
  if (!value) return false;
  return hslFormatRegex.test(value.trim());
};

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const { user: adminUser } = useAuth();
  
  const siteSettingsDataFromHook = useSiteSettings(); 

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: DEFAULT_SETTINGS_FORM_OUTSIDE_COMPONENT, 
  });
  const { handleSubmit, control, reset, formState: {isSubmitting}, watch } = form;

  const settingsDocRef = doc(db, "systemSettings", "general");
  
  useEffect(() => {
    if (!siteSettingsDataFromHook.isLoadingSiteSettings && siteSettingsDataFromHook.portalName !== undefined) {
      const { isLoadingSiteSettings: _, ...loadedSettings } = siteSettingsDataFromHook;
      reset({
        ...DEFAULT_SETTINGS_FORM_OUTSIDE_COMPONENT, 
        ...loadedSettings,       
        maintenanceMode: loadedSettings.maintenanceMode === undefined ? DEFAULT_SETTINGS_FORM_OUTSIDE_COMPONENT.maintenanceMode : loadedSettings.maintenanceMode,
      });
    }
  }, [siteSettingsDataFromHook, reset]);


  const handleSaveSettings = async (data: SettingsFormValues) => {
    try {
      const dataToSave: SiteSettings = {
        portalName: data.portalName.trim() || DEFAULT_SETTINGS.portalName,
        adminEmail: data.adminEmail.trim() || DEFAULT_SETTINGS.adminEmail,
        maintenanceMode: data.maintenanceMode === undefined ? DEFAULT_SETTINGS.maintenanceMode : data.maintenanceMode,
        companyPhone: data.companyPhone?.trim() || DEFAULT_SETTINGS.companyPhone,
        companyAddress: data.companyAddress?.trim() || DEFAULT_SETTINGS.companyAddress,
        publicEmail: data.publicEmail?.trim() || DEFAULT_SETTINGS.publicEmail,
        
        themeBackgroundLight: data.themeBackgroundLight?.trim() || DEFAULT_SETTINGS.themeBackgroundLight,
        themeForegroundLight: data.themeForegroundLight?.trim() || DEFAULT_SETTINGS.themeForegroundLight,
        themePrimaryLight: data.themePrimaryLight?.trim() || DEFAULT_SETTINGS.themePrimaryLight,
        themePrimaryForegroundLight: data.themePrimaryForegroundLight?.trim() || DEFAULT_SETTINGS.themePrimaryForegroundLight,
        themeAccentLight: data.themeAccentLight?.trim() || DEFAULT_SETTINGS.themeAccentLight,
        themeAccentForegroundLight: data.themeAccentForegroundLight?.trim() || DEFAULT_SETTINGS.themeAccentForegroundLight,
        themeCardLight: data.themeCardLight?.trim() || DEFAULT_SETTINGS.themeCardLight,
        themeCardForegroundLight: data.themeCardForegroundLight?.trim() || DEFAULT_SETTINGS.themeCardForegroundLight,
        themePopoverLight: data.themePopoverLight?.trim() || DEFAULT_SETTINGS.themePopoverLight,
        themePopoverForegroundLight: data.themePopoverForegroundLight?.trim() || DEFAULT_SETTINGS.themePopoverForegroundLight,
        themeSecondaryLight: data.themeSecondaryLight?.trim() || DEFAULT_SETTINGS.themeSecondaryLight,
        themeSecondaryForegroundLight: data.themeSecondaryForegroundLight?.trim() || DEFAULT_SETTINGS.themeSecondaryForegroundLight,
        themeMutedLight: data.themeMutedLight?.trim() || DEFAULT_SETTINGS.themeMutedLight,
        themeMutedForegroundLight: data.themeMutedForegroundLight?.trim() || DEFAULT_SETTINGS.themeMutedForegroundLight,
        themeBorderLight: data.themeBorderLight?.trim() || DEFAULT_SETTINGS.themeBorderLight,
        themeInputLight: data.themeInputLight?.trim() || DEFAULT_SETTINGS.themeInputLight,
        themeRingLight: data.themeRingLight?.trim() || DEFAULT_SETTINGS.themeRingLight,
        themeDestructiveLight: data.themeDestructiveLight?.trim() || DEFAULT_SETTINGS.themeDestructiveLight,
        themeDestructiveForegroundLight: data.themeDestructiveForegroundLight?.trim() || DEFAULT_SETTINGS.themeDestructiveForegroundLight,

        themeBackgroundDark: data.themeBackgroundDark?.trim() || DEFAULT_SETTINGS.themeBackgroundDark,
        themeForegroundDark: data.themeForegroundDark?.trim() || DEFAULT_SETTINGS.themeForegroundDark,
        themePrimaryDark: data.themePrimaryDark?.trim() || DEFAULT_SETTINGS.themePrimaryDark,
        themePrimaryForegroundDark: data.themePrimaryForegroundDark?.trim() || DEFAULT_SETTINGS.themePrimaryForegroundDark,
        themeAccentDark: data.themeAccentDark?.trim() || DEFAULT_SETTINGS.themeAccentDark,
        themeAccentForegroundDark: data.themeAccentForegroundDark?.trim() || DEFAULT_SETTINGS.themeAccentForegroundDark,
        themeCardDark: data.themeCardDark?.trim() || DEFAULT_SETTINGS.themeCardDark,
        themeCardForegroundDark: data.themeCardForegroundDark?.trim() || DEFAULT_SETTINGS.themeCardForegroundDark,
        themePopoverDark: data.themePopoverDark?.trim() || DEFAULT_SETTINGS.themePopoverDark,
        themePopoverForegroundDark: data.themePopoverForegroundDark?.trim() || DEFAULT_SETTINGS.themePopoverForegroundDark,
        themeSecondaryDark: data.themeSecondaryDark?.trim() || DEFAULT_SETTINGS.themeSecondaryDark,
        themeSecondaryForegroundDark: data.themeSecondaryForegroundDark?.trim() || DEFAULT_SETTINGS.themeSecondaryForegroundDark,
        themeMutedDark: data.themeMutedDark?.trim() || DEFAULT_SETTINGS.themeMutedDark,
        themeMutedForegroundDark: data.themeMutedForegroundDark?.trim() || DEFAULT_SETTINGS.themeMutedForegroundDark,
        themeBorderDark: data.themeBorderDark?.trim() || DEFAULT_SETTINGS.themeBorderDark,
        themeInputDark: data.themeInputDark?.trim() || DEFAULT_SETTINGS.themeInputDark,
        themeRingDark: data.themeRingDark?.trim() || DEFAULT_SETTINGS.themeRingDark,
        themeDestructiveDark: data.themeDestructiveDark?.trim() || DEFAULT_SETTINGS.themeDestructiveDark,
        themeDestructiveForegroundDark: data.themeDestructiveForegroundDark?.trim() || DEFAULT_SETTINGS.themeDestructiveForegroundDark,
        
        socialFacebookUrl: data.socialFacebookUrl?.trim() || DEFAULT_SETTINGS.socialFacebookUrl,
        socialTwitterUrl: data.socialTwitterUrl?.trim() || DEFAULT_SETTINGS.socialTwitterUrl,
        socialLinkedinUrl: data.socialLinkedinUrl?.trim() || DEFAULT_SETTINGS.socialLinkedinUrl,
        socialInstagramUrl: data.socialInstagramUrl?.trim() || DEFAULT_SETTINGS.socialInstagramUrl,

        themeSidebarBackgroundLight: data.themeSidebarBackgroundLight?.trim() || DEFAULT_SETTINGS.themeSidebarBackgroundLight,
        themeSidebarForegroundLight: data.themeSidebarForegroundLight?.trim() || DEFAULT_SETTINGS.themeSidebarForegroundLight,
        themeSidebarPrimaryLight: data.themeSidebarPrimaryLight?.trim() || DEFAULT_SETTINGS.themeSidebarPrimaryLight,
        themeSidebarPrimaryForegroundLight: data.themeSidebarPrimaryForegroundLight?.trim() || DEFAULT_SETTINGS.themeSidebarPrimaryForegroundLight,
        themeSidebarAccentLight: data.themeSidebarAccentLight?.trim() || DEFAULT_SETTINGS.themeSidebarAccentLight,
        themeSidebarAccentForegroundLight: data.themeSidebarAccentForegroundLight?.trim() || DEFAULT_SETTINGS.themeSidebarAccentForegroundLight,
        themeSidebarBorderLight: data.themeSidebarBorderLight?.trim() || DEFAULT_SETTINGS.themeSidebarBorderLight,
        themeSidebarRingLight: data.themeSidebarRingLight?.trim() || DEFAULT_SETTINGS.themeSidebarRingLight,

        themeSidebarBackgroundDark: data.themeSidebarBackgroundDark?.trim() || DEFAULT_SETTINGS.themeSidebarBackgroundDark,
        themeSidebarForegroundDark: data.themeSidebarForegroundDark?.trim() || DEFAULT_SETTINGS.themeSidebarForegroundDark,
        themeSidebarPrimaryDark: data.themeSidebarPrimaryDark?.trim() || DEFAULT_SETTINGS.themeSidebarPrimaryDark,
        themeSidebarPrimaryForegroundDark: data.themeSidebarPrimaryForegroundDark?.trim() || DEFAULT_SETTINGS.themeSidebarPrimaryForegroundDark,
        themeSidebarAccentDark: data.themeSidebarAccentDark?.trim() || DEFAULT_SETTINGS.themeSidebarAccentDark,
        themeSidebarAccentForegroundDark: data.themeSidebarAccentForegroundDark?.trim() || DEFAULT_SETTINGS.themeSidebarAccentForegroundDark,
        themeSidebarBorderDark: data.themeSidebarBorderDark?.trim() || DEFAULT_SETTINGS.themeSidebarBorderDark,
        themeSidebarRingDark: data.themeSidebarRingDark?.trim() || DEFAULT_SETTINGS.themeSidebarRingDark,
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

  const mainThemeColorFields: Array<{nameBase: string, label: string, placeholder: string}> = [
    { nameBase: "themeBackground", label: "لون الخلفية", placeholder: "مثال: 240 10% 15%" },
    { nameBase: "themeForeground", label: "لون النص", placeholder: "مثال: 0 0% 98%" },
    { nameBase: "themePrimary", label: "اللون الأساسي", placeholder: "مثال: 238 60% 55%" },
    { nameBase: "themePrimaryForeground", label: "لون النص على الأساسي", placeholder: "مثال: 0 0% 98%" },
    { nameBase: "themeAccent", label: "اللون الثانوي/المميز", placeholder: "مثال: 191 60% 50%" },
    { nameBase: "themeAccentForeground", label: "لون النص على الثانوي", placeholder: "مثال: 0 0% 98%" },
    { nameBase: "themeCard", label: "لون خلفية البطاقات", placeholder: "مثال: 238 10% 20% / 0.85" },
    { nameBase: "themeCardForeground", label: "لون نص البطاقات", placeholder: "مثال: 0 0% 95%" },
    { nameBase: "themePopover", label: "لون خلفية العناصر المنبثقة", placeholder: "مثال: 238 10% 20% / 0.85" },
    { nameBase: "themePopoverForeground", label: "لون نص العناصر المنبثقة", placeholder: "مثال: 0 0% 95%" },
    { nameBase: "themeSecondary", label: "اللون الفرعي (للخلفيات الثانوية)", placeholder: "مثال: 240 10% 94%" },
    { nameBase: "themeSecondaryForeground", label: "لون النص على الفرعي", placeholder: "مثال: 238 10% 25%" },
    { nameBase: "themeMuted", label: "اللون الخافت (للخلفيات المحايدة)", placeholder: "مثال: 240 10% 75%" },
    { nameBase: "themeMutedForeground", label: "لون النص الخافت", placeholder: "مثال: 240 10% 45%" },
    { nameBase: "themeBorder", label: "لون الحدود", placeholder: "مثال: 238 10% 30%" },
    { nameBase: "themeInput", label: "لون حقول الإدخال", placeholder: "مثال: 238 10% 30%" },
    { nameBase: "themeRing", label: "لون حلقة التركيز (Ring)", placeholder: "مثال: 191 60% 50%" },
    { nameBase: "themeDestructive", label: "لون التنبيهات (خطأ/حذف)", placeholder: "0 84.2% 60.2%" },
    { nameBase: "themeDestructiveForeground", label: "لون نص التنبيهات", placeholder: "0 0% 98%" },
  ];

  const sidebarThemeColorFields: Array<{nameBase: string, label: string, placeholder: string}> = [
    { nameBase: "themeSidebarBackground", label: "خلفية الشريط الجانبي", placeholder: "مثال: 238 40% 96% / 0.9" },
    { nameBase: "themeSidebarForeground", label: "نص الشريط الجانبي", placeholder: "مثال: 238 15% 30%" },
    { nameBase: "themeSidebarPrimary", label: "أساسي الشريط الجانبي (للنشط)", placeholder: "مثال: 238 52% 38%" },
    { nameBase: "themeSidebarPrimaryForeground", label: "نص أساسي الشريط الجانبي", placeholder: "مثال: 0 0% 98%" },
    { nameBase: "themeSidebarAccent", label: "مميز الشريط الجانبي (للتمرير)", placeholder: "مثال: 191 55% 41%" },
    { nameBase: "themeSidebarAccentForeground", label: "نص مميز الشريط الجانبي", placeholder: "مثال: 0 0% 98%" },
    { nameBase: "themeSidebarBorder", label: "حدود الشريط الجانبي", placeholder: "مثال: 238 20% 88%" },
    { nameBase: "themeSidebarRing", label: "حلقة تركيز الشريط الجانبي", placeholder: "مثال: 191 55% 41%" },
  ];

  const socialMediaFields: Array<{name: keyof SettingsFormValues, label: string, placeholder: string, icon: React.ElementType}> = [
    { name: "socialFacebookUrl", label: "رابط فيسبوك", placeholder: "https://facebook.com/yourpage", icon: Facebook },
    { name: "socialTwitterUrl", label: "رابط تويتر (X)", placeholder: "https://x.com/yourprofile", icon: Twitter },
    { name: "socialLinkedinUrl", label: "رابط لينكدإن", placeholder: "https://linkedin.com/company/yourcompany", icon: Linkedin },
    { name: "socialInstagramUrl", label: "رابط انستغرام", placeholder: "https://instagram.com/yourprofile", icon: Instagram },
  ];

  const renderColorFields = (fields: Array<{nameBase: string, label: string, placeholder: string}>) => {
    return fields.map(item => {
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
    });
  };


  if (siteSettingsDataFromHook.isLoadingSiteSettings) {
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
                            <FormItem><FormLabel className="flex items-center gap-1"><Mail className="h-4 w-4 text-muted-foreground" />البريد الإلكتروني العام (للتواصل)</FormLabel><FormControl><Input type="email" placeholder="contact@example.com" {...field} value={field.value || ""} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                          )}
                        />
                        <FormField control={control} name="companyPhone" render={({ field }) => (
                            <FormItem><FormLabel className="flex items-center gap-1"><Phone className="h-4 w-4 text-muted-foreground" />رقم الهاتف</FormLabel><FormControl><Input placeholder="مثال: +201234567890" {...field} value={field.value || ""} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                          )}
                        />
                        <FormField control={control} name="companyAddress" render={({ field }) => (
                            <FormItem><FormLabel className="flex items-center gap-1"><MapPin className="h-4 w-4 text-muted-foreground" />العنوان الفعلي</FormLabel><FormControl><Textarea placeholder="مثال: 123 شارع النصر، القاهرة، مصر" {...field} value={field.value || ""} disabled={isSubmitting} rows={3} /></FormControl><FormMessage /></FormItem>
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
                        <CardTitle className="flex items-center gap-2"><Paintbrush className="h-5 w-5" />ألوان الواجهة الرئيسية (HSL)</CardTitle>
                        <CardDescription>
                            اترك الحقل فارغًا لاستخدام القيمة الافتراضية. 
                            يجب أن تكون القيم بتنسيق HSL بدون الأقواس، مثال: <code className="dir-ltr text-xs p-1 bg-muted rounded">240 10% 15%</code>.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {renderColorFields(mainThemeColorFields)}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Sidebar className="h-5 w-5" />ألوان الشريط الجانبي (HSL)</CardTitle>
                        <CardDescription>
                            خصص ألوان الشريط الجانبي والقائمة المتنقلة. اترك فارغًا للقيم الافتراضية.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {renderColorFields(sidebarThemeColorFields)}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="notifications" className="mt-6 space-y-6">
                  <Card><CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />إعدادات الإشعارات</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">هذه الميزة غير متاحة بعد.</p></CardContent></Card>
                </TabsContent>
              </Tabs>

              <div className="mt-8 flex justify-end">
                <Button type="submit" disabled={isSubmitting || siteSettingsDataFromHook.isLoadingSiteSettings}>
                  {(isSubmitting || siteSettingsDataFromHook.isLoadingSiteSettings) ? <Loader2 className="me-2 h-5 w-5 animate-spin" /> : <Save className="me-2 h-5 w-5" />}
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
    

    

    

    


