import type { Metadata } from "next";
import "./globals.css";

const isGithubPages = process.env.GITHUB_PAGES === "true";

export const metadata: Metadata = {
  title: "Timewall 5",
  description: "A color-first time wall for low-friction daily reflection.",
  applicationName: "Timewall",
  appleWebApp: {
    capable: true,
    title: "Timewall",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: isGithubPages ? "/timewall_5/manifest.webmanifest" : "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
