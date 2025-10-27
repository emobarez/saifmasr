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
import { Loader2, Save, Send } from "lucide-react";

const SERVICE_SLUG = "event-security";
const EVENT_TYPES = ["مؤتمر", "حفلة", "معرض", "مناسبة خاصة", "فعالية رياضية"];
const EXTRA_REQUIREMENTS = ["تفتيش", "بوابات أمنية", "فرق تدخل سريع", "إسعافات أولية"];
const EQUIPMENT = ["أجهزة كشف معادن", "أجهزة لاسلكي", "حواجز"];

export default function EventSecurityRequestPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    serviceId: "",
    title: "طلب تأمين فعالية",
    description: "",
    eventType: EVENT_TYPES[0],
    attendees: "",
    guardsCount: "",
    staffCount: "",
    startAt: "",
    endAt: "",
    location: "",
    requirements: [] as string[],
    equipment: [] as string[],
    requestCall: true,
    isDraft: false,
  });

  const toggleArray = (key: keyof typeof form, value: string) => {
    setForm((prev) => {
      const list = new Set([...(prev[key] as string[])]);
      if (list.has(value)) list.delete(value); else list.add(value);
      return { ...prev, [key]: Array.from(list) } as any;
    });
  };

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
        description: form.description || "طلب تأمين فعالية",
        startAt: form.startAt ? new Date(form.startAt).toISOString() : undefined,
        endAt: form.endAt ? new Date(form.endAt).toISOString() : undefined,
        locationAddress: form.location || undefined,
        headcount: form.guardsCount ? Number(form.guardsCount) : undefined,
        details: {
          eventType: form.eventType,
          attendees: form.attendees ? Number(form.attendees) : undefined,
          staffCount: form.staffCount ? Number(form.staffCount) : undefined,
          requirements: form.requirements,
          equipment: form.equipment,
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
      <h1 className="text-3xl font-bold">خدمة تأمين فعاليات</h1>
      <Card>
        <CardHeader>
          <CardTitle>بيانات الفعالية</CardTitle>
          <CardDescription>املأ التفاصيل المطلوبة لتأمين فعاليتك</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>نوع الفعالية</Label>
              <Select value={form.eventType} onValueChange={(v) => setForm((p) => ({ ...p, eventType: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>عدد الحضور المتوقع</Label>
              <Input type="number" min={0} value={form.attendees}
                     onChange={(e) => setForm((p) => ({ ...p, attendees: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>عدد أفراد التأمين</Label>
              <Input type="number" min={0} value={form.guardsCount}
                     onChange={(e) => setForm((p) => ({ ...p, guardsCount: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>عدد الطاقم الإداري/الدعم</Label>
              <Input type="number" min={0} value={form.staffCount}
                     onChange={(e) => setForm((p) => ({ ...p, staffCount: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>تاريخ ووقت البداية</Label>
              <Input type="datetime-local" value={form.startAt}
                     onChange={(e) => setForm((p) => ({ ...p, startAt: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>تاريخ ووقت النهاية</Label>
              <Input type="datetime-local" value={form.endAt}
                     onChange={(e) => setForm((p) => ({ ...p, endAt: e.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>الموقع</Label>
              <Input placeholder="مكان إقامة الفعالية" value={form.location}
                     onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>متطلبات خاصة</Label>
              <div className="grid grid-cols-2 gap-3">
                {EXTRA_REQUIREMENTS.map((t) => (
                  <label key={t} className="flex items-center gap-2">
                    <Checkbox checked={form.requirements.includes(t)} onCheckedChange={() => toggleArray("requirements", t)} />
                    <span>{t}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>معدات إضافية</Label>
              <div className="grid grid-cols-2 gap-3">
                {EQUIPMENT.map((t) => (
                  <label key={t} className="flex items-center gap-2">
                    <Checkbox checked={form.equipment.includes(t)} onCheckedChange={() => toggleArray("equipment", t)} />
                    <span>{t}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <Checkbox checked={form.requestCall}
                        onCheckedChange={(v) => setForm((p) => ({ ...p, requestCall: !!v }))} />
              <Label>الاتصال لتحديد السعر</Label>
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
