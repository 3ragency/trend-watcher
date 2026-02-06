"use client";

import { Video, Users, Eye, ThumbsUp, Tv } from "lucide-react";

type MetricCardProps = {
    icon: React.ReactNode;
    label: string;
    value: string | number;
};

function MetricCard({ icon, label, value }: MetricCardProps) {
    return (
        <div className="flex items-center gap-3 md:gap-4 rounded-xl border border-border bg-card/50 px-3 py-3 md:px-5 md:py-4">
            <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg bg-red-600/20 text-red-500 shrink-0">
                {icon}
            </div>
            <div className="min-w-0">
                <div className="text-[10px] md:text-xs uppercase tracking-wider text-muted-foreground truncate">{label}</div>
                <div className="text-lg md:text-xl font-bold tabular-nums">{value}</div>
            </div>
        </div>
    );
}

type YouTubeMetricsProps = {
    channelsCount: number;
    videosCount: number;
    totalYouTubeVideosCount: number;
    subscribersCount: string;
    viewsCount: string;
    likesCount: string;
};

export function formatNumber(num: number | bigint | string): string {
    const n = typeof num === "string" ? parseInt(num) : Number(num);
    if (isNaN(n)) return "0";
    return n.toLocaleString("ru-RU").replace(/,/g, " ");
}

export function YouTubeMetrics({
    channelsCount,
    videosCount,
    totalYouTubeVideosCount,
    subscribersCount,
    viewsCount,
    likesCount
}: YouTubeMetricsProps) {
    // Format videos count with "loaded / total" if they differ
    const videosDisplay = totalYouTubeVideosCount > videosCount
        ? `${formatNumber(videosCount)} / ${formatNumber(totalYouTubeVideosCount)}`
        : formatNumber(videosCount);

    return (
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-5">
            <MetricCard
                icon={<Tv className="h-5 w-5 md:h-6 md:w-6" />}
                label="Каналы"
                value={channelsCount}
            />
            <MetricCard
                icon={<Video className="h-5 w-5 md:h-6 md:w-6" />}
                label="Видео (загружено)"
                value={videosDisplay}
            />
            <MetricCard
                icon={<Users className="h-5 w-5 md:h-6 md:w-6" />}
                label="Подписчики"
                value={formatNumber(subscribersCount)}
            />
            <MetricCard
                icon={<Eye className="h-5 w-5 md:h-6 md:w-6" />}
                label="Просмотры"
                value={formatNumber(viewsCount)}
            />
            <MetricCard
                icon={<ThumbsUp className="h-5 w-5 md:h-6 md:w-6" />}
                label="Лайки"
                value={formatNumber(likesCount)}
            />
        </div>
    );
}
