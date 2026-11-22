import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    serverExternalPackages: ["better-sqlite3", "typeorm"],
    compiler: { styledComponents: true },
    distDir: process.env.KANBAN_NEXT_DIST_DIR || ".next",
    typescript: { tsconfigPath: process.env.KANBAN_NEXT_TSCONFIG || "tsconfig.json" },
};

export default nextConfig;
