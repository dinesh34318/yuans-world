import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { connection } from "next/server";

// GET /api/notifications/child - Get child's notifications
export async function GET() {
  // Opt into dynamic rendering
  await connection();

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
        { success: false, error: "Only child accounts can access child notifications" },
        { status: 403 }
      );
    }

    const notifications = await prisma.childNotification.findMany({
      where: { childId: session.user.childProfileId },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ success: true, data: notifications });
  } catch (error) {
    console.error("GET /api/notifications/child error:", error);
    return Response.json(
      { success: false, error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
