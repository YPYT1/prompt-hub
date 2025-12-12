"use client";

import { motion } from "motion/react";
import {
  Copy,
  Star,
  Edit,
  Trash2,
  MoreVertical,
  History,
  Clock,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Prompt, Tag } from "@/lib/types";
import {
  cn,
  formatRelativeTime,
  copyToClipboard,
  truncateText,
} from "@/lib/utils";
import { Button, useToast } from "@/components/ui";

interface PromptCardProps {
  prompt: Prompt;
  tags: Tag[];
  index: number;
  onEdit: (prompt: Prompt) => void;
  onDelete: (prompt: Prompt) => void;
  onToggleFavorite: (prompt: Prompt) => void;
  onViewHistory: (prompt: Prompt) => void;
  onUse: (prompt: Prompt) => void;
}

export function PromptCard({
  prompt,
  tags,
  index,
  onEdit,
  onDelete,
  onToggleFavorite,
  onViewHistory,
  onUse,
}: PromptCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const toast = useToast();

  // 获取提示词的标签对象
  const promptTags = tags.filter((tag) => prompt.tags.includes(tag.id));

  // 复制提示词
  const handleCopy = async () => {
    setIsCopying(true);
    const success = await copyToClipboard(prompt.content);
    if (success) {
      toast.success("已复制到剪贴板");
      onUse(prompt);
    } else {
      toast.error("复制失败");
    }
    setTimeout(() => setIsCopying(false), 1000);
  };

  // 切换收藏
  const handleToggleFavorite = () => {
    onToggleFavorite(prompt);
    toast.success(prompt.isFavorite ? "已取消收藏" : "已添加到收藏");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group relative"
    >
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "relative overflow-hidden rounded-2xl border border-border bg-card",
          "shadow-sm hover:shadow-xl hover:shadow-primary/5",
          "transition-all duration-300"
        )}
      >
        {/* 渐变背景装饰 */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* 顶部渐变线 */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary via-secondary to-primary opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* 卡片内容 */}
        <div className="relative p-5">
          {/* 头部 */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-foreground truncate pr-2">
                {prompt.title}
              </h3>
              {prompt.description && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                  {prompt.description}
                </p>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-0.5">
              <motion.button
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                  prompt.isFavorite
                    ? "text-amber-500 hover:bg-amber-500/10"
                    : "text-muted-foreground hover:text-amber-500 hover:bg-accent"
                )}
                onClick={handleToggleFavorite}
              >
                <Star
                  className={cn("h-4 w-4", prompt.isFavorite && "fill-current")}
                />
              </motion.button>

              {/* 更多操作菜单 */}
              <div className="relative">
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {isMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="absolute right-0 top-full mt-1 z-20 w-36 rounded-xl border border-border bg-card p-1.5 shadow-xl"
                    >
                      <button
                        onClick={() => {
                          onEdit(prompt);
                          setIsMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-accent transition-colors"
                      >
                        <Edit className="h-4 w-4 text-muted-foreground" />
                        编辑
                      </button>
                      <button
                        onClick={() => {
                          onViewHistory(prompt);
                          setIsMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-accent transition-colors"
                      >
                        <History className="h-4 w-4 text-muted-foreground" />
                        历史版本
                      </button>
                      <div className="my-1 border-t border-border" />
                      <button
                        onClick={() => {
                          onDelete(prompt);
                          setIsMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        删除
                      </button>
                    </motion.div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 内容预览 */}
          <div className="mb-4 rounded-xl bg-muted/30 p-3 border border-border/50">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3 leading-relaxed">
              {truncateText(prompt.content, 200)}
            </p>
          </div>

          {/* 标签 */}
          {promptTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {promptTags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium border"
                  style={{
                    backgroundColor: `${tag.color}15`,
                    borderColor: `${tag.color}30`,
                    color: tag.color,
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* 底部信息 */}
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                <Zap className="h-3 w-3 text-primary" />
                {prompt.usageCount} 次
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(prompt.updatedAt)}
              </span>
            </div>

            <Button
              variant="default"
              size="sm"
              className={cn(
                "gap-1.5 rounded-lg shadow-md shadow-primary/20",
                isCopying && "bg-green-500 hover:bg-green-500"
              )}
              onClick={handleCopy}
            >
              <Copy
                className={cn("h-3.5 w-3.5", isCopying && "animate-pulse")}
              />
              {isCopying ? "已复制" : "复制"}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
