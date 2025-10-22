import { PrismaClient, ServiceStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function seedServices() {
  try {
    console.log('🌱 Seeding services...');

    const services = [
      {
        name: 'الحارس الشخصي',
        description: 'خدمة بودي جارد بخيارات الشفتات والتسليح',
        category: 'حراسة',
        price: 0,
        status: ServiceStatus.ACTIVE
      },
      {
        name: 'الأمن النظامي',
        description: 'تأمين منشآت بفِرَق أمنية ونظام شفتات',
        category: 'أمن',
        price: 0,
        status: ServiceStatus.ACTIVE
      },
      {
        name: 'تركيب كاميرات المراقبة',
        description: 'توريد وتركيب وتكوين أنظمة كاميرات',
        category: 'تقنية',
        price: 0,
        status: ServiceStatus.ACTIVE
      },
      {
        name: 'تأمين فعاليات',
        description: 'تنسيق وتأمين الفعاليات بجميع أحجامها',
        category: 'فعاليات',
        price: 0,
        status: ServiceStatus.ACTIVE
      },
      {
        name: 'استشارات أمنية',
        description: 'تقييم مخاطر وخطط أمنية وتدقيق',
        category: 'استشارات',
        price: 0,
        status: ServiceStatus.ACTIVE
      },
      {
        name: 'تدريبات أمنية',
        description: 'برامج تدريبية لرفع الكفاءة الأمنية',
        category: 'تدريب',
        price: 0,
        status: ServiceStatus.ACTIVE
      },
      {
        name: 'خدمة نظافة',
        description: 'نظافة دورية/عميقة كخدمة إضافية',
        category: 'خدمات إضافية',
        price: 0,
        status: ServiceStatus.ACTIVE
      }
    ];

    // Clear existing services
    await prisma.service.deleteMany({});
    console.log('🗑️ Cleared existing services');

    // Create new services
    for (const service of services) {
      const created = await prisma.service.create({
        data: service
      });
      console.log(`✅ Created service: ${created.name}`);
    }

    console.log('🎉 Services seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding services:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedServices();