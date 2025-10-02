"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";

const SERVICE_CATEGORIES = [
  "حراسة أمنية",
  "أمن المناسبات",
  "حراسة المنشآت",
  "النقل الآمن",
  "الاستشارات الأمنية",
  "أمن المعلومات",
  "التدريب الأمني",
  "أخرى"
];

export default function NewServicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    duration: "",
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
    
    if (!formData.name.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال اسم الخدمة",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          category: formData.category || null,
          price: formData.price ? parseFloat(formData.price) : null,
          duration: formData.duration || null,
          status: formData.status
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "فشل في إضافة الخدمة");
      }

      toast({
        title: "تم بنجاح",
        description: "تم إضافة الخدمة الجديدة بنجاح"
      });

      router.push("/admin/services");
    } catch (error) {
      console.error("Error creating service:", error);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 space-x-reverse">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/services">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">إضافة خدمة جديدة</h1>
          <p className="text-muted-foreground">إنشاء خدمة أمنية جديدة في النظام</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>بيانات الخدمة</CardTitle>
          <CardDescription>
            املأ النموذج أدناه لإضافة خدمة جديدة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Service Name */}
              <div className="space-y-2">
                <Label htmlFor="name">اسم الخدمة *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="مثال: حراسة المكاتب"
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">تصنيف الخدمة</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر تصنيف الخدمة" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price">السعر (جنيه مصري)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  placeholder="0.00"
                />
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration">المدة</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => handleInputChange("duration", e.target.value)}
                  placeholder="مثال: شهري، أسبوعي، يومي..."
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">حالة الخدمة</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">نشطة</SelectItem>
                    <SelectItem value="INACTIVE">غير نشطة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">وصف الخدمة</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="وصف تفصيلي للخدمة وما تشمله..."
                rows={4}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 space-x-reverse pt-6">
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/services">
                  إلغاء
                </Link>
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                حفظ الخدمة
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}