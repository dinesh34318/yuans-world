import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PUT /api/notifications/child/[id] - Mark a child notification as read
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

    if (session.user.role !== "CHILD" || !session.user.childProfileId) {
      return Response.json(
        { success: false, error: "Only child accounts can update child notifications" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const notification = await prisma.childNotification.findUnique({
      where: { id },
    });

    if (!notification) {
      return Response.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }

    // Verify the notification belongs to this child
    if (notification.childId !== session.user.childProfileId) {
      return Response.json(
        { success: false, error: "You do not have access to this notification" },
        { status: 403 }
      );
    }

    const updated = await prisma.childNotification.update({
      where: { id },
      data: { isRead: true },
    });

    return Response.json({
      success: true,
      data: updated,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("PUT /api/notifications/child/[id] error:", error);
    return Response.json(
      { success: false, error: "Failed to update notification" },
      { status: 500 }
    );
  }
}
