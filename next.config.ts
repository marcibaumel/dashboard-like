import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    serverExternalPackages: ["better-sqlite3", "typeorm"],
    compiler: { styledComponents: true },
};

export default nextConfig;
