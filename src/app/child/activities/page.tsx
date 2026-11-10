"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CATEGORY_CONFIG, type ActivityCategory } from "@/types";

// ─── Local Types ──────────────────────────────────────────────────────────
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

interface DashboardData {
  todayActivities: DueActivity[];
  completedToday: number;
  totalToday: number;
}

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: "Every day",
  EVERY_2_DAYS: "Every 2 days",
  EVERY_3_DAYS: "Every 3 days",
  EVERY_4_DAYS: "Every 4 days",
};

export default function ChildActivitiesPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpcoming, setShowUpcoming] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/child")
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || "Failed to load activities");
        }
      })
      .catch(() => setError("Something went wrong. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  // ─── Loading State ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-col gap-4">
        <div className="skeleton" style={{ height: 60, borderRadius: "var(--radius-xl)" }} />
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
      </div>
    );
  }

  // ─── Error State ─────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="alert alert-error">
        <span style={{ fontSize: "1.5rem" }}>😟</span>
        <div>
          <div className="alert-title">Oops!</div>
          {error || "Could not load your activities."}
        </div>
      </div>
    );
  }

  const activities = data.todayActivities || [];
  const pending = activities.filter((a) => !a.isSubmitted);
  const submitted = activities.filter((a) => a.isSubmitted);
  const approved = submitted.filter((a) => a.submissionStatus === "APPROVED");
  const awaitingApproval = submitted.filter((a) => a.submissionStatus === "PENDING");
  const needsRevision = submitted.filter((a) => a.submissionStatus === "REJECTED");

  return (
    <div className="flex-col gap-6 animate-fadeIn">
      {/* Header */}
      <div className="text-center">
        <div className="animate-float" style={{ fontSize: "3rem" }} aria-hidden="true">
          📋
        </div>
        <h1 style={{ marginBottom: "var(--space-2)" }}>My Activities</h1>
        <p className="text-muted" style={{ marginBottom: 0 }}>
          Complete your tasks and earn points! ⭐
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid-4 gap-3">
        <div className="card card-child text-center" style={{ padding: "var(--space-4)" }}>
          <div style={{ fontSize: "1.8rem" }} aria-hidden="true">🎯</div>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: "var(--font-bold)",
              fontSize: "var(--text-2xl)",
              color: "var(--color-primary)",
            }}
          >
            {pending.length}
          </div>
          <small className="text-muted">To Do</small>
        </div>
        <div className="card card-child text-center" style={{ padding: "var(--space-4)" }}>
          <div style={{ fontSize: "1.8rem" }} aria-hidden="true">⏳</div>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: "var(--font-bold)",
              fontSize: "var(--text-2xl)",
              color: "var(--color-warning-dark)",
            }}
          >
            {awaitingApproval.length}
          </div>
          <small className="text-muted">Pending</small>
        </div>
        <div className="card card-child text-center" style={{ padding: "var(--space-4)" }}>
          <div style={{ fontSize: "1.8rem" }} aria-hidden="true">✅</div>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: "var(--font-bold)",
              fontSize: "var(--text-2xl)",
              color: "var(--color-success-dark)",
            }}
          >
            {approved.length}
          </div>
          <small className="text-muted">Approved</small>
        </div>
        <div className="card card-child text-center" style={{ padding: "var(--space-4)" }}>
          <div style={{ fontSize: "1.8rem" }} aria-hidden="true">↻</div>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: "var(--font-bold)",
              fontSize: "var(--text-2xl)",
              color: "var(--color-danger)",
            }}
          >
            {needsRevision.length}
          </div>
          <small className="text-muted">Revision</small>
        </div>
      </div>

      {/* To Do Activities */}
      <div className="card card-child">
        <div className="card-header">
          <h3 style={{ marginBottom: 0 }}>🎯 To Do Today</h3>
          <span className="badge badge-primary badge-lg">{pending.length} Left</span>
        </div>
        {pending.length === 0 ? (
          <div className="text-center py-4">
            <div style={{ fontSize: "3rem", marginBottom: "var(--space-2)" }} aria-hidden="true">
              🎉
            </div>
            <p style={{ marginBottom: 0, fontFamily: "var(--font-heading)", fontWeight: "var(--font-bold)" }}>
              All done for today! Amazing work! 🌟
            </p>
          </div>
        ) : (
          <div className="flex-col gap-3">
            {pending.map((activity, index) => (
              <ActivityCard key={activity.scheduleId} activity={activity} index={index} showComplete />
            ))}
          </div>
        )}
      </div>

      {/* Overdue / Needs Revision */}
      {needsRevision.length > 0 && (
        <div className="card card-child" style={{ borderColor: "var(--color-danger)" }}>
          <div className="card-header">
            <h3 style={{ marginBottom: 0, color: "var(--color-danger)" }}>↻ Needs Revision</h3>
            <span className="badge badge-danger badge-lg">{needsRevision.length}</span>
          </div>
          <div className="flex-col gap-3">
            {needsRevision.map((activity, index) => (
              <ActivityCard key={activity.scheduleId} activity={activity} index={index} showComplete />
            ))}
          </div>
        </div>
      )}

      {/* Pending Approval */}
      {awaitingApproval.length > 0 && (
        <div className="card card-child">
          <div className="card-header">
            <h3 style={{ marginBottom: 0 }}>⏳ Waiting for Approval</h3>
            <span className="badge badge-warning badge-lg">{awaitingApproval.length}</span>
          </div>
          <div className="flex-col gap-3">
            {awaitingApproval.map((activity, index) => (
              <ActivityCard key={activity.scheduleId} activity={activity} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Approved */}
      {approved.length > 0 && (
        <div className="card card-child">
          <div className="card-header">
            <h3 style={{ marginBottom: 0 }}>✅ Completed Today</h3>
            <span className="badge badge-success badge-lg">{approved.length}</span>
          </div>
          <div className="flex-col gap-3">
            {approved.map((activity, index) => (
              <ActivityCard key={activity.scheduleId} activity={activity} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Activities (collapsible) */}
      <div className="card card-child">
        <button
          className="btn btn-ghost btn-full flex-between"
          onClick={() => setShowUpcoming(!showUpcoming)}
          style={{ padding: "var(--space-2) 0" }}
        >
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: "var(--font-bold)", fontSize: "var(--text-lg)" }}>
            📅 Upcoming This Week
          </span>
          <span style={{ fontSize: "1.2rem" }}>{showUpcoming ? "▲" : "▼"}</span>
        </button>
        {showUpcoming && (
          <div className="animate-slideDown" style={{ paddingTop: "var(--space-3)" }}>
            <div className="alert alert-info" style={{ marginBottom: 0 }}>
              <span style={{ fontSize: "1.5rem" }}>💡</span>
              <div>
                Your activities repeat on a schedule. Check back each day to see what&apos;s due!
                You have <strong>{data.totalToday}</strong> activities scheduled for today.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* No activities at all */}
      {activities.length === 0 && (
        <div className="card card-child text-center">
          <div className="animate-float" style={{ fontSize: "3rem", marginBottom: "var(--space-3)" }} aria-hidden="true">
            🌟
          </div>
          <h3 style={{ marginBottom: "var(--space-2)" }}>No Activities Yet!</h3>
          <p className="text-muted" style={{ marginBottom: 0 }}>
            Your parent hasn&apos;t scheduled any activities for you yet. Check back soon!
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Activity Card Component ───────────────────────────────────────────────
function ActivityCard({
  activity,
  index,
  showComplete = false,
}: {
  activity: DueActivity;
  index: number;
  showComplete?: boolean;
}) {
  const catConfig =
    CATEGORY_CONFIG[activity.activityCategory as ActivityCategory] || CATEGORY_CONFIG.OTHER;

  return (
    <div
      className="card card-hover animate-slideUp"
      style={{
        padding: "var(--space-4)",
        animationDelay: `${index * 80}ms`,
        opacity: 0,
        animationFillMode: "forwards",
      }}
    >
      <div className="flex items-start gap-3 flex-wrap">
        <span
          className="flex-center"
          style={{
            fontSize: "2rem",
            width: "3.5rem",
            height: "3.5rem",
            borderRadius: "var(--radius-lg)",
            background: `${catConfig.color}22`,
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          {activity.activityIcon}
        </span>
        <div className="flex-1" style={{ minWidth: 200 }}>
          <h4 style={{ marginBottom: "var(--space-1)" }}>{activity.activityName}</h4>
          {activity.activityDescription && (
            <p className="text-muted" style={{ marginBottom: "var(--space-2)", fontSize: "var(--text-sm)" }}>
              {activity.activityDescription}
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="badge badge-accent">{catConfig.icon} {catConfig.label}</span>
            <span className="coin-badge">+{activity.pointValue} pts</span>
            <span className="badge badge-primary">
              {FREQUENCY_LABELS[activity.frequency] || activity.frequency}
            </span>
            {activity.requiresPhoto && (
              <span className="badge badge-secondary">📷 Photo</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activity.isSubmitted ? (
            <StatusBadge status={activity.submissionStatus} />
          ) : showComplete ? (
            <Link
              href={`/child/activities/${activity.activityId}`}
              className="btn btn-success btn-sm"
            >
              ✓ Complete
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string | null }) {
  if (status === "APPROVED") {
    return <span className="badge badge-success badge-lg">✓ Approved</span>;
  }
  if (status === "REJECTED") {
    return <span className="badge badge-danger badge-lg">↻ Needs Revision</span>;
  }
  return <span className="badge badge-warning badge-lg">⏳ Pending</span>;
}
