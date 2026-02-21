import type { NextConfig } from "next";

const isMobile = process.env.BUILD_TARGET === "mobile";

const nextConfig: NextConfig = {
  // Static export for Capacitor mobile builds
  ...(isMobile && { output: "export" }),
};

export default nextConfig;
