import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/calendar/[childId] - Get calendar data for a child
// Query params: month (1-12), year (e.g., 2024)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ childId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { childId } = await params;

    // Verify the child exists
    const child = await prisma.child.findUnique({
      where: { id: childId },
      select: { id: true, parentId: true, name: true },
    });

    if (!child) {
      return Response.json(
        { success: false, error: "Child not found" },
        { status: 404 }
      );
    }

    // Verify access: parent must own the child, or child session must match
    if (session.user.role === "PARENT") {
      if (child.parentId !== session.user.id) {
        return Response.json(
          { success: false, error: "You do not own this child" },
          { status: 403 }
        );
      }
    } else if (session.user.role === "CHILD") {
      if (session.user.childProfileId !== childId) {
        return Response.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }
    }

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");

    const month = monthParam ? parseInt(monthParam, 10) - 1 : now.getMonth(); // 0-indexed
    const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();

    if (isNaN(month) || month < 0 || month > 11) {
      return Response.json(
        { success: false, error: "Invalid month (must be 1-12)" },
        { status: 400 }
      );
    }

    if (isNaN(year) || year < 2000 || year > 2100) {
      return Response.json(
        { success: false, error: "Invalid year" },
        { status: 400 }
      );
    }

    // Calculate the date range for the month
    const startDate = new Date(year, month, 1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(year, month + 1, 0); // Last day of the month
    endDate.setHours(23, 59, 59, 999);

    // Get daily streak records for the month
    const streakRecords = await prisma.dailyStreak.findMany({
      where: {
        childId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "asc" },
    });

    // Get submissions for the month
    const submissions = await prisma.activitySubmission.findMany({
      where: {
        childId,
        submittedDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        activity: {
          select: { name: true, icon: true, category: true, pointValue: true },
        },
      },
      orderBy: { submittedDate: "asc" },
    });

    // Build calendar data: map of date string -> completion info
    const calendarData: Record<
      string,
      {
        date: string;
        completed: boolean;
        activitiesCompleted: number;
        activitiesTotal: number;
        submissions: Array<{
          id: string;
          activityName: string;
          activityIcon: string;
          category: string;
          status: string;
          pointsAwarded: number;
        }>;
      }
    > = {};

    // Initialize streak data
    for (const record of streakRecords) {
      const dateStr = record.date.toISOString().split("T")[0];
      calendarData[dateStr] = {
        date: dateStr,
        completed: record.completed,
        activitiesCompleted: record.activitiesCompleted,
        activitiesTotal: record.activitiesTotal,
        submissions: [],
      };
    }

    // Add submissions to the calendar
    for (const sub of submissions) {
      const dateStr = sub.submittedDate.toISOString().split("T")[0];
      if (!calendarData[dateStr]) {
        calendarData[dateStr] = {
          date: dateStr,
          completed: false,
          activitiesCompleted: 0,
          activitiesTotal: 0,
          submissions: [],
        };
      }
      calendarData[dateStr].submissions.push({
        id: sub.id,
        activityName: sub.activity.name,
        activityIcon: sub.activity.icon,
        category: sub.activity.category,
        status: sub.status,
        pointsAwarded: sub.pointsAwarded,
      });
    }

    return Response.json({
      success: true,
      data: {
        month: month + 1,
        year,
        days: Object.values(calendarData).sort((a, b) =>
          a.date.localeCompare(b.date)
        ),
      },
    });
  } catch (error) {
    console.error("GET /api/calendar/[childId] error:", error);
    return Response.json(
      { success: false, error: "Failed to fetch calendar data" },
      { status: 500 }
    );
  }
}
