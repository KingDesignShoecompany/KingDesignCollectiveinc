/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  distDir: 'out',
  basePath: '',
  assetPrefix: '',
};

module.exports = nextConfig;
