export const MESSAGE_FEEDBACK_VERSION_ENDPOINT = "/version";

export const FEEDBACK_ISSUE_OPTIONS = [
  { id: "incorrect_or_incomplete", label: "Incorrect or incomplete" },
  { id: "not_what_i_asked", label: "Not what I asked for" },
  { id: "slow_or_buggy", label: "Slow or buggy" },
  { id: "style_or_tone", label: "Style or tone" },
  { id: "safety_or_legal", label: "Safety or legal concern" },
  { id: "hallucinated_facts", label: "Hallucinated facts" },
  { id: "formatting_or_structure", label: "Formatting or structure issue" },
  { id: "other", label: "Other" },
] as const;

export type FeedbackIssueId = (typeof FEEDBACK_ISSUE_OPTIONS)[number]["id"];
export type FeedbackRatingValue = "up" | "down";

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

function isTruthy(value: string | undefined, fallback = false): boolean {
  if (value == null) return fallback;
  return TRUE_VALUES.has(value.trim().toLowerCase());
}

function readCsvEnv(name: string): string[] {
  const raw = process.env[name]?.trim();
  if (!raw) return [];

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function isMessageFeedbackEnabled(): boolean {
  return isTruthy(process.env.MESSAGE_FEEDBACK_ENABLED, false);
}

export function isFeedbackAdminEnabled(): boolean {
  return isTruthy(process.env.FEEDBACK_ADMIN_ENABLED, false);
}

export function shouldCaptureFeedbackConversationContext(): boolean {
  return isTruthy(process.env.FEEDBACK_CAPTURE_CONTEXT_ENABLED, true);
}

export function getFeedbackCommentMaxLength(): number {
  const parsed = Number(process.env.FEEDBACK_COMMENT_MAX_LENGTH ?? "1000");
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 1000;
  }
  return Math.min(parsed, 4000);
}

export function getFeedbackAdminEmails(): string[] {
  return readCsvEnv("FEEDBACK_ADMIN_EMAILS").map((item) => item.toLowerCase());
}

export function getFeedbackAdminRoles(): string[] {
  return readCsvEnv("FEEDBACK_ADMIN_ROLES").map((item) => item.toLowerCase());
}

export function normalizeFeedbackIssues(input: unknown): FeedbackIssueId[] {
  if (!Array.isArray(input)) return [];

  const allowed = new Set<string>(FEEDBACK_ISSUE_OPTIONS.map((issue) => issue.id));
  return [...new Set(input)]
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item): item is FeedbackIssueId => allowed.has(item));
}

export function normalizeFeedbackRating(input: unknown): FeedbackRatingValue | null {
  if (input === "up" || input === "down") return input;
  return null;
}

export function clampFeedbackQueryLimit(input: string | null | undefined, fallback = 25): number {
  const parsed = Number(input ?? fallback);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, 100);
}

export function getFeedbackDisclosureText(): string {
  return "Submitting feedback includes conversation history and service metadata so admins can review and improve cVA.";
}