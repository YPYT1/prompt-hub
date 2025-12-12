import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth/session";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      username: string;
      email: string;
      password: string;
    };
    const { username, email, password } = body;

    // 验证
    if (!username || username.length < 4) {
      return NextResponse.json(
        { success: false, error: "用户名至少需要4个字符" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "请输入有效的邮箱地址" },
        { status: 400 }
      );
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    if (!password || !passwordRegex.test(password)) {
      return NextResponse.json(
        { success: false, error: "密码至少6位，需包含字母和数字" },
        { status: 400 }
      );
    }

    const db = getDb();

    // 检查用户名是否已存在
    const existingUsername = await db
      .prepare("SELECT id FROM users WHERE username = ?")
      .bind(username)
      .first();

    if (existingUsername) {
      return NextResponse.json(
        { success: false, error: "用户名已被使用" },
        { status: 400 }
      );
    }

    // 检查邮箱是否已存在
    const existingEmail = await db
      .prepare("SELECT id FROM users WHERE email = ?")
      .bind(email)
      .first();

    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: "邮箱已被注册" },
        { status: 400 }
      );
    }

    // 创建用户
    const userId = uuidv4();
    const now = new Date().toISOString();
    const passwordHash = await hashPassword(password);

    await db
      .prepare(
        "INSERT INTO users (id, username, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .bind(userId, username, email, passwordHash, now, now)
      .run();

    // 创建会话
    await createSession(userId);

    return NextResponse.json({
      success: true,
      message: "注册成功",
      data: { id: userId, username, email },
    });
  } catch (error) {
    console.error("注册失败:", error);
    return NextResponse.json(
      { success: false, error: "注册失败，请稍后重试" },
      { status: 500 }
    );
  }
}
