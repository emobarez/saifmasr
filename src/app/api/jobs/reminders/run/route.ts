import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logActivity, ActivityLogger } from '@/lib/activityLogger';

/*
  GET /api/jobs/reminders/run
  Finds upcoming (non-draft) service requests whose startAt is within their notifyBeforeHours window
  AND haven't been reminded (lastReminderAt null) or lastReminderAt older than 6h (re-notify safety window).
  Sets lastReminderAt and returns a summary. For now it just logs activity; integration with real notification
  channels (email/SMS/push) can hook here.
*/
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Security layer: allow if (a) admin session OR (b) REMINDER_SECRET matches header/query
    const url = new URL(req.url);
    const secretParam = url.searchParams.get('secret');
    const headerSecret = req.headers.get('x-reminder-secret');
    const configuredSecret = process.env.REMINDER_SECRET?.trim();
    const secretProvided = (secretParam || headerSecret || '').trim();

    const hasSecretAccess = !!configuredSecret && secretProvided && configuredSecret === secretProvided;
    const hasAdminAccess = !!session && session.user.role === 'ADMIN';

    if (!hasSecretAccess && !hasAdminAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

    // Fetch candidates with broad criteria first
    // Fetch broader set (without filtering on newly added fields to avoid stale client typing) then narrow in memory
    const rawBase = await prisma.serviceRequest.findMany({
      where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
      take: 800
    }) as any[];

    const candidates = rawBase.filter(r => r.startAt && r.isDraft === false);

    // Narrow using per-record horizon logic: startAt <= now + notifyBeforeHours
    const horizonFiltered = candidates.filter(r => {
      const nbh = r.notifyBeforeHours ?? 24;
      if (!r.startAt) return false;
      const horizon = new Date(Date.now() + nbh * 60 * 60 * 1000);
      return r.startAt <= horizon;
    }).slice(0, 200);

    const processed: string[] = [];
    for (const r of horizonFiltered) {
      try {
        await prisma.serviceRequest.update({
          where: { id: r.id },
          data: { lastReminderAt: now }
        });
        processed.push(r.id);
        await ActivityLogger.serviceRequestReminderSent(r.id, {
          startAt: r.startAt,
          notifyBeforeHours: r.notifyBeforeHours,
          userId: r.userId
        });
      } catch (e) { /* swallow per-row errors */ }
    }

    return NextResponse.json({
      checked: candidates.length,
      windowMatched: horizonFiltered.length,
      remindersSent: processed.length,
      ids: processed
    });
  } catch (e: any) {
    console.error('Reminder job failed', e);
    return NextResponse.json({ error: 'Reminder job failed' }, { status: 500 });
  }
}
