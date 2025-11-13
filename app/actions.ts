"use server";

import { getMongoDb, collections } from "@/lib/mongo";
import { nanoid } from "nanoid";

// Types
export type UserRole = "teacher" | "student";

export interface UserProfile {
  name: string;
  role: UserRole;
  points: number;
  createdAt: string;
}

export type ContentType = "text" | "file";

export interface SharedContent {
  type: ContentType;
  content: string;
  filename?: string;
  mimetype?: string;
  senderName: string;
  createdAt: Date;
  language?: string;
}

export interface ChatMessage {
  text: string;
  senderName: string;
  timestamp: Date;
}

// Student authentication
export async function authenticateWithCode(
  code: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentCode = await getAccessCode();
    if (code !== currentCode) {
      return { success: false, error: "Invalid access code" };
    }

    const db = await getMongoDb();
    const userId = `student_${name.toLowerCase().replace(/\s+/g, "_")}`;
    await db.collection(collections.users).updateOne(
      { _id: userId } as any,
      {
        $setOnInsert: {
          role: "student" as UserRole,
          points: 0,
          createdAt: new Date().toISOString(),
        },
        $set: {
          name,
          lastActiveAt: new Date(),
        },
      },
      { upsert: true }
    );

    return { success: true };
  } catch (error) {
    console.error("Error authenticating with code:", error);
    return { success: false, error: "Failed to authenticate" };
  }
}

// Create session
export async function createSession(userName: string): Promise<{
  success: boolean;
  sessionId?: string;
  error?: string;
}> {
  try {
    const db = await getMongoDb();
    const sessionId = nanoid(8);
    await db.collection(collections.content).insertOne({
      _id: sessionId,
      type: "text",
      content: "",
      senderName: userName,
      createdAt: new Date(),
    } as any);
    return { success: true, sessionId };
  } catch (error: any) {
    console.error("Error creating session:", error);
    const errorMessage = process.env.NODE_ENV === "development" 
      ? error.message || "Failed to create session"
      : "Failed to create session. Please check server logs.";
    return { success: false, error: errorMessage };
  }
}

// Join session
export async function joinSession(
  sessionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getMongoDb();
    const session = await db.collection(collections.content).findOne({ _id: sessionId } as any);
    if (!session) {
      return { success: false, error: "Session not found" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error joining session:", error);
    return { success: false, error: "Failed to join session" };
  }
}

// Get session state
export async function getSessionState(
  sessionId: string,
  userName?: string
): Promise<{
  success: boolean;
  content?: SharedContent;
  messages?: ChatMessage[];
  error?: string;
}> {
  try {
    const db = await getMongoDb();
    const session = await db.collection(collections.content).findOne({ _id: sessionId } as any);
    if (!session) {
      return { success: false, error: "Session not found" };
    }

    const content = session as unknown as SharedContent;

    const messages = await db
      .collection(collections.messages)
      .find({ sessionId })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();
    messages.reverse();

    // Update user document if userName provided
    if (userName) {
      const userId = `student_${userName.toLowerCase().replace(/\s+/g, "_")}`;
      await db.collection(collections.users).updateOne(
        { _id: userId } as any,
        {
          $setOnInsert: {
            role: "student" as UserRole,
            points: 0,
            createdAt: new Date().toISOString(),
          },
          $set: { name: userName, lastActiveAt: new Date() },
        },
        { upsert: true }
      );
    }

    return { success: true, content: content as SharedContent, messages: messages as unknown as ChatMessage[] };
  } catch (error) {
    console.error("Error getting session state:", error);
    return { success: false, error: "Failed to get session state" };
  }
}

// Update content
export async function updateContent(
  sessionId: string,
  newContent: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getMongoDb();
    await db.collection(collections.content).updateOne(
      { _id: sessionId } as any,
      { $set: { content: newContent } }
    );

    return { success: true };
  } catch (error) {
    console.error("Error updating content:", error);
    return { success: false, error: "Failed to update content" };
  }
}

