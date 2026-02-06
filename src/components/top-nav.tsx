"use client";

import { Youtube, Instagram, Plus, RefreshCw, Settings, Menu, X } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePlatform, type Platform } from "@/components/platform-context";
import { LogoutButton } from "@/components/nav-client";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type PlatformConfig = {
  id: Platform;
  label: string;
  icon: React.ElementType;
  activeClass: string;
};

const VKIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path fillRule="evenodd" clipRule="evenodd" d="M23.405 16.865a11.4 11.4 0 0 0-2.123-2.964a16 16 0 0 0-.905-.94l-.038-.037a19 19 0 0 1-.346-.344a29.7 29.7 0 0 0 3.01-5.238l.033-.074l.023-.078c.109-.363.233-1.053-.207-1.677c-.456-.644-1.185-.76-1.674-.76h-2.247a2.23 2.23 0 0 0-2.19 1.442a17.5 17.5 0 0 1-1.806 3.271V6.833c0-.34-.032-.91-.397-1.39c-.436-.576-1.067-.69-1.505-.69H9.467a1.813 1.813 0 0 0-1.85 1.682l-.003.045v.045c0 .485.192.843.346 1.068c.069.101.142.193.189.251l.01.013c.05.062.083.103.116.149c.088.118.213.302.249.776v1.473a19.8 19.8 0 0 1-1.751-3.792l-.008-.022l-.008-.021c-.122-.319-.317-.783-.708-1.137c-.456-.415-.996-.53-1.487-.53h-2.28c-.497 0-1.096.116-1.543.587C.3 5.804.25 6.36.25 6.654v.134l.028.13a19.4 19.4 0 0 0 3.801 8.02a10.15 10.15 0 0 0 7.893 4.692l.041.003h.042c.726 0 1.483-.063 2.052-.442c.767-.512.828-1.297.828-1.689v-1.138c.197.16.441.374.74.662c.362.362.65.676.897.95l.132.146c.192.214.381.425.553.598c.216.217.483.456.817.633c.363.191.744.278 1.148.278h2.281c.481 0 1.17-.114 1.655-.676c.528-.612.488-1.363.322-1.902l-.03-.097zm-5.72.106a26 26 0 0 0-.957-1.014l-.003-.003c-1.357-1.308-1.99-1.535-2.438-1.535c-.239 0-.502.026-.673.24a.8.8 0 0 0-.147.348a2.5 2.5 0 0 0-.032.444v2.051c0 .255-.042.362-.16.44c-.157.105-.492.19-1.211.19a8.65 8.65 0 0 1-6.752-4.052l-.008-.013l-.01-.012A17.9 17.9 0 0 1 1.75 6.63c.004-.13.032-.209.078-.257c.047-.05.162-.12.454-.12h2.28c.253 0 .385.056.48.141c.106.098.2.263.312.557c.56 1.646 1.316 3.186 2.033 4.318c.358.565.71 1.036 1.028 1.369c.159.166.314.304.463.402c.143.094.306.169.474.169c.088 0 .191-.01.29-.053a.52.52 0 0 0 .25-.232c.103-.188.132-.465.132-.828V8.723c-.053-.818-.3-1.279-.54-1.606a6 6 0 0 0-.15-.193l-.013-.016a3 3 0 0 1-.122-.16a.4.4 0 0 1-.085-.214a.313.313 0 0 1 .324-.282h3.595c.206 0 .275.05.31.097c.05.065.092.2.092.484v4.528c0 .538.248.902.608.902c.414 0 .713-.251 1.235-.773l.009-.01l.008-.009a19 19 0 0 0 2.84-4.722l.004-.012a.73.73 0 0 1 .74-.485h2.3c.312 0 .414.08.448.127c.035.05.06.157 0 .367a28.2 28.2 0 0 1-3.029 5.2l-.008.012c-.115.177-.242.373-.26.597c-.02.242.084.461.267.697c.133.196.408.465.687.738l.026.026c.292.286.609.596.863.896l.007.007l.007.008a9.9 9.9 0 0 1 1.865 2.586c.076.26.03.394-.03.463c-.069.08-.224.155-.518.155h-2.282a.9.9 0 0 1-.447-.105a2 2 0 0 1-.454-.364c-.143-.143-.298-.316-.488-.527z" />
  </svg>
)

const platforms: PlatformConfig[] = [
  {
    id: "YOUTUBE",
    label: "YouTube",
    icon: Youtube,
    activeClass: "bg-red-600 text-white"
  },
  {
    id: "INSTAGRAM",
    label: "Instagram",
    icon: Instagram,
    // Instagram gradient: purple → pink → orange
    activeClass: "bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white"
  },
  {
    id: "TIKTOK",
    label: "TikTok",
    icon: () => <span className="text-sm font-bold">♪</span>,
    activeClass: "bg-cyan-500 text-black"
  },
  {
    id: "VK",
    label: "VK",
    icon: VKIcon,
    activeClass: "bg-blue-600 text-white"
  }
];

export function TopNav() {
  const { platform, setPlatform } = usePlatform();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handlePlatformSwitch = (newPlatform: Platform) => {
    setPlatform(newPlatform);
    // If we're on a sub-page (like /channels/[id]), navigate to home
    // so the user sees the correct platform dashboard
    if (pathname !== "/") {
      router.push("/");
    }
  };

  return (
    <header className="border-b border-border bg-card/40 backdrop-blur sticky top-0 z-50">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-2 px-4 py-3 md:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-md bg-red-600 text-white">
            <Youtube className="h-4 w-4 md:h-5 md:w-5" />
          </div>
          <span className="text-base md:text-lg font-semibold hidden sm:inline">Trend Watcher</span>
        </div>

        {/* Platform Switcher - icons only on mobile, full labels on desktop */}
        <div className="flex-1 overflow-x-auto scrollbar-hide mx-2 md:mx-4">
          <div className="flex items-center gap-1 rounded-full bg-secondary/50 p-1 w-fit mx-auto">
            {platforms.map((p) => {
              const isActive = platform === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handlePlatformSwitch(p.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3 py-1.5 md:px-4 md:py-2 text-sm font-medium transition-all whitespace-nowrap",
                    isActive
                      ? p.activeClass
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <p.icon className="h-4 w-4" />
                  <span className="hidden md:inline">{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>


        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Обновить все
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Settings className="h-5 w-5" />
          </Button>
          <LogoutButton />
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-secondary/50 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card/95 backdrop-blur px-4 py-3 space-y-2">
          <Button variant="outline" size="sm" className="w-full gap-2 justify-center">
            <RefreshCw className="h-4 w-4" />
            Обновить все
          </Button>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
              <Settings className="h-5 w-5" />
            </Button>
            <LogoutButton />
          </div>
        </div>
      )}
    </header>
  );
}
