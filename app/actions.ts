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
  mimetype?: string
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
  senderName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getMongoDb();
    const userId = `student_${senderName.toLowerCase().replace(/\s+/g, "_")}`;
    await db.collection(collections.users).updateOne(
      { _id: userId } as any,
      {
        $setOnInsert: {
          role: "student" as UserRole,
          createdAt: new Date().toISOString(),
          name: senderName,
        },
        $inc: { points: 1 },
      },
      { upsert: true }
    );

    return { success: true };
  } catch (error) {
    console.error("Error awarding point:", error);
    return { success: false, error: "Failed to award point" };
  }
}

// Get user points
export async function getUserPoints(
  userName: string
): Promise<{ success: boolean; points?: number; error?: string }> {
  try {
    const db = await getMongoDb();
    const userId = `student_${userName.toLowerCase().replace(/\s+/g, "_")}`;
    const student = await db.collection(collections.users).findOne({ _id: userId } as any);
    if (student) {
      return { success: true, points: student.points || 0 };
    }
    const teacher = await db
      .collection(collections.users)
      .findOne({ name: userName, role: "teacher" });
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
    const users = await db.collection(collections.users).find({}).toArray();
    const teachers: UserProfile[] = [];
    const students: UserProfile[] = [];
    for (const data of users) {
      const user: UserProfile = {
        name: data.name,
        role: data.role,
        points: data.points || 0,
        createdAt: data.createdAt || new Date().toISOString(),
      };
      if (user.role === "teacher") {
        teachers.push(user);
      } else {
        students.push(user);
      }
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

