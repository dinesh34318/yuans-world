import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/rules/acknowledge - Child acknowledges a rule
export async function POST(request: Request) {
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
        { success: false, error: "Only child accounts can acknowledge rules" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { ruleId } = body;

    if (!ruleId || typeof ruleId !== "string") {
      return Response.json(
        { success: false, error: "ruleId is required" },
        { status: 400 }
      );
    }

    // Verify the rule exists and belongs to the parent
    const rule = await prisma.rule.findUnique({ where: { id: ruleId } });
    if (!rule) {
      return Response.json(
        { success: false, error: "Rule not found" },
        { status: 404 }
      );
    }

    // The child's parent is session.user.id
    if (rule.createdById !== session.user.id) {
      return Response.json(
        { success: false, error: "This rule does not belong to your parent" },
        { status: 403 }
      );
    }

    if (!rule.isActive) {
      return Response.json(
        { success: false, error: "This rule is no longer active" },
        { status: 400 }
      );
    }

    // Check for existing acknowledgment (unique constraint: ruleId + childId)
    const existing = await prisma.ruleAcknowledgment.findUnique({
      where: {
        ruleId_childId: {
          ruleId,
          childId: session.user.childProfileId,
        },
      },
    });

    if (existing) {
      return Response.json(
        { success: false, error: "You have already acknowledged this rule" },
        { status: 409 }
      );
    }

    const acknowledgment = await prisma.ruleAcknowledgment.create({
      data: {
        ruleId,
        childId: session.user.childProfileId,
      },
    });

    return Response.json(
      {
        success: true,
        data: acknowledgment,
        message: "Rule acknowledged successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/rules/acknowledge error:", error);
    return Response.json(
      { success: false, error: "Failed to acknowledge rule" },
      { status: 500 }
    );
  }
}
