import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { getFeedbackIdentityFromToken } from "@/lib/feedbackAccess";
import {
  clampFeedbackQueryLimit,
  FEEDBACK_ISSUE_OPTIONS,
  isFeedbackAdminEnabled,
  isMessageFeedbackEnabled,
} from "@/lib/feedbackConfig";
import { listAdminFeedback } from "@/lib/feedbackStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isMessageFeedbackEnabled() || !isFeedbackAdminEnabled()) {
    return new NextResponse("Not found", { status: 404 });
  }

  const token = await getToken({ req });
  if (!token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const identity = getFeedbackIdentityFromToken(token);
  if (!identity.isAdmin) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const ratingParam = req.nextUrl.searchParams.get("rating");
  const issueParam = req.nextUrl.searchParams.get("issue");
  const queryParam = req.nextUrl.searchParams.get("query");
  const limit = clampFeedbackQueryLimit(req.nextUrl.searchParams.get("limit"), 25);

  const rating = ratingParam === "up" || ratingParam === "down" ? ratingParam : undefined;
  const issueTag = FEEDBACK_ISSUE_OPTIONS.some((issue) => issue.id === issueParam) ? issueParam : null;

  try {
    const result = await listAdminFeedback({
      rating,
      issueTag,
      query: queryParam,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to load admin feedback", error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to load feedback",
      },
      { status: 500 }
    );
  }
}