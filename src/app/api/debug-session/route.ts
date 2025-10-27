import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    console.log("Debug session API - Full session:", JSON.stringify(session, null, 2))
    
    return NextResponse.json({
      session,
      hasSession: !!session,
      hasUser: !!session?.user,
      userRole: session?.user?.role,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Error in debug session API:", error)
    return NextResponse.json({ error: "Failed to get session" }, { status: 500 })
  }
}