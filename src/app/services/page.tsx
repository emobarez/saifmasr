
"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Briefcase, Loader2, Tag, CreditCard, HelpCircle, Phone } from "lucide-react";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface FAQItem {
  question: string;
  answer: string;
}

interface Service {
  id: string;
  name: string;
  category: string;
  price: string;
  description: string;
  status: "متاحة" | "قيد التطوير" | "متوقفة مؤقتاً";
  createdAt: Timestamp | Date;
  faqs?: FAQItem[];
}

export default function PublicServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchServices = async () => {
      setIsLoading(true);
      try {
        const q = query(
          collection(db, "services"),
          where("status", "==", "متاحة"),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const fetchedServices = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
        setServices(fetchedServices);
      } catch (error) {
        console.error("Error fetching services:", error);
        toast({ title: "خطأ", description: "لم نتمكن من تحميل قائمة الخدمات المتاحة.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchServices();
  }, [toast]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow py-12 md:py-20 bg-gradient-to-br from-primary/5 via-background to-background/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12 md:mb-16">
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary mb-4">
              خدماتنا المقدمة
            </h1>
            <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto">
              اكتشف مجموعة خدماتنا المصممة لتلبية احتياجاتك المتنوعة بأعلى معايير الجودة والاحترافية.
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="ms-3 text-lg text-muted-foreground">جارٍ تحميل الخدمات...</p>
            </div>
          ) : services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service) => (
                <Card key={service.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col overflow-hidden">
                  <div className="relative h-56 w-full">
                    <Image
                      src={`https://placehold.co/600x400.png`}
                      alt={service.name}
                      fill
                      style={{objectFit: "cover"}}
                      className="bg-muted"
                      data-ai-hint={`${service.category} service`}
                    />
                  </div>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      <CardTitle className="font-headline text-xl text-primary">{service.name}</CardTitle>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="secondary" className="flex items-center gap-1">
                            <Tag className="h-3 w-3" /> {service.category}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                           <CreditCard className="h-3 w-3" /> {service.price}
                        </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col justify-between">
                    <CardDescription className="mb-4 text-sm leading-relaxed">{service.description}</CardDescription>
                    {service.faqs && service.faqs.length > 0 && (
                      <div className="mt-auto">
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="faqs" className="border-t pt-2">
                            <AccordionTrigger className="text-sm font-medium hover:no-underline text-primary/80">
                              <div className="flex items-center gap-2">
                                <HelpCircle className="h-4 w-4" />
                                الأسئلة الشائعة ({service.faqs.length})
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 space-y-2">
                              {service.faqs.map((faq, index) => (
                                <div key={index} className="text-xs p-2 bg-secondary/50 rounded-md">
                                  <p className="font-semibold text-foreground/90">{faq.question}</p>
                                  <p className="text-muted-foreground">{faq.answer}</p>
                                </div>
                              ))}
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Briefcase className="h-16 w-16 text-primary/30 mx-auto mb-6" />
              <p className="text-xl font-semibold text-foreground/90 mb-2">لا توجد خدمات متاحة حالياً.</p>
              <p className="text-md text-muted-foreground mb-6 max-w-md mx-auto">
                نعمل باستمرار على تحديث وإضافة خدمات جديدة. يرجى التحقق مرة أخرى لاحقًا أو التواصل معنا إذا كان لديك استفسار محدد.
              </p>
              <Button asChild>
                <Link href="/#contact">
                  <Phone className="me-2 h-5 w-5" />
                  تواصل معنا
                </Link>
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

