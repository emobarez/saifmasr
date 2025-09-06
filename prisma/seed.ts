import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Seed System Settings with Egyptian configuration
  const settings = await prisma.systemSettings.upsert({
    where: { id: 'general' },
    update: {},
    create: {
      id: 'general',
      portalName: 'سيف مصر الوطنية للأمن',
      maintenanceMode: false,
      adminEmail: 'admin@saifmasr.com',
      companyPhone: '+20 2 1234 5678',
      companyAddress: 'القاهرة، مصر',
      publicEmail: 'info@saifmasr.com',
      currency: 'EGP',
      locale: 'ar-EG',
      timezone: 'Africa/Cairo',
      taxRate: 14.0,
      facebookUrl: 'https://facebook.com/saifmasr',
      twitterUrl: 'https://twitter.com/saifmasr',
      linkedinUrl: 'https://linkedin.com/company/saifmasr',
      instagramUrl: 'https://instagram.com/saifmasr'
    }
  });

  // Seed Sample Services
  const services = await Promise.all([
    prisma.service.upsert({
      where: { id: 'service-1' },
      update: {},
      create: {
        id: 'service-1',
        name: 'خدمة الحراسة الأمنية',
        description: 'خدمات الحراسة والأمن على مدار الساعة',
        category: 'أمن وحراسة',
        price: 5000.00,
        status: 'ACTIVE'
      }
    }),
    prisma.service.upsert({
      where: { id: 'service-2' },
      update: {},
      create: {
        id: 'service-2',
        name: 'نظام المراقبة الذكي',
        description: 'تركيب وصيانة أنظمة المراقبة المتقدمة',
        category: 'تقنية',
        price: 15000.00,
        status: 'ACTIVE'
      }
    }),
    prisma.service.upsert({
      where: { id: 'service-3' },
      update: {},
      create: {
        id: 'service-3',
        name: 'خدمة الحراس الشخصي',
        description: 'حماية شخصية للشخصيات المهمة',
        category: 'حماية شخصية',
        price: 8000.00,
        status: 'ACTIVE'
      }
    })
  ]);

  // Seed Sample Employees
  const employees = await Promise.all([
    prisma.employee.upsert({
      where: { email: 'khalid@saifmasr.com' },
      update: {},
      create: {
        name: 'خالد أحمد الزهراني',
        email: 'khalid@saifmasr.com',
        phone: '+20 10 1234 5678',
        position: 'رئيس أمن',
        department: 'الأمن والحراسة',
        salary: 8500.00,
        hireDate: new Date('2024-01-15'),
        status: 'ACTIVE'
      }
    }),
    prisma.employee.upsert({
      where: { email: 'sarah@saifmasr.com' },
      update: {},
      create: {
        name: 'سارة محمد القحطاني',
        email: 'sarah@saifmasr.com',
        phone: '+20 10 7654 3210',
        position: 'منسقة العمليات',
        department: 'العمليات',
        salary: 7200.00,
        hireDate: new Date('2024-03-01'),
        status: 'ACTIVE'
      }
    }),
    prisma.employee.upsert({
      where: { email: 'abdulrahman@saifmasr.com' },
      update: {},
      create: {
        name: 'عبدالرحمن علي الغامدي',
        email: 'abdulrahman@saifmasr.com',
        phone: '+20 11 1234 5678',
        position: 'حارس أمن',
        department: 'الأمن والحراسة',
        salary: 5500.00,
        hireDate: new Date('2024-06-10'),
        status: 'ACTIVE'
      }
    })
  ]);

  // Seed Sample Reports
  const reports = await Promise.all([
    prisma.report.upsert({
      where: { id: 'report-1' },
      update: {},
      create: {
        id: 'report-1',
        title: 'تقرير الأداء الشهري - نوفمبر 2024',
        content: 'تقرير شامل عن أداء الشركة خلال شهر نوفمبر 2024...',
        summary: 'أداء ممتاز مع نمو 15% في الإيرادات',
        type: 'performance',
        status: 'PUBLISHED'
      }
    }),
    prisma.report.upsert({
      where: { id: 'report-2' },
      update: {},
      create: {
        id: 'report-2',
        title: 'تقرير الأمان والحوادث - Q4 2024',
        content: 'تقرير مفصل حول الحوادث الأمنية والإجراءات المتخذة...',
        summary: 'انخفاض 20% في الحوادث مقارنة بالربع السابق',
        type: 'security',
        status: 'UNDER_REVIEW'
      }
    })
  ]);

  console.log('✅ Database seeding completed successfully!');
  console.log('📊 Created:');
  console.log(`  - System Settings: ${settings.portalName}`);
  console.log(`  - Services: ${services.length}`);
  console.log(`  - Employees: ${employees.length}`);
  console.log(`  - Reports: ${reports.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });