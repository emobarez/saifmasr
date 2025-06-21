
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, ShieldCheck, FileText, ArrowLeftCircle, Users, SearchCheck, Search, LogIn } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const services = [
  {
    icon: <ShieldCheck className="h-10 w-10 text-primary" />,
    title: "خدمه الحارس الشخصي",
    description: "نوفر حماية شخصية متخصصة لضمان سلامتك وأمنك في جميع الظروف.",
    dataAiHint: "bodyguard protection",
    imageUrl: "https://images.unsplash.com/photo-1700616270314-684a2fbf542b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxCb2R5Z3VhcmRzJTIwfGVufDB8fHx8MTc1MDUwMzM1MHww&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    icon: <ShieldCheck className="h-10 w-10 text-primary" />,
    title: "حلول أمنية",
    description: "نوفر حلولاً أمنية متكاملة لحماية أصولك وبياناتك.",
    dataAiHint: "cyber security",
    imageUrl: "https://placehold.co/600x400.png"
  },
  {
    icon: <FileText className="h-10 w-10 text-primary" />,
    title: "إدارة التقارير",
    description: "أدوات متقدمة لإنشاء وإدارة التقارير بكفاءة عالية.",
    dataAiHint: "report analytics",
    imageUrl: "https://placehold.co/600x400.png"
  },
  {
    icon: <Users className="h-10 w-10 text-primary" />,
    title: "إدارة العملاء",
    description: "نظام متكامل لإدارة علاقات العملاء وتتبع تفاعلاتهم.",
    dataAiHint: "client management",
    imageUrl: "https://placehold.co/600x400.png"
  },
  {
    icon: <SearchCheck className="h-10 w-10 text-primary" />,
    title: "تأمين مؤتمرات",
    description: "توفير الحماية والأمن للمؤتمرات والفعاليات الكبرى.",
    dataAiHint: "conference security",
    imageUrl: "https://images.unsplash.com/photo-1618371690240-e0d46eead4b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxCb2R5Z3VhcmQlMjB8ZW58MHx8fHwxNzUwNTAxODcwfDA&ixlib=rb-4.1.0&q=80&w=1080"
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-white">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-6xl font-bold font-headline mb-6 text-foreground">
              سيف مصر الوطنية للأمن
            </h1>
            <p className="text-lg md:text-xl text-foreground/80 mb-10 max-w-2xl mx-auto">
              حلولك المتكاملة لإدارة الخدمات، تتبع الطلبات، والحصول على تقارير دقيقة ومدعومة بالذكاء الاصطناعي.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
              <Button asChild size="lg" className="font-semibold w-full sm:w-auto bg-black text-white hover:bg-black/90">
                <Link href="/auth/register">ابدأ الآن <ArrowLeftCircle className="ms-2 h-5 w-5" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-semibold w-full sm:w-auto">
                <Link href="/#services"><Search className="me-2 h-5 w-5" />اكتشف خدماتنا</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold font-headline text-center mb-4 text-foreground">
              خدماتنا المتميزة
            </h2>
            <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
                نقدم مجموعة واسعة من الخدمات المصممة لتلبية احتياجات عملك المتنوعة، مدعومة بأحدث التقنيات والخبرات.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
                  <CardHeader className="items-center text-center">
                    <div className="p-4 bg-primary/10 rounded-full mb-4">
                      {service.icon}
                    </div>
                    <CardTitle className="font-headline text-xl text-primary">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow text-center">
                    <CardDescription>{service.description}</CardDescription>
                  </CardContent>
                  <div className="p-4 text-center">
                     <Image 
                        src={service.imageUrl} 
                        alt={service.title} 
                        width={600} 
                        height={400} 
                        className="rounded-md object-cover aspect-[3/2]"
                        data-ai-hint={service.dataAiHint}
                      />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section id="about" className="py-16 md:py-24 bg-secondary">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold font-headline mb-6 text-primary">
                  من نحن في سيف مصر؟
                </h2>
                <p className="text-foreground/80 mb-4 leading-relaxed">
                  سيف مصر هي شركة رائدة في تقديم الحلول المتكاملة للشركات والأفراد. نسعى جاهدين لتقديم خدمات عالية الجودة تلبي تطلعات عملائنا وتساهم في نجاحهم.
                </p>
                <p className="text-foreground/80 mb-6 leading-relaxed">
                  فريقنا مكون من خبراء متخصصين في مجالات متعددة، يعملون بشغف لتقديم أفضل الحلول المبتكرة والفعالة. نؤمن بأهمية الثقة والشفافية في علاقاتنا مع العملاء.
                </p>
                <Button asChild size="lg" className="font-semibold">
                  <Link href="/#contact">تواصل معنا <ArrowLeftCircle className="ms-2 h-5 w-5" /></Link>
                </Button>
              </div>
              <div>
                <Image
                  src="https://placehold.co/800x600.png"
                  alt="About Saif Masr - Operations Center"
                  width={800}
                  height={600}
                  className="rounded-lg shadow-xl object-cover"
                  data-ai-hint="operations center team"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Contact/CTA Section */}
        <section id="contact" className="py-16 md:py-24 bg-primary text-primary-foreground">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold font-headline mb-6">
              هل أنت مستعد للارتقاء بأعمالك؟
            </h2>
            <p className="text-lg md:text-xl opacity-90 mb-10 max-w-2xl mx-auto">
              تواصل معنا اليوم لمعرفة كيف يمكن لخدماتنا وحلولنا المبتكرة أن تساعدك في تحقيق أهدافك والوصول إلى آفاق جديدة من النجاح.
            </p>
            <Button asChild size="lg" variant="secondary" className="font-semibold text-primary hover:bg-white/90">
              <Link href="/auth/register"><LogIn className="me-2 h-5 w-5"/>سجل الآن وابدأ رحلتك</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
