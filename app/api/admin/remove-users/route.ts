import { NextRequest, NextResponse } from "next/server";
import { removeAllUsers, removeUsersByRole, removeUser, UserRole } from "@/app/actions";

export async function POST(request: NextRequest) {
  try {
    // Security: Check for API key (optional for authenticated teachers via UI)
    const apiKey = request.nextUrl.searchParams.get("key") || request.headers.get("x-api-key");
    const expectedKey = process.env.CRON_API_KEY || process.env.ADMIN_API_KEY;

    // If API key is provided, validate it. Otherwise, allow if called from authenticated teacher UI
    // (In production, you might want to add additional authentication checks here)
    if (apiKey && expectedKey && apiKey !== expectedKey) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, role, userName } = body;

    let result;

    switch (action) {
      case "all":
        // Remove all users
        result = await removeAllUsers();
        break;
      
      case "byRole":
        // Remove users by role (teacher or student)
        if (!role || (role !== "teacher" && role !== "student")) {
          return NextResponse.json(
            { success: false, error: "Invalid role. Must be 'teacher' or 'student'" },
            { status: 400 }
          );
        }
        result = await removeUsersByRole(role as UserRole);
        break;
      
      case "byName":
        // Remove specific user by name
        if (!userName) {
          return NextResponse.json(
            { success: false, error: "userName is required" },
            { status: 400 }
          );
        }
        result = await removeUser(userName);
        break;
      
      default:
        return NextResponse.json(
          { success: false, error: "Invalid action. Use 'all', 'byRole', or 'byName'" },
          { status: 400 }
        );
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Users removed successfully",
        deletedCount: result.deletedCount,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to remove users",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in remove-users route:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

// Also support GET for simple operations
export async function GET(request: NextRequest) {
  try {
    const apiKey = request.nextUrl.searchParams.get("key");
    const expectedKey = process.env.CRON_API_KEY || process.env.ADMIN_API_KEY;
    const action = request.nextUrl.searchParams.get("action") || "all";
    const role = request.nextUrl.searchParams.get("role");
    const userName = request.nextUrl.searchParams.get("userName");

    if (expectedKey && apiKey !== expectedKey) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    let result;

    if (action === "all") {
      result = await removeAllUsers();
    } else if (action === "byRole" && role) {
      if (role !== "teacher" && role !== "student") {
        return NextResponse.json(
          { success: false, error: "Invalid role" },
          { status: 400 }
        );
      }
      result = await removeUsersByRole(role as UserRole);
    } else if (action === "byName" && userName) {
      result = await removeUser(userName);
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid parameters" },
        { status: 400 }
      );
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Users removed successfully",
        deletedCount: result.deletedCount,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

