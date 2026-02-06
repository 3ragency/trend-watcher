"use client";

import { Users, Play, ThumbsUp, MessageCircle, Share2, Film } from "lucide-react";
import { formatNumber } from "../youtube/youtube-metrics";

type MetricCardProps = {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color?: string;
};

function MetricCard({ icon, label, value, color = "bg-pink-600/20 text-pink-500" }: MetricCardProps) {
    return (
        <div className="flex flex-col items-center gap-1.5 md:gap-2 rounded-xl border border-border bg-card/50 px-3 py-3 md:px-4 md:py-4">
            <div className={`flex h-9 w-9 md:h-11 md:w-11 items-center justify-center rounded-lg shrink-0 ${color}`}>
                {icon}
            </div>
            <div className="text-base md:text-lg font-bold tabular-nums leading-tight">{value}</div>
            <div className="text-[9px] md:text-[10px] uppercase tracking-wide text-muted-foreground leading-tight text-center">{label}</div>
        </div>
    );
}

type InstagramMetricsProps = {
    accountsCount: number;
    totalSubscribersCount: string;
    reelsCount: number;
    reelsViewsCount: string;
    likesCount: string;
    commentsCount: string;
    repostsCount: string;
};

export function InstagramMetrics({
    accountsCount,
    totalSubscribersCount,
    reelsCount,
    reelsViewsCount,
    likesCount,
    commentsCount,
    repostsCount
}: InstagramMetricsProps) {
    return (
        <div className="grid grid-cols-2 gap-2 md:gap-3 lg:grid-cols-4 xl:grid-cols-7">
            <MetricCard
                icon={<Users className="h-4 w-4 md:h-5 md:w-5" />}
                label="Аккаунты"
                value={accountsCount}
                color="bg-pink-600/20 text-pink-500"
            />
            <MetricCard
                icon={<Users className="h-4 w-4 md:h-5 md:w-5" />}
                label="Подписчики"
                value={formatNumber(totalSubscribersCount)}
                color="bg-green-600/20 text-green-500"
            />
            <MetricCard
                icon={<Film className="h-4 w-4 md:h-5 md:w-5" />}
                label="Reels"
                value={formatNumber(reelsCount)}
                color="bg-purple-600/20 text-purple-500"
            />
            <MetricCard
                icon={<Play className="h-4 w-4 md:h-5 md:w-5" />}
                label="Просмотры"
                value={formatNumber(reelsViewsCount)}
                color="bg-cyan-600/20 text-cyan-500"
            />
            <MetricCard
                icon={<ThumbsUp className="h-4 w-4 md:h-5 md:w-5" />}
                label="Лайки"
                value={formatNumber(likesCount)}
                color="bg-yellow-600/20 text-yellow-500"
            />
            <MetricCard
                icon={<MessageCircle className="h-4 w-4 md:h-5 md:w-5" />}
                label="Коммент."
                value={formatNumber(commentsCount)}
                color="bg-orange-600/20 text-orange-500"
            />
            <MetricCard
                icon={<Share2 className="h-4 w-4 md:h-5 md:w-5" />}
                label="Репосты"
                value={formatNumber(repostsCount)}
                color="bg-blue-600/20 text-blue-500"
            />
        </div>
    );
}
