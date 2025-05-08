import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const rateLimit = new Map();

const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = {
  authenticated: 120,
  unauthenticated: 60,
};

const RATE_LIMITED_METHODS = ["POST", "PUT", "DELETE", "GET"];

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/uploads/")) {
    const response = NextResponse.next();

    response.headers.set("Cache-Control", "public, max-age=31536000");
    response.headers.set("X-Content-Type-Options", "nosniff");

    return response;
  }

  if (!RATE_LIMITED_METHODS.includes(request.method)) {
    return NextResponse.next();
  }
  try {
    const token = await getToken({ req: request });

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const key = `${ip}:${token ? "auth" : "unauth"}`;

    const now = Date.now();
    const windowData = rateLimit.get(key) || {
      start: now,
      count: 0,
    };

    if (now - windowData.start > RATE_LIMIT_WINDOW) {
      windowData.start = now;
      windowData.count = 0;
    }

    windowData.count++;

    rateLimit.set(key, windowData);

    const maxRequests = token
      ? MAX_REQUESTS_PER_WINDOW.authenticated
      : MAX_REQUESTS_PER_WINDOW.unauthenticated;

    if (windowData.count > maxRequests) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: "Too Many Requests",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": (
              windowData.start + RATE_LIMIT_WINDOW
            ).toString(),
          },
        },
      );
    }

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", maxRequests.toString());
    response.headers.set(
      "X-RateLimit-Remaining",
      Math.max(0, maxRequests - windowData.count).toString(),
    );
    response.headers.set(
      "X-RateLimit-Reset",
      (windowData.start + RATE_LIMIT_WINDOW).toString(),
    );

    return response;
  } catch (error) {
    console.error("Rate limiting error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/auth/* (auth endpoints)
     * 2. /_next/* (Next.js internals)
     * 3. /favicon.ico, /sitemap.xml (static files)
     */
    "/((?!api/auth|_next|favicon.ico|sitemap.xml).*)",
  ],
};
