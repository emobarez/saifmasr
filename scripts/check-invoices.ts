import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkInvoices() {
  try {
    console.log('🔍 فحص الفواتير في قاعدة البيانات...');

    // Get all invoices
    const allInvoices = await prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 إجمالي الفواتير: ${allInvoices.length}`);

    if (allInvoices.length === 0) {
      console.log('❌ لا توجد فواتير في قاعدة البيانات');
      return;
    }

    allInvoices.forEach((invoice, index) => {
      console.log(`\n📋 فاتورة ${index + 1}:`);
      console.log(`   - رقم الفاتورة: ${invoice.invoiceNumber}`);
      console.log(`   - منشئ الفاتورة (userId): ${invoice.userId}`);
      console.log(`   - العميل (clientId): ${invoice.clientId}`);
      console.log(`   - المبلغ: ${invoice.amount} جنيه`);
      console.log(`   - الإجمالي: ${invoice.totalAmount} جنيه`);
      console.log(`   - الحالة: ${invoice.status}`);
      console.log(`   - تاريخ الإنشاء: ${invoice.createdAt.toLocaleDateString('ar-EG')}`);
    });

    // Get all users with role CLIENT
    const clients = await prisma.user.findMany({
      where: { role: 'CLIENT' },
      select: { id: true, name: true, email: true }
    });

    console.log(`\n👥 العملاء في النظام: ${clients.length}`);
    clients.forEach(client => {
      console.log(`   - ${client.name} (${client.email}) - ID: ${client.id}`);
      
      const clientInvoices = allInvoices.filter(inv => inv.clientId === client.id);
      console.log(`     فواتير هذا العميل: ${clientInvoices.length}`);
    });

  } catch (error) {
    console.error('❌ خطأ في فحص الفواتير:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkInvoices();