/** @type {import('next').NextConfig} */
const nextConfig = {}

// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: true,
});
  
module.exports = withBundleAnalyzer(nextConfig);

