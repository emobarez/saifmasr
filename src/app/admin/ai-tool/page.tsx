"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Brain, 
  FileText, 
  HelpCircle, 
  Tag, 
  Sparkles, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Copy,
  Download,
  RefreshCw,
  Wand2,
  MessageSquare,
  BarChart3,
  TrendingUp,
  Users,
  Activity
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AI_TOOL_TEMPLATES } from "@/lib/ai-templates";
import { AI_BEST_PRACTICES } from "@/lib/ai-usage-guide";

interface AIToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

interface FAQ {
  question: string;
  answer: string;
}

interface AIStats {
  totalUsage: number;
  totalErrors: number;
  successRate: string;
  usageByType: Array<{type: string; count: number}>;
  topUsers: Array<{user: {name: string; email: string}; count: number}>;
  period: string;
}

export default function AdminAIToolPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{[key: string]: any}>({});
  const [stats, setStats] = useState<AIStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Report Summary State
  const [reportText, setReportText] = useState("");
  const [reportSummary, setReportSummary] = useState<{summary: string; insights: string} | null>(null);

  // Service FAQs State
  const [serviceName, setServiceName] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [faqCount, setFaqCount] = useState(5);
  const [generatedFAQs, setGeneratedFAQs] = useState<FAQ[]>([]);

  // Service Category State
  const [categoryServiceName, setCategoryServiceName] = useState("");
  const [categoryServiceDescription, setCategoryServiceDescription] = useState("");
  const [suggestedCategory, setSuggestedCategory] = useState("");

  // Load AI statistics on component mount
  useEffect(() => {
    loadAIStats();
  }, []);

  const loadAIStats = async () => {
    setStatsLoading(true);
    try {
      const response = await fetch('/api/ai/stats?days=30');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load AI stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const callAITool = async (action: string, data: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data })
      });

      const result: AIToolResult = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'فشل في الطلب');
      }

      setResults(prev => ({ ...prev, [action]: result.data }));
      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReportSummary = async () => {
    if (!reportText.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال نص التقرير",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await callAITool('generate-report-summary', { reportText });
      setReportSummary(result);
      toast({
        title: "نجح",
        description: "تم إنشاء ملخص التقرير بنجاح",
      });
    } catch (error) {
      // Error handling in callAITool
    }
  };

  const handleGenerateServiceFAQs = async () => {
    if (!serviceName.trim() || !serviceDescription.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم الخدمة والوصف",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await callAITool('generate-service-faqs', {
        serviceName,
        serviceDescription,
        faqCount
      });
      setGeneratedFAQs(result.faqs);
      toast({
        title: "نجح",
        description: `تم إنشاء ${result.faqs.length} أسئلة شائعة بنجاح`,
      });
    } catch (error) {
      // Error handling in callAITool
    }
  };

  const handleSuggestCategory = async () => {
    if (!categoryServiceName.trim() || !categoryServiceDescription.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم الخدمة والوصف",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await callAITool('suggest-service-category', {
        serviceName: categoryServiceName,
        serviceDescription: categoryServiceDescription
      });
      setSuggestedCategory(result.suggestedCategory);
      toast({
        title: "نجح",
        description: "تم اقتراح التصنيف بنجاح",
      });
    } catch (error) {
      // Error handling in callAITool
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "تم النسخ",
      description: "تم نسخ النص إلى الحافظة",
    });
  };

  const downloadAsJSON = (data: any, filename: string) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full overflow-x-auto md:overflow-x-visible force-scrollbar">
      <div className="space-y-3 xs:space-y-4 sm:space-y-6 lg:space-y-8 min-h-screen min-w-[800px] md:min-w-0 p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              أدوات الذكاء الاصطناعي
            </h1>
            <p className="text-muted-foreground">
              استخدم قوة الذكاء الاصطناعي لتحسين أعمالك وزيادة الإنتاجية
            </p>
          </div>
        </div>

        {/* AI Tools Tabs */}
        <Tabs defaultValue="report-summary" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="report-summary" className="flex items-center space-x-2 space-x-reverse">
              <FileText className="h-4 w-4" />
              <span>ملخص التقارير</span>
            </TabsTrigger>
            <TabsTrigger value="service-faqs" className="flex items-center space-x-2 space-x-reverse">
              <HelpCircle className="h-4 w-4" />
              <span>الأسئلة الشائعة</span>
            </TabsTrigger>
            <TabsTrigger value="service-category" className="flex items-center space-x-2 space-x-reverse">
              <Tag className="h-4 w-4" />
              <span>تصنيف الخدمات</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center space-x-2 space-x-reverse">
              <BarChart3 className="h-4 w-4" />
              <span>الإحصائيات</span>
            </TabsTrigger>
          </TabsList>

          {/* Report Summary Tool */}
          <TabsContent value="report-summary" className="space-y-6">
            <Card className="border-2 border-dashed border-purple-200 hover:border-purple-300 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse text-purple-700">
                  <BarChart3 className="h-5 w-5" />
                  <span>إنشاء ملخص التقرير</span>
                </CardTitle>
                <CardDescription>
                  استخدم الذكاء الاصطناعي لإنشاء ملخص شامل ورؤى من النصوص الطويلة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="report-text">نص التقرير</Label>
                    <div className="flex space-x-2 space-x-reverse">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReportText(AI_TOOL_TEMPLATES.reportSummary.businessReport.template)}
                      >
                        قالب تقرير أعمال
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReportText(AI_TOOL_TEMPLATES.reportSummary.financialReport.template)}
                      >
                        قالب تقرير مالي
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    id="report-text"
                    placeholder="الصق نص التقرير هنا..."
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    rows={8}
                    className="resize-none"
                  />
                </div>
                
                <Button 
                  onClick={handleGenerateReportSummary} 
                  disabled={loading || !reportText.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 me-2 animate-spin" />
                      جاري الإنشاء...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 me-2" />
                      إنشاء الملخص
                    </>
                  )}
                </Button>

                {reportSummary && (
                  <div className="space-y-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-purple-700">النتائج</h3>
                      <div className="flex space-x-2 space-x-reverse">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(JSON.stringify(reportSummary, null, 2))}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadAsJSON(reportSummary, 'report-summary')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm text-purple-600 mb-2">الملخص</h4>
                        <p className="text-sm bg-white p-3 rounded border">{reportSummary.summary}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm text-blue-600 mb-2">الرؤى الرئيسية</h4>
                        <p className="text-sm bg-white p-3 rounded border">{reportSummary.insights}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Service FAQs Tool */}
          <TabsContent value="service-faqs" className="space-y-6">
            <Card className="border-2 border-dashed border-green-200 hover:border-green-300 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse text-green-700">
                  <MessageSquare className="h-5 w-5" />
                  <span>إنشاء الأسئلة الشائعة</span>
                </CardTitle>
                <CardDescription>
                  اسمح للذكاء الاصطناعي بإنشاء أسئلة شائعة تفاعلية لخدماتك
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="mb-4">
                  <Label className="text-sm font-medium">قوالب جاهزة:</Label>
                  <div className="flex space-x-2 space-x-reverse mt-2">
                    {Object.entries(AI_TOOL_TEMPLATES.serviceFAQs).map(([key, template]) => (
                      <Button
                        key={key}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setServiceName(template.serviceName);
                          setServiceDescription(template.description);
                        }}
                      >
                        {template.name}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="service-name">اسم الخدمة</Label>
                    <Input
                      id="service-name"
                      placeholder="مثال: استشارات تقنية"
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="faq-count">عدد الأسئلة</Label>
                    <Input
                      id="faq-count"
                      type="number"
                      min="3"
                      max="10"
                      value={faqCount}
                      onChange={(e) => setFaqCount(parseInt(e.target.value) || 5)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="service-description">وصف الخدمة</Label>
                  <Textarea
                    id="service-description"
                    placeholder="وصف مفصل للخدمة ومميزاتها..."
                    value={serviceDescription}
                    onChange={(e) => setServiceDescription(e.target.value)}
                    rows={4}
                  />
                </div>
                
                <Button 
                  onClick={handleGenerateServiceFAQs} 
                  disabled={loading || !serviceName.trim() || !serviceDescription.trim()}
                  className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 me-2 animate-spin" />
                      جاري الإنشاء...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 me-2" />
                      إنشاء الأسئلة الشائعة
                    </>
                  )}
                </Button>

                {generatedFAQs.length > 0 && (
                  <div className="space-y-4 p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-green-700">الأسئلة الشائعة المُنشأة</h3>
                      <div className="flex space-x-2 space-x-reverse">
                        <Badge variant="secondary">{generatedFAQs.length} أسئلة</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadAsJSON(generatedFAQs, 'service-faqs')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {generatedFAQs.map((faq, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg border">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-green-700 mb-2">
                                س{index + 1}: {faq.question}
                              </h4>
                              <p className="text-sm text-gray-700">{faq.answer}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(`${faq.question}\n${faq.answer}`)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Service Category Tool */}
          <TabsContent value="service-category" className="space-y-6">
            <Card className="border-2 border-dashed border-orange-200 hover:border-orange-300 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse text-orange-700">
                  <Tag className="h-5 w-5" />
                  <span>اقتراح تصنيف الخدمة</span>
                </CardTitle>
                <CardDescription>
                  دع الذكاء الاصطناعي يقترح التصنيف الأمثل لخدماتك بناءً على الوصف
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="mb-4">
                  <Label className="text-sm font-medium">قوالب جاهزة:</Label>
                  <div className="flex space-x-2 space-x-reverse mt-2">
                    {Object.entries(AI_TOOL_TEMPLATES.serviceFAQs).map(([key, template]) => (
                      <Button
                        key={key}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCategoryServiceName(template.serviceName);
                          setCategoryServiceDescription(template.description);
                        }}
                      >
                        {template.name}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category-service-name">اسم الخدمة</Label>
                  <Input
                    id="category-service-name"
                    placeholder="مثال: تطوير مواقع إلكترونية"
                    value={categoryServiceName}
                    onChange={(e) => setCategoryServiceName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category-service-description">وصف الخدمة</Label>
                  <Textarea
                    id="category-service-description"
                    placeholder="وصف مفصل للخدمة..."
                    value={categoryServiceDescription}
                    onChange={(e) => setCategoryServiceDescription(e.target.value)}
                    rows={4}
                  />
                </div>
                
                <Button 
                  onClick={handleSuggestCategory} 
                  disabled={loading || !categoryServiceName.trim() || !categoryServiceDescription.trim()}
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 me-2 animate-spin" />
                      جاري التحليل...
                    </>
                  ) : (
                    <>
                      <Tag className="h-4 w-4 me-2" />
                      اقتراح التصنيف
                    </>
                  )}
                </Button>

                {suggestedCategory && (
                  <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-orange-700">التصنيف المقترح</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(suggestedCategory)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="mt-3">
                      <Badge 
                        variant="secondary" 
                        className="text-lg px-4 py-2 bg-gradient-to-r from-orange-100 to-red-100 text-orange-800"
                      >
                        {suggestedCategory}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Statistics Tab */}
          <TabsContent value="stats" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">إحصائيات استخدام الذكاء الاصطناعي</h2>
              <Button 
                onClick={loadAIStats} 
                disabled={statsLoading}
                variant="outline"
                size="sm"
              >
                {statsLoading ? (
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 me-2" />
                )}
                تحديث
              </Button>
            </div>

            {statsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : stats ? (
              <>
                {/* Stats Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <div className="p-2 bg-blue-500 rounded-lg">
                          <Activity className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-600">إجمالي الاستخدام</p>
                          <p className="text-2xl font-bold text-blue-700">{stats.totalUsage}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <div className="p-2 bg-red-500 rounded-lg">
                          <AlertCircle className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-red-600">إجمالي الأخطاء</p>
                          <p className="text-2xl font-bold text-red-700">{stats.totalErrors}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <div className="p-2 bg-green-500 rounded-lg">
                          <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-600">معدل النجاح</p>
                          <p className="text-2xl font-bold text-green-700">{stats.successRate}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <div className="p-2 bg-purple-500 rounded-lg">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-purple-600">المستخدمون النشطون</p>
                          <p className="text-2xl font-bold text-purple-700">{stats.topUsers.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Usage by Type */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 space-x-reverse">
                      <BarChart3 className="h-5 w-5" />
                      <span>الاستخدام حسب نوع الأداة</span>
                    </CardTitle>
                    <CardDescription>{stats.period}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.usageByType.map((type, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">{type.type}</span>
                          <Badge variant="secondary">{type.count} استخدام</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Users */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 space-x-reverse">
                      <Users className="h-5 w-5" />
                      <span>أكثر المستخدمين نشاطاً</span>
                    </CardTitle>
                    <CardDescription>{stats.period}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.topUsers.map((user, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{user.user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.user.email}</p>
                          </div>
                          <Badge variant="outline">{user.count} استخدام</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">لا توجد بيانات</h3>
                  <p className="text-sm text-muted-foreground">لا توجد إحصائيات متاحة في الوقت الحالي</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* AI Usage Tips */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse text-blue-700">
              <Sparkles className="h-5 w-5" />
              <span>أفضل الممارسات لاستخدام أدوات الذكاء الاصطناعي</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {AI_BEST_PRACTICES.map((practice, index) => (
                <div key={index} className="flex items-start space-x-3 space-x-reverse">
                  <span className="text-2xl flex-shrink-0">{practice.icon}</span>
                  <div>
                    <h4 className="font-medium text-sm">{practice.title}</h4>
                    <p className="text-xs text-muted-foreground">{practice.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
