import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { activityLogService } from "@/lib/database-service";

// Mock AI functions for demonstration (replace with real AI when API key is available)
async function mockGenerateReportSummary(reportText: string) {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return {
    summary: `ملخص تلقائي للتقرير: ${reportText.slice(0, 100)}${reportText.length > 100 ? '...' : ''}`,
    insights: "الرؤى الرئيسية: تم استخراج النقاط المهمة من التقرير وتحليل الاتجاهات العامة والتوصيات المقترحة."
  };
}

async function mockGenerateServiceFAQs(serviceName: string, serviceDescription: string, faqCount: number) {
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const sampleQuestions = [
    "ما هي مميزات هذه الخدمة؟",
    "كم تكلفة الخدمة؟",
    "ما هي مدة تنفيذ الخدمة؟",
    "هل تقدمون ضمان على الخدمة؟",
    "ما هي متطلبات البدء في الخدمة؟",
    "هل يمكن تخصيص الخدمة حسب احتياجاتي؟",
    "ما هو الدعم المتاح بعد انتهاء الخدمة؟",
    "هل تقدمون خصومات للعملاء الجدد؟"
  ];
  
  const faqs = [];
  for (let i = 0; i < Math.min(faqCount, sampleQuestions.length); i++) {
    faqs.push({
      question: sampleQuestions[i],
      answer: `${serviceName} يوفر حلولاً متقدمة ومبتكرة. ${serviceDescription.slice(0, 80)}${serviceDescription.length > 80 ? '...' : ''} نحن نضمن جودة عالية وخدمة عملاء ممتازة.`
    });
  }
  
  return { faqs };
}

async function mockSuggestServiceCategory(serviceName: string, serviceDescription: string) {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Simple category suggestion based on keywords
  const description = serviceDescription.toLowerCase();
  if (description.includes('تطوير') || description.includes('برمجة')) {
    return { suggestedCategory: "تطوير وبرمجة" };
  } else if (description.includes('تصميم')) {
    return { suggestedCategory: "تصميم وإبداع" };
  } else if (description.includes('استشارة') || description.includes('مشورة')) {
    return { suggestedCategory: "استشارات" };
  } else {
    return { suggestedCategory: "خدمات عامة" };
  }
}

// POST /api/ai/generate-report-summary
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, ...data } = await request.json();

    let result;
    let actionDescription;

    switch (action) {
      case 'generate-report-summary':
        if (!data.reportText) {
          return NextResponse.json(
            { error: "Report text is required" },
            { status: 400 }
          );
        }
        result = await mockGenerateReportSummary(data.reportText);
        actionDescription = "إنشاء ملخص تقرير باستخدام الذكاء الاصطناعي";
        break;

      case 'generate-service-faqs':
        if (!data.serviceName || !data.serviceDescription) {
          return NextResponse.json(
            { error: "Service name and description are required" },
            { status: 400 }
          );
        }
        result = await mockGenerateServiceFAQs(
          data.serviceName,
          data.serviceDescription,
          data.faqCount || 5
        );
        actionDescription = `إنشاء أسئلة شائعة للخدمة: ${data.serviceName}`;
        break;

      case 'suggest-service-category':
        if (!data.serviceName || !data.serviceDescription) {
          return NextResponse.json(
            { error: "Service name and description are required" },
            { status: 400 }
          );
        }
        result = await mockSuggestServiceCategory(
          data.serviceName,
          data.serviceDescription
        );
        actionDescription = `اقتراح تصنيف للخدمة: ${data.serviceName}`;
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    // Log AI tool usage
    await activityLogService.create({
      userId: session.user.id,
      actionType: "AI_TOOL_USAGE",
      description: actionDescription,
      metadata: { 
        action,
        inputData: Object.keys(data),
        success: true
      }
    });

    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    console.error("AI Tool Error:", error);
    
    const session = await getServerSession(authOptions);
    if (session) {
      await activityLogService.create({
        userId: session.user.id,
        actionType: "AI_TOOL_ERROR",
        description: "فشل في استخدام أداة الذكاء الاصطناعي",
        metadata: { 
          error: error instanceof Error ? error.message : "Unknown error",
          success: false
        }
      });
    }

    return NextResponse.json(
      { 
        error: "فشل في معالجة الطلب", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}