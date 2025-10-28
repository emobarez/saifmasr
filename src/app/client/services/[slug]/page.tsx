"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Send, Save, Shield } from "lucide-react";
import Link from "next/link";
import { UploadField, type UploadedFile } from "@/components/ui/upload-field";

// Generic fallback form for any service slug without a bespoke page

// Align with Prisma enum ArmamentLevel: STANDARD | ARMED | SUPERVISOR | MIXED
const ARMAMENT_OPTIONS = [
  { value: "STANDARD", label: "بدون سلاح / عادي" },
  { value: "ARMED", label: "مسلّح" },
  { value: "SUPERVISOR", label: "مشرف أمني" },
  { value: "MIXED", label: "مزيج" },
];

export default function GenericServiceRequestPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;

  const [service, setService] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    personnelCount: 1,
    startAt: "",
    endAt: "",
    locationText: "",
    locationLat: "",
    locationLng: "",
    armamentLevel: "STANDARD",
    notes: "",
    notifyBeforeHours: 24,
    isDraft: false,
    attachments: [] as UploadedFile[],
  });

  // Calculate total price based on service price and personnel count
  const totalPrice = useMemo(() => {
    const basePrice = service?.price || 0;
    const count = Number(form.personnelCount) || 1;
    return basePrice * count;
  }, [service?.price, form.personnelCount]);

  // Normalization similar to server's normalizeSlug
  const normalizeSlug = (input?: string | string[] | null) => {
    const s = Array.isArray(input) ? input[0] : input || "";
    return s
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/gu, "-")
      .replace(/[^\p{Letter}\p{Number}-]+/gu, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const stripTrailingToken = (s: string) => {
    const m = s.match(/^(.*?)-([a-z0-9]{3,8})$/i);
    return m ? m[1] : s;
  };

  useEffect(() => {
    let mounted = true;
    const fetchService = async () => {
      try {
        const slugStr = Array.isArray(slug) ? slug[0] : slug;
        // Try the flexible API endpoint first (supports id or slug)
        let match: any | null = null;
        if (slugStr) {
          // Avoid double-encoding; fetch will handle non-ASCII automatically
          const r = await fetch(`/api/services/${slugStr}`);
          if (r.ok) {
            match = await r.json();
          }
        }
        // Fallback to client-side search if needed
        if (!match) {
          const res = await fetch("/api/services");
          const services = await res.json();
          const normParam = normalizeSlug(slugStr);
          const cleaned = typeof slugStr === 'string' ? stripTrailingToken(slugStr) : slugStr;
          const normCleaned = typeof cleaned === 'string' ? normalizeSlug(cleaned) : cleaned;
          match = services.find((s: any) => {
            const sSlug = s?.slug ? String(s.slug) : "";
            const sId = s?.id ? String(s.id) : "";
            if (sId && sId === slugStr) return true;
            if (sSlug && (sSlug === slugStr)) return true;
            if (sSlug && normalizeSlug(sSlug) === normParam) return true;
            if (cleaned && sSlug && sSlug === cleaned) return true;
            if (normCleaned && sSlug && normalizeSlug(sSlug) === normCleaned) return true;
            const sName = s?.name ? String(s.name) : "";
            if (sName && normalizeSlug(sName) === normParam) return true;
            return false;
          }) || null;

          // As a last attempt, if slug ends with a short token (e.g., '-c0cb'), match by id prefix
          if (!match && typeof slugStr === 'string') {
            const parts = slugStr.split('-');
            const token = parts[parts.length - 1];
            if (token && /^[a-z0-9]{3,}$/i.test(token)) {
              match = services.find((s: any) => {
                const sid = String(s.id || '');
                return sid.startsWith(token) || sid.endsWith(token);
              }) || null;
            }
          }
        }
        if (mounted) {
          setService(match);
          setForm((p) => ({ ...p, title: match ? `طلب خدمة ${match.name}` : "طلب خدمة" }));
        }
      } catch (e) {
        console.error("Failed to load services", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (slug) fetchService();
    return () => {
      mounted = false;
    };
  }, [slug]);

  const handleChange = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (asDraft = false) => {
    if (!user) {
      toast({ title: "يجب تسجيل الدخول", variant: "destructive" });
      return;
    }
    if (!service?.id) {
      toast({ title: "الخدمة غير موجودة", description: "تحقق من الرابط أو تواصل مع الدعم.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        serviceId: service.id,
        title: form.title || `طلب خدمة ${service.name}`,
        description: form.description || "",
        personnelCount: Number(form.personnelCount) || null,
        startAt: form.startAt ? new Date(form.startAt).toISOString() : undefined,
        endAt: form.endAt ? new Date(form.endAt).toISOString() : undefined,
        locationText: form.locationText || undefined,
        locationLat: form.locationLat ? Number(form.locationLat) : undefined,
        locationLng: form.locationLng ? Number(form.locationLng) : undefined,
        armamentLevel: form.armamentLevel || undefined,
        notes: form.notes || undefined,
        notifyBeforeHours: Number(form.notifyBeforeHours) || 24,
        isDraft: asDraft || form.isDraft,
        attachments: form.attachments,
      };

      const res = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "تعذر إنشاء الطلب" }));
        throw new Error(err.error || "تعذر إنشاء الطلب");
      }

      toast({ title: asDraft ? "تم حفظ المسودة" : "تم إرسال الطلب" });
      if (!asDraft) {
        // Simple success flow: go to client requests list if available
        try {
          router.push("/client/requests");
        } catch {}
      }
    } catch (e: any) {
      toast({ title: "حدث خطأ", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p>جارٍ تحميل الخدمة...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>الخدمة غير متاحة</CardTitle>
            <CardDescription>
              لم يتم العثور على خدمة بهذا المعرف.
              <span className="block mt-1">ربما تم تغيير الرابط أو لم يتم إنشاء الخدمة بعد.</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/client/requests">عودة إلى الخدمات</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">{service.name}</h1>
        <span className="text-sm text-muted-foreground">/{service.slug}</span>
      </div>

      {/* Service Details Card */}
      {(service.description || service.shortDescription || (service.features && service.features.length > 0)) && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle>عن الخدمة</CardTitle>
            {service.shortDescription && (
              <CardDescription className="text-base">{service.shortDescription}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {service.description && (
              <p className="text-muted-foreground">{service.description}</p>
            )}
            {service.features && service.features.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">مزايا الخدمة:</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {service.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0 mt-2"></div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {service.price && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">السعر المبدئي:</span>
                <span className="font-bold text-primary text-lg">{Number(service.price).toLocaleString('ar-EG')} ج.م</span>
                <span className="text-muted-foreground">/ للوحدة</span>
              </div>
            )}
            {service.duration && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">المدة:</span>
                <span className="font-medium">{service.duration}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>طلب الخدمة</CardTitle>
          <CardDescription>املأ الحقول لإرسال طلب الخدمة</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label>عنوان الطلب</Label>
              <Input value={form.title} onChange={(e) => handleChange("title", e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>وصف الطلب</Label>
              <Textarea value={form.description} onChange={(e) => handleChange("description", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>عدد الأفراد/الموارد</Label>
              <Input type="number" min={1} value={form.personnelCount}
                     onChange={(e) => handleChange("personnelCount", Number(e.target.value))} />
            </div>
            {service?.price && (
              <div className="space-y-2">
                <Label>السعر</Label>
                <div className="space-y-2">
                  <div className="p-3 bg-muted rounded-md">
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-muted-foreground">سعر الوحدة:</span>
                      <span className="font-medium">{service.price.toLocaleString('ar-EG')} ج.م</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-muted-foreground">عدد الأفراد:</span>
                      <span className="font-medium">×{form.personnelCount}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">السعر الإجمالي:</span>
                        <span className="text-lg font-bold text-primary">{totalPrice.toLocaleString('ar-EG')} ج.م</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
              <Label>الموقع (نصيًا)</Label>
              <Input placeholder="العنوان أو وصف المكان" value={form.locationText}
                     onChange={(e) => handleChange("locationText", e.target.value)} />
              <div className="grid grid-cols-2 gap-3 mt-2">
                <Input placeholder="Latitude" value={form.locationLat}
                       onChange={(e) => handleChange("locationLat", e.target.value)} />
                <Input placeholder="Longitude" value={form.locationLng}
                       onChange={(e) => handleChange("locationLng", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>مستوى التسليح (إن وجد)</Label>
              <Select value={form.armamentLevel} onValueChange={(v) => handleChange("armamentLevel", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر" />
                </SelectTrigger>
                <SelectContent>
                  {ARMAMENT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>ملاحظات إضافية</Label>
              <Textarea value={form.notes} onChange={(e) => handleChange("notes", e.target.value)} />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <Checkbox id="notify" checked={!!form.isDraft === false && Number(form.notifyBeforeHours) > 0}
                        onCheckedChange={(v) => handleChange("notifyBeforeHours", v ? 24 : 0)} />
              <Label htmlFor="notify">تذكير قبل 24 ساعة</Label>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>المرفقات</Label>
              <UploadField onChange={(files) => handleChange("attachments", files)} />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => submit(true)} disabled={submitting || !user}>
              <Save className="h-4 w-4 mr-2" /> حفظ كمسودة
            </Button>
            <Button type="button" onClick={() => submit(false)} disabled={submitting || !user}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />} إرسال الطلب
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
