import { prisma } from '../src/lib/db';

async function main() {
  console.log('[test] Verifying database schema...');
  
  // Test if personnelCount column exists by querying
  try {
    const count = await prisma.serviceRequest.count({
      where: {
        personnelCount: { gte: 0 }
      }
    });
    console.log('✅ personnelCount column exists and is queryable');
    console.log(`   Found ${count} service request(s) with personnelCount >= 0`);
  } catch (error: any) {
    console.error('❌ personnelCount column test failed:', error.message);
    process.exit(1);
  }

  // Test other extended fields
  try {
    const testFields = await prisma.serviceRequest.findFirst({
      select: {
        id: true,
        personnelCount: true,
        durationUnit: true,
        startAt: true,
        endAt: true,
        locationLat: true,
        locationLng: true,
        armamentLevel: true,
        notifyBeforeHours: true,
        isDraft: true
      }
    });
    console.log('✅ All extended fields are accessible');
    if (testFields) {
      console.log('   Sample record:', testFields.id);
    } else {
      console.log('   No records in database yet');
    }
  } catch (error: any) {
    console.error('❌ Extended fields test failed:', error.message);
    process.exit(1);
  }

  console.log('\n🎉 Database schema is fully synchronized!');
  await prisma.$disconnect();
}

main().catch(console.error);
