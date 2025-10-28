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

const SERVICE_SLUG = "regular-security";

const FACILITY_TYPES = ["سكني", "تجاري", "صناعي", "حكومي", "خاص"];
const SHIFT_SYSTEMS = [
  { value: "8", label: "8 ساعات" },
  { value: "12", label: "12 ساعة" },
];
const CONTRACT_DURATION = [
  { value: "MONTHLY", label: "شهري" },
  { value: "YEARLY", label: "سنوي" },
];
// Align with Prisma enum ArmamentLevel: STANDARD | ARMED | SUPERVISOR | MIXED
const ARMAMENT_OPTIONS = [
  { value: "STANDARD", label: "بدون سلاح / عادي" },
  { value: "ARMED", label: "مسلّح" },
  { value: "SUPERVISOR", label: "مشرف أمني" },
  { value: "MIXED", label: "مزيج" },
];

export default function RegularSecurityRequestPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serviceMeta, setServiceMeta] = useState<any | null>(null);

  const [form, setForm] = useState({
    serviceId: "",
    title: "طلب خدمة الأمن النظامي",
    description: "",
    guards: 1,
    shiftSystem: "8",
    facilityType: FACILITY_TYPES[0],
    contractDuration: "MONTHLY",
    address: "",
    armamentLevel: "STANDARD",
    equipment: {
      metalDetector: false,
      radios: false,
      patrolCars: 0,
    },
    remindBefore24h: true,
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

  const handleChange = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  // Calculate total price automatically
  const totalPrice = useMemo(() => {
    const basePrice = serviceMeta?.price || 0;
    const count = Number(form.guards) || 1;
    return basePrice * count;
  }, [serviceMeta?.price, form.guards]);

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
          handleChange("serviceId", match.id);
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
        description: form.description || "طلب خدمة الأمن النظامي",
        personnelCount: Number(form.guards),
        locationText: form.address || undefined,
        armamentLevel: form.armamentLevel,
        notifyBeforeHours: form.remindBefore24h ? 24 : 0,
        totalCost: totalPrice > 0 ? totalPrice : undefined,
        isDraft: asDraft || form.isDraft,
        details: {
          shiftSystem: form.shiftSystem,
          facilityType: form.facilityType,
          contractDuration: form.contractDuration,
          equipment: form.equipment,
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
      <h1 className="text-3xl font-bold">خدمة الأمن النظامي</h1>
      
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
                <span className="text-muted-foreground">/ للفرد</span>
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
          <CardDescription>املأ التفاصيل لتأمين موقعك</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>نوع المنشأة</Label>
              <Select value={form.facilityType} onValueChange={(v) => handleChange("facilityType", v)}>
                <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>
                  {FACILITY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>عدد الحراس</Label>
              <Input type="number" min={1} value={form.guards}
                     onChange={(e) => handleChange("guards", Number(e.target.value))} />
            </div>
            {serviceMeta?.price && (
              <div className="space-y-2">
                <Label>السعر</Label>
                <div className="p-3 bg-muted rounded-md space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">سعر الحارس الواحد:</span>
                    <span className="font-medium">{serviceMeta.price.toLocaleString('ar-EG')} ج.م</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">عدد الحراس:</span>
                    <span className="font-medium">×{form.guards}</span>
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
              <Label>مدة العقد</Label>
              <Select value={form.contractDuration} onValueChange={(v) => handleChange("contractDuration", v)}>
                <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>
                  {CONTRACT_DURATION.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>نظام الشفتات</Label>
              <Select value={form.shiftSystem} onValueChange={(v) => handleChange("shiftSystem", v)}>
                <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>
                  {SHIFT_SYSTEMS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>العنوان والموقع</Label>
              <Input placeholder="العنوان" value={form.address}
                     onChange={(e) => handleChange("address", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>مستوى التسليح</Label>
              <Select value={form.armamentLevel} onValueChange={(v) => handleChange("armamentLevel", v)}>
                <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>
                  {ARMAMENT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>أجهزة إضافية</Label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Checkbox checked={form.equipment.metalDetector}
                            onCheckedChange={(v) => handleChange("equipment", { ...form.equipment, metalDetector: !!v })} />
                  <span>كشف معادن</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={form.equipment.radios}
                            onCheckedChange={(v) => handleChange("equipment", { ...form.equipment, radios: !!v })} />
                  <span>أجهزة لاسلكي</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>سيارات دورية:</span>
                  <Input className="w-24" type="number" min={0} value={form.equipment.patrolCars}
                         onChange={(e) => handleChange("equipment", { ...form.equipment, patrolCars: Number(e.target.value) })} />
                </div>
              </div>
            </div>
            {/* السعر يُسحب من إدارة الخدمة */}
            <div className="space-y-2">
              <Label>سعر الفرد (من الإدارة)</Label>
              <Input readOnly value={serviceMeta?.price ?? "—"} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>ملاحظات</Label>
              <Textarea value={form.description}
                        onChange={(e) => handleChange("description", e.target.value)} />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <Checkbox id="remind24" checked={form.remindBefore24h}
                        onCheckedChange={(v) => handleChange("remindBefore24h", !!v)} />
              <Label htmlFor="remind24">إشعار قبل 24 ساعة</Label>
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
