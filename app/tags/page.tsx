"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Tags, Search, Filter } from "lucide-react";
import { Tag } from "@/lib/types";
import { Button, Input, ConfirmModal, useToast, Select } from "@/components/ui";
import { TagCard, TagEmptyState } from "@/components/tag/tag-card";
import { TagForm } from "@/components/tag/tag-form";

export default function TagsPage() {
  const toast = useToast();

  // 状态
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());

  // 弹窗状态
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deleteTag, setDeleteTag] = useState<Tag | null>(null);

  // 加载数据
  useEffect(() => {
    const loadTags = async () => {
      try {
        const response = await fetch("/api/tags");
        const data = (await response.json()) as { data?: Tag[] };
        setTags(data.data || []);
      } catch (error) {
        toast.error("加载标签失败");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTags();
  }, []);

  // 获取所有分组
  const groups = useMemo(() => {
    const groupSet = new Set<string>();
    tags.forEach((tag) => {
      if (tag.group) groupSet.add(tag.group);
    });
    return Array.from(groupSet).sort();
  }, [tags]);

  // 筛选标签
  const filteredTags = useMemo(() => {
    let result = [...tags];

    // 搜索筛选
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter((tag) =>
        tag.name.toLowerCase().includes(searchLower)
      );
    }

    // 分组筛选
    if (filterGroup) {
      result = result.filter((tag) => tag.group === filterGroup);
    }

    return result;
  }, [tags, search, filterGroup]);

  // 获取父级标签（没有 parentId 的标签）
  const rootTags = useMemo(() => {
    return filteredTags
      .filter((tag) => !tag.parentId)
      .sort((a, b) => a.order - b.order);
  }, [filteredTags]);

  // 获取子标签
  const getChildTags = (parentId: string) => {
    return filteredTags
      .filter((tag) => tag.parentId === parentId)
      .sort((a, b) => a.order - b.order);
  };

  // 创建/更新标签
  const handleSubmit = async (tag: Tag) => {
    try {
      const isNew = !tags.find((t) => t.id === tag.id);
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tag),
      });

      if (!response.ok) throw new Error("操作失败");

      if (isNew) {
        setTags([...tags, tag]);
      } else {
        setTags(tags.map((t) => (t.id === tag.id ? tag : t)));
      }
    } catch (error) {
      throw error;
    }
  };

  // 删除标签
  const handleDelete = async () => {
    if (!deleteTag) return;

    try {
      const response = await fetch(`/api/tags?id=${deleteTag.id}`, {
        method: "DELETE",
      });

      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        toast.error(result.error || "删除失败");
        return;
      }

      setTags(tags.filter((t) => t.id !== deleteTag.id));
      toast.success("标签已删除");
    } catch (error) {
      toast.error("删除失败");
    } finally {
      setDeleteTag(null);
    }
  };

  // 切换展开状态
  const toggleExpand = (tagId: string) => {
    const newExpanded = new Set(expandedTags);
    if (newExpanded.has(tagId)) {
      newExpanded.delete(tagId);
    } else {
      newExpanded.add(tagId);
    }
    setExpandedTags(newExpanded);
  };

  // 按分组展示标签
  const tagsByGroup = useMemo(() => {
    const grouped: Record<string, Tag[]> = { 未分组: [] };
    groups.forEach((group) => {
      grouped[group] = [];
    });

    rootTags.forEach((tag) => {
      const group = tag.group || "未分组";
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(tag);
    });

    return grouped;
  }, [rootTags, groups]);

  return (
    <div className="container py-8">
      {/* 页面标题 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Tags className="h-8 w-8 text-primary" />
              标签管理
            </h1>
            <p className="mt-1 text-muted-foreground">
              管理和组织你的标签，支持层级结构和分组
            </p>
          </div>

          <Button
            onClick={() => {
              setEditingTag(null);
              setIsFormOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            新建标签
          </Button>
        </div>
      </motion.div>

      {/* 筛选器 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 flex flex-col sm:flex-row gap-3"
      >
        <div className="flex-1">
          <Input
            placeholder="搜索标签..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>

        <div className="w-full sm:w-48">
          <Select
            value={filterGroup}
            onChange={setFilterGroup}
            options={[
              { value: "", label: "全部分组" },
              ...groups.map((g) => ({ value: g, label: g })),
            ]}
            placeholder="按分组筛选"
          />
        </div>
      </motion.div>

      {/* 统计信息 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mb-6 flex items-center gap-4 text-sm text-muted-foreground"
      >
        <span>共 {tags.length} 个标签</span>
        <span>·</span>
        <span>{groups.length} 个分组</span>
        {(search || filterGroup) && (
          <>
            <span>·</span>
            <span>当前显示 {filteredTags.length} 个</span>
          </>
        )}
      </motion.div>

      {/* 标签列表 */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-lg bg-card animate-pulse border border-border"
            />
          ))}
        </div>
      ) : filteredTags.length === 0 ? (
        <TagEmptyState />
      ) : filterGroup ? (
        // 按分组筛选时直接显示列表
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <AnimatePresence>
            {rootTags.map((tag, index) => (
              <TagCard
                key={tag.id}
                tag={tag}
                childTags={getChildTags(tag.id)}
                index={index}
                onEdit={(t) => {
                  setEditingTag(t);
                  setIsFormOpen(true);
                }}
                onDelete={(t) => setDeleteTag(t)}
                isExpanded={expandedTags.has(tag.id)}
                onToggleExpand={() => toggleExpand(tag.id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        // 默认按分组显示
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-8"
        >
          {Object.entries(tagsByGroup).map(([group, groupTags]) => {
            if (groupTags.length === 0) return null;
            return (
              <div key={group}>
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  {group}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({groupTags.length})
                  </span>
                </h2>
                <div className="space-y-3">
                  <AnimatePresence>
                    {groupTags.map((tag, index) => (
                      <TagCard
                        key={tag.id}
                        tag={tag}
                        childTags={getChildTags(tag.id)}
                        index={index}
                        onEdit={(t) => {
                          setEditingTag(t);
                          setIsFormOpen(true);
                        }}
                        onDelete={(t) => setDeleteTag(t)}
                        isExpanded={expandedTags.has(tag.id)}
                        onToggleExpand={() => toggleExpand(tag.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* 标签表单弹窗 */}
      <TagForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTag(null);
        }}
        onSubmit={handleSubmit}
        tag={editingTag}
        parentTags={tags.filter((t) => !t.parentId)}
      />

      {/* 删除确认弹窗 */}
      <ConfirmModal
        isOpen={!!deleteTag}
        onClose={() => setDeleteTag(null)}
        onConfirm={handleDelete}
        title="删除标签"
        description={`确定要删除「${deleteTag?.name}」吗？此操作不可撤销。`}
        confirmText="删除"
        isDestructive
      />
    </div>
  );
}
