"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Shield, 
  Bell, 
  Mail, 
  Database,
  Users,
  Lock,
  Palette,
  Globe,
  Server,
  AlertTriangle,
  CheckCircle,
  Upload
} from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export default function AdminSettingsPage() {
  const { portalName, isLoadingSiteSettings } = useSiteSettings();
  const [activeTab, setActiveTab] = useState("general");
  
  // Mock settings state - replace with real state management
  const [settings, setSettings] = useState({
    general: {
      companyName: portalName || "شركة سيف مصر للحراسة والأمن",
      companyEmail: "info@saifmasr.com",
      companyPhone: "+20 2 123 4567",
      companyAddress: "القاهرة، جمهورية مصر العربية",
      website: "https://saifmasr.com",
      description: "شركة رائدة في مجال الحراسة والأمن الخاص"
    },
    system: {
      maintenanceMode: false,
      debugMode: false,
      autoBackup: true,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      enableLogging: true
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      adminAlerts: true,
      clientUpdates: true,
      securityAlerts: true
    },
    security: {
      twoFactorAuth: false,
      passwordMinLength: 8,
      passwordComplexity: true,
      sessionSecurity: true,
      ipWhitelist: "",
      encryptionEnabled: true
    },
    appearance: {
      theme: "light",
      primaryColor: "#0066cc",
      language: "ar",
      rtlSupport: true,
      customLogo: null,
      favicon: null
    }
  });

  const handleSave = () => {
    // Implement save functionality
    console.log("Saving settings:", settings);
    // Add success notification
  };

  const handleReset = () => {
    // Implement reset functionality
    console.log("Resetting settings");
  };

  const systemStatus = {
    database: { status: "connected", lastBackup: "2024-12-01 10:30:00" },
    server: { status: "healthy", uptime: "99.9%" },
    storage: { used: "2.3 GB", total: "10 GB", percentage: 23 },
    security: { status: "secure", lastScan: "2024-12-01 08:00:00" }
  };

  return (
    <div className="w-full overflow-x-auto md:overflow-x-visible force-scrollbar">
      <div className="space-y-3 xs:space-y-4 sm:space-y-6 lg:space-y-8 min-h-screen min-w-[800px] md:min-w-0 p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Settings className="h-8 w-8 mr-3 text-gray-600" />
            إعدادات النظام
          </h1>
          <p className="text-muted-foreground mt-1">
            إدارة إعدادات النظام والتطبيق
          </p>
        </div>
        <div className="flex space-x-2 space-x-reverse">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            إعادة تعيين
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            حفظ التغييرات
          </Button>
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">قاعدة البيانات</p>
                <p className="text-lg font-bold text-green-600">متصلة</p>
                <p className="text-xs text-muted-foreground">آخر نسخ احتياطي: {systemStatus.database.lastBackup}</p>
              </div>
              <Database className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">الخادم</p>
                <p className="text-lg font-bold text-green-600">يعمل بشكل طبيعي</p>
                <p className="text-xs text-muted-foreground">وقت التشغيل: {systemStatus.server.uptime}</p>
              </div>
              <Server className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">التخزين</p>
                <p className="text-lg font-bold">{systemStatus.storage.used}</p>
                <p className="text-xs text-muted-foreground">من أصل {systemStatus.storage.total}</p>
              </div>
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <div className="text-xs font-bold text-blue-600">{systemStatus.storage.percentage}%</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">الأمان</p>
                <p className="text-lg font-bold text-green-600">آمن</p>
                <p className="text-xs text-muted-foreground">آخر فحص: {systemStatus.security.lastScan}</p>
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">عام</TabsTrigger>
          <TabsTrigger value="system">النظام</TabsTrigger>
          <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
          <TabsTrigger value="security">الأمان</TabsTrigger>
          <TabsTrigger value="appearance">المظهر</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>معلومات الشركة</CardTitle>
              <CardDescription>
                إعدادات المعلومات الأساسية للشركة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">اسم الشركة</Label>
                  <Input
                    id="companyName"
                    value={settings.general.companyName}
                    onChange={(e) => setSettings({
                      ...settings,
                      general: { ...settings.general, companyName: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="companyEmail">البريد الإلكتروني</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={settings.general.companyEmail}
                    onChange={(e) => setSettings({
                      ...settings,
                      general: { ...settings.general, companyEmail: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="companyPhone">رقم الهاتف</Label>
                  <Input
                    id="companyPhone"
                    value={settings.general.companyPhone}
                    onChange={(e) => setSettings({
                      ...settings,
                      general: { ...settings.general, companyPhone: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="website">الموقع الإلكتروني</Label>
                  <Input
                    id="website"
                    value={settings.general.website}
                    onChange={(e) => setSettings({
                      ...settings,
                      general: { ...settings.general, website: e.target.value }
                    })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">العنوان</Label>
                <Textarea
                  id="address"
                  value={settings.general.companyAddress}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: { ...settings.general, companyAddress: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label htmlFor="description">وصف الشركة</Label>
                <Textarea
                  id="description"
                  value={settings.general.description}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: { ...settings.general, description: e.target.value }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات النظام</CardTitle>
              <CardDescription>
                التحكم في إعدادات النظام والأداء
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="maintenance">وضع الصيانة</Label>
                  <p className="text-sm text-muted-foreground">تعطيل الوصول للعملاء مؤقتاً</p>
                </div>
                <Switch
                  id="maintenance"
                  checked={settings.system.maintenanceMode}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    system: { ...settings.system, maintenanceMode: checked }
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="debug">وضع التشخيص</Label>
                  <p className="text-sm text-muted-foreground">تفعيل سجلات التشخيص المفصلة</p>
                </div>
                <Switch
                  id="debug"
                  checked={settings.system.debugMode}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    system: { ...settings.system, debugMode: checked }
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="backup">النسخ الاحتياطي التلقائي</Label>
                  <p className="text-sm text-muted-foreground">إنشاء نسخ احتياطية بشكل دوري</p>
                </div>
                <Switch
                  id="backup"
                  checked={settings.system.autoBackup}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    system: { ...settings.system, autoBackup: checked }
                  })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sessionTimeout">انتهاء الجلسة (دقيقة)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.system.sessionTimeout}
                    onChange={(e) => setSettings({
                      ...settings,
                      system: { ...settings.system, sessionTimeout: Number(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="maxAttempts">الحد الأقصى لمحاولات تسجيل الدخول</Label>
                  <Input
                    id="maxAttempts"
                    type="number"
                    value={settings.system.maxLoginAttempts}
                    onChange={(e) => setSettings({
                      ...settings,
                      system: { ...settings.system, maxLoginAttempts: Number(e.target.value) }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الإشعارات</CardTitle>
              <CardDescription>
                التحكم في أنواع الإشعارات المختلفة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Mail className="h-5 w-5 text-blue-500" />
                  <div>
                    <Label>إشعارات البريد الإلكتروني</Label>
                    <p className="text-sm text-muted-foreground">إرسال إشعارات عبر البريد الإلكتروني</p>
                  </div>
                </div>
                <Switch
                  checked={settings.notifications.emailNotifications}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, emailNotifications: checked }
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Bell className="h-5 w-5 text-green-500" />
                  <div>
                    <Label>إشعارات فورية</Label>
                    <p className="text-sm text-muted-foreground">إشعارات فورية في المتصفح</p>
                  </div>
                </div>
                <Switch
                  checked={settings.notifications.pushNotifications}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, pushNotifications: checked }
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Shield className="h-5 w-5 text-red-500" />
                  <div>
                    <Label>تنبيهات الأمان</Label>
                    <p className="text-sm text-muted-foreground">تنبيهات عند حدوث مشاكل أمنية</p>
                  </div>
                </div>
                <Switch
                  checked={settings.notifications.securityAlerts}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, securityAlerts: checked }
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Users className="h-5 w-5 text-purple-500" />
                  <div>
                    <Label>تحديثات العملاء</Label>
                    <p className="text-sm text-muted-foreground">إشعار العملاء بالتحديثات الجديدة</p>
                  </div>
                </div>
                <Switch
                  checked={settings.notifications.clientUpdates}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, clientUpdates: checked }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الأمان</CardTitle>
              <CardDescription>
                تعزيز أمان النظام والحسابات
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>المصادقة الثنائية</Label>
                  <p className="text-sm text-muted-foreground">تفعيل المصادقة الثنائية للحسابات</p>
                </div>
                <Switch
                  checked={settings.security.twoFactorAuth}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    security: { ...settings.security, twoFactorAuth: checked }
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>تعقيد كلمة المرور</Label>
                  <p className="text-sm text-muted-foreground">فرض استخدام كلمات مرور معقدة</p>
                </div>
                <Switch
                  checked={settings.security.passwordComplexity}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    security: { ...settings.security, passwordComplexity: checked }
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>التشفير</Label>
                  <p className="text-sm text-muted-foreground">تفعيل تشفير البيانات الحساسة</p>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <Badge className="bg-green-100 text-green-800">مُفعل</Badge>
                </div>
              </div>
              <div>
                <Label htmlFor="passwordLength">الحد الأدنى لطول كلمة المرور</Label>
                <Input
                  id="passwordLength"
                  type="number"
                  value={settings.security.passwordMinLength}
                  onChange={(e) => setSettings({
                    ...settings,
                    security: { ...settings.security, passwordMinLength: Number(e.target.value) }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات المظهر</CardTitle>
              <CardDescription>
                تخصيص مظهر النظام والواجهة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="theme">نمط العرض</Label>
                  <select
                    id="theme"
                    className="w-full p-2 border rounded-md"
                    value={settings.appearance.theme}
                    onChange={(e) => setSettings({
                      ...settings,
                      appearance: { ...settings.appearance, theme: e.target.value }
                    })}
                  >
                    <option value="light">فاتح</option>
                    <option value="dark">داكن</option>
                    <option value="auto">تلقائي</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="language">اللغة</Label>
                  <select
                    id="language"
                    className="w-full p-2 border rounded-md"
                    value={settings.appearance.language}
                    onChange={(e) => setSettings({
                      ...settings,
                      appearance: { ...settings.appearance, language: e.target.value }
                    })}
                  >
                    <option value="ar">العربية</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="primaryColor">اللون الأساسي</Label>
                <Input
                  id="primaryColor"
                  type="color"
                  value={settings.appearance.primaryColor}
                  onChange={(e) => setSettings({
                    ...settings,
                    appearance: { ...settings.appearance, primaryColor: e.target.value }
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>دعم الكتابة من اليمين لليسار</Label>
                  <p className="text-sm text-muted-foreground">تفعيل دعم اللغة العربية</p>
                </div>
                <Switch
                  checked={settings.appearance.rtlSupport}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    appearance: { ...settings.appearance, rtlSupport: checked }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>تحميل شعار مخصص</Label>
                <div className="flex items-center space-x-4 space-x-reverse">
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    تحميل ملف
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    PNG, JPG حتى 2MB
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}