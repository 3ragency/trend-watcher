"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, Trash2, ExternalLink, Eye, ThumbsUp, MessageSquare, Calendar, Clock, LayoutGrid, Table as TableIcon, ArrowUpDown, ArrowUp, ArrowDown, Download, Video, Users, Star, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatNumber } from "./youtube-metrics";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";

type ChannelData = {
    id: string;
    platform: string;
    externalId: string;
    displayName: string | null;
    handle: string | null;
    avatarUrl: string | null;
    url: string | null;
    subscribersCount: string;
    totalViewsCount: string;
    videosCount: number;
    lastFetchedAt: string | null;
};

type VideoData = {
    id: string;
    externalId: string;
    title: string;
    thumbnailUrl: string;
    url: string;
    viewsCount: string;
    likesCount: string;
    commentsCount: string;
    publishedAt: string | null;
    durationSeconds: number | null;
};

type Aggregates = {
    totalViews: string;
    totalLikes: string;
    totalComments: string;
    videoCount: number;
    totalVideosOnChannel: number;
};

type ChannelDetailProps = {
    channel: ChannelData;
    videos: VideoData[];
    aggregates: Aggregates;
};

function formatDuration(seconds: number | null): string {
    if (!seconds) return "";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
        return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(isoString: string | null): string {
    if (!isoString) return "";
    try {
        return new Date(isoString).toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    } catch {
        return "";
    }
}

type SortColumn = "views" | "likes" | "comments" | "duration" | "date";
type SortDirection = "asc" | "desc";
type ContentTab = "videos" | "shorts";

type ShortData = {
    id: string;
    externalId: string;
    title: string;
    thumbnailUrl: string;
    viewsCount: string;
    likesCount: string;
    commentsCount: string;
    publishedAt: string | null;
    durationSeconds: number | null;
};

export function ChannelDetail({ channel, videos, aggregates }: ChannelDetailProps) {
    const router = useRouter();
    const { success, error } = useToast();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [viewMode, setViewMode] = useState<"table" | "cards">("table");
    const [sortColumn, setSortColumn] = useState<SortColumn>("date");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
    const [togglingFavorite, setTogglingFavorite] = useState<string | null>(null);

    // Content tab state
    const [contentTab, setContentTab] = useState<ContentTab>("videos");
    const [channelShorts, setChannelShorts] = useState<ShortData[]>([]);
    const [isShortsLoading, setIsShortsLoading] = useState(false);
    const [shortsLoaded, setShortsLoaded] = useState(false);

    // Load existing favorites on mount
    useEffect(() => {
        async function loadFavorites() {
            try {
                const res = await fetch("/api/favorites");
                if (res.ok) {
                    const data = await res.json();
                    const ids = new Set<string>(data.favorites?.map((f: { videoId: string }) => f.videoId) || []);
                    setFavoriteIds(ids);
                }
            } catch {
                // ignore
            }
        }
        loadFavorites();
    }, []);

    // Load channel shorts when switching to shorts tab
    useEffect(() => {
        if (contentTab === "shorts" && !shortsLoaded && !isShortsLoading) {
            loadChannelShorts();
        }
    }, [contentTab]);

    const loadChannelShorts = async () => {
        setIsShortsLoading(true);
        try {
            const res = await fetch(`/api/channels/${channel.id}/shorts?limit=50`, { method: "POST" });
            if (res.ok) {
                const data = await res.json();
                // Refetch the page to get updated shorts from DB
                router.refresh();
            }
            // Now fetch shorts from the database for this channel
            const shortsRes = await fetch(`/api/shorts?channelId=${channel.id}`);
            if (shortsRes.ok) {
                const shortsData = await shortsRes.json();
                setChannelShorts(shortsData.shorts?.map((s: { id: string; videoId: string; title: string; thumbnailUrl: string; viewsCount: string; likesCount: string; commentsCount: string; publishedAt: string; durationSeconds: number | null }) => ({
                    id: s.id,
                    externalId: s.videoId,
                    title: s.title,
                    thumbnailUrl: s.thumbnailUrl,
                    viewsCount: s.viewsCount,
                    likesCount: s.likesCount,
                    commentsCount: s.commentsCount,
                    publishedAt: s.publishedAt,
                    durationSeconds: s.durationSeconds
                })) || []);
            }
            setShortsLoaded(true);
        } catch {
            error("Ошибка загрузки Shorts");
        } finally {
            setIsShortsLoading(false);
        }
    };

    const handleSort = (column: SortColumn) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortColumn(column);
            setSortDirection("desc");
        }
    };

    const handleToggleFavorite = async (e: React.MouseEvent, video: VideoData) => {
        e.stopPropagation();
        const isFavorite = favoriteIds.has(video.externalId);
        setTogglingFavorite(video.id);

        try {
            if (isFavorite) {
                await fetch(`/api/favorites/${video.externalId}`, { method: "DELETE" });
                setFavoriteIds(prev => {
                    const next = new Set(prev);
                    next.delete(video.externalId);
                    return next;
                });
                success("Удалено из избранного");
            } else {
                await fetch("/api/favorites", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        videoId: video.externalId,
                        title: video.title,
                        thumbnailUrl: video.thumbnailUrl,
                        channelName: channel.displayName || channel.handle || "",
                        viewsCount: video.viewsCount,
                        likesCount: video.likesCount,
                        commentsCount: video.commentsCount,
                        durationSeconds: video.durationSeconds
                    })
                });
                setFavoriteIds(prev => new Set(prev).add(video.externalId));
                success("Добавлено в избранное");
            }
        } catch {
            error("Не удалось обновить избранное");
        } finally {
            setTogglingFavorite(null);
        }
    };

    const sortedVideos = useMemo(() => {
        return [...videos].sort((a, b) => {
            let comparison = 0;
            switch (sortColumn) {
                case "views":
                    comparison = BigInt(a.viewsCount || "0") > BigInt(b.viewsCount || "0") ? 1 : -1;
                    break;
                case "likes":
                    comparison = BigInt(a.likesCount || "0") > BigInt(b.likesCount || "0") ? 1 : -1;
                    break;
                case "comments":
                    comparison = BigInt(a.commentsCount || "0") > BigInt(b.commentsCount || "0") ? 1 : -1;
                    break;
                case "duration":
                    comparison = (a.durationSeconds ?? 0) - (b.durationSeconds ?? 0);
                    break;
                case "date":
                    const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
                    const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
                    comparison = dateA - dateB;
                    break;
            }
            return sortDirection === "asc" ? comparison : -comparison;
        });
    }, [videos, sortColumn, sortDirection]);

    const SortIcon = ({ column }: { column: SortColumn }) => {
        if (sortColumn !== column) {
            return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
        }
        return sortDirection === "asc"
            ? <ArrowUp className="h-3 w-3 ml-1" />
            : <ArrowDown className="h-3 w-3 ml-1" />;
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const res = await fetch(`/api/channels/${channel.id}/fetch`, { method: "POST" });
            if (!res.ok) throw new Error("Ошибка");
            const data = await res.json();
            success(`Загружено ${data.itemsFetched ?? 0} видео`);
            router.refresh();
        } catch {
            error("Ошибка обновления данных");
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Удалить канал и все его видео?")) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/channels/${channel.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Ошибка");
            success("Канал удалён");
            router.push("/");
        } catch {
            error("Ошибка удаления");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6 py-6">
            {/* Back button */}
            <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Назад
            </Button>

            {/* Channel header */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Avatar */}
                <div className="h-24 w-24 md:h-32 md:w-32 rounded-full overflow-hidden bg-muted shrink-0">
                    {channel.avatarUrl && (
                        <img src={channel.avatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl md:text-3xl font-bold truncate">
                        {channel.displayName || "Без названия"}
                    </h1>
                    {channel.handle && (
                        <p className="text-muted-foreground">{channel.handle}</p>
                    )}
                    {channel.lastFetchedAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                            Обновлено: {formatDate(channel.lastFetchedAt)}
                        </p>
                    )}
                    {channel.url && (
                        <Button variant="outline" size="sm" asChild className="mt-3">
                            <a href={channel.url} target="_blank" rel="noopener noreferrer" className="gap-2">
                                <ExternalLink className="h-4 w-4" />
                                Открыть
                            </a>
                        </Button>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                        Обновить
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="gap-2"
                    >
                        <Trash2 className="h-4 w-4" />
                        Удалить
                    </Button>
                </div>
            </div>

            {/* Aggregates */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="rounded-xl border border-border bg-card/50 p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Users className="h-4 w-4" />
                        Подписчики
                    </div>
                    <div className="text-xl font-bold text-green-400 mt-1">{formatNumber(channel.subscribersCount)}</div>
                </div>
                <div className="rounded-xl border border-border bg-card/50 p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Eye className="h-4 w-4" />
                        Просмотры
                    </div>
                    <div className="text-xl font-bold text-cyan-400 mt-1">{formatNumber(aggregates.totalViews)}</div>
                </div>
                <div className="rounded-xl border border-border bg-card/50 p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <ThumbsUp className="h-4 w-4" />
                        Лайки
                    </div>
                    <div className="text-xl font-bold text-yellow-400 mt-1">{formatNumber(aggregates.totalLikes)}</div>
                </div>
                <div className="rounded-xl border border-border bg-card/50 p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <MessageSquare className="h-4 w-4" />
                        Комментарии
                    </div>
                    <div className="text-xl font-bold text-orange-400 mt-1">{formatNumber(aggregates.totalComments)}</div>
                </div>
                <div className="rounded-xl border border-border bg-card/50 p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Video className="h-4 w-4" />
                        Видео
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xl font-bold text-blue-400">{aggregates.videoCount}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-lg text-muted-foreground">{aggregates.totalVideosOnChannel}</span>
                    </div>
                    {aggregates.videoCount < aggregates.totalVideosOnChannel && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 w-full gap-2"
                            disabled={isLoadingMore}
                            onClick={async () => {
                                setIsLoadingMore(true);
                                try {
                                    const res = await fetch(`/api/channels/${channel.id}/fetch?limit=30&loadMore=true`, { method: "POST" });
                                    if (!res.ok) throw new Error("Ошибка");
                                    const data = await res.json();
                                    if (data.itemsFetched === 0) {
                                        success(data.message || "Все доступные видео уже загружены");
                                    } else {
                                        success(`Загружено ${data.itemsFetched} видео`);
                                    }
                                    router.refresh();
                                } catch {
                                    error("Ошибка загрузки");
                                } finally {
                                    setIsLoadingMore(false);
                                }
                            }}
                        >
                            {isLoadingMore ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                                <Download className="h-3 w-3" />
                            )}
                            Ещё 30
                        </Button>
                    )}
                </div>
            </div>

            {/* YouTube-style content tabs */}
            <div className="border-b border-border">
                <div className="flex items-center justify-between">
                    <div className="flex gap-8">
                        <button
                            onClick={() => setContentTab("videos")}
                            className={`relative pb-3 text-sm font-medium transition-colors ${contentTab === "videos"
                                ? "text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Video className="h-4 w-4" />
                                Видео
                                <span className="text-xs text-muted-foreground">({aggregates.videoCount})</span>
                            </div>
                            {contentTab === "videos" && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
                            )}
                        </button>
                        <button
                            onClick={() => setContentTab("shorts")}
                            className={`relative pb-3 text-sm font-medium transition-colors ${contentTab === "shorts"
                                ? "text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Film className="h-4 w-4" />
                                Shorts
                                {shortsLoaded && <span className="text-xs text-muted-foreground">({channelShorts.length})</span>}
                            </div>
                            {contentTab === "shorts" && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
                            )}
                        </button>
                    </div>
                    <div className="flex gap-1 pb-2">
                        <Button
                            variant={viewMode === "table" ? "default" : "ghost"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setViewMode("table")}
                            title="Таблица"
                        >
                            <TableIcon className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === "cards" ? "default" : "ghost"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setViewMode("cards")}
                            title="Карточки"
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Videos tab content */}
            {contentTab === "videos" && (
                <div className="space-y-4">
                    {videos.length === 0 ? (
                        <div className="rounded-xl border border-border bg-card/30 py-12 text-center text-muted-foreground">
                            Видео пока не загружены. Нажмите «Обновить» для загрузки.
                        </div>
                    ) : viewMode === "table" ? (
                        /* Table View */
                        <div className="rounded-xl border border-border bg-card/30 overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-border">
                                        <TableHead className="w-12 text-center">#</TableHead>
                                        <TableHead>Видео</TableHead>
                                        <TableHead
                                            className="text-right cursor-pointer hover:text-foreground transition-colors"
                                            onClick={() => handleSort("views")}
                                        >
                                            <span className="flex items-center justify-end">
                                                Просмотры
                                                <SortIcon column="views" />
                                            </span>
                                        </TableHead>
                                        <TableHead
                                            className="text-right cursor-pointer hover:text-foreground transition-colors"
                                            onClick={() => handleSort("likes")}
                                        >
                                            <span className="flex items-center justify-end">
                                                Лайки
                                                <SortIcon column="likes" />
                                            </span>
                                        </TableHead>
                                        <TableHead
                                            className="text-right cursor-pointer hover:text-foreground transition-colors"
                                            onClick={() => handleSort("comments")}
                                        >
                                            <span className="flex items-center justify-end">
                                                Коммент.
                                                <SortIcon column="comments" />
                                            </span>
                                        </TableHead>
                                        <TableHead
                                            className="text-right cursor-pointer hover:text-foreground transition-colors"
                                            onClick={() => handleSort("duration")}
                                        >
                                            <span className="flex items-center justify-end">
                                                Длит.
                                                <SortIcon column="duration" />
                                            </span>
                                        </TableHead>
                                        <TableHead
                                            className="text-right cursor-pointer hover:text-foreground transition-colors"
                                            onClick={() => handleSort("date")}
                                        >
                                            <span className="flex items-center justify-end">
                                                Дата
                                                <SortIcon column="date" />
                                            </span>
                                        </TableHead>
                                        <TableHead className="w-16 text-center">Действ.</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedVideos.map((video, idx) => (
                                        <TableRow
                                            key={video.id}
                                            className="border-border hover:bg-white/5 cursor-pointer"
                                            onClick={() => window.open(video.url, "_blank")}
                                        >
                                            <TableCell className="text-center text-muted-foreground">{idx + 1}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-12 w-20 flex-shrink-0 overflow-hidden rounded bg-muted">
                                                        {video.thumbnailUrl && (
                                                            <img
                                                                src={video.thumbnailUrl}
                                                                alt=""
                                                                className="h-full w-full object-cover"
                                                                referrerPolicy="no-referrer"
                                                            />
                                                        )}
                                                    </div>
                                                    <span className="font-medium line-clamp-2 text-sm">{video.title || "Без названия"}</span>
                                                </div>
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
                                            <TableCell className="text-right tabular-nums text-muted-foreground">
                                                {formatDuration(video.durationSeconds)}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground text-sm">
                                                {formatDate(video.publishedAt)}
                                            </TableCell>
                                            <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={(e) => handleToggleFavorite(e, video)}
                                                    disabled={togglingFavorite === video.id}
                                                    className={`rounded p-1.5 transition-colors hover:bg-white/10 disabled:opacity-50 ${favoriteIds.has(video.externalId) ? "text-yellow-400" : "text-muted-foreground hover:text-yellow-400"
                                                        }`}
                                                    title={favoriteIds.has(video.externalId) ? "Удалить из избранного" : "Добавить в избранное"}
                                                >
                                                    <Star className={`h-4 w-4 ${favoriteIds.has(video.externalId) ? "fill-current" : ""}`} />
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        /* Cards View */
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {videos.map((video) => (
                                <a
                                    key={video.id}
                                    href={video.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group rounded-xl border border-border bg-card/30 overflow-hidden hover:border-red-500/50 transition-colors"
                                >
                                    {/* Thumbnail */}
                                    <div className="relative aspect-video bg-muted">
                                        {video.thumbnailUrl && (
                                            <img
                                                src={video.thumbnailUrl}
                                                alt=""
                                                className="h-full w-full object-cover"
                                                referrerPolicy="no-referrer"
                                            />
                                        )}
                                        {video.durationSeconds && (
                                            <div className="absolute bottom-2 right-2 bg-black/80 rounded px-1.5 py-0.5 text-xs font-mono">
                                                {formatDuration(video.durationSeconds)}
                                            </div>
                                        )}
                                    </div>
                                    {/* Info */}
                                    <div className="p-3">
                                        <h3 className="font-medium text-sm line-clamp-2 group-hover:text-red-400 transition-colors">
                                            {video.title || "Без названия"}
                                        </h3>
                                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Eye className="h-3 w-3" />
                                                {formatNumber(video.viewsCount)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <ThumbsUp className="h-3 w-3" />
                                                {formatNumber(video.likesCount)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <MessageSquare className="h-3 w-3" />
                                                {formatNumber(video.commentsCount)}
                                            </div>
                                        </div>
                                        {video.publishedAt && (
                                            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                {formatDate(video.publishedAt)}
                                            </div>
                                        )}
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Shorts tab content */}
            {contentTab === "shorts" && (
                <div className="space-y-4">
                    {isShortsLoading ? (
                        <div className="rounded-xl border border-border bg-card/30 py-12 text-center">
                            <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
                            <div className="text-muted-foreground">Загрузка Shorts...</div>
                        </div>
                    ) : channelShorts.length === 0 ? (
                        <div className="rounded-xl border border-border bg-card/30 py-12 text-center">
                            <Film className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                            <div className="text-muted-foreground">Shorts пока не загружены</div>
                            <Button
                                variant="outline"
                                className="mt-4 gap-2"
                                onClick={loadChannelShorts}
                            >
                                <Film className="h-4 w-4" />
                                Загрузить Shorts
                            </Button>
                        </div>
                    ) : viewMode === "table" ? (
                        /* Table View for Shorts */
                        <div className="rounded-xl border border-border bg-card/30 overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-border">
                                        <TableHead className="w-24">Превью</TableHead>
                                        <TableHead>Название</TableHead>
                                        <TableHead className="text-right">Просмотры</TableHead>
                                        <TableHead className="text-right">Лайки</TableHead>
                                        <TableHead className="text-right">Комментарии</TableHead>
                                        <TableHead className="text-right">Длит.</TableHead>
                                        <TableHead>Опубликовано</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {channelShorts.map((short) => (
                                        <TableRow key={short.id} className="border-border hover:bg-white/5">
                                            <TableCell>
                                                <a
                                                    href={`https://www.youtube.com/shorts/${short.externalId}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block h-16 w-10 overflow-hidden rounded-md bg-muted transition-opacity hover:opacity-80"
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
                                                    href={`https://www.youtube.com/shorts/${short.externalId}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="max-w-md line-clamp-2 font-medium hover:text-red-400 transition-colors"
                                                >
                                                    {short.title || "Без названия"}
                                                </a>
                                            </TableCell>
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
                                            <TableCell className="text-muted-foreground">
                                                {formatDate(short.publishedAt)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        /* Cards View for Shorts */
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {channelShorts.map((short) => (
                                <a
                                    key={short.id}
                                    href={`https://www.youtube.com/shorts/${short.externalId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group relative overflow-hidden rounded-xl bg-card/50 hover:bg-card/80 transition-colors"
                                >
                                    <div className="aspect-[9/16] relative overflow-hidden rounded-t-xl bg-muted">
                                        {short.thumbnailUrl && (
                                            <img
                                                src={short.thumbnailUrl}
                                                alt=""
                                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                                referrerPolicy="no-referrer"
                                            />
                                        )}
                                        {short.durationSeconds && (
                                            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                                                {formatDuration(short.durationSeconds)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <div className="text-sm font-medium line-clamp-2 mb-2">
                                            {short.title}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Eye className="h-3 w-3" />
                                                {formatNumber(short.viewsCount)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <ThumbsUp className="h-3 w-3" />
                                                {formatNumber(short.likesCount)}
                                            </span>
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
