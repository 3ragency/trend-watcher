import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { PlatformProvider } from "@/components/platform-context";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "Trend Watcher",
  description: "Trending video analytics for YouTube, Instagram, TikTok"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark">
      <body className={inter.className}>
        <ToastProvider>
          <PlatformProvider>
            {children}
          </PlatformProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
