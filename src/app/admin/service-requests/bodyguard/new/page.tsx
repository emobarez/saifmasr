"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2, User, Shield, MapPin, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";

const LeafletMapPicker = dynamic(
  () => import("@/components/client/LeafletMapPicker"),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-72"><Loader2 className="h-6 w-6 animate-spin" /></div> }
);

interface User {
  id: string;
  name: string;
  email: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
}

export default function NewBodyguardRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [bodyguardService, setBodyguardService] = useState<Service | null>(null);

  const [formData, setFormData] = useState({
    userId: "",
    serviceId: "",
    title: "طلب حراسة شخصية",
    description: "",
    priority: "URGENT",
    status: "PENDING",
    personnelCount: "1",
    armamentLevel: "LIGHT",
    durationUnit: "HOURS",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    locationText: "",
    locationLat: "",
    locationLng: "",
    notes: "",
    notifyBeforeHours: "24"
  });

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    loadUsers();
    loadServices();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/clients");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadServices = async () => {
    try {
      const response = await fetch("/api/services");
      if (response.ok) {
        const data = await response.json();
        setServices(data);
        
        // Auto-select bodyguard service
        const bodyguard = data.find((s: Service) => 
          s.name.match(/خدمة الحارس الشخصي|الحارس الشخصي|حارس شخصي|حراسة شخصية|بودي ?جارد|Body ?guard/i)
        );
        if (bodyguard) {
          setBodyguardService(bodyguard);
          setFormData(prev => ({ ...prev, serviceId: bodyguard.id }));
        }
      }
    } catch (error) {
      console.error("Error loading services:", error);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLocationSelect = (coords: { lat: number; lng: number }) => {
    setLocation(coords);
    setFormData(prev => ({
      ...prev,
      locationLat: coords.lat.toString(),
      locationLng: coords.lng.toString()
    }));
  };

  // Generate date options (next 365 days)
  const dateOptions = useMemo(() => {
    const options = [];
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      options.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('ar-EG', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      });
    }
    return options;
  }, []);

  // Generate time options (30-minute intervals)
  const timeOptions = useMemo(() => {
    const options = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hour = h.toString().padStart(2, '0');
        const minute = m.toString().padStart(2, '0');
        options.push({
          value: `${hour}:${minute}`,
          label: `${hour}:${minute}`
        });
      }
    }
    return options;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.userId || !formData.serviceId || !formData.title.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال جميع البيانات المطلوبة",
        variant: "destructive"
      });
      return;
    }

    if (!formData.startDate || !formData.startTime) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى تحديد تاريخ ووقت البدء",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Combine date and time
      const startAt = new Date(`${formData.startDate}T${formData.startTime}`).toISOString();
      const endAt = formData.endDate && formData.endTime 
        ? new Date(`${formData.endDate}T${formData.endTime}`).toISOString()
        : null;

      const response = await fetch("/api/service-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: formData.userId,
          serviceId: formData.serviceId,
          title: formData.title.trim(),
          description: formData.description.trim() || formData.notes.trim(),
          priority: formData.priority,
          status: formData.status,
          personnelCount: parseInt(formData.personnelCount) || null,
          armamentLevel: formData.armamentLevel,
          durationUnit: formData.durationUnit,
          startAt,
          endAt,
          locationText: formData.locationText.trim() || null,
          locationLat: formData.locationLat ? parseFloat(formData.locationLat) : null,
          locationLng: formData.locationLng ? parseFloat(formData.locationLng) : null,
          notes: formData.notes.trim() || null,
          notifyBeforeHours: parseInt(formData.notifyBeforeHours) || 24
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "فشل في إضافة طلب الحراسة");
      }

      toast({
        title: "تم بنجاح",
        description: "تم إضافة طلب الحراسة الشخصية بنجاح"
      });

      router.push("/admin/service-requests");
    } catch (error) {
      console.error("Error creating bodyguard request:", error);
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 max-w-6xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Button variant="outline" size="icon" asChild className="h-8 w-8 sm:h-9 sm:w-9 shrink-0">
          <Link href="/admin/service-requests/new">
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold truncate flex items-center gap-2">
            <Shield className="h-6 w-6 text-orange-600" />
            إضافة طلب حراسة شخصية
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground hidden sm:block">نموذج متخصص لطلبات الحراسة الشخصية</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              المعلومات الأساسية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Client Selection */}
              <div className="space-y-2">
                <Label htmlFor="userId">العميل *</Label>
                <Select value={formData.userId} onValueChange={(value) => handleInputChange("userId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingUsers ? "جاري التحميل..." : "اختر العميل"} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Service (Auto-selected) */}
              <div className="space-y-2">
                <Label>الخدمة</Label>
                <Input 
                  value={bodyguardService?.name || "جاري التحميل..."} 
                  readOnly 
                  className="bg-muted"
                />
                {bodyguardService && (
                  <p className="text-sm text-muted-foreground">
                    السعر: {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(bodyguardService.price)}
                  </p>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">عنوان الطلب *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="مثال: حراسة شخصية للمدير التنفيذي"
                />
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">الأولوية</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">منخفضة</SelectItem>
                    <SelectItem value="MEDIUM">متوسطة</SelectItem>
                    <SelectItem value="HIGH">عالية</SelectItem>
                    <SelectItem value="URGENT">طارئة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">وصف الطلب</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="تفاصيل إضافية حول متطلبات الحراسة..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Guard Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              تفاصيل الحراسة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="personnelCount">عدد الأفراد *</Label>
                <Input
                  id="personnelCount"
                  type="number"
                  min="1"
                  value={formData.personnelCount}
                  onChange={(e) => handleInputChange("personnelCount", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="armamentLevel">مستوى التسليح</Label>
                <Select value={formData.armamentLevel} onValueChange={(value) => handleInputChange("armamentLevel", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">بدون سلاح</SelectItem>
                    <SelectItem value="LIGHT">سلاح خفيف</SelectItem>
                    <SelectItem value="MEDIUM">سلاح متوسط</SelectItem>
                    <SelectItem value="HEAVY">سلاح ثقيل</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="durationUnit">وحدة المدة</Label>
                <Select value={formData.durationUnit} onValueChange={(value) => handleInputChange("durationUnit", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOURS">ساعات</SelectItem>
                    <SelectItem value="DAYS">أيام</SelectItem>
                    <SelectItem value="WEEKS">أسابيع</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              الجدولة الزمنية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Start Date & Time */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  وقت البدء *
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="startDate">التاريخ</Label>
                  <Select value={formData.startDate} onValueChange={(value) => handleInputChange("startDate", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر التاريخ" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {dateOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">الوقت</Label>
                  <Select value={formData.startTime} onValueChange={(value) => handleInputChange("startTime", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الوقت" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {timeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* End Date & Time */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  وقت الانتهاء (اختياري)
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="endDate">التاريخ</Label>
                  <Select value={formData.endDate} onValueChange={(value) => handleInputChange("endDate", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر التاريخ" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {dateOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">الوقت</Label>
                  <Select value={formData.endTime} onValueChange={(value) => handleInputChange("endTime", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الوقت" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {timeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              الموقع
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="locationText">وصف الموقع</Label>
              <Textarea
                id="locationText"
                value={formData.locationText}
                onChange={(e) => handleInputChange("locationText", e.target.value)}
                placeholder="مثال: مكتب الشركة - الدور الثالث - برج النيل"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>تحديد الموقع على الخريطة</Label>
              <LeafletMapPicker
                value={location || undefined}
                onChange={handleLocationSelect}
                heightClass="h-72"
              />
              {location && (
                <p className="text-sm text-muted-foreground">
                  الإحداثيات: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>ملاحظات إضافية</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="أي ملاحظات أو متطلبات خاصة..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4 pt-6">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/service-requests/new">
              إلغاء
            </Link>
          </Button>
          <Button type="submit" disabled={loading || loadingUsers || loadingServices}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            حفظ طلب الحراسة
          </Button>
        </div>
      </form>
    </div>
  );
}
