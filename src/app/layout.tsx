import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Better Self Lab | 健康测评",
  description: "支持进度恢复、服务端评估和订阅解锁的健康测评 Funnel。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
