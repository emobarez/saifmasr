"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2, User, Users } from "lucide-react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";

interface User {
  id: string;
  name: string;
  email: string;
}

interface Service {
  id: string;
  name: string;
  category: string;
}

export default function NewServiceRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [formData, setFormData] = useState({
    userId: "",
    serviceId: "",
    title: "",
    description: "",
    priority: "MEDIUM",
    status: "PENDING"
  });

  // Load users and services
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

    setLoading(true);

    try {
      const response = await fetch("/api/service-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: formData.userId,
          serviceId: formData.serviceId,
          title: formData.title.trim(),
          description: formData.description.trim(),
          priority: formData.priority,
          status: formData.status
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "فشل في إضافة طلب الخدمة");
      }

      toast({
        title: "تم بنجاح",
        description: "تم إضافة طلب الخدمة الجديد بنجاح"
      });

      router.push("/admin/service-requests");
    } catch (error) {
      console.error("Error creating service request:", error);
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
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 max-w-4xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Button variant="outline" size="icon" asChild className="h-8 w-8 sm:h-9 sm:w-9 shrink-0">
          <Link href="/admin/service-requests">
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold truncate">إضافة طلب خدمة جديد</h1>
          <p className="text-sm sm:text-base text-muted-foreground hidden sm:block">إنشاء طلب خدمة جديد لأحد العملاء</p>
        </div>
      </div>

      {/* Quick Access - Bodyguard Service */}
      <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-orange-900 mb-1">طلب خدمة الحارس الشخصي</h3>
              <p className="text-sm text-orange-700">نموذج متخصص مع حقول إضافية (عدد الأفراد، التسليح، الموقع، الجدولة)</p>
            </div>
            <Button 
              asChild
              className="bg-orange-600 hover:bg-orange-700 text-white shrink-0"
            >
              <Link href="/admin/service-requests/bodyguard/new">
                <Users className="h-4 w-4 mr-2" />
                إنشاء طلب حراسة
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>بيانات طلب الخدمة</CardTitle>
          <CardDescription>
            املأ النموذج أدناه لإضافة طلب خدمة جديد
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Client Selection */}
              <div className="space-y-2">
                <Label htmlFor="userId" className="text-sm sm:text-base">العميل *</Label>
                <Select value={formData.userId} onValueChange={(value) => handleInputChange("userId", value)}>
                  <SelectTrigger className="h-10 sm:h-11">
                    <SelectValue placeholder={loadingUsers ? "جاري التحميل..." : "اختر العميل"} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <User className="h-4 w-4" />
                          <span>{user.name} ({user.email})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Service Selection */}
              <div className="space-y-2">
                <Label htmlFor="serviceId" className="text-sm sm:text-base">الخدمة المطلوبة *</Label>
                <Select value={formData.serviceId} onValueChange={(value) => handleInputChange("serviceId", value)}>
                  <SelectTrigger className="h-10 sm:h-11">
                    <SelectValue placeholder={loadingServices ? "جاري التحميل..." : "اختر الخدمة"} />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <span>{service.name}</span>
                          {service.category && (
                            <span className="text-sm text-muted-foreground">({service.category})</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">حالة الطلب</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">في الانتظار</SelectItem>
                    <SelectItem value="IN_PROGRESS">قيد التنفيذ</SelectItem>
                    <SelectItem value="COMPLETED">مكتمل</SelectItem>
                    <SelectItem value="CANCELLED">ملغي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">عنوان الطلب *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="مثال: طلب حراسة أمنية للمكتب الرئيسي"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">وصف الطلب</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="تفاصيل إضافية حول الطلب ومتطلباته..."
                rows={4}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 space-x-reverse pt-6">
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/service-requests">
                  إلغاء
                </Link>
              </Button>
              <Button type="submit" disabled={loading || loadingUsers || loadingServices}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                حفظ الطلب
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}