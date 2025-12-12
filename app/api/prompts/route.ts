import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { Prompt } from "@/lib/types";

// 获取所有提示词
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      );
    }

    const db = getDb();
    const results = await db
      .prepare(
        "SELECT * FROM prompts WHERE user_id = ? ORDER BY updated_at DESC"
      )
      .bind(user.id)
      .all<{
        id: string;
        user_id: string;
        title: string;
        content: string;
        description: string | null;
        tags_json: string;
        is_favorite: number;
        usage_count: number;
        versions_json: string;
        created_at: string;
        updated_at: string;
      }>();

    const prompts: Prompt[] = results.results.map((row: PromptRow) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      description: row.description || undefined,
      tags: JSON.parse(row.tags_json || "[]"),
      isFavorite: row.is_favorite === 1,
      usageCount: row.usage_count,
      versions: JSON.parse(row.versions_json || "[]"),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: prompts,
    });
  } catch (error) {
    console.error("获取提示词失败:", error);
    return NextResponse.json(
      { success: false, error: "获取提示词失败" },
      { status: 500 }
    );
  }
}

// 创建或更新提示词
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      );
    }

    const prompt = (await request.json()) as Prompt;
    const db = getDb();

    // 检查是否存在
    const existing = await db
      .prepare("SELECT id FROM prompts WHERE id = ? AND user_id = ?")
      .bind(prompt.id, user.id)
      .first();

    if (existing) {
      // 更新
      await db
        .prepare(
          `UPDATE prompts SET title = ?, content = ?, description = ?, tags_json = ?, 
           is_favorite = ?, usage_count = ?, versions_json = ?, updated_at = ? 
           WHERE id = ? AND user_id = ?`
        )
        .bind(
          prompt.title,
          prompt.content,
          prompt.description || null,
          JSON.stringify(prompt.tags),
          prompt.isFavorite ? 1 : 0,
          prompt.usageCount,
          JSON.stringify(prompt.versions),
          prompt.updatedAt,
          prompt.id,
          user.id
        )
        .run();
    } else {
      // 创建
      await db
        .prepare(
          `INSERT INTO prompts (id, user_id, title, content, description, tags_json, 
           is_favorite, usage_count, versions_json, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          prompt.id,
          user.id,
          prompt.title,
          prompt.content,
          prompt.description || null,
          JSON.stringify(prompt.tags),
          prompt.isFavorite ? 1 : 0,
          prompt.usageCount,
          JSON.stringify(prompt.versions),
          prompt.createdAt,
          prompt.updatedAt
        )
        .run();
    }

    return NextResponse.json({
      success: true,
      data: prompt,
      message: existing ? "更新成功" : "创建成功",
    });
  } catch (error) {
    console.error("保存提示词失败:", error);
    return NextResponse.json(
      { success: false, error: "保存提示词失败" },
      { status: 500 }
    );
  }
}

// 删除提示词
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
        { success: false, error: "缺少提示词 ID" },
        { status: 400 }
      );
    }

    const db = getDb();
    const result = await db
      .prepare("DELETE FROM prompts WHERE id = ? AND user_id = ?")
      .bind(id, user.id)
      .run();

    if (result.meta.changes === 0) {
      return NextResponse.json(
        { success: false, error: "提示词不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "删除成功",
    });
  } catch (error) {
    console.error("删除提示词失败:", error);
    return NextResponse.json(
      { success: false, error: "删除提示词失败" },
      { status: 500 }
    );
  }
}

// 更新使用次数
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as { id: string };
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "缺少提示词 ID" },
        { status: 400 }
      );
    }

    const db = getDb();
    await db
      .prepare(
        "UPDATE prompts SET usage_count = usage_count + 1 WHERE id = ? AND user_id = ?"
      )
      .bind(id, user.id)
      .run();

    const updated = await db
      .prepare("SELECT * FROM prompts WHERE id = ? AND user_id = ?")
      .bind(id, user.id)
      .first<{
        id: string;
        title: string;
        content: string;
        description: string | null;
        tags_json: string;
        is_favorite: number;
        usage_count: number;
        versions_json: string;
        created_at: string;
        updated_at: string;
      }>();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "提示词不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        title: updated.title,
        content: updated.content,
        description: updated.description || undefined,
        tags: JSON.parse(updated.tags_json || "[]"),
        isFavorite: updated.is_favorite === 1,
        usageCount: updated.usage_count,
        versions: JSON.parse(updated.versions_json || "[]"),
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      },
    });
  } catch (error) {
    console.error("更新使用次数失败:", error);
    return NextResponse.json(
      { success: false, error: "更新使用次数失败" },
      { status: 500 }
    );
  }
}
