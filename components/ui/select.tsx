"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// 选择器选项类型
interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

// 选择器组件属性
interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "请选择",
  disabled = false,
  className,
}: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectRef = React.useRef<HTMLDivElement>(null);

  // 选中的选项
  const selectedOption = options.find((opt) => opt.value === value);

  // 点击外部关闭
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={selectRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-all duration-200"
        )}
      >
        <span className={cn(!selectedOption && "text-muted-foreground")}>
          {selectedOption ? (
            <span className="flex items-center gap-2">
              {selectedOption.icon}
              {selectedOption.label}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-50 mt-1 w-full rounded-lg border border-border bg-card p-1 shadow-lg"
            )}
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm",
                  "hover:bg-accent hover:text-accent-foreground",
                  "transition-colors duration-150",
                  value === option.value && "bg-accent"
                )}
              >
                <span className="flex items-center gap-2">
                  {option.icon}
                  {option.label}
                </span>
                {value === option.value && <Check className="h-4 w-4" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 多选组件属性
interface MultiSelectProps {
  values: string[];
  onChange: (values: string[]) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MultiSelect({
  values,
  onChange,
  options,
  placeholder = "请选择",
  disabled = false,
  className,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectRef = React.useRef<HTMLDivElement>(null);

  // 切换选择
  const toggleOption = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      onChange([...values, value]);
    }
  };

  // 点击外部关闭
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 选中的选项
  const selectedOptions = options.filter((opt) => values.includes(opt.value));

  return (
    <div ref={selectRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex min-h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-all duration-200"
        )}
      >
        <span className="flex flex-wrap gap-1">
          {selectedOptions.length > 0 ? (
            selectedOptions.map((opt) => (
              <span
                key={opt.value}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
              >
                {opt.label}
              </span>
            ))
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-lg"
            )}
          >
            {options.map((option) => {
              const isSelected = values.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleOption(option.value)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm",
                    "hover:bg-accent hover:text-accent-foreground",
                    "transition-colors duration-150",
                    isSelected && "bg-accent"
                  )}
                >
                  <span className="flex items-center gap-2">
                    {option.icon}
                    {option.label}
                  </span>
                  {isSelected && <Check className="h-4 w-4" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
