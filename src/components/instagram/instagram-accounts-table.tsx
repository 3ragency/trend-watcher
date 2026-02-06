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
import { formatNumber } from "../youtube/youtube-metrics";
import { useToast } from "@/components/ui/toast";
import { useState } from "react";

type AccountRow = {
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
};

type InstagramAccountsTableProps = {
    accounts: AccountRow[];
    onRefresh?: (id: string) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
};

export function InstagramAccountsTable({ accounts, onRefresh, onDelete }: InstagramAccountsTableProps) {
    const router = useRouter();
    const { success, error } = useToast();
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleRefresh = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (onRefresh) {
            setLoadingId(id);
            try {
                await onRefresh(id);
                success("Аккаунт обновлён");
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
                success("Аккаунт удалён");
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

    if (accounts.length === 0) {
        return (
            <div className="rounded-xl border border-border bg-card/30 py-16 text-center text-muted-foreground">
                Аккаунтов пока нет. Добавьте первый аккаунт для начала работы.
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border bg-card/30 overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-border">
                        <TableHead className="w-12 text-center">№</TableHead>
                        <TableHead>Аккаунт</TableHead>
                        <TableHead className="text-right">Просмотры Reels</TableHead>
                        <TableHead className="text-right">Подписчики</TableHead>
                        <TableHead className="text-right">Посты</TableHead>
                        <TableHead className="text-right">Лайки</TableHead>
                        <TableHead className="text-right">Комментарии</TableHead>
                        <TableHead className="text-right">Репосты</TableHead>
                        <TableHead className="text-right w-24">Действия</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {accounts.map((account, idx) => (
                        <TableRow
                            key={account.id}
                            onClick={() => handleRowClick(account.id)}
                            className="cursor-pointer border-border hover:bg-white/5"
                        >
                            <TableCell className="text-center text-muted-foreground">{idx + 1}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 p-[2px]">
                                        <div className="h-full w-full rounded-full bg-card overflow-hidden">
                                            {account.avatarUrl ? (
                                                <img
                                                    src={account.avatarUrl}
                                                    alt=""
                                                    className="h-full w-full object-cover"
                                                    referrerPolicy="no-referrer"
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-pink-500 font-bold text-sm">
                                                    {(account.displayName?.[0] ?? account.handle?.[0] ?? "?").toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-medium">{account.displayName ?? account.handle ?? "Без названия"}</div>
                                        {account.handle && (
                                            <div className="text-xs text-muted-foreground">@{account.handle.replace(/^@/, "")}</div>
                                        )}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-cyan-400">
                                {formatNumber(account.reelsViewsCount)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-green-400">
                                {formatNumber(account.subscribersCount)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-blue-400">
                                {account.postsCount ?? 0}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-yellow-400">
                                {formatNumber(account.likesCount)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-orange-400">
                                {formatNumber(account.commentsCount)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-pink-400">
                                {formatNumber(account.repostsCount)}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        disabled={loadingId === account.id}
                                        onClick={(e) => handleRefresh(e, account.id)}
                                    >
                                        <RefreshCw className={`h-4 w-4 ${loadingId === account.id ? "animate-spin" : ""}`} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                        disabled={loadingId === account.id}
                                        onClick={(e) => handleDelete(e, account.id)}
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
