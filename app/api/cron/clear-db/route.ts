import { NextRequest, NextResponse } from "next/server";
import { clearDatabase } from "@/app/actions";

export async function GET(request: NextRequest) {
  try {
    // Security: Check for API key in query parameter or header
    const apiKey = request.nextUrl.searchParams.get("key") || request.headers.get("x-api-key");
    const expectedKey = process.env.CRON_API_KEY;

    // If CRON_API_KEY is set, require it
    if (expectedKey && apiKey !== expectedKey) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Execute the database clear
    const result = await clearDatabase();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Database cleared successfully",
        deletedCounts: result.deletedCounts,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to clear database",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in clear-db cron route:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

// Also support POST method
export async function POST(request: NextRequest) {
  return GET(request);
}

