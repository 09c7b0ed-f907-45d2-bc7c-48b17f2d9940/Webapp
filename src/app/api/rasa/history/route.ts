import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { getRasaUrlForRequest } from "@/lib/rasaConfig";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const token = await getToken({ req });
  const senderId = token?.sub ? String(token.sub) : null;

  if (!senderId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const apiUrl = getRasaUrlForRequest(headerStore, new Map(cookieStore.getAll().map(c => [c.name, c.value])));
  if (!apiUrl) {
    return new NextResponse("Rasa not configured", { status: 500 });
  }
  const tracker = await fetch(`${apiUrl}/conversations/${encodeURIComponent(senderId)}/tracker`);
  const data = await tracker.json();

  type Event = { event: string; text?: string; custom?: Record<string, unknown> };
  const botMessages = (data.events as Event[])
    .filter((e: Event) => e.event === "bot" && (typeof e.text === "string" || !!e.custom))
    .map((e: Event) => ({
      ...(typeof e.text === "string" ? { text: e.text } : {}),
      ...(e.custom ? { custom: e.custom } : {}),
    }));

  return NextResponse.json({ history: botMessages });
}
