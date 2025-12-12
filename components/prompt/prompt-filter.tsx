"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Star,
  X,
  Clock,
  Type,
  TrendingUp,
} from "lucide-react";
import { Tag, FilterOptions, SortOption, SortOrder } from "@/lib/types";
import { Input, Button, Select } from "@/components/ui";
import { cn } from "@/lib/utils";

interface PromptFilterProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  tags: Tag[];
}

export function PromptFilter({
  filters,
  onFilterChange,
  tags,
}: PromptFilterProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 排序选项
  const sortOptions = [
    { value: "time", label: "更新时间", icon: <Clock className="h-4 w-4" /> },
    { value: "name", label: "名称", icon: <Type className="h-4 w-4" /> },
    {
      value: "usage",
      label: "使用次数",
      icon: <TrendingUp className="h-4 w-4" />,
    },
  ];

  // 排序顺序
  const orderOptions = [
    { value: "desc", label: "降序" },
    { value: "asc", label: "升序" },
  ];

  // 更新搜索
  const handleSearchChange = (search: string) => {
    onFilterChange({ ...filters, search });
  };

  // 切换标签
  const toggleTag = (tagId: string) => {
    const newTags = filters.tags.includes(tagId)
      ? filters.tags.filter((t) => t !== tagId)
      : [...filters.tags, tagId];
    onFilterChange({ ...filters, tags: newTags });
  };

  // 切换收藏筛选
  const toggleFavorite = () => {
    const newFavorite = filters.favorite === true ? null : true;
    onFilterChange({ ...filters, favorite: newFavorite });
  };

  // 重置筛选
  const resetFilters = () => {
    onFilterChange({
      search: "",
      tags: [],
      favorite: null,
      sortBy: "time",
      sortOrder: "desc",
    });
  };

  // 检查是否有激活的筛选
  const hasActiveFilters =
    filters.search ||
    filters.tags.length > 0 ||
    filters.favorite !== null ||
    filters.sortBy !== "time" ||
    filters.sortOrder !== "desc";

  return (
    <div className="space-y-4">
      {/* 搜索和快捷操作 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="搜索提示词..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={filters.favorite === true ? "default" : "outline"}
            onClick={toggleFavorite}
            className="gap-2"
          >
            <Star
              className={cn("h-4 w-4", filters.favorite && "fill-current")}
            />
            <span className="hidden sm:inline">收藏</span>
          </Button>

          <Button
            variant={showAdvanced ? "secondary" : "outline"}
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">筛选</span>
          </Button>

          {hasActiveFilters && (
            <Button variant="ghost" onClick={resetFilters} className="gap-2">
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">重置</span>
            </Button>
          )}
        </div>
      </div>

      {/* 高级筛选 */}
      {showAdvanced && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="rounded-lg border border-border bg-card p-4 space-y-4"
        >
          {/* 排序 */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-1.5">
                排序方式
              </label>
              <Select
                value={filters.sortBy}
                onChange={(value) =>
                  onFilterChange({ ...filters, sortBy: value as SortOption })
                }
                options={sortOptions}
              />
            </div>

            <div className="w-full sm:w-32">
              <label className="block text-sm font-medium text-foreground mb-1.5">
                排序顺序
              </label>
              <Select
                value={filters.sortOrder}
                onChange={(value) =>
                  onFilterChange({ ...filters, sortOrder: value as SortOrder })
                }
                options={orderOptions}
              />
            </div>
          </div>

          {/* 标签筛选 */}
          {tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                按标签筛选
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const isSelected = filters.tags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all",
                        isSelected
                          ? "ring-2 ring-offset-2 ring-offset-background"
                          : "opacity-70 hover:opacity-100"
                      )}
                      style={{
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                        ...(isSelected && { ringColor: tag.color }),
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* 当前筛选状态 */}
      {(filters.tags.length > 0 || filters.search) && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>当前筛选:</span>
          {filters.search && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5">
              搜索: {filters.search}
              <button
                onClick={() => onFilterChange({ ...filters, search: "" })}
                className="ml-1 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.tags.map((tagId) => {
            const tag = tags.find((t) => t.id === tagId);
            if (!tag) return null;
            return (
              <span
                key={tagId}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
                style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
              >
                {tag.name}
                <button
                  onClick={() => toggleTag(tagId)}
                  className="ml-1 hover:opacity-70"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
