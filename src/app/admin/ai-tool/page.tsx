
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Lightbulb, Loader2, FileText } from "lucide-react";
import { generateReportSummary, GenerateReportSummaryOutput } from "@/ai/flows/generate-report-summary";
import { suggestReportImprovements, SuggestReportImprovementsOutput } from "@/ai/flows/suggest-report-improvements";
import { generateReportSection, GenerateReportSectionInput, GenerateReportSectionOutput } from "@/ai/flows/generate-report-section";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function AiReportToolPage() {
  const [reportText, setReportText] = useState("");
  const [summaryResult, setSummaryResult] = useState<GenerateReportSummaryOutput | null>(null);
  const [improvementSuggestions, setImprovementSuggestions] = useState<SuggestReportImprovementsOutput | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingImprovements, setIsLoadingImprovements] = useState(false);

  const [sectionTopic, setSectionTopic] = useState("");
  const [sectionKeywords, setSectionKeywords] = useState("");
  const [generatedSection, setGeneratedSection] = useState<GenerateReportSectionOutput | null>(null);
  const [isLoadingSection, setIsLoadingSection] = useState(false);

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

  const handleGenerateSection = async () => {
    if (!sectionTopic.trim()) {
      toast({ title: "خطأ", description: "يرجى إدخال موضوع القسم.", variant: "destructive" });
      return;
    }
    setIsLoadingSection(true);
    setGeneratedSection(null);
    try {
      const input: GenerateReportSectionInput = { topic: sectionTopic };
      if (sectionKeywords.trim()) {
        input.keywords = sectionKeywords;
      }
      const result = await generateReportSection(input);
      setGeneratedSection(result);
      toast({ title: "تم بنجاح", description: "تم إنشاء قسم التقرير." });
    } catch (error) {
      console.error("Error generating section:", error);
      toast({ title: "خطأ في إنشاء القسم", description: "حدث خطأ أثناء محاولة إنشاء قسم التقرير.", variant: "destructive" });
    } finally {
      setIsLoadingSection(false);
    }
  };


  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <CardTitle className="font-headline text-2xl text-primary">أداة تحليل وتحسين التقارير بالذكاء الاصطناعي</CardTitle>
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
            <Button onClick={handleGenerateSummary} disabled={isLoadingSummary || isLoadingImprovements || isLoadingSection} className="w-full sm:w-auto">
              {isLoadingSummary ? <Loader2 className="me-2 h-5 w-5 animate-spin" /> : <Sparkles className="me-2 h-5 w-5" />}
              إنشاء ملخص ورؤى
            </Button>
            <Button onClick={handleSuggestImprovements} variant="outline" disabled={isLoadingSummary || isLoadingImprovements || isLoadingSection || (!reportText && !summaryResult)} className="w-full sm:w-auto">
              {isLoadingImprovements ? <Loader2 className="me-2 h-5 w-5 animate-spin" /> : <Lightbulb className="me-2 h-5 w-5" />}
              اقتراح تحسينات
            </Button>
          </div>
        </CardContent>
      </Card>

      {summaryResult && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-primary">نتائج تحليل التقرير</CardTitle>
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
            <CardTitle className="font-headline text-xl text-primary">اقتراحات التحسين للتقرير</CardTitle>
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

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            <CardTitle className="font-headline text-2xl text-primary">إنشاء قسم تقرير بالذكاء الاصطناعي</CardTitle>
          </div>
          <CardDescription>
            قم بتوفير موضوع وكلمات مفتاحية (اختياري) لإنشاء مسودة قسم لتقريرك.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="sectionTopic" className="text-lg font-medium mb-2 block">موضوع القسم</Label>
            <Input
              id="sectionTopic"
              value={sectionTopic}
              onChange={(e) => setSectionTopic(e.target.value)}
              placeholder="مثال: تحليل المخاطر الأمنية للربع الحالي"
              className="border-2 focus:border-primary transition-colors"
            />
          </div>
          <div>
            <Label htmlFor="sectionKeywords" className="text-lg font-medium mb-2 block">كلمات مفتاحية (اختياري، مفصولة بفاصلة)</Label>
            <Input
              id="sectionKeywords"
              value={sectionKeywords}
              onChange={(e) => setSectionKeywords(e.target.value)}
              placeholder="مثال: الأمن السيبراني، الهندسة الاجتماعية، تحديثات الأنظمة"
              className="border-2 focus:border-primary transition-colors"
            />
          </div>
          <Button onClick={handleGenerateSection} disabled={isLoadingSummary || isLoadingImprovements || isLoadingSection} className="w-full sm:w-auto">
            {isLoadingSection ? <Loader2 className="me-2 h-5 w-5 animate-spin" /> : <FileText className="me-2 h-5 w-5" />}
            إنشاء قسم التقرير
          </Button>
        </CardContent>
      </Card>

      {generatedSection && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-primary">قسم التقرير المُنشأ</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap p-4 bg-secondary/50 rounded-md">
            {generatedSection.generatedSectionText}
          </CardContent>
        </Card>
      )}

    </div>
  );
}
