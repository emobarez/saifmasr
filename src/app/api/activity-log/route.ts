import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { activityLogService } from "@/lib/database-service";

// GET /api/activity-log - Get activity logs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const activityLogs = await activityLogService.getAll(limit);
    return NextResponse.json(activityLogs);
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity logs" },
      { status: 500 }
    );
  }
}

// POST /api/activity-log - Create new activity log
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { actionType, description, metadata } = await request.json();

    if (!actionType || !description) {
      return NextResponse.json(
        { error: "Action type and description are required" },
        { status: 400 }
      );
    }

    const activityLog = await activityLogService.create({
      userId: session.user.id,
      actionType,
      description,
      metadata: metadata || {}
    });

    return NextResponse.json(activityLog, { status: 201 });
  } catch (error) {
    console.error("Error creating activity log:", error);
    return NextResponse.json(
      { error: "Failed to create activity log" },
      { status: 500 }
    );
  }
}