import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@resolve/shared", "@resolve/ai"],
};

export default nextConfig;
