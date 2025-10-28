"use client";

import { useEffect, useState, useMemo } from "react";
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

const SERVICE_SLUG = "cctv-installation";
const CAMERA_TYPES = ["داخلية", "خارجية", "لاسلكية", "سلكية", "متحركة", "ثابتة"];
const EXTRA_FEATURES = ["رؤية ليلية", "تسجيل سحابي", "كشف حركة", "صوت"];
const INSTALL_SERVICES = [
  { value: "INSTALL_ONLY", label: "تركيب فقط" },
  { value: "INSTALL_AND_MAINT", label: "تركيب وصيانة" },
  { value: "INSTALL_AND_NETWORK", label: "تركيب وتكوين شبكة" },
];

export default function CCTVInstallationRequestPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serviceMeta, setServiceMeta] = useState<any | null>(null);

  const [form, setForm] = useState({
    serviceId: "",
    title: "طلب تركيب كاميرات المراقبة",
    description: "",
    cameraTypes: [] as string[],
    cameraCount: 1,
    locations: "",
    features: [] as string[],
    serviceOption: "INSTALL_ONLY",
    scheduleAt: "",
    requestInspectionCall: true,
    isDraft: false,
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/services");
        const services = await res.json();
        const match = services.find((s: any) => (s.slug || "") === SERVICE_SLUG);
        if (mounted) {
          setServiceMeta(match || null);
          if (match?.id) setForm((p) => ({ ...p, serviceId: match.id }));
        }
      } catch (e) {
        console.error("Failed to load service", e);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const totalPrice = useMemo(() => {
    const basePrice = serviceMeta?.price || 0;
    const count = Number(form.cameraCount) || 1;
    return basePrice * count;
  }, [serviceMeta?.price, form.cameraCount]);

  const toggleArray = (key: keyof typeof form, value: string) => {
    setForm((prev) => {
      const list = new Set([...(prev[key] as string[])]);
      if (list.has(value)) list.delete(value); else list.add(value);
      return { ...prev, [key]: Array.from(list) } as any;
    });
  };

  const submit = async (asDraft = false) => {
    if (!user) {
      toast({ title: "يجب تسجيل الدخول", variant: "destructive" });
      return;
    }

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

    if (!serviceId) {
      toast({ title: "لم يتم تحديد نوع الخدمة", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        serviceId,
        title: form.title,
        description: form.description || "طلب تركيب كاميرات",
        startAt: form.scheduleAt ? new Date(form.scheduleAt).toISOString() : undefined,
        isDraft: asDraft || form.isDraft,
        details: {
          cameraTypes: form.cameraTypes,
          cameraCount: Number(form.cameraCount),
          locations: form.locations,
          features: form.features,
          serviceOption: form.serviceOption,
          requestInspectionCall: form.requestInspectionCall,
        },
      } as any;

      const res = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
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
      <h1 className="text-3xl font-bold">تركيب كاميرات المراقبة</h1>

      {/* Service Details Card */}
      {serviceMeta && (serviceMeta.description || serviceMeta.shortDescription || (serviceMeta.features && serviceMeta.features.length > 0)) && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle>عن الخدمة</CardTitle>
            {serviceMeta.shortDescription && (
              <CardDescription className="text-base">{serviceMeta.shortDescription}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {serviceMeta.description && (
              <p className="text-muted-foreground">{serviceMeta.description}</p>
            )}
            {serviceMeta.features && serviceMeta.features.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">مزايا الخدمة:</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {serviceMeta.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0 mt-2"></div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {serviceMeta.price && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">السعر المبدئي:</span>
                <span className="font-bold text-primary text-lg">{Number(serviceMeta.price).toLocaleString('ar-EG')} ج.م</span>
                <span className="text-muted-foreground">/ للوحدة</span>
              </div>
            )}
            {serviceMeta.duration && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">المدة:</span>
                <span className="font-medium">{serviceMeta.duration}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>بيانات الطلب</CardTitle>
          <CardDescription>حدد مواصفات النظام المطلوب</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label>نوع الكاميرات</Label>
              <div className="grid grid-cols-2 gap-3">
                {CAMERA_TYPES.map((t) => (
                  <label key={t} className="flex items-center gap-2">
                    <Checkbox checked={form.cameraTypes.includes(t)} onCheckedChange={() => toggleArray("cameraTypes", t)} />
                    <span>{t}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>عدد الكاميرات</Label>
              <Input type="number" min={1} value={form.cameraCount}
                     onChange={(e) => setForm((p) => ({ ...p, cameraCount: Number(e.target.value) }))} />
            </div>
            {serviceMeta?.price && (
              <div className="space-y-2">
                <Label>السعر</Label>
                <div className="p-3 bg-muted rounded-md space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">سعر الكاميرا:</span>
                    <span className="font-medium">{serviceMeta.price.toLocaleString('ar-EG')} ج.م</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">عدد الكاميرات:</span>
                    <span className="font-medium">×{form.cameraCount}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">السعر الإجمالي:</span>
                      <span className="text-lg font-bold text-primary">{totalPrice.toLocaleString('ar-EG')} ج.م</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-2 md:col-span-2">
              <Label>مواقع التركيب</Label>
              <Textarea placeholder="حدد الأماكن المراد تركيب الكاميرات فيها" value={form.locations}
                        onChange={(e) => setForm((p) => ({ ...p, locations: e.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>ميزات إضافية</Label>
              <div className="grid grid-cols-2 gap-3">
                {EXTRA_FEATURES.map((t) => (
                  <label key={t} className="flex items-center gap-2">
                    <Checkbox checked={form.features.includes(t)} onCheckedChange={() => toggleArray("features", t)} />
                    <span>{t}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>خدمات التركيب</Label>
              <Select value={form.serviceOption} onValueChange={(v) => setForm((p) => ({ ...p, serviceOption: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>
                  {INSTALL_SERVICES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>جدولة الموعد</Label>
              <Input type="datetime-local" value={form.scheduleAt}
                     onChange={(e) => setForm((p) => ({ ...p, scheduleAt: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <Checkbox checked={form.requestInspectionCall}
                        onCheckedChange={(v) => setForm((p) => ({ ...p, requestInspectionCall: !!v }))} />
              <Label>الاتصال للمعاينة وتحديد التكلفة</Label>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>ملاحظات</Label>
              <Textarea value={form.description}
                        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
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
