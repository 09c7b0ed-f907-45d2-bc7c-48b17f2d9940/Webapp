import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

type RasaButton = {
  title: string;
  payload: string;
};

type RasaAttachment = {
  type: string;
  payload: unknown;
};

type CustomGraphPayload =
  | {
      type: "line";
      data: {
        labels: string[];
        values: number[];
      };
    }
  | {
      type: "candlestick";
      data: {
        timestamps: string[];
        open: number[];
        high: number[];
        low: number[];
        close: number[];
      };
    };

type RasaResponse = {
  recipient_id: string;
  text?: string;
  image?: string;
  buttons?: RasaButton[];
  attachment?: RasaAttachment;
  custom?: CustomGraphPayload;
};

const apiUrl = process.env.RASA_URL;

function getSessionToken() {
  return (async () => {
    const sessionCookies = await cookies();
    return (
      sessionCookies.get("next-auth.session-token")?.value ||
      sessionCookies.get("__Secure-next-auth.session-token")?.value
    );
  })();
}

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  const sessionToken = await getSessionToken();

  if (!sessionToken) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const rasaRes = await fetch(`${apiUrl}/webhooks/rest/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: sessionToken,
      message: message,
    }),
  });

  const rawJson = await rasaRes.text();
  const rasaData: RasaResponse[] = JSON.parse(rawJson);
  const reply = rasaData
    .map((item) => item.text?.trim())
    .filter(Boolean)
    .join('\n');
  const custom = rasaData.find((r) => r.custom)?.custom ?? null;

  return NextResponse.json({ reply, custom });
}

export async function GET() {
  const sessionToken = await getSessionToken();

  if (!sessionToken) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const tracker = await fetch(`${process.env.RASA_URL}/conversations/${sessionToken}/tracker`);
  const data = await tracker.json();

  type TrackerEvent = {
    event: string;
    custom?: unknown;
    [key: string]: unknown;
  };

  const customMessages = (data.events as TrackerEvent[])
    .filter((e: TrackerEvent) => e.event === "bot" && e.custom)
    .map((e: TrackerEvent) => e.custom);

  return NextResponse.json({ history: customMessages });
}