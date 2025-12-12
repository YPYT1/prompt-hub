"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

// 弹窗组件属性
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

// 尺寸样式映射
const sizeStyles: Record<string, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[90vw]",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  size = "md",
}: ModalProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // 按 Escape 键关闭弹窗
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* 弹窗内容 */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={cn(
                "relative w-full rounded-xl bg-card p-6 shadow-2xl",
                "border border-border",
                sizeStyles[size],
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 关闭按钮 */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4 h-8 w-8 rounded-full"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>

              {/* 标题和描述 */}
              {(title || description) && (
                <div className="mb-6 pr-8">
                  {title && (
                    <h2 className="text-xl font-semibold text-foreground">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {description}
                    </p>
                  )}
                </div>
              )}

              {/* 内容区域 */}
              <div className="max-h-[70vh] overflow-y-auto">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

// 确认弹窗组件
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "确认",
  cancelText = "取消",
  isDestructive = false,
  isLoading = false,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        )}
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={isDestructive ? "destructive" : "default"}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
