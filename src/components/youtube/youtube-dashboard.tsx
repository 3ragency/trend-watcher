"use client";

import { useState, useEffect } from "react";
import { YouTubeMetrics } from "./youtube-metrics";
import { YouTubeTabs, type YouTubeTab } from "./youtube-tabs";
import { ChannelsTable } from "./channels-table";
import { TrendsSearchForm, type TrendsSearchParams } from "./trends-search-form";
import { TrendsResultsTable, type TrendVideo } from "./trends-results-table";
import { FavoritesList, type FavoriteVideo } from "./favorites-list";
import { VideosList } from "./videos-list";
import { ShortsList } from "./shorts-list";
import { AddChannelModal } from "./add-channel-modal";
import { useRouter } from "next/navigation";

type ChannelData = {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
    subscribersCount: string;
    totalViewsCount: string;
    videosCount: number | null;
    shortsCount: number;
    likesCount: string;
    commentsCount: string;
};

type YouTubeDashboardProps = {
    // Metrics
    channelsCount: number;
    videosCount: number;
    totalYouTubeVideosCount: number;
    shortsCount: number;
    subscribersCount: string;
    viewsCount: string;
    likesCount: string;
    // Channels
    channels: ChannelData[];
    // Favorites
    favorites: FavoriteVideo[];
    favoritesCount: number;
};

export function YouTubeDashboard({
    channelsCount,
    videosCount,
    totalYouTubeVideosCount,
    shortsCount,
    subscribersCount,
    viewsCount,
    likesCount,
    channels,
    favorites,
    favoritesCount
}: YouTubeDashboardProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<YouTubeTab>("channels");
    const [isSearching, setIsSearching] = useState(false);
    const [trendVideos, setTrendVideos] = useState<TrendVideo[]>([]);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<string>("");
    const [showAddChannel, setShowAddChannel] = useState(false);

    // Avoid hydration mismatch by updating date on client only
    useEffect(() => {
        setLastUpdated(new Date().toLocaleString("ru-RU"));
    }, []);

    const handleSearch = async (params: TrendsSearchParams) => {
        setIsSearching(true);
        setSearchError(null);
        try {
            const res = await fetch("/api/youtube/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(params)
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Ошибка поиска");
            }
            const data = await res.json();
            setTrendVideos(data.videos || []);
        } catch (e) {
            setSearchError(e instanceof Error ? e.message : "Ошибка поиска");
            setTrendVideos([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleToggleFavorite = async (videoId: string, isFavorite: boolean) => {
        const video = trendVideos.find((v) => v.id === videoId);
        if (!video) return;

        try {
            if (isFavorite) {
                await fetch("/api/favorites", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        videoId: video.id,
                        title: video.title,
                        thumbnailUrl: video.thumbnailUrl,
                        channelName: video.channelTitle,
                        viewsCount: video.viewsCount,
                        likesCount: video.likesCount,
                        commentsCount: video.commentsCount,
                        durationSeconds: video.durationSeconds
                    })
                });
            } else {
                await fetch(`/api/favorites/${videoId}`, { method: "DELETE" });
            }
            setTrendVideos((prev) =>
                prev.map((v) => (v.id === videoId ? { ...v, isFavorite } : v))
            );
            router.refresh();
        } catch {
            // ignore
        }
    };

    const handleRemoveFavorite = async (id: string) => {
        try {
            await fetch(`/api/favorites/${id}`, { method: "DELETE" });
            router.refresh();
        } catch {
            // ignore
        }
    };

    const handleRefreshChannel = async (id: string) => {
        // Fetch regular videos
        const res = await fetch(`/api/channels/${id}/fetch`, { method: "POST" });
        if (!res.ok) throw new Error("Ошибка");

        // Also fetch Shorts
        await fetch(`/api/channels/${id}/shorts?limit=50`, { method: "POST" }).catch(() => {
            // Ignore errors for Shorts (channel might not have Shorts playlist)
        });

        router.refresh();
    };

    const handleDeleteChannel = async (id: string) => {
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
                        <span className="text-red-500">📈</span> Обзор Дашборда
                    </h1>
                    <p className="text-xs md:text-sm text-muted-foreground">
                        {lastUpdated && `Обновлено ${lastUpdated}`}
                    </p>
                </div>
            </div>

            {/* Metrics */}
            <YouTubeMetrics
                channelsCount={channelsCount}
                videosCount={videosCount}
                totalYouTubeVideosCount={totalYouTubeVideosCount}
                subscribersCount={subscribersCount}
                viewsCount={viewsCount}
                likesCount={likesCount}
            />

            {/* Tabs */}
            <YouTubeTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                channelsCount={channelsCount}
                videosCount={videosCount}
                totalYouTubeVideosCount={totalYouTubeVideosCount}
                shortsCount={shortsCount}
                favoritesCount={favoritesCount}
                onAddChannel={() => setShowAddChannel(true)}
            />

            {/* Add Channel Modal */}
            <AddChannelModal
                isOpen={showAddChannel}
                onClose={() => setShowAddChannel(false)}
            />

            {/* Content */}
            {activeTab === "channels" && (
                <ChannelsTable
                    channels={channels}
                    onRefresh={handleRefreshChannel}
                    onDelete={handleDeleteChannel}
                />
            )}

            {activeTab === "videos" && <VideosList />}

            {activeTab === "shorts" && <ShortsList />}

            {activeTab === "trends" && (
                <div className="space-y-6">
                    <TrendsSearchForm onSearch={handleSearch} isLoading={isSearching} />
                    {searchError && (
                        <div className="rounded-xl border border-destructive bg-destructive/10 p-4 text-destructive">
                            {searchError}
                        </div>
                    )}
                    {(trendVideos.length > 0 || isSearching) && (
                        <TrendsResultsTable
                            videos={trendVideos}
                            onToggleFavorite={handleToggleFavorite}
                            isLoading={isSearching}
                        />
                    )}
                </div>
            )}

            {activeTab === "income" && (
                <div className="rounded-xl border border-border bg-card/30 py-16 text-center text-muted-foreground">
                    Раздел "Доходы" в разработке
                </div>
            )}

            {activeTab === "favorites" && (
                <FavoritesList favorites={favorites} onRemove={handleRemoveFavorite} />
            )}
        </div>
    );
}
