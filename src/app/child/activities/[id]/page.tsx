"use client";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { CATEGORY_CONFIG, type ActivityCategory } from "@/types";

interface DueActivity {
  scheduleId: string;
  activityId: string;
  activityName: string;
  activityDescription: string;
  activityCategory: string;
  activityIcon: string;
  pointValue: number;
  requiresPhoto: boolean;
  requiresApproval: boolean;
  frequency: string;
  isSubmitted: boolean;
  submissionStatus: string | null;
  submissionId: string | null;
}

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activity, setActivity] = useState<DueActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status !== "authenticated" || session?.user?.role !== "CHILD") return;
    fetchDashboard();
  }, [status, session]);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/dashboard/child");
      const data = await res.json();
      if (data.success) {
        const found = data.data.todayActivities.find(
          (a: DueActivity) => a.activityId === id || a.scheduleId === id
        );
        if (found) {
          setActivity(found);
        } else {
          setError("Activity not found for today.");
        }
      }
    } catch {
      setError("Failed to load activity.");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please upload a JPG, PNG, or WebP image.");
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image is too large. Maximum 5MB.");
      return;
    }

    setError("");

    // Show preview
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setPhotoPath(data.data.path);
      } else {
        setError(data.error || "Upload failed.");
      }
    } catch {
      setError("Failed to upload photo. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity) return;

    if (activity.requiresPhoto && !photoPath) {
      setError("Please upload a photo for this activity.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleId: activity.scheduleId,
          activityId: activity.activityId,
          description,
          photoPath,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || "Failed to submit activity.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: "60vh" }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="container" style={{ paddingTop: "2rem" }}>
        <div className="alert alert-error">{error || "Activity not found."}</div>
        <button className="btn btn-outline mt-4" onClick={() => router.push("/child/activities")}>
          ← Back to Activities
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container flex-center flex-col" style={{ minHeight: "60vh", gap: "1.5rem" }}>
        <div className="animate-bounce" style={{ fontSize: "5rem" }}>🎉</div>
        <h2 style={{ fontFamily: "'Fredoka', cursive", fontSize: "2rem", color: "#81C784" }}>
          Awesome Job!
        </h2>
        <p className="text-center" style={{ fontSize: "1.1rem", maxWidth: "400px" }}>
          Your activity has been submitted! Your parent will review it soon. Keep up the great work! ⭐
        </p>
        <div className="flex-center gap-3" style={{ flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={() => router.push("/child/activities")}>
            ← Back to Activities
          </button>
          <button className="btn btn-accent" onClick={() => router.push("/child/dashboard")}>
            🏠 Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const catConfig = CATEGORY_CONFIG[activity.activityCategory as ActivityCategory] || CATEGORY_CONFIG.OTHER;

  // Already submitted
  if (activity.isSubmitted) {
    return (
      <div className="container" style={{ paddingTop: "1.5rem", paddingBottom: "2rem" }}>
        <button className="btn btn-ghost btn-sm mb-4" onClick={() => router.push("/child/activities")}>
          ← Back
        </button>
        <div className="card card-child" style={{ maxWidth: "500px", margin: "0 auto" }}>
          <div className="flex-center flex-col gap-3" style={{ padding: "1rem" }}>
            <div style={{ fontSize: "4rem" }}>{activity.activityIcon}</div>
            <h2 style={{ fontFamily: "'Fredoka', cursive", fontSize: "1.5rem" }}>
              {activity.activityName}
            </h2>
            <span className="badge badge-lg" style={{ backgroundColor: `${catConfig.color}20`, color: catConfig.color, borderColor: catConfig.color }}>
              {catConfig.icon} {catConfig.label}
            </span>
            {activity.submissionStatus === "PENDING" && (
              <div className="alert alert-warning" style={{ marginTop: "1rem" }}>
                ⏳ Waiting for parent approval. Great job completing this!
              </div>
            )}
            {activity.submissionStatus === "APPROVED" && (
              <div className="alert alert-success" style={{ marginTop: "1rem" }}>
                ✅ Approved! You earned {activity.pointValue} points!
              </div>
            )}
            {activity.submissionStatus === "REJECTED" && (
              <div className="alert alert-info" style={{ marginTop: "1rem" }}>
                💪 Try again tomorrow! You can do it!
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: "1.5rem", paddingBottom: "2rem" }}>
      <button className="btn btn-ghost btn-sm mb-4" onClick={() => router.push("/child/activities")}>
        ← Back to Activities
      </button>

      {/* Activity Header Card */}
      <div className="card card-child" style={{ maxWidth: "550px", margin: "0 auto 1.5rem" }}>
        <div className="flex-center gap-3 mb-3">
          <div style={{ fontSize: "3.5rem" }}>{activity.activityIcon}</div>
          <div>
            <h2 style={{ fontFamily: "'Fredoka', cursive", fontSize: "1.5rem", marginBottom: "0.25rem" }}>
              {activity.activityName}
            </h2>
            <span className="badge badge-lg" style={{ backgroundColor: `${catConfig.color}20`, color: catConfig.color, borderColor: catConfig.color }}>
              {catConfig.icon} {catConfig.label}
            </span>
          </div>
        </div>
        {activity.activityDescription && (
          <p style={{ color: "#6B6B80", fontSize: "0.95rem" }}>{activity.activityDescription}</p>
        )}
        <div className="flex-center gap-4 mt-4" style={{ justifyContent: "space-around" }}>
          <div className="coin-badge">🪙 {activity.pointValue} points</div>
          {activity.requiresPhoto && <div className="badge badge-accent">📸 Photo required</div>}
        </div>
      </div>

      {/* Submission Form */}
      <div className="card" style={{ maxWidth: "550px", margin: "0 auto" }}>
        <h3 style={{ fontFamily: "'Fredoka', cursive", fontSize: "1.25rem", marginBottom: "1rem" }}>
          What did you do today? 🌟
        </h3>

        {error && (
          <div className="alert alert-error mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" style={{ fontFamily: "'Fredoka', cursive" }}>
              Tell us about it! ✏️
            </label>
            <textarea
              className="textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="I studied math for 30 minutes and finished my homework..."
              rows={4}
              disabled={submitting}
            />
          </div>

          {activity.requiresPhoto && (
            <div className="input-group">
              <label className="input-label" style={{ fontFamily: "'Fredoka', cursive" }}>
                Upload a photo 📸
              </label>
              <p className="input-hint mb-2">Take a photo of your completed activity. No editing or filters!</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoSelect}
                style={{ display: "none" }}
                disabled={submitting}
              />
              {photoPreview ? (
                <div className="flex-center flex-col gap-2">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "250px",
                      borderRadius: "16px",
                      border: "3px solid #FFE0B2",
                      objectFit: "cover",
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => { setPhotoPreview(null); setPhotoPath(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  >
                    🔄 Change Photo
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-outline btn-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={submitting}
                >
                  📷 Choose Photo
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-success btn-full btn-lg"
            disabled={submitting}
            style={{ marginTop: "0.5rem", fontFamily: "'Fredoka', cursive" }}
          >
            {submitting ? (
              <span className="flex-center gap-2">
                <span className="spinner spinner-sm spinner-white" /> Submitting...
              </span>
            ) : (
              "✅ Mark as Done!"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
