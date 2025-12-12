"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Toast 类型
type ToastType = "success" | "error" | "info" | "warning";

// Toast 数据
interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

// Toast 上下文
interface ToastContextType {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(
  undefined
);

// Toast Provider
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback(
    (type: ToastType, message: string, duration = 3000) => {
      const id = Math.random().toString(36).substring(7);
      setToasts((prev) => [...prev, { id, type, message, duration }]);

      // 自动移除
      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }
    },
    []
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

// Hook
export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast 必须在 ToastProvider 内使用");
  }

  return {
    success: (message: string, duration?: number) =>
      context.addToast("success", message, duration),
    error: (message: string, duration?: number) =>
      context.addToast("error", message, duration),
    info: (message: string, duration?: number) =>
      context.addToast("info", message, duration),
    warning: (message: string, duration?: number) =>
      context.addToast("warning", message, duration),
    dismiss: context.removeToast,
  };
}

// Toast 容器
function ToastContainer() {
  const context = React.useContext(ToastContext);
  if (!context) return null;

  const { toasts, removeToast } = context;

  return (
    <div className="fixed bottom-4 right-4 z-100 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Toast 图标
const toastIcons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-green-500" />,
  error: <XCircle className="h-5 w-5 text-red-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
};

// Toast 样式
const toastStyles: Record<ToastType, string> = {
  success: "border-green-500/20 bg-green-500/10",
  error: "border-red-500/20 bg-red-500/10",
  info: "border-blue-500/20 bg-blue-500/10",
  warning: "border-yellow-500/20 bg-yellow-500/10",
};

// Toast 项
function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm",
        "min-w-[300px] max-w-[400px]",
        toastStyles[toast.type]
      )}
    >
      {toastIcons[toast.type]}
      <p className="flex-1 text-sm text-foreground">{toast.message}</p>
      <button
        onClick={onClose}
        className="rounded-full p-1 hover:bg-foreground/10 transition-colors"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
    </motion.div>
  );
}
