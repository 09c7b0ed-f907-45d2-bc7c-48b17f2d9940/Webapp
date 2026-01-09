import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { addSubscriberForSender } from "@/lib/sseBus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = await getToken({ req });

  if (!token?.accessToken) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const senderId = String(token.accessToken);
  const encoder = new TextEncoder();
  const clientSignal: AbortSignal | undefined = (req as unknown as { signal?: AbortSignal }).signal;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (payload: unknown) => {
        const data = JSON.stringify(payload ?? {});
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      const unsubscribe = addSubscriberForSender(senderId, send);

      // Initial event so the client knows the stream is live
      send({ type: "connected" });

      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(`: keep-alive\n\n`));
      }, 25000);

      const cleanup = () => {
        clearInterval(keepAlive);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // ignore
        }
      };

      if (clientSignal) {
        clientSignal.addEventListener("abort", cleanup, { once: true });
      }
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store",
      Connection: "keep-alive",
    },
  });
}
