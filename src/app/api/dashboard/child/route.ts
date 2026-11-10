import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getActivitiesDueForChild } from "@/lib/scheduling";
import {
  getLevelInfo,
  getNextLevelInfo,
} from "@/lib/gamification";
import { connection } from "next/server";

// GET /api/dashboard/child - Get child dashboard data
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

    if (session.user.role !== "CHILD" || !session.user.childProfileId) {
      return Response.json(
        { success: false, error: "This dashboard is for child accounts only" },
        { status: 403 }
      );
    }

    const childId = session.user.childProfileId;

    // Fetch child profile
    const child = await prisma.child.findUnique({
      where: { id: childId },
      select: {
        id: true,
        childId: true,
        name: true,
        avatar: true,
        points: true,
        level: true,
        currentStreak: true,
        longestStreak: true,
        parentId: true,
        createdAt: true,
      },
    });

    if (!child) {
      return Response.json(
        { success: false, error: "Child profile not found" },
        { status: 404 }
      );
    }

    // Get today's due activities
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayActivities = await getActivitiesDueForChild(childId, today);

    // Count completed vs total for today
    const completedToday = todayActivities.filter((a) => a.isSubmitted).length;
    const totalToday = todayActivities.length;

    // Get recent achievements (last 5)
    const recentAchievements = await prisma.achievement.findMany({
      where: { childId },
      orderBy: { earnedAt: "desc" },
      take: 5,
    });

    // Get unread notifications
    const unreadNotifications = await prisma.childNotification.findMany({
      where: {
        childId,
        isRead: false,
      },
      orderBy: { createdAt: "desc" },
    });

    // Get level info
    const levelInfo = getLevelInfo(child.level);

    // Fetch the parent's reward config for accurate next-level threshold
    const rewardConfig = await prisma.rewardConfig.findUnique({
      where: { parentId: child.parentId },
    });

    const nextLevel = getNextLevelInfo(child.level, rewardConfig);

    return Response.json({
      success: true,
      data: {
        child,
        todayActivities,
        completedToday,
        totalToday,
        recentAchievements,
        unreadNotifications,
        levelInfo,
        nextLevelInfo: nextLevel,
        pointsToNextLevel: nextLevel
          ? Math.max(0, nextLevel.minPoints - child.points)
          : 0,
      },
    });
  } catch (error) {
    console.error("GET /api/dashboard/child error:", error);
    return Response.json(
      { success: false, error: "Failed to fetch child dashboard" },
      { status: 500 }
    );
  }
}
