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

const SERVICE_SLUG = "security-consulting";

const CONSULT_TYPES = [
  { value: "RISK_ASSESSMENT", label: "تقييم مخاطر" },
  { value: "SECURITY_PLAN", label: "وضع خطة أمنية" },
  { value: "SECURITY_AUDIT", label: "تدقيق أمني" },
  { value: "GENERAL", label: "استشارة عامة" },
];
const CLIENT_TYPES = ["فرد", "شركة صغيرة", "شركة متوسطة", "مؤسسة كبيرة"];

export default function SecurityConsultingRequestPage() {
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

  const [form, setForm] = useState({
    serviceId: "",
    title: "طلب استشارات أمنية",
    description: "",
    consultType: CONSULT_TYPES[0].value,
    clientNature: CLIENT_TYPES[0],
    specialRequirements: "",
    scheduleAt: "",
    requestCall: true,
    attachments: [] as string[], // temp: URLs
    isDraft: false,
    price: "",
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
        description: form.description || "طلب استشارات أمنية",
        startAt: form.scheduleAt ? new Date(form.scheduleAt).toISOString() : undefined,
        unitPrice: form.price ? Number(form.price) : undefined,
        totalCost: serviceMeta?.price ? Number(serviceMeta.price) : (form.price ? Number(form.price) : undefined),
        isDraft: asDraft || form.isDraft,
        details: {
          consultType: form.consultType,
          clientNature: form.clientNature,
          specialRequirements: form.specialRequirements,
          requestCall: form.requestCall,
          attachments: form.attachments,
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
      <h1 className="text-3xl font-bold">خدمة الاستشارات الأمنية</h1>

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
          <CardDescription>حدد نوع الاستشارة ووقت الموعد</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>نوع الاستشارة</Label>
              <Select value={form.consultType} onValueChange={(v) => setForm((p) => ({ ...p, consultType: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>
                  {CONSULT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {serviceMeta?.price && (
              <div className="p-3 bg-muted rounded-md space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">سعر الاستشارة الموصى به:</span>
                  <span className="text-lg font-bold text-primary">{Number(serviceMeta.price).toLocaleString('ar-EG')} ج.م</span>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>طبيعة العميل</Label>
              <Select value={form.clientNature} onValueChange={(v) => setForm((p) => ({ ...p, clientNature: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>
                  {CLIENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>متطلبات خاصة</Label>
              <Textarea value={form.specialRequirements}
                        onChange={(e) => setForm((p) => ({ ...p, specialRequirements: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>جدولة الموعد</Label>
              <Input type="datetime-local" value={form.scheduleAt}
                     onChange={(e) => setForm((p) => ({ ...p, scheduleAt: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>سعر الاستشارة (اختياري)</Label>
              <Input type="number" min={0} value={form.price}
                     onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} />
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
