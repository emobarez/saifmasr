"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, Camera, Users, Building, Car, Sparkles, Star, ArrowRight, Headphones as HeadphonesIcon } from "lucide-react";
import { formatEGPSimple } from "@/lib/egyptian-utils";

const ICONS: Record<string, any> = { Shield, Camera, Users, Building, Car, HeadphonesIcon, Sparkles };

// Note: Some services have bespoke forms (e.g., personal-guard). Dynamic [slug] page handles others.

export default function ClientRequestsPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/services");
        const data = await res.json();
        if (!Array.isArray(data)) return;
        // Show all ACTIVE services managed by admin
        const active = data.filter((s: any) => String(s.status).toUpperCase() === "ACTIVE");
        if (mounted) setServices(active);
      } catch (e) {
        console.error("Failed to load services", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const lowered = search.toLowerCase();
  const filtered = services.filter(
    (s) =>
      !lowered ||
      String(s.name || "").toLowerCase().includes(lowered) ||
      String(s.shortDescription || s.description || "").toLowerCase().includes(lowered)
  );

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">طلب خدمة جديدة</h1>
          <p className="text-muted-foreground">اختر الخدمة المناسبة ثم املأ النموذج المخصص</p>
        </div>
        <div className="w-64">
          <Input placeholder="بحث عن خدمة" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((s) => {
          const Icon = ICONS[String(s.icon)] || Shield;
          const slugOrId = String(s.slug || s.id || "");
          if (!slugOrId) return null;
          const href = `/client/services/${encodeURIComponent(slugOrId)}`;
          return (
            <Card key={s.id} className="flex flex-col">
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <CardTitle className="text-lg">{s.name}</CardTitle>
                      <CardDescription>/{s.slug}</CardDescription>
                    </div>
                  </div>
                  {s.isFeatured ? (
                    <Badge variant="secondary" className="flex items-center gap-1 text-[11px]">
                      <Star className="h-3 w-3" /> مميزة
                    </Badge>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground line-clamp-3">{s.shortDescription || s.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">السعر</span>
                  <span className="font-bold">{formatEGPSimple(Number(s.price || 0))}</span>
                </div>
                <div className="flex justify-end">
                  <Button asChild>
                    <Link href={href} className="flex items-center gap-2">
                      ابدأ الطلب <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="text-center py-12">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد خدمات مطابقة</h3>
          <p className="text-gray-500">جرّب كلمات بحث مختلفة</p>
        </div>
      )}
    </div>
  );
}