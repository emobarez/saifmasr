"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Calculator, Save, Send } from "lucide-react";
import { UploadField, type UploadedFile } from "@/components/ui/upload-field";

// Armament options aligned with prisma enum ArmamentLevel
const ARMAMENT_OPTIONS = [
  { value: "NONE", label: "بدون سلاح" },
  { value: "SOUND_WEAPON", label: "سلاح صوت" },
  { value: "FIREARM", label: "سلاح ناري" },
];

// Shift types captured as details JSON to keep flexible
const SHIFT_OPTIONS = [
  { value: "8_DAY", label: "8 ساعات - صباحي" },
  { value: "8_EVENING", label: "8 ساعات - مسائي" },
  { value: "8_NIGHT", label: "8 ساعات - ليلي" },
  { value: "12_DAY", label: "12 ساعة - صباحي" },
  { value: "12_NIGHT", label: "12 ساعة - مسائي/ليلي" },
  { value: "24_FULL", label: "24 ساعة" },
];

export default function PersonalGuardRequestPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [totalCost, setTotalCost] = useState<number | null>(null);

  const [form, setForm] = useState({
    serviceId: "", // will be auto-selected by name lookup when loaded dynamically; fallback to manual entry
    title: "طلب خدمة الحارس الشخصي",
    description: "",
    headcount: 1,
    startAt: "",
    endAt: "",
    shiftType: "8_DAY",
    address: "",
    locationLat: "",
    locationLng: "",
    armamentLevel: "NONE",
    specialNotes: "",
    remindBefore24h: true,
    isDraft: false,
    unitPrice: "",
    extraCost: "0",
    attachments: [] as UploadedFile[],
  });

  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const calcTotal = () => {
    setIsCalculating(true);
    const headcount = Number(form.headcount || 0);
    const unit = Number(form.unitPrice || 0);
    const extra = Number(form.extraCost || 0);
    const total = headcount * unit + extra;
    setTotalCost(Number.isFinite(total) ? total : 0);
    setIsCalculating(false);
  };

  const submit = async (asDraft = false) => {
    if (!user) {
      toast({ title: "يجب تسجيل الدخول", variant: "destructive" });
      return;
    }

    if (!form.serviceId) {
      // For now, fetch services and auto pick by name if available
      try {
        const res = await fetch("/api/services");
        const services = await res.json();
        const match = services.find((s: any) => s.name.includes("حارس") || s.name.includes("حراسة"));
        if (match) {
          handleChange("serviceId", match.id);
        }
      } catch {}
    }

    if (!form.serviceId) {
      toast({ title: "لم يتم تحديد نوع الخدمة", description: "يرجى الاتصال بالدعم لإكمال الطلب.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        serviceId: form.serviceId,
        title: form.title,
        description: form.description || "طلب خدمة حارس شخصي",
        // top-level
        headcount: Number(form.headcount),
        startAt: form.startAt ? new Date(form.startAt).toISOString() : undefined,
        endAt: form.endAt ? new Date(form.endAt).toISOString() : undefined,
        locationAddress: form.address || undefined,
        locationLat: form.locationLat ? Number(form.locationLat) : undefined,
        locationLng: form.locationLng ? Number(form.locationLng) : undefined,
        armamentLevel: form.armamentLevel,
        unitPrice: form.unitPrice ? Number(form.unitPrice) : undefined,
        extraCost: form.extraCost ? Number(form.extraCost) : 0,
        remindBefore24h: !!form.remindBefore24h,
        isDraft: asDraft || form.isDraft,
        // details JSON keeps shift and notes
        details: {
          shiftType: form.shiftType,
          specialRequirements: form.specialNotes,
        },
        attachments: form.attachments,
      } as any;

      const res = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "خطأ غير معروف" }));
        throw new Error(err.error || "فشل إنشاء الطلب");
      }

      const created = await res.json();
      setTotalCost(created.totalCost ?? totalCost);

      toast({
        title: asDraft ? "تم حفظ المسودة" : "تم إرسال الطلب",
        description: asDraft
          ? "يمكنك العودة لاحقًا لإكمال الطلب."
          : `رقم الطلب: ${created.id}`,
      });

      // Reset basic fields if submitted (not for draft)
      if (!asDraft) {
        setForm((prev) => ({
          ...prev,
          description: "",
          headcount: 1,
          startAt: "",
          endAt: "",
          address: "",
          locationLat: "",
          locationLng: "",
          unitPrice: "",
          extraCost: "0",
          specialNotes: "",
          attachments: [],
        }));
        setTotalCost(null);
      }
    } catch (e: any) {
      toast({ title: "حدث خطأ", description: e.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">خدمة الحارس الشخصي (بودي جارد)</h1>
      <Card>
        <CardHeader>
          <CardTitle>بيانات الطلب</CardTitle>
          <CardDescription>املأ الحقول التالية لطلب خدمة الحارس الشخصي</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>عدد الأفراد</Label>
              <Input type="number" min={1} value={form.headcount}
                     onChange={(e) => handleChange("headcount", Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>نوع الشفت</Label>
              <Select value={form.shiftType} onValueChange={(v) => handleChange("shiftType", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الشفت" />
                </SelectTrigger>
                <SelectContent>
                  {SHIFT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>تاريخ ووقت البداية</Label>
              <Input type="datetime-local" value={form.startAt}
                     onChange={(e) => handleChange("startAt", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>تاريخ ووقت النهاية</Label>
              <Input type="datetime-local" value={form.endAt}
                     onChange={(e) => handleChange("endAt", e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>الموقع والعنوان</Label>
              <Input placeholder="العنوان التفصيلي" value={form.address}
                     onChange={(e) => handleChange("address", e.target.value)} />
              <div className="grid grid-cols-2 gap-3 mt-2">
                <Input placeholder="Latitude" value={form.locationLat}
                       onChange={(e) => handleChange("locationLat", e.target.value)} />
                <Input placeholder="Longitude" value={form.locationLng}
                       onChange={(e) => handleChange("locationLng", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>مستوى التسليح</Label>
              <Select value={form.armamentLevel} onValueChange={(v) => handleChange("armamentLevel", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر مستوى التسليح" />
                </SelectTrigger>
                <SelectContent>
                  {ARMAMENT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>سعر الفرد</Label>
              <Input type="number" min={0} value={form.unitPrice}
                     onChange={(e) => handleChange("unitPrice", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>تكلفة إضافية</Label>
              <Input type="number" min={0} value={form.extraCost}
                     onChange={(e) => handleChange("extraCost", e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>متطلبات خاصة وملاحظات</Label>
              <Textarea placeholder="مثال: حارس يتحدث الإنجليزية، لديه رخصة قيادة..."
                        value={form.specialNotes}
                        onChange={(e) => handleChange("specialNotes", e.target.value)} />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <Checkbox id="remind24" checked={form.remindBefore24h}
                        onCheckedChange={(v) => handleChange("remindBefore24h", !!v)} />
              <Label htmlFor="remind24">إشعار بالمتابعة قبل 24 ساعة</Label>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" onClick={calcTotal}>
              {isCalculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />} احسب التكلفة
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

      <Card>
        <CardHeader>
          <CardTitle>المرفقات</CardTitle>
          <CardDescription>أرفق صورًا أو وثائق لدعم الطلب.</CardDescription>
        </CardHeader>
        <CardContent>
          <UploadField onChange={(files) => setForm((p) => ({ ...p, attachments: files }))} />
        </CardContent>
      </Card>
    </div>
  );
}
