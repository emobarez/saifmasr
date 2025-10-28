
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, ShieldCheck, Camera, ArrowLeftCircle, Users, SearchCheck, Search, LogIn } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/context/AuthContext";

const services = [
  {
    icon: <ShieldCheck className="h-10 w-10 text-primary" />,
    title: "خدمه الحارس الشخصي",
    description: "نوفر حماية شخصية متخصصة لضمان سلامتك وأمنك في جميع الظروف.",
    slug: "personal-guard",
    dataAiHint: "bodyguard protection",
    imageUrl: "https://images.unsplash.com/photo-1618371690240-e0d46eead4b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxib2R5JTIwZ3VhcmR8ZW58MHx8fHwxNzUwNTAzNjgwfDA&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    icon: <ShieldCheck className="h-10 w-10 text-primary" />,
    title: "خدمه تأمين المصانع",
    description: "نوفر حلولاً أمنية متكاملة لحماية المنشآت الصناعية والمصانع.",
    slug: "regular-security",
    dataAiHint: "factory security",
    imageUrl: "https://images.unsplash.com/photo-1582190506824-ef3bd95a956e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMHx8bWFudWZhY3R1cmV8ZW58MHx8fHwxNzUwNTI2MTMxfDA&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    icon: <Camera className="h-10 w-10 text-primary" />,
    title: "خدمه كاميرات المراقبه",
    description: "تركيب وتشغيل أنظمة المراقبة بالكاميرات لتأمين ممتلكاتك على مدار الساعة.",
    slug: "cctv-installation",
    dataAiHint: "cctv camera",
    imageUrl: "https://images.unsplash.com/photo-1675213958054-46062269e343?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw2fHxTZWN1cml0aWVzJTIwY2FtZXJhfGVufDB8fHx8MTc1MDUyNzA4M3ww&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    icon: <Users className="h-10 w-10 text-primary" />,
    title: "الأمن الإنتظامى",
    description: "توفير أفراد أمن مدربين ومؤهلين لضمان أمن وحماية منشأتك على مدار الساعة.",
    slug: "regular-security",
    dataAiHint: "security guard",
    imageUrl: "https://images.unsplash.com/flagged/photo-1570343271132-8949dd284a04?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxM3x8U2VjdXJpdHklMjBtYW58ZW58MHx8fHwxNzUwNTI4MDg4fDA&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    icon: <SearchCheck className="h-10 w-10 text-primary" />,
    title: "حراسة مناطق المؤتمرات",
    description: "توفير حراس أمن مدربين لتأمين كافة مناطق المؤتمرات والفعاليات، وضمان سلامة الحضور.",
    slug: "event-security",
    dataAiHint: "conference guard",
    imageUrl: "https://images.unsplash.com/photo-1472691681358-fdf00a4bfcfe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxN3x8Q29uZmVyZW5jZXMlMjB8ZW58MHx8fHwxNzUwNTA0MzQ5fDA&ixlib=rb-4.1.0&q=80&w=1080"
  },
];

