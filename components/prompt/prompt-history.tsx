"use client";

import { motion } from "motion/react";
import { History, Copy } from "lucide-react";
import { Prompt, PromptVersion } from "@/lib/types";
import { Modal, Button, useToast } from "@/components/ui";
import { formatDate, copyToClipboard } from "@/lib/utils";

interface PromptHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: Prompt | null;
  onRestore: (prompt: Prompt, version: PromptVersion) => void;
}

export function PromptHistory({
  isOpen,
  onClose,
  prompt,
  onRestore,
}: PromptHistoryProps) {
  const toast = useToast();

  if (!prompt) return null;

  // 复制版本内容
  const handleCopy = async (content: string) => {
    const success = await copyToClipboard(content);
    if (success) {
      toast.success("已复制到剪贴板");
    } else {
      toast.error("复制失败");
    }
  };

  // 恢复版本
  const handleRestore = (version: PromptVersion) => {
    onRestore(prompt, version);
    toast.success("已恢复到选中版本");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="历史版本"
      description={`${prompt.title} 的所有历史版本`}
      size="lg"
    >
      <div className="space-y-4">
        {prompt.versions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>暂无历史版本</p>
          </div>
        ) : (
          prompt.versions.map((version, index) => (
            <motion.div
              key={version.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-lg border border-border p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    版本 {prompt.versions.length - index}
                  </span>
                  {index === 0 && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      当前版本
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDate(version.createdAt)}
                </span>
              </div>

              <div className="rounded-md bg-muted/50 p-3 mb-3">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
                  {version.content}
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(version.content)}
                >
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  复制
                </Button>
                {index !== 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(version)}
                  >
                    恢复此版本
                  </Button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </Modal>
  );
}
