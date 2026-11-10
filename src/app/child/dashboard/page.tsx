"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CATEGORY_CONFIG, type ActivityCategory } from "@/types";

// ─── Local Types matching API response ──────────────────────────────────
interface ChildProfile {
  id: string;
  childId: string;
  name: string;
  avatar: string;
  points: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
}

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

interface Achievement {
  id: string;
  badgeName: string;
  badgeIcon: string;
  description: string;
  pointsAwarded: number;
  earnedAt: string;
}

interface ChildNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface LevelInfo {
  level: number;
  name: string;
  icon: string;
  minPoints: number;
}

interface DashboardData {
  child: ChildProfile;
  todayActivities: DueActivity[];
  completedToday: number;
  totalToday: number;
  recentAchievements: Achievement[];
  unreadNotifications: ChildNotification[];
  levelInfo: LevelInfo;
  nextLevelInfo: LevelInfo | null;
  pointsToNextLevel: number;
}

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: "Every day",
  EVERY_2_DAYS: "Every 2 days",
  EVERY_3_DAYS: "Every 3 days",
  EVERY_4_DAYS: "Every 4 days",
};

export default function ChildDashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/child")
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || "Failed to load dashboard");
        }
      })
      .catch(() => setError("Something went wrong. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  // ─── Loading State ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-col gap-4">
        <div className="skeleton skeleton-card" />
        <div className="grid-3 gap-4">
          <div className="skeleton" style={{ height: 120, borderRadius: "var(--radius-xl)" }} />
          <div className="skeleton" style={{ height: 120, borderRadius: "var(--radius-xl)" }} />
          <div className="skeleton" style={{ height: 120, borderRadius: "var(--radius-xl)" }} />
        </div>
        <div className="skeleton" style={{ height: 200, borderRadius: "var(--radius-xl)" }} />
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
          {error || "Could not load your dashboard."}
        </div>
      </div>
    );
  }

  const { child, todayActivities, completedToday, totalToday } = data;
  const childName = session?.user?.childName || child.name;
  const completionPct = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  // Level progress calculation
  const currentLevelMin = data.levelInfo.minPoints;
  const nextLevelMin = data.nextLevelInfo?.minPoints ?? child.points;
  const levelProgress =
    data.nextLevelInfo
      ? Math.min(
          100,
          Math.round(
            ((child.points - currentLevelMin) / (nextLevelMin - currentLevelMin)) * 100
          )
        )
      : 100;

  return (
    <div className="flex-col gap-6 animate-fadeIn">
      {/* ─── Welcome Banner ──────────────────────────────────────────────── */}
      <div className="card card-child flex-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <span className="avatar avatar-lg animate-float" aria-hidden="true">
            {child.avatar}
          </span>
          <div>
            <h1 style={{ marginBottom: 0, fontSize: "var(--text-3xl)" }}>
              Hi, {childName}! 👋
            </h1>
            <p className="text-muted" style={{ marginBottom: 0 }}>
              What did you do today?
            </p>
          </div>
        </div>
        {data.unreadNotifications.length > 0 && (
          <Link
            href="/child/achievements"
            className="badge badge-accent badge-lg animate-pulse"
            title="You have new notifications"
          >
            🔔 {data.unreadNotifications.length} New
          </Link>
        )}
      </div>

      {/* ─── Stats Cards ──────────────────────────────────────────────────── */}
      <div className="grid-3 gap-4">
        {/* Points */}
        <div className="card card-child card-hover text-center">
          <div
            className="flex-center"
            style={{ fontSize: "2.5rem", marginBottom: "var(--space-2)" }}
            aria-hidden="true"
          >
            🪙
          </div>
          <div className="coin-badge" style={{ marginBottom: "var(--space-2)" }}>
            {child.points} Points
          </div>
          <p className="text-muted" style={{ marginBottom: 0, fontSize: "var(--text-sm)" }}>
            Keep collecting coins!
          </p>
        </div>

        {/* Level */}
        <div className="card card-child card-hover text-center">
          <div
            className="flex-center animate-bounce"
            style={{ fontSize: "2.5rem", marginBottom: "var(--space-2)" }}
            aria-hidden="true"
          >
            {data.levelInfo.icon}
          </div>
          <div className="badge badge-primary badge-lg" style={{ marginBottom: "var(--space-2)" }}>
            Level {child.level}
          </div>
          <p
            style={{
              marginBottom: 0,
              fontSize: "var(--text-sm)",
              fontFamily: "var(--font-heading)",
              fontWeight: "var(--font-semibold)",
            }}
          >
            {data.levelInfo.name}
          </p>
        </div>

        {/* Streak */}
        <div className="card card-child card-hover text-center">
          <div
            className="flex-center"
            style={{ fontSize: "2.5rem", marginBottom: "var(--space-2)" }}
            aria-hidden="true"
          >
            🔥
          </div>
          <div className="streak-counter" style={{ marginBottom: "var(--space-2)" }}>
            {child.currentStreak} Day Streak
          </div>
          <p className="text-muted" style={{ marginBottom: 0, fontSize: "var(--text-sm)" }}>
            Best: {child.longestStreak} days
          </p>
        </div>
      </div>

      {/* ─── Today's Progress ────────────────────────────────────────────── */}
      <div className="card card-child">
        <div className="card-header">
          <h3 style={{ marginBottom: 0 }}>📅 Today&apos;s Progress</h3>
          <span className="badge badge-success badge-lg">
            {completedToday} / {totalToday} Done
          </span>
        </div>
        <div className="progress-container mb-4">
          <div className="progress-label mb-2">
            <span>Activities Completed</span>
            <span>{completionPct}%</span>
          </div>
          <div className={`progress-bar progress-lg ${completionPct === 100 ? "progress-success" : ""}`}>
            <div
              className="progress-fill"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>

        {/* Level Progress */}
        <div className="progress-container">
          <div className="progress-label mb-2">
            <span>
              {data.levelInfo.icon} Level {child.level}
            </span>
            <span>
              {data.nextLevelInfo
                ? `${data.pointsToNextLevel} pts to Level ${data.nextLevelInfo.level}`
                : "Max Level! 👑"}
            </span>
          </div>
          <div className="progress-bar progress-sm">
            <div
              className="progress-fill"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* ─── Today's Activities ───────────────────────────────────────────── */}
      <div className="card card-child">
        <div className="card-header">
          <h3 style={{ marginBottom: 0 }}>🎯 Today&apos;s Activities</h3>
          <span className="badge badge-primary">{todayActivities.length} Total</span>
        </div>
        {todayActivities.length === 0 ? (
          <div className="text-center py-6">
            <div style={{ fontSize: "3rem", marginBottom: "var(--space-3)" }} aria-hidden="true">
              🌟
            </div>
            <p className="text-muted" style={{ marginBottom: 0 }}>
              No activities scheduled for today. Enjoy your day!
            </p>
          </div>
        ) : (
          <div className="flex-col gap-3">
            {todayActivities.map((activity, index) => {
              const catConfig =
                CATEGORY_CONFIG[activity.activityCategory as ActivityCategory] ||
                CATEGORY_CONFIG.OTHER;
              return (
                <div
                  key={activity.scheduleId}
                  className={`card card-hover animate-slideUp`}
                  style={{
                    padding: "var(--space-4)",
                    animationDelay: `${index * 80}ms`,
                    opacity: 0,
                    animationFillMode: "forwards",
                  }}
                >
                  <div className="flex-between flex-wrap gap-3">
                    <div className="flex items-center gap-3 flex-1">
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
                      <div>
                        <h4 style={{ marginBottom: 0 }}>{activity.activityName}</h4>
                        <div className="flex items-center gap-2 flex-wrap mt-2">
                          <span className="badge badge-accent">{catConfig.icon} {catConfig.label}</span>
                          <span className="coin-badge">+{activity.pointValue} pts</span>
                          <span className="badge badge-primary">
                            {FREQUENCY_LABELS[activity.frequency] || activity.frequency}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      {activity.isSubmitted ? (
                        <StatusBadge status={activity.submissionStatus} />
                      ) : (
                        <Link
                          href={`/child/activities/${activity.activityId}`}
                          className="btn btn-success btn-sm"
                        >
                          ✓ Complete
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Recent Achievements ─────────────────────────────────────────── */}
      <div className="card card-child">
        <div className="card-header">
          <h3 style={{ marginBottom: 0 }}>🏆 Recent Badges</h3>
          <Link href="/child/achievements" className="btn btn-ghost btn-sm">
            See All →
          </Link>
        </div>
        {data.recentAchievements.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted" style={{ marginBottom: 0 }}>
              No badges yet. Complete activities to earn your first badge! 🎯
            </p>
          </div>
        ) : (
          <div className="flex gap-3 flex-wrap">
            {data.recentAchievements.map((ach, index) => (
              <div
                key={ach.id}
                className="card-hover text-center animate-pop"
                style={{
                  padding: "var(--space-3)",
                  borderRadius: "var(--radius-xl)",
                  background: "var(--color-warning-soft)",
                  border: "2px solid var(--color-warning)",
                  minWidth: 110,
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <div style={{ fontSize: "2.5rem", marginBottom: "var(--space-1)" }} aria-hidden="true">
                  {ach.badgeIcon}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontWeight: "var(--font-bold)",
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text)",
                  }}
                >
                  {ach.badgeName.replace(/_/g, " ")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Status Badge Component ───────────────────────────────────────────────
function StatusBadge({ status }: { status: string | null }) {
  if (status === "APPROVED") {
    return <span className="badge badge-success badge-lg">✓ Approved</span>;
  }
  if (status === "REJECTED") {
    return <span className="badge badge-danger badge-lg">↻ Needs Revision</span>;
  }
  return <span className="badge badge-warning badge-lg">⏳ Pending Approval</span>;
}
