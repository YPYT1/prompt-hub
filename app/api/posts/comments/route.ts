import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { v4 as uuidv4 } from "uuid";

interface CommentRow {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  username: string;
  avatar_url: string | null;
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  createdAt: string;
  author: {
    username: string;
    avatarUrl?: string;
  };
}

// 获取帖子评论
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json(
        { success: false, error: "缺少帖子 ID" },
        { status: 400 }
      );
    }

    const db = getDb();
    const results = await db
      .prepare(
        `SELECT c.*, u.username, u.avatar_url
         FROM post_comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.post_id = ?
         ORDER BY c.created_at ASC`
      )
      .bind(postId)
      .all<CommentRow>();

    const comments: Comment[] = results.results.map((row: CommentRow) => ({
      id: row.id,
      postId: row.post_id,
      content: row.content,
      createdAt: row.created_at,
      author: {
        username: row.username,
        avatarUrl: row.avatar_url || undefined,
      },
    }));

    return NextResponse.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    console.error("获取评论失败:", error);
    return NextResponse.json(
      { success: false, error: "获取评论失败" },
      { status: 500 }
    );
  }
}

// 发表评论
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as { postId: string; content: string };
    const { postId, content } = body;

    if (!postId || !content?.trim()) {
      return NextResponse.json(
        { success: false, error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const db = getDb();
    const commentId = uuidv4();
    const now = new Date().toISOString();

    await db
      .prepare(
        "INSERT INTO post_comments (id, post_id, user_id, content, created_at) VALUES (?, ?, ?, ?, ?)"
      )
      .bind(commentId, postId, user.id, content.trim(), now)
      .run();

    return NextResponse.json({
      success: true,
      data: {
        id: commentId,
        postId,
        content: content.trim(),
        createdAt: now,
        author: {
          username: user.username,
          avatarUrl: user.avatar_url || undefined,
        },
      },
      message: "评论成功",
    });
  } catch (error) {
    console.error("发表评论失败:", error);
    return NextResponse.json(
      { success: false, error: "发表评论失败" },
      { status: 500 }
    );
  }
}
