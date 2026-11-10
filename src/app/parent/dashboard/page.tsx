"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { ChildProfile, RewardConfigData } from "@/types";

// ─── Local types matching the /api/dashboard/parent response ───────────────
interface RecentSubmission {
  id: string;
  activityId: string;
  childId: string;
  scheduleId: string;
  description: string;
  photoPath: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedDate: string;
  pointsAwarded: number;
  createdAt: string;
  activity: { name: string; icon: string; category: string };
  child: { name: string; avatar: string };
}

interface DashboardData {
  children: ChildProfile[];
  totalActivities: number;
  pendingSubmissions: number;
  recentSubmissions: RecentSubmission[];
  approvalStats: {
    approved: number;
    rejected: number;
    pending: number;
    total: number;
  };
}

const STATUS_BADGE: Record<string, string> = {
  APPROVED: "badge-success",
  PENDING: "badge-warning",
  REJECTED: "badge-danger",
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });

/** Compute progress toward the next level from the reward config thresholds. */
function getLevelProgress(points: number, level: number, config: RewardConfigData) {
  const thresholds = [
    config.level1Threshold,
    config.level2Threshold,
    config.level3Threshold,
    config.level4Threshold,
    config.level5Threshold,
  ];
  if (level >= 5) {
    return { pct: 100, current: thresholds[4], next: thresholds[4], isMax: true };
  }
  const idx = Math.max(0, Math.min(level - 1, 4));
  const current = thresholds[idx] ?? 0;
  const next = thresholds[level] ?? current;
  const span = next - current;
  const pct =
    span > 0
      ? Math.min(100, Math.max(0, ((points - current) / span) * 100))
      : 100;
  return { pct, current, next, isMax: false };
}

