import { NextRequest, NextResponse } from "next/server";
import { settingsService } from "@/lib/database-service";

// Fallback settings used when database is unavailable (e.g., local dev without DB)
const FALLBACK_SETTINGS = {
  id: "general",
  portalName: "سيف مصر الوطنية للأمن",
  maintenanceMode: false,
  adminEmail: "admin@saifmasr.com",
  companyPhone: "+20 2 1234 5678",
  companyAddress: "القاهرة، جمهورية مصر العربية",
  publicEmail: "info@saifmasr.com",
  currency: "EGP",
  locale: "ar-EG",
  timezone: "Africa/Cairo",
  taxRate: 14.0,
};

export async function GET() {
  // If database isn't configured, return fallback immediately (local dev)
  const dbUrl = process.env.DATABASE_URL || "";
  const looksPlaceholder = /username:password@hostname/.test(dbUrl) || dbUrl.trim() === "";
  if (looksPlaceholder) {
    return new NextResponse(JSON.stringify(FALLBACK_SETTINGS), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-settings-fallback": "no-db",
      },
    });
  }

  try {
    const settings = await settingsService.get();
    return NextResponse.json(settings);
  } catch (error) {
    // Gracefully degrade to static fallback to keep the app usable without a DB
    console.error("Error fetching settings from DB, serving fallback settings:", error);
    return new NextResponse(JSON.stringify(FALLBACK_SETTINGS), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-settings-fallback": "true",
      },
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const updatedSettings = await settingsService.update(data);
    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}