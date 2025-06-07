
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

interface AggregatedFAQ extends FAQItemData {
  serviceName: string;
  serviceId: string;
}

export default function ClientFAQPage() {
  const [aggregatedFAQs, setAggregatedFAQs] = useState<AggregatedFAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchFAQs = async () => {
      setIsLoading(true);
      try {
        const servicesQuery = query(
          collection(db, "services"),
          where("status", "==", "متاحة")
        );
        const querySnapshot = await getDocs(servicesQuery);
        
        let allFAQs: AggregatedFAQ[] = [];
        querySnapshot.forEach((doc) => {
          const serviceData = doc.data();
          const service = { id: doc.id, ...serviceData } as ServiceWithFAQs;
          if (service.faqs && service.faqs.length > 0) {
            const serviceFAQs = service.faqs.map(faq => ({
              ...faq,
              serviceName: service.name,
              serviceId: service.id,
            }));
            allFAQs = allFAQs.concat(serviceFAQs);
          }
        });
        
        // Optional: Sort FAQs, e.g., by service name then by question
        allFAQs.sort((a, b) => {
          if (a.serviceName < b.serviceName) return -1;
          if (a.serviceName > b.serviceName) return 1;
          if (a.question < b.question) return -1;
          if (a.question > b.question) return 1;
          return 0;
        });

        setAggregatedFAQs(allFAQs);

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
          ) : aggregatedFAQs.length > 0 ? (
            <Accordion type="single" collapsible className="w-full space-y-2">
              {aggregatedFAQs.map((faq, index) => (
                <AccordionItem value={`faq-${index}`} key={index} className="bg-card border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <AccordionTrigger className="p-4 text-md font-semibold text-start hover:no-underline">
                    <div className="flex flex-col">
                        <span className="text-primary">{faq.question}</span>
                        <span className="text-xs text-muted-foreground mt-1">عن خدمة: {faq.serviceName}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 pt-0">
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap bg-secondary/40 p-3 rounded-md">
                      {faq.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
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
