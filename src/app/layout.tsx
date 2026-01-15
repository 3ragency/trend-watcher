import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/top-nav";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "Trend Watch",
  description: "Trending video collector for YouTube, Instagram, TikTok"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark">
      <body className={inter.className}>
        <div className="min-h-screen">
          <TopNav />
          <main className="mx-auto w-full max-w-7xl p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
