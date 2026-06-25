import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type BookmarkDeleteRouteProps = {
  params: {
    id: string;
  };
};

export async function DELETE(request: NextRequest, { params }: BookmarkDeleteRouteProps) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookmark = await prisma.bookmark.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      select: { id: true },
    });

    if (!bookmark) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }

    await prisma.bookmark.delete({
      where: { id: bookmark.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/bookmarks/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
