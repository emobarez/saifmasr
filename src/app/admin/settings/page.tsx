
"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Save, Bell, ShieldCheck, Palette, Loader2, Settings as SettingsIcon, Phone, Mail, MapPin, Paintbrush, Link as LinkIcon, Facebook, Twitter, Linkedin, Instagram, Sun, Moon, Sidebar, Image as ImageIcon, Globe, RotateCcw, Edit3, Upload } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/context/AuthContext";
import { logActivity } from "@/lib/activityLogger";
import { Textarea } from "@/components/ui/textarea";
import { useSiteSettings, type SiteSettings, DEFAULT_SETTINGS } from '@/hooks/useSiteSettings';
import Image from "next/image";

// Regex to validate HSL strings like "H S% L%" (e.g., "240 10% 15%"), allowing for optional decimal points in H, S, and L.
const hslFormatRegex = /^\s*\d{1,3}(?:\.\d+)?\s+\d{1,3}(?:\.\d+)?%\s+\d{1,3}(?:\.\d+)?%\s*$/;

const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_LOGO_TYPES = ["image/jpeg", "image/png", "image/svg+xml"];

const isValidHslForPreview = (value: string | undefined): boolean => {
  if (!value) return false;
  return hslFormatRegex.test(value.trim());
};

function parseHslString(hslStr?: string | null): { h: number; s: number; l: number } | null {
  if (!hslStr || typeof hslStr !== 'string') return null;
  const match = hslStr.match(/(\d{1,3}(?:\.\d+)?)\s+(\d{1,3}(?:\.\d+)?%)\s+(\d{1,3}(?:\.\d+)?%)/);
  if (match) {
    return { 
      h: parseFloat(match[1]), 
      s: parseFloat(match[2].replace('%','')), 
      l: parseFloat(match[3].replace('%','')) 
    };
  }
  return null;
}

