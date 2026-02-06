"use client";

import { useState, useEffect } from "react";
import { InstagramMetrics } from "./instagram-metrics";
import { InstagramTabs, type InstagramTab } from "./instagram-tabs";
import { InstagramAccountsTable } from "./instagram-accounts-table";
import { InstagramReelsList } from "./instagram-reels-list";
import { AddChannelModal } from "../youtube/add-channel-modal";
import { useRouter } from "next/navigation";

type AccountData = {
    id: string;
    displayName: string | null;
    handle: string | null;
    avatarUrl: string | null;
    subscribersCount: string;
    postsCount: number;
    reelsViewsCount: string;
    likesCount: string;
    commentsCount: string;
    repostsCount: string;
};

type InstagramDashboardProps = {
    // Metrics
    accountsCount: number;
    totalSubscribersCount: string;
    reelsCount: number;
    reelsViewsCount: string;
    likesCount: string;
    commentsCount: string;
    repostsCount: string;
    // Accounts
    accounts: AccountData[];
};

export function InstagramDashboard({
    accountsCount,
    totalSubscribersCount,
    reelsCount,
    reelsViewsCount,
    likesCount,
    commentsCount,
    repostsCount,
    accounts
}: InstagramDashboardProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<InstagramTab>("accounts");
    const [lastUpdated, setLastUpdated] = useState<string>("");
    const [showAddChannel, setShowAddChannel] = useState(false);

    // Avoid hydration mismatch by updating date on client only
    useEffect(() => {
        setLastUpdated(new Date().toLocaleString("ru-RU"));
    }, []);

    const handleRefreshAccount = async (id: string) => {
        const res = await fetch(`/api/channels/${id}/fetch`, { method: "POST" });
        if (!res.ok) throw new Error("Ошибка");
        router.refresh();
    };

    const handleDeleteAccount = async (id: string) => {
        const res = await fetch(`/api/channels/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Ошибка");
        router.refresh();
    };

    return (
        <div className="space-y-4 md:space-y-6 py-4 md:py-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="flex items-center gap-2 text-lg md:text-xl font-semibold">
                        <span className="text-pink-500">📸</span> Instagram Analytics
                    </h1>
                    <p className="text-xs md:text-sm text-muted-foreground">
                        {lastUpdated && `Обновлено ${lastUpdated}`}
                    </p>
                </div>
            </div>

            {/* Metrics */}
            <InstagramMetrics
                accountsCount={accountsCount}
                totalSubscribersCount={totalSubscribersCount}
                reelsCount={reelsCount}
                reelsViewsCount={reelsViewsCount}
                likesCount={likesCount}
                commentsCount={commentsCount}
                repostsCount={repostsCount}
            />

            {/* Tabs */}
            <InstagramTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                accountsCount={accountsCount}
                reelsCount={reelsCount}
                onAddAccount={() => setShowAddChannel(true)}
            />

            {/* Add Channel Modal */}
            <AddChannelModal
                isOpen={showAddChannel}
                onClose={() => setShowAddChannel(false)}
            />

            {/* Content */}
            {activeTab === "accounts" && (
                <InstagramAccountsTable
                    accounts={accounts}
                    onRefresh={handleRefreshAccount}
                    onDelete={handleDeleteAccount}
                />
            )}

            {activeTab === "reels" && <InstagramReelsList />}
        </div>
    );
}
