import type { NextConfig } from "next";
import { UX_LAB_QUERY_REWRITES } from "./app/lib/dev/community-athlete-lab/previewEntry";

/** Preview/local only. Production builds omit this so `/?uxlab=1` stays the public homepage. */
const uxLabRewrites =
  process.env.VERCEL_ENV === "production"
    ? []
    : UX_LAB_QUERY_REWRITES.map((item) => ({
        source: "/",
        has: [{ type: "query" as const, key: "uxlab", value: item.query }],
        destination: item.destination,
      }));

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hebbkx1anhila5yf.public.blob.vercel-storage.com",
      },
    ],
  },
  async rewrites() {
    return uxLabRewrites;
  },
};

export default nextConfig;