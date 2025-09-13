"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Send } from "lucide-react";

export default function ClientRequestsPage() {
  const [formData, setFormData] = useState({
    serviceType: "",
    priority: "",
    description: "",
    location: "",
    contactPerson: "",
    phone: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Service request submitted:", formData);
    // Here you would typically send the data to your API
    alert("تم إرسال طلب الخدمة بنجاح!");
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">طلب خدمة جديدة</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            تفاصيل الطلب
          </CardTitle>
          <CardDescription>
            يرجى ملء جميع البيانات المطلوبة لتقديم طلب الخدمة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="serviceType">نوع الخدمة المطلوبة</Label>
                <Select value={formData.serviceType} onValueChange={(value) => handleInputChange("serviceType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع الخدمة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="security-guards">حراسة أمنية</SelectItem>
                    <SelectItem value="event-security">تأمين فعاليات</SelectItem>
                    <SelectItem value="consulting">استشارات أمنية</SelectItem>
                    <SelectItem value="investigations">تحقيقات خاصة</SelectItem>
                    <SelectItem value="training">تدريب أمني</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">أولوية الطلب</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الأولوية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">عاجل</SelectItem>
                    <SelectItem value="high">عالية</SelectItem>
                    <SelectItem value="medium">متوسطة</SelectItem>
                    <SelectItem value="low">منخفضة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">الموقع</Label>
                <Input
                  id="location"
                  placeholder="أدخل عنوان الموقع"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPerson">الشخص المسؤول</Label>
                <Input
                  id="contactPerson"
                  placeholder="اسم الشخص المسؤول"
                  value={formData.contactPerson}
                  onChange={(e) => handleInputChange("contactPerson", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  placeholder="رقم الهاتف للتواصل"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">وصف تفصيلي للطلب</Label>
              <Textarea
                id="description"
                placeholder="اكتب وصفاً تفصيلياً للخدمة المطلوبة..."
                className="min-h-[120px]"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                إرسال الطلب
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>معلومات مهمة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">⏰ أوقات الاستجابة</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• الطلبات العاجلة: خلال ساعة واحدة</li>
                <li>• الأولوية العالية: خلال 4 ساعات</li>
                <li>• الأولوية المتوسطة: خلال 24 ساعة</li>
              </ul>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">📞 التواصل المباشر</h3>
              <p className="text-sm text-green-700">
                للطوارئ: 911<br />
                خدمة العملاء: 8001234567<br />
                البريد الإلكتروني: support@company.com
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}