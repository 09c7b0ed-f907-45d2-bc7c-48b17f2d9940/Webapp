type TokenEntry = {
  accessToken: string;
  expiresAt: number;
};

const DEFAULT_TTL_MS = Number(process.env.USER_TOKEN_VAULT_TTL_MS ?? 30 * 60 * 1000);
const tokenBySub = new Map<string, TokenEntry>();

function now(): number {
  return Date.now();
}

function normalizeSub(sub: string): string {
  return sub.trim();
}

export function putUserAccessToken(params: {
  sub: string;
  accessToken: string;
  accessTokenExpiresAt?: number;
}): void {
  const sub = normalizeSub(params.sub);
  if (!sub || !params.accessToken) return;

  const expiresAt =
    typeof params.accessTokenExpiresAt === "number" && params.accessTokenExpiresAt > now()
      ? params.accessTokenExpiresAt
      : now() + DEFAULT_TTL_MS;

  tokenBySub.set(sub, {
    accessToken: params.accessToken,
    expiresAt,
  });
}

export function getUserAccessToken(sub: string): string | null {
  const key = normalizeSub(sub);
  if (!key) return null;

  const entry = tokenBySub.get(key);
  if (!entry) return null;

  if (entry.expiresAt <= now()) {
    tokenBySub.delete(key);
    return null;
  }

  return entry.accessToken;
}
