import { prisma } from '../src/lib/db';

async function main() {
  console.log('[check] Looking for bodyguard services...');
  
  const services = await prisma.service.findMany({
    where: {
      OR: [
        { name: { contains: 'حارس' } },
        { name: { contains: 'حراسة' } },
        { name: { contains: 'بودي' } },
        { name: { contains: 'Body' } }
      ]
    },
    select: {
      id: true,
      name: true,
      price: true,
      createdAt: true
    }
  });

  console.log(`[check] Found ${services.length} service(s):`);
  services.forEach(s => {
    console.log(`  - ID: ${s.id}`);
    console.log(`    Name: ${s.name}`);
    console.log(`    Price: ${s.price}`);
    console.log(`    Created: ${s.createdAt}`);
    console.log('');
  });

  if (services.length === 0) {
    console.log('[check] ⚠️ No bodyguard services found! This will cause FK violations.');
  } else if (services.length > 1) {
    console.log('[check] ⚠️ Multiple bodyguard services found. Run merge-bodyguard-service.ts');
  } else {
    console.log('[check] ✅ Single bodyguard service found (good!)');
  }

  await prisma.$disconnect();
}

main().catch(console.error);
