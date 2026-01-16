import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Noto_Serif_SC } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const notoSerifSC = Noto_Serif_SC({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Om Card | 心灵投射卡",
  description: "一款遵循学术规范的数字化心理投射工具，基于 OH Cards 原理",
  keywords: ["OH Cards", "心理投射", "潜意识", "冥想", "自我探索"],
  authors: [{ name: "Om Card Team" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Om Card",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    title: "Om Card | 心灵投射卡",
    description: "遇见内心的声音",
    siteName: "Om Card",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f0f23",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${cormorant.variable} ${notoSerifSC.variable} antialiased`}
      >
        {children}
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: '#1a1a2e',
              border: '1px solid rgba(201, 169, 89, 0.3)',
              color: '#edf2f4',
            },
          }}
        />
      </body>
    </html>
  );
}
