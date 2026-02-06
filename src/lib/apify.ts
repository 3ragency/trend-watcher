import { getEnv } from "@/lib/env";

const BASE = "https://api.apify.com/v2";

async function apifyFetch<T>(url: string, init?: RequestInit) {
  const env = getEnv();
  if (!env.APIFY_TOKEN) throw new Error("APIFY_TOKEN is not set");
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`Apify error: ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

type ApifyRunResponse = {
  data: {
    defaultDatasetId?: string;
  };
};

export async function runApifyActor(actorId: string, input: unknown) {
  const env = getEnv();
  if (!actorId) throw new Error("Apify actor id is not set");
  const url = `${BASE}/acts/${encodeURIComponent(actorId)}/runs?token=${encodeURIComponent(env.APIFY_TOKEN)}&waitForFinish=180`;
  const run = await apifyFetch<ApifyRunResponse>(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input)
  });
  const datasetId = run.data.defaultDatasetId;
  if (!datasetId) throw new Error("Apify run did not return defaultDatasetId");
  return datasetId;
}

export async function readApifyDatasetItems(datasetId: string, limit: number) {
  const env = getEnv();
  const url = `${BASE}/datasets/${encodeURIComponent(datasetId)}/items?token=${encodeURIComponent(env.APIFY_TOKEN)}&clean=true&format=json&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Apify dataset error: ${res.status} ${await res.text()}`);
  return (await res.json()) as unknown[];
}

export function guessApifyVideo(item: any) {
  const externalId =
    item?.id ??
    item?.videoId ??
    item?.postId ??
    item?.shortCode ??
    item?.code ??
    item?.awemeId ??
    item?.aweme_id ??
    item?.url;

  const url =
    item?.url ??
    item?.videoUrl ??
    item?.webVideoUrl ??
    item?.postUrl ??
    item?.permalink ??
    item?.webVideoUrl;

  const title = item?.title ?? item?.caption ?? item?.text ?? item?.desc;
  const description = item?.description ?? item?.caption ?? item?.text;

  const thumbnailUrl =
    item?.thumbnailUrl ??
    item?.thumbnail ??
    item?.displayUrl ??
    item?.imageUrl ??
    item?.videoThumbnail ??
    item?.coverUrl ??
    item?.cover ??
    item?.coverImage ??
    item?.videoMeta?.coverUrl ??
    item?.videoMeta?.cover;

  const viewsCount =
    item?.views ??
    item?.viewCount ??
    item?.playCount ??
    item?.videoPlayCount ??
    item?.plays ??
    item?.videoViewCount ??
    item?.stats?.playCount;

  const likesCount =
    item?.likes ??
    item?.likeCount ??
    item?.likesCount ??
    item?.diggCount ??
    item?.stats?.diggCount;
  const commentsCount =
    item?.comments ??
    item?.commentCount ??
    item?.commentsCount ??
    item?.stats?.commentCount;

  const publishedAt =
    item?.publishedAt ??
    item?.takenAt ??
    item?.timestamp ??
    item?.createTime ??
    item?.createdAt;

  return {
    externalId: externalId ? String(externalId) : undefined,
    url: url ? String(url) : undefined,
    title: title ? String(title) : undefined,
    description: description ? String(description) : undefined,
    thumbnailUrl: thumbnailUrl ? String(thumbnailUrl) : undefined,
    viewsCount: viewsCount !== undefined ? String(viewsCount) : undefined,
    likesCount: likesCount !== undefined ? String(likesCount) : undefined,
    commentsCount: commentsCount !== undefined ? String(commentsCount) : undefined,
    publishedAt: publishedAt !== undefined ? String(publishedAt) : undefined,
    raw: item
  };
}

export function guessApifyProfile(item: any) {
  // Extract author metadata from various possible fields
  const author = item?.authorMeta ?? item?.author ?? item?.owner ?? item?.user;

  if (!author) return null;

  const displayName =
    author?.name ??
    author?.displayName ??
    author?.nickname ??
    author?.fullName ??
    author?.title;

  const handle =
    author?.username ??
    author?.handle ??
    author?.nickName ??
    author?.userName;

  const avatarUrl =
    author?.avatar ??
    author?.avatarUrl ??
    author?.profilePicUrl ??
    author?.profilePicture ??
    author?.picture ??
    author?.image ??
    author?.profilePic;

  const subscribersCount =
    author?.followers ??
    author?.followerCount ??
    author?.followersCount ??
    author?.subscribers ??
    author?.subscriberCount ??
    author?.fans ??
    author?.fanCount;

  return {
    displayName: displayName ? String(displayName) : undefined,
    handle: handle ? String(handle) : undefined,
    avatarUrl: avatarUrl ? String(avatarUrl) : undefined,
    subscribersCount: subscribersCount !== undefined ? String(subscribersCount) : undefined,
  };
}
