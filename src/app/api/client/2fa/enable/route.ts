import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { authenticator } from "otplib";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  // Read secret using raw SQL to avoid Prisma Client type issues if not regenerated
  const rows = await prisma.$queryRaw<{ twoFactorSecret: string | null }[]>`SELECT "twoFactorSecret" FROM "User" WHERE "id" = ${session.user.id}`;
  const user = { id: session.user.id, twoFactorSecret: rows?.[0]?.twoFactorSecret } as any;
    if (!user?.twoFactorSecret) return NextResponse.json({ error: "2FA not initialized" }, { status: 400 });

  const isValid = authenticator.verify({ token, secret: (user as any).twoFactorSecret });
    if (!isValid) return NextResponse.json({ error: "Invalid code" }, { status: 400 });

  await prisma.$executeRaw`UPDATE "User" SET "twoFactorEnabled" = true WHERE "id" = ${user.id}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("2fa enable error", e);
    return NextResponse.json({ error: "Failed to enable 2FA" }, { status: 500 });
  }
}
