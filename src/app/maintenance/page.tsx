
"use client";
import { ShieldAlert, Tool } from "lucide-react";
import { usePortalName } from "@/hooks/usePortalName";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MaintenancePage() {
  const { portalName, isLoadingPortalName } = usePortalName();
  const displayPortalName = isLoadingPortalName ? "..." : portalName;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center p-6" dir="rtl">
      <div className="bg-card p-8 md:p-12 rounded-xl shadow-2xl max-w-lg w-full">
        <ShieldAlert className="h-20 w-20 text-primary mx-auto mb-6" />
        <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary mb-4">
          صيانة مجدولة
        </h1>
        <p className="text-lg text-foreground/80 mb-2">
          عفواً، {displayPortalName} يخضع حالياً لأعمال صيانة مجدولة لتحسين خدماتنا.
        </p>
        <p className="text-md text-muted-foreground mb-8">
          نحن نعمل بجد لإعادة كل شيء إلى طبيعته في أقرب وقت ممكن. شكراً لتفهمكم وصبركم.
        </p>
        <div className="flex items-center justify-center text-primary mb-6">
          <Tool className="h-6 w-6 me-2 animate-spin-slow" />
          <p className="font-semibold">جاري العمل على التحسينات...</p>
        </div>
         <Button asChild variant="outline">
            <Link href="/">العودة للصفحة الرئيسية</Link>
        </Button>
      </div>
       <style jsx global>{`
        @keyframes spin-slow {
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
