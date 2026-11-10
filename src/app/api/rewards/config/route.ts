import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/rewards/config - Get reward config for the parent
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // session.user.id is the parent's user id for both parent and child sessions
    const rewardConfig = await prisma.rewardConfig.findUnique({
      where: { parentId: session.user.id },
    });

    // If no config exists yet, return defaults
    if (!rewardConfig) {
      return Response.json({
        success: true,
        data: {
          id: null,
          parentId: session.user.id,
          pointsPerActivity: 10,
          bonusStreak3Days: 5,
          bonusStreak7Days: 15,
          bonusStreak30Days: 50,
          level1Threshold: 0,
          level2Threshold: 100,
          level3Threshold: 300,
          level4Threshold: 600,
          level5Threshold: 1000,
        },
      });
    }

    return Response.json({ success: true, data: rewardConfig });
  } catch (error) {
    console.error("GET /api/rewards/config error:", error);
    return Response.json(
      { success: false, error: "Failed to fetch reward config" },
      { status: 500 }
    );
  }
}

// PUT /api/rewards/config - Update reward config (parent only)
export async function PUT(request: Request) {
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
        { success: false, error: "Only parents can update reward config" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const numericFields = [
      "pointsPerActivity",
      "bonusStreak3Days",
      "bonusStreak7Days",
      "bonusStreak30Days",
      "level1Threshold",
      "level2Threshold",
      "level3Threshold",
      "level4Threshold",
      "level5Threshold",
    ];

    const updateData: Record<string, number> = {};

    for (const field of numericFields) {
      if (body[field] !== undefined) {
        const value = Number(body[field]);
        if (isNaN(value) || value < 0) {
          return Response.json(
            { success: false, error: `${field} must be a non-negative number` },
            { status: 400 }
          );
        }
        updateData[field] = value;
      }
    }

    // Use upsert in case the config doesn't exist yet
    const rewardConfig = await prisma.rewardConfig.upsert({
      where: { parentId: session.user.id },
      create: {
        parentId: session.user.id,
        ...updateData,
      },
      update: updateData,
    });

    return Response.json({
      success: true,
      data: rewardConfig,
      message: "Reward config updated successfully",
    });
  } catch (error) {
    console.error("PUT /api/rewards/config error:", error);
    return Response.json(
      { success: false, error: "Failed to update reward config" },
      { status: 500 }
    );
  }
}
