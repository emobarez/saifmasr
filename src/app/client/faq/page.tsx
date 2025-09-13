"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Search, HelpCircle, Phone, Mail, MessageCircle, Star } from "lucide-react";

const faqData = [
  {
    id: "general",
    category: "عام",
    color: "bg-blue-100 text-blue-800",
    questions: [
      {
        question: "ما هي أنواع الخدمات الأمنية التي تقدمونها؟",
        answer: "نقدم مجموعة شاملة من الخدمات الأمنية تشمل: الحراسة الأمنية للمنشآت، تأمين الفعاليات والمؤتمرات، الاستشارات الأمنية، التحقيقات الخاصة، وبرامج التدريب الأمني. جميع خدماتنا معتمدة ومرخصة من الجهات المختصة."
      },
      {
        question: "هل تعملون على مدار 24 ساعة؟",
        answer: "نعم، نقدم خدماتنا على مدار الساعة طوال أيام الأسبوع. لدينا فرق عمل متخصصة للنوبات المختلفة ومركز عمليات يعمل دون انقطاع لضمان الاستجابة السريعة لأي طارئ."
      },
      {
        question: "في أي المناطق تقدمون خدماتكم؟",
        answer: "نغطي جميع محافظات جمهورية مصر العربية، مع مكاتب رئيسية في القاهرة والإسكندرية وأسوان والأقصر. كما نوفر خدمات متخصصة في المناطق النائية والصحراوية حسب الحاجة."
      }
    ]
  },
  {
    id: "services",
    category: "الخدمات",
    color: "bg-green-100 text-green-800",
    questions: [
      {
        question: "كيف يمكنني طلب خدمة حراسة أمنية؟",
        answer: "يمكنك طلب الخدمة من خلال: 1) تعبئة نموذج طلب الخدمة في لوحة التحكم، 2) الاتصال بخدمة العملاء على +20 2 1234 5678، 3) زيارة أحد مكاتبنا، أو 4) التواصل عبر البريد الإلكتروني. سيقوم فريقنا بدراسة طلبك وتقديم عرض مخصص خلال 24 ساعة."
      },
      {
        question: "ما هي مؤهلات وخبرات حراس الأمن لديكم؟",
        answer: "جميع حراس الأمن لدينا مدربون ومرخصون من قبل الجهات المختصة. يحملون شهادات تدريب متخصصة في: الأمن والحماية، الإسعافات الأولية، مكافحة الحرائق، والتعامل مع الطوارئ. كما يخضعون لفحوصات أمنية شاملة وبرامج تدريب مستمرة."
      },
      {
        question: "هل تقدمون خدمات أمنية للفعاليات الخاصة؟",
        answer: "نعم، نتخصص في تأمين جميع أنواع الفعاليات: المؤتمرات، المعارض، الحفلات، الفعاليات الرياضية، والمناسبات الاجتماعية. نقوم بوضع خطة أمنية شاملة تشمل تقييم المخاطر، تأمين المداخل والمخارج، والمراقبة المستمرة."
      }
    ]
  },
  {
    id: "pricing",
    category: "الأسعار والدفع",
    color: "bg-purple-100 text-purple-800",
    questions: [
      {
        question: "كيف يتم تحديد أسعار الخدمات؟",
        answer: "تحدد الأسعار بناءً على عدة عوامل: نوع الخدمة المطلوبة، مدة الخدمة، عدد الحراس المطلوبين، موقع الخدمة، ومستوى المخاطر. نقدم عروض أسعار مخصصة ومفصلة لكل عميل مع إمكانية التفاوض للعقود طويلة المدى."
      },
      {
        question: "ما هي طرق الدفع المتاحة؟",
        answer: "نقبل جميع طرق الدفع الرئيسية: البطاقات الائتمانية (فيزا، ماستركارد، مدى)، التحويل البنكي، الشيكات، والمحافظ الرقمية (فودافون كاش، Instapay، Orange Money). كما نوفر خيارات دفع مرنة للعقود طويلة المدى."
      },
      {
        question: "هل هناك خصومات للعقود طويلة المدى؟",
        answer: "نعم، نقدم خصومات تنافسية للعقود طويلة المدى (6 أشهر فأكثر). كما نوفر باقات خاصة للشركات والمؤسسات الحكومية. تواصل مع فريق المبيعات للحصول على عرض مخصص."
      }
    ]
  },
  {
    id: "technical",
    category: "الدعم التقني",
    color: "bg-orange-100 text-orange-800",
    questions: [
      {
        question: "كيف يمكنني تتبع طلباتي؟",
        answer: "يمكنك تتبع جميع طلباتك من خلال لوحة التحكم في قسم 'تتبع الطلبات'. ستجد معلومات تفصيلية عن حالة كل طلب، التواريخ المهمة، والتحديثات. كما ستصلك إشعارات تلقائية عبر البريد الإلكتروني أو الرسائل النصية."
      },
      {
        question: "نسيت كلمة المرور، كيف يمكنني استعادتها؟",
        answer: "انقر على 'نسيت كلمة المرور' في صفحة تسجيل الدخول، أدخل بريدك الإلكتروني المسجل، وستصلك رسالة لإعادة تعيين كلمة المرور. إذا واجهت مشاكل، تواصل مع الدعم التقني."
      },
      {
        question: "كيف يمكنني تحديث معلوماتي الشخصية؟",
        answer: "ادخل إلى قسم 'الملف الشخصي' في لوحة التحكم، حيث يمكنك تحديث جميع معلوماتك: الاسم، العنوان، رقم الهاتف، البريد الإلكتروني، ومعلومات الفوترة. لا تنس حفظ التغييرات."
      }
    ]
  }
];

