import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Better Self | 找到适合你的健康节奏",
  description: "用几分钟了解身体状态与生活节奏，获得清晰、易懂的个性化健康趋势参考。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth">
      <body style={{ "--font-body": 'Inter, "SF Pro Display", "SF Pro Text"' } as React.CSSProperties}>
        {children}
      </body>
    </html>
  );
}
