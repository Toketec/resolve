import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Monorepo root (one level above apps/web) — pin it so Next/Turbopack doesn't
// pick up a stray lockfile elsewhere on the machine.
const workspaceRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const nextConfig: NextConfig = {
  transpilePackages: ["@resolve/shared", "@resolve/ai", "@resolve/db"],
  turbopack: {
    root: workspaceRoot,
  },
};

export default nextConfig;
