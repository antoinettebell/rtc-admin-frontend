import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  // distDir: 'build',
  trailingSlash: true,
  output: "export",
};

export default nextConfig;
