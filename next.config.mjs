const apiBaseUrl = (
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4100/api/v1"
).replace(/\/$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets a verification build write to a separate dir while `next dev` holds .next (NEXT_DIST_DIR=.next-verify npx next build).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/images/:filename",
          destination: `${apiBaseUrl}/media/images/:filename`,
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
