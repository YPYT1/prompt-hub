"use client";

import { motion } from "motion/react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-full",
        "bg-accent hover:bg-accent/80",
        "transition-colors duration-200",
        className
      )}
      aria-label={theme === "dark" ? "切换到浅色主题" : "切换到深色主题"}
    >
      <motion.div
        initial={false}
        animate={{
          rotate: theme === "dark" ? 0 : 180,
          scale: theme === "dark" ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="absolute"
      >
        <Moon className="h-5 w-5 text-primary" />
      </motion.div>

      <motion.div
        initial={false}
        animate={{
          rotate: theme === "light" ? 0 : -180,
          scale: theme === "light" ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="absolute"
      >
        <Sun className="h-5 w-5 text-primary" />
      </motion.div>
    </motion.button>
  );
}
