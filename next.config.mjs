const apiBaseUrl = (
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4100/api/v1"
).replace(/\/$/, "");

/** @type {import('next').NextConfig} */
// Files in /public keep their names (no content hash), so cache them for a day and let browsers and the CDN
// serve a stale copy for a week while they refresh in the background. /images is cached by the API's media route.
const staticCache = [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }];

const nextConfig = {
  poweredByHeader: false,
  cacheComponents: true,
  async headers() {
    return ["/css/:path*", "/js/:path*", "/fonts/:path*", "/flags/:path*"].map((source) => ({ source, headers: staticCache }));
  },
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
