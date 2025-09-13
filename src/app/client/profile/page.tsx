"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Calendar,
  Shield,
  Edit,
  Save,
  X,
  Bell,
  Lock,
  CreditCard
} from "lucide-react";

export default function ClientProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "+966501234567",
    address: "الرياض، المملكة العربية السعودية",
    company: "شركة التقنية المتقدمة",
    position: "مدير العمليات",
    notifications: {
      email: true,
      sms: true,
      system: true
    }
  });

  const handleSave = () => {
    // Here you would typically save to your backend
    console.log("Saving profile data:", formData);
    setIsEditing(false);
    alert("تم حفظ التغييرات بنجاح!");
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "SM";
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  // Mock data for account statistics
  const accountStats = {
    totalRequests: 12,
    activeServices: 3,
    completedServices: 9,
    totalSpent: 85000,
    memberSince: "يناير 2023"
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">الملف الشخصي</h1>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            تعديل الملف
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm">
              <Save className="h-4 w-4 mr-2" />
              حفظ
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(false)}
              size="sm"
            >
              <X className="h-4 w-4 mr-2" />
              إلغاء
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>المعلومات الشخصية</CardTitle>
              <CardDescription>
                تحديث معلوماتك الشخصية ومعلومات التواصل
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.image || undefined} alt={user?.name || "User"} />
                  <AvatarFallback className="text-lg">{getInitials(user?.name)}</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">{user?.name || "المستخدم"}</h3>
                  <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                    <Shield className="h-3 w-3" />
                    عميل مميز
                  </Badge>
                  {isEditing && (
                    <Button variant="outline" size="sm">
                      تغيير الصورة
                    </Button>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">الاسم الكامل</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{formData.name}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{formData.email}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{formData.phone}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">الشركة</Label>
                  {isEditing ? (
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => handleInputChange("company", e.target.value)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{formData.company}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">العنوان</Label>
                {isEditing ? (
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    className="min-h-[80px]"
                  />
                ) : (
                  <div className="flex items-start gap-2 p-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <span>{formData.address}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                الأمان والخصوصية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">كلمة المرور</h4>
                  <p className="text-sm text-muted-foreground">آخر تغيير: منذ 3 أشهر</p>
                </div>
                <Button variant="outline" size="sm">
                  تغيير كلمة المرور
                </Button>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">المصادقة الثنائية</h4>
                  <p className="text-sm text-muted-foreground">طبقة حماية إضافية لحسابك</p>
                </div>
                <Button variant="outline" size="sm">
                  تفعيل
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                إحصائيات الحساب
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{accountStats.totalRequests}</div>
                  <div className="text-xs text-muted-foreground">إجمالي الطلبات</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{accountStats.activeServices}</div>
                  <div className="text-xs text-muted-foreground">الخدمات النشطة</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{accountStats.completedServices}</div>
                  <div className="text-xs text-muted-foreground">خدمات مكتملة</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {new Intl.NumberFormat('ar-SA', {
                      style: 'currency',
                      currency: 'SAR'
                    }).format(accountStats.totalSpent)}
                  </div>
                  <div className="text-xs text-muted-foreground">إجمالي الإنفاق</div>
                </div>
              </div>
              <Separator />
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  عضو منذ: <span className="font-medium">{accountStats.memberSince}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                إعدادات الإشعارات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">إشعارات البريد الإلكتروني</span>
                  <Button 
                    variant={formData.notifications.email ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, email: !prev.notifications.email }
                    }))}
                  >
                    {formData.notifications.email ? "مفعل" : "معطل"}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">الرسائل النصية</span>
                  <Button 
                    variant={formData.notifications.sms ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, sms: !prev.notifications.sms }
                    }))}
                  >
                    {formData.notifications.sms ? "مفعل" : "معطل"}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">إشعارات النظام</span>
                  <Button 
                    variant={formData.notifications.system ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, system: !prev.notifications.system }
                    }))}
                  >
                    {formData.notifications.system ? "مفعل" : "معطل"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                طرق الدفع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">•••• •••• •••• 1234</p>
                      <p className="text-xs text-muted-foreground">انتهاء: 12/26</p>
                    </div>
                  </div>
                  <Badge variant="secondary">الرئيسية</Badge>
                </div>
                <Button variant="outline" className="w-full" size="sm">
                  إضافة بطاقة جديدة
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}