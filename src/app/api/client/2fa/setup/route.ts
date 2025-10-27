import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { authenticator } from "otplib";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const issuer = "SaifMasr";
    const accountName = session.user.email || session.user.name || session.user.id;
    if (!accountName) {
      return NextResponse.json({ error: "Missing account identifier (email or id)" }, { status: 400 });
    }

    const secret = authenticator.generateSecret();
    const label = `SaifMasr:${accountName}`;
    const otpAuthUrl = authenticator.keyuri(accountName, issuer, secret);

    try {
      // Use raw SQL to avoid Prisma Client schema validation when client types are stale
      await prisma.$executeRaw`UPDATE "User" SET "twoFactorSecret" = ${secret} WHERE "id" = ${session.user.id}`;
    } catch (dbErr: any) {
      console.error("2fa setup prisma update error", dbErr);
      return NextResponse.json({ error: "Failed to persist 2FA secret" }, { status: 500 });
    }

    return NextResponse.json({ secret, otpAuthUrl, issuer, label });
  } catch (e) {
    console.error("2fa setup error", e);
    return NextResponse.json({ error: "Failed to setup 2FA" }, { status: 500 });
  }
}
