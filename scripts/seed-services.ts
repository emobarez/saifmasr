import { PrismaClient, ServiceStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function seedServices() {
  try {
    console.log('🌱 Seeding services...');

    const services = [
      {
        name: 'الحارس الشخصي',
        slug: 'personal-guard',
        description: 'خدمة بودي جارد بخيارات الشفتات والتسليح',
        shortDescription: 'حارس شخصي محترف حسب الشفت والتسليح',
        category: 'حماية شخصية',
        price: 1500,
        status: ServiceStatus.ACTIVE,
        icon: 'Shield',
        displayOrder: 1,
        isFeatured: true,
        features: ['اختيار الشفت', 'مستوى التسليح', 'إشعارات متابعة']
      },
      {
        name: 'الأمن النظامي',
        slug: 'regular-security',
        description: 'تأمين منشآت بفِرَق أمنية ونظام شفتات',
        shortDescription: 'حراسة مواقع بعقود شهرية/سنوية',
        category: 'أمن مباني',
        price: 900,
        status: ServiceStatus.ACTIVE,
        icon: 'Building',
        displayOrder: 2,
        isFeatured: true,
        features: ['شفتات 8/12 ساعة', 'معدات اختيارية', 'تقارير']
      },
      {
        name: 'تركيب كاميرات المراقبة',
        slug: 'cctv-installation',
        description: 'توريد وتركيب وتكوين أنظمة كاميرات',
        shortDescription: 'أنظمة مراقبة داخلية وخارجية',
        category: 'مراقبة',
        price: 0,
        status: ServiceStatus.ACTIVE,
        icon: 'Camera',
        displayOrder: 3,
        isFeatured: false,
        features: ['تسجيل سحابي', 'كشف حركة', 'رؤية ليلية']
      },
      {
        name: 'تأمين فعاليات',
        slug: 'event-security',
        description: 'تنسيق وتأمين الفعاليات بجميع أحجامها',
        shortDescription: 'فرق تنظيم وتأمين ومعدات خاصة',
        category: 'فعاليات',
        price: 0,
        status: ServiceStatus.ACTIVE,
        icon: 'Sparkles',
        displayOrder: 4,
        isFeatured: false,
        features: ['فرق تدخل', 'أجهزة كشف', 'بوابات أمنية']
      },
      {
        name: 'استشارات أمنية',
        slug: 'security-consulting',
        description: 'تقييم مخاطر وخطط أمنية وتدقيق',
        shortDescription: 'استشارات وتقييمات مخاطر مهنية',
        category: 'استشارات',
        price: 0,
        status: ServiceStatus.ACTIVE,
        icon: 'HeadphonesIcon',
        displayOrder: 5,
        isFeatured: false,
        features: ['تقييم مخاطر', 'خطط أمنية']
      },
      {
        name: 'تدريبات أمنية',
        slug: 'security-training',
        description: 'برامج تدريبية لرفع الكفاءة الأمنية',
        shortDescription: 'دورات تدريبية قصيرة ومكثفة',
        category: 'تدريب',
        price: 0,
        status: ServiceStatus.ACTIVE,
        icon: 'Users',
        displayOrder: 6,
        isFeatured: false,
        features: ['حماية شخصيات', 'إسعافات أولية']
      },
      {
        name: 'خدمة نظافة',
        slug: 'cleaning',
        description: 'نظافة دورية/عميقة كخدمة إضافية',
        shortDescription: 'فرق نظافة مدربة ومواعيد مرنة',
        category: 'خدمات إضافية',
        price: 250,
        status: ServiceStatus.ACTIVE,
        icon: 'Sparkles',
        displayOrder: 7,
        isFeatured: false,
        features: ['تنظيف عميق', 'معدات متخصصة']
      }
    ] as const;

    // Upsert fixed catalog by slug to avoid duplicates
    for (const service of services) {
      const created = await prisma.service.upsert({
        where: { slug: (service as any).slug },
        update: { ...service },
        create: { ...service }
      });
      console.log(`✅ Upserted service: ${created.name}`);
    }

    console.log('🎉 Services seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding services:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedServices();