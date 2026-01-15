import Image from "next/image";
import Link from "next/link";
import type { Channel, Video } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

type VideoWithChannel = Video & { channel: Channel };

export function VideosTable({ videos }: { videos: VideoWithChannel[] }) {
  return (
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
        {videos.map((v) => (
          <TableRow key={v.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="relative h-14 w-24 overflow-hidden rounded-md border border-border">
                  {v.thumbnailUrl ? (
                    <Image
                      src={v.thumbnailUrl}
                      alt={v.title ?? "thumbnail"}
                      fill
                      className="object-cover"
                    />
                  ) : null}
                </div>
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
              <div className="text-sm font-medium">
                {v.channel.displayName ?? v.channel.externalId}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{v.platform}</Badge>
            </TableCell>
            <TableCell>{(v.viewsCount ?? 0n).toString()}</TableCell>
            <TableCell>{(v.likesCount ?? 0n).toString()}</TableCell>
            <TableCell>{(v.commentsCount ?? 0n).toString()}</TableCell>
            <TableCell>
              {v.publishedAt ? v.publishedAt.toISOString().slice(0, 10) : ""}
            </TableCell>
          </TableRow>
        ))}

        {videos.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="py-10 text-center">
              <div className="text-sm text-muted-foreground">Видео пока нет</div>
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  );
}
