import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const sessionCookies = await cookies();
  const sessionToken = sessionCookies.get("next-auth.session-token")?.value;

  if (!sessionToken) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const tracker = await fetch(`${process.env.RASA_URL}/conversations/${sessionToken}/tracker`);
  const data = await tracker.json();

  type Event = { event: string; custom?: Record<string, unknown> };
  const customMessages = (data.events as Event[])
    .filter((e: Event) => e.event === "bot" && e.custom)
    .map((e: Event) => e.custom);

  return NextResponse.json({ history: customMessages });
}
