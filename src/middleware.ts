import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE, clearSessionCookies, writeSessionCookies } from "@/lib/admin/cookies";
import { isExpiringSoon } from "@/lib/admin/jwt";
import { refreshSession } from "@/lib/supabase/auth";

/**
 * UX + token refresh only. This does NOT authorize anyone: every admin page, server action
 * and API route re-verifies the token with Supabase Auth and checks the staff role.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/admin/login";
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;

  const toLogin = () => {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = pathname === "/admin" ? "" : `?next=${encodeURIComponent(pathname)}`;
    const response = NextResponse.redirect(url);
    clearSessionCookies(response.cookies);
    return response;
  };

  if (!access && !refresh) return isLogin ? NextResponse.next() : toLogin();

  let response = NextResponse.next();

  if ((!access || isExpiringSoon(access)) && refresh) {
    try {
      const session = await refreshSession(refresh);
      request.cookies.set(ACCESS_COOKIE, session.access_token);
      request.cookies.set(REFRESH_COOKIE, session.refresh_token);
      response = NextResponse.next({ request });
      writeSessionCookies(response.cookies, session);
    } catch {
      return isLogin ? NextResponse.next() : toLogin();
    }
  }

  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = { matcher: ["/admin/:path*"] };
