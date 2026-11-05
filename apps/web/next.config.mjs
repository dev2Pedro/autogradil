/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  agentRules: false,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
