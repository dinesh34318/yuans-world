import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/rules - List all active rules (available to both parent and child)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch rules created by the parent (session.user.id is the parent's id for both roles)
    const rules = await prisma.rule.findMany({
      where: {
        createdById: session.user.id,
        isActive: true,
      },
      orderBy: { orderIndex: "asc" },
    });

    return Response.json({ success: true, data: rules });
  } catch (error) {
    console.error("GET /api/rules error:", error);
    return Response.json(
      { success: false, error: "Failed to fetch rules" },
      { status: 500 }
    );
  }
}

// POST /api/rules - Create a new rule (parent only)
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
        { success: false, error: "Only parents can create rules" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, icon, orderIndex } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return Response.json(
        { success: false, error: "Rule title is required" },
        { status: 400 }
      );
    }

    if (!description || typeof description !== "string" || !description.trim()) {
      return Response.json(
        { success: false, error: "Rule description is required" },
        { status: 400 }
      );
    }

    // Determine the next order index if not provided
    let order = orderIndex;
    if (order === undefined || order === null) {
      const count = await prisma.rule.count({
        where: { createdById: session.user.id },
      });
      order = count + 1;
    }

    const rule = await prisma.rule.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        icon: icon || "📋",
        orderIndex: Number(order),
        isActive: true,
        createdById: session.user.id,
      },
    });

    return Response.json(
      { success: true, data: rule, message: "Rule created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/rules error:", error);
    return Response.json(
      { success: false, error: "Failed to create rule" },
      { status: 500 }
    );
  }
}
