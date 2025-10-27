import { invoiceService } from '../src/lib/database-service.js';

console.log('🔍 اختبار إصلاح الفواتير...');

// Test the client ID we saw in logs
const testClientId = 'cmfi74j2200005mzxhjkmajnw';

try {
  console.log(`\n📋 البحث عن فواتير العميل: ${testClientId}`);
  
  const invoices = await invoiceService.getByUserId(testClientId);
  
  console.log(`✅ عدد الفواتير الموجودة: ${invoices.length}`);
  
  if (invoices.length > 0) {
    invoices.forEach((invoice, index) => {
      console.log(`\n📄 فاتورة ${index + 1}:`);
      console.log(`   - رقم الفاتورة: ${invoice.invoiceNumber}`);
      console.log(`   - المبلغ: ${invoice.totalAmount} جنيه`);
      console.log(`   - الحالة: ${invoice.status}`);
      console.log(`   - العميل ID: ${invoice.clientId}`);
      console.log(`   - منشئ الفاتورة ID: ${invoice.userId}`);
    });
  } else {
    console.log('❌ لا توجد فواتير لهذا العميل');
  }
  
} catch (error) {
  console.error('❌ خطأ:', error.message);
}