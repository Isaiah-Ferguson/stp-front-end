import type { NextConfig } from "next";

// All browser API calls go to /backend/* on THIS origin and are proxied to the real
// API (#15). That makes the backend's httpOnly auth cookies first-party — SameSite=Lax
// works and Safari's third-party-cookie blocking never applies.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5208";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${API_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
