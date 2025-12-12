"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { User, Mail, Lock, Eye, EyeOff, Check, X, Loader2 } from "lucide-react";
import { Button, Input, useToast } from "@/components/ui";
import { cn } from "@/lib/utils";

interface ValidationState {
  username: { valid: boolean; message: string };
  email: { valid: boolean; message: string };
  password: { valid: boolean; message: string };
  confirmPassword: { valid: boolean; message: string };
}

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validation, setValidation] = useState<ValidationState>({
    username: { valid: false, message: "" },
    email: { valid: false, message: "" },
    password: { valid: false, message: "" },
    confirmPassword: { valid: false, message: "" },
  });

  // 实时验证
  useEffect(() => {
    const newValidation: ValidationState = {
      username: { valid: false, message: "" },
      email: { valid: false, message: "" },
      password: { valid: false, message: "" },
      confirmPassword: { valid: false, message: "" },
    };

    // 用户名验证
    if (formData.username) {
      if (formData.username.length >= 4) {
        newValidation.username = { valid: true, message: "用户名可用" };
      } else {
        newValidation.username = { valid: false, message: "用户名至少4个字符" };
      }
    }

    // 邮箱验证
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(formData.email)) {
        newValidation.email = { valid: true, message: "邮箱格式正确" };
      } else {
        newValidation.email = { valid: false, message: "请输入有效的邮箱地址" };
      }
    }

    // 密码验证
    if (formData.password) {
      const hasLetter = /[A-Za-z]/.test(formData.password);
      const hasNumber = /\d/.test(formData.password);
      const hasLength = formData.password.length >= 6;

      if (hasLength && hasLetter && hasNumber) {
        newValidation.password = { valid: true, message: "密码强度足够" };
      } else {
        const missing = [];
        if (!hasLength) missing.push("至少6位");
        if (!hasLetter) missing.push("包含字母");
        if (!hasNumber) missing.push("包含数字");
        newValidation.password = { valid: false, message: missing.join("、") };
      }
    }

    // 确认密码验证
    if (formData.confirmPassword) {
      if (formData.confirmPassword === formData.password) {
        newValidation.confirmPassword = { valid: true, message: "密码匹配" };
      } else {
        newValidation.confirmPassword = {
          valid: false,
          message: "两次密码不一致",
        };
      }
    }

    setValidation(newValidation);
  }, [formData]);

  const isFormValid =
    validation.username.valid &&
    validation.email.valid &&
    validation.password.valid &&
    validation.confirmPassword.valid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const result = (await response.json()) as {
        success: boolean;
        error?: string;
      };

      if (result.success) {
        toast.success("注册成功！正在跳转到登录页...");
        setTimeout(() => router.push("/login"), 1500);
      } else {
        toast.error(result.error || "注册失败");
      }
    } catch {
      toast.error("网络错误，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  const ValidationIndicator = ({
    state,
  }: {
    state: { valid: boolean; message: string };
  }) => {
    if (!state.message) return null;
    return (
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex items-center gap-1.5 mt-1.5 text-xs",
          state.valid ? "text-green-500" : "text-red-500"
        )}
      >
        {state.valid ? (
          <Check className="h-3 w-3" />
        ) : (
          <X className="h-3 w-3" />
        )}
        {state.message}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* 背景动效 */}
      <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-background to-secondary/5" />
      <div className="absolute inset-0 grid-bg opacity-30" />

      {/* 浮动装饰 */}
      <motion.div
        animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 left-20 w-32 h-32 rounded-full bg-linear-to-br from-primary/20 to-secondary/20 blur-3xl"
      />
      <motion.div
        animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 right-20 w-40 h-40 rounded-full bg-linear-to-br from-secondary/20 to-primary/20 blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        <div className="glass rounded-2xl p-8 shadow-2xl border border-border/50">
          {/* 标题 */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-8"
          >
            <h1 className="text-2xl font-bold text-foreground">创建账户</h1>
            <p className="text-muted-foreground mt-2">
              加入 Prompt Hub，开始管理你的提示词
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 用户名 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <label className="block text-sm font-medium text-foreground mb-1.5">
                用户名
              </label>
              <Input
                placeholder="至少4个字符"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                icon={<User className="h-4 w-4" />}
              />
              <ValidationIndicator state={validation.username} />
            </motion.div>

            {/* 邮箱 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-sm font-medium text-foreground mb-1.5">
                邮箱
              </label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                icon={<Mail className="h-4 w-4" />}
              />
              <ValidationIndicator state={validation.email} />
            </motion.div>

            {/* 密码 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
            >
              <label className="block text-sm font-medium text-foreground mb-1.5">
                密码
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="至少6位，包含字母和数字"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  icon={<Lock className="h-4 w-4" />}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <ValidationIndicator state={validation.password} />
            </motion.div>

            {/* 确认密码 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-medium text-foreground mb-1.5">
                确认密码
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="再次输入密码"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  icon={<Lock className="h-4 w-4" />}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <ValidationIndicator state={validation.confirmPassword} />
            </motion.div>

            {/* 提交按钮 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Button
                type="submit"
                className="w-full gap-2"
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    注册中...
                  </>
                ) : (
                  "创建账户"
                )}
              </Button>
            </motion.div>
          </form>

          {/* 登录链接 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-center text-sm text-muted-foreground"
          >
            已有账户？{" "}
            <Link
              href="/login"
              className="text-primary hover:underline font-medium"
            >
              立即登录
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
