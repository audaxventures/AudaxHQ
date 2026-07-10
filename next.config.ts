import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/faq",
        destination: "/about#faq",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
