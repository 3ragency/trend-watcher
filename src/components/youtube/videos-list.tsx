"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Video, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
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

export type VideoItem = {
    id: string;
    videoId: string;
    title: string;
    thumbnailUrl: string;
    channelName: string;
    viewsCount: string;
    likesCount: string;
    commentsCount: string;
    publishedAt: string;
};

type SortField = "viewsCount" | "likesCount" | "commentsCount" | "publishedAt";
type SortDirection = "asc" | "desc";

export function VideosList() {
    const [videos, setVideos] = useState<VideoItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);

    const [sortField, setSortField] = useState<SortField | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    const fetchVideos = useCallback(async (offsetParam: number) => {
        try {
            const url = offsetParam > 0
                ? `/api/videos?offset=${offsetParam}`
                : "/api/videos";
            const res = await fetch(url);
            if (!res.ok) {
                throw new Error("Ошибка загрузки видео");
            }
            const data = await res.json();
            return data;
        } catch (e) {
            throw e;
        }
    }, []);

    // Initial load
    useEffect(() => {
        const loadInitial = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await fetchVideos(0);
                setVideos(data.videos);
                setOffset(data.nextOffset ?? 0);
                setHasMore(data.hasMore);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Ошибка загрузки");
            } finally {
                setIsLoading(false);
            }
        };
        loadInitial();
    }, [fetchVideos]);

    // Load more
    const loadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;

        setIsLoadingMore(true);
        try {
            const data = await fetchVideos(offset);
            setVideos((prev) => [...prev, ...data.videos]);
            setOffset(data.nextOffset ?? offset);
            setHasMore(data.hasMore);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Ошибка загрузки");
        } finally {
            setIsLoadingMore(false);
        }
    }, [offset, hasMore, isLoadingMore, fetchVideos]);

    // Intersection Observer for infinite scroll
    useEffect(() => {
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observerRef.current.observe(loadMoreRef.current);
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [hasMore, isLoadingMore, isLoading, loadMore]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
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

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "—";
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

    if (isLoading) {
        return (
            <div className="rounded-xl border border-border bg-card/30 py-16 text-center">
                <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
                <div className="text-muted-foreground">Загрузка видео...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl border border-destructive bg-destructive/10 p-4 text-center text-destructive">
                {error}
            </div>
        );
    }

    if (videos.length === 0) {
        return (
            <div className="rounded-xl border border-border bg-card/30 py-16 text-center">
                <Video className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                <div className="text-muted-foreground">Видео пока нет</div>
                <div className="mt-2 text-sm text-muted-foreground/70">
                    Добавьте каналы и обновите их для загрузки видео
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border bg-card/30 overflow-hidden">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-border">
                            <TableHead className="w-12 text-center">№</TableHead>
                            <TableHead className="w-28">Превью</TableHead>
                            <TableHead>Название видео</TableHead>
                            <TableHead>Канал</TableHead>
                            <SortableHeader field="viewsCount" className="text-right justify-end">Просмотры</SortableHeader>
                            <SortableHeader field="likesCount" className="text-right justify-end">Лайки</SortableHeader>
                            <SortableHeader field="commentsCount" className="text-right justify-end">Комментарии</SortableHeader>
                            <SortableHeader field="publishedAt">Опубликовано</SortableHeader>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedVideos.map((video, idx) => (
                            <TableRow key={video.id} className="border-border hover:bg-white/5">
                                <TableCell className="text-center text-muted-foreground">{idx + 1}</TableCell>
                                <TableCell>
                                    <a
                                        href={`https://www.youtube.com/watch?v=${video.videoId}`}
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
                                    <a
                                        href={`https://www.youtube.com/watch?v=${video.videoId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="max-w-xs line-clamp-2 font-medium hover:text-primary transition-colors"
                                    >
                                        {video.title}
                                    </a>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{video.channelName}</TableCell>
                                <TableCell className="text-right tabular-nums text-cyan-400">
                                    {formatNumber(video.viewsCount)}
                                </TableCell>
                                <TableCell className="text-right tabular-nums text-yellow-400">
                                    {formatNumber(video.likesCount)}
                                </TableCell>
                                <TableCell className="text-right tabular-nums text-orange-400">
                                    {formatNumber(video.commentsCount)}
                                </TableCell>
                                <TableCell className="text-muted-foreground">{formatDate(video.publishedAt)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Infinite scroll trigger */}
            <div ref={loadMoreRef} className="h-4" />

            {/* Loading more indicator */}
            {isLoadingMore && (
                <div className="flex items-center justify-center py-4 border-t border-border">
                    <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                    <span className="text-sm text-muted-foreground">Загрузка...</span>
                </div>
            )}

            {/* End of list indicator */}
            {!hasMore && videos.length > 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground border-t border-border">
                    Загружено видео: {videos.length}
                </div>
            )}
        </div>
    );
}
