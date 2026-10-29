import { NextRequest, NextResponse } from "next/server";
import { siteMode } from "@/lib/site-mode";

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const cutdesk = siteMode() === "cutdesk";
  const privateRoute = path === "/api" || path.startsWith("/api/") || path === "/cutdesk" || path.startsWith("/cutdesk/") || path.startsWith("/brand/");
  const portfolioImage = ["/icon", "/apple-icon", "/opengraph-image", "/twitter-image", "/favicon.svg"].includes(path);
  if ((!cutdesk && privateRoute) || (cutdesk && portfolioImage)) {
    return new NextResponse(null, { status: 404, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
  }
  if (cutdesk) {
    const target = request.nextUrl.clone();
    target.pathname = "/cutdesk";
    const response = path === "/"
      ? NextResponse.rewrite(target)
      : NextResponse.next();
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/cutdesk/:path*", "/api/:path*", "/brand/:path*", "/icon", "/apple-icon", "/opengraph-image", "/twitter-image", "/favicon.svg"],
};
