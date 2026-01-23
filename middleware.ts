import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { adminCookieName, verifyAdminToken } from "@/lib/auth";

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/orders/check", "/api/admin/:path*"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/orders/check")) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "anonymous";
    const result = await checkRateLimit(`order-check:${ip}`);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Too many requests. Please wait a moment and try again.",
        },
        { status: 429 }
      );
    }
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (pathname.startsWith("/admin/login")) {
      return NextResponse.next();
    }

    const token = request.cookies.get(adminCookieName)?.value;
    const authorized = await verifyAdminToken(token);

    if (!authorized) {
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}
