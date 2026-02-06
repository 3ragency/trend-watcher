"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { formatNumber } from "../youtube/youtube-metrics";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

type ReelRow = {
    id: string;
    externalId: string;
    url: string;
    title: string | null;
    thumbnailUrl: string | null;
    channelName: string | null;
    publishedAt: string | null;
    viewsCount: string;
    likesCount: string;
    commentsCount: string;
};

type SortKey = "viewsCount" | "likesCount" | "commentsCount" | "publishedAt";
type SortState = { key: SortKey; direction: "asc" | "desc" } | null;

const PAGE_SIZE = 50;

export function InstagramReelsList() {
    const [reels, setReels] = useState<ReelRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);
    const [sort, setSort] = useState<SortState>(null);

    const loaderRef = useRef<HTMLDivElement>(null);

    const fetchReels = useCallback(async (currentOffset: number, reset = false) => {
        if (loading) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({
                platform: "INSTAGRAM",
                offset: String(currentOffset),
                limit: String(PAGE_SIZE)
            });
            const res = await fetch(`/api/videos?${params}`);
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            const newReels: ReelRow[] = (data.videos || []).map((v: any) => ({
                id: v.id,
                externalId: v.externalId,
                url: v.url,
                title: v.title,
                thumbnailUrl: v.thumbnailUrl,
                channelName: v.channelName,
                publishedAt: v.publishedAt,
                viewsCount: (v.viewsCount ?? 0).toString(),
                likesCount: (v.likesCount ?? 0).toString(),
                commentsCount: (v.commentsCount ?? 0).toString()
            }));
            if (reset) {
                setReels(newReels);
            } else {
                setReels((prev) => [...prev, ...newReels]);
            }
            setHasMore(newReels.length === PAGE_SIZE);
            setOffset(currentOffset + newReels.length);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [loading]);

    // Initial load
    useEffect(() => {
        fetchReels(0, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    fetchReels(offset);
                }
            },
            { threshold: 0.1 }
        );
        if (loaderRef.current) observer.observe(loaderRef.current);
        return () => observer.disconnect();
    }, [hasMore, loading, offset, fetchReels]);

    // Client-side sorting
    const sortedReels = [...reels];
    if (sort) {
        sortedReels.sort((a, b) => {
            let aVal: number | string;
            let bVal: number | string;
            if (sort.key === "publishedAt") {
                aVal = a.publishedAt ?? "";
                bVal = b.publishedAt ?? "";
            } else {
                aVal = parseInt(a[sort.key]) || 0;
                bVal = parseInt(b[sort.key]) || 0;
            }
            if (aVal < bVal) return sort.direction === "asc" ? -1 : 1;
            if (aVal > bVal) return sort.direction === "asc" ? 1 : -1;
            return 0;
        });
    }

    const handleSort = (key: SortKey) => {
        setSort((prev) => {
            if (!prev || prev.key !== key) return { key, direction: "desc" };
            if (prev.direction === "desc") return { key, direction: "asc" };
            return null;
        });
    };

    const SortIcon = ({ column }: { column: SortKey }) => {
        if (!sort || sort.key !== column) {
            return <span className="opacity-30 ml-1">↕</span>;
        }
        return sort.direction === "desc"
            ? <ChevronDown className="h-3 w-3 ml-1 inline" />
            : <ChevronUp className="h-3 w-3 ml-1 inline" />;
    };

    if (reels.length === 0 && !loading) {
        return (
            <div className="rounded-xl border border-border bg-card/30 py-16 text-center text-muted-foreground">
                Reels пока нет. Добавьте аккаунты и загрузите данные.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card/30 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-border">
                            <TableHead className="w-12 text-center">#</TableHead>
                            <TableHead className="w-20">Preview</TableHead>
                            <TableHead>Название</TableHead>
                            <TableHead>Аккаунт</TableHead>
                            <TableHead
                                className="text-right cursor-pointer select-none"
                                onClick={() => handleSort("publishedAt")}
                            >
                                Дата <SortIcon column="publishedAt" />
                            </TableHead>
                            <TableHead
                                className="text-right cursor-pointer select-none"
                                onClick={() => handleSort("viewsCount")}
                            >
                                Просмотры <SortIcon column="viewsCount" />
                            </TableHead>
                            <TableHead
                                className="text-right cursor-pointer select-none"
                                onClick={() => handleSort("likesCount")}
                            >
                                Лайки <SortIcon column="likesCount" />
                            </TableHead>
                            <TableHead
                                className="text-right cursor-pointer select-none"
                                onClick={() => handleSort("commentsCount")}
                            >
                                Комментарии <SortIcon column="commentsCount" />
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedReels.map((reel, idx) => (
                            <TableRow key={reel.id} className="border-border hover:bg-white/5">
                                <TableCell className="text-center text-muted-foreground">{idx + 1}</TableCell>
                                <TableCell>
                                    <a
                                        href={reel.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-16 h-16 rounded-lg overflow-hidden bg-muted relative group"
                                    >
                                        {reel.thumbnailUrl ? (
                                            <img
                                                src={reel.thumbnailUrl}
                                                alt=""
                                                className="w-full h-full object-cover"
                                                referrerPolicy="no-referrer"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                🎬
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <ExternalLink className="h-4 w-4 text-white" />
                                        </div>
                                    </a>
                                </TableCell>
                                <TableCell>
                                    <a
                                        href={reel.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-medium hover:text-pink-400 transition-colors line-clamp-2"
                                    >
                                        {reel.title || "Без названия"}
                                    </a>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {reel.channelName ?? "—"}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground text-sm">
                                    {reel.publishedAt
                                        ? new Date(reel.publishedAt).toLocaleDateString("ru-RU")
                                        : "—"}
                                </TableCell>
                                <TableCell className="text-right tabular-nums text-cyan-400">
                                    {formatNumber(reel.viewsCount)}
                                </TableCell>
                                <TableCell className="text-right tabular-nums text-yellow-400">
                                    {formatNumber(reel.likesCount)}
                                </TableCell>
                                <TableCell className="text-right tabular-nums text-orange-400">
                                    {formatNumber(reel.commentsCount)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Loader / End indicator */}
            <div ref={loaderRef} className="py-4 text-center text-sm text-muted-foreground">
                {loading && "Загрузка..."}
                {!loading && !hasMore && reels.length > 0 && `Загружено Reels: ${reels.length}`}
            </div>
        </div>
    );
}
