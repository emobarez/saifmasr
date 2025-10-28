"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Save, Send } from "lucide-react";

const SERVICE_SLUG = "security-training";
const TRAINING_TYPES = ["حماية شخصيات", "أمن منشآت", "دفاع عن النفس", "إسعافات أولية", "مكافحة حريق"];
const TRAINING_DURATION = ["دورة قصيرة", "دورة متوسطة"];
const TRAINING_LOCATION = ["مركز تدريب", "موقع العميل"];

export default function SecurityTrainingRequestPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [serviceMeta, setServiceMeta] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadService = async () => {
      try {
        const res = await fetch("/api/services");
        const services = await res.json();
        const match = services.find((s: any) => (s.slug || "") === SERVICE_SLUG);
        if (match) {
          setServiceMeta(match);
          setForm((p) => ({ ...p, serviceId: match.id }));
        }
      } catch (error) {
        console.error("Failed to load service", error);
      }
    };
    loadService();
  }, []);

  const totalPrice = useMemo(() => {
    const basePrice = serviceMeta?.price || 0;
    const count = Number(form.traineesCount) || 1;
    return basePrice * count;
  }, [serviceMeta?.price, form.traineesCount]);

  const [form, setForm] = useState({
    serviceId: "",
    title: "طلب تدريبات أمنية",
    description: "",
    trainingType: TRAINING_TYPES[0],
    traineesCount: 1,
    duration: TRAINING_DURATION[0],
    location: TRAINING_LOCATION[0],
    requestCall: true,
    isDraft: false,
  });

  const submit = async (asDraft = false) => {
    if (!user) { toast({ title: "يجب تسجيل الدخول", variant: "destructive" }); return; }

    let serviceId = form.serviceId;
    if (!serviceId) {
      try {
        const res = await fetch("/api/services");
        const services = await res.json();
        const match = services.find((s: any) => (s.slug || "") === SERVICE_SLUG);
        if (match) {
          serviceId = match.id;
          setForm((p) => ({ ...p, serviceId: match.id }));
        }
      } catch (error) {
        console.error("Failed to resolve service by slug", error);
      }
    }

    if (!serviceId) { toast({ title: "لم يتم تحديد نوع الخدمة", variant: "destructive" }); return; }

    setIsSubmitting(true);
    try {
      const payload = {
        serviceId,
        title: form.title,
        description: form.description || "طلب تدريب",
        headcount: Number(form.traineesCount),
        details: {
          trainingType: form.trainingType,
          duration: form.duration,
          location: form.location,
          requestCall: form.requestCall,
        },
        isDraft: asDraft || form.isDraft,
      } as any;

      const res = await fetch("/api/service-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error((await res.json()).error || "فشل إنشاء الطلب");

      toast({ title: asDraft ? "تم حفظ المسودة" : "تم إرسال الطلب" });
    } catch (e: any) {
      toast({ title: "حدث خطأ", description: e.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">خدمة التدريبات الأمنية</h1>
      <Card>
        <CardHeader>
          <CardTitle>بيانات التدريب</CardTitle>
          <CardDescription>حدد نوع التدريب وعدد المتدربين</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>نوع التدريب</Label>
              <Select value={form.trainingType} onValueChange={(v) => setForm((p) => ({ ...p, trainingType: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>
                  {TRAINING_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>عدد المتدربين</Label>
              <Input type="number" min={1} value={form.traineesCount}
                     onChange={(e) => setForm((p) => ({ ...p, traineesCount: Number(e.target.value) }))} />
            </div>
            {serviceMeta?.price && form.traineesCount > 0 && (
              <div className="p-3 bg-muted rounded-md space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">سعر المتدرب الواحد:</span>
                  <span className="text-sm font-medium">{Number(serviceMeta.price).toLocaleString('ar-EG')} ج.م</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">عدد المتدربين:</span>
                  <span className="text-sm font-medium">{form.traineesCount}</span>
                </div>
                <div className="h-px bg-border my-2" />
                <div className="flex justify-between items-center">
                  <span className="font-medium">السعر الإجمالي:</span>
                  <span className="text-lg font-bold text-primary">{totalPrice.toLocaleString('ar-EG')} ج.م</span>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>مدة التدريب</Label>
              <Select value={form.duration} onValueChange={(v) => setForm((p) => ({ ...p, duration: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>
                  {TRAINING_DURATION.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الموقع</Label>
              <Select value={form.location} onValueChange={(v) => setForm((p) => ({ ...p, location: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>
                  {TRAINING_LOCATION.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>ملاحظات</Label>
              <Textarea value={form.description}
                        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <Checkbox checked={form.requestCall}
                        onCheckedChange={(v) => setForm((p) => ({ ...p, requestCall: !!v }))} />
              <Label>الاتصال لتحديد السعر</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => submit(true)} disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" /> حفظ كمسودة
            </Button>
            <Button type="button" onClick={() => submit(false)} disabled={isSubmitting || !user}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />} إرسال الطلب
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
