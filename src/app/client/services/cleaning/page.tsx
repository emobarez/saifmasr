"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Save, Send } from "lucide-react";

const SERVICE_SLUG = "cleaning";
const CLEAN_TYPES = ["يومية", "أسبوعية", "عميقة", "بعد الفعاليات"];
const PLACE_SIZE = ["صغير", "متوسط", "كبير"];
const TIME_SLOTS = ["صباحي", "مسائي", "ليلي"];
const PLACE_TYPES = ["فيلا/منزل", "مكتب", "منشأة تجارية"];

export default function CleaningRequestPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serviceMeta, setServiceMeta] = useState<any | null>(null);

  const [form, setForm] = useState({
    serviceId: "",
    title: "طلب خدمة نظافة",
    description: "",
    cleaners: 1,
    cleanType: CLEAN_TYPES[0],
    placeSize: PLACE_SIZE[1],
    timeSlot: TIME_SLOTS[0],
    placeType: PLACE_TYPES[0],
    address: "",
    specialReq: "",
    requestCall: true,
    isDraft: false,
  });

  const handle = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  // Calculate total price automatically
  const totalPrice = useMemo(() => {
    const basePrice = serviceMeta?.price || 0;
    const count = Number(form.cleaners) || 1;
    return basePrice * count;
  }, [serviceMeta?.price, form.cleaners]);(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/services");
        const services = await res.json();
        const match = services.find((s: any) => (s.slug || "") === SERVICE_SLUG);
        if (mounted) {
          setServiceMeta(match || null);
          if (match?.id) handle("serviceId", match.id);
        }
      } catch (e) {
        console.error("Failed to load service", e);
      }
    };
    load();
    return () => { mounted = false; };
  }, [serviceMeta?.price, form.cleaners]);

  useEffect = async (asDraft = false) => {
    if (!user) { toast({ title: "يجب تسجيل الدخول", variant: "destructive" }); return; }
    let serviceId = form.serviceId;
    if (!serviceId) {
      try {
        const res = await fetch("/api/services");
        const services = await res.json();
        const match = services.find((s: any) => (s.slug || "") === SERVICE_SLUG);
        if (match) {
          serviceId = match.id;
          handle("serviceId", match.id);
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
        description: form.description || "طلب خدمة نظافة",
        personnelCount: Number(form.cleaners),
        locationText: form.address || undefined,
        isDraft: asDraft || form.isDraft,
        details: {
          cleanType: form.cleanType,
          placeSize: form.placeSize,
          timeSlot: form.timeSlot,
          placeType: form.placeType,
          specialReq: form.specialReq,
          requestCall: form.requestCall,
        },
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
      <h1 className="text-3xl font-bold">خدمة النظافة (خدمة إضافية)</h1>
      <Card>
        <CardHeader>
          <CardTitle>بيانات الخدمة</CardTitle>
          <CardDescription>حدد تفاصيل الطلب</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>عدد الأفراد</Label>
              <Input type="number" min={1} value={form.cleaners} onChange={(e) => handle("cleaners", Number(e.target.value))} />
            </div>
            {serviceMeta?.price && (
              <div className="space-y-2">
                <Label>السعر</Label>
                <div className="p-3 bg-muted rounded-md space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">سعر الفرد:</span>
                    <span className="font-medium">{serviceMeta.price.toLocaleString('ar-EG')} ج.م</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">عدد الأفراد:</span>
                    <span className="font-medium">×{form.cleaners}</span>
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
            <div className="space-y-2">
              <Label>نوع الخدمة</Label>
              <Select value={form.cleanType} onValueChange={(v) => handle("cleanType", v)}>
                <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>
                  {CLEAN_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>حجم المكان</Label>
              <Select value={form.placeSize} onValueChange={(v) => handle("placeSize", v)}>
                <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>
                  {PLACE_SIZE.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>توقيت الخدمة</Label>
              <Select value={form.timeSlot} onValueChange={(v) => handle("timeSlot", v)}>
                <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الموقع</Label>
              <Select value={form.placeType} onValueChange={(v) => handle("placeType", v)}>
                <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>
                  {PLACE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>العنوان</Label>
              <Input value={form.address} onChange={(e) => handle("address", e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>متطلبات خاصة</Label>
              <Textarea value={form.specialReq} onChange={(e) => handle("specialReq", e.target.value)} />
            </div>
            {/* السعر من الإدارة */}
            <div className="space-y-2">
              <Label>سعر الفرد (من الإدارة)</Label>
              <Input readOnly value={serviceMeta?.price ?? "—"} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" onClick={calc}>
              <Calculator className="h-4 w-4 mr-2" /> احسب التكلفة
            </Button>
            {totalCost !== null && (
              <span className="text-lg font-semibold">الإجمالي: {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(totalCost)}</span>
            )}
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
