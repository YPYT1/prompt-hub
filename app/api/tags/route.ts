import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { Tag } from "@/lib/types";

interface TagRow {
  id: string;
  user_id: string;
  name: string;
  color: string;
  parent_id: string | null;
  group_name: string | null;
  order_num: number;
  usage_count: number;
  created_at: string;
}

function rowToTag(row: TagRow): Tag {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    parentId: row.parent_id || undefined,
    group: row.group_name || undefined,
    order: row.order_num,
    usageCount: row.usage_count,
    createdAt: row.created_at,
  };
}

// 获取所有标签
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
      .prepare("SELECT * FROM tags WHERE user_id = ? ORDER BY order_num ASC")
      .bind(user.id)
      .all<TagRow>();

    const tags: Tag[] = results.results.map(rowToTag);

    return NextResponse.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    console.error("获取标签失败:", error);
    return NextResponse.json(
      { success: false, error: "获取标签失败" },
      { status: 500 }
    );
  }
}

// 创建或更新标签
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      );
    }

    const tag = (await request.json()) as Tag;
    const db = getDb();

    // 检查是否存在
    const existing = await db
      .prepare("SELECT id FROM tags WHERE id = ? AND user_id = ?")
      .bind(tag.id, user.id)
      .first();

    if (existing) {
      // 更新
      await db
        .prepare(
          `UPDATE tags SET name = ?, color = ?, parent_id = ?, group_name = ?, 
           order_num = ?, usage_count = ? WHERE id = ? AND user_id = ?`
        )
        .bind(
          tag.name,
          tag.color,
          tag.parentId || null,
          tag.group || null,
          tag.order,
          tag.usageCount,
          tag.id,
          user.id
        )
        .run();
    } else {
      // 获取当前最大 order
      const maxOrder = await db
        .prepare(
          "SELECT MAX(order_num) as max_order FROM tags WHERE user_id = ?"
        )
        .bind(user.id)
        .first<{ max_order: number | null }>();

      const newOrder = (maxOrder?.max_order ?? -1) + 1;

      await db
        .prepare(
          `INSERT INTO tags (id, user_id, name, color, parent_id, group_name, order_num, usage_count, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          tag.id,
          user.id,
          tag.name,
          tag.color,
          tag.parentId || null,
          tag.group || null,
          newOrder,
          tag.usageCount || 0,
          tag.createdAt
        )
        .run();
    }

    return NextResponse.json({
      success: true,
      data: tag,
      message: existing ? "更新成功" : "创建成功",
    });
  } catch (error) {
    console.error("保存标签失败:", error);
    return NextResponse.json(
      { success: false, error: "保存标签失败" },
      { status: 500 }
    );
  }
}

// 删除标签
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
        { success: false, error: "缺少标签 ID" },
        { status: 400 }
      );
    }

    const db = getDb();

    // 检查是否有子标签
    const hasChildren = await db
      .prepare("SELECT id FROM tags WHERE parent_id = ? AND user_id = ?")
      .bind(id, user.id)
      .first();

    if (hasChildren) {
      return NextResponse.json(
        { success: false, error: "该标签下有子标签，请先删除子标签" },
        { status: 400 }
      );
    }

    const result = await db
      .prepare("DELETE FROM tags WHERE id = ? AND user_id = ?")
      .bind(id, user.id)
      .run();

    if (result.meta.changes === 0) {
      return NextResponse.json(
        { success: false, error: "标签不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "删除成功",
    });
  } catch (error) {
    console.error("删除标签失败:", error);
    return NextResponse.json(
      { success: false, error: "删除标签失败" },
      { status: 500 }
    );
  }
}

// 批量更新标签顺序
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as { tags: Tag[] };
    const { tags: updatedTags } = body;
    const db = getDb();

    // 批量更新顺序
    for (const tag of updatedTags) {
      await db
        .prepare("UPDATE tags SET order_num = ? WHERE id = ? AND user_id = ?")
        .bind(tag.order, tag.id, user.id)
        .run();
    }

    return NextResponse.json({
      success: true,
      data: updatedTags,
      message: "更新成功",
    });
  } catch (error) {
    console.error("更新标签顺序失败:", error);
    return NextResponse.json(
      { success: false, error: "更新标签顺序失败" },
      { status: 500 }
    );
  }
}
