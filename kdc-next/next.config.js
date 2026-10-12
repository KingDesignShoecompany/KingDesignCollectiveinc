/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/KingDesignCollectiveinc',
  assetPrefix: '/KingDesignCollectiveinc',
  images: { unoptimized: true },
  trailingSlash: true,
  generateBuildId: async () => 'kdc-build',
};

module.exports = nextConfig;
