"use client";

import { usePlatform } from "@/components/platform-context";
import { YouTubeDashboard } from "@/components/youtube/youtube-dashboard";
import { InstagramDashboard } from "@/components/instagram/instagram-dashboard";

type YouTubeData = {
    channelsCount: number;
    videosCount: number;
    totalYouTubeVideosCount: number;
    shortsCount: number;
    subscribersCount: string;
    viewsCount: string;
    likesCount: string;
    channels: {
        id: string;
        displayName: string | null;
        avatarUrl: string | null;
        subscribersCount: string;
        totalViewsCount: string;
        videosCount: number | null;
        shortsCount: number;
        likesCount: string;
        commentsCount: string;
    }[];
    favorites: {
        id: string;
        videoId: string;
        title: string;
        thumbnailUrl: string;
        channelName: string;
        viewsCount: string;
        likesCount: string;
        commentsCount: string;
        addedAt: string;
        durationSeconds?: number | null;
        transcript?: string | null;
    }[];
    favoritesCount: number;
};

type InstagramData = {
    accountsCount: number;
    totalSubscribersCount: string;
    reelsCount: number;
    reelsViewsCount: string;
    likesCount: string;
    commentsCount: string;
    repostsCount: string;
    accounts: {
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
    }[];
};

type DashboardClientProps = {
    youtubeData: YouTubeData;
    instagramData: InstagramData;
};

export function DashboardClient({ youtubeData, instagramData }: DashboardClientProps) {
    const { platform } = usePlatform();

    if (platform === "INSTAGRAM") {
        return (
            <InstagramDashboard
                accountsCount={instagramData.accountsCount}
                totalSubscribersCount={instagramData.totalSubscribersCount}
                reelsCount={instagramData.reelsCount}
                reelsViewsCount={instagramData.reelsViewsCount}
                likesCount={instagramData.likesCount}
                commentsCount={instagramData.commentsCount}
                repostsCount={instagramData.repostsCount}
                accounts={instagramData.accounts}
            />
        );
    }

    if (platform === "TIKTOK") {
        return (
            <div className="py-16 text-center text-muted-foreground">
                <div className="text-4xl mb-4">🎵</div>
                <h2 className="text-xl font-semibold mb-2">TikTok Analytics</h2>
                <p>Раздел в разработке</p>
            </div>
        );
    }

    if (platform === "VK") {
        return (
            <div className="py-16 text-center text-muted-foreground">
                <div className="text-4xl mb-4">🔷</div>
                <h2 className="text-xl font-semibold mb-2">VK Analytics</h2>
                <p>Раздел в разработке</p>
            </div>
        );
    }

    // Default to YouTube
    return (
        <YouTubeDashboard
            channelsCount={youtubeData.channelsCount}
            videosCount={youtubeData.videosCount}
            totalYouTubeVideosCount={youtubeData.totalYouTubeVideosCount}
            shortsCount={youtubeData.shortsCount}
            subscribersCount={youtubeData.subscribersCount}
            viewsCount={youtubeData.viewsCount}
            likesCount={youtubeData.likesCount}
            channels={youtubeData.channels}
            favorites={youtubeData.favorites}
            favoritesCount={youtubeData.favoritesCount}
        />
    );
}
