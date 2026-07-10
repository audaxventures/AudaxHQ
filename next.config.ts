import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/faq",
        destination: "/about#faq",
        permanent: true,
      },
      {
        // Pricing is hidden until we're ready to charge — not a permanent
        // move, so this stays a temporary redirect (remove once /pricing
        // is unhidden).
        source: "/pricing",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
