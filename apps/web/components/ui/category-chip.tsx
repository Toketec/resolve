import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types";

const TINTS: Record<Category, { bg: string; ink: "light" | "dark" }> = {
  crypto:        { bg: "#FFB800", ink: "dark"  }, // gold
  sports:        { bg: "#00B14F", ink: "dark"  }, // pitch
  politics:      { bg: "#FF2D6F", ink: "light" }, // magenta
  weather:       { bg: "#00C2D1", ink: "dark"  }, // cyan
  tech:          { bg: "#5B1FFF", ink: "light" }, // indigo
  finance:       { bg: "#2937F0", ink: "light" }, // royal
  entertainment: { bg: "#9D4EDD", ink: "light" }, // violet
};

export function CategoryChip({
  category,
  className,
  size = "sm",
}: {
  category: Category;
  className?: string;
  size?: "sm" | "md";
}) {
  const t = TINTS[category];
  const isLight = t.ink === "light";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-2 border-ink font-bold uppercase tracking-[0.14em]",
        size === "sm" && "px-2.5 py-0.5 text-[10px]",
        size === "md" && "px-3 py-1 text-[11px]",
        isLight ? "text-canvas" : "text-ink",
        className,
      )}
      style={{ backgroundColor: t.bg }}
    >
      {category}
    </span>
  );
}
