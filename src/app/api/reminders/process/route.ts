import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { activityLogService } from "@/lib/database-service";

export async function POST() {
  try {
    const now = new Date();

    const due = await (prisma as any).reminder.findMany({
      where: {
        sentAt: null,
        dueAt: { lte: now },
      },
      include: { serviceRequest: { include: { user: true, service: true } } }
    });

    for (const r of due) {
      try {
        // Here we would send email/SMS notification; for now, just log
        await activityLogService.create({
          actionType: "REMINDER_SENT",
          description: `Reminder ${r.type} for service request ${r.serviceRequestId}`,
          metadata: {
            reminderId: r.id,
            userId: r.serviceRequest.userId,
            service: r.serviceRequest.service?.name,
            dueAt: r.dueAt,
          },
        });

        await (prisma as any).reminder.update({
          where: { id: r.id },
          data: { sentAt: new Date() }
        });
      } catch (e) {
        console.error("Failed processing reminder", r.id, e);
      }
    }

    return NextResponse.json({ processed: due.length });
  } catch (e) {
    console.error("Error processing reminders", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