function formatHslString(h: number, s: number, l: number): string {
  return `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [
    Math.round(255 * f(0)),
    Math.round(255 * f(8)),
    Math.round(255 * f(4)),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}
// End Color Conversion Utilities

const optionalHslString = z.string().optional().refine(
  (val) => !val || val.trim() === '' || hslFormatRegex.test(val),
  { message: "تنسيق HSL غير صالح. يجب أن يكون مثل '240 10% 15%' ويمكن أن يحتوي على أرقام عشرية." }
);
const optionalUrl = z.string().url({ message: "الرابط غير صالح. تأكد من تضمين http:// أو https://" }).optional().or(z.literal(''));

const settingsSchema = z.object({
  portalName: z.string().min(3, { message: "اسم البوابة يجب أن لا يقل عن 3 أحرف." }),
  adminEmail: z.string().email({ message: "البريد الإلكتروني للمسؤول غير صالح." }),
  maintenanceMode: z.boolean(),
  companyPhone: z.string().optional(),
  companyAddress: z.string().max(250, { message: "العنوان يجب ألا يتجاوز 250 حرفًا."}).optional(),
  publicEmail: z.string().email({ message: "البريد الإلكتروني العام غير صالح." }).optional().or(z.literal('')),
  logoFile: z.custom<FileList>().optional()
    .refine(
      (files) => !files || files.length === 0 || (files[0]?.size ?? 0) <= MAX_LOGO_SIZE,
      `حجم الشعار يجب أن لا يتجاوز ${MAX_LOGO_SIZE / 1024 / 1024} ميجا بايت.`
    ).refine(
      (files) => !files || files.length === 0 || ALLOWED_LOGO_TYPES.includes(files[0]?.type),
      "نوع الشعار غير مدعوم. الأنواع المسموح بها: JPG, PNG, SVG."
    ),
  
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


// Sub-component for the HTML color picker itself
const HtmlColorPicker = ({ formFieldName, watch, setValue, disabled }: {
  formFieldName: keyof SettingsFormValues;
  watch: (name: keyof SettingsFormValues) => string | undefined;
  setValue: (name: keyof SettingsFormValues, value: string, options?: { shouldValidate?: boolean; shouldDirty?: boolean }) => void;
  disabled?: boolean;
}) => {
  const hslValueFromForm = watch(formFieldName) || "";

  const [pickerHex, setPickerHex] = useState(() => {
    const hslParts = parseHslString(hslValueFromForm);
    if (hslParts) {
      const [r, g, b] = hslToRgb(hslParts.h, hslParts.s, hslParts.l);
      return rgbToHex(r, g, b);
    }
    const defaultHslForField = DEFAULT_SETTINGS[formFieldName as keyof SiteSettings] as string | undefined;
    const defaultHslParts = parseHslString(defaultHslForField || "0 0% 0%");
    if (defaultHslParts) {
        const [r,g,b] = hslToRgb(defaultHslParts.h, defaultHslParts.s, defaultHslParts.l);
        return rgbToHex(r,g,b);
    }
    return '#000000';
  });

  useEffect(() => {
    const hslParts = parseHslString(hslValueFromForm);
    let newHex = pickerHex; 

    if (hslParts) {
      const [r, g, b] = hslToRgb(hslParts.h, hslParts.s, hslParts.l);
      newHex = rgbToHex(r, g, b);
    } else if (hslValueFromForm === "") { 
        const defaultHslForField = DEFAULT_SETTINGS[formFieldName as keyof SiteSettings] as string | undefined;
        const defaultHslParts = parseHslString(defaultHslForField || "0 0% 0%");
        if (defaultHslParts) {
            const [r,g,b] = hslToRgb(defaultHslParts.h, defaultHslParts.s, defaultHslParts.l);
            newHex = rgbToHex(r,g,b);
        } else {
            newHex = '#FFFFFF'; 
        }
    }
    if (newHex.toUpperCase() !== pickerHex.toUpperCase()) {
      setPickerHex(newHex);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hslValueFromForm, formFieldName, pickerHex]);


  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newHex = event.target.value;
    setPickerHex(newHex);
    const rgb = hexToRgb(newHex);
    if (rgb) {
      const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
      setValue(formFieldName, formatHslString(h, s, l), { shouldValidate: true, shouldDirty: true });
    }
  };

  return (
    <input
      type="color"
      value={pickerHex}
      onChange={handleColorChange}
      disabled={disabled}
      className="h-10 w-10 p-1 border rounded-md cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 shrink-0"
    />
  );
};

// Helper to check if a string is a valid, constructible URL for image preview
const isPreviewableUrl = (url: string | undefined | null): url is string => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return false;
  }
  try {
    new URL(url.trim()); // Attempt to construct URL
    return true;
  } catch (e) {
    return false;
  }
};


export default function AdminSettingsPage() {
  const { toast } = useToast();
  const { user: adminUser } = useAuth();
  
  const siteSettingsDataFromHook = useSiteSettings(); 

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: DEFAULT_SETTINGS, 
  });
  const { handleSubmit, control, reset, formState: {isSubmitting, errors}, watch, setValue } = form;

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);

  const settingsDocRef = doc(db, "systemSettings", "general");
  
  useEffect(() => {
    const { isLoadingSiteSettings: isFetchingSettings, ...loadedSettings } = siteSettingsDataFromHook;

    if (!isFetchingSettings && loadedSettings.portalName !== undefined) { 
      reset({
        ...DEFAULT_SETTINGS, 
        ...loadedSettings,       
        maintenanceMode: loadedSettings.maintenanceMode === undefined ? DEFAULT_SETTINGS.maintenanceMode : loadedSettings.maintenanceMode,
        logoFile: undefined,
      });
      setLogoPreview(loadedSettings.logoUrl || null);
    }
  }, [siteSettingsDataFromHook, reset]);

  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.size > MAX_LOGO_SIZE) {
        form.setError("logoFile", { type: "manual", message: `حجم الشعار يجب أن لا يتجاوز ${MAX_LOGO_SIZE / 1024 / 1024} ميجا بايت.` });
        return;
      }
      if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
        form.setError("logoFile", { type: "manual", message: "نوع الشعار غير مدعوم. الأنواع المسموح بها: JPG, PNG, SVG." });
        return;
      }
      form.clearErrors("logoFile");
      setLogoPreview(URL.createObjectURL(file));
      setValue("logoFile", files, { shouldValidate: true, shouldDirty: true });
    }
  };

  const uploadSystemFile = async (file: File, path: 'logo' | 'favicon'): Promise<string> => {
    if (!storage) throw new Error("خدمة تخزين الملفات غير متاحة حالياً.");
    const fileExtension = file.name.split('.').pop();
    const storagePath = `system/${path}/${path}.${fileExtension}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
        null,
        (error) => reject(error),
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  const handleSaveSettings = async (data: SettingsFormValues) => {
    const { logoFile, ...settingsData } = data;
    // Get the current logoUrl from state, to preserve it if no new file is uploaded
    let finalLogoUrl = siteSettingsDataFromHook.logoUrl || "";

    if (logoFile?.[0]) {
      setIsUploadingLogo(true);
      try {
        const downloadURL = await uploadSystemFile(logoFile[0], 'logo');
        finalLogoUrl = downloadURL; // Update with the new URL
        toast({ title: "تم رفع الشعار بنجاح" });
      } catch (error: any) {
        toast({ title: "خطأ في رفع الشعار", description: error.message, variant: "destructive" });
        setIsUploadingLogo(false);
        return; // Stop execution on upload failure
      } finally {
        setIsUploadingLogo(false);
      }
    }
    
    try {
      // Combine the existing non-form settings with the new form data and the final logo URL.
      const updatedSettings: Partial<SiteSettings> = {
        ...siteSettingsDataFromHook,
        ...settingsData,
        logoUrl: finalLogoUrl,
      };

      // Clean up properties that shouldn't be saved to Firestore.
      delete (updatedSettings as any).isLoadingSiteSettings;
      
      await setDoc(settingsDocRef, updatedSettings, { merge: true });
      
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم تحديث إعدادات النظام.",
      });
       if (adminUser) {
        await logActivity({
          actionType: "SETTINGS_UPDATED",
          description: `Admin ${adminUser.displayName || adminUser.email} updated system settings.`,
          actor: { id: adminUser.uid, role: adminUser.role || undefined, name: adminUser.displayName },
          details: { portalName: updatedSettings.portalName, maintenanceMode: updatedSettings.maintenanceMode }, 
        });
      }
    } catch (error: any) {
      console.error("Firestore Save Error Details:", error);
      toast({
        title: "خطأ في حفظ الإعدادات",
        description: "لم نتمكن من حفظ التغييرات. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  const handleInvalidSubmit = (errors: FieldErrors<SettingsFormValues>) => {
    console.error("Form validation failed:", errors);
    toast({
      title: "خطأ في الإدخال",
      description: "يرجى مراجعة الحقول والتأكد من صحة البيانات المدخلة. بعض القيم قد تكون غير صالحة أو حقول مطلوبة فارغة.",
      variant: "destructive",
      duration: 7000,
    });
  };

  const mainThemeColorFields: Array<{nameBase: string, label: string, placeholder: string}> = [
    { nameBase: "Background", label: "لون الخلفية", placeholder: "مثال: 240 10% 15%" },
    { nameBase: "Foreground", label: "لون النص", placeholder: "مثال: 0 0% 98%" },
    { nameBase: "Primary", label: "اللون الأساسي", placeholder: "مثال: 238 60% 55%" },
    { nameBase: "PrimaryForeground", label: "لون النص على الأساسي", placeholder: "مثال: 0 0% 98%" },
    { nameBase: "Accent", label: "اللون الثانوي/المميز", placeholder: "مثال: 191 60% 50%" },
    { nameBase: "AccentForeground", label: "لون النص على الثانوي", placeholder: "مثال: 0 0% 98%" },
    { nameBase: "Card", label: "لون خلفية البطاقات", placeholder: "مثال: 238 10% 20%" },
    { nameBase: "CardForeground", label: "لون نص البطاقات", placeholder: "مثال: 0 0% 95%" },
    { nameBase: "Popover", label: "لون خلفية العناصر المنبثقة", placeholder: "مثال: 238 10% 20%" },
    { nameBase: "PopoverForeground", label: "لون نص العناصر المنبثقة", placeholder: "مثال: 0 0% 95%" },
    { nameBase: "Secondary", label: "اللون الفرعي (للخلفيات الثانوية)", placeholder: "مثال: 240 10% 94%" },
    { nameBase: "SecondaryForeground", label: "لون النص على الفرعي", placeholder: "مثال: 238 10% 25%" },
    { nameBase: "Muted", label: "اللون الخافت (للخلفيات المحايدة)", placeholder: "مثال: 240 10% 75%" },
    { nameBase: "MutedForeground", label: "لون النص الخافت", placeholder: "مثال: 240 10% 45%" },
    { nameBase: "Border", label: "لون الحدود", placeholder: "مثال: 238 10% 30%" },
    { nameBase: "Input", label: "لون حقول الإدخال", placeholder: "مثال: 238 10% 30%" },
    { nameBase: "Ring", label: "لون حلقة التركيز (Ring)", placeholder: "مثال: 191 60% 50%" },
    { nameBase: "Destructive", label: "لون التنبيهات (خطأ/حذف)", placeholder: "0 84.2% 60.2%" },
    { nameBase: "DestructiveForeground", label: "لون نص التنبيهات", placeholder: "0 0% 98%" },
  ];

  const sidebarThemeColorFields: Array<{nameBase: string, label: string, placeholder: string}> = [
    { nameBase: "SidebarBackground", label: "خلفية الشريط الجانبي", placeholder: "مثال: 238 40% 96%" },
    { nameBase: "SidebarForeground", label: "نص الشريط الجانبي", placeholder: "مثال: 238 15% 30%" },
    { nameBase: "SidebarPrimary", label: "أساسي الشريط الجانبي (للنشط)", placeholder: "مثال: 238 52% 38%" },
    { nameBase: "SidebarPrimaryForeground", label: "نص أساسي الشريط الجانبي", placeholder: "مثال: 0 0% 98%" },
    { nameBase: "SidebarAccent", label: "مميز الشريط الجانبي (للتمرير)", placeholder: "مثال: 191 55% 41%" },
    { nameBase: "SidebarAccentForeground", label: "نص مميز الشريط الجانبي", placeholder: "مثال: 0 0% 98%" },
    { nameBase: "SidebarBorder", label: "حدود الشريط الجانبي", placeholder: "مثال: 238 20% 88%" },
    { nameBase: "SidebarRing", label: "حلقة تركيز الشريط الجانبي", placeholder: "مثال: 191 55% 41%" },
  ];

  const socialMediaFields: Array<{name: keyof SettingsFormValues, label: string, placeholder: string, icon: React.ElementType}> = [
    { name: "socialFacebookUrl", label: "رابط فيسبوك", placeholder: "https://facebook.com/yourpage", icon: Facebook },
    { name: "socialTwitterUrl", label: "رابط تويتر (X)", placeholder: "https://x.com/yourprofile", icon: Twitter },
    { name: "socialLinkedinUrl", label: "رابط لينكدإن", placeholder: "https://linkedin.com/company/yourcompany", icon: Linkedin },
    { name: "socialInstagramUrl", label: "رابط انستغرام", placeholder: "https://instagram.com/yourprofile", icon: Instagram },
  ];

  const renderColorFields = (fields: Array<{nameBase: string, label: string, placeholder: string}>) => {
    return fields.map(item => {
      const lightFieldName = `theme${item.nameBase}Light` as keyof SettingsFormValues;
      const darkFieldName = `theme${item.nameBase}Dark` as keyof SettingsFormValues;
      
      return (
        <div key={item.nameBase} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 border-b pb-4 last:border-b-0 last:pb-0">
          <h4 className="col-span-1 md:col-span-2 text-md font-medium text-muted-foreground mb-1">{item.label}</h4>
          
          <FormField control={control} name={lightFieldName} render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1"><Sun className="h-4 w-4" /> الوضع الفاتح</FormLabel>
                <div className="flex items-center gap-2">
                    <HtmlColorPicker
                        formFieldName={lightFieldName}
                        watch={watch}
                        setValue={setValue}
                        disabled={isSubmitting}
                    />
                    <FormControl className="flex-grow">
                        <Input 
                            placeholder={(DEFAULT_SETTINGS[lightFieldName as keyof SiteSettings] as string) || item.placeholder} 
                            {...field} 
                            value={field.value || ""} 
                            disabled={isSubmitting} 
                            className="dir-ltr text-left" 
                        />
                    </FormControl>
                    {isValidHslForPreview(field.value) && (
                        <div
                        className="h-8 w-8 rounded-md border-2 border-border shadow-sm shrink-0"
                        style={{ backgroundColor: `hsl(${field.value})` }}
                        title={`Preview for ${field.value}`}
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
                    <HtmlColorPicker
                        formFieldName={darkFieldName}
                        watch={watch}
                        setValue={setValue}
                        disabled={isSubmitting}
                    />
                    <FormControl className="flex-grow">
                        <Input 
                            placeholder={(DEFAULT_SETTINGS[darkFieldName as keyof SiteSettings] as string) || item.placeholder} 
                            {...field} 
                            value={field.value || ""} 
                            disabled={isSubmitting} 
                            className="dir-ltr text-left" 
                        />
                    </FormControl>
                    {isValidHslForPreview(field.value) && (
                        <div
                            className="h-8 w-8 rounded-md border-2 border-border shadow-sm shrink-0"
                            style={{ backgroundColor: `hsl(${field.value})` }}
                            title={`Preview for ${field.value}`}
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

  const handleResetColorSection = (
    colorFields: Array<{nameBase: string}>, 
    mode: 'Light' | 'Dark',
    sectionName: string 
  ) => {
    colorFields.forEach(fieldInfo => {
      const fieldName = `theme${fieldInfo.nameBase}${mode}` as keyof SettingsFormValues;
      const defaultSettingKey = `theme${fieldInfo.nameBase}${mode}` as keyof SiteSettings;
      setValue(fieldName, DEFAULT_SETTINGS[defaultSettingKey] || "", {shouldDirty: true, shouldValidate: true});
    });
    toast({ title: "تمت الاستعادة", description: `تمت استعادة ألوان ${sectionName} (${mode === 'Light' ? 'الفاتحة' : 'الداكنة'}) إلى الافتراضي. اضغط 'حفظ الإعدادات' للتطبيق.` });
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
            <form onSubmit={handleSubmit(handleSaveSettings, handleInvalidSubmit)} className="space-y-8">
              <Tabs defaultValue="general" className="w-full" dir="rtl">
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-6">
                  <TabsTrigger value="general" className="flex items-center gap-2">
                    <Edit3 className="h-5 w-5" /> عامة وهوية
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
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5" />الهوية الأساسية للبوابة</CardTitle>
                        <CardDescription>تحديد اسم البوابة وشعارها لتعزيز الهوية.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                       <FormField control={control} name="portalName" render={({ field }) => (
                          <FormItem><FormLabel>اسم البوابة</FormLabel><FormControl><Input {...field} disabled={isSubmitting || isUploadingLogo} /></FormControl><FormMessage /></FormItem>
                        )}
                      />
                       <FormField
                          control={control}
                          name="logoFile"
                          render={() => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-1"><ImageIcon className="h-4 w-4 text-muted-foreground" />شعار البوابة (Logo)</FormLabel>
                              <div className="flex items-end gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => logoFileRef.current?.click()}
                                  disabled={isSubmitting || isUploadingLogo}
                                >
                                  {isUploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                  <span className="ms-2">
                                    {logoPreview ? "تغيير الشعار" : "رفع الشعار"}
                                  </span>
                                </Button>
                                {logoPreview && (
                                  <Image
                                    src={logoPreview}
                                    alt="Logo Preview"
                                    width={80}
                                    height={40}
                                    className="h-10 w-auto max-w-[80px] object-contain border rounded bg-muted"
                                  />
                                )}
                              </div>
                              <FormControl>
                                <Input
                                  type="file"
                                  ref={logoFileRef}
                                  className="hidden"
                                  accept={ALLOWED_LOGO_TYPES.join(",")}
                                  onChange={handleLogoFileChange}
                                  disabled={isSubmitting || isUploadingLogo}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><SettingsIcon className="h-5 w-5" />الإعدادات التشغيلية</CardTitle>
                        <CardDescription>التحكم في بريد المسؤول الرئيسي وتفعيل وضع الصيانة.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FormField control={control} name="adminEmail" render={({ field }) => (
                          <FormItem><FormLabel>بريد المسؤول الرئيسي</FormLabel><FormControl><Input type="email" {...field} disabled={isSubmitting || isUploadingLogo} /></FormControl><FormMessage /></FormItem>
                        )}
                      />
                      <FormField control={control} name="maintenanceMode" render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5"><FormLabel>تفعيل وضع الصيانة</FormLabel><FormMessage /></div>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting || isUploadingLogo} /></FormControl>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5" />معلومات الاتصال العامة</CardTitle>
                        <CardDescription>إدارة معلومات الاتصال العامة التي ستظهر للزوار والعملاء.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField control={control} name="publicEmail" render={({ field }) => (
                            <FormItem><FormLabel className="flex items-center gap-1"><Mail className="h-4 w-4 text-muted-foreground" />البريد الإلكتروني العام (للتواصل)</FormLabel><FormControl><Input type="email" placeholder="contact@example.com" {...field} value={field.value || ""} disabled={isSubmitting || isUploadingLogo} /></FormControl><FormMessage /></FormItem>
                          )}
                        />
                        <FormField control={control} name="companyPhone" render={({ field }) => (
                            <FormItem><FormLabel className="flex items-center gap-1"><Phone className="h-4 w-4 text-muted-foreground" />رقم الهاتف</FormLabel><FormControl><Input placeholder="مثال: +201234567890" {...field} value={field.value || ""} disabled={isSubmitting || isUploadingLogo} /></FormControl><FormMessage /></FormItem>
                          )}
                        />
                        <FormField control={control} name="companyAddress" render={({ field }) => (
                            <FormItem><FormLabel className="flex items-center gap-1"><MapPin className="h-4 w-4 text-muted-foreground" />العنوان الفعلي</FormLabel><FormControl><Textarea placeholder="مثال: 123 شارع النصر، القاهرة، مصر" {...field} value={field.value || ""} disabled={isSubmitting || isUploadingLogo} rows={3} /></FormControl><FormMessage /></FormItem>
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
                              <Input placeholder={item.placeholder} {...field} value={field.value || ""} disabled={isSubmitting || isUploadingLogo} className="dir-ltr text-left"/>
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
                            استخدم منتقي الألوان أو أدخل قيم HSL مباشرة. اترك الحقل فارغًا لاستخدام القيمة الافتراضية. 
                            يجب أن تكون القيم بتنسيق HSL بدون الأقواس، مثال: <code className="dir-ltr text-xs p-1 bg-muted rounded">240 10% 15%</code>. انقر على العنوان أدناه للتوسيع.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="main-interface-colors">
                                <AccordionTrigger className="text-lg font-medium hover:no-underline">تخصيص ألوان الواجهة الرئيسية</AccordionTrigger>
                                <AccordionContent className="pt-4 space-y-6">
                                    {renderColorFields(mainThemeColorFields)}
                                    <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                                        <Button type="button" variant="outline" onClick={() => handleResetColorSection(mainThemeColorFields, 'Light', 'الواجهة الرئيسية')} disabled={isSubmitting || isUploadingLogo}>
                                        <RotateCcw className="me-2 h-4 w-4" /> استعادة الألوان الفاتحة الافتراضية
                                        </Button>
                                        <Button type="button" variant="outline" onClick={() => handleResetColorSection(mainThemeColorFields, 'Dark', 'الواجهة الرئيسية')} disabled={isSubmitting || isUploadingLogo}>
                                        <RotateCcw className="me-2 h-4 w-4" /> استعادة الألوان الداكنة الافتراضية
                                        </Button>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Sidebar className="h-5 w-5" />ألوان الشريط الجانبي (HSL)</CardTitle>
                        <CardDescription>
                            خصص ألوان الشريط الجانبي والقائمة المتنقلة. اترك فارغًا للقيم الافتراضية. انقر على العنوان أدناه للتوسيع.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="sidebar-colors">
                                <AccordionTrigger className="text-lg font-medium hover:no-underline">تخصيص ألوان الشريط الجانبي</AccordionTrigger>
                                <AccordionContent className="pt-4 space-y-6">
                                    {renderColorFields(sidebarThemeColorFields)}
                                    <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                                        <Button type="button" variant="outline" onClick={() => handleResetColorSection(sidebarThemeColorFields, 'Light', 'الشريط الجانبي')} disabled={isSubmitting || isUploadingLogo}>
                                        <RotateCcw className="me-2 h-4 w-4" /> استعادة الألوان الفاتحة الافتراضية
                                        </Button>
                                        <Button type="button" variant="outline" onClick={() => handleResetColorSection(sidebarThemeColorFields, 'Dark', 'الشريط الجانبي')} disabled={isSubmitting || isUploadingLogo}>
                                        <RotateCcw className="me-2 h-4 w-4" /> استعادة الألوان الداكنة الافتراضية
                                        </Button>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="notifications" className="mt-6 space-y-6">
                  <Card><CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />إعدادات الإشعارات</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">هذه الميزة غير متاحة بعد.</p></CardContent></Card>
                </TabsContent>
              </Tabs>

              <div className="mt-8 flex justify-end">
                <Button type="submit" disabled={isSubmitting || siteSettingsDataFromHook.isLoadingSiteSettings || isUploadingLogo}>
                  {(isSubmitting || siteSettingsDataFromHook.isLoadingSiteSettings || isUploadingLogo) ? <Loader2 className="me-2 h-5 w-5 animate-spin" /> : <Save className="me-2 h-5 w-5" />}
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
    
