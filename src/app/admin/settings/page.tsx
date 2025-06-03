
"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, Bell, ShieldQuestion, Palette } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminSettingsPage() {
  // TODO: Add state and handlers for settings
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
              <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
              <TabsTrigger value="security">الأمان</TabsTrigger>
              <TabsTrigger value="appearance">المظهر</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="mt-6 space-y-6">
              <Card>
                <CardHeader><CardTitle>الإعدادات العامة</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="portalName">اسم البوابة</Label>
                    <Input id="portalName" defaultValue="سيف مصر الوطنية للأمن" />
                  </div>
                  <div>
                    <Label htmlFor="adminEmail">بريد المسؤول الرئيسي</Label>
                    <Input id="adminEmail" type="email" defaultValue="admin@saifmasr.com" />
                  </div>
                   <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch id="maintenanceMode" />
                    <Label htmlFor="maintenanceMode">تفعيل وضع الصيانة</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="mt-6 space-y-6">
              <Card>
                <CardHeader><CardTitle>إعدادات الإشعارات</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch id="emailNewUser" defaultChecked />
                    <Label htmlFor="emailNewUser">إرسال بريد ترحيبي للمستخدمين الجدد</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch id="emailServiceRequest" defaultChecked />
                    <Label htmlFor="emailServiceRequest">إشعار بالبريد عند طلب خدمة جديدة</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch id="emailInvoiceGenerated" />
                    <Label htmlFor="emailInvoiceGenerated">إشعار بالبريد عند إنشاء فاتورة</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="mt-6 space-y-6">
               <Card>
                <CardHeader><CardTitle>إعدادات الأمان</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch id="twoFactorAuth" />
                    <Label htmlFor="twoFactorAuth">تفعيل المصادقة الثنائية للمسؤولين</Label>
                  </div>
                  <div>
                    <Label htmlFor="sessionTimeout">مدة انتهاء صلاحية الجلسة (بالدقائق)</Label>
                    <Input id="sessionTimeout" type="number" defaultValue="30" />
                  </div>
                   <Button variant="outline">
                      <ShieldQuestion className="me-2 h-5 w-5" />
                      مراجعة سجلات الأمان
                    </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="appearance" className="mt-6 space-y-6">
               <Card>
                <CardHeader><CardTitle>إعدادات المظهر</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="logoUpload">شعار البوابة</Label>
                    <Input id="logoUpload" type="file" />
                    <p className="text-sm text-muted-foreground mt-1">يفضل أن يكون الشعار بأبعاد 200x50 بكسل.</p>
                  </div>
                   <div>
                    <Label htmlFor="primaryColor">اللون الأساسي</Label>
                    <Input id="primaryColor" type="color" defaultValue="#2E3192" className="w-24 h-10 p-1" />
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch id="darkModeDefault" />
                    <Label htmlFor="darkModeDefault">تفعيل الوضع الداكن كافتراضي للزوار الجدد</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-8 flex justify-end">
            <Button>
              <Save className="me-2 h-5 w-5" />
              حفظ الإعدادات
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
