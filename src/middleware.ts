import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from "@/locales/config";

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth?.token;

    const res = NextResponse.next();
  const hasLang = req.cookies.get('lang');
    if (!hasLang) {
      const accept = req.headers.get('accept-language') || '';
  const supported = SUPPORTED_LANGUAGES as readonly string[];
      const preferred = accept
        .split(',')
        .map(p => p.trim().split(';')[0])
        .map(code => code.split('-')[0])
        .find(code => supported.includes(code));
  const lang = (preferred as typeof SUPPORTED_LANGUAGES[number]) || DEFAULT_LANGUAGE;
      res.cookies.set('lang', lang, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
    }

    if (typeof token?.accessTokenExpires === "number") {
      if (Date.now() >= token.accessTokenExpires) {
        const url = req.nextUrl.clone();
        url.pathname = "/api/auth/signin";
        return NextResponse.redirect(url);
      }
    }

    if (token?.error === "RefreshAccessTokenError") {
      const url = req.nextUrl.clone();
      url.pathname = "/api/auth/signin";
      return NextResponse.redirect(url);
    }

    return res;
  },
  {
    pages: {
      signIn: "/api/auth/signin",
    },
  }
);

export const config = {
  matcher: ["/"],
};
