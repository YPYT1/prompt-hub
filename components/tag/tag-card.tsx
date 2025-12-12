"use client";

import { motion } from "motion/react";
import {
  Tag as TagIcon,
  Edit,
  Trash2,
  ChevronRight,
  GripVertical,
} from "lucide-react";
import { Tag } from "@/lib/types";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface TagCardProps {
  tag: Tag;
  childTags?: Tag[];
  index: number;
  onEdit: (tag: Tag) => void;
  onDelete: (tag: Tag) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function TagCard({
  tag,
  childTags = [],
  index,
  onEdit,
  onDelete,
  isExpanded = false,
  onToggleExpand,
}: TagCardProps) {
  const hasChildren = childTags.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group"
    >
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border border-border bg-card p-4",
          "hover:border-primary/30 hover:shadow-md transition-all duration-200"
        )}
      >
        {/* 拖拽手柄 */}
        <div className="cursor-grab text-muted-foreground hover:text-foreground">
          <GripVertical className="h-4 w-4" />
        </div>

        {/* 展开/收起按钮 */}
        {hasChildren && (
          <button
            onClick={onToggleExpand}
            className="p-1 hover:bg-accent rounded transition-colors"
          >
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isExpanded && "rotate-90"
              )}
            />
          </button>
        )}

        {/* 颜色标识 */}
        <div
          className="w-4 h-4 rounded-full shrink-0"
          style={{ backgroundColor: tag.color }}
        />

        {/* 标签信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-foreground truncate">{tag.name}</h3>
            {tag.group && (
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                {tag.group}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            使用 {tag.usageCount} 次
            {hasChildren && ` · ${childTags.length} 个子标签`}
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(tag)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
            onClick={() => onDelete(tag)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 子标签 */}
      {hasChildren && isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="ml-8 mt-2 space-y-2 border-l-2 border-border pl-4"
        >
          {childTags.map((childTag, childIndex) => (
            <TagCard
              key={childTag.id}
              tag={childTag}
              index={childIndex}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

// 空状态组件
export function TagEmptyState() {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
        <TagIcon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">暂无标签</h3>
      <p className="text-muted-foreground">点击上方按钮创建第一个标签</p>
    </div>
  );
}
