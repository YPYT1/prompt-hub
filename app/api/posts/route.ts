import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { v4 as uuidv4 } from "uuid";

interface PostRow {
  id: string;
  user_id: string;
  title: string;
  content: string;
  description: string | null;
  tags_json: string;
  source_prompt_id: string | null;
  created_at: string;
  updated_at: string;
  username: string;
  avatar_url: string | null;
  likes_count: number;
  bookmarks_count: number;
  comments_count: number;
  is_liked: number;
  is_bookmarked: number;
}

export interface Post {
  id: string;
  userId: string;
  title: string;
  content: string;
  description?: string;
  tags: string[];
  sourcePromptId?: string;
  createdAt: string;
  updatedAt: string;
  author: {
    username: string;
    avatarUrl?: string;
  };
  likesCount: number;
  bookmarksCount: number;
  commentsCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
}

function rowToPost(row: PostRow): Post {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    content: row.content,
    description: row.description || undefined,
    tags: JSON.parse(row.tags_json || "[]"),
    sourcePromptId: row.source_prompt_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: {
      username: row.username,
      avatarUrl: row.avatar_url || undefined,
    },
    likesCount: row.likes_count,
    bookmarksCount: row.bookmarks_count,
    commentsCount: row.comments_count,
    isLiked: row.is_liked === 1,
    isBookmarked: row.is_bookmarked === 1,
  };
}

// 获取所有帖子（广场）
export async function GET() {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || "";

    const db = getDb();
    const results = await db
      .prepare(
        `SELECT 
          p.*,
          u.username,
          u.avatar_url,
          (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
          (SELECT COUNT(*) FROM post_bookmarks WHERE post_id = p.id) as bookmarks_count,
          (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) as comments_count,
          (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id AND user_id = ?) as is_liked,
          (SELECT COUNT(*) FROM post_bookmarks WHERE post_id = p.id AND user_id = ?) as is_bookmarked
        FROM posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC`
      )
      .bind(userId, userId)
      .all<PostRow>();

    const posts = results.results.map(rowToPost);

    return NextResponse.json({
      success: true,
      data: posts,
    });
  } catch (error) {
    console.error("获取帖子失败:", error);
    return NextResponse.json(
      { success: false, error: "获取帖子失败" },
      { status: 500 }
    );
  }
}

// 创建帖子
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      title: string;
      content: string;
      description?: string;
      tags?: string[];
      sourcePromptId?: string;
    };

    const db = getDb();
    const postId = uuidv4();
    const now = new Date().toISOString();

    await db
      .prepare(
        `INSERT INTO posts (id, user_id, title, content, description, tags_json, source_prompt_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        postId,
        user.id,
        body.title,
        body.content,
        body.description || null,
        JSON.stringify(body.tags || []),
        body.sourcePromptId || null,
        now,
        now
      )
      .run();

    return NextResponse.json({
      success: true,
      data: { id: postId },
      message: "发布成功",
    });
  } catch (error) {
    console.error("发布帖子失败:", error);
    return NextResponse.json(
      { success: false, error: "发布帖子失败" },
      { status: 500 }
    );
  }
}

// 删除帖子
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "缺少帖子 ID" },
        { status: 400 }
      );
    }

    const db = getDb();
    const result = await db
      .prepare("DELETE FROM posts WHERE id = ? AND user_id = ?")
      .bind(id, user.id)
      .run();

    if (result.meta.changes === 0) {
      return NextResponse.json(
        { success: false, error: "帖子不存在或无权删除" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "删除成功",
    });
  } catch (error) {
    console.error("删除帖子失败:", error);
    return NextResponse.json(
      { success: false, error: "删除帖子失败" },
      { status: 500 }
    );
  }
}
