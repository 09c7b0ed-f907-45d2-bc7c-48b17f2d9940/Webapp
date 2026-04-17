import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  FEEDBACK_ISSUE_OPTIONS,
  getFeedbackCommentMaxLength,
  getFeedbackDisclosureText,
  isFeedbackAdminEnabled,
  isMessageFeedbackEnabled,
  shouldCaptureFeedbackConversationContext,
} from "@/lib/feedbackConfig";
import { getFeedbackIdentityFromToken } from "@/lib/feedbackAccess";
import { getFeedbackStorageInfo } from "@/lib/feedbackStore";

export async function GET(req: Request) {
  const token = await getToken({ req: req as Parameters<typeof getToken>[0]["req"] });
  const storage = getFeedbackStorageInfo();

  return NextResponse.json({
    enabled: isMessageFeedbackEnabled(),
    adminEnabled: isFeedbackAdminEnabled(),
    canViewAdmin: token ? getFeedbackIdentityFromToken(token).isAdmin : false,
    captureConversationContext: shouldCaptureFeedbackConversationContext(),
    commentMaxLength: getFeedbackCommentMaxLength(),
    disclosure: getFeedbackDisclosureText(),
    issues: FEEDBACK_ISSUE_OPTIONS,
    storageMode: storage.kind,
    storageDescription: storage.description,
    storageWarning: storage.warning,
  });
}