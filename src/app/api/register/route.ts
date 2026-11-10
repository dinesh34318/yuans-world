import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// POST /api/register - Register a new parent account
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Validate name
    if (!name || typeof name !== "string" || !name.trim()) {
      return Response.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    // Validate email
    if (!email || typeof email !== "string" || !email.trim()) {
      return Response.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return Response.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password
    if (!password || typeof password !== "string") {
      return Response.json(
        { success: false, error: "Password is required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return Response.json(
        { success: false, error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Check for existing user with the same email
    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser) {
      return Response.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create the user and default reward config in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: name.trim(),
          email: trimmedEmail,
          passwordHash,
          role: "PARENT",
        },
      });

      // Create default reward config
      await tx.rewardConfig.create({
        data: {
          parentId: newUser.id,
        },
      });

      // Create a welcome notification
      await tx.notification.create({
        data: {
          userId: newUser.id,
          title: "Welcome to Yuan's World! 🎉",
          message: "Your account is ready. Start by adding a child profile and creating activities.",
          type: "SYSTEM",
          isRead: false,
        },
      });

      return newUser;
    });

    // Do not auto-login — the client should redirect to the login page
    return Response.json(
      {
        success: true,
        message: "Account created successfully. Please log in.",
        data: { id: user.id, name: user.name, email: user.email },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/register error:", error);
    return Response.json(
      { success: false, error: "Failed to create account" },
      { status: 500 }
    );
  }
}
