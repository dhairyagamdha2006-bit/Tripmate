/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    },
    serverComponentsExternalPackages: ['@prisma/client', 'prisma', 'stripe', 'bcryptjs']
  }
};

export default nextConfig;
