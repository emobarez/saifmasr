import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    console.log("=== SESSION RAW API CALLED ===");
    
    const session = await getServerSession(authOptions);
    
    console.log('[SESSION RAW API] session:', JSON.stringify(session, null, 2));
    console.log('[SESSION RAW API] user role:', session?.user?.role);
    console.log('[SESSION RAW API] is ADMIN?:', session?.user?.role === "ADMIN");
    
    return NextResponse.json({
      ok: true,
      session,
      hasUser: !!session?.user,
      user: session?.user || null,
      userRole: session?.user?.role,
      isAdmin: session?.user?.role === "ADMIN",
      roleCheck: {
        actual: session?.user?.role,
        expected: "ADMIN",
        strictMatch: session?.user?.role === "ADMIN",
        typeCheck: typeof session?.user?.role
      },
      time: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error('[SESSION RAW API] error', e);
    return NextResponse.json({ ok: false, error: e?.message || 'unknown error' }, { status: 500 });
  }
}