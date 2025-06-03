
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Lightbulb, Loader2 } from "lucide-react";
import { generateReportSummary, GenerateReportSummaryOutput } from "@/ai/flows/generate-report-summary";
import { suggestReportImprovements, SuggestReportImprovementsOutput } from "@/ai/flows/suggest-report-improvements";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function AiReportToolPage() {
  const [reportText, setReportText] = useState("");
  const [summaryResult, setSummaryResult] = useState<GenerateReportSummaryOutput | null>(null);
  const [improvementSuggestions, setImprovementSuggestions] = useState<SuggestReportImprovementsOutput | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingImprovements, setIsLoadingImprovements] = useState(false);
  const { toast } = useToast();

  const handleGenerateSummary = async () => {
    if (!reportText.trim()) {
      toast({ title: "خطأ", description: "يرجى إدخال نص التقرير أولاً.", variant: "destructive" });
      return;
    }
    setIsLoadingSummary(true);
    setSummaryResult(null);
    setImprovementSuggestions(null); 
    try {
      const result = await generateReportSummary({ reportText });
      setSummaryResult(result);
      toast({ title: "تم بنجاح", description: "تم إنشاء ملخص التقرير واستخلاص الرؤى." });
    } catch (error) {
      console.error("Error generating summary:", error);
      toast({ title: "خطأ في إنشاء الملخص", description: "حدث خطأ أثناء محاولة إنشاء الملخص.", variant: "destructive" });
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleSuggestImprovements = async () => {
    const textToImprove = summaryResult?.summary || reportText;
    if (!textToImprove.trim()) {
      toast({ title: "خطأ", description: "يرجى إدخال نص التقرير أو إنشاء ملخص أولاً.", variant: "destructive" });
      return;
    }
    setIsLoadingImprovements(true);
    setImprovementSuggestions(null);
    try {
      const result = await suggestReportImprovements({ report: textToImprove });
      setImprovementSuggestions(result);
      toast({ title: "تم بنجاح", description: "تم اقتراح تحسينات للتقرير." });
    } catch (error) {
      console.error("Error suggesting improvements:", error);
      toast({ title: "خطأ في اقتراح التحسينات", description: "حدث خطأ أثناء محاولة اقتراح التحسينات.", variant: "destructive" });
    } finally {
      setIsLoadingImprovements(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <CardTitle className="font-headline text-2xl text-primary">أداة إنشاء التقارير بالذكاء الاصطناعي</CardTitle>
          </div>
          <CardDescription>
            استخدم هذه الأداة لإدخال نص تقرير والحصول على ملخص، رؤى رئيسية، واقتراحات للتحسين مدعومة بالذكاء الاصطناعي.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="reportText" className="text-lg font-medium mb-2 block">نص التقرير الخام</Label>
            <Textarea
              id="reportText"
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="الصق أو اكتب نص التقرير هنا..."
              rows={10}
              className="border-2 focus:border-primary transition-colors"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={handleGenerateSummary} disabled={isLoadingSummary || isLoadingImprovements} className="w-full sm:w-auto">
              {isLoadingSummary ? <Loader2 className="me-2 h-5 w-5 animate-spin" /> : <Sparkles className="me-2 h-5 w-5" />}
              إنشاء ملخص ورؤى
            </Button>
            <Button onClick={handleSuggestImprovements} variant="outline" disabled={isLoadingSummary || isLoadingImprovements || (!reportText && !summaryResult)} className="w-full sm:w-auto">
              {isLoadingImprovements ? <Loader2 className="me-2 h-5 w-5 animate-spin" /> : <Lightbulb className="me-2 h-5 w-5" />}
              اقتراح تحسينات
            </Button>
          </div>
        </CardContent>
      </Card>

      {summaryResult && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-primary">نتائج التحليل</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Accordion type="single" collapsible defaultValue="summary">
              <AccordionItem value="summary">
                <AccordionTrigger className="text-lg font-semibold">ملخص التقرير</AccordionTrigger>
                <AccordionContent className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap p-4 bg-secondary/50 rounded-md">
                  {summaryResult.summary}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="insights">
                <AccordionTrigger className="text-lg font-semibold">الرؤى الرئيسية</AccordionTrigger>
                <AccordionContent className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap p-4 bg-secondary/50 rounded-md">
                  {summaryResult.insights}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}

      {improvementSuggestions && improvementSuggestions.suggestions.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-primary">اقتراحات التحسين</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc ps-5 space-y-2 text-muted-foreground">
              {improvementSuggestions.suggestions.map((suggestion, index) => (
                <li key={index} className="leading-relaxed">{suggestion}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
