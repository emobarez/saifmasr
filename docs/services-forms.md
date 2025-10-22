# نماذج طلبات الخدمات الأمنية

تم إضافة نماذج مفصلة لسبع خدمات ضمن مسار تطبيق العميل:

- الحارس الشخصي: `/client/services/personal-guard`
- الأمن النظامي: `/client/services/regular-security`
- تركيب كاميرات المراقبة: `/client/services/cctv-installation`
- تأمين فعاليات: `/client/services/event-security`
- الاستشارات الأمنية: `/client/services/security-consulting`
- التدريبات الأمنية: `/client/services/security-training`
- النظافة (خدمة إضافية): `/client/services/cleaning`

## الحقول المشتركة في قاعدة البيانات

تتشارك جميع الطلبات الحقول التالية (نموذج ServiceRequest):

- startAt/endAt: توقيت التنفيذ (اختياري)
- locationAddress/locationLat/locationLng: الموقع والعنوان (اختياري)
- headcount: عدد الأفراد (اختياري)
- armamentLevel: مستوى التسليح للحراسة (اختياري)
- unitPrice/extraCost/totalCost: التسعير و"احسب التكلفة" (اختياري)
- remindBefore24h: تفعيل تذكير قبل 24 ساعة (اختياري)
- isDraft: حفظ كمسودة
- details (Json): تخزين التفاصيل الخاصة بكل خدمة (نوع الشفت، نوع الكاميرات، نوع التدريب، ...)
- attachments (Json): لاحقاً لروابط/ملفات مرفقة

كما أُضيف نموذج Reminder لجدولة التذكيرات المرتبطة بالطلبات.

## ملاحظات التشغيل

- يجب تطبيق ترحيل Prisma بعد تعديل المخطط:
  - prisma migrate dev
  - prisma generate
- يمكن تشغيل سكربت تهيئة الخدمات:
  - ts-node scripts/seed-services.ts (أو عبر npm script إن وجد)
- نقطة نهاية لمعالجة التذكيرات: `POST /api/reminders/process` (حالياً تُسجل في ActivityLog فقط)

## الرفع والمرفقات

- تمت إضافة نقطة رفع عبر Vercel Blob: `POST /api/uploads` (multipart/form-data: "file")
- تحتاج تعيين المتغير BLOB_READ_WRITE_TOKEN في بيئة Vercel.
- مكوّن الواجهة: `UploadField` في `src/components/ui/upload-field.tsx` لإرفاق الملفات وتخزينها في حقل `attachments` داخل الطلب.

## الجدولة (Vercel Cron)

- تمت إضافة Cron في `vercel.json` لاستدعاء `/api/reminders/process` كل ساعة: `0 * * * *`

## التحقق (Validation)

- يعتمد مسار `POST /api/service-requests` على Zod للتحقق من المدخلات وإرجاع 400 عند وجود أخطاء.

