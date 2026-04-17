export function buildRasaSenderId(userSub: string, threadId?: number | null): string {
  const normalizedUserSub = String(userSub ?? "").trim();
  if (!normalizedUserSub) return "";

  if (typeof threadId !== "number" || !Number.isFinite(threadId)) {
    return normalizedUserSub;
  }

  return `${normalizedUserSub}:thread:${threadId}`;
}

export function parseRasaSenderId(senderId: string): { userSub: string; threadId: number | null } | null {
  const normalizedSenderId = String(senderId ?? "").trim();
  if (!normalizedSenderId) {
    return null;
  }

  const match = /^(.*):thread:(\d+)$/.exec(normalizedSenderId);
  if (!match) {
    return {
      userSub: normalizedSenderId,
      threadId: null,
    };
  }

  const [, userSub, threadIdRaw] = match;
  const normalizedUserSub = userSub.trim();
  const threadId = Number(threadIdRaw);

  if (!normalizedUserSub || !Number.isFinite(threadId)) {
    return null;
  }

  return {
    userSub: normalizedUserSub,
    threadId,
  };
}
