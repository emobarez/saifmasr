
"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, HelpCircle, Info } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface FAQItemData {
  question: string;
  answer: string;
}

interface ServiceWithFAQs {
  id: string;
  name: string;
  faqs: FAQItemData[];
}

export default function ClientFAQPage() {
  const [servicesWithFAQs, setServicesWithFAQs] = useState<ServiceWithFAQs[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchFAQs = async () => {
      setIsLoading(true);
      try {
        const servicesQuery = query(
          collection(db, "services"),
          where("status", "==", "متاحة"),
          orderBy("name", "asc") // Sort by service name
        );
        const querySnapshot = await getDocs(servicesQuery);
        
        const fetchedServices: ServiceWithFAQs[] = [];
        querySnapshot.forEach((doc) => {
          const serviceData = doc.data();
          // Ensure faqs is an array and filter out services with no FAQs or empty FAQs array
          if (Array.isArray(serviceData.faqs) && serviceData.faqs.length > 0) {
            fetchedServices.push({
              id: doc.id,
              name: serviceData.name as string,
              faqs: serviceData.faqs as FAQItemData[],
            });
          }
        });
        
        setServicesWithFAQs(fetchedServices);

      } catch (error) {
        console.error("Error fetching FAQs:", error);
        toast({ title: "خطأ", description: "لم نتمكن من تحميل الأسئلة الشائعة.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchFAQs();
  }, [toast]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-7 w-7 text-primary" />
            <CardTitle className="font-headline text-xl text-primary">الأسئلة الشائعة</CardTitle>
          </div>
          <CardDescription>
            تجد هنا إجابات للأسئلة الأكثر شيوعاً حول خدماتنا.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="ms-3 text-lg text-muted-foreground">جارٍ تحميل الأسئلة...</p>
            </div>
          ) : servicesWithFAQs.length > 0 ? (
            <div className="space-y-6">
              {servicesWithFAQs.map((service) => (
                <Card key={service.id} className="shadow-md">
                  <CardHeader>
                    <CardTitle className="font-headline text-lg text-primary flex items-center gap-2">
                      <HelpCircle className="h-6 w-6 opacity-80" />
                      أسئلة شائعة لخدمة: {service.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {service.faqs.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full space-y-2">
                        {service.faqs.map((faq, index) => (
                            <AccordionItem value={`faq-${service.id}-${index}`} key={`faq-${service.id}-${index}`} className="bg-secondary/40 rounded-md shadow-sm hover:shadow-md transition-shadow">
                            <AccordionTrigger className="p-3 text-md font-semibold text-start hover:no-underline text-foreground">
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="p-3 pt-0">
                                <p className="text-sm text-foreground/80 whitespace-pre-wrap bg-background/50 p-2 rounded-sm">
                                {faq.answer}
                                </p>
                            </AccordionContent>
                            </AccordionItem>
                        ))}
                        </Accordion>
                    ) : (
                        <p className="text-sm text-muted-foreground">لا توجد أسئلة شائعة متاحة لهذه الخدمة حاليًا.</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Info className="h-12 w-12 mx-auto mb-4 text-primary/30" />
              <p className="text-lg">لا توجد أسئلة شائعة متاحة حالياً.</p>
              <p className="text-sm mt-1">يرجى مراجعة هذه الصفحة لاحقاً أو التواصل معنا إذا كان لديك أي استفسار.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

