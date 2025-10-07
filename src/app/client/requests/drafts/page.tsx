"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Calendar, Clock, Edit, FileText, Loader2, MapPin, Paperclip, Send, Shield, Trash2, Users } from "lucide-react";
import AttachmentLink from "@/components/client/AttachmentLink";

type DraftRequest = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  service: {
    id: string;
    name: string;
    price?: number;
  };
  personnelCount?: number;
  armamentLevel?: string;
  startAt?: string;
  endAt?: string;
  locationText?: string;
  notes?: string;
  attachments?: Array<{ id: string; url: string; name?: string; mimeType?: string }>;
};

export default function DraftsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [drafts, setDrafts] = useState<DraftRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadDrafts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/service-requests?draft=true&extended=1");
      if (!res.ok) throw new Error("فشل تحميل المسودات");
      const data = await res.json();
      setDrafts(data);
    } catch (e: any) {
      console.error(e);
      toast({ title: "خطأ", description: e.message || "تعذر تحميل المسودات", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadDrafts();
  }, [user]);

  const submitDraft = async (draftId: string) => {
    try {
      setSubmitting(draftId);
      const res = await fetch(`/api/service-requests/${draftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDraft: false }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "فشل إرسال المسودة");
      }
      toast({ title: "تم الإرسال", description: "تم إرسال الطلب بنجاح" });
      loadDrafts(); // Reload to remove submitted draft
    } catch (e: any) {
      console.error(e);
      toast({ title: "خطأ", description: e.message || "تعذر إرسال المسودة", variant: "destructive" });
    } finally {
      setSubmitting(null);
    }
  };

  const deleteDraft = async (draftId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه المسودة؟")) return;
    try {
      setDeleting(draftId);
      const res = await fetch(`/api/service-requests/${draftId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("فشل حذف المسودة");
      toast({ title: "تم الحذف", description: "تم حذف المسودة بنجاح" });
      loadDrafts();
    } catch (e: any) {
      console.error(e);
      toast({ title: "خطأ", description: e.message || "تعذر حذف المسودة", variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const armamentLabels: Record<string, string> = {
    NONE: "بدون تسليح",
    LIGHT: "تسليح خفيف",
    MEDIUM: "تسليح متوسط",
    HEAVY: "تسليح ثقيل",
    STANDARD: "قياسي",
    ARMED: "مسلح",
    SUPERVISOR: "مشرف ميداني",
    MIXED: "مزيج",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">المسودات</h1>
          <p className="text-muted-foreground mt-1">
            {drafts.length} مسودة محفوظة
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          رجوع
        </Button>
      </div>

      {drafts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">لا توجد مسودات</h3>
            <p className="text-muted-foreground text-center mb-6">
              عندما تحفظ طلب خدمة كمسودة، سيظهر هنا
            </p>
            <Button onClick={() => router.push("/client/requests")}>
              إنشاء طلب جديد
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {drafts.map((draft) => (
            <Card key={draft.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl">{draft.title}</CardTitle>
                      <Badge variant="secondary">مسودة</Badge>
                    </div>
                    <CardDescription className="flex items-center gap-4 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Shield className="h-4 w-4" />
                        {draft.service.name}
                      </span>
                      {draft.service.price && (
                        <span className="font-semibold text-primary">
                          {draft.service.price.toLocaleString('ar-EG')} جنيه
                          {draft.personnelCount && draft.personnelCount > 1 && (
                            <> × {draft.personnelCount} = {(draft.service.price * draft.personnelCount).toLocaleString('ar-EG')} جنيه</>
                          )}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/client/requests/bodyguard?draft=${draft.id}`)}
                      disabled={submitting === draft.id || deleting === draft.id}
                    >
                      <Edit className="h-4 w-4 ml-1" />
                      تعديل
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => submitDraft(draft.id)}
                      disabled={submitting === draft.id || deleting === draft.id}
                    >
                      {submitting === draft.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-4 w-4 ml-1" />
                          إرسال للتنفيذ
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteDraft(draft.id)}
                      disabled={submitting === draft.id || deleting === draft.id}
                    >
                      {deleting === draft.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {draft.description && (
                  <p className="text-sm text-muted-foreground">{draft.description}</p>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                  {draft.personnelCount && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>عدد الأفراد: <strong>{draft.personnelCount}</strong></span>
                    </div>
                  )}
                  
                  {draft.armamentLevel && (
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span>التسليح: <strong>{armamentLabels[draft.armamentLevel] || draft.armamentLevel}</strong></span>
                    </div>
                  )}
                  
                  {draft.startAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>البداية: <strong>{formatDate(draft.startAt)}</strong></span>
                    </div>
                  )}
                  
                  {draft.endAt && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>النهاية: <strong>{formatDate(draft.endAt)}</strong></span>
                    </div>
                  )}
                  
                  {draft.locationText && (
                    <div className="flex items-center gap-2 md:col-span-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">الموقع: <strong>{draft.locationText}</strong></span>
                    </div>
                  )}
                </div>

                {draft.notes && (
                  <div className="bg-muted p-3 rounded text-sm">
                    <p className="font-semibold mb-1">ملاحظات:</p>
                    <p className="whitespace-pre-wrap">{draft.notes}</p>
                  </div>
                )}

                {draft.attachments && draft.attachments.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">المرفقات ({draft.attachments.length}):</p>
                    <div className="space-y-1">
                      {draft.attachments.map((att) => (
                        <div key={att.id} className="flex items-center gap-2 text-sm">
                          <Paperclip className="h-3 w-3 text-muted-foreground" />
                          <AttachmentLink
                            url={att.url}
                            name={att.name || "ملف"}
                            mimeType={att.mimeType}
                            variant="link"
                            showIcon={false}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                  <span>تم الإنشاء: {formatDate(draft.createdAt)}</span>
                  <span>آخر تحديث: {formatDate(draft.updatedAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
