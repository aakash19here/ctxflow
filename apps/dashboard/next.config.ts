import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui"],
  serverExternalPackages: ["@shikijs/transformers", "shiki"],
};

export default nextConfig;
