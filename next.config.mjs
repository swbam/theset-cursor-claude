/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: process.env.SKIP_TYPE_CHECK === "true",
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'fs', 'net', 'tls', etc. on the client
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        perf_hooks: false,
        crypto: false,
        os: false,
        "node:fs": false,
        "node:net": false,
        "node:tls": false,
        "node:crypto": false,
        "node:process": false,
        "node:path": false,
        "node:os": false,
        "node:stream": false,
        "node:util": false,
        "node:url": false,
        "node:http": false,
        "node:https": false,
        "node:zlib": false,
        "node:events": false,
        "node:buffer": false,
        "node:string_decoder": false,
        "node:querystring": false,
        "node:punycode": false,
        "node:assert": false,
      };
    }
    return config;
  },
  experimental: {},
  serverExternalPackages: [
    "postgres",
    "pg",
    "@neondatabase/serverless",
    "drizzle-orm",
  ],
};

export default nextConfig; 