import { NextResponse } from "next/server";

export const TRACE_ID_HEADER = "x-trace-id";

export function normalizeTraceId(value: string | null | undefined): string | null {
  if (!value) return null;

  const normalized = value.trim();
  if (!normalized || /[\r\n]/.test(normalized)) {
    return null;
  }

  return normalized.slice(0, 256);
}

export function readTraceId(headers: Headers): string | null {
  return normalizeTraceId(headers.get(TRACE_ID_HEADER));
}

export function withTraceIdHeaders(headers: HeadersInit | undefined, traceId: string | null): Headers {
  const nextHeaders = new Headers(headers);

  if (traceId) {
    nextHeaders.set(TRACE_ID_HEADER, traceId);
  }

  return nextHeaders;
}

export function createTraceLogContext(
  traceId: string | null,
  values: Record<string, unknown> = {}
): Record<string, unknown> {
  return traceId ? { traceId, ...values } : values;
}

export function createTraceErrorResponse(
  body: string,
  status: number,
  traceId: string | null,
  headers?: HeadersInit
): NextResponse {
  return new NextResponse(body, {
    status,
    headers: withTraceIdHeaders(headers, traceId),
  });
}