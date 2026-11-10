"use client";

import { useEffect, useState } from "react";
import { CATEGORY_CONFIG, type ActivityCategory } from "@/types";

interface Submission {
  id: string;
  status: string;
  description: string;
  photoPath: string | null;
  submittedDate: string;
  createdAt: string;
  pointsAwarded: number;
  activity: { name: string; icon: string; category: string; pointValue: number };
  child: { name: string; avatar: string };
  approval: { decision: string; feedback: string } | null;
}

export default function ApprovalsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [processing, setProcessing] = useState<string | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const res = await fetch("/api/dashboard/parent");
      const data = await res.json();
      if (data.success) {
        // The dashboard returns recent submissions but we need ALL for this page
        // Let's use the recent submissions which is last 10
        // For a full list, we could add a dedicated endpoint but recent is sufficient
        setSubmissions(data.data.recentSubmissions || []);
      }
    } catch {
      console.error("Failed to fetch submissions");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (submissionId: string) => {
    setProcessing(submissionId);
    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, decision: "APPROVED", feedback: feedbackMap[submissionId] || "" }),
      });
      const data = await res.json();
      if (data.success) {
        // Update local state
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === submissionId
              ? { ...s, status: "APPROVED", approval: { decision: "APPROVED", feedback: feedbackMap[submissionId] || "" } }
              : s
          )
        );
      }
    } catch {
      console.error("Failed to approve");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (submissionId: string) => {
    setProcessing(submissionId);
    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, decision: "REJECTED", feedback: feedbackMap[submissionId] || "" }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === submissionId
              ? { ...s, status: "REJECTED", approval: { decision: "REJECTED", feedback: feedbackMap[submissionId] || "" } }
              : s
          )
        );
      }
    } catch {
      console.error("Failed to reject");
    } finally {
      setProcessing(null);
    }
  };

  const filtered = submissions.filter((s) => s.status === filter);
  const pendingCount = submissions.filter((s) => s.status === "PENDING").length;
  const approvedCount = submissions.filter((s) => s.status === "APPROVED").length;
  const rejectedCount = submissions.filter((s) => s.status === "REJECTED").length;

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: "50vh" }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ fontFamily: "'Fredoka', cursive", fontSize: "1.75rem", marginBottom: "0.25rem" }}>
        📋 Approvals
      </h1>
      <p className="text-muted mb-6" style={{ fontSize: "0.875rem" }}>
        Review and approve your child&apos;s activity submissions.
      </p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6" style={{ flexWrap: "wrap" }}>
        <button
          className={`btn btn-sm ${filter === "PENDING" ? "btn-warning" : "btn-outline"}`}
          onClick={() => setFilter("PENDING")}
        >
          ⏳ Pending ({pendingCount})
        </button>
        <button
          className={`btn btn-sm ${filter === "APPROVED" ? "btn-success" : "btn-outline"}`}
          onClick={() => setFilter("APPROVED")}
        >
          ✅ Approved ({approvedCount})
        </button>
        <button
          className={`btn btn-sm ${filter === "REJECTED" ? "btn-danger" : "btn-outline"}`}
          onClick={() => setFilter("REJECTED")}
        >
          ❌ Rejected ({rejectedCount})
        </button>
      </div>

      {/* Submissions List */}
      {filtered.length === 0 ? (
        <div className="card card-parent" style={{ textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
            {filter === "PENDING" ? "📭" : filter === "APPROVED" ? "✅" : "❌"}
          </div>
          <p className="text-muted" style={{ fontSize: "1rem" }}>
            {filter === "PENDING"
              ? "No pending submissions. All caught up!"
              : `No ${filter.toLowerCase()} submissions yet.`}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((sub) => {
            const catConfig = CATEGORY_CONFIG[sub.activity.category as ActivityCategory] || CATEGORY_CONFIG.OTHER;
            return (
              <div key={sub.id} className="card card-parent card-hover" style={{ padding: "1.25rem" }}>
                <div className="flex items-start gap-3" style={{ flexWrap: "wrap" }}>
                  {/* Child + Activity Info */}
                  <div className="flex items-center gap-3" style={{ flex: 1, minWidth: "200px" }}>
                    <div className="avatar avatar-md" style={{ background: "#FFE0B2", fontSize: "1.5rem" }}>
                      {sub.child.avatar}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontFamily: "'Fredoka', cursive" }}>
                        {sub.child.name}
                      </div>
                      <div className="flex-center gap-2">
                        <span style={{ fontSize: "1.2rem" }}>{sub.activity.icon}</span>
                        <span style={{ fontWeight: 600 }}>{sub.activity.name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {sub.status === "PENDING" && <span className="badge badge-warning badge-lg">⏳ Pending</span>}
                    {sub.status === "APPROVED" && <span className="badge badge-success badge-lg">✅ Approved</span>}
                    {sub.status === "REJECTED" && <span className="badge badge-danger badge-lg">❌ Rejected</span>}
                  </div>
                </div>

                {/* Category + Date */}
                <div className="flex items-center gap-3 mt-3" style={{ flexWrap: "wrap" }}>
                  <span className="badge" style={{ backgroundColor: `${catConfig.color}20`, color: catConfig.color, borderColor: catConfig.color }}>
                    {catConfig.icon} {catConfig.label}
                  </span>
                  <span className="badge badge-accent">🪙 {sub.activity.pointValue} pts</span>
                  <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                    📅 {new Date(sub.submittedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>

                {/* Description */}
                {sub.description && (
                  <div className="mt-3" style={{ padding: "0.75rem 1rem", background: "#FAFAFC", borderRadius: "12px" }}>
                    <p style={{ fontSize: "0.875rem", color: "#2D2D3F", fontStyle: "italic" }}>
                      &ldquo;{sub.description}&rdquo;
                    </p>
                  </div>
                )}

                {/* Photo */}
                {sub.photoPath && (
                  <div className="mt-3">
                    <a
                      href={`/api/submissions/${sub.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="badge badge-primary"
                      style={{ cursor: "pointer" }}
                    >
                      📸 View Photo
                    </a>
                  </div>
                )}

                {/* Feedback from approval */}
                {sub.approval?.feedback && (
                  <div className="mt-2" style={{ fontSize: "0.8rem", color: "#6B6B80" }}>
                    <strong>Feedback:</strong> {sub.approval.feedback}
                  </div>
                )}

                {/* Points awarded */}
                {sub.status === "APPROVED" && sub.pointsAwarded > 0 && (
                  <div className="mt-2">
                    <span className="coin-badge">🪙 {sub.pointsAwarded} points earned</span>
                  </div>
                )}

                {/* Action area for pending */}
                {sub.status === "PENDING" && (
                  <div className="mt-4" style={{ borderTop: "2px solid #E8E0F0", paddingTop: "1rem" }}>
                    <div className="input-group mb-3">
                      <label className="input-label" style={{ fontSize: "0.8rem" }}>
                        Feedback (optional)
                      </label>
                      <input
                        type="text"
                        className="input"
                        value={feedbackMap[sub.id] || ""}
                        onChange={(e) => setFeedbackMap((prev) => ({ ...prev, [sub.id]: e.target.value }))}
                        placeholder="Great job! / Please try again..."
                        disabled={processing === sub.id}
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        className="btn btn-success btn-sm flex-1"
                        onClick={() => handleApprove(sub.id)}
                        disabled={processing === sub.id}
                      >
                        {processing === sub.id ? <span className="spinner spinner-sm" /> : "✅ Approve"}
                      </button>
                      <button
                        className="btn btn-danger btn-sm flex-1"
                        onClick={() => handleReject(sub.id)}
                        disabled={processing === sub.id}
                      >
                        {processing === sub.id ? <span className="spinner spinner-sm" /> : "❌ Reject"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
