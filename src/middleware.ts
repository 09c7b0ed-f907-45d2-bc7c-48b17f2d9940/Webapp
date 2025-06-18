import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth?.token;

    if (typeof token?.accessTokenExpires === "number") {
      if (Date.now() >= token.accessTokenExpires) {
        const url = req.nextUrl.clone();
        url.pathname = "/api/auth/signin";
        return NextResponse.redirect(url);
      }
    } else {
      console.log("Session does not have an 'accessTokenExpires' property.");
    }

    if (token?.error === "RefreshAccessTokenError") {
      const url = req.nextUrl.clone();
      url.pathname = "/api/auth/signin";
      return NextResponse.redirect(url);
    }
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
