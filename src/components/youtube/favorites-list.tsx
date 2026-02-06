"use client";

import { useState, useMemo } from "react";
import { Star, Trash2, ArrowUpDown, ArrowUp, ArrowDown, FileText, Loader2, Copy, Check, Clock } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { formatNumber } from "./youtube-metrics";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

export type FavoriteVideo = {
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
};

function formatDuration(seconds: number | null | undefined): string {
    if (!seconds) return "";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
        return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
}

type SortField = "viewsCount" | "likesCount" | "commentsCount" | "addedAt";
type SortDirection = "asc" | "desc";

type FavoritesListProps = {
    favorites: FavoriteVideo[];
    onRemove: (id: string) => void;
};

export function FavoritesList({ favorites, onRemove }: FavoritesListProps) {
    const { success, error } = useToast();
    const [sortField, setSortField] = useState<SortField | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

    // Dialog state
    const [selectedVideo, setSelectedVideo] = useState<FavoriteVideo | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [copied, setCopied] = useState(false);

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

    const sortedFavorites = useMemo(() => {
        if (!sortField) return favorites;

        return [...favorites].sort((a, b) => {
            if (sortField === "addedAt") {
                const aVal = new Date(a.addedAt).getTime();
                const bVal = new Date(b.addedAt).getTime();
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
    }, [favorites, sortField, sortDirection]);

    const openVideoDialog = (video: FavoriteVideo) => {
        setSelectedVideo(video);
        setTranscript(video.transcript || "");
        setIsSaved(!!video.transcript);
        setIsDialogOpen(true);
        setCopied(false);
    };

    const handleGetTranscript = async () => {
        if (!selectedVideo) return;

        setIsLoading(true);
        try {
            const res = await fetch("/api/youtube/transcript", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ videoId: selectedVideo.videoId })
            });

            const data = await res.json();

            if (!data.success) {
                error(data.error || "Не удалось получить транскрипцию");
                return;
            }

            const fetchedTranscript = data.full_text || "";
            setTranscript(fetchedTranscript);

            // Save to database
            const saveRes = await fetch(`/api/favorites/${selectedVideo.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transcript: fetchedTranscript })
            });

            if (saveRes.ok) {
                setIsSaved(true);
                success("Транскрипция получена и сохранена");
                // Update the local favorite object
                selectedVideo.transcript = fetchedTranscript;
            } else {
                error("Транскрипция получена, но не удалось сохранить");
            }
        } catch (err) {
            error(err instanceof Error ? err.message : "Ошибка получения транскрипции");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyToClipboard = async () => {
        if (!transcript) return;

        try {
            await navigator.clipboard.writeText(transcript);
            setCopied(true);
            success("Скопировано в буфер обмена");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            error("Не удалось скопировать");
        }
    };

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

    if (favorites.length === 0) {
        return (
            <div className="rounded-xl border border-border bg-card/30 py-16 text-center">
                <Star className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                <div className="text-muted-foreground">Избранное пусто</div>
                <div className="mt-2 text-sm text-muted-foreground/70">
                    Добавляйте видео в избранное из результатов поиска трендов
                </div>
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
        <>
            <div className="rounded-xl border border-border bg-card/30 overflow-hidden">
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
                            <SortableHeader field="addedAt">Добавлено</SortableHeader>
                            <TableHead className="w-24 text-center">Действия</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedFavorites.map((fav, idx) => (
                            <TableRow key={fav.id} className="border-border hover:bg-white/5">
                                <TableCell className="text-center text-muted-foreground">{idx + 1}</TableCell>
                                <TableCell>
                                    <a
                                        href={`https://www.youtube.com/watch?v=${fav.videoId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block h-16 w-24 overflow-hidden rounded-md bg-muted transition-opacity hover:opacity-80"
                                    >
                                        {fav.thumbnailUrl && (
                                            <img
                                                src={fav.thumbnailUrl}
                                                alt=""
                                                className="h-full w-full object-cover"
                                                referrerPolicy="no-referrer"
                                            />
                                        )}
                                    </a>
                                </TableCell>
                                <TableCell>
                                    <a
                                        href={`https://www.youtube.com/watch?v=${fav.videoId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="max-w-xs line-clamp-2 font-medium hover:text-primary transition-colors"
                                    >
                                        {fav.title}
                                    </a>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{fav.channelName}</TableCell>
                                <TableCell className="text-right tabular-nums text-cyan-400">
                                    {formatNumber(fav.viewsCount)}
                                </TableCell>
                                <TableCell className="text-right tabular-nums text-yellow-400">
                                    {formatNumber(fav.likesCount)}
                                </TableCell>
                                <TableCell className="text-right tabular-nums text-orange-400">
                                    {formatNumber(fav.commentsCount)}
                                </TableCell>
                                <TableCell className="text-muted-foreground">{formatDate(fav.addedAt)}</TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                                "h-8 w-8",
                                                fav.transcript
                                                    ? "text-green-500 hover:text-green-400"
                                                    : "text-blue-500 hover:text-blue-400"
                                            )}
                                            onClick={() => openVideoDialog(fav)}
                                            title={fav.transcript ? "Текст получен" : "Получить текст из видео"}
                                        >
                                            <FileText className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            onClick={() => onRemove(fav.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Transcript Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 pr-8">
                            {selectedVideo?.thumbnailUrl && (
                                <img
                                    src={selectedVideo.thumbnailUrl}
                                    alt=""
                                    className="h-12 w-20 rounded object-cover flex-shrink-0"
                                    referrerPolicy="no-referrer"
                                />
                            )}
                            <span className="line-clamp-2">{selectedVideo?.title}</span>
                        </DialogTitle>
                        <DialogDescription className="flex items-center gap-2 flex-wrap">
                            <span>Канал: {selectedVideo?.channelName}</span>
                            <span>•</span>
                            <span>Просмотры: {formatNumber(selectedVideo?.viewsCount || "0")}</span>
                            {selectedVideo?.durationSeconds && (
                                <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5" />
                                        Длительность: {formatDuration(selectedVideo.durationSeconds)}
                                    </span>
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 space-y-4 overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Транскрипция видео</label>
                            {transcript && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCopyToClipboard}
                                    className="gap-2"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="h-4 w-4" />
                                            Скопировано
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-4 w-4" />
                                            Копировать
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>

                        <Textarea
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                            placeholder="Нажмите «Получить текст» для загрузки транскрипции..."
                            className="flex-1 min-h-[300px] resize-none font-mono text-sm"
                            readOnly={isSaved}
                        />

                        <Button
                            onClick={handleGetTranscript}
                            disabled={isLoading || isSaved}
                            className="w-full gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Получение транскрипции...
                                </>
                            ) : isSaved ? (
                                <>
                                    <Check className="h-4 w-4" />
                                    Текст уже получен
                                </>
                            ) : (
                                <>
                                    <FileText className="h-4 w-4" />
                                    Получить текст
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
