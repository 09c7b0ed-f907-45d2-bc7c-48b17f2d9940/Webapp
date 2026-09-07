import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const parseRasaSenderIdMock = vi.hoisted(() => vi.fn());
const getUserAccessTokenMock = vi.hoisted(() => vi.fn());
const fetchMock = vi.hoisted(() => vi.fn());
const getJobMock = vi.hoisted(() => vi.fn());
const touchJobMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/rasaSender", () => ({
  parseRasaSenderId: parseRasaSenderIdMock,
}));

vi.mock("@/lib/userTokenVault", () => ({
  getUserAccessToken: getUserAccessTokenMock,
}));

vi.mock("@/lib/jobStore", () => ({
  getJob: getJobMock,
  touchJob: touchJobMock,
}));

vi.mock("@/lib/traceId", () => ({
  TRACE_ID_HEADER: "x-trace-id",
  readTraceId: () => "trace-test",
  withTraceIdHeaders: (headers?: HeadersInit) => new Headers(headers),
  createTraceLogContext: (_: unknown, extra?: unknown) => extra ?? {},
}));

vi.stubGlobal("fetch", fetchMock);

function makeRequest(body: Record<string, unknown>, token = "svc-token") {
  return new NextRequest("http://localhost/api/rasa-proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-action-server-token": token,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/rasa-proxy", () => {
  beforeEach(() => {
    vi.resetModules();
    parseRasaSenderIdMock.mockReset();
    getUserAccessTokenMock.mockReset();
    fetchMock.mockReset();
    getJobMock.mockReset();
    touchJobMock.mockReset();
    process.env.ACTION_SERVER_TOKEN = "svc-token";
    process.env.RASA_PROXY_TARGETS = JSON.stringify({ graphql: "http://upstream.test" });
  });

  it("resolves identity via jobId when present, ignoring any senderId in the body", async () => {
    getJobMock.mockResolvedValue({ sub: "u1", threadId: 12, rasaUrl: "http://rasa:5005", createdAt: 0, expiresAt: 0 });
    getUserAccessTokenMock.mockReturnValue("user-access-token");
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const { POST } = await import("@/app/api/rasa-proxy/route");
    const res = await POST(
      makeRequest({
        jobId: "job-1",
        senderId: "someone-else:thread:99",
        target: "graphql",
        request: { path: "/api/graphql/aggregation", method: "POST", body: { query: "{}" } },
      })
    );

    expect(getJobMock).toHaveBeenCalledWith("job-1");
    expect(touchJobMock).toHaveBeenCalledWith("job-1");
    expect(getUserAccessTokenMock).toHaveBeenCalledWith("u1");
    expect(parseRasaSenderIdMock).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it("returns 403 when the requested path isn't allow-listed for the target", async () => {
    getJobMock.mockResolvedValue({ sub: "u1", threadId: null, rasaUrl: "http://rasa:5005", createdAt: 0, expiresAt: 0 });
    getUserAccessTokenMock.mockReturnValue("user-access-token");

    const { POST } = await import("@/app/api/rasa-proxy/route");
    const res = await POST(
      makeRequest({
        jobId: "job-1",
        target: "graphql",
        request: { path: "/api/rest/analytics-center/providers", method: "POST", body: {} },
      })
    );

    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 403 for an unknown target even with no path restriction configured for it", async () => {
    getJobMock.mockResolvedValue({ sub: "u1", threadId: null, rasaUrl: "http://rasa:5005", createdAt: 0, expiresAt: 0 });
    getUserAccessTokenMock.mockReturnValue("user-access-token");
    process.env.RASA_PROXY_TARGETS = JSON.stringify({ graphql: "http://upstream.test", other: "http://other.test" });

    const { POST } = await import("@/app/api/rasa-proxy/route");
    const res = await POST(
      makeRequest({
        jobId: "job-1",
        target: "other",
        request: { path: "/anything", method: "POST", body: {} },
      })
    );

    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 401 when jobId doesn't resolve to a known job", async () => {
    getJobMock.mockResolvedValue(null);

    const { POST } = await import("@/app/api/rasa-proxy/route");
    const res = await POST(
      makeRequest({
        jobId: "stale-or-forged",
        target: "graphql",
        request: { path: "/api/graphql/aggregation", method: "POST", body: {} },
      })
    );

    expect(res.status).toBe(401);
    expect(getUserAccessTokenMock).not.toHaveBeenCalled();
  });

  it("returns 400 when senderId format is invalid", async () => {
    parseRasaSenderIdMock.mockReturnValue(null);

    const { POST } = await import("@/app/api/rasa-proxy/route");
    const res = await POST(
      makeRequest({
        senderId: "bad-thread-format",
        target: "graphql",
        request: { path: "/api/graphql/aggregation", method: "POST", body: {} },
      })
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toBe("Invalid senderId");
  });

  it("looks up token by principal userSub, not full senderId", async () => {
    parseRasaSenderIdMock.mockReturnValue({ userSub: "u1", threadId: 12 });
    getUserAccessTokenMock.mockReturnValue("user-access-token");
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const { POST } = await import("@/app/api/rasa-proxy/route");
    const res = await POST(
      makeRequest({
        senderId: "u1:thread:12",
        target: "graphql",
        request: { path: "/api/graphql/aggregation", method: "POST", body: { query: "{}" } },
      })
    );

    expect(getUserAccessTokenMock).toHaveBeenCalledWith("u1");
    expect(getUserAccessTokenMock).not.toHaveBeenCalledWith("u1:thread:12");
    expect(fetchMock).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it("returns 401 when principal token is missing", async () => {
    parseRasaSenderIdMock.mockReturnValue({ userSub: "u1", threadId: 1 });
    getUserAccessTokenMock.mockReturnValue(null);

    const { POST } = await import("@/app/api/rasa-proxy/route");
    const res = await POST(
      makeRequest({
        senderId: "u1:thread:1",
        target: "graphql",
        request: { path: "/api/graphql/aggregation", method: "POST", body: {} },
      })
    );

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.message).toBe("User token unavailable");
    expect(body.proxy.principalUserSub).toBe("u1");
  });
});
