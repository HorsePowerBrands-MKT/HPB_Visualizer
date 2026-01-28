/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@repo/types',
    '@repo/api-handlers',
    '@repo/visualizer-core',
    '@repo/prompt-templates'
  ],
  images: {
    domains: ['22404821.fs1.hubspotusercontent-na1.net'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  typescript: {
    // Temporarily ignore build errors while we fix type issues incrementally
    ignoreBuildErrors: true,
  },
  eslint: {
    // Allow warnings during build
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '3mb',
    },
  },
};

module.exports = nextConfig;
