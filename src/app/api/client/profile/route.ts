import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/client/profile - Get current user's profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rows = await prisma.$queryRaw<any[]>`
      SELECT "id","name","email","image","phone","address","company","position",
             "notificationsEmail","notificationsSms","notificationsSystem","twoFactorEnabled","createdAt"
      FROM "User" WHERE "id" = ${session.user.id}
    `;
    const user = rows?.[0];
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      ...user,
      notifications: {
        email: user.notificationsEmail,
        sms: user.notificationsSms,
        system: user.notificationsSystem,
      },
      twoFactorEnabled: user.twoFactorEnabled,
      memberSince: user.createdAt,
    });
  } catch (err) {
    console.error("GET /api/client/profile error", err);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

// PUT /api/client/profile - Update current user's profile
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    // Build an UPDATE using SQL to avoid Prisma client schema/type issues
    await prisma.$executeRaw`
      UPDATE "User"
      SET "name" = ${body.name},
          "email" = ${body.email},
          "phone" = ${body.phone},
          "address" = ${body.address},
          "company" = ${body.company},
          "position" = ${body.position},
          "notificationsEmail" = ${body.notifications?.email},
          "notificationsSms" = ${body.notifications?.sms},
          "notificationsSystem" = ${body.notifications?.system}
      WHERE "id" = ${session.user.id}
    `;

    return NextResponse.json({ id: session.user.id, ok: true });
  } catch (err) {
    console.error("PUT /api/client/profile error", err);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
