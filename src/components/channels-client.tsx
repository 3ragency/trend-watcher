"use client";

import React, { useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
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
  
  // Fetch settings per channel
  const [fetchSettings, setFetchSettings] = useState<Record<string, { limit: number; showSettings: boolean }>>({});

  const channels = useMemo(() => initialChannels, [initialChannels]);
  
  function getChannelSettings(id: string) {
    return fetchSettings[id] ?? { limit: 30, showSettings: false };
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
    setFetchSettings((prev) => ({
      ...prev,
      [id]: { ...current, limit: Math.max(1, Math.min(100, limit)) }
    }));
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
      success(`Загружено видео: ${data.itemsFetched ?? 0}`);
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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
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

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Список каналов</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Платформа</TableHead>
                <TableHead>Канал</TableHead>
                <TableHead>Подписчики</TableHead>
                <TableHead>Видео</TableHead>
                <TableHead>Просмотры</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channels.map((c: ChannelDto) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Badge variant="secondary">{c.platform}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {c.displayName ?? c.externalId}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {c.handle ?? c.url ?? ""}
                    </div>
                  </TableCell>
                  <TableCell>{c.subscribersCount}</TableCell>
                  <TableCell>{(c.videosCount ?? 0).toString()}</TableCell>
                  <TableCell>{c.totalViewsCount}</TableCell>
                  <TableCell className="text-right">
                    <div className="space-y-2">
                      <div className="flex justify-end gap-1">
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
                          onClick={() => fetchChannel(c.id, getChannelSettings(c.id).limit)}
                        >
                          Парсить {getChannelSettings(c.id).limit}
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
                      {getChannelSettings(c.id).showSettings && (
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <Label className="text-xs">Лимит:</Label>
                          <Input
                            type="number"
                            className="h-7 w-16 text-xs"
                            min={1}
                            max={100}
                            value={getChannelSettings(c.id).limit}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLimit(c.id, parseInt(e.target.value) || 30)}
                          />
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {channels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center">
                    <div className="text-sm text-muted-foreground">
                      Каналов пока нет
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
