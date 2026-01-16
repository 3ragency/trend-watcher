"use client";

import React, { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import type { ChannelDto } from "@/lib/dto";

type Platform = "YOUTUBE" | "INSTAGRAM" | "TIKTOK";

type Props = {
  initialChannels: ChannelDto[];
};

export function ChannelsClient({ initialChannels }: Props) {
  const router = useRouter();
  const { success, error } = useToast();
  const [platform, setPlatform] = useState<Platform>("YOUTUBE");
  const [identifier, setIdentifier] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [defaultLimit, setDefaultLimit] = useState(30);

  // Fetch settings per channel
  const [fetchSettings, setFetchSettings] = useState<Record<string, { limit: number; showSettings: boolean }>>({});
  const [storedLimits, setStoredLimits] = useState<Record<string, number>>({});

  const channels = useMemo(() => initialChannels, [initialChannels]);

  useEffect(() => {
    try {
      const dl = localStorage.getItem("tw:defaultLimit");
      const n = dl ? parseInt(dl) : NaN;
      if (Number.isFinite(n)) setDefaultLimit(Math.max(1, Math.min(100, n)));

      const raw = localStorage.getItem("tw:channelLimits");
      const parsed = raw ? (JSON.parse(raw) as unknown) : {};
      if (parsed && typeof parsed === "object") {
        setStoredLimits(parsed as Record<string, number>);
      }
    } catch {
      // ignore
    }
  }, []);

  function getChannelSettings(id: string) {
    const existing = fetchSettings[id];
    if (existing) return existing;
    const stored = storedLimits[id];
    const limit = typeof stored === "number" ? stored : defaultLimit;
    return { limit, showSettings: false };
  }

  function toggleSettings(id: string) {
    const current = getChannelSettings(id);
    setFetchSettings((prev) => ({
      ...prev,
      [id]: { ...current, showSettings: !current.showSettings }
    }));
  }

  function setLimit(id: string, limit: number) {
    const current = getChannelSettings(id);
    const nextLimit = Math.max(1, Math.min(100, limit));
    setFetchSettings((prev) => ({
      ...prev,
      [id]: { ...current, limit: nextLimit }
    }));
    setStoredLimits((prev) => {
      const next = { ...prev, [id]: nextLimit };
      try {
        localStorage.setItem("tw:channelLimits", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  function setDefaultLimitSafe(limit: number) {
    const nextLimit = Math.max(1, Math.min(100, limit));
    setDefaultLimit(nextLimit);
    try {
      localStorage.setItem("tw:defaultLimit", String(nextLimit));
    } catch {
      // ignore
    }
  }

  async function addChannel() {
    setIsBusy(true);
    try {
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
      setIdentifier("");
      success("Канал добавлен");
      router.refresh();
    } catch (e) {
      error(e instanceof Error ? e.message : "Ошибка сети");
    } finally {
      setIsBusy(false);
    }
  }

  async function fetchChannel(id: string, limit?: number) {
    setIsBusy(true);
    try {
      const url = limit ? `/api/channels/${id}/fetch?limit=${limit}` : `/api/channels/${id}/fetch`;
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) {
        const text = await res.text();
        error(text || "Ошибка парсинга");
        return;
      }
      const data = await res.json().catch(() => ({}));
      success(
        `Загружено видео: ${data.itemsFetched ?? 0} (всего: ${data.itemsTotal ?? 0}, пропущено: ${data.itemsSkipped ?? 0})`
      );
      router.refresh();
    } catch (e) {
      error(e instanceof Error ? e.message : "Ошибка сети");
    } finally {
      setIsBusy(false);
    }
  }
  
  async function clearChannelVideos(id: string) {
    setIsBusy(true);
    try {
      const res = await fetch("/api/videos", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ channelIds: [id] })
      });
      if (!res.ok) {
        const text = await res.text();
        error(text || "Ошибка удаления");
        return;
      }
      const data = await res.json().catch(() => ({}));
      success(`Удалено видео: ${data.deleted ?? 0}`);
      router.refresh();
    } catch (e) {
      error(e instanceof Error ? e.message : "Ошибка сети");
    } finally {
      setIsBusy(false);
    }
  }

  async function removeChannel(id: string) {
    setIsBusy(true);
    try {
      const res = await fetch(`/api/channels/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text();
        error(text || "Ошибка удаления");
        return;
      }
      success("Канал удалён");
      router.refresh();
    } catch (e) {
      error(e instanceof Error ? e.message : "Ошибка сети");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">
      <Card className="w-full xl:sticky xl:top-6 xl:h-fit">
        <CardHeader>
          <CardTitle>Добавить канал</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Платформа</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={platform === "YOUTUBE" ? "default" : "secondary"}
                onClick={() => setPlatform("YOUTUBE")}
              >
                YouTube
              </Button>
              <Button
                type="button"
                variant={platform === "INSTAGRAM" ? "default" : "secondary"}
                onClick={() => setPlatform("INSTAGRAM")}
              >
                Instagram
              </Button>
              <Button
                type="button"
                variant={platform === "TIKTOK" ? "default" : "secondary"}
                onClick={() => setPlatform("TIKTOK")}
              >
                TikTok
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Идентификатор</Label>
            <Input
              placeholder={
                platform === "YOUTUBE"
                  ? "Channel ID / URL / @handle"
                  : "username / profile URL"
              }
              value={identifier}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setIdentifier(e.target.value)}
            />
            <div className="text-xs text-muted-foreground">
              Для YouTube лучше всего вставлять `UC...`.
            </div>
          </div>

          <Button
            type="button"
            className="w-full"
            disabled={isBusy || identifier.trim().length < 2}
            onClick={addChannel}
          >
            Добавить
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>Каналы</CardTitle>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Лимит по умолчанию</Label>
              <Input
                type="number"
                className="h-8 w-20"
                min={1}
                max={100}
                value={defaultLimit}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDefaultLimitSafe(parseInt(e.target.value) || 30)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {channels.map((c: ChannelDto) => {
                const s = getChannelSettings(c.id);
                return (
                  <Card key={c.id} className="border-border/60">
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                            {c.avatarUrl ? (
                              <img
                                src={c.avatarUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{c.platform}</Badge>
                              <div className="truncate font-medium">
                                {c.displayName ?? c.externalId}
                              </div>
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
                              {c.handle ?? c.url ?? ""}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 md:items-end">
                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            <div>
                              <span className="text-foreground">
                                {c.subscribersCount}
                              </span>
                              {" "}
                              подписч.
                            </div>
                            <div>
                              <span className="text-foreground">
                                {(c.videosCount ?? 0).toString()}
                              </span>
                              {" "}
                              видео
                            </div>
                            <div>
                              <span className="text-foreground">
                                {c.totalViewsCount}
                              </span>
                              {" "}
                              просмотров
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isBusy}
                              onClick={() => toggleSettings(c.id)}
                              title="Настройки парсинга"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              disabled={isBusy}
                              onClick={() => fetchChannel(c.id, s.limit)}
                            >
                              Парсить {s.limit}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isBusy}
                              onClick={() => clearChannelVideos(c.id)}
                              title="Очистить видео"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={isBusy}
                              onClick={() => removeChannel(c.id)}
                            >
                              Удалить
                            </Button>
                          </div>
                        </div>
                      </div>

                      {s.showSettings ? (
                        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                          <div className="text-sm">Настройки парсинга</div>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">Лимит</Label>
                            <Input
                              type="number"
                              className="h-8 w-20"
                              min={1}
                              max={100}
                              value={s.limit}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLimit(c.id, parseInt(e.target.value) || defaultLimit)}
                            />
                          </div>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}

              {channels.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Каналов пока нет
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
