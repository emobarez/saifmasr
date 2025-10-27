"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Loader2, ListPlus, X, Shield, Camera, Users, Building, Car, HeadphonesIcon, Sparkles } from "lucide-react";
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

const ICON_OPTIONS = [
  { value: "Shield", label: "درع الحماية" },
  { value: "Camera", label: "كاميرا المراقبة" },
  { value: "Users", label: "فريق أمني" },
  { value: "Building", label: "أمن المباني" },
  { value: "Car", label: "نقل آمن" },
  { value: "HeadphonesIcon", label: "استشارات" },
  { value: "Sparkles", label: "خدمة مميزة" }
];

const ICON_COMPONENTS = {
  Shield,
  Camera,
  Users,
  Building,
  Car,
  HeadphonesIcon,
  Sparkles
};

const initialFormState = {
  name: "",
  slug: "",
  description: "",
  shortDescription: "",
  category: "",
  price: "",
  duration: "",
  status: "ACTIVE",
  icon: "",
  displayOrder: "0",
  isFeatured: false,
  ctaLabel: "",
  ctaUrl: ""
};

type FormField = keyof typeof initialFormState;

export default function NewServicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [features, setFeatures] = useState<string[]>([]);
  const [featureDraft, setFeatureDraft] = useState("");

  const handleInputChange = (field: FormField, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: typeof value === "string" ? value : value
    }));
  };

  const addFeature = () => {
    const entry = featureDraft.trim();
    if (!entry) return;
    if (features.includes(entry)) {
      toast({
        title: "المعلومة مضافة مسبقاً",
        description: "هذه الميزة موجودة بالفعل",
        variant: "destructive"
      });
      return;
    }
    setFeatures((prev) => [...prev, entry]);
    setFeatureDraft("");
  };

  const removeFeature = (index: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
  };

  const selectedIconComponent = useMemo(() => {
    const key = formData.icon as keyof typeof ICON_COMPONENTS;
    return ICON_COMPONENTS[key];
  }, [formData.icon]);
  const IconPreview = selectedIconComponent;

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

    if (!formData.slug.trim()) {
      toast({
        title: "المعرف النصي مطلوب",
        description: "أدخل معرفاً فريداً يظهر للعملاء (مثال: personal-guard)",
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
          slug: formData.slug.trim(),
          description: formData.description.trim() || null,
          shortDescription: formData.shortDescription.trim() || null,
          category: formData.category || null,
          price: formData.price ? parseFloat(formData.price) : null,
          duration: formData.duration || null,
          status: formData.status,
          icon: formData.icon || null,
          displayOrder: Number.isFinite(Number(formData.displayOrder)) ? Number(formData.displayOrder) : 0,
          isFeatured: formData.isFeatured,
          features,
          ctaLabel: formData.ctaLabel.trim() || null,
          ctaUrl: formData.ctaUrl.trim() || null
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
          <p className="text-muted-foreground">إنشاء خدمة أمنية جديدة في النظام وإتاحتها للعملاء</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>بيانات الخدمة</CardTitle>
          <CardDescription>
            املأ النموذج أدناه لإضافة خدمة جديدة مع التحكم في طريقة ظهورها للعميل
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              <div className="space-y-2">
                <Label htmlFor="slug">المعرف النصي (Slug) *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange("slug", e.target.value)}
                  placeholder="مثال: personal-guard"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  يستخدم في روابط العملاء وعمليات الربط مع نماذج الطلب
                </p>
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="icon">أيقونة العرض</Label>
                <Select value={formData.icon} onValueChange={(value) => handleInputChange("icon", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الأيقونة" />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((icon) => (
                      <SelectItem key={icon.value} value={icon.value}>
                        {icon.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {IconPreview ? (
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <IconPreview className="h-4 w-4" />
                    <span>ستظهر هذه الأيقونة في صفحة الخدمات للعملاء</span>
                  </div>
                ) : null}
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="duration">المدة</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => handleInputChange("duration", e.target.value)}
                  placeholder="مثال: شهري، أسبوعي، يومي..."
                />
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="displayOrder">ترتيب العرض</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => handleInputChange("displayOrder", e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">الأرقام الأصغر تظهر أولاً للعميل</p>
              </div>

              <div className="flex items-start gap-3 pt-6">
                <Checkbox
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => handleInputChange("isFeatured", !!checked)}
                />
                <div className="space-y-1">
                  <Label htmlFor="isFeatured">تمييز الخدمة في صفحة العميل</Label>
                  <p className="text-xs text-muted-foreground">
                    تظهر الخدمة في قائمة مميزة وتُستخدم في الحملات التسويقية
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="shortDescription">وصف مختصر</Label>
                <Textarea
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) => handleInputChange("shortDescription", e.target.value)}
                  placeholder="سطر تعريفي قصير يظهر على بطاقة الخدمة في صفحة العملاء"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ctaLabel">نص زر الطلب</Label>
                <Input
                  id="ctaLabel"
                  value={formData.ctaLabel}
                  onChange={(e) => handleInputChange("ctaLabel", e.target.value)}
                  placeholder="مثال: اطلب الآن"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ctaUrl">رابط زر الطلب (اختياري)</Label>
                <Input
                  id="ctaUrl"
                  value={formData.ctaUrl}
                  onChange={(e) => handleInputChange("ctaUrl", e.target.value)}
                  placeholder="مثال: /client/services/personal-guard"
                />
                <p className="text-xs text-muted-foreground">
                  اتركه فارغاً لاستخدام الرابط الافتراضي بناءً على المعرف النصي
                </p>
              </div>
            </div>

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

            <div className="space-y-3">
              <Label htmlFor="featureInput">مزايا الخدمة</Label>
              <div className="flex flex-col gap-2 md:flex-row">
                <Input
                  id="featureInput"
                  value={featureDraft}
                  onChange={(e) => setFeatureDraft(e.target.value)}
                  placeholder="اكتب ميزة ثم اضغط إضافة"
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="md:w-auto"
                  onClick={addFeature}
                  disabled={!featureDraft.trim()}
                >
                  <ListPlus className="h-4 w-4 ml-2" />
                  إضافة ميزة
                </Button>
              </div>
              {features.length > 0 && (
                <ul className="space-y-2">
                  {features.map((feature, index) => (
                    <li key={feature} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                      <span className="pr-3">{feature}</span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeFeature(index)}
                        aria-label="حذف الميزة"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

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