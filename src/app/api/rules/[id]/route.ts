import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PUT /api/rules/[id] - Update rule (parent only, must own)
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
        { success: false, error: "Only parents can update rules" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const rule = await prisma.rule.findUnique({ where: { id } });
    if (!rule) {
      return Response.json(
        { success: false, error: "Rule not found" },
        { status: 404 }
      );
    }

    if (rule.createdById !== session.user.id) {
      return Response.json(
        { success: false, error: "You do not own this rule" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, icon, orderIndex, isActive } = body;

    const updateData: Record<string, unknown> = {};

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return Response.json(
          { success: false, error: "Title cannot be empty" },
          { status: 400 }
        );
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description.trim();
    }

    if (icon !== undefined) {
      updateData.icon = icon;
    }

    if (orderIndex !== undefined) {
      updateData.orderIndex = Number(orderIndex);
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    const updated = await prisma.rule.update({
      where: { id },
      data: updateData,
    });

    return Response.json({
      success: true,
      data: updated,
      message: "Rule updated successfully",
    });
  } catch (error) {
    console.error("PUT /api/rules/[id] error:", error);
    return Response.json(
      { success: false, error: "Failed to update rule" },
      { status: 500 }
    );
  }
}

// DELETE /api/rules/[id] - Delete rule (parent only, must own)
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
        { success: false, error: "Only parents can delete rules" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const rule = await prisma.rule.findUnique({ where: { id } });
    if (!rule) {
      return Response.json(
        { success: false, error: "Rule not found" },
        { status: 404 }
      );
    }

    if (rule.createdById !== session.user.id) {
      return Response.json(
        { success: false, error: "You do not own this rule" },
        { status: 403 }
      );
    }

    await prisma.rule.delete({ where: { id } });

    return Response.json({
      success: true,
      message: "Rule deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/rules/[id] error:", error);
    return Response.json(
      { success: false, error: "Failed to delete rule" },
      { status: 500 }
    );
  }
}
