import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { getCvaBaseUrl } from "@/lib/cvaConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ id: string }>;
};

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

export async function GET(req: NextRequest, { params }: Params) {
  const token = await getToken({ req });

  if (!token?.accessToken) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const baseUrl = getCvaBaseUrl();
  const query = req.nextUrl.searchParams.toString();
  const upstreamUrl = `${baseUrl}/threads/${encodeURIComponent(id)}/messages${query ? `?${query}` : ""}`;

  const res = await fetch(upstreamUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${String(token.accessToken)}`,
    },
    cache: "no-store",
  });

  return forwardResponse(res);
}

export async function POST(req: NextRequest, { params }: Params) {
  const token = await getToken({ req });

  if (!token?.accessToken) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const payload = body && typeof body === "object" ? { ...(body as Record<string, unknown>) } : {};

  if (payload.content && !Array.isArray(payload.content)) {
    payload.content = [payload.content];
  }
  const { id } = await params;
  const baseUrl = getCvaBaseUrl();

  const res = await fetch(`${baseUrl}/threads/${encodeURIComponent(id)}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${String(token.accessToken)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return forwardResponse(res);
}
