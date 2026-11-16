import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip type-checking during production build on memory-constrained build containers
  typescript: {
    ignoreBuildErrors: true,
  },
  // Externalize heavy server-side dependencies from client bundles
  serverExternalPackages: ["@react-pdf/renderer", "postgres"],
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "date-fns",
      "@xyflow/react",
      "framer-motion",
    ],
    // Limit worker concurrency to prevent memory spikes on multi-core Vercel containers
    cpus: 1,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*",
      },
      {
        protocol: "http",
        hostname: "*",
      },
    ],
  },
};

export default nextConfig;
