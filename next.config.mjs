/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // keep the Mongo driver (and the dev-only local Mongo) out of the webpack bundle
  experimental: { serverComponentsExternalPackages: ["mongodb", "mongodb-memory-server"] },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      // never cache admin or API responses in shared caches
      { source: "/admin/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};
export default nextConfig;
