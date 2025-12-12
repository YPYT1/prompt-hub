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

    // 检查是否已收藏
    const existing = await db
      .prepare(
        "SELECT post_id FROM post_bookmarks WHERE post_id = ? AND user_id = ?"
      )
      .bind(postId, user.id)
      .first();

    if (existing) {
      // 取消收藏
      await db
        .prepare("DELETE FROM post_bookmarks WHERE post_id = ? AND user_id = ?")
        .bind(postId, user.id)
        .run();

      return NextResponse.json({
        success: true,
        data: { bookmarked: false },
        message: "已取消收藏",
      });
    } else {
      // 收藏
      await db
        .prepare(
          "INSERT INTO post_bookmarks (post_id, user_id, created_at) VALUES (?, ?, ?)"
        )
        .bind(postId, user.id, now)
        .run();

      return NextResponse.json({
        success: true,
        data: { bookmarked: true },
        message: "收藏成功",
      });
    }
  } catch (error) {
    console.error("收藏操作失败:", error);
    return NextResponse.json(
      { success: false, error: "操作失败" },
      { status: 500 }
    );
  }
}
