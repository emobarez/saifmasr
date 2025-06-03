
"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, Bell, ShieldQuestion, Palette, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface SystemSettings {
  portalName: string;
  maintenanceMode: boolean;
  adminEmail?: string; // Kept for UI, not functional for saving yet
}

export default function AdminSettingsPage() {
  const [portalName, setPortalName] = useState("سيف مصر الوطنية للأمن");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [adminEmail, setAdminEmail] = useState("admin@saifmasr.com"); // Default, not saved yet

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const settingsDocRef = doc(db, "systemSettings", "general");

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const docSnap = await getDoc(settingsDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as SystemSettings;
          setPortalName(data.portalName);
          setMaintenanceMode(data.maintenanceMode);
          if (data.adminEmail) setAdminEmail(data.adminEmail); // For display if ever saved
        } else {
          // Use default values if no settings found
          console.log("No settings document found, using defaults.");
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast({
          title: "خطأ في تحميل الإعدادات",
          description: "لم نتمكن من تحميل الإعدادات الحالية.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const settingsToSave: SystemSettings = {
        portalName,
        maintenanceMode,
        // adminEmail, // Not saving this yet
      };
      await setDoc(settingsDocRef, settingsToSave, { merge: true });
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم تحديث إعدادات النظام.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "خطأ في حفظ الإعدادات",
        description: "لم نتمكن من حفظ التغييرات. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
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
          <CardDescription>إدارة الإعدادات العامة لـ سيف مصر الوطنية للأمن.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general" className="w-full" dir="rtl">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="general">عامة</TabsTrigger>
              <TabsTrigger value="notifications" disabled>الإشعارات</TabsTrigger>
              <TabsTrigger value="security" disabled>الأمان</TabsTrigger>
              <TabsTrigger value="appearance" disabled>المظهر</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="mt-6 space-y-6">
              <Card>
                <CardHeader><CardTitle>الإعدادات العامة</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="portalName">اسم البوابة</Label>
                    <Input 
                      id="portalName" 
                      value={portalName} 
                      onChange={(e) => setPortalName(e.target.value)} 
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <Label htmlFor="adminEmail">بريد المسؤول الرئيسي (للعرض فقط)</Label>
                    <Input id="adminEmail" type="email" value={adminEmail} disabled />
                    <p className="text-xs text-muted-foreground mt-1">هذا الحقل للعرض فقط ولا يمكن تعديله من هنا حالياً.</p>
                  </div>
                   <div className="flex items-center space-x-2 space-x-reverse pt-2">
                    <Switch 
                      id="maintenanceMode" 
                      checked={maintenanceMode}
                      onCheckedChange={setMaintenanceMode}
                      disabled={isSaving}
                    />
                    <Label htmlFor="maintenanceMode">تفعيل وضع الصيانة</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Other TabsContent sections remain for structure but are not functional yet */}
            <TabsContent value="notifications" className="mt-6 space-y-6">
              <Card>
                <CardHeader><CardTitle>إعدادات الإشعارات</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                   <p className="text-muted-foreground">هذه الميزة غير متاحة بعد.</p>
                  {/* 
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch id="emailNewUser" defaultChecked disabled />
                    <Label htmlFor="emailNewUser">إرسال بريد ترحيبي للمستخدمين الجدد</Label>
                  </div>
                  */}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="mt-6 space-y-6">
               <Card>
                <CardHeader><CardTitle>إعدادات الأمان</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">هذه الميزة غير متاحة بعد.</p>
                  {/*
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch id="twoFactorAuth" disabled/>
                    <Label htmlFor="twoFactorAuth">تفعيل المصادقة الثنائية للمسؤولين</Label>
                  </div>
                  */}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="appearance" className="mt-6 space-y-6">
               <Card>
                <CardHeader><CardTitle>إعدادات المظهر</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                   <p className="text-muted-foreground">هذه الميزة غير متاحة بعد.</p>
                 {/* 
                  <div>
                    <Label htmlFor="logoUpload">شعار البوابة</Label>
                    <Input id="logoUpload" type="file" disabled/>
                    <p className="text-sm text-muted-foreground mt-1">يفضل أن يكون الشعار بأبعاد 200x50 بكسل.</p>
                  </div>
                  */}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-8 flex justify-end">
            <Button onClick={handleSaveSettings} disabled={isSaving || isLoading}>
              {isSaving ? <Loader2 className="me-2 h-5 w-5 animate-spin" /> : <Save className="me-2 h-5 w-5" />}
              حفظ الإعدادات
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
