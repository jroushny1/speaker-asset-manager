import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb', // Allow up to 500MB uploads to match UI limit
      allowedOrigins: undefined, // Allow all origins for server actions
    },
  },
  // Increase timeout for uploads
  async headers() {
    return [
      {
        source: '/api/upload/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store',
          },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-8aee79074ca14668b3e297fd62b08a3a.r2.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
