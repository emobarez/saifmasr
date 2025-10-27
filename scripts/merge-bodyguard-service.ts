import { PrismaClient, ServiceStatus } from '@prisma/client';

/**
 * This script finds all service rows that look like the Bodyguard service
 * (various Arabic / English spellings) and merges them into a single
 * canonical record named: "خدمة الحارس الشخصي".
 *
 * Merge logic:
 * 1. Identify all matching services by regex.
 * 2. Pick the one with the earliest creation date OR lowest id lexical as canonical.
 * 3. Aggregate: keep first non-null description/category, highest price (if any) as representative.
 * 4. Update the canonical row to the chosen consolidated values & standardized name.
 * 5. Re-point all ServiceRequest.serviceId referencing other duplicates to the canonical id.
 * 6. Delete the now-unreferenced duplicate service rows.
 */
async function main() {
  const prisma = new PrismaClient();
  const regex = /(خدمة الحارس الشخصي|الحارس الشخصي|حارس شخصي|حراسة شخصية|بودي ?جارد|Body ?guard)/i;
  try {
    console.log('🔍 Fetching candidate services...');
    const all = await prisma.service.findMany();
    const candidates = all.filter(s => regex.test(s.name));
    if (candidates.length === 0) {
      console.log('⚠️ No matching bodyguard service variants found. Nothing to merge.');
      return;
    }
    if (candidates.length === 1) {
      const only = candidates[0];
      if (only.name !== 'خدمة الحارس الشخصي') {
        console.log('✳️ Renaming sole candidate to canonical name.');
        await prisma.service.update({ where: { id: only.id }, data: { name: 'خدمة الحارس الشخصي' }});
      }
      console.log('✅ Single canonical service present. Done.');
      return;
    }

    // Choose canonical: earliest createdAt (fallback lexical id)
    const canonical = [...candidates].sort((a,b) => {
      const t = +a.createdAt - +b.createdAt;
      if (t !== 0) return t;
      return a.id.localeCompare(b.id);
    })[0];

    console.log(`🏷️ Canonical service selected: ${canonical.id} | ${canonical.name}`);

    // Derive merged fields
    const description = canonical.description || candidates.find(c => c.description)?.description || null;
    const category = canonical.category || candidates.find(c => c.category)?.category || null;
    // Keep the highest price (assuming maybe variants had different prices; prefer max)
    const price = candidates.reduce((p,c) => c.price && c.price > p ? c.price : p, canonical.price || 0) || null;

    // Update canonical with standardized fields
    await prisma.service.update({
      where: { id: canonical.id },
      data: {
        name: 'خدمة الحارس الشخصي',
        description: description || canonical.description,
        category: category || canonical.category,
        price: price || canonical.price,
        status: ServiceStatus.ACTIVE
      }
    });

    // Other ids
    const duplicates = candidates.filter(c => c.id !== canonical.id);
    if (duplicates.length) {
      console.log(`🔁 Re-pointing ServiceRequests from ${duplicates.length} duplicate services...`);
      await prisma.serviceRequest.updateMany({
        where: { serviceId: { in: duplicates.map(d => d.id) }},
        data: { serviceId: canonical.id }
      });

      console.log('🗑️ Deleting duplicate services...');
      await prisma.service.deleteMany({ where: { id: { in: duplicates.map(d => d.id) }}});
    }

    console.log('🎉 Merge complete.');
  } catch (err) {
    console.error('❌ Merge failed:', err);
    process.exitCode = 1;
  } finally {
    await (prisma as any)?.$disconnect?.();
  }
}

main();