export default function ParentDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [config, setConfig] = useState<RewardConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, cfgRes] = await Promise.all([
        fetch("/api/dashboard/parent"),
        fetch("/api/rewards/config"),
      ]);
      const dashJson = await dashRes.json();
      const cfgJson = await cfgRes.json();
      if (!dashJson.success) {
        throw new Error(dashJson.error || "Failed to load dashboard");
      }
      setData(dashJson.data as DashboardData);
      if (cfgJson.success) setConfig(cfgJson.data as RewardConfigData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDecision = async (
    submissionId: string,
    decision: "APPROVED" | "REJECTED"
  ) => {
    setActioningId(submissionId);
    setActionMsg(null);
    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, decision, feedback: "" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to process");
      setActionMsg({
        type: "success",
        text:
          decision === "APPROVED"
            ? `Approved! ${json.data?.pointsAwarded ? `+${json.data.pointsAwarded} points` : ""}`
            : "Submission rejected.",
      });
      setData((prev) =>
        prev
          ? {
              ...prev,
              recentSubmissions: prev.recentSubmissions.map((s) =>
                s.id === submissionId ? { ...s, status: decision } : s
              ),
              pendingSubmissions: Math.max(
                0,
                prev.pendingSubmissions - (decision === "APPROVED" ? 0 : 0)
              ),
              approvalStats: {
                ...prev.approvalStats,
                pending: Math.max(0, prev.approvalStats.pending - 1),
                approved:
                  prev.approvalStats.approved +
                  (decision === "APPROVED" ? 1 : 0),
                rejected:
                  prev.approvalStats.rejected +
                  (decision === "REJECTED" ? 1 : 0),
              },
            }
          : prev
      );
    } catch (e) {
      setActionMsg({
        type: "error",
        text: e instanceof Error ? e.message : "Failed to process",
      });
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex-between mb-6 flex-wrap gap-2">
        <div>
          <h1 style={{ marginBottom: "0.25rem" }}>Parent Dashboard</h1>
          <p className="text-muted" style={{ marginBottom: 0 }}>
            Track your children&apos;s activities, approvals, and progress
          </p>
        </div>
        <Link href="/parent/approvals" className="btn btn-accent btn-sm">
          ✅ Go to Approvals
        </Link>
      </div>

      {actionMsg && (
        <div className={`alert ${actionMsg.type === "success" ? "alert-success" : "alert-error"}`}>
          <span>{actionMsg.text}</span>
        </div>
      )}
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <>
          <div className="grid-4 gap-4 mb-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="card-parent">
                <div className="skeleton skeleton-text short" />
                <div className="skeleton skeleton-text" />
              </div>
            ))}
          </div>
          <div className="grid-2 gap-4">
            {[0, 1].map((i) => (
              <div key={i} className="skeleton skeleton-card" />
            ))}
          </div>
        </>
      ) : data ? (
        <>
          {/* Stat cards */}
          <div className="grid-4 gap-4 mb-6">
            <StatCard label="Total Children" value={data.children.length} icon="👧" accent="primary" />
            <StatCard label="Total Activities" value={data.totalActivities} icon="📋" accent="accent" />
            <StatCard
              label="Pending Approvals"
              value={data.pendingSubmissions}
              icon="⏳"
              accent="warning"
            />
            <StatCard
              label="Total Approved"
              value={data.approvalStats.approved}
              icon="✅"
              accent="success"
            />
          </div>

          {/* Children overview */}
          <section className="mb-6">
            <div className="flex-between mb-3 flex-wrap gap-2">
              <h3 style={{ marginBottom: 0 }}>Children Overview</h3>
              <Link href="/parent/children" className="btn btn-outline btn-sm">
                Manage Children →
              </Link>
            </div>
            {data.children.length === 0 ? (
              <div className="card-parent text-center">
                <p className="text-muted" style={{ marginBottom: "1rem" }}>
                  No children yet. Add your first child to get started.
                </p>
                <Link href="/parent/children" className="btn btn-primary">
                  ➕ Add a Child
                </Link>
              </div>
            ) : (
              <div className="grid-3 gap-4">
                {data.children.map((child) => {
                  const prog = config
                    ? getLevelProgress(child.points, child.level, config)
                    : null;
                  return (
                    <Link
                      key={child.id}
                      href="/parent/children"
                      className="card-parent card-hover"
                      style={{ display: "block" }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="avatar avatar-md">{child.avatar}</div>
                        <div>
                          <div className="card-title" style={{ fontSize: "1.1rem" }}>
                            {child.name}
                          </div>
                          <small className="text-muted">
                            ID: {child.childId}
                          </small>
                        </div>
                      </div>
                      <div className="flex gap-2 mb-3 flex-wrap">
                        <span className="badge badge-primary">
                          Level {child.level}
                        </span>
                        <span className="badge badge-warning">
                          ⭐ {child.points} pts
                        </span>
                        <span className="badge badge-danger">
                          🔥 {child.currentStreak} day streak
                        </span>
                      </div>
                      {prog && (
                        <div className="progress-container">
                          <div className="progress-label">
                            <span>
                              {prog.isMax ? "Max level reached" : `Level ${child.level + 1}`}
                            </span>
                            <span>
                              {prog.isMax
                                ? `${child.points} pts`
                                : `${child.points}/${prog.next} pts`}
                            </span>
                          </div>
                          <div className="progress-bar progress-sm">
                            <div
                              className="progress-fill"
                              style={{ width: `${prog.pct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* Approval stats + Recent submissions */}
          <div className="grid-2 gap-4">
            <section>
              <div className="card-parent">
                <div className="card-header">
                  <span className="card-title">Approval Stats</span>
                </div>
                <div className="flex flex-col gap-3">
                  <StatRow
                    label="Approved"
                    value={data.approvalStats.approved}
                    total={data.approvalStats.total}
                    badgeClass="badge-success"
                    fillClass="progress-success"
                  />
                  <StatRow
                    label="Pending"
                    value={data.approvalStats.pending}
                    total={data.approvalStats.total}
                    badgeClass="badge-warning"
                    fillClass="progress-warning"
                  />
                  <StatRow
                    label="Rejected"
                    value={data.approvalStats.rejected}
                    total={data.approvalStats.total}
                    badgeClass="badge-danger"
                    fillClass="progress-danger"
                  />
                </div>
              </div>
            </section>

            <section>
              <div className="card-parent">
                <div className="card-header">
                  <span className="card-title">Recent Submissions</span>
                  <Link href="/parent/approvals" className="btn btn-outline btn-sm">
                    View All
                  </Link>
                </div>
                {data.recentSubmissions.length === 0 ? (
                  <p className="text-muted text-center" style={{ padding: "1.5rem 0" }}>
                    No submissions yet
                  </p>
                ) : (
                  <div className="table-container" style={{ border: "none", boxShadow: "none" }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Child</th>
                          <th>Activity</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentSubmissions.map((sub) => (
                          <tr key={sub.id}>
                            <td>
                              <div className="flex items-center gap-2">
                                <div className="avatar avatar-xs">
                                  {sub.child.avatar}
                                </div>
                                <span>{sub.child.name}</span>
                              </div>
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <span aria-hidden="true">
                                  {sub.activity.icon}
                                </span>
                                <span>{sub.activity.name}</span>
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${STATUS_BADGE[sub.status]}`}>
                                {sub.status}
                              </span>
                            </td>
                            <td>{fmtDate(sub.submittedDate)}</td>
                            <td>
                              {sub.status === "PENDING" ? (
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    className="btn btn-success btn-sm"
                                    disabled={actioningId === sub.id}
                                    onClick={() =>
                                      handleDecision(sub.id, "APPROVED")
                                    }
                                    aria-label="Approve"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    disabled={actioningId === sub.id}
                                    onClick={() =>
                                      handleDecision(sub.id, "REJECTED")
                                    }
                                    aria-label="Reject"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <span className="text-muted">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: string;
  accent: "primary" | "accent" | "warning" | "success";
}) {
  const textClass = {
    primary: "text-primary",
    accent: "text-accent",
    warning: "text-warning",
    success: "text-success",
  }[accent];
  return (
    <div className="card-parent card-hover">
      <div className="flex-between">
        <span aria-hidden="true" style={{ fontSize: "1.5rem" }}>
          {icon}
        </span>
        <span className={`badge ${accent === "primary" ? "badge-primary" : accent === "accent" ? "badge-accent" : accent === "warning" ? "badge-warning" : "badge-success"}`}>
          {label}
        </span>
      </div>
      <div className={`card-title ${textClass}`} style={{ fontSize: "2rem", marginTop: "0.5rem" }}>
        {value}
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  total,
  badgeClass,
  fillClass,
}: {
  label: string;
  value: number;
  total: number;
  badgeClass: string;
  fillClass: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex-between mb-1">
        <span className={`badge ${badgeClass}`}>{label}</span>
        <span style={{ fontWeight: 700 }}>
          {value} <span className="text-muted">({pct}%)</span>
        </span>
      </div>
      <div className={`progress-bar ${fillClass}`}>
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
