import { getEnv } from "@/lib/env";
import { promisify } from "util";
import { exec } from "child_process";
import path from "path";

const execAsync = promisify(exec);

interface InstagramProfile {
    username: string;
    full_name: string;
    biography: string;
    followers: number;
    following: number;
    is_verified: boolean;
    is_private: boolean;
    profile_pic_url: string;
    external_url: string | null;
    mediacount: number;
}

interface InstagramPost {
    shortcode: string;
    url: string;
    caption: string;
    date: string;
    likes: number;
    comments: number;
    is_video: boolean;
    video_view_count: number;
    typename: string;
    thumbnail_url: string;
}

interface InstagramScraperResult {
    success: boolean;
    profile?: InstagramProfile;
    posts?: InstagramPost[];
    total_posts?: number;
    error?: string;
    error_code?: string;
}

export async function scrapeInstagramProfile(
    username: string,
    limit: number = 30
): Promise<InstagramScraperResult> {
    const env = getEnv();

    // Get Instagram credentials from environment
    const igUsername = process.env.INSTAGRAM_USERNAME || "";
    const igPassword = process.env.INSTAGRAM_PASSWORD || "";

    // Path to Python script
    const scriptPath = path.join(process.cwd(), "scripts", "instagram_scraper.py");
    const pythonPath = path.join(process.cwd(), "venv", "bin", "python3");

    // Build command
    const args = [username, limit.toString()];
    if (igUsername && igPassword) {
        args.push(igUsername, igPassword);
    }

    const command = `${pythonPath} ${scriptPath} ${args.join(" ")}`;

    try {
        const { stdout, stderr } = await execAsync(command, {
            timeout: 60000 // 60 seconds timeout
        });

        if (stderr && !stderr.includes("Warning")) {
            console.error(`[instagram] stderr: ${stderr}`);
        }

        const result = JSON.parse(stdout) as InstagramScraperResult;
        return result;

    } catch (error: any) {
        console.error(`[instagram] error:`, error);

        // Try to parse error output as JSON
        if (error.stdout) {
            try {
                const result = JSON.parse(error.stdout) as InstagramScraperResult;
                return result;
            } catch {
                // Fall through to generic error
            }
        }

        return {
            success: false,
            error: error.message || "Unknown error",
            error_code: "SCRAPER_ERROR"
        };
    }
}

/**
 * Map Instagram scraper data to our Video format
 */
export function mapInstagramPost(post: InstagramPost) {
    return {
        externalId: post.shortcode,
        url: post.url,
        title: post.caption.substring(0, 200), // Limit title length
        description: post.caption,
        thumbnailUrl: post.thumbnail_url,
        viewsCount: post.is_video ? post.video_view_count.toString() : undefined,
        likesCount: post.likes.toString(),
        commentsCount: post.comments.toString(),
        publishedAt: post.date,
        raw: post
    };
}
