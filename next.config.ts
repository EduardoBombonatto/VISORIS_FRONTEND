import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactCompiler: true,
  devIndicators: false,
  async redirects() {
    return [
      {
        source: '/dashboard/templates',
        destination: '/templates',
        permanent: true,
      },
      {
        source: '/dashboard/templates/:path*',
        destination: '/templates/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
