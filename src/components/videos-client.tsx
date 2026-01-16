"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Filter, X, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import type { VideoDto, ChannelDto } from "@/lib/dto";

type SortField = "publishedAt" | "viewsCount" | "likesCount" | "commentsCount";
type SortDir = "asc" | "desc";

type Props = {
  initialVideos: VideoDto[];
  channels: ChannelDto[];
};

export function VideosClient({ initialVideos, channels }: Props) {
  const router = useRouter();
  const { success, error } = useToast();

  // Filters
  const [platform, setPlatform] = useState<string>("all");
  const [channelId, setChannelId] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("publishedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [minViews, setMinViews] = useState<string>("");
  const [minLikes, setMinLikes] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Preview modal
  const [previewVideo, setPreviewVideo] = useState<VideoDto | null>(null);

  // Delete
  const [isBusy, setIsBusy] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());

  const filteredVideos = useMemo(() => {
    let result = [...initialVideos];

    // Platform filter
    if (platform !== "all") {
      result = result.filter((v) => v.platform === platform);
    }

    // Channel filter
    if (channelId !== "all") {
      result = result.filter((v) => v.channelId === channelId);
    }

    // Min views
    if (minViews) {
      const min = BigInt(minViews);
      result = result.filter((v) => BigInt(v.viewsCount) >= min);
    }

    // Min likes
    if (minLikes) {
      const min = BigInt(minLikes);
      result = result.filter((v) => BigInt(v.likesCount) >= min);
    }

    // Sort
    result.sort((a, b) => {
      let aVal: bigint | string;
      let bVal: bigint | string;

      if (sortField === "publishedAt") {
        aVal = a.publishedAt ?? "";
        bVal = b.publishedAt ?? "";
        return sortDir === "desc"
          ? bVal.localeCompare(String(aVal))
          : String(aVal).localeCompare(bVal);
      }

      const aCount = sortField === "viewsCount" ? a.viewsCount : sortField === "likesCount" ? a.likesCount : a.commentsCount;
      const bCount = sortField === "viewsCount" ? b.viewsCount : sortField === "likesCount" ? b.likesCount : b.commentsCount;
      aVal = BigInt(aCount);
      bVal = BigInt(bCount);
      return sortDir === "desc" ? Number(bVal - aVal) : Number(aVal - bVal);
    });

    return result;
  }, [initialVideos, platform, channelId, sortField, sortDir, minViews, minLikes]);

  async function deleteVideos(mode: "all" | "channels") {
    setIsBusy(true);
    try {
      const channelIds = mode === "channels" ? Array.from(selectedChannels) : undefined;
      const res = await fetch("/api/videos", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ channelIds })
      });
      if (!res.ok) {
        const text = await res.text();
        error(text || "Ошибка удаления");
        return;
      }
      const data = await res.json();
      success(`Удалено видео: ${data.deleted ?? 0}`);
      setDeleteMode(false);
      setSelectedChannels(new Set());
      router.refresh();
    } catch (e) {
      error(e instanceof Error ? e.message : "Ошибка сети");
    } finally {
      setIsBusy(false);
    }
  }

  function toggleChannel(id: string) {
    const next = new Set(selectedChannels);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedChannels(next);
  }

  const platforms = Array.from(new Set(initialVideos.map((v) => v.platform)));

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
        >
          <option value="all">Все платформы</option>
          {platforms.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
        >
          <option value="all">Все каналы</option>
          {channels.map((c) => (
            <option key={c.id} value={c.id}>
              {c.displayName ?? c.externalId}
            </option>
          ))}
        </select>

        <select
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={`${sortField}-${sortDir}`}
          onChange={(e) => {
            const [f, d] = e.target.value.split("-") as [SortField, SortDir];
            setSortField(f);
            setSortDir(d);
          }}
        >
          <option value="publishedAt-desc">Дата ↓</option>
          <option value="publishedAt-asc">Дата ↑</option>
          <option value="viewsCount-desc">Просмотры ↓</option>
          <option value="viewsCount-asc">Просмотры ↑</option>
          <option value="likesCount-desc">Лайки ↓</option>
          <option value="likesCount-asc">Лайки ↑</option>
          <option value="commentsCount-desc">Комментарии ↓</option>
          <option value="commentsCount-asc">Комментарии ↑</option>
        </select>

        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" />
          Фильтры
        </Button>

        <Button
          variant="secondary"
          size="sm"
          className="gap-2"
          onClick={() => setDeleteMode(!deleteMode)}
        >
          <Trash2 className="h-4 w-4" />
          Удалить видео
        </Button>

        <div className="ml-auto text-sm text-muted-foreground">
          Показано: {filteredVideos.length} из {initialVideos.length}
        </div>
      </div>

      {/* Stats filters */}
      {showFilters && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Фильтры по статистике</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 pb-4">
            <div className="space-y-1">
              <Label className="text-xs">Мин. просмотров</Label>
              <Input
                type="number"
                placeholder="0"
                className="w-32"
                value={minViews}
                onChange={(e) => setMinViews(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Мин. лайков</Label>
              <Input
                type="number"
                placeholder="0"
                className="w-32"
                value={minLikes}
                onChange={(e) => setMinLikes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete mode */}
      {deleteMode && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Удаление видео</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pb-4">
            <div className="flex flex-wrap gap-2">
              {channels.map((c) => (
                <Button
                  key={c.id}
                  variant={selectedChannels.has(c.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleChannel(c.id)}
                >
                  {c.displayName ?? c.externalId}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={isBusy || selectedChannels.size === 0}
                onClick={() => deleteVideos("channels")}
              >
                Удалить с выбранных каналов ({selectedChannels.size})
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={isBusy}
                onClick={() => deleteVideos("all")}
              >
                Удалить все видео
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDeleteMode(false);
                  setSelectedChannels(new Set());
                }}
              >
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Видео</TableHead>
            <TableHead>Канал</TableHead>
            <TableHead>Платформа</TableHead>
            <TableHead>Просмотры</TableHead>
            <TableHead>Лайки</TableHead>
            <TableHead>Комментарии</TableHead>
            <TableHead>Дата</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredVideos.map((v) => (
            <TableRow key={v.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="relative h-14 w-24 flex-shrink-0 overflow-hidden rounded-md border border-border hover:ring-2 hover:ring-primary"
                    onClick={() => setPreviewVideo(v)}
                  >
                    {v.thumbnailUrl ? (
                      <Image
                        src={v.thumbnailUrl}
                        alt={v.title ?? "thumbnail"}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
                        No preview
                      </div>
                    )}
                  </button>
                  <div className="min-w-0">
                    <Link
                      href={v.url}
                      target="_blank"
                      className="line-clamp-2 text-sm font-medium hover:underline"
                    >
                      {v.title ?? v.url}
                    </Link>
                    <div className="line-clamp-1 text-xs text-muted-foreground">
                      {v.description ?? ""}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Link
                  href={`/channels?highlight=${v.channelId}`}
                  className="text-sm font-medium hover:underline"
                >
                  {v.channelName ?? v.channelId}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{v.platform}</Badge>
              </TableCell>
              <TableCell>{v.viewsCount}</TableCell>
              <TableCell>{v.likesCount}</TableCell>
              <TableCell>{v.commentsCount}</TableCell>
              <TableCell>
                {v.publishedAt ? v.publishedAt.slice(0, 10) : ""}
              </TableCell>
            </TableRow>
          ))}

          {filteredVideos.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="py-10 text-center">
                <div className="text-sm text-muted-foreground">Видео не найдено</div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Preview Modal */}
      {previewVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setPreviewVideo(null)}
        >
          <div
            className="relative w-full max-w-3xl rounded-lg bg-card p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-2 top-2 rounded-full p-1 hover:bg-white/10"
              onClick={() => setPreviewVideo(null)}
            >
              <X className="h-5 w-5" />
            </button>
            <div className="aspect-video w-full overflow-hidden rounded-md bg-black">
              {previewVideo.thumbnailUrl ? (
                <Image
                  src={previewVideo.thumbnailUrl}
                  alt={previewVideo.title ?? "preview"}
                  fill
                  className="object-contain"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  Превью недоступно
                </div>
              )}
            </div>
            <div className="mt-4 space-y-2">
              <h3 className="text-lg font-semibold">{previewVideo.title ?? "Без названия"}</h3>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {previewVideo.description ?? ""}
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span>👀 {previewVideo.viewsCount}</span>
                <span>❤️ {previewVideo.likesCount}</span>
                <span>💬 {previewVideo.commentsCount}</span>
              </div>
              <Link
                href={previewVideo.url}
                target="_blank"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                Открыть оригинал
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
