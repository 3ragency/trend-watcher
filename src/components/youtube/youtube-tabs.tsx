"use client";

import { cn } from "@/lib/utils";
import { Tv, Video, TrendingUp, DollarSign, Star, Plus, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getActiveTabClasses, getPrimaryButtonClasses } from "@/lib/platform-theme";

export type YouTubeTab = "channels" | "videos" | "shorts" | "trends" | "income" | "favorites";

type TabItem = {
    id: YouTubeTab;
    label: string;
    icon: React.ElementType;
    count?: number;
    countDisplay?: string;
};

type YouTubeTabsProps = {
    activeTab: YouTubeTab;
    onTabChange: (tab: YouTubeTab) => void;
    channelsCount?: number;
    videosCount?: number;
    totalYouTubeVideosCount?: number;
    shortsCount?: number;
    favoritesCount?: number;
    onAddChannel?: () => void;
};

export function YouTubeTabs({
    activeTab,
    onTabChange,
    channelsCount = 0,
    videosCount = 0,
    totalYouTubeVideosCount = 0,
    shortsCount = 0,
    favoritesCount = 0,
    onAddChannel
}: YouTubeTabsProps) {
    // Format videos count for tab display
    const videosCountDisplay = totalYouTubeVideosCount > videosCount
        ? `${videosCount} / ${totalYouTubeVideosCount}`
        : `${videosCount}`;

    const tabs: TabItem[] = [
        { id: "channels", label: "Каналы", icon: Tv, count: channelsCount },
        { id: "videos", label: "Видео", icon: Video, countDisplay: videosCountDisplay },
        { id: "shorts", label: "Shorts", icon: Film, count: shortsCount },
        { id: "trends", label: "Поиск трендов", icon: TrendingUp },
        { id: "income", label: "Доходы", icon: DollarSign },
        { id: "favorites", label: "Избранное", icon: Star, count: favoritesCount }
    ];

    // YouTube theme classes
    const activeTabClasses = getActiveTabClasses("YOUTUBE");
    const primaryButtonClasses = getPrimaryButtonClasses("YOUTUBE");

    return (
        <div className="flex items-center gap-4 border-b border-border pb-4">
            <div className="overflow-x-auto scrollbar-hide flex-1 -mx-4 px-4 md:mx-0 md:px-0">
                <div className="flex gap-2 min-w-max">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={cn(
                                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all whitespace-nowrap",
                                    isActive
                                        ? activeTabClasses
                                        : "border border-border bg-card/50 text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                                {(tab.count !== undefined || tab.countDisplay) && (
                                    <span className={cn("text-xs", isActive ? "text-white/80" : "text-muted-foreground")}>
                                        ({tab.countDisplay ?? tab.count})
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
            {onAddChannel && (
                <Button
                    size="icon"
                    className={cn("h-9 w-9 shrink-0", primaryButtonClasses)}
                    onClick={onAddChannel}
                >
                    <Plus className="h-5 w-5" />
                </Button>
            )}
        </div>
    );
}
