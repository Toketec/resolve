export * from "./markets";
export * from "./agents";
export * from "./positions";

export const CATEGORIES: { id: string; label: string; tint: string }[] = [
  { id: "all", label: "All", tint: "var(--fg)" },
  { id: "crypto", label: "Crypto", tint: "var(--signal)" },
  { id: "sports", label: "Sports", tint: "var(--sub)" },
  { id: "politics", label: "Politics", tint: "var(--counter)" },
  { id: "weather", label: "Weather", tint: "var(--ice)" },
  { id: "tech", label: "Tech", tint: "var(--ice-2)" },
  { id: "finance", label: "Finance", tint: "var(--signal-deep)" },
  { id: "entertainment", label: "Entertainment", tint: "var(--paper-2)" },
];
