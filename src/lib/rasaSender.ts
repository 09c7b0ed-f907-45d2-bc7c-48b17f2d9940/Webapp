export function buildRasaSenderId(userSub: string, threadId?: number | null): string {
  const normalizedUserSub = String(userSub ?? "").trim();
  if (!normalizedUserSub) return "";

  if (typeof threadId !== "number" || !Number.isFinite(threadId)) {
    return normalizedUserSub;
  }

  return `${normalizedUserSub}:thread:${threadId}`;
}
