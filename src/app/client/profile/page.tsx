"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import * as QRCode from "qrcode";

export default function ClientProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    company: "",
    position: "",
    notifications: { email: true, sms: true, system: true }
  });
  const [accountStats, setAccountStats] = useState({
    totalRequests: 0,
    activeServices: 0,
    completedServices: 0,
    totalSpent: 0,
    memberSince: ""
  });

  // Security dialogs state
  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPwd, setChangingPwd] = useState(false);

  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFAOpen, setTwoFAOpen] = useState(false);
  const [twoFASecret, setTwoFASecret] = useState<string | null>(null);
  const [otpAuthUrl, setOtpAuthUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [twoFASetupLoading, setTwoFASetupLoading] = useState(false);
  const [twoFAToken, setTwoFAToken] = useState("");
  const [enabling2FA, setEnabling2FA] = useState(false);

  // Load profile and stats from API
  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, dashRes] = await Promise.all([
          fetch('/api/client/profile'),
          fetch('/api/client/dashboard')
        ]);

        if (profileRes.ok) {
          const profile = await profileRes.json();
          setFormData({
            name: profile.name || "",
            email: profile.email || "",
            phone: profile.phone || "",
            address: profile.address || "",
            company: profile.company || "",
            position: profile.position || "",
            notifications: profile.notifications || { email: true, sms: true, system: true }
          });
          setTwoFAEnabled(!!profile.twoFactorEnabled);
          const joined = profile.memberSince ? new Date(profile.memberSince) : null;
          if (joined) {
            setAccountStats(prev => ({ ...prev, memberSince: new Intl.DateTimeFormat('ar-EG', { month: 'long', year: 'numeric' }).format(joined) }));
          }
        }

        if (dashRes.ok) {
          const dash = await dashRes.json();
          setAccountStats(prev => ({
            ...prev,
            totalRequests: dash.stats.totalServices || 0,
            activeServices: dash.stats.activeRequests || 0,
            completedServices: dash.stats.completedServices || 0,
            totalSpent: dash.stats.totalSpent || 0,
          }));
        }
      } catch (e) {
        console.error('Failed to load profile/stats', e);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    try {
      const res = await fetch('/api/client/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Failed to save');
      setIsEditing(false);
      toast({ title: 'تم الحفظ', description: 'تم تحديث الملف الشخصي بنجاح.' });
    } catch (e) {
      console.error(e);
      toast({ title: 'تعذر الحفظ', description: 'حدث خطأ أثناء حفظ البيانات.', variant: 'destructive' });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "SM";
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  // accountStats now comes from real API

  // Change password submit
  const submitChangePassword = async () => {
    try {
      if (!currentPassword || !newPassword || !confirmPassword) {
        toast({ title: 'حقول ناقصة', description: 'يرجى إدخال جميع الحقول.', variant: 'destructive' });
        return;
      }
      if (newPassword.length < 8) {
        toast({ title: 'كلمة المرور قصيرة', description: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل.', variant: 'destructive' });
        return;
      }
      if (newPassword !== confirmPassword) {
        toast({ title: 'عدم تطابق', description: 'كلمتا المرور غير متطابقتين.', variant: 'destructive' });
        return;
      }
      setChangingPwd(true);
      const res = await fetch('/api/client/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'فشل تغيير كلمة المرور');
      }
      setChangePwdOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: 'تم تحديث كلمة المرور', description: 'تم تغيير كلمة المرور بنجاح.' });
    } catch (e: any) {
      toast({ title: 'تعذر تغيير كلمة المرور', description: e?.message || 'حدث خطأ ما.', variant: 'destructive' });
    } finally {
      setChangingPwd(false);
    }
  };

  // 2FA setup on open
  const open2FASetup = async () => {
    if (twoFAEnabled) return; // already enabled
    try {
      setTwoFASetupLoading(true);
      setOtpAuthUrl(null);
      setQrDataUrl(null);
      setTwoFASecret(null);
      setTwoFAToken("");
      const res = await fetch('/api/client/2fa/setup', { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'تعذر بدء إعداد المصادقة الثنائية');
      }
      const data = await res.json();
      setTwoFASecret(data.secret);
      setOtpAuthUrl(data.otpAuthUrl);
      // Generate QR data URL from otpAuthUrl
      try {
        const dataUrl = await QRCode.toDataURL(data.otpAuthUrl);
        setQrDataUrl(dataUrl);
      } catch (qrErr) {
        console.error('QR generation failed', qrErr);
      }
    } catch (e: any) {
      console.error(e);
      toast({ title: 'خطأ في الإعداد', description: e?.message || 'تعذر إنشاء إعداد المصادقة الثنائية.', variant: 'destructive' });
    } finally {
      setTwoFASetupLoading(false);
    }
  };

  const verifyEnable2FA = async () => {
    try {
      if (!twoFAToken) {
        toast({ title: 'الرمز مطلوب', description: 'يرجى إدخال رمز التحقق من التطبيق.', variant: 'destructive' });
        return;
      }
      setEnabling2FA(true);
      const res = await fetch('/api/client/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: twoFAToken })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'فشل تفعيل المصادقة الثنائية');
      }
      setTwoFAEnabled(true);
      setTwoFAOpen(false);
      setTwoFAToken("");
      toast({ title: 'تم التفعيل', description: 'تم تفعيل المصادقة الثنائية لحسابك.' });
    } catch (e: any) {
      toast({ title: 'تعذر التفعيل', description: e?.message || 'رمز غير صالح، حاول مرة أخرى.', variant: 'destructive' });
    } finally {
      setEnabling2FA(false);
    }
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
                <Dialog open={changePwdOpen} onOpenChange={setChangePwdOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">تغيير كلمة المرور</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>تغيير كلمة المرور</DialogTitle>
                      <DialogDescription>يرجى إدخال كلمة المرور الحالية والجديدة.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
                        <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                        <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="confirmPassword">تأكيد كلمة المرور الجديدة</Label>
                        <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                      </div>
                    </div>
                    <DialogFooter className="gap-2">
                      <Button variant="outline" onClick={() => setChangePwdOpen(false)}>إلغاء</Button>
                      <Button onClick={submitChangePassword} disabled={changingPwd}>{changingPwd ? 'جارٍ الحفظ...' : 'تحديث'}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">المصادقة الثنائية</h4>
                  <p className="text-sm text-muted-foreground">طبقة حماية إضافية لحسابك</p>
                  {twoFAEnabled ? (
                    <Badge className="mt-2" variant="secondary">مفعّل</Badge>
                  ) : (
                    <Badge className="mt-2" variant="outline">غير مفعّل</Badge>
                  )}
                </div>
                <Dialog open={twoFAOpen} onOpenChange={(open) => { setTwoFAOpen(open); if (open) open2FASetup(); }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={twoFAEnabled}>{twoFAEnabled ? 'مفعّل' : 'تفعيل'}</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>تفعيل المصادقة الثنائية</DialogTitle>
                      <DialogDescription>امسح رمز QR في تطبيق المصادقة ثم أدخل رمز التحقق.</DialogDescription>
                    </DialogHeader>
                    {twoFASetupLoading ? (
                      <div className="text-sm text-muted-foreground">جاري التحضير...</div>
                    ) : (
                      <div className="space-y-4">
                        {qrDataUrl ? (
                          <div className="flex flex-col items-center gap-2">
                            <img src={qrDataUrl} alt="QR Code" className="w-40 h-40" />
                            {otpAuthUrl && (
                              <p className="text-xs break-all text-muted-foreground">{otpAuthUrl}</p>
                            )}
                          </div>
                        ) : (
                          otpAuthUrl ? (
                            <p className="text-xs break-all text-muted-foreground">{otpAuthUrl}</p>
                          ) : null
                        )}
                        {twoFASecret && (
                          <div className="text-xs text-muted-foreground">
                            في حال تعذر مسح QR، يمكنك استخدام هذا المفتاح: <span className="font-mono">{twoFASecret}</span>
                          </div>
                        )}
                        <div className="space-y-1">
                          <Label htmlFor="twofatoken">رمز التحقق</Label>
                          <Input id="twofatoken" inputMode="numeric" placeholder="123456" value={twoFAToken} onChange={(e) => setTwoFAToken(e.target.value)} />
                        </div>
                      </div>
                    )}
                    <DialogFooter className="gap-2">
                      <Button variant="outline" onClick={() => setTwoFAOpen(false)}>إغلاق</Button>
                      <Button onClick={verifyEnable2FA} disabled={twoFASetupLoading || enabling2FA || twoFAEnabled}>{enabling2FA ? 'جارٍ التفعيل...' : 'تفعيل'}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
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
                    {new Intl.NumberFormat('ar-EG', {
                      style: 'currency',
                      currency: 'EGP'
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
        </div>
      </div>
    </div>
  );
}