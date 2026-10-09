/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Monorepo runs ESLint via root pnpm lint / pnpm -r lint
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
