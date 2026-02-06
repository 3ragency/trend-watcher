"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Film, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
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

export type ShortItem = {
    id: string;
    videoId: string;
    title: string;
    thumbnailUrl: string;
    channelName: string;
    viewsCount: string;
    likesCount: string;
    commentsCount: string;
    durationSeconds: number | null;
    publishedAt: string;
};

type SortField = "viewsCount" | "likesCount" | "commentsCount" | "publishedAt";
type SortDirection = "asc" | "desc";

export function ShortsList() {
    const [shorts, setShorts] = useState<ShortItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);

    const [sortField, setSortField] = useState<SortField | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    const fetchShorts = useCallback(async (offsetParam: number) => {
        try {
            const url = offsetParam > 0
                ? `/api/shorts?offset=${offsetParam}`
                : "/api/shorts";
            const res = await fetch(url);
            if (!res.ok) {
                throw new Error("Ошибка загрузки Shorts");
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
                const data = await fetchShorts(0);
                setShorts(data.shorts);
                setOffset(data.nextOffset ?? 0);
                setHasMore(data.hasMore);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Ошибка загрузки");
            } finally {
                setIsLoading(false);
            }
        };
        loadInitial();
    }, [fetchShorts]);

    // Load more
    const loadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;

        setIsLoadingMore(true);
        try {
            const data = await fetchShorts(offset);
            setShorts((prev) => [...prev, ...data.shorts]);
            setOffset(data.nextOffset ?? offset);
            setHasMore(data.hasMore);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Ошибка загрузки");
        } finally {
            setIsLoadingMore(false);
        }
    }, [offset, hasMore, isLoadingMore, fetchShorts]);

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

    const sortedShorts = useMemo(() => {
        if (!sortField) return shorts;

        return [...shorts].sort((a, b) => {
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
    }, [shorts, sortField, sortDirection]);

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

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return "—";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    if (isLoading) {
        return (
            <div className="rounded-xl border border-border bg-card/30 py-16 text-center">
                <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
                <div className="text-muted-foreground">Загрузка Shorts...</div>
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

    if (shorts.length === 0) {
        return (
            <div className="rounded-xl border border-border bg-card/30 py-16 text-center">
                <Film className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                <div className="text-muted-foreground">Shorts пока нет</div>
                <div className="mt-2 text-sm text-muted-foreground/70">
                    Откройте канал и нажмите «Загрузить Shorts» для загрузки
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
                            <TableHead className="w-24">Превью</TableHead>
                            <TableHead>Название</TableHead>
                            <TableHead>Канал</TableHead>
                            <SortableHeader field="viewsCount" className="text-right justify-end">Просмотры</SortableHeader>
                            <SortableHeader field="likesCount" className="text-right justify-end">Лайки</SortableHeader>
                            <SortableHeader field="commentsCount" className="text-right justify-end">Комментарии</SortableHeader>
                            <TableHead className="text-right">Длит.</TableHead>
                            <SortableHeader field="publishedAt">Опубликовано</SortableHeader>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedShorts.map((short, idx) => (
                            <TableRow key={short.id} className="border-border hover:bg-white/5">
                                <TableCell className="text-center text-muted-foreground">{idx + 1}</TableCell>
                                <TableCell>
                                    <a
                                        href={`https://www.youtube.com/shorts/${short.videoId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block h-20 w-14 overflow-hidden rounded-md bg-muted transition-opacity hover:opacity-80"
                                    >
                                        {short.thumbnailUrl && (
                                            <img
                                                src={short.thumbnailUrl}
                                                alt=""
                                                className="h-full w-full object-cover"
                                                referrerPolicy="no-referrer"
                                            />
                                        )}
                                    </a>
                                </TableCell>
                                <TableCell>
                                    <a
                                        href={`https://www.youtube.com/shorts/${short.videoId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="max-w-xs line-clamp-2 font-medium hover:text-red-400 transition-colors"
                                    >
                                        {short.title}
                                    </a>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{short.channelName}</TableCell>
                                <TableCell className="text-right tabular-nums text-cyan-400">
                                    {formatNumber(short.viewsCount)}
                                </TableCell>
                                <TableCell className="text-right tabular-nums text-yellow-400">
                                    {formatNumber(short.likesCount)}
                                </TableCell>
                                <TableCell className="text-right tabular-nums text-orange-400">
                                    {formatNumber(short.commentsCount)}
                                </TableCell>
                                <TableCell className="text-right tabular-nums text-muted-foreground">
                                    {formatDuration(short.durationSeconds)}
                                </TableCell>
                                <TableCell className="text-muted-foreground">{formatDate(short.publishedAt)}</TableCell>
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
            {!hasMore && shorts.length > 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground border-t border-border">
                    Загружено Shorts: {shorts.length}
                </div>
            )}
        </div>
    );
}
