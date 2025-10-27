"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

export default function NewClientPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    company: "",
    taxId: "",
    notes: "",
    type: "INDIVIDUAL", // INDIVIDUAL or BUSINESS
    status: "ACTIVE"
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء الحقول المطلوبة (الاسم والبريد الإلكتروني)",
        variant: "destructive"
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "خطأ في البريد الإلكتروني",
        description: "يرجى إدخال بريد إلكتروني صحيح",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "تم إنشاء العميل بنجاح",
          description: `تم إضافة العميل ${formData.name} بنجاح`,
        });
        router.push("/admin/clients");
      } else {
        toast({
          title: "خطأ في إنشاء العميل",
          description: result.error || "حدث خطأ أثناء إنشاء العميل",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error creating client:", error);
      toast({
        title: "خطأ في الاتصال",
        description: "تعذر الاتصال بالخادم، يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
          className="h-8 w-8 sm:h-9 sm:w-9 shrink-0"
        >
          <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-2xl font-bold truncate">إضافة عميل جديد</h1>
          <p className="text-sm sm:text-base text-muted-foreground hidden sm:block">إنشاء ملف عميل جديد في النظام</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بيانات العميل</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm sm:text-base">الاسم *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="أدخل اسم العميل"
                  className="text-right h-10 sm:h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="example@domain.com"
                  className="text-right"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+20xxxxxxxxx"
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">نوع العميل</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                  <SelectTrigger className="text-right">
                    <SelectValue placeholder="اختر نوع العميل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INDIVIDUAL">فرد</SelectItem>
                    <SelectItem value="BUSINESS">شركة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Business Information */}
            {formData.type === "BUSINESS" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">اسم الشركة</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => handleInputChange("company", e.target.value)}
                    placeholder="أدخل اسم الشركة"
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxId">الرقم الضريبي</Label>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) => handleInputChange("taxId", e.target.value)}
                    placeholder="أدخل الرقم الضريبي"
                    className="text-right"
                  />
                </div>
              </div>
            )}

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">العنوان</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="أدخل العنوان التفصيلي"
                className="text-right min-h-[80px]"
                rows={3}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">حالة العميل</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="اختر حالة العميل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">نشط</SelectItem>
                  <SelectItem value="INACTIVE">غير نشط</SelectItem>
                  <SelectItem value="SUSPENDED">معلق</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="أدخل أي ملاحظات إضافية عن العميل"
                className="text-right min-h-[100px]"
                rows={4}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    حفظ العميل
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}