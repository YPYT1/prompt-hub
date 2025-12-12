"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Layers, Tag, FileText, Menu, X } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme";
import { cn } from "@/lib/utils";

// 导航项
const navItems = [
  { href: "/", label: "提示词", icon: FileText },
  { href: "/square", label: "广场", icon: Layers },
  { href: "/tags", label: "标签管理", icon: Tag },
];

export function Header() {
  const pathname = usePathname();

  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary shadow-lg">
              <Layers className="h-5 w-5 text-white" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary to-secondary opacity-50 blur-lg" />
            </div>
          </motion.div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground">
              Prompt Hub
            </span>
            <span className="text-xs text-muted-foreground -mt-0.5">
              提示词管理中心
            </span>
          </div>
        </Link>

        {/* 桌面导航 */}
        <nav className="hidden md:flex items-center gap-1 bg-muted/50 rounded-full p-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-primary shadow-md"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* 右侧操作区 */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* 移动端菜单按钮 */}
          <button
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl hover:bg-accent transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* 移动端菜单 */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden border-t border-border bg-background p-4"
        >
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </motion.div>
      )}
    </header>
  );
}
