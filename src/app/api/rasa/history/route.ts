import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { getRasaUrlForRequest } from "@/lib/rasaConfig";

export async function GET() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const sessionToken = cookieStore.get("next-auth.session-token")?.value;

  if (!sessionToken) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const apiUrl = getRasaUrlForRequest(headerStore, new Map(cookieStore.getAll().map(c => [c.name, c.value])));
  if (!apiUrl) {
    return new NextResponse("Rasa not configured", { status: 500 });
  }
  const tracker = await fetch(`${apiUrl}/conversations/${sessionToken}/tracker`);
  const data = await tracker.json();

  type Event = { event: string; custom?: Record<string, unknown> };
  const customMessages = (data.events as Event[])
    .filter((e: Event) => e.event === "bot" && e.custom)
    .map((e: Event) => e.custom);

  return NextResponse.json({ history: customMessages });
}
