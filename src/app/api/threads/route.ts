import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createThreadForUser, listThreadsForUser } from "@/lib/threadRegistryStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  const userId = token?.sub ? String(token.sub) : null;
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const threads = await listThreadsForUser(userId);
  return NextResponse.json({ results: threads });
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  const userId = token?.sub ? String(token.sub) : null;
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const name = typeof payload.name === "string" ? payload.name : undefined;

  const thread = await createThreadForUser(userId, name);
  return NextResponse.json(thread, { status: 201 });
}
