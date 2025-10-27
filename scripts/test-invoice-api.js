// Test script to check invoice API endpoints
const testInvoiceAPI = async () => {
  const baseURL = 'http://localhost:9002';
  
  try {
    console.log('🔍 اختبار API الفواتير...');
    
    // Test admin invoices endpoint
    console.log('\n1️⃣ اختبار API الأدمن:');
    const adminResponse = await fetch(`${baseURL}/api/invoices`);
    console.log(`   - الحالة: ${adminResponse.status}`);
    
    if (adminResponse.status === 401) {
      console.log('   - يتطلب تسجيل دخول الأدمن');
    } else if (adminResponse.ok) {
      const adminData = await adminResponse.json();
      console.log(`   - عدد الفواتير: ${adminData.length || 0}`);
    } else {
      console.log(`   - خطأ: ${adminResponse.statusText}`);
    }
    
    // Test client invoices endpoint
    console.log('\n2️⃣ اختبار API العميل:');
    const clientResponse = await fetch(`${baseURL}/api/client/invoices`);
    console.log(`   - الحالة: ${clientResponse.status}`);
    
    if (clientResponse.status === 401) {
      console.log('   - يتطلب تسجيل دخول العميل');
    } else if (clientResponse.ok) {
      const clientData = await clientResponse.json();
      console.log(`   - عدد الفواتير: ${clientData.length || 0}`);
    } else {
      console.log(`   - خطأ: ${clientResponse.statusText}`);
    }
    
  } catch (error) {
    console.error('❌ خطأ في اختبار API:', error.message);
  }
};

testInvoiceAPI();