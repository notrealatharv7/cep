"use server";

import { db } from "@/firebase/index";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { nanoid } from "nanoid";
import { readFile, writeFile, access } from "fs/promises";
import { join } from "path";

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
  createdAt: Timestamp;
}

export interface ChatMessage {
  text: string;
  senderName: string;
  timestamp: Timestamp;
}

// Access code file path
const ACCESS_CODE_PATH = join(process.cwd(), ".access_code.txt");

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

    // Create/update user document
    const userId = `student_${name.toLowerCase().replace(/\s+/g, "_")}`;
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      // Update existing user
      await updateDoc(userRef, {
        name,
        lastActiveAt: serverTimestamp(),
      });
    } else {
      // Create new user
      await setDoc(userRef, {
        name,
        role: "student" as UserRole,
        points: 0,
        createdAt: new Date().toISOString(),
        lastActiveAt: serverTimestamp(),
      });
    }

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
    const sessionId = nanoid(8);
    const sessionRef = doc(db, "content", sessionId);

    // Fire-and-forget operation
    setDoc(sessionRef, {
      type: "text",
      content: "",
      senderName: userName,
      createdAt: serverTimestamp(),
    }).catch((error) => {
      console.error("Error creating session:", error);
    });

    return { success: true, sessionId };
  } catch (error) {
    console.error("Error creating session:", error);
    return { success: false, error: "Failed to create session" };
  }
}

// Join session
export async function joinSession(
  sessionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const sessionRef = doc(db, "content", sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
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
    const sessionRef = doc(db, "content", sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
      return { success: false, error: "Session not found" };
    }

    const content = sessionSnap.data() as SharedContent;

    // Get messages
    const messagesRef = collection(db, "content", sessionId, "messages");
    const messagesQuery = query(
      messagesRef,
      orderBy("timestamp", "desc"),
      limit(50)
    );
    const messagesSnap = await getDocs(messagesQuery);
    const messages = messagesSnap.docs
      .map((doc) => doc.data() as ChatMessage)
      .reverse();

    // Update user document if userName provided
    if (userName) {
      const userId = `student_${userName.toLowerCase().replace(/\s+/g, "_")}`;
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        await updateDoc(userRef, {
          lastActiveAt: serverTimestamp(),
        });
      } else {
        await setDoc(userRef, {
          name: userName,
          role: "student" as UserRole,
          points: 0,
          createdAt: new Date().toISOString(),
          lastActiveAt: serverTimestamp(),
        });
      }
    }

    return { success: true, content, messages };
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
    const sessionRef = doc(db, "content", sessionId);
    await updateDoc(sessionRef, {
      content: newContent,
    });

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
    const messagesRef = collection(db, "content", sessionId, "messages");
    await addDoc(messagesRef, {
      text,
      senderName,
      timestamp: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending chat message:", error);
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
    const contentId = nanoid(8);
    const contentRef = doc(db, "content", contentId);

    // Fire-and-forget operation
    setDoc(contentRef, {
      type,
      content,
      senderName,
      filename: filename || undefined,
      mimetype: mimetype || undefined,
      createdAt: serverTimestamp(),
    }).catch((error) => {
      console.error("Error sending content:", error);
    });

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
    const contentRef = doc(db, "content", id);
    const contentSnap = await getDoc(contentRef);

    if (!contentSnap.exists()) {
      return { success: false, error: "Content not found" };
    }

    const content = contentSnap.data() as SharedContent;
    return { success: true, content };
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
    const userId = `student_${senderName.toLowerCase().replace(/\s+/g, "_")}`;
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const currentPoints = userSnap.data().points || 0;
      await updateDoc(userRef, {
        points: currentPoints + 1,
      });
    } else {
      await setDoc(userRef, {
        name: senderName,
        role: "student" as UserRole,
        points: 1,
        createdAt: new Date().toISOString(),
      });
    }

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
    const userId = `student_${userName.toLowerCase().replace(/\s+/g, "_")}`;
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const points = userSnap.data().points || 0;
      return { success: true, points };
    }

    // Check if it's a teacher
    const teacherQuery = query(
      collection(db, "users"),
      where("name", "==", userName),
      where("role", "==", "teacher")
    );
    const teacherSnap = await getDocs(teacherQuery);

    if (!teacherSnap.empty) {
      const points = teacherSnap.docs[0].data().points || 0;
      return { success: true, points };
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
    const usersRef = collection(db, "users");
    const usersSnap = await getDocs(usersRef);

    const teachers: UserProfile[] = [];
    const students: UserProfile[] = [];

    usersSnap.forEach((doc) => {
      const data = doc.data();
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
    });

    // Sort by points descending
    teachers.sort((a, b) => b.points - a.points);
    students.sort((a, b) => b.points - a.points);

    return { success: true, teachers, students };
  } catch (error) {
    console.error("Error getting leaderboard:", error);
    return { success: false, error: "Failed to get leaderboard" };
  }
}

// Get access code
export async function getAccessCode(): Promise<string> {
  try {
    await access(ACCESS_CODE_PATH);
    const code = await readFile(ACCESS_CODE_PATH, "utf-8");
    return code.trim();
  } catch {
    // File doesn't exist, create default
    const defaultCode = "COLLAB123";
    await writeFile(ACCESS_CODE_PATH, defaultCode, "utf-8");
    return defaultCode;
  }
}

// Update access code
export async function updateAccessCode(
  newCode: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await writeFile(ACCESS_CODE_PATH, newCode.trim(), "utf-8");
    return { success: true };
  } catch (error) {
    console.error("Error updating access code:", error);
    return { success: false, error: "Failed to update access code" };
  }
}

