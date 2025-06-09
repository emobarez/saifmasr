
"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Loader2, Briefcase, Tag, CreditCard, HelpCircle, ArrowLeftCircle, ListPlus, AlertTriangle, Info } from "lucide-react";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
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
  createdAt?: Timestamp | Date; // Optional for existing data
  faqs?: FAQItem[];
}

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.serviceId as string;
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!serviceId) {
      setIsLoading(false);
      toast({ title: "خطأ", description: "معرف الخدمة غير موجود.", variant: "destructive" });
      router.push("/services"); // Redirect if no ID
      return;
    }

    const fetchService = async () => {
      setIsLoading(true);
      try {
        const serviceRef = doc(db, "services", serviceId);
        const docSnap = await getDoc(serviceRef);

        if (docSnap.exists()) {
          const serviceData = docSnap.data() as Service;
          if (serviceData.status === "متاحة") {
            setService({ id: docSnap.id, ...serviceData });
          } else {
            setService(null); // Service exists but is not available
            toast({ title: "خدمة غير متاحة", description: "هذه الخدمة غير متاحة حاليًا.", variant: "default" });
          }
        } else {
          setService(null);
          toast({ title: "خطأ", description: "لم يتم العثور على الخدمة المطلوبة.", variant: "destructive" });
        }
      } catch (error) {
        console.error("Error fetching service:", error);
        toast({ title: "خطأ", description: "حدث خطأ أثناء تحميل تفاصيل الخدمة.", variant: "destructive" });
        setService(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchService();
  }, [serviceId, toast, router]);

  const getServiceImageHint = (category: string) => {
    if (!category) return "business detail";
    return category.split(' ').slice(0, 2).join(' ').toLowerCase();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ms-3 text-lg text-muted-foreground">جارٍ تحميل تفاصيل الخدمة...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-6 py-12 md:py-20 text-center">
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-6" />
          <h1 className="text-3xl font-bold font-headline mb-4 text-destructive">خدمة غير موجودة أو غير متاحة</h1>
          <p className="text-lg text-muted-foreground mb-8">
            عفواً، الخدمة التي تبحث عنها إما أنها غير موجودة أو ليست متاحة للعرض في الوقت الحالي.
          </p>
          <Button asChild variant="outline">
            <Link href="/services">
              <ArrowLeftCircle className="me-2 h-5 w-5" />
              العودة إلى قائمة الخدمات
            </Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow py-12 md:py-20 bg-gradient-to-br from-background to-secondary/30">
        <div className="container mx-auto px-4 md:px-6">
          <Card className="shadow-xl overflow-hidden">
            <div className="relative h-64 md:h-80 w-full">
              <Image
                src={`https://placehold.co/1200x400.png`}
                alt={service.name}
                fill
                style={{objectFit:"cover"}}
                className="bg-muted"
                priority
                data-ai-hint={getServiceImageHint(service.category)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 md:p-8">
                 <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary-foreground mb-2 shadow-text">
                    {service.name}
                </h1>
                <div className="flex flex-wrap gap-2 text-sm">
                    <Badge variant="secondary" className="bg-primary/80 text-primary-foreground border-primary-foreground/50 flex items-center gap-1 shadow-md">
                        <Tag className="h-4 w-4" /> {service.category}
                    </Badge>
                    <Badge variant="secondary" className="bg-accent/80 text-accent-foreground border-accent-foreground/50 flex items-center gap-1 shadow-md">
                        <CreditCard className="h-4 w-4" /> {service.price}
                    </Badge>
                </div>
              </div>
            </div>
            
            <CardContent className="p-6 md:p-8">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                  <h2 className="text-2xl font-semibold font-headline text-primary mb-4">وصف الخدمة</h2>
                  <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
                    {service.description}
                  </p>

                  {service.faqs && service.faqs.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-xl font-semibold font-headline text-primary mb-3 flex items-center gap-2">
                        <HelpCircle className="h-6 w-6" />
                        الأسئلة الشائعة
                      </h3>
                      <Accordion type="single" collapsible className="w-full space-y-2">
                        {service.faqs.map((faq, index) => (
                          <AccordionItem value={`faq-${index}`} key={index} className="bg-card border rounded-md shadow-sm hover:shadow-md transition-shadow">
                            <AccordionTrigger className="p-4 text-md font-medium text-start hover:no-underline text-foreground">
                              {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="p-4 pt-0">
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-secondary/30 p-3 rounded-sm">
                                {faq.answer}
                              </p>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  )}
                </div>

                <div className="md:col-span-1 space-y-6">
                  <Card className="bg-secondary/50 shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg font-headline text-primary flex items-center gap-2"><ListPlus className="h-5 w-5"/>هل أنت مهتم بهذه الخدمة؟</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        يمكنك طلب هذه الخدمة مباشرة من خلال بوابة العملاء الخاصة بنا.
                      </p>
                      <Button asChild className="w-full font-semibold">
                        <Link href="/client/requests">
                           طلب الخدمة الآن
                          <ArrowLeftCircle className="ms-2 h-5 w-5 rotate-180" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/services">
                      <ArrowLeftCircle className="me-2 h-5 w-5" />
                      العودة إلى جميع الخدمات
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
      <style jsx global>{`
        .shadow-text {
          text-shadow: 1px 1px 3px rgba(0,0,0,0.5);
        }
      `}</style>
    </div>
  );
}
