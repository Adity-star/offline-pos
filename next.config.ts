import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactCompiler: true,

  productionBrowserSourceMaps: false,

  output: "standalone",

  serverExternalPackages: [
    "better-sqlite3",
    "@prisma/adapter-better-sqlite3",
  ],

  turbopack: {
    root: __dirname,
  },

  outputFileTracingRoot: __dirname,
};

export default nextConfig;