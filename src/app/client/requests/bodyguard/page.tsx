"use client";

import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { FileText, Loader2, MapPin, Paperclip, Save, Send, Undo2, Upload } from "lucide-react";
import dynamic from "next/dynamic";
import AttachmentLink from "@/components/client/AttachmentLink";

// Dynamically import Leaflet MapPicker only
const LeafletMapPicker = dynamic(() => import("@/components/client/LeafletMapPicker").then(m => m.LeafletMapPicker), { ssr: false, loading: () => <div className="h-72 flex items-center justify-center border rounded">جارٍ تحميل الخريطة...</div> });

type Service = { id: string; name: string; price?: number };
type Attachment = { url: string; name?: string; mimeType?: string };

export default function BodyguardRequestPage() {
  const router = useRouter();
  const { toast } = useToast();
  // Google Maps removed: always Leaflet now.
  const { user } = useAuth();
  const { timezone: siteTimezone = 'Africa/Cairo' } = useSiteSettings() as any; // timezone support (future use)

  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [lockedServiceName, setLockedServiceName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    serviceId: "",
    title: "",
    description: "",
    personnelCount: 1 as number | "",
    durationUnit: "HOURS" as "HOURS" | "DAYS",
    startAt: "",
    endAt: "",
    locationText: "",
    locationLat: "" as number | "",
    locationLng: "" as number | "",
    armamentLevel: "STANDARD" as "STANDARD" | "ARMED" | "SUPERVISOR" | "MIXED",
    notes: "",
    notifyBeforeHours: 24 as number | "",
  });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  // Separate date/time selections for dropdown UX
  const [startDate, setStartDate] = useState<string>(""); // YYYY-MM-DD
  const [startTime, setStartTime] = useState<string>(""); // HH:mm
  const [endDate, setEndDate] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const timesValid = useMemo(() => {
    if (!form.startAt || !form.endAt) return false;
    const s = new Date(form.startAt).getTime();
    const e = new Date(form.endAt).getTime();
    return e > s; // end must be strictly after start
  }, [form.startAt, form.endAt]);

  const durationInfo = useMemo(() => {
    if (!timesValid) return null;
    const s = new Date(form.startAt);
    const e = new Date(form.endAt);
    const diffMs = e.getTime() - s.getTime();
    const diffHours = diffMs / 3600000;
    const days = Math.floor(diffHours / 24);
    const hours = Math.round(diffHours - days * 24);
    const parts: string[] = [];
    if (days) parts.push(`${days} يوم`);
    if (hours) parts.push(`${hours} ساعة`);
    if (!parts.length) parts.push('< ساعة');
    const crossesMidnight = s.toDateString() !== e.toDateString();
    return { label: parts.join(' و '), crossesMidnight };
  }, [form.startAt, form.endAt, timesValid]);

  const canSubmit = useMemo(() => {
    return (
      !!form.serviceId &&
      !!form.title &&
      Number(form.personnelCount) > 0 &&
      !!form.durationUnit &&
      !!form.startAt &&
      !!form.endAt &&
      timesValid &&
      !loadingServices
    );
  }, [form, timesValid, loadingServices]);

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoadingServices(true);
        const res = await fetch("/api/services");
        if (!res.ok) return;
        const data: Service[] = await res.json();
        setServices(data);

        // Try to preselect a likely bodyguard service by name
        const preferred = data.find(s => {
          const name = s.name.replace(/\s+/g, ' ').trim();
          return /خدمة الحارس الشخصي|الحارس الشخصي|حارس شخصي|حراسة شخصية|بودي ?جارد|Body ?guard/i.test(name);
        });
        if (preferred) {
          setForm(prev => ({ ...prev, serviceId: preferred.id, title: prev.title || `طلب حراسة شخصية` }));
          setLockedServiceName(preferred.name);
        }
      } catch (e) {
        console.error("Failed to load services", e);
      } finally {
        setLoadingServices(false);
      }
    };
    loadServices();
  }, []);

  // Utility: generate date options (today + next 30 days)
  const dateOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    const today = new Date();
    // Generate 365 days ahead (including today)
    for (let i = 0; i < 365; i++) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      const value = d.toISOString().slice(0, 10); // YYYY-MM-DD
      const label = d.toLocaleDateString('ar-EG', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
      opts.push({ value, label });
    }
    return opts;
  }, []);

  // Utility: generate time options every 30 minutes
  const timeOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m of [0, 30]) {
        const hh = String(h).padStart(2, '0');
        const mm = String(m).padStart(2, '0');
        const value = `${hh}:${mm}`;
        // 12/24 mix? keep 24h but show localized
        const display = new Date(`1970-01-01T${value}:00`).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: false });
        opts.push({ value, label: display });
      }
    }
    return opts;
  }, []);

  // Initialize default start/end to next rounded half hour if empty
  useEffect(() => {
    if (!startDate || !startTime) {
      const now = new Date();
      const minutes = now.getMinutes();
      const add = minutes < 30 ? (30 - minutes) : (60 - minutes);
      const rounded = new Date(now.getTime() + add * 60000);
      const sd = rounded.toISOString().slice(0,10);
      const st = `${String(rounded.getHours()).padStart(2,'0')}:${String(rounded.getMinutes()).padStart(2,'0')}`;
      setStartDate(sd);
      setStartTime(st);
      // placeholder end (+2h) will be re-adjusted by durationUnit effect if needed
      const end = new Date(rounded.getTime() + 2 * 3600000);
      const ed = end.toISOString().slice(0,10);
      const et = `${String(end.getHours()).padStart(2,'0')}:${String(end.getMinutes()).padStart(2,'0')}`;
      setEndDate(ed);
      setEndTime(et);
    }
  }, [startDate, startTime]);

  // Adjust end dynamically when durationUnit changes to minimum (+2h or +1 day)
  useEffect(() => {
    if (!startDate || !startTime) return;
    const base = new Date(`${startDate}T${startTime}:00`);
    let minEnd: Date | null = null;
    if (form.durationUnit === 'HOURS') minEnd = new Date(base.getTime() + 2 * 3600000);
    else if (form.durationUnit === 'DAYS') minEnd = new Date(base.getTime() + 24 * 3600000);
    if (!minEnd) return;
    if (!endDate || !endTime) {
      setEndDate(minEnd.toISOString().slice(0,10));
      setEndTime(`${String(minEnd.getHours()).padStart(2,'0')}:${String(minEnd.getMinutes()).padStart(2,'0')}`);
      return;
    }
    const currentEnd = new Date(`${endDate}T${endTime}:00`);
    if (currentEnd.getTime() < minEnd.getTime()) {
      setEndDate(minEnd.toISOString().slice(0,10));
      setEndTime(`${String(minEnd.getHours()).padStart(2,'0')}:${String(minEnd.getMinutes()).padStart(2,'0')}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.durationUnit]);

  // Combine pieces into form.startAt/endAt whenever components change
  useEffect(() => {
    if (startDate && startTime) {
      const combined = `${startDate}T${startTime}`; // local representation
      setForm(prev => ({ ...prev, startAt: combined }));
    }
  }, [startDate, startTime]);
  useEffect(() => {
    if (endDate && endTime) {
      const combined = `${endDate}T${endTime}`;
      setForm(prev => ({ ...prev, endAt: combined }));
    }
  }, [endDate, endTime]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      setUploading(true);
      const uploaded: Attachment[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/uploads", { method: "POST", body: fd });
        if (!res.ok) throw new Error("فشل رفع الملف");
        const json = await res.json();
        const filesResp: Array<{ url: string; name?: string; mimeType?: string }> = Array.isArray(json)
          ? json
          : Array.isArray(json?.files)
            ? json.files
            : [];
        const urls: Attachment[] = filesResp.map((f) => ({ url: f.url, name: f.name || file.name, mimeType: f.mimeType || file.type }));
        uploaded.push(...urls.filter(u => !!u.url));
      }
      setAttachments(prev => [...prev, ...uploaded]);
      toast({ title: "تم رفع الملفات", description: `${uploaded.length} ملف/ملفات` });
    } catch (e: any) {
      console.error(e);
      toast({ title: "فشل الرفع", description: e.message ?? "تعذر رفع الملفات", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "المتصفح لا يدعم تحديد الموقع", variant: "destructive" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(prev => ({
          ...prev,
          locationLat: Number(pos.coords.latitude.toFixed(6)),
          locationLng: Number(pos.coords.longitude.toFixed(6)),
        }));
      },
      (err) => {
        console.error(err);
        toast({ title: "تعذر تحديد الموقع", description: "يرجى السماح بإذن الموقع والمحاولة مجدداً", variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submitRequest = async (isDraft: boolean) => {
    if (!user) {
      toast({ title: "يرجى تسجيل الدخول" , variant: "destructive"});
      return;
    }
    if (!isDraft && !canSubmit) {
      toast({ title: "اكمل الحقول المطلوبة", variant: "destructive" });
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        serviceId: form.serviceId,
        title: form.title || "طلب حراسة شخصية",
  description: (form.description && form.description.trim()) || (form.notes && form.notes.trim()) || "",
        priority: "URGENT", // bodyguard often urgent; user may adjust later
        personnelCount: Number(form.personnelCount) || null,
        durationUnit: form.durationUnit,
        startAt: form.startAt ? new Date(form.startAt).toISOString() : null,
        endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
        locationText: form.locationText || null,
        locationLat: form.locationLat === "" ? null : Number(form.locationLat),
        locationLng: form.locationLng === "" ? null : Number(form.locationLng),
        armamentLevel: form.armamentLevel,
        notes: form.notes || null,
        notifyBeforeHours: form.notifyBeforeHours === "" ? 24 : Number(form.notifyBeforeHours),
        isDraft,
        attachments,
      };
      console.log('[bodyguard][submit] Client payload being sent:', JSON.stringify(payload, null, 2));
      const res = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('[bodyguard][submit] Server error response:', err);
        const errorMsg = err.message || err.error || "تعذر إرسال الطلب";
        const errorDetails = err.code ? ` (${err.code})` : '';
        throw new Error(errorMsg + errorDetails);
      }
      const result = await res.json();
      toast({ title: isDraft ? "تم حفظ المسودة" : "تم إرسال الطلب", description: `رقم الطلب: ${result.id}` });
      router.push("/client/tracking");
    } catch (e: any) {
      console.error('[bodyguard][submit] Full error:', e);
      toast({ title: "حدث خطأ", description: e.message ?? "خطأ غير معروف", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const serviceOptions = useMemo(() => services.map((s) => ({
    value: s.id,
    label: `${s.name}${s.price ? ` - ${new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(s.price)}` : ''}`
  })), [services]);

  const onChange = (field: keyof typeof form, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <Head>
        {/* Leaflet CSS (integrity removed to avoid SRI mismatch blocking) */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          crossOrigin=""
        />
      </Head>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">طلب خدمة الحارس الشخصي</h1>
          <p className="text-sm text-muted-foreground mt-1">
            يمكنك حفظ الطلب كمسودة والعودة إليه لاحقاً من زر "المسودات" أعلاه
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.push("/client/requests")}>
            <Undo2 className="h-4 w-4 ml-1" /> رجوع
          </Button>
          <Button variant="outline" onClick={() => router.push("/client/requests/drafts")}>
            <FileText className="h-4 w-4 ml-1" /> المسودات
          </Button>
          <Button variant="outline" onClick={() => submitRequest(true)} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 ml-1" />} حفظ كمسودة
          </Button>
          <Button onClick={() => submitRequest(false)} disabled={submitting || (!user) || !canSubmit} title={!canSubmit ? "أكمل الحقول المطلوبة" : undefined}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-1" />} إرسال الطلب
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بيانات عامة</CardTitle>
          <CardDescription>اختر الخدمة وادخل عنواناً ووصفاً موجزاً</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>نوع الخدمة</Label>
            {loadingServices && !lockedServiceName && (
              <div className="flex items-center justify-center p-3 border rounded-md text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> جارٍ جلب خدمة الحارس الشخصي...
              </div>
            )}
            {lockedServiceName && (
              <Input
                value={`${lockedServiceName}${(() => { const svc = services.find(s=>s.id===form.serviceId); return svc?.price ? ` - ج.م ${svc.price.toLocaleString('ar-EG')}` : '' })()}`}
                readOnly
                className="bg-muted font-semibold"
              />
            )}
            {!loadingServices && !lockedServiceName && (
              <div className="p-3 border rounded-md bg-destructive/10 text-destructive text-sm font-medium">
                لم يتم العثور على خدمة الحارس الشخصي في قائمة الخدمات. الرجاء إضافتها من لوحة التحكم أولاً.
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>أولوية الطلب</Label>
            <Input value={"عاجل"} readOnly className="bg-muted" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>عنوان الطلب</Label>
            <Input value={form.title} onChange={(e) => onChange("title", e.target.value)} placeholder="مثال: مرافقة شخصية ليوم كامل" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>وصف مختصر</Label>
            <Textarea value={form.description} onChange={(e) => onChange("description", e.target.value)} placeholder="اذكر نقاطاً مهمة عن طبيعة المهمة (يُستخدم المحتوى من الملاحظات إذا تُرك فارغاً)" />
            {(!form.description || !form.description.trim()) && form.notes && form.notes.trim() && (
              <p className="text-xs text-muted-foreground">سيتم استخدام نص الملاحظات كوصف عند الإرسال.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>التنفيذ والمدة</CardTitle>
          <CardDescription>حدد عدد الأفراد والمدة وبداية ونهاية المهمة</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label>عدد الأفراد</Label>
            <Input type="number" min={1} value={form.personnelCount} onChange={(e) => onChange("personnelCount", e.target.value === "" ? "" : Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>وحدة المدة</Label>
            <Select value={form.durationUnit} onValueChange={(v: any) => onChange("durationUnit", v)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الوحدة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HOURS">ساعات</SelectItem>
                <SelectItem value="DAYS">أيام</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">تلقائياً: {form.durationUnit === 'HOURS' ? 'حد أدنى + ساعتين' : 'حد أدنى + يوم كامل'} من وقت البداية.</p>
          </div>
          <div className="space-y-2">
            <Label>إشعار قبل (ساعات)</Label>
            <Input type="number" min={0} value={form.notifyBeforeHours} onChange={(e) => onChange("notifyBeforeHours", e.target.value === "" ? "" : Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>وقت البداية</Label>
            <div className="flex gap-2">
              <Select value={startDate} onValueChange={(v) => setStartDate(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="التاريخ" />
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  {dateOptions.map(d => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={startTime} onValueChange={(v) => setStartTime(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="الوقت" />
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  {timeOptions.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(!form.startAt) && <p className="text-xs text-destructive">اختر التاريخ والوقت</p>}
          </div>
          <div className="space-y-2">
            <Label>وقت النهاية</Label>
            <div className="flex gap-2">
              <Select value={endDate} onValueChange={(v) => setEndDate(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="التاريخ" />
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  {dateOptions.map(d => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={endTime} onValueChange={(v) => setEndTime(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="الوقت" />
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  {timeOptions.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(!form.endAt) && <p className="text-xs text-destructive">اختر التاريخ والوقت</p>}
            {form.startAt && form.endAt && !timesValid && (
              <p className="text-xs text-destructive">يجب أن يكون وقت النهاية بعد وقت البداية.</p>
            )}
            {durationInfo && (
              <p className="text-xs text-muted-foreground">المدة: {durationInfo.label}{durationInfo.crossesMidnight && ' (يتجاوز منتصف الليل)'} </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الموقع</CardTitle>
          <CardDescription>صف الموقع وأدخل الإحداثيات أو اخترها من الخريطة</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-3 space-y-2">
            <Label>وصف الموقع</Label>
            <Textarea value={form.locationText} onChange={(e) => onChange("locationText", e.target.value)} placeholder="العنوان بالتفصيل أو نقاط التقاء" />
          </div>
          <div className="space-y-2">
            <Label>Latitude (اختياري)</Label>
            <div className="flex gap-2">
              <Input type="number" step="0.000001" value={form.locationLat} onChange={(e) => onChange("locationLat", e.target.value === "" ? "" : Number(e.target.value))} />
              <Button type="button" variant="outline" onClick={useMyLocation} title="استخدم موقعي">
                <MapPin className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Longitude (اختياري)</Label>
            <Input type="number" step="0.000001" value={form.locationLng} onChange={(e) => onChange("locationLng", e.target.value === "" ? "" : Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>مستوى التسليح</Label>
            <Select value={form.armamentLevel} onValueChange={(v: any) => onChange("armamentLevel", v)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر المستوى" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STANDARD">قياسي</SelectItem>
                <SelectItem value="ARMED">مسلح</SelectItem>
                <SelectItem value="SUPERVISOR">مشرف ميداني</SelectItem>
                <SelectItem value="MIXED">مزيج</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-3 space-y-2">
            <Label className="block">الخريطة</Label>
            <LeafletMapPicker
              value={typeof form.locationLat === 'number' && typeof form.locationLng === 'number' ? { lat: form.locationLat, lng: form.locationLng } : undefined}
              onChange={(c) => setForm(prev => ({ ...prev, locationLat: c.lat, locationLng: c.lng }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ملاحظات ومرفقات</CardTitle>
          <CardDescription>يمكنك كتابة أي تفاصيل إضافية وإرفاق ملفات</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea value={form.notes} onChange={(e) => onChange("notes", e.target.value)} placeholder="تفاصيل إضافية، تعليمات خاصة، إلخ" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="attachments" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              إضافة مرفقات
              <span className="text-xs text-muted-foreground font-normal">(يمكن اختيار اكثر من ملف بالضغط على زر التحكم)</span>
            </Label>
            <Input id="attachments" type="file" multiple onChange={(e) => handleUpload(e.target.files)} />
            {attachments.length > 0 && (
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                {attachments.map((att, idx) => (
                  <div key={`${att.url}-${idx}`} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2 truncate min-w-0">
                      <AttachmentLink 
                        url={att.url} 
                        name={att.name || "ملف"} 
                        mimeType={att.mimeType}
                        variant="link"
                        showIcon={true}
                      />
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}>إزالة</Button>
                  </div>
                ))}
              </div>
            )}
            {uploading && (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> جارٍ رفع الملفات...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
