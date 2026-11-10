import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/reports/child/[id] - Get detailed report for a child (parent only)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { success: false, error: "Only parents can access reports" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Verify the child exists and the parent owns it
    const child = await prisma.child.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        points: true,
        level: true,
        currentStreak: true,
        longestStreak: true,
        parentId: true,
      },
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

    // ─── 1. Submissions grouped by category ──────────────────────────────
    const allSubmissions = await prisma.activitySubmission.findMany({
      where: { childId: id },
      include: {
        activity: {
          select: { name: true, category: true, pointValue: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const byCategory: Record<
      string,
      { category: string; total: number; approved: number; rejected: number; pending: number; pointsEarned: number }
    > = {};

    for (const sub of allSubmissions) {
      const cat = sub.activity.category;
      if (!byCategory[cat]) {
        byCategory[cat] = {
          category: cat,
          total: 0,
          approved: 0,
          rejected: 0,
          pending: 0,
          pointsEarned: 0,
        };
      }
      byCategory[cat].total++;
      if (sub.status === "APPROVED") {
        byCategory[cat].approved++;
        byCategory[cat].pointsEarned += sub.pointsAwarded;
      } else if (sub.status === "REJECTED") {
        byCategory[cat].rejected++;
      } else {
        byCategory[cat].pending++;
      }
    }

    // ─── 2. Daily completion rates for last 30 days ───────────────────────
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29); // Include today
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const recentSubmissions = allSubmissions.filter(
      (s) => new Date(s.submittedDate) >= thirtyDaysAgo
    );

    const dailyMap: Record<
      string,
      { date: string; total: number; approved: number; rejected: number; pending: number }
    > = {};

    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      dailyMap[dateStr] = {
        date: dateStr,
        total: 0,
        approved: 0,
        rejected: 0,
        pending: 0,
      };
    }

    for (const sub of recentSubmissions) {
      const dateStr = sub.submittedDate.toISOString().split("T")[0];
      if (dailyMap[dateStr]) {
        dailyMap[dateStr].total++;
        if (sub.status === "APPROVED") dailyMap[dateStr].approved++;
        else if (sub.status === "REJECTED") dailyMap[dateStr].rejected++;
        else dailyMap[dateStr].pending++;
      }
    }

    // ─── 3. Weekly summary (last 4 weeks) ─────────────────────────────────
    const weeklySummary: Array<{
      weekStart: string;
      weekEnd: string;
      total: number;
      approved: number;
      pointsEarned: number;
    }> = [];

    for (let w = 3; w >= 0; w--) {
      const weekEnd = new Date();
      weekEnd.setHours(23, 59, 59, 999);
      weekEnd.setDate(weekEnd.getDate() - w * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      const weekSubs = allSubmissions.filter((s) => {
        const d = new Date(s.submittedDate);
        return d >= weekStart && d <= weekEnd;
      });

      weeklySummary.push({
        weekStart: weekStart.toISOString().split("T")[0],
        weekEnd: weekEnd.toISOString().split("T")[0],
        total: weekSubs.length,
        approved: weekSubs.filter((s) => s.status === "APPROVED").length,
        pointsEarned: weekSubs
          .filter((s) => s.status === "APPROVED")
          .reduce((sum, s) => sum + s.pointsAwarded, 0),
      });
    }

    // ─── 4. Streak history ────────────────────────────────────────────────
    const streakHistory = await prisma.dailyStreak.findMany({
      where: { childId: id },
      orderBy: { date: "desc" },
      take: 30,
      select: {
        date: true,
        completed: true,
        activitiesCompleted: true,
        activitiesTotal: true,
      },
    });

    // ─── 5. Points over time ─────────────────────────────────────────────
    // Build cumulative points over time from approved submissions
    const approvedSubs = allSubmissions
      .filter((s) => s.status === "APPROVED")
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    let cumulativePoints = 0;
    const pointsOverTime = approvedSubs.map((s) => {
      cumulativePoints += s.pointsAwarded;
      return {
        date: s.createdAt.toISOString(),
        pointsAwarded: s.pointsAwarded,
        cumulativePoints,
        activityName: s.activity.name,
      };
    });

    return Response.json({
      success: true,
      data: {
        child: {
          id: child.id,
          name: child.name,
          points: child.points,
          level: child.level,
          currentStreak: child.currentStreak,
          longestStreak: child.longestStreak,
        },
        byCategory: Object.values(byCategory),
        dailyCompletion: Object.values(dailyMap),
        weeklySummary,
        streakHistory,
        pointsOverTime,
        summary: {
          totalSubmissions: allSubmissions.length,
          approved: allSubmissions.filter((s) => s.status === "APPROVED").length,
          rejected: allSubmissions.filter((s) => s.status === "REJECTED").length,
          pending: allSubmissions.filter((s) => s.status === "PENDING").length,
          totalPointsEarned: approvedSubs.reduce(
            (sum, s) => sum + s.pointsAwarded,
            0
          ),
        },
      },
    });
  } catch (error) {
    console.error("GET /api/reports/child/[id] error:", error);
    return Response.json(
      { success: false, error: "Failed to fetch report" },
      { status: 500 }
    );
  }
}
