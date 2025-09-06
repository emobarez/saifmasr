import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function main() {
  console.log('🧾 Adding sample invoice data...');

  // First, get the admin user (we'll use this as the invoice creator)
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (!adminUser) {
    console.log('❌ No admin user found. Please create an admin user first.');
    return;
  }

  // Create some sample client users if they don't exist
  const clients = await Promise.all([
    prisma.user.upsert({
      where: { email: 'ahmed.client@example.com' },
      update: {},
      create: {
        name: 'أحمد محمد الشهري',
        email: 'ahmed.client@example.com',
        password: 'hashed_password_placeholder',
        role: 'CLIENT',
        status: 'ACTIVE'
      }
    }),
    prisma.user.upsert({
      where: { email: 'fatima.client@example.com' },
      update: {},
      create: {
        name: 'فاطمة خالد السالم',
        email: 'fatima.client@example.com',
        password: 'hashed_password_placeholder',
        role: 'CLIENT',
        status: 'ACTIVE'
      }
    }),
    prisma.user.upsert({
      where: { email: 'mohammed.client@example.com' },
      update: {},
      create: {
        name: 'محمد عبدالله النمر',
        email: 'mohammed.client@example.com',
        password: 'hashed_password_placeholder',
        role: 'CLIENT',
        status: 'ACTIVE'
      }
    })
  ]);

  // Create sample invoices
  const invoices = await Promise.all([
    prisma.invoice.create({
      data: {
        userId: clients[0].id,
        clientId: clients[0].id,
        invoiceNumber: 'INV-000001',
        amount: 15000.00,
        currency: 'EGP',
        status: 'PAID',
        description: 'خدمات الحراسة الشخصية - شهر نوفمبر 2024',
        taxAmount: 2100.00, // 14% VAT
        totalAmount: 17100.00,
        dueDate: new Date('2024-12-15'),
        paymentMethod: 'تحويل بنكي',
        paidAt: new Date('2024-11-25'),
        items: {
          create: [
            {
              description: 'حراسة شخصية - 30 يوم',
              quantity: 30,
              unitPrice: 500.00,
              totalPrice: 15000.00
            }
          ]
        }
      },
      include: {
        user: true,
        items: true
      }
    }),
    prisma.invoice.create({
      data: {
        userId: clients[1].id,
        clientId: clients[1].id,
        invoiceNumber: 'INV-000002',
        amount: 25000.00,
        currency: 'EGP',
        status: 'PENDING',
        description: 'تركيب أنظمة المراقبة الذكية',
        taxAmount: 3500.00, // 14% VAT
        totalAmount: 28500.00,
        dueDate: new Date('2024-12-30'),
        items: {
          create: [
            {
              description: 'كاميرات مراقبة - 10 وحدة',
              quantity: 10,
              unitPrice: 2000.00,
              totalPrice: 20000.00
            },
            {
              description: 'تركيب وتشغيل',
              quantity: 1,
              unitPrice: 5000.00,
              totalPrice: 5000.00
            }
          ]
        }
      },
      include: {
        user: true,
        items: true
      }
    }),
    prisma.invoice.create({
      data: {
        userId: clients[2].id,
        clientId: clients[2].id,
        invoiceNumber: 'INV-000003',
        amount: 50000.00,
        currency: 'EGP',
        status: 'OVERDUE',
        description: 'خدمات أمن المباني - ربع سنوي',
        taxAmount: 7000.00, // 14% VAT
        totalAmount: 57000.00,
        dueDate: new Date('2024-11-30'), // Past due date
        items: {
          create: [
            {
              description: 'أمن مباني - 3 أشهر',
              quantity: 3,
              unitPrice: 16666.67,
              totalPrice: 50000.00
            }
          ]
        }
      },
      include: {
        user: true,
        items: true
      }
    })
  ]);

  console.log('✅ Sample invoice data added successfully!');
  console.log('📊 Created:');
  console.log(`  - Clients: ${clients.length}`);
  console.log(`  - Invoices: ${invoices.length}`);
  
  invoices.forEach((invoice, index) => {
    console.log(`  - Invoice ${index + 1}: ${invoice.invoiceNumber} - ${invoice.user.name} - ${invoice.totalAmount} EGP (${invoice.status})`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Adding sample invoices failed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });