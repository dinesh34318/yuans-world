import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/achievements/[childId] - Get all achievements for a child
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

    const achievements = await prisma.achievement.findMany({
      where: { childId },
      orderBy: { earnedAt: "desc" },
    });

    return Response.json({ success: true, data: achievements });
  } catch (error) {
    console.error("GET /api/achievements/[childId] error:", error);
    return Response.json(
      { success: false, error: "Failed to fetch achievements" },
      { status: 500 }
    );
  }
}
