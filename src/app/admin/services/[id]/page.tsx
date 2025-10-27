"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Edit, Shield, Users, DollarSign, Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatEGPSimple } from "@/lib/egyptian-utils";

export default function ServiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id as string;
  const [service, setService] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/services/${id}`);
        if (!res.ok) throw new Error("تعذر تحميل الخدمة");
        const data = await res.json();
        setService(data);
      } catch (e: any) {
        setError(e?.message || "حدث خطأ");
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const statusBadge = (status?: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'ACTIVE') return <Badge className="bg-green-600">نشط</Badge>;
    if (s === 'INACTIVE') return <Badge variant="secondary">غير نشط</Badge>;
    return <Badge variant="outline">مسودة</Badge>;
  };

  if (loading) return <div className="p-6">جاري التحميل...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!service) return <div className="p-6">الخدمة غير موجودة</div>;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">تفاصيل الخدمة</h1>
          <p className="text-muted-foreground">عرض بيانات الخدمة</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/services">عودة</Link>
          </Button>
          <Button asChild>
            <Link href={`/admin/services/${id}/edit`}>
              <Edit className="h-4 w-4 mr-2" /> تعديل
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" /> {service.name}
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            {statusBadge(service.status)}
            <span className="flex items-center text-sm"><Users className="h-4 w-4 ml-1" /> {service._count?.serviceRequests || 0} عملاء</span>
            {typeof service.price === 'number' && <span className="flex items-center text-sm"><DollarSign className="h-4 w-4 ml-1" /> {formatEGPSimple(service.price)}</span>}
            <span className="flex items-center text-sm"><Calendar className="h-4 w-4 ml-1" /> {new Date(service.createdAt).toLocaleDateString('ar-EG')}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm text-muted-foreground">الفئة</div>
            <div className="font-medium">{service.category || '-'}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">الوصف</div>
            <div className="whitespace-pre-wrap">{service.description || '-'}</div>
          </div>
          {Array.isArray(service.faqs) && service.faqs.length > 0 && (
            <div>
              <div className="text-sm text-muted-foreground mb-2">الأسئلة الشائعة</div>
              <div className="space-y-3">
                {service.faqs.map((f: any, i: number) => (
                  <div key={i} className="border rounded p-3">
                    <div className="font-medium">{f.question}</div>
                    <div className="text-sm text-muted-foreground">{f.answer}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
