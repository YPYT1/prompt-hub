import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as { postId: string };
    const { postId } = body;

    if (!postId) {
      return NextResponse.json(
        { success: false, error: "缺少帖子 ID" },
        { status: 400 }
      );
    }

    const db = getDb();
    const now = new Date().toISOString();

    // 检查是否已点赞
    const existing = await db
      .prepare(
        "SELECT post_id FROM post_likes WHERE post_id = ? AND user_id = ?"
      )
      .bind(postId, user.id)
      .first();

    if (existing) {
      // 取消点赞
      await db
        .prepare("DELETE FROM post_likes WHERE post_id = ? AND user_id = ?")
        .bind(postId, user.id)
        .run();

      return NextResponse.json({
        success: true,
        data: { liked: false },
        message: "已取消点赞",
      });
    } else {
      // 点赞
      await db
        .prepare(
          "INSERT INTO post_likes (post_id, user_id, created_at) VALUES (?, ?, ?)"
        )
        .bind(postId, user.id, now)
        .run();

      return NextResponse.json({
        success: true,
        data: { liked: true },
        message: "点赞成功",
      });
    }
  } catch (error) {
    console.error("点赞操作失败:", error);
    return NextResponse.json(
      { success: false, error: "操作失败" },
      { status: 500 }
    );
  }
}
