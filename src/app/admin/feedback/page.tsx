import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import FeedbackAdminView from "@/components/feedback/feedback-admin-view";
import { authOptions } from "@/lib/auth";
import { getFeedbackIdentityFromSession } from "@/lib/feedbackAccess";
import { FEEDBACK_ISSUE_OPTIONS, isFeedbackAdminEnabled, isMessageFeedbackEnabled } from "@/lib/feedbackConfig";
import { getFeedbackStorageInfo } from "@/lib/feedbackStore";

export default async function FeedbackAdminPage() {
  if (!isMessageFeedbackEnabled() || !isFeedbackAdminEnabled()) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const identity = getFeedbackIdentityFromSession(session);

  if (!identity.isAdmin) {
    notFound();
  }

  const storage = getFeedbackStorageInfo();

  return (
    <FeedbackAdminView
      issueOptions={[...FEEDBACK_ISSUE_OPTIONS]}
      storageMode={storage.kind}
      storageDescription={storage.description}
      storageWarning={storage.warning}
    />
  );
}