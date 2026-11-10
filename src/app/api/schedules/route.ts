import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createActivitySchedule } from "@/lib/scheduling";
import type { Frequency } from "@/types";

const VALID_FREQUENCIES: Frequency[] = [
  "DAILY",
  "EVERY_2_DAYS",
  "EVERY_3_DAYS",
  "EVERY_4_DAYS",
];

// POST /api/schedules - Create a schedule (parent only)
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
        { success: false, error: "Only parents can create schedules" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { activityId, childId, frequency, startDate, endDate } = body;

    if (!activityId || typeof activityId !== "string") {
      return Response.json(
        { success: false, error: "activityId is required" },
        { status: 400 }
      );
    }

    if (!childId || typeof childId !== "string") {
      return Response.json(
        { success: false, error: "childId is required" },
        { status: 400 }
      );
    }

    if (!frequency || !VALID_FREQUENCIES.includes(frequency)) {
      return Response.json(
        {
          success: false,
          error: `frequency must be one of: ${VALID_FREQUENCIES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Verify the parent owns the activity
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
    });

    if (!activity) {
      return Response.json(
        { success: false, error: "Activity not found" },
        { status: 404 }
      );
    }

    if (activity.createdById !== session.user.id) {
      return Response.json(
        { success: false, error: "You do not own this activity" },
        { status: 403 }
      );
    }

    // Verify the parent owns the child
    const child = await prisma.child.findUnique({
      where: { id: childId },
    });

    if (!child) {
      return Response.json(
        { success: false, error: "Child not found" },
        { status: 404 }
      );
    }

    if (child.parentId !== session.user.id) {
      return Response.json(
        { success: false, error: "You do not own this child" },
        { status: 403 }
      );
    }

    // Check for existing schedule with same activity-child-frequency combo
    const existingSchedule = await prisma.activitySchedule.findFirst({
      where: { activityId, childId, frequency },
    });

    if (existingSchedule) {
      return Response.json(
        {
          success: false,
          error: "A schedule already exists for this activity, child, and frequency",
        },
        { status: 409 }
      );
    }

    const schedule = await createActivitySchedule(
      activityId,
      childId,
      frequency,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    return Response.json(
      { success: true, data: schedule, message: "Schedule created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/schedules error:", error);
    return Response.json(
      { success: false, error: "Failed to create schedule" },
      { status: 500 }
    );
  }
}
