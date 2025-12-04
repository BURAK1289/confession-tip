import { ReactNode } from "react";
import { ConfessionCategory } from "@/types";
import { cn } from "@/lib/utils";

export interface BadgeProps {
  category: ConfessionCategory;
  children?: ReactNode;
  className?: string;
}

const categoryColors: Record<ConfessionCategory, string> = {
  funny: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  deep: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  relationship: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  work: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  random: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  wholesome: "bg-green-500/15 text-green-400 border-green-500/30",
  regret: "bg-red-500/15 text-red-400 border-red-500/30",
};

export function Badge({ category, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide border backdrop-blur-sm",
        categoryColors[category],
        className
      )}
    >
      {children || category}
    </span>
  );
}
