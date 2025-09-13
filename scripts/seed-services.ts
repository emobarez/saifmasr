import { PrismaClient, ServiceStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function seedServices() {
  try {
    console.log('🌱 Seeding services...');

    const services = [
      {
        name: 'حراسة أمنية',
        description: 'خدمات الحراسة الأمنية للمباني والمنشآت',
        category: 'أمن',
        price: 5000,
        status: ServiceStatus.ACTIVE
      },
      {
        name: 'تأمين فعاليات',
        description: 'تأمين الفعاليات والمؤتمرات والحفلات',
        category: 'فعاليات',
        price: 8000,
        status: ServiceStatus.ACTIVE
      },
      {
        name: 'استشارات أمنية',
        description: 'استشارات متخصصة في مجال الأمن والحماية',
        category: 'استشارات',
        price: 3000,
        status: ServiceStatus.ACTIVE
      },
      {
        name: 'تحقيقات خاصة',
        description: 'خدمات التحقيقات الخاصة والبحث',
        category: 'تحقيقات',
        price: 10000,
        status: ServiceStatus.ACTIVE
      },
      {
        name: 'تدريب أمني',
        description: 'برامج التدريب في مجال الأمن والحماية',
        category: 'تدريب',
        price: 2500,
        status: ServiceStatus.ACTIVE
      },
      {
        name: 'أنظمة مراقبة',
        description: 'تركيب وصيانة أنظمة المراقبة والكاميرات',
        category: 'تقنية',
        price: 15000,
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