// Send chat message
export async function sendChatMessage(
  sessionId: string,
  text: string,
  senderName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getMongoDb();
    await db.collection(collections.messages).insertOne({
      sessionId,
      text,
      senderName,
      timestamp: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending chat message:", error);
    return { success: false, error: "Failed to send message" };
  }
}

// General chat - list latest messages
export async function getGeneralMessages(): Promise<{
  success: boolean;
  messages?: ChatMessage[];
  error?: string;
}> {
  try {
    const db = await getMongoDb();
    const messages = await db
      .collection(collections.messages)
      .find({ sessionId: "general" })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();
    messages.reverse();
    return { success: true, messages: messages as unknown as ChatMessage[] };
  } catch (error) {
    console.error("Error getting general messages:", error);
    return { success: false, error: "Failed to get messages" };
  }
}

// General chat - send message
export async function sendGeneralChatMessage(
  text: string,
  senderName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getMongoDb();
    await db.collection(collections.messages).insertOne({
      sessionId: "general",
      text,
      senderName,
      timestamp: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending general chat message:", error);
    return { success: false, error: "Failed to send message" };
  }
}

// Send content (one-off sharing)
export async function sendContent(
  type: ContentType,
  content: string,
  senderName: string,
  filename?: string,
  mimetype?: string,
  language?: string
): Promise<{ success: boolean; contentId?: string; error?: string }> {
  try {
    const db = await getMongoDb();
    const contentId = nanoid(8);
    await db.collection(collections.content).insertOne({
      _id: contentId,
      type,
      content,
      senderName,
      filename: filename || undefined,
      mimetype: mimetype || undefined,
      language: language || undefined,
      createdAt: new Date(),
    } as any);
    return { success: true, contentId };
  } catch (error) {
    console.error("Error sending content:", error);
    return { success: false, error: "Failed to send content" };
  }
}

// Receive content
export async function receiveContent(
  id: string
): Promise<{
  success: boolean;
  content?: SharedContent;
  error?: string;
}> {
  try {
    const db = await getMongoDb();
    const content = await db.collection(collections.content).findOne({ _id: id } as any);
    if (!content) {
      return { success: false, error: "Content not found" };
    }
    return { success: true, content: content as unknown as SharedContent };
  } catch (error) {
    console.error("Error receiving content:", error);
    return { success: false, error: "Failed to receive content" };
  }
}

// Award point
export async function awardPoint(
  senderName: string,
  rewarderName?: string,
  contentId?: string
): Promise<{ success: boolean; error?: string; alreadyRewarded?: boolean }> {
  try {
    const db = await getMongoDb();
    
    // Check if this reward already exists (prevent duplicate rewards) - only if rewarderName and contentId provided
    if (rewarderName && contentId) {
      const existingReward = await db.collection(collections.rewards).findOne({
        rewarderName: rewarderName.toLowerCase().trim(),
        senderName: senderName.toLowerCase().trim(),
        contentId: contentId,
      });

      if (existingReward) {
        return { success: false, error: "You have already rewarded this sender", alreadyRewarded: true };
      }
    }

    // First, check if the sender is a teacher
    const teacherUser = await db.collection(collections.users).findOne({
      name: senderName.trim(),
      role: "teacher",
    });

    let userId: string;
    let userRole: UserRole;

    if (teacherUser) {
      // Sender is a teacher - use their existing user ID
      userId = String(teacherUser._id);
      userRole = "teacher";
    } else {
      // Sender is a student (or doesn't exist yet)
      userId = `student_${senderName.toLowerCase().trim().replace(/\s+/g, "_")}`;
      userRole = "student";
    }

    // Award the point
    await db.collection(collections.users).updateOne(
      { _id: userId } as any,
      {
        $setOnInsert: {
          role: userRole,
          createdAt: new Date().toISOString(),
          name: senderName.trim(),
          points: 0,
        },
        $inc: { points: 1 },
      },
      { upsert: true }
    );

    // Record the reward to prevent duplicates - only if rewarderName and contentId provided
    if (rewarderName && contentId) {
      await db.collection(collections.rewards).insertOne({
        rewarderName: rewarderName.toLowerCase().trim(),
        senderName: senderName.toLowerCase().trim(),
        contentId: contentId,
        timestamp: new Date(),
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error awarding point:", error);
    return { success: false, error: "Failed to award point" };
  }
}

// Check if user has already rewarded a sender for specific content
export async function hasRewarded(
  rewarderName: string,
  contentId: string
): Promise<{ success: boolean; hasRewarded: boolean; error?: string }> {
  try {
    const db = await getMongoDb();
    const reward = await db.collection(collections.rewards).findOne({
      rewarderName: rewarderName.toLowerCase(),
      contentId: contentId,
    });
    return { success: true, hasRewarded: !!reward };
  } catch (error) {
    console.error("Error checking reward status:", error);
    return { success: false, hasRewarded: false, error: "Failed to check reward status" };
  }
}

// Get user points
export async function getUserPoints(
  userName: string
): Promise<{ success: boolean; points?: number; error?: string }> {
  try {
    const db = await getMongoDb();
    const userId = `student_${userName.toLowerCase().trim().replace(/\s+/g, "_")}`;
    const student = await db.collection(collections.users).findOne({ _id: userId } as any);
    if (student) {
      return { success: true, points: student.points || 0 };
    }
    const teacher = await db
      .collection(collections.users)
      .findOne({ name: userName.trim(), role: "teacher" });
    if (teacher) {
      return { success: true, points: teacher.points || 0 };
    }
    return { success: true, points: 0 };
  } catch (error) {
    console.error("Error getting user points:", error);
    return { success: false, error: "Failed to get user points" };
  }
}

// Get leaderboard
export async function getLeaderboard(): Promise<{
  success: boolean;
  teachers?: UserProfile[];
  students?: UserProfile[];
  error?: string;
}> {
  try {
    const db = await getMongoDb();
    // Explicitly filter by role to ensure proper separation
    const teacherUsers = await db.collection(collections.users).find({ role: "teacher" }).toArray();
    const studentUsers = await db.collection(collections.users).find({ role: "student" }).toArray();
    
    const teachers: UserProfile[] = [];
    const students: UserProfile[] = [];
    
    for (const data of teacherUsers) {
      const user: UserProfile = {
        name: data.name,
        role: "teacher" as UserRole,
        points: data.points || 0,
        createdAt: data.createdAt || new Date().toISOString(),
      };
      teachers.push(user);
    }
    
    for (const data of studentUsers) {
      const user: UserProfile = {
        name: data.name,
        role: "student" as UserRole,
        points: data.points || 0,
        createdAt: data.createdAt || new Date().toISOString(),
      };
      students.push(user);
    }
    
    teachers.sort((a, b) => b.points - a.points);
    students.sort((a, b) => b.points - a.points);
    return { success: true, teachers, students };
  } catch (error) {
    console.error("Error getting leaderboard:", error);
    return { success: false, error: "Failed to get leaderboard" };
  }
}

// Upsert teacher after OAuth
export async function upsertTeacher(
  name: string,
  email?: string,
  uid?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getMongoDb();
    const userId = uid || `teacher_${(email || name).toLowerCase().replace(/\s+/g, "_")}`;
    await db.collection(collections.users).updateOne(
      { _id: userId } as any,
      {
        $setOnInsert: {
          role: "teacher" as UserRole,
          points: 0,
          createdAt: new Date().toISOString(),
          email: email || undefined,
        },
        $set: { name },
      },
      { upsert: true }
    );
    return { success: true };
  } catch (error) {
    console.error("Error upserting teacher:", error);
    return { success: false, error: "Failed to upsert teacher" };
  }
}

// Test MongoDB connection (for debugging)
export async function testMongoConnection(): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const db = await getMongoDb();
    // Try a simple operation
    await db.collection(collections.settings).findOne({ _id: "test" } as any);
    return { success: true, message: "MongoDB connection successful" };
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || "Unknown error";
    return { 
      success: false, 
      error: `MongoDB connection failed: ${errorMessage}` 
    };
  }
}

// Get access code
export async function getAccessCode(): Promise<string> {
  try {
    const db = await getMongoDb();
    const setting = await db.collection(collections.settings).findOne({ _id: "access_code" } as any);
    
    if (setting && setting.value) {
      return setting.value;
    }
    
    // Create default access code if it doesn't exist
    const defaultCode = "COLLAB123";
    await db.collection(collections.settings).updateOne(
      { _id: "access_code" } as any,
      { $set: { value: defaultCode, updatedAt: new Date() } },
      { upsert: true }
    );
    return defaultCode;
  } catch (error) {
    console.error("Error getting access code:", error);
    // Fallback to default if MongoDB fails
    return "COLLAB123";
  }
}

// Update access code
export async function updateAccessCode(
  newCode: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input
    const trimmedCode = newCode.trim();
    if (!trimmedCode) {
      return { success: false, error: "Access code cannot be empty" };
    }
    if (trimmedCode.length < 3) {
      return { success: false, error: "Access code must be at least 3 characters" };
    }

    const db = await getMongoDb();
    const result = await db.collection(collections.settings).updateOne(
      { _id: "access_code" } as any,
      { $set: { value: trimmedCode, updatedAt: new Date() } },
      { upsert: true }
    );
    
    // Verify the update was successful
    if (result.acknowledged) {
      return { success: true };
    } else {
      return { success: false, error: "MongoDB operation was not acknowledged" };
    }
  } catch (error: any) {
    console.error("Error updating access code:", error);
    // Always show detailed error to help debug
    const errorMessage = error?.message || error?.toString() || "Failed to update access code";
    return { 
      success: false, 
      error: `Failed to update access code: ${errorMessage}` 
    };
  }
}

// Remove all users from database
export async function removeAllUsers(): Promise<{ success: boolean; error?: string; deletedCount?: number }> {
  try {
    const db = await getMongoDb();
    const result = await db.collection(collections.users).deleteMany({});
    return {
      success: true,
      deletedCount: result.deletedCount,
    };
  } catch (error: any) {
    console.error("Error removing users:", error);
    return {
      success: false,
      error: `Failed to remove users: ${error.message || "Unknown error"}`,
    };
  }
}

// Remove users by role
export async function removeUsersByRole(role: UserRole): Promise<{ success: boolean; error?: string; deletedCount?: number }> {
  try {
    const db = await getMongoDb();
    const result = await db.collection(collections.users).deleteMany({ role });
    return {
      success: true,
      deletedCount: result.deletedCount,
    };
  } catch (error: any) {
    console.error("Error removing users by role:", error);
    return {
      success: false,
      error: `Failed to remove users: ${error.message || "Unknown error"}`,
    };
  }
}

// Remove a specific user by name (server action - no API key needed for authenticated teachers)
export async function removeUser(userName: string): Promise<{ success: boolean; error?: string; deletedCount?: number }> {
  try {
    const db = await getMongoDb();
    
    // Try to find and delete by name (works for both teachers and students)
    const result = await db.collection(collections.users).deleteMany({ name: userName });
    
    // Also try student ID format
    if (result.deletedCount === 0) {
      const studentId = `student_${userName.toLowerCase().replace(/\s+/g, "_")}`;
      const studentResult = await db.collection(collections.users).deleteOne({ _id: studentId } as any);
      return {
        success: true,
        deletedCount: studentResult.deletedCount,
      };
    }
    
    return {
      success: true,
      deletedCount: result.deletedCount,
    };
  } catch (error: any) {
    console.error("Error removing user:", error);
    return {
      success: false,
      error: `Failed to remove user: ${error.message || "Unknown error"}`,
    };
  }
}

// Clear database (preserves settings like access_code, users, and points)
export async function clearDatabase(): Promise<{ success: boolean; error?: string; deletedCounts?: { content: number; messages: number; rewards: number } }> {
  try {
    const db = await getMongoDb();
    
    // Delete all content (sessions and shared content/files)
    const contentResult = await db.collection(collections.content).deleteMany({});
    
    // Delete all messages (session messages and general chat)
    const messagesResult = await db.collection(collections.messages).deleteMany({});
    
    // Delete all rewards
    const rewardsResult = await db.collection(collections.rewards).deleteMany({});
    
    // Note: We preserve:
    // - settings collection (access_code, etc.)
    // - users collection (users and their points are preserved)
    
    return {
      success: true,
      deletedCounts: {
        content: contentResult.deletedCount,
        messages: messagesResult.deletedCount,
        rewards: rewardsResult.deletedCount,
      },
    };
  } catch (error: any) {
    console.error("Error clearing database:", error);
    return {
      success: false,
      error: `Failed to clear database: ${error.message || "Unknown error"}`,
    };
  }
}

