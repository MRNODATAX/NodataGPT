import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // Izinkan host preview (sandbox/e2b) mengakses dev server
  allowedDevOrigins: ["*.e2b.app", "*.arena.ai", "localhost", "127.0.0.1"],
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
};

export default nextConfig;
