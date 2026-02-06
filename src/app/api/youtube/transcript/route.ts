import { NextRequest, NextResponse } from "next/server";
import { getApiUserId } from "@/lib/session";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

type TranscriptParams = {
    videoId: string;
    languages?: string[];
    listAvailable?: boolean;
};

type TranscriptEntry = {
    text: string;
    start: number;
    duration: number;
};

type TranscriptResponse = {
    success: boolean;
    video_id?: string;
    language?: string;
    language_name?: string;
    type?: "manual" | "auto";
    is_translatable?: boolean;
    transcript?: TranscriptEntry[];
    full_text?: string;
    total_entries?: number;
    transcripts?: Array<{
        language: string;
        language_code: string;
        is_generated: boolean;
        is_translatable: boolean;
    }>;
    total?: number;
    error?: string;
    error_code?: string;
};

export async function POST(req: NextRequest) {
    const userId = await getApiUserId();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    let params: TranscriptParams;
    try {
        params = await req.json();
    } catch {
        return new NextResponse("Invalid JSON", { status: 400 });
    }

    const { videoId, languages, listAvailable } = params;

    if (!videoId?.trim()) {
        return new NextResponse("Video ID is required", { status: 400 });
    }

    try {
        const scriptPath = path.join(process.cwd(), "scripts", "youtube_transcript.py");
        const venvPython = path.join(process.cwd(), "venv", "bin", "python3");

        // Check if virtual environment exists
        let pythonCommand = venvPython;
        try {
            await execAsync(`test -f ${venvPython}`);
        } catch {
            // Fall back to system python3
            pythonCommand = "python3";
        }

        let command = `${pythonCommand} ${scriptPath} "${videoId}"`;

        if (listAvailable) {
            command += " --list";
        } else if (languages && languages.length > 0) {
            command += ` "${languages.join(',')}"`;
        }

        console.log(`[youtube/transcript] Executing: ${command}`);

        const { stdout, stderr } = await execAsync(command, {
            maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large transcripts
        });

        if (stderr && !stderr.includes("DeprecationWarning")) {
            console.error(`[youtube/transcript] stderr:`, stderr);
        }

        const result: TranscriptResponse = JSON.parse(stdout);

        if (!result.success) {
            return NextResponse.json(result, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (err: any) {
        console.error("[youtube/transcript] Error:", err);

        // Try to parse error output
        if (err.stdout) {
            try {
                const errorResult = JSON.parse(err.stdout);
                return NextResponse.json(errorResult, { status: 400 });
            } catch {
                // Continue to generic error
            }
        }

        return NextResponse.json(
            {
                success: false,
                error: err.message || "Failed to fetch transcript",
                error_code: "SCRIPT_EXECUTION_ERROR",
            },
            { status: 500 }
        );
    }
}

// GET endpoint to fetch transcript via query params (for easier testing)
export async function GET(req: NextRequest) {
    const userId = await getApiUserId();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const videoId = searchParams.get("videoId");
    const languages = searchParams.get("languages")?.split(",") || ["ru", "en"];
    const listAvailable = searchParams.get("list") === "true";

    if (!videoId?.trim()) {
        return new NextResponse("Video ID is required", { status: 400 });
    }

    // Reuse POST logic
    const mockRequest = new Request(req.url, {
        method: "POST",
        headers: req.headers,
        body: JSON.stringify({ videoId, languages, listAvailable }),
    });

    return POST(mockRequest as NextRequest);
}
