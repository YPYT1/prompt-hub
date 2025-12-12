import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email: string; password: string };
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "请输入邮箱和密码" },
        { status: 400 }
      );
    }

    const db = getDb();

    // 查找用户
    const user = await db
      .prepare(
        "SELECT id, username, email, password_hash, avatar_url FROM users WHERE email = ?"
      )
      .bind(email)
      .first<{
        id: string;
        username: string;
        email: string;
        password_hash: string;
        avatar_url: string | null;
      }>();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "邮箱或密码错误" },
        { status: 401 }
      );
    }

    // 验证密码
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "邮箱或密码错误" },
        { status: 401 }
      );
    }

    // 创建会话
    await createSession(user.id);

    return NextResponse.json({
      success: true,
      message: "登录成功",
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error) {
    console.error("登录失败:", error);
    return NextResponse.json(
      { success: false, error: "登录失败，请稍后重试" },
      { status: 500 }
    );
  }
}
