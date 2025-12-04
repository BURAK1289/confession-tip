import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    
    // Fix for localStorage not available on server
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        localStorage: false,
      };
    }
    
    // Fix for @react-native-async-storage/async-storage
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": false,
    };
    
    return config;
  },

  // Performance optimizations
  poweredByHeader: false,

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ["@coinbase/onchainkit", "@tanstack/react-query"],
  },
};

export default nextConfig;
