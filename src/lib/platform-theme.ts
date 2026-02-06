// Platform-specific color schemes
import type { Platform } from "@/components/platform-context";

export type PlatformTheme = {
    // Primary button/active states
    primary: string;
    primaryHover: string;
    // Icon backgrounds
    iconBg: string;
    iconText: string;
    // Accent for highlights, badges
    accent: string;
    accentForeground: string;
    // Ring/border color
    ring: string;
    // Gradient (for Instagram)
    gradient?: string;
};

export const platformThemes: Record<Platform, PlatformTheme> = {
    YOUTUBE: {
        primary: "bg-red-600",
        primaryHover: "hover:bg-red-700",
        iconBg: "bg-red-600/20",
        iconText: "text-red-500",
        accent: "bg-red-600",
        accentForeground: "text-white",
        ring: "ring-red-600",
    },
    INSTAGRAM: {
        primary: "bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400",
        primaryHover: "hover:from-purple-700 hover:via-pink-600 hover:to-orange-500",
        iconBg: "bg-pink-600/20",
        iconText: "text-pink-500",
        accent: "bg-pink-600",
        accentForeground: "text-white",
        ring: "ring-pink-500",
        gradient: "bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400",
    },
    TIKTOK: {
        primary: "bg-cyan-500",
        primaryHover: "hover:bg-cyan-600",
        iconBg: "bg-cyan-500/20",
        iconText: "text-cyan-400",
        accent: "bg-cyan-500",
        accentForeground: "text-black",
        ring: "ring-cyan-500",
    },
    VK: {
        primary: "bg-blue-600",
        primaryHover: "hover:bg-blue-700",
        iconBg: "bg-blue-600/20",
        iconText: "text-blue-500",
        accent: "bg-blue-600",
        accentForeground: "text-white",
        ring: "ring-blue-500",
    },
};

export function getPlatformTheme(platform: Platform): PlatformTheme {
    return platformThemes[platform];
}

// Utility to get primary button classes for a platform
export function getPrimaryButtonClasses(platform: Platform): string {
    const theme = platformThemes[platform];
    return `${theme.primary} ${theme.accentForeground} ${theme.primaryHover}`;
}

// Utility to get tab active classes for a platform
export function getActiveTabClasses(platform: Platform): string {
    const theme = platformThemes[platform];
    return `${theme.primary} ${theme.accentForeground}`;
}
