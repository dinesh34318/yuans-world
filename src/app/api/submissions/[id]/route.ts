import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/submissions/[id] - Get a single submission with activity and child details
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

    const submission = await prisma.activitySubmission.findUnique({
      where: { id },
      include: {
        activity: true,
        child: true,
        schedule: true,
        approval: true,
      },
    });

    if (!submission) {
      return Response.json(
        { success: false, error: "Submission not found" },
        { status: 404 }
      );
    }

    // Verify access: parent must own the child, or child must be the submitter
    if (session.user.role === "PARENT") {
      if (submission.child.parentId !== session.user.id) {
        return Response.json(
          { success: false, error: "You do not have access to this submission" },
          { status: 403 }
        );
      }
    } else if (session.user.role === "CHILD") {
      if (session.user.childProfileId !== submission.childId) {
        return Response.json(
          { success: false, error: "You do not have access to this submission" },
          { status: 403 }
        );
      }
    }

    return Response.json({ success: true, data: submission });
  } catch (error) {
    console.error("GET /api/submissions/[id] error:", error);
    return Response.json(
      { success: false, error: "Failed to fetch submission" },
      { status: 500 }
    );
  }
}
