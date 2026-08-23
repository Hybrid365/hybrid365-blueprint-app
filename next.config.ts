import type { NextConfig } from "next";

/** Preview/local only. Production builds omit this so `/?uxlab=1` stays the public homepage. */
const uxLabRewrites =
  process.env.VERCEL_ENV === "production"
    ? []
    : [
        { query: "1", destination: "/dev/community-athlete" },
        { query: "programme", destination: "/dev/community-athlete/programme" },
        { query: "progress", destination: "/dev/community-athlete/progress" },
        { query: "habits", destination: "/dev/community-athlete/habits" },
        { query: "check-in", destination: "/dev/community-athlete/check-in" },
        { query: "testing", destination: "/dev/community-athlete/testing" },
      ].map((item) => ({
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