
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Lightbulb, Loader2, FileText, Save } from "lucide-react"; 
import { generateReportSummary, GenerateReportSummaryOutput } from "@/ai/flows/generate-report-summary";
import { suggestReportImprovements, SuggestReportImprovementsOutput } from "@/ai/flows/suggest-report-improvements";
import { generateReportSection, GenerateReportSectionInput, GenerateReportSectionOutput } from "@/ai/flows/generate-report-section";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { logActivity } from "@/lib/activityLogger";

interface ReportOption {
  id: string;
  title: string;
}

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

  const [reports, setReports] = useState<ReportOption[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | undefined>(undefined);
  const [isSavingSection, setIsSavingSection] = useState(false);
  const [isLoadingReportContent, setIsLoadingReportContent] = useState(false);

  const { toast } = useToast();
  const { user: adminUser } = useAuth();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "reports"));
        const reportOptions = querySnapshot.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title as string,
        }));
        setReports(reportOptions);
      } catch (error) {
        console.error("Error fetching reports:", error);
        toast({ title: "خطأ", description: "لم نتمكن من تحميل قائمة التقارير.", variant: "destructive" });
      }
    };
    fetchReports();
  }, [toast]);

  useEffect(() => {
    const loadReportContent = async () => {
      if (!selectedReportId) {
        setReportText(""); 
        setSummaryResult(null);
        setImprovementSuggestions(null);
        return;
      }
      setIsLoadingReportContent(true);
      setSummaryResult(null);
      setImprovementSuggestions(null);
      try {
        const reportRef = doc(db, "reports", selectedReportId);
        const reportSnap = await getDoc(reportRef);
        if (reportSnap.exists()) {
          const reportData = reportSnap.data();
          setReportText(reportData?.content || "");
          toast({ title: "تم التحميل", description: `تم تحميل محتوى التقرير: ${reportData?.title}` });
        } else {
          setReportText("");
          toast({ title: "خطأ", description: "التقرير المحدد غير موجود أو لا يحتوي على محتوى.", variant: "destructive" });
        }
      } catch (error) {
        console.error("Error loading report content:", error);
        setReportText("");
        toast({ title: "خطأ في التحميل", description: "حدث خطأ أثناء محاولة تحميل محتوى التقرير.", variant: "destructive" });
      } finally {
        setIsLoadingReportContent(false);
      }
    };
    loadReportContent();
  }, [selectedReportId, toast]);


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
      if (adminUser) {
        await logActivity({
            actionType: "AI_REPORT_SUMMARY_GENERATED",
            description: `Admin ${adminUser.displayName || adminUser.email} generated a summary for a report.`,
            actor: { id: adminUser.uid, role: "admin", name: adminUser.displayName },
            target: { type: "report", id: selectedReportId || undefined, name: selectedReportId ? reports.find(r=>r.id === selectedReportId)?.title : "Unspecified Report" },
            details: { reportLength: reportText.length, summaryLength: result.summary.length }
        });
      }
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
       if (adminUser) {
        await logActivity({
            actionType: "AI_REPORT_IMPROVEMENTS_SUGGESTED",
            description: `Admin ${adminUser.displayName || adminUser.email} requested improvements for a report.`,
            actor: { id: adminUser.uid, role: "admin", name: adminUser.displayName },
            target: { type: "report", id: selectedReportId || undefined, name: selectedReportId ? reports.find(r=>r.id === selectedReportId)?.title : "Unspecified Report" },
            details: { reportLength: textToImprove.length, suggestionsCount: result.suggestions.length }
        });
      }
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
      if (adminUser) {
        await logActivity({
            actionType: "AI_REPORT_SECTION_GENERATED",
            description: `Admin ${adminUser.displayName || adminUser.email} generated a new report section. Topic: ${sectionTopic}.`,
            actor: { id: adminUser.uid, role: "admin", name: adminUser.displayName },
            target: { type: "reportSection", name: sectionTopic },
            details: { topic: sectionTopic, keywords: sectionKeywords, sectionLength: result.generatedSectionText.length }
        });
      }
    } catch (error) {
      console.error("Error generating section:", error);
      toast({ title: "خطأ في إنشاء القسم", description: "حدث خطأ أثناء محاولة إنشاء قسم التقرير.", variant: "destructive" });
    } finally {
      setIsLoadingSection(false);
    }
  };

  const handleSaveSectionToReport = async () => {
    if (!selectedReportId || !generatedSection?.generatedSectionText) {
      toast({ title: "خطأ", description: "يرجى تحديد تقرير وإنشاء قسم لحفظه.", variant: "destructive" });
      return;
    }
    setIsSavingSection(true);
    const reportToUpdate = reports.find(r => r.id === selectedReportId);
    try {
      const reportRef = doc(db, "reports", selectedReportId);
      const reportSnap = await getDoc(reportRef);
      if (!reportSnap.exists()) {
        toast({ title: "خطأ", description: "التقرير المحدد غير موجود.", variant: "destructive" });
        setIsSavingSection(false);
        return;
      }
      const currentContent = reportSnap.data()?.content || "";
      const newContent = currentContent 
        ? `${currentContent}\n\n---\n\n${generatedSection.generatedSectionText}` 
        : generatedSection.generatedSectionText;
      
      await updateDoc(reportRef, { content: newContent });
      toast({ title: "تم الحفظ بنجاح", description: "تم حفظ القسم في التقرير المحدد." });
      
      // If the saved report is the one currently loaded in the textarea, update the textarea
      if (selectedReportId === selectedReportId) { // This condition is always true if selectedReportId is defined, so effectively checks if a report is selected
        setReportText(newContent);
      }

      if (adminUser && reportToUpdate) {
        await logActivity({
            actionType: "AI_REPORT_SECTION_APPENDED",
            description: `Admin ${adminUser.displayName || adminUser.email} appended a generated section to report: ${reportToUpdate.title}.`,
            actor: { id: adminUser.uid, role: "admin", name: adminUser.displayName },
            target: { type: "report", id: selectedReportId, name: reportToUpdate.title },
            details: { appendedSectionLength: generatedSection.generatedSectionText.length }
        });
      }
    } catch (error) {
      console.error("Error saving section to report:", error);
      toast({ title: "خطأ في الحفظ", description: "حدث خطأ أثناء محاولة حفظ القسم في التقرير.", variant: "destructive" });
    } finally {
      setIsSavingSection(false);
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
            اختر تقريرًا لتحميل محتواه، أو أدخل نصًا جديدًا. ثم استخدم الأدوات لإنشاء ملخص، اقتراح تحسينات، أو إنشاء أقسام جديدة.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div>
            <Label htmlFor="loadReport" className="text-lg font-medium mb-2 block">تحميل محتوى من تقرير موجود</Label>
            <div className="flex items-center gap-2">
              <Select 
                onValueChange={(value) => setSelectedReportId(value === "none" ? undefined : value)} 
                value={selectedReportId || "none"}
                dir="rtl"
                disabled={isLoadingReportContent || isLoadingSummary || isLoadingImprovements || isLoadingSection || isSavingSection || reports.length === 0}
              >
                <SelectTrigger id="loadReport" className="w-full">
                  <SelectValue placeholder={reports.length === 0 ? "لا توجد تقارير متاحة" : "-- اختر تقريرًا لتحميل محتواه --"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- اختر تقريرًا لتحميل محتواه --</SelectItem>
                  {reports.map(report => (
                    <SelectItem key={report.id} value={report.id}>{report.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isLoadingReportContent && <Loader2 className="h-5 w-5 animate-spin" />}
            </div>
          </div>

          <div>
            <Label htmlFor="reportText" className="text-lg font-medium mb-2 block">نص التقرير الخام</Label>
            <Textarea
              id="reportText"
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="الصق أو اكتب نص التقرير هنا، أو قم بتحميله من تقرير موجود أعلاه..."
              rows={10}
              className="border-2 focus:border-primary transition-colors"
              disabled={isLoadingReportContent || isLoadingSummary || isLoadingImprovements || isLoadingSection || isSavingSection}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={handleGenerateSummary} disabled={isLoadingReportContent || isLoadingSummary || isLoadingImprovements || isLoadingSection || isSavingSection || !reportText.trim()} className="w-full sm:w-auto">
              {isLoadingSummary ? <Loader2 className="me-2 h-5 w-5 animate-spin" /> : <Sparkles className="me-2 h-5 w-5" />}
              إنشاء ملخص ورؤى
            </Button>
            <Button onClick={handleSuggestImprovements} variant="outline" disabled={isLoadingReportContent || isLoadingSummary || isLoadingImprovements || isLoadingSection || isSavingSection || (!reportText.trim() && !summaryResult)} className="w-full sm:w-auto">
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
            قم بتوفير موضوع وكلمات مفتاحية (اختياري) لإنشاء مسودة قسم لتقريرك. يمكنك حفظ القسم المنشأ في أحد التقارير الموجودة (يجب تحديده في الأعلى أولاً).
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
              disabled={isLoadingReportContent || isLoadingSummary || isLoadingImprovements || isLoadingSection || isSavingSection}
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
              disabled={isLoadingReportContent || isLoadingSummary || isLoadingImprovements || isLoadingSection || isSavingSection}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={handleGenerateSection} disabled={isLoadingReportContent || isLoadingSummary || isLoadingImprovements || isLoadingSection || isSavingSection} className="w-full sm:w-auto">
              {isLoadingSection ? <Loader2 className="me-2 h-5 w-5 animate-spin" /> : <FileText className="me-2 h-5 w-5" />}
              إنشاء قسم التقرير
            </Button>
             <Button 
                onClick={handleSaveSectionToReport} 
                disabled={!selectedReportId || !generatedSection || isLoadingReportContent || isLoadingSummary || isLoadingImprovements || isLoadingSection || isSavingSection} 
                variant="outline"
                className="w-full sm:w-auto"
              >
              {isSavingSection ? <Loader2 className="me-2 h-5 w-5 animate-spin" /> : <Save className="me-2 h-5 w-5" />}
              حفظ القسم في التقرير المحدد (أعلاه)
            </Button>
          </div>
           { !selectedReportId && generatedSection && (
            <p className="text-sm text-destructive">ملاحظة: لحفظ هذا القسم، يرجى تحديد تقرير من القائمة في أعلى الصفحة أولاً.</p>
           )}
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
