import { auth } from "@/lib/auth";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

// POST /api/upload - Handle photo upload (multipart form data)
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "CHILD") {
      return Response.json({ success: false, error: "Only child accounts can upload photos" }, { status: 403 });
    }

    const maxFileSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB || "5", 10);
    const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return Response.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return Response.json({ success: false, error: "Uploaded item is not a valid file" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json(
        { success: false, error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (file.size > maxFileSizeBytes) {
      return Response.json(
        { success: false, error: `File too large. Maximum size is ${maxFileSizeMB}MB` },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return Response.json({ success: false, error: "File is empty" }, { status: 400 });
    }

    const fileExt =
      file.name.includes(".")
        ? "." + file.name.split(".").pop()!.toLowerCase()
        : file.type === "image/jpeg"
        ? ".jpg"
        : file.type === "image/png"
        ? ".png"
        : ".webp";

    if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
      return Response.json({ success: false, error: "Invalid file extension" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const uniqueFilename = `${randomUUID()}${fileExt}`;

    // ─── Strategy: local disk vs. serverless ─────────────────────────────────
    // On Vercel (or any serverless environment), writing to disk is ephemeral.
    // For a quick production deployment, we store the image as a data-URL in the
    // database column. This is fine for the low-volume family use-case the app targets.
    //
    // For high-traffic or large images, swap this out for an S3/R2/Cloudinary upload.
    // See README for instructions.

    if (process.env.UPLOAD_STORAGE === "disk") {
      // ── Local disk mode ──────────────────────────────────────────────────────
      const { writeFileSync, mkdirSync } = await import("fs");
      const { join } = await import("path");

      const uploadDir = process.env.UPLOAD_DIR || "./uploads";
      const absoluteUploadDir = join(process.cwd(), uploadDir);
      mkdirSync(absoluteUploadDir, { recursive: true });

      const filePath = join(absoluteUploadDir, uniqueFilename);
      writeFileSync(filePath, buffer);

      const relativePath = `${uploadDir}/${uniqueFilename}`;
      return Response.json({
        success: true,
        data: { path: relativePath, filename: uniqueFilename, type: "disk" },
        message: "File uploaded successfully",
      });
    }

    // ── Data-URL mode (serverless default) ───────────────────────────────────
    const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
    return Response.json({
      success: true,
      data: { path: dataUrl, filename: uniqueFilename, type: "dataurl" },
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error("POST /api/upload error:", error);
    return Response.json({ success: false, error: "Failed to upload file" }, { status: 500 });
  }
}
