"use client";

import { useState, type ChangeEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { usePlatform } from "@/components/platform-context";
import { getPrimaryButtonClasses } from "@/lib/platform-theme";
import { cn } from "@/lib/utils";

type AddChannelModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

export function AddChannelModal({ isOpen, onClose }: AddChannelModalProps) {
    const router = useRouter();
    const { success, error } = useToast();
    const { platform } = usePlatform();
    const [identifier, setIdentifier] = useState("");
    const [isBusy, setIsBusy] = useState(false);

    const primaryButtonClasses = getPrimaryButtonClasses(platform);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (identifier.trim().length < 2) return;

        setIsBusy(true);
        try {
            // Step 1: Add the channel
            const res = await fetch("/api/channels", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ platform, identifier })
            });
            if (!res.ok) {
                const text = await res.text();
                error(text || "Ошибка добавления канала");
                return;
            }
            const { id } = await res.json();
            success("Канал добавлен. Загружаем данные...");

            // Step 2: Fetch channel data (statistics, videos)
            try {
                const fetchRes = await fetch(`/api/channels/${id}/fetch`, {
                    method: "POST"
                });
                if (fetchRes.ok) {
                    const data = await fetchRes.json();
                    success(`Загружено ${data.itemsFetched ?? 0} видео`);
                } else {
                    error("Канал добавлен, но не удалось загрузить данные");
                }
            } catch {
                error("Канал добавлен, но не удалось загрузить данные");
            }

            setIdentifier("");
            onClose();
            router.refresh();
        } catch (e) {
            error(e instanceof Error ? e.message : "Ошибка сети");
        } finally {
            setIsBusy(false);
        }
    };

    const getPlaceholder = () => {
        switch (platform) {
            case "YOUTUBE":
                return "Channel ID / URL / @handle";
            case "INSTAGRAM":
            case "TIKTOK":
            case "VK":
                return "username / profile URL";
            default:
                return "Идентификатор канала";
        }
    };

    const getHint = () => {
        switch (platform) {
            case "YOUTUBE":
                return "Для YouTube лучше всего вставлять `UC...`.";
            case "INSTAGRAM":
                return "Укажите username или ссылку на профиль.";
            case "TIKTOK":
                return "Укажите username или ссылку на профиль TikTok.";
            case "VK":
                return "Укажите короткое имя группы/пользователя или ссылку.";
            default:
                return "";
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md mx-4 rounded-2xl border border-border bg-card p-6 shadow-2xl">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                <h2 className="text-xl font-semibold mb-6">Добавить канал</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Идентификатор</Label>
                        <Input
                            placeholder={getPlaceholder()}
                            value={identifier}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setIdentifier(e.target.value)}
                            autoFocus
                        />
                        <div className="text-xs text-muted-foreground">
                            {getHint()}
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className={cn("w-full transition-all", primaryButtonClasses)}
                        disabled={isBusy || identifier.trim().length < 2}
                    >
                        {isBusy ? "Добавление..." : "Добавить"}
                    </Button>
                </form>
            </div>
        </div>
    );
}
