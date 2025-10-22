"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function EditServicePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const id = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    duration: "",
    status: "ACTIVE"
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/services/${id}`);
        if (!res.ok) throw new Error("تعذر تحميل الخدمة");
        const s = await res.json();
        setFormData({
          name: s.name || "",
          description: s.description || "",
          category: s.category || "",
          price: typeof s.price === 'number' ? String(s.price) : "",
          duration: s.duration || "",
          status: (s.status || 'ACTIVE')
        });
      } catch (e: any) {
        toast({ title: 'خطأ', description: e?.message || 'تعذر تحميل الخدمة', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const handleInputChange = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          category: formData.category || null,
          price: formData.price ? Number(formData.price) : null,
          duration: formData.duration || null,
          status: formData.status
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'تعذر حفظ التعديلات');
      }
      toast({ title: 'تم الحفظ', description: 'تم تحديث بيانات الخدمة.' });
      router.push(`/admin/services/${id}`);
    } catch (e: any) {
      toast({ title: 'خطأ', description: e?.message || 'حدث خطأ أثناء الحفظ', variant: 'destructive' });
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
          <p className="text-muted-foreground">تحديث بيانات الخدمة</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بيانات الخدمة</CardTitle>
          <CardDescription>حرر حقول الخدمة التالية</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">اسم الخدمة *</Label>
                <Input id="name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">التصنيف</Label>
                <Input id="category" value={formData.category} onChange={(e) => handleInputChange('category', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">السعر</Label>
                <Input id="price" type="number" min="0" step="0.01" value={formData.price} onChange={(e) => handleInputChange('price', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">المدة</Label>
                <Input id="duration" value={formData.duration} onChange={(e) => handleInputChange('duration', e.target.value)} placeholder="مثال: شهري، أسبوعي، يومي..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">الحالة</Label>
                <Select value={formData.status} onValueChange={(v) => handleInputChange('status', v)}>
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} rows={4} />
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
