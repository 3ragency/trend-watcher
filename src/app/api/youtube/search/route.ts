import { NextRequest, NextResponse } from "next/server";
import { getApiUserId } from "@/lib/session";
import { getEnv } from "@/lib/env";

const BASE = "https://www.googleapis.com/youtube/v3";

type SearchParams = {
    region: string;
    query: string;
    duration: string;
    sortBy: string;
    maxResults: number;
};

type VideoItem = {
    id: string;
    snippet?: {
        title?: string;
        channelTitle?: string;
        channelId?: string;
        publishedAt?: string;
        thumbnails?: { medium?: { url?: string }; high?: { url?: string } };
    };
    statistics?: {
        viewCount?: string;
        likeCount?: string;
        commentCount?: string;
    };
    contentDetails?: {
        duration?: string;
    };
};

// Parse ISO 8601 duration (PT1H30M45S) to seconds
function parseDuration(iso: string | undefined): number | undefined {
    if (!iso) return undefined;
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return undefined;
    const hours = parseInt(match[1] || "0", 10);
    const minutes = parseInt(match[2] || "0", 10);
    const seconds = parseInt(match[3] || "0", 10);
    return hours * 3600 + minutes * 60 + seconds;
}

export async function POST(req: NextRequest) {
    const userId = await getApiUserId();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const env = getEnv();
    if (!env.YOUTUBE_API_KEY) {
        return new NextResponse("YouTube API key not configured", { status: 500 });
    }

    let params: SearchParams;
    try {
        params = await req.json();
    } catch {
        return new NextResponse("Invalid JSON", { status: 400 });
    }

    const { region, query, duration, sortBy, maxResults } = params;

    if (!query?.trim()) {
        return new NextResponse("Query is required", { status: 400 });
    }

    // Limit to reasonable maximum (API cost consideration)
    const targetResults = Math.min(maxResults || 50, 200);

    try {
        const allVideoIds: string[] = [];
        let pageToken: string | undefined = undefined;

        // Paginate to collect enough video IDs
        while (allVideoIds.length < targetResults) {
            const remaining = targetResults - allVideoIds.length;
            const batchSize = Math.min(remaining, 50); // YouTube max is 50 per request

            const regionCode = region || "US";

            // Map region to language for better localization
            const langMap: Record<string, string> = {
                RU: "ru", US: "en", GB: "en", DE: "de", FR: "fr",
                JP: "ja", KR: "ko", BR: "pt", IN: "hi", UA: "uk",
                KZ: "kk", BY: "be", UZ: "uz"
            };
            const relevanceLanguage = langMap[regionCode] || "en";

            console.log(`[youtube/search] Searching: region=${regionCode} lang=${relevanceLanguage} query="${query}" page=${allVideoIds.length}`);

            const searchParams = new URLSearchParams({
                part: "snippet",
                q: query,
                type: "video",
                regionCode: regionCode,
                relevanceLanguage: relevanceLanguage,
                order: sortBy || "viewCount",
                maxResults: String(batchSize),
                key: env.YOUTUBE_API_KEY
            });

            if (duration && duration !== "any") {
                searchParams.set("videoDuration", duration);
            }

            if (pageToken) {
                searchParams.set("pageToken", pageToken);
            }

            const searchRes = await fetch(`${BASE}/search?${searchParams}`);
            if (!searchRes.ok) {
                const text = await searchRes.text();
                console.error("[youtube/search] Search error:", text);
                break; // Stop pagination on error, return what we have
            }

            const searchData = await searchRes.json();
            const videoIds = (searchData.items || [])
                .map((item: { id?: { videoId?: string } }) => item.id?.videoId)
                .filter(Boolean);

            allVideoIds.push(...videoIds);

            // Check if there's a next page
            pageToken = searchData.nextPageToken;
            if (!pageToken) break;
        }

        if (allVideoIds.length === 0) {
            return NextResponse.json({ videos: [] });
        }

        // Get video statistics (batch in groups of 50)
        const allVideoStats: VideoItem[] = [];
        for (let i = 0; i < allVideoIds.length; i += 50) {
            const batch = allVideoIds.slice(i, i + 50);
            const statsParams = new URLSearchParams({
                part: "snippet,statistics,contentDetails",
                id: batch.join(","),
                key: env.YOUTUBE_API_KEY
            });

            const statsRes = await fetch(`${BASE}/videos?${statsParams}`);
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                allVideoStats.push(...(statsData.items || []));
            }
        }

        // Get channel IDs to fetch subscriber counts
        const channelIds = allVideoStats
            .map((v) => v.snippet?.channelId)
            .filter(Boolean);

        const uniqueChannelIds = [...new Set(channelIds)] as string[];

        let channelStats: Record<string, string> = {};
        // Batch channel requests (max 50 per request)
        for (let i = 0; i < uniqueChannelIds.length; i += 50) {
            const batch = uniqueChannelIds.slice(i, i + 50);
            const channelParams = new URLSearchParams({
                part: "statistics",
                id: batch.join(","),
                key: env.YOUTUBE_API_KEY
            });

            const channelRes = await fetch(`${BASE}/channels?${channelParams}`);
            if (channelRes.ok) {
                const channelData = await channelRes.json();
                (channelData.items || []).forEach((ch: { id: string; statistics?: { subscriberCount?: string } }) => {
                    channelStats[ch.id] = ch.statistics?.subscriberCount || "0";
                });
            }
        }

        const videos = allVideoStats.map((v) => ({
            id: v.id,
            title: v.snippet?.title || "",
            thumbnailUrl: v.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.high?.url || "",
            publishedAt: v.snippet?.publishedAt || "",
            channelTitle: v.snippet?.channelTitle || "",
            subscribersCount: channelStats[v.snippet?.channelId || ""] || "0",
            viewsCount: v.statistics?.viewCount || "0",
            likesCount: v.statistics?.likeCount || "0",
            commentsCount: v.statistics?.commentCount || "0",
            durationSeconds: parseDuration(v.contentDetails?.duration),
            isFavorite: false
        }));

        return NextResponse.json({ videos });
    } catch (err) {
        console.error("[youtube/search] Error:", err);
        return new NextResponse("Search failed", { status: 500 });
    }
}
