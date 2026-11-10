import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { calculateLevel } from "@/lib/gamification";
import { connection } from "next/server";

// GET /api/dashboard/parent - Get parent dashboard data
export async function GET() {
  // Opt into dynamic rendering
  await connection();

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
        { success: false, error: "This dashboard is for parent accounts only" },
        { status: 403 }
      );
    }

    const parentId = session.user.id;

    // Get all children for this parent
    const children = await prisma.child.findMany({
      where: { parentId },
      select: {
        id: true,
        childId: true,
        name: true,
        avatar: true,
        points: true,
        level: true,
        currentStreak: true,
        longestStreak: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Get total active activities count
    const totalActivities = await prisma.activity.count({
      where: {
        createdById: parentId,
        isActive: true,
      },
    });

    // Get all child IDs for querying submissions
    const childIds = children.map((c) => c.id);

    // Get pending submissions count (awaiting approval)
    const pendingSubmissions = childIds.length
      ? await prisma.activitySubmission.count({
          where: {
            childId: { in: childIds },
            status: "PENDING",
          },
        })
      : 0;

    // Get recent submissions (last 10)
    const recentSubmissions = childIds.length
      ? await prisma.activitySubmission.findMany({
          where: {
            childId: { in: childIds },
          },
          include: {
            activity: {
              select: { name: true, icon: true, category: true },
            },
            child: {
              select: { name: true, avatar: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        })
      : [];

    // Get approval stats
    const approvedCount = childIds.length
      ? await prisma.activitySubmission.count({
          where: {
            childId: { in: childIds },
            status: "APPROVED",
          },
        })
      : 0;

    const rejectedCount = childIds.length
      ? await prisma.activitySubmission.count({
          where: {
            childId: { in: childIds },
            status: "REJECTED",
          },
        })
      : 0;

    // Get the parent's reward config for accurate levels
    const rewardConfig = await prisma.rewardConfig.findUnique({
      where: { parentId },
    });

    // Enrich children with recalculated level (in case points changed)
    const childrenWithStats = children.map((c) => ({
      ...c,
      level: calculateLevel(c.points, rewardConfig),
    }));

    return Response.json({
      success: true,
      data: {
        children: childrenWithStats,
        totalActivities,
        pendingSubmissions,
        recentSubmissions,
        approvalStats: {
          approved: approvedCount,
          rejected: rejectedCount,
          pending: pendingSubmissions,
          total: approvedCount + rejectedCount + pendingSubmissions,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/dashboard/parent error:", error);
    return Response.json(
      { success: false, error: "Failed to fetch parent dashboard" },
      { status: 500 }
    );
  }
}
