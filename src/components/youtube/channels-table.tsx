"use client";

import { RefreshCw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatNumber } from "./youtube-metrics";
import { useToast } from "@/components/ui/toast";
import { useState } from "react";

type ChannelRow = {
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

type ChannelsTableProps = {
    channels: ChannelRow[];
    onRefresh?: (id: string) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
};

export function ChannelsTable({ channels, onRefresh, onDelete }: ChannelsTableProps) {
    const router = useRouter();
    const { success, error } = useToast();
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleRefresh = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (onRefresh) {
            setLoadingId(id);
            try {
                await onRefresh(id);
                success("Канал обновлён");
            } catch {
                error("Ошибка обновления");
            } finally {
                setLoadingId(null);
            }
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (onDelete) {
            setLoadingId(id);
            try {
                await onDelete(id);
                success("Канал удалён");
            } catch {
                error("Ошибка удаления");
            } finally {
                setLoadingId(null);
            }
        }
    };

    const handleRowClick = (id: string) => {
        router.push(`/channels/${id}`);
    };

    if (channels.length === 0) {
        return (
            <div className="rounded-xl border border-border bg-card/30 py-16 text-center text-muted-foreground">
                Каналов пока нет. Добавьте первый канал для начала работы.
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border bg-card/30 overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-border">
                        <TableHead className="w-12 text-center">#</TableHead>
                        <TableHead>Канал</TableHead>
                        <TableHead className="text-right">Просмотры</TableHead>
                        <TableHead className="text-right">Подписчики</TableHead>
                        <TableHead className="text-right">Видео</TableHead>
                        <TableHead className="text-right">Shorts</TableHead>
                        <TableHead className="text-right">Лайки</TableHead>
                        <TableHead className="text-right">Комментарии</TableHead>
                        <TableHead className="text-right w-24">Действия</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {channels.map((channel, idx) => (
                        <TableRow
                            key={channel.id}
                            onClick={() => handleRowClick(channel.id)}
                            className="cursor-pointer border-border hover:bg-white/5"
                        >
                            <TableCell className="text-center text-muted-foreground">{idx + 1}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-muted">
                                        {channel.avatarUrl && (
                                            <img
                                                src={channel.avatarUrl}
                                                alt=""
                                                className="h-full w-full object-cover"
                                                referrerPolicy="no-referrer"
                                            />
                                        )}
                                    </div>
                                    <span className="font-medium">{channel.displayName ?? "Без названия"}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-cyan-400">
                                {formatNumber(channel.totalViewsCount)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-green-400">
                                {formatNumber(channel.subscribersCount)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-blue-400">
                                {channel.videosCount ?? 0}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-purple-400">
                                {channel.shortsCount}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-yellow-400">
                                {formatNumber(channel.likesCount)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-orange-400">
                                {formatNumber(channel.commentsCount)}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        disabled={loadingId === channel.id}
                                        onClick={(e) => handleRefresh(e, channel.id)}
                                    >
                                        <RefreshCw className={`h-4 w-4 ${loadingId === channel.id ? "animate-spin" : ""}`} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                        disabled={loadingId === channel.id}
                                        onClick={(e) => handleDelete(e, channel.id)}
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
    );
}
