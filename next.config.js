/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ["zod", "clsx"],
  },
};

module.exports = nextConfig;
