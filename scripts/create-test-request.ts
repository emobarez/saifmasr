import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestServiceRequest() {
  try {
    console.log('🧪 Creating test service request...');

    // Get a user and service
    const user = await prisma.user.findFirst({
      where: { role: 'CLIENT' }
    });
    
    const service = await prisma.service.findFirst();

    if (!user || !service) {
      console.log('❌ No user or service found. Creating test data...');
      
      // Create a test client if none exists
      if (!user) {
        await prisma.user.create({
          data: {
            name: 'علي محمد العمري',
            email: 'ali.test@example.com',
            role: 'CLIENT',
            status: 'ACTIVE'
          }
        });
        console.log('✅ Created test client');
      }
      
      // Services should already exist from our previous seeding
      return;
    }

    // Create a test service request
    const testRequest = await prisma.serviceRequest.create({
      data: {
        userId: user.id,
        serviceId: service.id,
        title: 'طلب حراسة أمنية للمكتب الرئيسي',
        description: 'نحتاج إلى خدمة حراسة أمنية على مدار 24 ساعة للمكتب الرئيسي في الرياض. المطلوب حارسين أمن مدربين ومجهزين بالمعدات اللازمة.',
        status: 'PENDING',
        priority: 'HIGH'
      },
      include: {
        user: true,
        service: true
      }
    });

    console.log('✅ Test service request created successfully!');
    console.log(`   - ID: ${testRequest.id}`);
    console.log(`   - Title: ${testRequest.title}`);
    console.log(`   - Client: ${testRequest.user.name}`);
    console.log(`   - Service: ${testRequest.service.name}`);
    console.log(`   - Status: ${testRequest.status}`);
    console.log(`   - Priority: ${testRequest.priority}`);

  } catch (error) {
    console.error('❌ Error creating test service request:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestServiceRequest();