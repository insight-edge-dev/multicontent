"use client";

import type { Category } from "@/lib/categoryTypes";
import { SUPPORTED_CATEGORIES } from "@/lib/categoryTypes";

type CategoryTabsProps<T extends string = Category> = {
  categories?: readonly T[];
  activeCategory: T;
  onCategoryChange: (category: T) => void;
  disabled?: boolean;
  className?: string;
};

export function CategoryTabs<T extends string = Category>({
  categories,
  activeCategory,
  onCategoryChange,
  disabled = false,
  className = "",
}: CategoryTabsProps<T>) {
  const tabCategories = categories ?? (SUPPORTED_CATEGORIES as unknown as readonly T[]);

  return (
    <div className={`-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 ${className}`}>
      <div className="flex min-w-max gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-1 sm:inline-flex">
        {tabCategories.map((category) => {
          const isActive = category === activeCategory;

          return (
            <button
              key={category}
              type="button"
              aria-pressed={isActive}
              disabled={disabled && !isActive}
              onClick={() => onCategoryChange(category)}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                isActive
                  ? "bg-cyan-300 text-ink-950 shadow-glow"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
}
