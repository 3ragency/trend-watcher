"use client";

import { cn } from "@/lib/utils";
import { Users, Film, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getActiveTabClasses, getPrimaryButtonClasses } from "@/lib/platform-theme";

export type InstagramTab = "accounts" | "reels";

type TabItem = {
    id: InstagramTab;
    label: string;
    icon: React.ElementType;
    count?: number;
};

type InstagramTabsProps = {
    activeTab: InstagramTab;
    onTabChange: (tab: InstagramTab) => void;
    accountsCount?: number;
    reelsCount?: number;
    onAddAccount?: () => void;
};

export function InstagramTabs({
    activeTab,
    onTabChange,
    accountsCount = 0,
    reelsCount = 0,
    onAddAccount
}: InstagramTabsProps) {
    const tabs: TabItem[] = [
        { id: "accounts", label: "Аккаунты", icon: Users, count: accountsCount },
        { id: "reels", label: "Посты/Reels", icon: Film, count: reelsCount }
    ];

    // Instagram theme classes
    const activeTabClasses = getActiveTabClasses("INSTAGRAM");
    const primaryButtonClasses = getPrimaryButtonClasses("INSTAGRAM");

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
                                {tab.count !== undefined && (
                                    <span className={cn("text-xs", isActive ? "text-white/80" : "text-muted-foreground")}>
                                        ({tab.count})
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
            {onAddAccount && (
                <Button
                    size="icon"
                    className={cn("h-9 w-9 shrink-0", primaryButtonClasses)}
                    onClick={onAddAccount}
                >
                    <Plus className="h-5 w-5" />
                </Button>
            )}
        </div>
    );
}
