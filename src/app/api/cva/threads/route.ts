import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { getCvaBaseUrl } from "@/lib/cvaConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function forwardResponse(res: Response) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: contentType ? { "Content-Type": contentType } : undefined,
  });
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req });

  if (!token?.accessToken) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const baseUrl = getCvaBaseUrl();
  const query = req.nextUrl.searchParams.toString();
  const upstreamUrl = `${baseUrl}/threads${query ? `?${query}` : ""}`;

  const res = await fetch(upstreamUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${String(token.accessToken)}`,
    },
    cache: "no-store",
  });

  return forwardResponse(res);
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req });

  if (!token?.accessToken) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const baseUrl = getCvaBaseUrl();

  const res = await fetch(`${baseUrl}/threads`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${String(token.accessToken)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return forwardResponse(res);
}
