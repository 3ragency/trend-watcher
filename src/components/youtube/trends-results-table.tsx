"use client";

import { useState, useMemo } from "react";
import { Star, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { formatNumber } from "./youtube-metrics";
import { cn } from "@/lib/utils";

export type TrendVideo = {
    id: string;
    title: string;
    thumbnailUrl: string;
    publishedAt: string;
    channelTitle: string;
    subscribersCount: string;
    viewsCount: string;
    likesCount: string;
    commentsCount: string;
    durationSeconds?: number;
    isFavorite?: boolean;
};

type SortField = "publishedAt" | "subscribersCount" | "viewsCount" | "likesCount" | "commentsCount";
type SortDirection = "asc" | "desc";

type TrendsResultsTableProps = {
    videos: TrendVideo[];
    onToggleFavorite: (videoId: string, isFavorite: boolean) => void;
    isLoading?: boolean;
};

export function TrendsResultsTable({ videos, onToggleFavorite, isLoading }: TrendsResultsTableProps) {
    const [sortField, setSortField] = useState<SortField | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            // Toggle direction or reset
            if (sortDirection === "desc") {
                setSortDirection("asc");
            } else {
                setSortField(null);
                setSortDirection("desc");
            }
        } else {
            setSortField(field);
            setSortDirection("desc");
        }
    };

    const sortedVideos = useMemo(() => {
        if (!sortField) return videos;

        return [...videos].sort((a, b) => {
            if (sortField === "publishedAt") {
                const aVal = new Date(a.publishedAt).getTime();
                const bVal = new Date(b.publishedAt).getTime();
                return sortDirection === "desc" ? bVal - aVal : aVal - bVal;
            } else {
                const aVal = BigInt(a[sortField] || "0");
                const bVal = BigInt(b[sortField] || "0");
                if (sortDirection === "desc") {
                    return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
                } else {
                    return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                }
            }
        });
    }, [videos, sortField, sortDirection]);

    const SortableHeader = ({
        field,
        children,
        className
    }: {
        field: SortField;
        children: React.ReactNode;
        className?: string;
    }) => {
        const isActive = sortField === field;
        return (
            <TableHead
                className={cn(
                    "cursor-pointer select-none transition-colors hover:text-foreground",
                    isActive && "text-primary",
                    className
                )}
                onClick={() => handleSort(field)}
            >
                <div className="flex items-center gap-1">
                    {children}
                    <span className="ml-1">
                        {isActive ? (
                            sortDirection === "desc" ? (
                                <ArrowDown className="h-3.5 w-3.5" />
                            ) : (
                                <ArrowUp className="h-3.5 w-3.5" />
                            )
                        ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                        )}
                    </span>
                </div>
            </TableHead>
        );
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
                <div className="text-muted-foreground">Поиск видео...</div>
            </div>
        );
    }

    if (videos.length === 0) {
        return (
            <div className="rounded-xl border border-border bg-card/30 py-16 text-center text-muted-foreground">
                Нет результатов. Попробуйте изменить параметры поиска.
            </div>
        );
    }

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString("ru-RU", {
                year: "numeric",
                month: "short",
                day: "numeric"
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="rounded-xl border border-border bg-card/30 overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-border">
                        <TableHead className="w-12 text-center">№</TableHead>
                        <TableHead className="w-28">Превью</TableHead>
                        <TableHead>Название видео</TableHead>
                        <SortableHeader field="publishedAt">Опубликовано</SortableHeader>
                        <SortableHeader field="subscribersCount" className="text-right justify-end">Подписчики</SortableHeader>
                        <SortableHeader field="viewsCount" className="text-right justify-end">Просмотры</SortableHeader>
                        <SortableHeader field="likesCount" className="text-right justify-end">Лайки</SortableHeader>
                        <SortableHeader field="commentsCount" className="text-right justify-end">Комментарии</SortableHeader>
                        <TableHead className="w-12 text-center">⭐</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedVideos.map((video, idx) => (
                        <TableRow key={video.id} className="border-border hover:bg-white/5">
                            <TableCell className="text-center text-muted-foreground">{idx + 1}</TableCell>
                            <TableCell>
                                <a
                                    href={`https://www.youtube.com/watch?v=${video.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block h-16 w-24 overflow-hidden rounded-md bg-muted transition-opacity hover:opacity-80"
                                >
                                    {video.thumbnailUrl && (
                                        <img
                                            src={video.thumbnailUrl}
                                            alt=""
                                            className="h-full w-full object-cover"
                                            referrerPolicy="no-referrer"
                                        />
                                    )}
                                </a>
                            </TableCell>
                            <TableCell>
                                <div className="max-w-xs">
                                    <a
                                        href={`https://www.youtube.com/watch?v=${video.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="line-clamp-2 font-medium hover:text-primary transition-colors"
                                    >
                                        {video.title}
                                    </a>
                                    <div className="text-xs text-muted-foreground">{video.channelTitle}</div>
                                </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {formatDate(video.publishedAt)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-green-400">
                                {formatNumber(video.subscribersCount)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-cyan-400">
                                {formatNumber(video.viewsCount)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-yellow-400">
                                {formatNumber(video.likesCount)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-orange-400">
                                {formatNumber(video.commentsCount)}
                            </TableCell>
                            <TableCell className="text-center">
                                <button
                                    onClick={() => onToggleFavorite(video.id, !video.isFavorite)}
                                    className={cn(
                                        "rounded p-1 transition-colors hover:bg-white/10",
                                        video.isFavorite ? "text-yellow-400" : "text-muted-foreground"
                                    )}
                                >
                                    <Star className={cn("h-5 w-5", video.isFavorite && "fill-current")} />
                                </button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
