import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Next.js caps a Server Action's request body at 1MB by default. Document
    // uploads (client/lead/partner — see uploadDocument in
    // lib/actions/documents.ts) go through a Server Action and are allowed up
    // to MAX_DOCUMENT_SIZE_BYTES (25MB, see lib/documents.ts) — this raises
    // the framework limit to match, with headroom for multipart/form-data's
    // own boundary/header overhead.
    serverActions: {
      bodySizeLimit: "26mb",
    },
  },
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
