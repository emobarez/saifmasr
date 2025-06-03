
"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FilePlus2, Sparkles } from "lucide-react";
import Link from "next/link";

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <CardTitle className="font-headline text-xl text-primary">إنشاء وإدارة التقارير</CardTitle>
              <CardDescription>استخدم أدوات الذكاء الاصطناعي لإنشاء وتلخيص وتحسين محتوى التقارير.</CardDescription>
            </div>
            <Button asChild className="mt-4 md:mt-0">
              <Link href="/admin/ai-tool">
                <FilePlus2 className="me-2 h-5 w-5" />
                الانتقال إلى أداة إنشاء التقارير بالـ AI
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-secondary/50 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">الاستفادة من أداة التقارير الذكية</h3>
            </div>
            <p className="text-muted-foreground mb-2">
              توفر لك أداة الذكاء الاصطناعي المدمجة القدرة على:
            </p>
            <ul className="list-disc ps-6 space-y-1 text-muted-foreground">
              <li>إنشاء ملخصات تنفيذية للتقارير الطويلة.</li>
              <li>اقتراح تحسينات لجعل تقاريرك أكثر فعالية.</li>
              <li>توليد مسودات لأقسام كاملة بناءً على موضوع وكلمات مفتاحية.</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              هذه الأدوات مصممة لمساعدتك في توفير الوقت وزيادة جودة التقارير المقدمة.
              انقر على الزر أعلاه للبدء في استخدامها.
            </p>
          </div>
          
          <div className="text-center text-muted-foreground py-4">
            <p> حالياً، يتم التركيز على إنشاء محتوى التقارير وتعديله باستخدام أداة الذكاء الاصطناعي. </p>
            <p>يمكن حفظ النصوص المنشأة من الأداة بشكل يدوي واستخدامها حسب الحاجة.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
