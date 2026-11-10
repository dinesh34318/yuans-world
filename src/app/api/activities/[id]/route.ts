import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { ActivityCategory } from "@/types";

const VALID_CATEGORIES: ActivityCategory[] = [
  "STUDYING",
  "READING",
  "OUTDOOR",
  "CHORES",
  "CLEANLINESS",
  "OTHER",
];

// GET /api/activities/[id] - Get a single activity
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

    const activity = await prisma.activity.findUnique({
      where: { id },
    });

    if (!activity) {
      return Response.json(
        { success: false, error: "Activity not found" },
        { status: 404 }
      );
    }

    // Child sessions use the parent's user id, so allow access if parent owns it
    if (activity.createdById !== session.user.id) {
      return Response.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    return Response.json({ success: true, data: activity });
  } catch (error) {
    console.error("GET /api/activities/[id] error:", error);
    return Response.json(
      { success: false, error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}

// PUT /api/activities/[id] - Update an activity (parent only, must own)
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
        { success: false, error: "Only parents can update activities" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const existing = await prisma.activity.findUnique({ where: { id } });
    if (!existing) {
      return Response.json(
        { success: false, error: "Activity not found" },
        { status: 404 }
      );
    }

    if (existing.createdById !== session.user.id) {
      return Response.json(
        { success: false, error: "You do not own this activity" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      category,
      icon,
      pointValue,
      requiresPhoto,
      requiresApproval,
      isActive,
    } = body;

    // Build update data with validations
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return Response.json(
          { success: false, error: "Activity name cannot be empty" },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description.trim();
    }

    if (category !== undefined) {
      if (!VALID_CATEGORIES.includes(category)) {
        return Response.json(
          {
            success: false,
            error: `Category must be one of: ${VALID_CATEGORIES.join(", ")}`,
          },
          { status: 400 }
        );
      }
      updateData.category = category;
    }

    if (icon !== undefined) {
      updateData.icon = icon;
    }

    if (pointValue !== undefined) {
      const points = Number(pointValue);
      if (isNaN(points) || points < 0) {
        return Response.json(
          { success: false, error: "pointValue must be a non-negative number" },
          { status: 400 }
        );
      }
      updateData.pointValue = points;
    }

    if (requiresPhoto !== undefined) {
      updateData.requiresPhoto = Boolean(requiresPhoto);
    }

    if (requiresApproval !== undefined) {
      updateData.requiresApproval = Boolean(requiresApproval);
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    const updated = await prisma.activity.update({
      where: { id },
      data: updateData,
    });

    return Response.json({
      success: true,
      data: updated,
      message: "Activity updated successfully",
    });
  } catch (error) {
    console.error("PUT /api/activities/[id] error:", error);
    return Response.json(
      { success: false, error: "Failed to update activity" },
      { status: 500 }
    );
  }
}

// DELETE /api/activities/[id] - Soft delete (set isActive=false) (parent only, must own)
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
        { success: false, error: "Only parents can delete activities" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const existing = await prisma.activity.findUnique({ where: { id } });
    if (!existing) {
      return Response.json(
        { success: false, error: "Activity not found" },
        { status: 404 }
      );
    }

    if (existing.createdById !== session.user.id) {
      return Response.json(
        { success: false, error: "You do not own this activity" },
        { status: 403 }
      );
    }

    const updated = await prisma.activity.update({
      where: { id },
      data: { isActive: false },
    });

    return Response.json({
      success: true,
      data: updated,
      message: "Activity deactivated successfully",
    });
  } catch (error) {
    console.error("DELETE /api/activities/[id] error:", error);
    return Response.json(
      { success: false, error: "Failed to deactivate activity" },
      { status: 500 }
    );
  }
}
