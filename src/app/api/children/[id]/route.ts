import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getChildStats } from "@/lib/gamification";

// GET /api/children/[id] - Get single child with stats
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

    const { id } = await params;

    const child = await prisma.child.findUnique({
      where: { id },
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
      if (session.user.childProfileId !== child.id) {
        return Response.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }
    }

    // Get gamification stats
    const stats = await getChildStats(id);

    return Response.json({
      success: true,
      data: { ...child, stats },
    });
  } catch (error) {
    console.error("GET /api/children/[id] error:", error);
    return Response.json(
      { success: false, error: "Failed to fetch child" },
      { status: 500 }
    );
  }
}

// PUT /api/children/[id] - Update child (parent only, must own)
export async function PUT(
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
        { success: false, error: "Only parents can update child accounts" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const child = await prisma.child.findUnique({ where: { id } });
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

    const body = await request.json();
    const { name, avatar, pin, childId } = body;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return Response.json(
          { success: false, error: "Name cannot be empty" },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (avatar !== undefined) {
      updateData.avatar = avatar;
    }

    if (pin !== undefined) {
      if (typeof pin !== "string" || !/^\d{4,6}$/.test(pin)) {
        return Response.json(
          { success: false, error: "PIN must be 4-6 digits" },
          { status: 400 }
        );
      }
      updateData.pinHash = await bcrypt.hash(pin, 10);
    }

    if (childId !== undefined) {
      if (typeof childId !== "string" || !childId.trim()) {
        return Response.json(
          { success: false, error: "Child ID cannot be empty" },
          { status: 400 }
        );
      }
      // Check uniqueness if changing
      if (childId.trim() !== child.childId) {
        const existing = await prisma.child.findUnique({
          where: { childId: childId.trim() },
        });
        if (existing) {
          return Response.json(
            { success: false, error: "A child with this ID already exists" },
            { status: 409 }
          );
        }
      }
      updateData.childId = childId.trim();
    }

    const updated = await prisma.child.update({
      where: { id },
      data: updateData,
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

    return Response.json({
      success: true,
      data: updated,
      message: "Child updated successfully",
    });
  } catch (error) {
    console.error("PUT /api/children/[id] error:", error);
    return Response.json(
      { success: false, error: "Failed to update child" },
      { status: 500 }
    );
  }
}

// DELETE /api/children/[id] - Delete child (parent only, must own)
export async function DELETE(
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
        { success: false, error: "Only parents can delete child accounts" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const child = await prisma.child.findUnique({ where: { id } });
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

    // Cascade delete handles related records (submissions, schedules, etc.)
    await prisma.child.delete({ where: { id } });

    return Response.json({
      success: true,
      message: "Child deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/children/[id] error:", error);
    return Response.json(
      { success: false, error: "Failed to delete child" },
      { status: 500 }
    );
  }
}
