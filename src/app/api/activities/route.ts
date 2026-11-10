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

// GET /api/activities - List all activities for the logged-in parent
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const isActiveParam = searchParams.get("isActive");
    const isActive =
      isActiveParam === null ? undefined : isActiveParam === "true";

    const activities = await prisma.activity.findMany({
      where: {
        createdById: session.user.id,
        ...(isActive !== undefined ? { isActive } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ success: true, data: activities });
  } catch (error) {
    console.error("GET /api/activities error:", error);
    return Response.json(
      { success: false, error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}

// POST /api/activities - Create a new activity (parent only)
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
        { success: false, error: "Only parents can create activities" },
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
    } = body;

    // Validate name
    if (!name || typeof name !== "string" || !name.trim()) {
      return Response.json(
        { success: false, error: "Activity name is required" },
        { status: 400 }
      );
    }

    // Validate category
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return Response.json(
        {
          success: false,
          error: `Category must be one of: ${VALID_CATEGORIES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate pointValue
    const points = Number(pointValue);
    if (isNaN(points) || points < 0) {
      return Response.json(
        { success: false, error: "pointValue must be a non-negative number" },
        { status: 400 }
      );
    }

    const activity = await prisma.activity.create({
      data: {
        name: name.trim(),
        description: description?.trim() || "",
        category,
        icon: icon || "📚",
        pointValue: points,
        requiresPhoto: Boolean(requiresPhoto),
        requiresApproval: requiresApproval !== undefined ? Boolean(requiresApproval) : true,
        isActive: true,
        createdById: session.user.id,
      },
    });

    return Response.json(
      { success: true, data: activity, message: "Activity created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/activities error:", error);
    return Response.json(
      { success: false, error: "Failed to create activity" },
      { status: 500 }
    );
  }
}