export default function ClientFAQPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredFAQ = faqData.filter(category => {
    if (selectedCategory !== "all" && category.id !== selectedCategory) return false;
    
    if (searchTerm) {
      return category.questions.some(q => 
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return true;
  });

  const getFilteredQuestions = (category: any) => {
    if (!searchTerm) return category.questions;
    return category.questions.filter((q: any) => 
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">الأسئلة الشائعة</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          اعثر على إجابات للأسئلة الأكثر شيوعاً حول خدماتنا. إذا لم تجد الإجابة التي تبحث عنها، لا تتردد في التواصل معنا.
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="ابحث في الأسئلة الشائعة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Button
          variant={selectedCategory === "all" ? "default" : "outline"}
          onClick={() => setSelectedCategory("all")}
          size="sm"
        >
          جميع الفئات
        </Button>
        {faqData.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            onClick={() => setSelectedCategory(category.id)}
            size="sm"
          >
            {category.category}
          </Button>
        ))}
      </div>

      {/* FAQ Content */}
      <div className="space-y-6">
        {filteredFAQ.map((category) => {
          const questions = getFilteredQuestions(category);
          if (questions.length === 0) return null;

          return (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Badge className={category.color}>{category.category}</Badge>
                  <CardTitle className="text-xl">{category.category}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {questions.map((faq: any, index: number) => (
                    <AccordionItem key={index} value={`${category.id}-${index}`}>
                      <AccordionTrigger className="text-right hover:no-underline">
                        <span className="font-medium">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="text-muted-foreground leading-relaxed">
                          {faq.answer}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Contact Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            لم تجد الإجابة التي تبحث عنها؟
          </CardTitle>
          <CardDescription>
            فريق خدمة العملاء جاهز لمساعدتك على مدار الساعة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <Phone className="h-8 w-8 mx-auto mb-3 text-blue-600" />
              <h4 className="font-semibold mb-2">الهاتف</h4>
              <p className="text-sm text-muted-foreground mb-3">خدمة عملاء 24/7</p>
              <p className="font-medium">+20 2 1234 5678</p>
              <Button variant="outline" size="sm" className="mt-2">
                اتصل الآن
              </Button>
            </div>

            <div className="text-center p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <Mail className="h-8 w-8 mx-auto mb-3 text-green-600" />
              <h4 className="font-semibold mb-2">البريد الإلكتروني</h4>
              <p className="text-sm text-muted-foreground mb-3">رد خلال 24 ساعة</p>
              <p className="font-medium text-sm">support@saifmasr.com</p>
              <Button variant="outline" size="sm" className="mt-2">
                أرسل رسالة
              </Button>
            </div>

            <div className="text-center p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <MessageCircle className="h-8 w-8 mx-auto mb-3 text-purple-600" />
              <h4 className="font-semibold mb-2">الدردشة المباشرة</h4>
              <p className="text-sm text-muted-foreground mb-3">استجابة فورية</p>
              <p className="font-medium">متاح الآن</p>
              <Button variant="outline" size="sm" className="mt-2">
                ابدأ المحادثة
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            قيم مدى مفيدة الأسئلة الشائعة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" size="sm">
              <Star className="h-4 w-4 mr-2" />
              مفيدة جداً
            </Button>
            <Button variant="outline" size="sm">
              <Star className="h-4 w-4 mr-2" />
              مفيدة
            </Button>
            <Button variant="outline" size="sm">
              <Star className="h-4 w-4 mr-2" />
              تحتاج تحسين
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}