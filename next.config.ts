import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactCompiler: true,

  productionBrowserSourceMaps: false,

  output: "standalone",

  serverExternalPackages: [
    "better-sqlite3",
    "@prisma/adapter-better-sqlite3",
    "@prisma/client",
    "prisma",
  ],

  turbopack: {
    root: __dirname,
  },

  outputFileTracingRoot: __dirname,
};

export default nextConfig;