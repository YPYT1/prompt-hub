import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

const SESSION_COOKIE_NAME = "session_id";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  expires_at: string;
  created_at: string;
}

export async function createSession(userId: string): Promise<string> {
  const db = getDb();
  const sessionId = uuidv4();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  await db
    .prepare(
      "INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)"
    )
    .bind(sessionId, userId, expiresAt, now)
    .run();

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });

  return sessionId;
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionId) return null;

  const db = getDb();
  const session = await db
    .prepare("SELECT * FROM sessions WHERE id = ?")
    .bind(sessionId)
    .first<Session>();

  if (!session) return null;

  if (new Date(session.expires_at) < new Date()) {
    await db.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
    return null;
  }

  return session;
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;

  const db = getDb();
  const user = await db
    .prepare(
      "SELECT id, username, email, avatar_url, created_at, updated_at FROM users WHERE id = ?"
    )
    .bind(session.user_id)
    .first<User>();

  return user || null;
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionId) {
    const db = getDb();
    await db.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}
