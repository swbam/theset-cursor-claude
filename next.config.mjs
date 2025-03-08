/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
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
      };
    }
    return config;
  },
};

export default nextConfig; 