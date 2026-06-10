import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  ...(isGithubPages
    ? {
        basePath: "/timewall_5",
        assetPrefix: "/timewall_5/",
      }
    : {}),
};

export default nextConfig;
