import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { connection } from "next/server";

// GET /api/notifications/parent - Get parent's notifications
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

    if (session.user.role !== "PARENT") {
      return Response.json(
        { success: false, error: "Only parent accounts can access parent notifications" },
        { status: 403 }
      );
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ success: true, data: notifications });
  } catch (error) {
    console.error("GET /api/notifications/parent error:", error);
    return Response.json(
      { success: false, error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
