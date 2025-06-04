import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const token = await getToken({ req });

  if (!token?.accessToken) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { operation, target, url, payload } = await req.json();

  if (operation !== "query" || target !== "graphql" || !url || !payload?.query) {
    return new NextResponse("Invalid proxy request", { status: 400 });
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: payload.query,
      variables: payload.variables ?? {},
    }),
  });

  const data = await res.json();

  return res.ok
    ? NextResponse.json(data)
    : new NextResponse("GraphQL error", { status: res.status });
}
