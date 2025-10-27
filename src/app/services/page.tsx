"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Shield, Camera, Users, Building, Car, HeadphonesIcon, Sparkles } from "lucide-react";

const ICON_COMPONENTS = {
  Shield,
  Camera,
  Users,
  Building,
  Car,
  HeadphonesIcon,
  Sparkles
};

interface ServiceCard {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  features: string[];
  icon: string;
  ctaLabel: string;
  ctaUrl: string;
  isFeatured: boolean;
  displayOrder: number;
}

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/services");
        if (!res.ok) throw new Error("تعذر تحميل الخدمات");
        const data = await res.json();
        const mapped: ServiceCard[] = data
          .filter((service: any) => (service.status || "").toUpperCase() === "ACTIVE")
          .map((service: any) => ({
            id: service.id,
            name: service.name,
            slug: service.slug,
            shortDescription: service.shortDescription || "",
            description: service.description || "",
            features: Array.isArray(service.features) ? service.features : [],
            icon: service.icon || "",
            ctaLabel: service.ctaLabel || "",
            ctaUrl: service.ctaUrl || "",
            isFeatured: Boolean(service.isFeatured),
            displayOrder: typeof service.displayOrder === "number" ? service.displayOrder : 0
          }));
        setServices(mapped);
      } catch (e: any) {
        setError(e?.message || "حدث خطأ غير متوقع");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const orderedServices = useMemo(() => {
    return [...services].sort((a, b) => a.displayOrder - b.displayOrder);
  }, [services]);

  const renderCards = () => {
    if (loading) {
      return Array.from({ length: 6 }).map((_, index) => (
        <Card key={`service-skeleton-${index}`} className="h-full animate-pulse bg-muted/30" />
      ));
    }

    return orderedServices.map((service) => {
      const IconComponent = ICON_COMPONENTS[service.icon as keyof typeof ICON_COMPONENTS] || Shield;
      const featuresList = service.features && service.features.length > 0
        ? service.features
        : [service.description || "تواصل معنا لمعرفة تفاصيل أكثر"];
      const ctaLabel = service.ctaLabel || "اطلب الآن";
      const ctaHref = service.ctaUrl || `/client/services/${service.slug}`;

      return (
        <>
          {/* Mobile Button Style */}
          <a
            key={`${service.id}-mobile`}
            href={ctaHref}
            className="md:hidden block group"
          >
            <Card className="h-full hover:shadow-lg transition-all hover:scale-[1.02] border-2 hover:border-primary overflow-hidden">
              <CardContent className="p-2.5">
                <div className="flex items-start gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-lg flex-shrink-0">
                    <IconComponent className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-0.5">
                      <h3 className="font-bold text-[11px] line-clamp-2 leading-tight">{service.name}</h3>
                      {service.isFeatured ? (
                        <Badge variant="secondary" className="text-[8px] px-1 py-0 flex-shrink-0">مميزة</Badge>
                      ) : null}
                    </div>
                    {service.shortDescription ? (
                      <p className="text-[9px] text-muted-foreground line-clamp-2 leading-tight mb-1">{service.shortDescription}</p>
                    ) : null}
                    {featuresList && featuresList.length > 0 && !service.shortDescription ? (
                      <ul className="space-y-0.5 mb-1">
                        {featuresList.slice(0, 2).map((feature, featureIndex) => (
                          <li key={`${service.id}-mobile-feature-${featureIndex}`} className="flex items-start gap-1 text-[8px] leading-tight">
                            <div className="w-1 h-1 bg-primary rounded-full flex-shrink-0 mt-0.5"></div>
                            <span className="line-clamp-1">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <div className="text-[9px] font-semibold text-primary">{ctaLabel}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </a>

          {/* Desktop Card Style */}
          <Card key={`${service.id}-desktop`} className="hidden md:block h-full hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <IconComponent className="h-6 w-6 text-primary" />
                </div>
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {service.name}
                    {service.isFeatured ? (
                      <Badge variant="secondary" className="text-[11px]">مميزة</Badge>
                    ) : null}
                  </CardTitle>
                  {service.shortDescription ? (
                    <CardDescription>{service.shortDescription}</CardDescription>
                  ) : null}
                </div>
              </div>
              {!service.shortDescription && service.description ? (
                <CardDescription>{service.description}</CardDescription>
              ) : null}
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {featuresList.map((feature, featureIndex) => (
                  <li key={`${service.id}-feature-${featureIndex}`} className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0"></div>
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <a
                  href={ctaHref}
                  className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  {ctaLabel}
                </a>
              </div>
            </CardContent>
          </Card>
        </>
      );
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow w-full px-4 lg:px-8 py-8 pb-20 md:pb-8">
        <div className="space-y-8">
          {/* Title - Desktop Only */}
          <div className="text-center hidden md:block">
            <h1 className="text-4xl font-bold mb-4">خدماتنا</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              نقدم مجموعة شاملة من خدمات الأمن والحماية المتميزة لضمان سلامة وأمان عملائنا
            </p>
          </div>

          {/* Mobile Title - Compact */}
          <div className="text-center md:hidden">
            <h1 className="text-2xl font-bold mb-2">خدماتنا</h1>
          </div>

          {error ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-center text-destructive">
              {error}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {renderCards()}
            </div>
          )}

          {/* CTA Section - Desktop Only */}
          <div className="text-center mt-12 hidden md:block">
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-4">هل تحتاج إلى استشارة أمنية؟</h2>
                <p className="text-muted-foreground mb-6">
                  فريقنا من الخبراء جاهز لتقديم الاستشارة والمساعدة في اختيار الحل الأمني المناسب لك
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a 
                    href="/auth/login" 
                    className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    طلب خدمة
                  </a>
                  <a 
                    href="/contact" 
                    className="inline-flex items-center justify-center px-6 py-3 border border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors"
                  >
                    اتصل بنا
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
