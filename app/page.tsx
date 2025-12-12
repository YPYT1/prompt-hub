"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Download, Upload, Layers, Search, Zap } from "lucide-react";
import { Prompt, Tag, FilterOptions } from "@/lib/types";
import { Button, ConfirmModal, useToast } from "@/components/ui";
import { PromptCard } from "@/components/prompt/prompt-card";
import { PromptForm } from "@/components/prompt/prompt-form";
import { PromptFilter } from "@/components/prompt/prompt-filter";
import { PromptHistory } from "@/components/prompt/prompt-history";
import { downloadJSON } from "@/lib/utils";

export default function HomePage() {
  const toast = useToast();

  // 状态
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    tags: [],
    favorite: null,
    sortBy: "time",
    sortOrder: "desc",
  });

  // 弹窗状态
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [historyPrompt, setHistoryPrompt] = useState<Prompt | null>(null);
  const [deletePrompt, setDeletePrompt] = useState<Prompt | null>(null);

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        const [promptsRes, tagsRes] = await Promise.all([
          fetch("/api/prompts"),
          fetch("/api/tags"),
        ]);
        const promptsData = (await promptsRes.json()) as { data?: Prompt[] };
        const tagsData = (await tagsRes.json()) as { data?: Tag[] };
        setPrompts(promptsData.data || []);
        setTags(tagsData.data || []);
      } catch (error) {
        toast.error("加载数据失败");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // 筛选和排序提示词
  const filteredPrompts = useMemo(() => {
    let result = [...prompts];

    // 搜索筛选
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(search) ||
          p.content.toLowerCase().includes(search) ||
          p.description?.toLowerCase().includes(search)
      );
    }

    // 标签筛选
    if (filters.tags.length > 0) {
      result = result.filter((p) =>
        filters.tags.some((tagId) => p.tags.includes(tagId))
      );
    }

    // 收藏筛选
    if (filters.favorite !== null) {
      result = result.filter((p) => p.isFavorite === filters.favorite);
    }

    // 排序
    result.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case "time":
          comparison =
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          break;
        case "name":
          comparison = a.title.localeCompare(b.title, "zh-CN");
          break;
        case "usage":
          comparison = b.usageCount - a.usageCount;
          break;
      }
      return filters.sortOrder === "desc" ? comparison : -comparison;
    });

    return result;
  }, [prompts, filters]);

  // 创建/更新提示词
  const handleSubmit = async (prompt: Prompt) => {
    try {
      const isNew = !prompts.find((p) => p.id === prompt.id);
      const response = await fetch("/api/prompts", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prompt),
      });

      if (!response.ok) throw new Error("操作失败");

      if (isNew) {
        setPrompts([prompt, ...prompts]);
      } else {
        setPrompts(prompts.map((p) => (p.id === prompt.id ? prompt : p)));
      }
    } catch (error) {
      throw error;
    }
  };

  // 删除提示词
  const handleDelete = async () => {
    if (!deletePrompt) return;

    try {
      const response = await fetch(`/api/prompts?id=${deletePrompt.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("删除失败");

      setPrompts(prompts.filter((p) => p.id !== deletePrompt.id));
      toast.success("提示词已删除");
    } catch (error) {
      toast.error("删除失败");
    } finally {
      setDeletePrompt(null);
    }
  };

  // 切换收藏
  const handleToggleFavorite = async (prompt: Prompt) => {
    const updated = { ...prompt, isFavorite: !prompt.isFavorite };
    try {
      await fetch("/api/prompts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      setPrompts(prompts.map((p) => (p.id === prompt.id ? updated : p)));
    } catch (error) {
      toast.error("操作失败");
    }
  };

  // 使用提示词（增加使用次数）
  const handleUse = async (prompt: Prompt) => {
    const updated = { ...prompt, usageCount: prompt.usageCount + 1 };
    try {
      await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      setPrompts(prompts.map((p) => (p.id === prompt.id ? updated : p)));
    } catch (error) {
      console.error("更新使用次数失败:", error);
    }
  };

  // 恢复历史版本
  const handleRestoreVersion = async (
    prompt: Prompt,
    version: { id: string; content: string; createdAt: string }
  ) => {
    const now = new Date().toISOString();
    const updated: Prompt = {
      ...prompt,
      content: version.content,
      updatedAt: now,
      versions: [
        { id: crypto.randomUUID(), content: version.content, createdAt: now },
        ...prompt.versions,
      ],
    };
    try {
      await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      setPrompts(prompts.map((p) => (p.id === prompt.id ? updated : p)));
      toast.success("已恢复到选中版本");
    } catch (error) {
      toast.error("恢复失败");
    }
  };

  // 导出数据
  const handleExport = () => {
    downloadJSON({ prompts, tags }, `prompt-hub-backup-${Date.now()}.json`);
    toast.success("数据已导出");
  };

  // 导入数据
  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (data.prompts) {
          const response = await fetch("/api/prompts/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });

          if (!response.ok) throw new Error("导入失败");

          const result = (await response.json()) as {
            data?: { prompts?: Prompt[]; tags?: Tag[] };
          };
          setPrompts(result.data?.prompts || prompts);
          setTags(result.data?.tags || tags);
          toast.success("数据已导入");
        } else {
          toast.error("无效的数据格式");
        }
      } catch (error) {
        toast.error("导入失败，请检查文件格式");
      }
    };
    input.click();
  };

  // 计算统计数据
  const stats = useMemo(
    () => ({
      total: prompts.length,
      favorites: prompts.filter((p) => p.isFavorite).length,
      totalUsage: prompts.reduce((acc, p) => acc + p.usageCount, 0),
    }),
    [prompts]
  );

  return (
    <div className="min-h-screen">
      {/* Hero 区域 */}
      <div className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="absolute inset-0 grid-bg opacity-30" />

        <div className="container relative py-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-lg">
                <Layers className="h-6 w-6 text-white" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-secondary opacity-50 blur-xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">提示词库</h1>
                <p className="text-muted-foreground">
                  管理和组织你的 AI 提示词，让创作更高效
                </p>
              </div>
            </div>

            {/* 统计卡片 */}
            <div className="flex flex-wrap gap-3 mt-6">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border shadow-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Layers className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">总计</p>
                  <p className="text-lg font-semibold text-foreground">
                    {stats.total}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border shadow-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                  <span className="text-amber-500">★</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">收藏</p>
                  <p className="text-lg font-semibold text-foreground">
                    {stats.favorites}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border shadow-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10">
                  <Zap className="h-4 w-4 text-secondary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">总使用</p>
                  <p className="text-lg font-semibold text-foreground">
                    {stats.totalUsage}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 操作按钮 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 flex flex-col sm:flex-row items-end sm:items-center gap-2"
          >
            <Button
              variant="outline"
              onClick={handleExport}
              className="gap-2 rounded-xl"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">导出</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleImport}
              className="gap-2 rounded-xl"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">导入</span>
            </Button>
            <Button
              onClick={() => {
                setEditingPrompt(null);
                setIsFormOpen(true);
              }}
              className="gap-2 rounded-xl shadow-lg shadow-primary/20"
            >
              <Plus className="h-4 w-4" />
              新建提示词
            </Button>
          </motion.div>
        </div>
      </div>

      <div className="container py-6">
        {/* 筛选器 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <PromptFilter
            filters={filters}
            onFilterChange={setFilters}
            tags={tags}
          />
        </motion.div>

        {/* 提示词列表 */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-card animate-pulse border border-border"
              />
            ))}
          </div>
        ) : filteredPrompts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                <Search className="h-10 w-10 text-muted-foreground" />
              </div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 blur-xl opacity-50" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {filters.search || filters.tags.length > 0
                ? "没有找到匹配的提示词"
                : "还没有提示词"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              {filters.search || filters.tags.length > 0
                ? "尝试调整筛选条件或使用不同的关键词搜索"
                : "创建你的第一个提示词，开始构建你的提示词库"}
            </p>
            {!filters.search && filters.tags.length === 0 && (
              <Button
                onClick={() => {
                  setEditingPrompt(null);
                  setIsFormOpen(true);
                }}
                className="gap-2 rounded-xl shadow-lg shadow-primary/20"
              >
                <Plus className="h-4 w-4" />
                创建提示词
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            <AnimatePresence mode="popLayout">
              {filteredPrompts.map((prompt, index) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  tags={tags}
                  index={index}
                  onEdit={(p) => {
                    setEditingPrompt(p);
                    setIsFormOpen(true);
                  }}
                  onDelete={(p) => setDeletePrompt(p)}
                  onToggleFavorite={handleToggleFavorite}
                  onViewHistory={(p) => setHistoryPrompt(p)}
                  onUse={handleUse}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* 统计信息 */}
        {filteredPrompts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-center"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-sm text-muted-foreground">
              显示 {filteredPrompts.length} 个提示词
              {(filters.search ||
                filters.tags.length > 0 ||
                filters.favorite) && (
                <span className="text-foreground font-medium">
                  / 共 {prompts.length} 个
                </span>
              )}
            </span>
          </motion.div>
        )}
      </div>

      {/* 提示词表单弹窗 */}
      <PromptForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingPrompt(null);
        }}
        onSubmit={handleSubmit}
        prompt={editingPrompt}
        tags={tags}
      />

      {/* 版本历史弹窗 */}
      {historyPrompt && (
        <PromptHistory
          isOpen={!!historyPrompt}
          onClose={() => setHistoryPrompt(null)}
          prompt={historyPrompt}
          onRestore={handleRestoreVersion}
        />
      )}

      {/* 删除确认弹窗 */}
      <ConfirmModal
        isOpen={!!deletePrompt}
        onClose={() => setDeletePrompt(null)}
        onConfirm={handleDelete}
        title="删除提示词"
        description={`确定要删除「${deletePrompt?.title}」吗？此操作不可撤销。`}
        confirmText="删除"
        isDestructive
      />
    </div>
  );
}
