/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["lh3.googleusercontent.com"], // Allow Google profile photos for oauth login display
  },
  eslint: {
    ignoreDuringBuilds: true, // Speeds up builds
  },
  typescript: {
    ignoreBuildErrors: true, // Prevent TS compiler issues from halting production deploy builds
  }
};

export default nextConfig;