export default function LandingPage() {
  const { user } = useAuth();
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pb-20 md:pb-0">
        {/* Mobile: Services First */}
        <section id="services" className="py-8 md:py-16 lg:py-24 bg-background block md:hidden">
          <div className="w-full px-3">
            <div className="grid grid-cols-2 gap-2">
              {services.map((service, index) => {
                const serviceHref = user ? `/client/services/${service.slug}` : "/auth/login";
                return (
                  <Link
                  key={index}
                  href={serviceHref}
                  aria-label={`الانتقال إلى صفحة الخدمات: ${service.title}`}
                  className="group block"
                >
                  <Button
                    variant="outline"
                    className="h-auto w-full p-0 overflow-hidden border-2 hover:border-primary transition-all duration-300 group-hover:shadow-2xl group-hover:scale-[1.02] rounded-xl"
                  >
                    <div className="relative w-full">
                      {/* Background Image */}
                      <div className="relative h-36 w-full overflow-hidden">
                        <Image
                          src={service.imageUrl}
                          alt={service.title}
                          fill
                          sizes="33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          data-ai-hint={service.dataAiHint}
                          quality={95}
                        />
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />
                      </div>
                      
                      {/* Content */}
                      <div className="absolute bottom-0 left-0 right-0 p-1.5 text-white">
                        <div className="flex items-center justify-center mb-1">
                          <div className="p-1 bg-white/20 backdrop-blur-sm rounded-full">
                            <div className="scale-[0.6]">
                              {service.icon}
                            </div>
                          </div>
                        </div>
                        <h3 className="font-bold text-[0.65rem] text-center drop-shadow-lg line-clamp-2 leading-tight">
                          {service.title}
                        </h3>
                      </div>
                    </div>
                  </Button>
                </Link>
              ))}
            </div>
            
            {/* Mobile Action Buttons */}
            <div className="flex flex-col gap-3 mt-6 px-2">
              <Button asChild size="lg" className="font-semibold w-full !bg-primary !text-primary-foreground hover:!bg-primary/90">
                <Link href="/auth/register">
                  <ArrowLeftCircle className="ms-2 h-5 w-5" />
                  ابدأ الآن
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-semibold w-full text-foreground border-border hover:bg-muted">
                <Link href="/services">
                  <Search className="me-2 h-5 w-5" />
                  اكتشف خدماتنا
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Desktop: Hero Section First */}
        <section className="py-24 md:py-32 lg:py-40 xl:py-48 2xl:py-56 bg-gradient-to-br from-card via-background to-card hidden md:block">
          <div className="container max-w-7xl xl:max-w-[90rem] 2xl:max-w-[120rem] mx-auto px-6 lg:px-8 xl:px-12 2xl:px-16">
            <div className="text-center max-w-4xl xl:max-w-5xl 2xl:max-w-7xl mx-auto">
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold font-headline mb-6 xl:mb-8 2xl:mb-12 text-foreground leading-tight">
                سيف مصر الوطنية للأمن
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl text-muted-foreground mb-12 xl:mb-16 2xl:mb-20 leading-relaxed">
                حلولك المتكاملة لإدارة الخدمات، تتبع الطلبات، والحصول على تقارير دقيقة ومدعومة بالذكاء الاصطناعي.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 lg:gap-6 xl:gap-8">
                <Button asChild size="lg" className="font-semibold text-lg xl:text-xl 2xl:text-2xl px-8 xl:px-12 2xl:px-16 py-6 xl:py-8 2xl:py-10 !bg-primary !text-primary-foreground hover:!bg-primary/90 shadow-lg hover:shadow-xl transition-all">
                  <Link href="/auth/register">
                    ابدأ الآن 
                    <ArrowLeftCircle className="ms-2 h-6 w-6 xl:h-8 xl:w-8 2xl:h-10 2xl:w-10" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="font-semibold text-lg xl:text-xl 2xl:text-2xl px-8 xl:px-12 2xl:px-16 py-6 xl:py-8 2xl:py-10 text-foreground border-2 border-border hover:bg-muted shadow-lg hover:shadow-xl transition-all">
                  <Link href="/#services">
                    <Search className="me-2 h-6 w-6 xl:h-8 xl:w-8 2xl:h-10 2xl:w-10" />
                    اكتشف خدماتنا
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Desktop: Services Section */}
        <section id="services" className="py-20 md:py-28 lg:py-32 xl:py-40 2xl:py-48 bg-background hidden md:block">
          <div className="container max-w-7xl xl:max-w-[90rem] 2xl:max-w-[120rem] mx-auto px-6 lg:px-8 xl:px-12 2xl:px-16">
            <div className="text-center mb-16 xl:mb-20 2xl:mb-24">
              <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold font-headline mb-6 xl:mb-8 text-foreground">
                خدماتنا المتميزة
              </h2>
              <p className="text-lg md:text-xl xl:text-2xl 2xl:text-3xl text-muted-foreground max-w-3xl xl:max-w-4xl 2xl:max-w-5xl mx-auto leading-relaxed">
                نقدم مجموعة واسعة من الخدمات المصممة لتلبية احتياجات عملك المتنوعة، مدعومة بأحدث التقنيات والخبرات.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 lg:gap-8 xl:gap-10 2xl:gap-12">
              {services.map((service, index) => {
                const serviceHref = user ? `/client/services/${service.slug}` : "/auth/login";
                return (
                  <Link
                  key={index}
                  href={serviceHref}
                  aria-label={`الانتقال إلى صفحة الخدمات: ${service.title}`}
                  className="group block"
                >
                  <Button
                    variant="outline"
                    className="h-auto w-full p-0 overflow-hidden border-2 hover:border-primary transition-all duration-300 group-hover:shadow-2xl group-hover:scale-[1.02] rounded-xl"
                  >
                    <div className="relative w-full">
                      {/* Background Image */}
                      <div className="relative h-48 md:h-56 lg:h-64 xl:h-80 2xl:h-96 w-full overflow-hidden">
                        <Image
                          src={service.imageUrl}
                          alt={service.title}
                          fill
                          sizes="(max-width: 640px) 33vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, (max-width: 1536px) 16vw, 12.5vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          data-ai-hint={service.dataAiHint}
                          quality={95}
                        />
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent" />
                      </div>
                      
                      {/* Content */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 lg:p-5 xl:p-6 2xl:p-8 text-white">
                        <div className="flex items-center justify-center mb-2 xl:mb-3">
                          <div className="p-2 md:p-2.5 xl:p-3 2xl:p-4 bg-white/20 backdrop-blur-sm rounded-full">
                            <div className="scale-100 xl:scale-125 2xl:scale-150">
                              {service.icon}
                            </div>
                          </div>
                        </div>
                        <h3 className="font-bold text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-3xl text-center mb-1 xl:mb-2 drop-shadow-lg line-clamp-2 leading-tight">
                          {service.title}
                        </h3>
                        <p className="text-xs md:text-sm lg:text-base xl:text-lg 2xl:text-xl text-center text-white/90 line-clamp-2 leading-tight">
                          {service.description}
                        </p>
                      </div>
                    </div>
                  </Button>
                </Link>
                  );
              })}
            </div>
            
            {/* View All Services Button */}
            <div className="text-center mt-16 xl:mt-20 2xl:mt-24">
              <Button asChild size="lg" className="font-semibold text-lg xl:text-xl 2xl:text-2xl px-10 xl:px-14 2xl:px-20 py-6 xl:py-8 2xl:py-10 shadow-lg hover:shadow-xl transition-all">
                <Link href="/services">
                  <Search className="me-2 h-6 w-6 xl:h-8 xl:w-8 2xl:h-10 2xl:w-10" />
                  عرض جميع الخدمات
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* About Us Section - Desktop Only */}
        <section id="about" className="hidden md:block py-20 md:py-28 lg:py-32 xl:py-40 2xl:py-48 bg-secondary/50">
          <div className="container max-w-7xl xl:max-w-[90rem] 2xl:max-w-[120rem] mx-auto px-6 lg:px-8 xl:px-12 2xl:px-16">
            <div className="grid md:grid-cols-2 gap-12 lg:gap-16 xl:gap-20 2xl:gap-24 items-center">
              <div className="order-2 md:order-1">
                <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold font-headline mb-6 xl:mb-8 2xl:mb-10 text-primary">
                  من نحن في سيف مصر؟
                </h2>
                <p className="text-base md:text-lg xl:text-xl 2xl:text-2xl text-foreground/80 mb-4 xl:mb-6 leading-relaxed">
                  سيف مصر هي شركة رائدة في تقديم الحلول المتكاملة للشركات والأفراد. نسعى جاهدين لتقديم خدمات عالية الجودة تلبي تطلعات عملائنا وتساهم في نجاحهم.
                </p>
                <p className="text-base md:text-lg xl:text-xl 2xl:text-2xl text-foreground/80 mb-8 xl:mb-10 2xl:mb-12 leading-relaxed">
                  فريقنا مكون من خبراء متخصصين في مجالات متعددة، يعملون بشغف لتقديم أفضل الحلول المبتكرة والفعالة. نؤمن بأهمية الثقة والشفافية في علاقاتنا مع العملاء.
                </p>
                <Button asChild size="lg" className="font-semibold text-lg xl:text-xl 2xl:text-2xl px-8 xl:px-12 2xl:px-16 py-6 xl:py-8 2xl:py-10 shadow-lg hover:shadow-xl transition-all">
                  <Link href="/#contact">
                    تواصل معنا 
                    <ArrowLeftCircle className="ms-2 h-6 w-6 xl:h-8 xl:w-8 2xl:h-10 2xl:w-10" />
                  </Link>
                </Button>
              </div>
              <div className="order-1 md:order-2">
                <div className="relative rounded-2xl xl:rounded-3xl overflow-hidden shadow-2xl">
                  <Image
                    src="/hero-image.png"
                    alt="سيف مصر - مركز العمليات الأمنية والفريق المتخصص"
                    width={800}
                    height={600}
                    className="w-full h-auto object-cover"
                    priority
                    data-ai-hint="security operations center team"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact/CTA Section - Desktop Only */}
        <section id="contact" className="hidden md:block py-20 md:py-28 lg:py-32 xl:py-40 2xl:py-48 bg-gradient-to-br from-primary to-primary/90 text-primary-foreground">
          <div className="container max-w-7xl xl:max-w-[90rem] 2xl:max-w-[120rem] mx-auto px-6 lg:px-8 xl:px-12 2xl:px-16">
            <div className="text-center max-w-4xl xl:max-w-5xl 2xl:max-w-7xl mx-auto">
              <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold font-headline mb-6 xl:mb-8 2xl:mb-10">
                هل أنت مستعد للارتقاء بأعمالك؟
              </h2>
              <p className="text-lg md:text-xl xl:text-2xl 2xl:text-3xl opacity-95 mb-12 xl:mb-16 2xl:mb-20 leading-relaxed">
                تواصل معنا اليوم لمعرفة كيف يمكن لخدماتنا وحلولنا المبتكرة أن تساعدك في تحقيق أهدافك والوصول إلى آفاق جديدة من اة.
              </p>
              <Button asChild size="lg" variant="secondary" className="font-semibold text-lg xl:text-xl 2xl:text-2xl px-10 xl:px-14 2xl:px-20 py-6 xl:py-8 2xl:py-10 text-primary hover:bg-white/95 shadow-xl hover:shadow-2xl transition-all">
                <Link href="/auth/register">
                  <LogIn className="me-2 h-6 w-6 xl:h-8 xl:w-8 2xl:h-10 2xl:w-10"/>
                  سجل الآن وابدأ رحلتك
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
