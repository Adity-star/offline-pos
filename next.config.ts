import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  productionBrowserSourceMaps: false,
  output: 'standalone',
  // swcMinify: true,
  serverExternalPackages: ['better-sqlite3', '@prisma/adapter-better-sqlite3'],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
