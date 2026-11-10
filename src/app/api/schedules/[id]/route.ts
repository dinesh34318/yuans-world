import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// DELETE /api/schedules/[id] - Delete/deactivate a schedule (parent only, must own)
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
        { success: false, error: "Only parents can delete schedules" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const schedule = await prisma.activitySchedule.findUnique({
      where: { id },
      include: { child: true, activity: true },
    });

    if (!schedule) {
      return Response.json(
        { success: false, error: "Schedule not found" },
        { status: 404 }
      );
    }

    // Verify the parent owns the child (and therefore the schedule)
    if (schedule.child.parentId !== session.user.id) {
      return Response.json(
        { success: false, error: "You do not own this schedule" },
        { status: 403 }
      );
    }

    // Deactivate the schedule (soft delete)
    const updated = await prisma.activitySchedule.update({
      where: { id },
      data: { isActive: false },
    });

    return Response.json({
      success: true,
      data: updated,
      message: "Schedule deactivated successfully",
    });
  } catch (error) {
    console.error("DELETE /api/schedules/[id] error:", error);
    return Response.json(
      { success: false, error: "Failed to deactivate schedule" },
      { status: 500 }
    );
  }
}
