import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { awardPoints, updateStreak } from "@/lib/gamification";

// POST /api/approvals - Parent approves or rejects a submission
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "PARENT") {
      return Response.json(
        { success: false, error: "Only parents can approve or reject submissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { submissionId, decision, feedback } = body;

    if (!submissionId || typeof submissionId !== "string") {
      return Response.json(
        { success: false, error: "submissionId is required" },
        { status: 400 }
      );
    }

    if (!decision || !["APPROVED", "REJECTED"].includes(decision)) {
      return Response.json(
        { success: false, error: "decision must be APPROVED or REJECTED" },
        { status: 400 }
      );
    }

    // Fetch the submission with related data
    const submission = await prisma.activitySubmission.findUnique({
      where: { id: submissionId },
      include: {
        child: true,
        activity: true,
      },
    });

    if (!submission) {
      return Response.json(
        { success: false, error: "Submission not found" },
        { status: 404 }
      );
    }

    // Verify the parent owns the child
    if (submission.child.parentId !== session.user.id) {
      return Response.json(
        { success: false, error: "You do not have access to this submission" },
        { status: 403 }
      );
    }

    // Prevent re-processing an already decided submission
    if (submission.status === "APPROVED" || submission.status === "REJECTED") {
      return Response.json(
        {
          success: false,
          error: `This submission has already been ${submission.status.toLowerCase()}`,
        },
        { status: 409 }
      );
    }

    // Create the approval record
    const approval = await prisma.approval.create({
      data: {
        submissionId,
        parentId: session.user.id,
        decision,
        feedback: feedback?.trim() || "",
      },
    });

    // Update submission status
    await prisma.activitySubmission.update({
      where: { id: submissionId },
      data: { status: decision },
    });

    let pointsAwarded = 0;
    let newLevel = submission.child.level;
    let newBadges: string[] = [];

    if (decision === "APPROVED") {
      // Award points via the gamification engine
      const result = await awardPoints(
        submission.childId,
        submissionId,
        submission.activity.pointValue,
        session.user.id
      );
      pointsAwarded = result.pointsAwarded;
      newLevel = result.newLevel;
      newBadges = result.badges;

      // Update the child's streak
      await updateStreak(submission.childId);

      // Notify the child of approval
      await prisma.childNotification.create({
        data: {
          childId: submission.childId,
          title: "Activity Approved! 🎉",
          message: `Great job! Your "${submission.activity.name}" was approved. You earned ${pointsAwarded} points!`,
          type: "APPROVAL",
          isRead: false,
        },
      });

      // If new badges were earned, notifications are created inside checkAndAwardBadges
      // but awardPoints already calls checkAndAwardBadges, so badges + notifications are handled
    } else {
      // Notify the child of rejection
      await prisma.childNotification.create({
        data: {
          childId: submission.childId,
          title: "Submission Needs Revision",
          message: `Your "${submission.activity.name}" submission was not approved. ${feedback?.trim() ? feedback.trim() : "Please try again!"}`,
          type: "APPROVAL",
          isRead: false,
        },
      });
    }

    return Response.json({
      success: true,
      data: {
        approval,
        submissionId,
        decision,
        pointsAwarded,
        newLevel,
        newBadges,
        childId: submission.childId,
      },
      message:
        decision === "APPROVED"
          ? "Submission approved successfully"
          : "Submission rejected",
    });
  } catch (error) {
    console.error("POST /api/approvals error:", error);
    return Response.json(
      { success: false, error: "Failed to process approval" },
      { status: 500 }
    );
  }
}
