import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { isCategory } from "@/lib/categoryTypes";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const preferencesSchema = z.object({
  preferredCategories: z.array(z.string()).max(6),
});

function normalizePreferences(categories: string[]) {
  return Array.from(new Set(categories.filter(isCategory)));
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      preferredCategories: user.preferredCategories,
    });
  } catch (error) {
    console.error("[GET /api/preferences]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = preferencesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid preferences payload" }, { status: 400 });
    }

    const preferredCategories = normalizePreferences(parsed.data.preferredCategories);
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { preferredCategories },
      select: { preferredCategories: true },
    });

    return NextResponse.json({
      preferredCategories: updatedUser.preferredCategories,
    });
  } catch (error) {
    console.error("[PUT /api/preferences]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
