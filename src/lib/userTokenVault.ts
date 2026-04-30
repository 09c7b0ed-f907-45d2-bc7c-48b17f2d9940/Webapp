type TokenEntry = {
  accessToken: string;
  expiresAt: number;
};

const globalForUserTokenVault = globalThis as unknown as {
  userTokenBySub?: Map<string, TokenEntry>;
};

const DEFAULT_TTL_MS = Number(process.env.USER_TOKEN_VAULT_TTL_MS ?? 30 * 60 * 1000);
const tokenBySub = globalForUserTokenVault.userTokenBySub ?? new Map<string, TokenEntry>();

globalForUserTokenVault.userTokenBySub = tokenBySub;

function now(): number {
  return Date.now();
}

function normalizeSub(sub: string): string {
  return String(sub ?? "").trim();
}

function setTokenEntry(sub: string, entry: TokenEntry): void {
  tokenBySub.set(sub, entry);
}

function readTokenEntry(sub: string): TokenEntry | null {
  const key = normalizeSub(sub);
  if (!key) return null;

  const entry = tokenBySub.get(key);
  if (!entry) return null;

  if (entry.expiresAt <= now()) {
    tokenBySub.delete(key);
    return null;
  }

  return entry;
}

export function inspectUserAccessTokenLookup(sub: string) {
  const requestedKey = normalizeSub(sub);
  const exactEntry = requestedKey ? readTokenEntry(requestedKey) : null;

  return {
    requestedKey,
    requestedKeyFormat: requestedKey ? "sender-id" : "empty",
    fallbackKey: null,
    exactMatch: exactEntry != null,
    fallbackMatch: false,
    exactExpiresAt: exactEntry?.expiresAt ?? null,
    fallbackExpiresAt: null,
    storage: "globalThis-per-process",
  };
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

  const entry = {
    accessToken: params.accessToken,
    expiresAt,
  };

  setTokenEntry(sub, entry);
}

export function getUserAccessToken(sub: string): string | null {
  const entry = readTokenEntry(sub);
  if (entry) {
    return entry.accessToken;
  }

  return null;
}
