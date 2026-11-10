import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET /api/children - List all children for the logged-in parent
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Both parent and child sessions have the parent's user id in session.user.id,
    // but only parents should list children
    if (session.user.role !== "PARENT") {
      return Response.json(
        { success: false, error: "Only parents can list children" },
        { status: 403 }
      );
    }

    const children = await prisma.child.findMany({
      where: { parentId: session.user.id },
      orderBy: { createdAt: "desc" },
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

    return Response.json({ success: true, data: children });
  } catch (error) {
    console.error("GET /api/children error:", error);
    return Response.json(
      { success: false, error: "Failed to fetch children" },
      { status: 500 }
    );
  }
}

// POST /api/children - Create a new child account (parent only)
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
        { success: false, error: "Only parents can create child accounts" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, childId, pin, avatar } = body;

    // Validate name
    if (!name || typeof name !== "string" || !name.trim()) {
      return Response.json(
        { success: false, error: "Child name is required" },
        { status: 400 }
      );
    }

    // Validate childId
    if (!childId || typeof childId !== "string" || !childId.trim()) {
      return Response.json(
        { success: false, error: "Child ID is required" },
        { status: 400 }
      );
    }

    // Validate PIN (4-6 digits)
    if (!pin || typeof pin !== "string") {
      return Response.json(
        { success: false, error: "PIN is required" },
        { status: 400 }
      );
    }

    if (!/^\d{4,6}$/.test(pin)) {
      return Response.json(
        { success: false, error: "PIN must be 4-6 digits" },
        { status: 400 }
      );
    }

    // Check for unique childId
    const existing = await prisma.child.findUnique({
      where: { childId: childId.trim() },
    });

    if (existing) {
      return Response.json(
        { success: false, error: "A child with this ID already exists" },
        { status: 409 }
      );
    }

    // Hash the PIN
    const pinHash = await bcrypt.hash(pin, 10);

    const child = await prisma.child.create({
      data: {
        childId: childId.trim(),
        name: name.trim(),
        pinHash,
        avatar: avatar || "🦁",
        parentId: session.user.id,
      },
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

    return Response.json(
      { success: true, data: child, message: "Child account created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/children error:", error);
    return Response.json(
      { success: false, error: "Failed to create child account" },
      { status: 500 }
    );
  }
}
