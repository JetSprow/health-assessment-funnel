import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Better Self · 找到属于你的健康节奏",
  description:
    "回答 7 个简单问题，用大约 3 分钟看清身体状态与生活节奏，获得一份清晰、易懂、真正属于你的个性化健康趋势参考。",
};

export const viewport: Viewport = {
  themeColor: "#071c16",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth">
      <body
        style={
          {
            "--font-body":
              '"SF Pro Display", "SF Pro Text", Inter, system-ui, -apple-system, "Segoe UI", Roboto',
          } as React.CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );
}
