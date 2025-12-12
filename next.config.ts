import type { NextConfig } from "next";

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  // 启用实验性功能
  experimental: {
    // 启用服务器操作
  },
};

export default nextConfig;
