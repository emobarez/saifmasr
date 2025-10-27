"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function EditClientPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    status: "ACTIVE"
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/clients/${id}`);
        if (!res.ok) throw new Error('تعذر تحميل بيانات العميل');
        const c = await res.json();
        setFormData({
          name: c.name || "",
          email: c.email || "",
          phone: c.phone || "",
          company: c.company || "",
          address: c.address || "",
          status: c.status || "ACTIVE"
        });
      } catch (e: any) {
        toast({ title: 'خطأ', description: e?.message || 'تعذر تحميل بيانات العميل', variant: 'destructive' });
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
      const res = await fetch(`/api/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'تعذر حفظ التعديلات');
      }
      toast({ title: 'تم الحفظ', description: 'تم تحديث بيانات العميل.' });
      router.push(`/admin/clients/${id}`);
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
          <Link href={`/admin/clients/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">تعديل العميل</h1>
          <p className="text-muted-foreground">تحديث بيانات العميل</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بيانات العميل</CardTitle>
          <CardDescription>حرر حقول العميل التالية</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">الاسم *</Label>
                <Input id="name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني *</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">الهاتف</Label>
                <Input id="phone" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">الشركة</Label>
                <Input id="company" value={formData.company} onChange={(e) => handleInputChange('company', e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">العنوان</Label>
                <Input id="address" value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">الحالة</Label>
                <Select value={formData.status} onValueChange={(v) => handleInputChange('status', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">نشط</SelectItem>
                    <SelectItem value="INACTIVE">غير نشط</SelectItem>
                    <SelectItem value="BANNED">محظور</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-4 space-x-reverse pt-6">
              <Button type="button" variant="outline" asChild>
                <Link href={`/admin/clients/${id}`}>إلغاء</Link>
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
