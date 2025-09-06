import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    console.log('[SESSION RAW API] session:', session);
    return NextResponse.json({
      ok: true,
      session,
      hasUser: !!session?.user,
      user: session?.user || null,
      time: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error('[SESSION RAW API] error', e);
    return NextResponse.json({ ok: false, error: e?.message || 'unknown error' }, { status: 500 });
  }
}