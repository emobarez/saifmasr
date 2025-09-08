"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Shield, Camera, Users, Building, Car, HeadphonesIcon } from "lucide-react";

export default function ServicesPage() {
  const services = [
    {
      icon: Shield,
      title: "خدمات الحراسة الأمنية",
      description: "حراسة متخصصة للمنشآت والممتلكات على مدار الساعة",
      features: [
        "حراسة المباني والمنشآت",
        "حراسة المناسبات والفعاليات",
        "حراسة شخصية للشخصيات المهمة",
        "خدمة حراسة على مدار 24 ساعة"
      ]
    },
    {
      icon: Camera,
      title: "أنظمة المراقبة والحماية",
      description: "تركيب وصيانة أحدث أنظمة كاميرات المراقبة",
      features: [
        "كاميرات مراقبة عالية الدقة",
        "أنظمة إنذار متطورة",
        "مراقبة عن بُعد",
        "تسجيل وحفظ المشاهد"
      ]
    },
    {
      icon: Users,
      title: "التدريب الأمني",
      description: "برامج تدريبية متخصصة لرفع مستوى الوعي الأمني",
      features: [
        "تدريب الحراس الأمنيين",
        "برامج السلامة المهنية",
        "تدريب إدارة الأزمات",
        "شهادات معتمدة"
      ]
    },
    {
      icon: Building,
      title: "أمن المباني والمنشآت",
      description: "حلول أمنية شاملة للمجمعات السكنية والتجارية",
      features: [
        "أنظمة التحكم في الدخول",
        "أمن المجمعات السكنية",
        "حماية المراكز التجارية",
        "أمن المكاتب والشركات"
      ]
    },
    {
      icon: Car,
      title: "خدمات النقل الآمن",
      description: "نقل آمن للأشخاص والبضائع القيمة",
      features: [
        "نقل الأموال والمعادن الثمينة",
        "خدمة المرافقة الأمنية",
        "سيارات مدرعة",
        "سائقين مدربين أمنياً"
      ]
    },
    {
      icon: HeadphonesIcon,
      title: "الاستشارات الأمنية",
      description: "استشارات متخصصة لتقييم وتطوير الأنظمة الأمنية",
      features: [
        "تقييم المخاطر الأمنية",
        "وضع خطط الطوارئ",
        "استشارات أمنية متخصصة",
        "تطوير السياسات الأمنية"
      ]
    }
  ];

  return (
    <>
  <Header />
  <main className="w-full px-4 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">خدماتنا</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              نقدم مجموعة شاملة من خدمات الأمن والحماية المتميزة لضمان سلامة وأمان عملائنا
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <Card key={index} className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{service.title}</CardTitle>
                    </div>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {service.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center mt-12">
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
    </>
  );
}
