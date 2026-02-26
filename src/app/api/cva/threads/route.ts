import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { getCvaBaseUrl } from "@/lib/cvaConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSubjectFromAccessToken(rawToken: string): string | null {
  const parts = rawToken.split(".");
  if (parts.length < 2) return null;

  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8")) as {
      sub?: unknown;
    };
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

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
  const subjectFromAccessToken = getSubjectFromAccessToken(String(token.accessToken));
  const subject = subjectFromAccessToken ?? (typeof token.sub === "string" ? token.sub : null);

  const payload =
    body && typeof body === "object"
      ? {
          ...(body as Record<string, unknown>),
          user:
            (body as Record<string, unknown>).user ??
            subject,
        }
      : { name: "Conversation", user: subject };

  if (!payload.user) {
    return NextResponse.json(
      { message: "Missing user subject for thread creation" },
      { status: 400 }
    );
  }

  const baseUrl = getCvaBaseUrl();

  const res = await fetch(`${baseUrl}/threads`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${String(token.accessToken)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return forwardResponse(res);
}
