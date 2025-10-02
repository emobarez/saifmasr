"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Calendar, Edit } from "lucide-react";
import Link from "next/link";

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const [client, setClient] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/clients/${id}`);
        if (!res.ok) throw new Error('تعذر تحميل بيانات العميل');
        const data = await res.json();
        setClient(data);
      } catch (e: any) {
        setError(e?.message || 'خطأ');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  if (loading) return <div className="p-6">جاري التحميل...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!client) return <div className="p-6">العميل غير موجود</div>;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">تفاصيل العميل</h1>
          <p className="text-muted-foreground">معلومات العميل</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href="/admin/clients">عودة</Link></Button>
          <Button asChild><Link href={`/admin/clients/${id}/edit`}><Edit className="h-4 w-4 mr-2"/>تعديل</Link></Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{client.name || '-'}</CardTitle>
          <CardDescription className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center text-sm"><Mail className="h-4 w-4 ml-1"/>{client.email}</span>
            {client.phone && <span className="flex items-center text-sm"><Phone className="h-4 w-4 ml-1"/>{client.phone}</span>}
            {client.address && <span className="flex items-center text-sm"><MapPin className="h-4 w-4 ml-1"/>{client.address}</span>}
            <span className="flex items-center text-sm"><Calendar className="h-4 w-4 ml-1"/>{new Date(client.createdAt).toLocaleDateString('ar-EG')}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm text-muted-foreground">الشركة</div>
            <div className="font-medium">{client.company || '-'}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">الحالة</div>
            <div className="font-medium">{client.status}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
