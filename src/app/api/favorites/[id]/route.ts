import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getApiUserId } from "@/lib/session";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getApiUserId();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    // Try to find by videoId first (YouTube video ID)
    let favorite = await prisma.favorite.findFirst({
        where: { videoId: id, userId }
    });

    // If not found, try to find by favorite ID (UUID)
    if (!favorite) {
        try {
            favorite = await prisma.favorite.findFirst({
                where: { id, userId }
            });
        } catch {
            // Invalid UUID format, ignore
        }
    }

    if (!favorite) {
        return new NextResponse("Not found", { status: 404 });
    }

    await prisma.favorite.delete({
        where: { id: favorite.id }
    });

    return NextResponse.json({ deleted: true });
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await getApiUserId();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    let body: { transcript?: string };
    try {
        body = await req.json();
    } catch {
        return new NextResponse("Invalid JSON", { status: 400 });
    }

    // Find the favorite
    const favorite = await prisma.favorite.findFirst({
        where: { id, userId }
    });

    if (!favorite) {
        return new NextResponse("Not found", { status: 404 });
    }

    // Update the transcript
    const updated = await prisma.favorite.update({
        where: { id: favorite.id },
        data: { transcript: body.transcript }
    });

    return NextResponse.json({
        success: true,
        id: updated.id,
        hasTranscript: !!updated.transcript
    });
}
