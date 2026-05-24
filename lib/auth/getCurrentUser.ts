import { headers, cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

function getBearerToken(value: string | null) {
  if (!value?.startsWith("Bearer ")) {
    return null;
  }

  return value.slice(7).trim() || null;
}

function getTokenFromCookieHeader(value: string | null) {
  if (!value) {
    return null;
  }

  return value
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("token="))
    ?.slice("token=".length) ?? null;
}

function getTokenFromRequest(request?: NextRequest | Request) {
  if (!request) {
    return null;
  }

  return (
    getBearerToken(request.headers.get("authorization")) ??
    request.headers.get("x-access-token") ??
    getTokenFromCookieHeader(request.headers.get("cookie"))
  );
}

function getTokenFromServerContext() {
  const headerStore = headers();

  return (
    getBearerToken(headerStore.get("authorization")) ??
    headerStore.get("x-access-token") ??
    cookies().get("token")?.value ??
    null
  );
}

export async function getCurrentUser(request?: NextRequest | Request) {
  const token = getTokenFromRequest(request) ?? getTokenFromServerContext();

  if (!token) {
    return null;
  }

  try {
    const payload = verifyToken(token);

    return prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        preferredCategories: true,
        createdAt: true,
      },
    });
  } catch {
    return null;
  }
}
