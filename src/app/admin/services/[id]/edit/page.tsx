"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Loader2, ListPlus, X, Shield, Camera, Users, Building, Car, Sparkles, Headphones as HeadphonesIcon } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

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

export default function EditServicePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const id = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        title: "الميزة موجودة",
        description: "قمت بإضافة هذه الميزة سابقاً",
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

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/services/${id}`);
        if (!res.ok) throw new Error("تعذر تحميل الخدمة");
        const data = await res.json();
        setFormData({
          name: data.name || "",
          slug: data.slug || "",
          description: data.description || "",
          shortDescription: data.shortDescription || "",
          category: data.category || "",
          price: typeof data.price === "number" ? String(data.price) : "",
          duration: data.duration || "",
          status: (data.status || "ACTIVE").toUpperCase(),
          icon: data.icon || "",
          displayOrder: typeof data.displayOrder === "number" ? String(data.displayOrder) : "0",
          isFeatured: Boolean(data.isFeatured),
          ctaLabel: data.ctaLabel || "",
          ctaUrl: data.ctaUrl || ""
        });
        setFeatures(Array.isArray(data.features) ? data.features : []);
      } catch (e: any) {
        toast({ title: "خطأ", description: e?.message || "تعذر تحميل الخدمة", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id, toast]);

  const selectedIconComponent = useMemo(() => {
    const key = formData.icon as keyof typeof ICON_COMPONENTS;
    return ICON_COMPONENTS[key];
  }, [formData.icon]);
  const IconPreview = selectedIconComponent;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          description: formData.description.trim() || null,
          shortDescription: formData.shortDescription.trim() || null,
          category: formData.category || null,
          price: formData.price ? Number(formData.price) : null,
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
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "تعذر حفظ التعديلات");
      }
      toast({ title: "تم الحفظ", description: "تم تحديث بيانات الخدمة." });
      router.push(`/admin/services/${id}`);
    } catch (e: any) {
      toast({ title: "خطأ", description: e?.message || "حدث خطأ أثناء الحفظ", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">جاري التحميل...</div>;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center space-x-4 space-x-reverse">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/admin/services/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">تعديل الخدمة</h1>
          <p className="text-muted-foreground">تحديث البيانات المعروضة للعملاء ولوحة التحكم</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بيانات الخدمة</CardTitle>
          <CardDescription>حرر حقول الخدمة التالية ثم احفظ التعديلات</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">اسم الخدمة *</Label>
                <Input id="name" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">المعرف النصي (Slug) *</Label>
                <Input id="slug" value={formData.slug} onChange={(e) => handleInputChange("slug", e.target.value)} required />
                <p className="text-xs text-muted-foreground">يحدد رابط الخدمة للعميل</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">التصنيف</Label>
                <Select value={formData.category} onValueChange={(v) => handleInputChange("category", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر" />
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
                    <span>معاينة أيقونة العميل</span>
                  </div>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">السعر</Label>
                <Input id="price" type="number" min="0" step="0.01" value={formData.price} onChange={(e) => handleInputChange("price", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">المدة</Label>
                <Input id="duration" value={formData.duration} onChange={(e) => handleInputChange("duration", e.target.value)} placeholder="مثال: شهري" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">الحالة</Label>
                <Select value={formData.status} onValueChange={(v) => handleInputChange("status", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">نشطة</SelectItem>
                    <SelectItem value="INACTIVE">غير نشطة</SelectItem>
                    <SelectItem value="DRAFT">مسودة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayOrder">ترتيب العرض</Label>
                <Input id="displayOrder" type="number" value={formData.displayOrder} onChange={(e) => handleInputChange("displayOrder", e.target.value)} />
              </div>
              <div className="flex items-start gap-3 pt-6">
                <Checkbox id="isFeatured" checked={formData.isFeatured} onCheckedChange={(checked) => handleInputChange("isFeatured", !!checked)} />
                <div className="space-y-1">
                  <Label htmlFor="isFeatured">تمييز الخدمة</Label>
                  <p className="text-xs text-muted-foreground">تظهر في قسم الخدمات المميزة للعملاء</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="shortDescription">وصف مختصر</Label>
                <Textarea id="shortDescription" value={formData.shortDescription} onChange={(e) => handleInputChange("shortDescription", e.target.value)} rows={2} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ctaLabel">نص زر الطلب</Label>
                <Input id="ctaLabel" value={formData.ctaLabel} onChange={(e) => handleInputChange("ctaLabel", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ctaUrl">رابط زر الطلب</Label>
                <Input id="ctaUrl" value={formData.ctaUrl} onChange={(e) => handleInputChange("ctaUrl", e.target.value)} placeholder="اتركه فارغاً لاستخدام الرابط الافتراضي" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => handleInputChange("description", e.target.value)} rows={4} />
            </div>

            <div className="space-y-3">
              <Label htmlFor="featureInput">مزايا الخدمة</Label>
              <div className="flex flex-col gap-2 md:flex-row">
                <Input id="featureInput" value={featureDraft} onChange={(e) => setFeatureDraft(e.target.value)} placeholder="اكتب ميزة ثم اضغط إضافة" />
                <Button type="button" variant="secondary" className="md:w-auto" onClick={addFeature} disabled={!featureDraft.trim()}>
                  <ListPlus className="h-4 w-4 ml-2" />
                  إضافة ميزة
                </Button>
              </div>
              {features.length > 0 && (
                <ul className="space-y-2">
                  {features.map((feature, index) => (
                    <li key={`${feature}-${index}`} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                      <span className="pr-3">{feature}</span>
                      <Button type="button" size="icon" variant="ghost" onClick={() => removeFeature(index)} aria-label="حذف الميزة">
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end space-x-4 space-x-reverse pt-6">
              <Button type="button" variant="outline" asChild>
                <Link href={`/admin/services/${id}`}>إلغاء</Link>
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" /> حفظ
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
