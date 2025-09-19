import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { getRasaUrlForRequest } from "@/lib/rasaConfig";

export async function POST(req: NextRequest) {
  const token = await getToken({ req });

  if (!token?.accessToken) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { message } = await req.json();

  const apiUrl = getRasaUrlForRequest(req.headers, new Map(req.cookies.getAll().map(c => [c.name, c.value])));
  if (!apiUrl) {
    return new NextResponse("Rasa not configured", { status: 500 });
  }

  const rasaRes = await fetch(`${apiUrl}/webhooks/rest/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: token.accessToken,
      message,
    }),
  });

  interface RasaMessage {
    text?: string;
    custom?: unknown;
    [key: string]: unknown;
  }

  const rasaData: RasaMessage[] = await rasaRes.json();

  const reply = rasaData.map((m: RasaMessage) => m.text).filter(Boolean).join("\n");
  const custom = rasaData.find((m: RasaMessage) => m.custom)?.custom ?? null;

  return NextResponse.json({ reply, custom });
}
