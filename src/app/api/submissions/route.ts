import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/submissions - Child submits an activity completion
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "CHILD" || !session.user.childProfileId) {
      return Response.json(
        { success: false, error: "Only child accounts can submit activities" },
        { status: 403 }
      );
    }

    const childId = session.user.childProfileId;
    const body = await request.json();
    const { scheduleId, activityId, description, photoPath } = body;

    if (!scheduleId || typeof scheduleId !== "string") {
      return Response.json(
        { success: false, error: "scheduleId is required" },
        { status: 400 }
      );
    }

    if (!activityId || typeof activityId !== "string") {
      return Response.json(
        { success: false, error: "activityId is required" },
        { status: 400 }
      );
    }

    // Verify the schedule exists and belongs to this child
    const schedule = await prisma.activitySchedule.findUnique({
      where: { id: scheduleId },
      include: { activity: true },
    });

    if (!schedule) {
      return Response.json(
        { success: false, error: "Schedule not found" },
        { status: 404 }
      );
    }

    if (schedule.childId !== childId) {
      return Response.json(
        { success: false, error: "This schedule does not belong to you" },
        { status: 403 }
      );
    }

    if (schedule.activityId !== activityId) {
      return Response.json(
        { success: false, error: "Activity ID does not match the schedule" },
        { status: 400 }
      );
    }

    if (!schedule.isActive || !schedule.activity.isActive) {
      return Response.json(
        { success: false, error: "This activity or schedule is no longer active" },
        { status: 400 }
      );
    }

    // Normalize today's date to midnight for duplicate check
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Prevent duplicate submissions (same activity + child + date)
    const existing = await prisma.activitySubmission.findUnique({
      where: {
        activityId_childId_submittedDate: {
          activityId,
          childId,
          submittedDate: today,
        },
      },
    });

    if (existing) {
      return Response.json(
        {
          success: false,
          error: "You have already submitted this activity today",
        },
        { status: 409 }
      );
    }

    // Check if photo is required
    if (schedule.activity.requiresPhoto && !photoPath) {
      return Response.json(
        { success: false, error: "A photo is required for this activity" },
        { status: 400 }
      );
    }

    const submission = await prisma.activitySubmission.create({
      data: {
        activityId,
        childId,
        scheduleId,
        description: description?.trim() || "",
        photoPath: photoPath || null,
        status: "PENDING",
        submittedDate: today,
        pointsAwarded: 0,
      },
      include: {
        activity: true,
      },
    });

    // Notify the parent about the new submission
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: "New Submission Awaiting Approval",
        message: `${session.user.childName || "Your child"} submitted "${schedule.activity.name}" for approval.`,
        type: "APPROVAL",
        isRead: false,
      },
    });

    return Response.json(
      { success: true, data: submission, message: "Submission created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/submissions error:", error);
    return Response.json(
      { success: false, error: "Failed to create submission" },
      { status: 500 }
    );
  }
}
