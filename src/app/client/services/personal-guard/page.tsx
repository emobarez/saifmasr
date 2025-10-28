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
import { UploadField, type UploadedFile } from "@/components/ui/upload-field";

const SERVICE_SLUG = "personal-guard";

// Armament options aligned with current Prisma enum ArmamentLevel
// STANDARD | ARMED | SUPERVISOR | MIXED
const ARMAMENT_OPTIONS = [
  { value: "STANDARD", label: "بدون سلاح / عادي" },
  { value: "ARMED", label: "مسلّح" },
  { value: "SUPERVISOR", label: "مشرف أمني" },
  { value: "MIXED", label: "مزيج" },
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
  const [serviceMeta, setServiceMeta] = useState<any | null>(null);

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
    armamentLevel: "STANDARD",
    specialNotes: "",
    remindBefore24h: true,
    isDraft: false,
    attachments: [] as UploadedFile[],
  });

  // Load admin-defined service metadata (including price)
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

  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Calculate total price automatically based on service price and headcount
  const totalPrice = useMemo(() => {
    const basePrice = serviceMeta?.price || 0;
    const count = Number(form.headcount) || 1;
    return basePrice * count;
  }, [serviceMeta?.price, form.headcount]);

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
      toast({ title: "لم يتم تحديد نوع الخدمة", description: "يرجى الاتصال بالدعم لإكمال الطلب.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        serviceId,
        title: form.title,
        description: form.description || "طلب خدمة حارس شخصي",
        // top-level
        personnelCount: Number(form.headcount),
        startAt: form.startAt ? new Date(form.startAt).toISOString() : undefined,
        endAt: form.endAt ? new Date(form.endAt).toISOString() : undefined,
        locationText: form.address || undefined,
        locationLat: form.locationLat ? Number(form.locationLat) : undefined,
        locationLng: form.locationLng ? Number(form.locationLng) : undefined,
        armamentLevel: form.armamentLevel,
        notifyBeforeHours: form.remindBefore24h ? 24 : 0,
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
          specialNotes: "",
          attachments: [],
        }));
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
            {serviceMeta?.price && (
              <div className="space-y-2 md:col-span-2">
                <Label>السعر</Label>
                <div className="p-3 bg-muted rounded-md space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">سعر الفرد الواحد:</span>
                    <span className="font-medium">{serviceMeta.price.toLocaleString('ar-EG')} ج.م</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">عدد الأفراد:</span>
                    <span className="font-medium">×{form.headcount}</span>
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
