import Link from "next/link";
import { Youtube, Instagram, Music2, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/nav-client";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/channels", label: "Channels", icon: Youtube },
  { href: "/videos", label: "Videos", icon: Music2 }
];

export function TopNav() {
  return (
    <header className="border-b border-border bg-card/40 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Youtube className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Trend Watch</div>
            <div className="text-xs text-muted-foreground">
              YouTube • Instagram • TikTok
            </div>
          </div>
        </div>

        <nav className="flex items-center gap-1 rounded-lg bg-secondary px-1 py-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-secondary-foreground/80 hover:text-secondary-foreground",
                "hover:bg-white/5"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
          <div className="mx-2 h-6 w-px bg-white/10" />
          <div className="flex items-center gap-2 px-2 text-xs text-secondary-foreground/70">
            <Instagram className="h-4 w-4" />
            <span>Apify</span>
          </div>
          <div className="mx-2 h-6 w-px bg-white/10" />
          <LogoutButton />
        </nav>
      </div>
    </header>
  );
}
