"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

// ─── Level Definitions (mirrors gamification.ts, client-safe) ──────────────
const LEVELS = [
  { level: 1, name: "Beginner Explorer", icon: "🌱", minPoints: 0 },
  { level: 2, name: "Smart Learner", icon: "📖", minPoints: 100 },
  { level: 3, name: "Outdoor Champion", icon: "🏆", minPoints: 300 },
  { level: 4, name: "Cleanliness Hero", icon: "🦸", minPoints: 600 },
  { level: 5, name: "Yuan's World Champion", icon: "👑", minPoints: 1000 },
];

// ─── Badge Definitions (mirrors gamification.ts, client-safe) ─────────────
const BADGES = [
  { id: "first_activity", name: "First Steps", icon: "🎯", description: "Completed your very first activity!" },
  { id: "five_activities", name: "Getting Started", icon: "⭐", description: "Completed 5 activities!" },
  { id: "ten_activities", name: "Activity Star", icon: "🌟", description: "Completed 10 activities!" },
  { id: "twenty_five_activities", name: "Super Achiever", icon: "💫", description: "Completed 25 activities!" },
  { id: "fifty_activities", name: "Activity Master", icon: "🏅", description: "Completed 50 activities!" },
  { id: "streak_3", name: "Consistent Worker", icon: "🔥", description: "3-day activity streak!" },
  { id: "streak_7", name: "Week Warrior", icon: "💪", description: "7-day activity streak!" },
  { id: "streak_30", name: "Monthly Champion", icon: "🏆", description: "30-day activity streak!" },
  { id: "reader", name: "Bookworm", icon: "📚", description: "Completed 5 reading activities!" },
  { id: "outdoor", name: "Nature Explorer", icon: "🌳", description: "Completed 5 outdoor activities!" },
  { id: "cleaner", name: "Cleanliness Star", icon: "✨", description: "Completed 5 cleanliness activities!" },
  { id: "helper", name: "Helpful Heart", icon: "❤️", description: "Completed 5 household chores!" },
  { id: "studious", name: "Study Champion", icon: "🎓", description: "Completed 10 studying activities!" },
  { id: "level_2", name: "Level Up!", icon: "📖", description: "Reached Level 2 - Smart Learner!" },
  { id: "level_3", name: "Champion Status", icon: "🏆", description: "Reached Level 3 - Outdoor Champion!" },
  { id: "level_4", name: "Hero Status", icon: "🦸", description: "Reached Level 4 - Cleanliness Hero!" },
  { id: "level_5", name: "World Champion", icon: "👑", description: "Reached Level 5 - Yuan's World Champion!" },
];

// ─── Local Types ──────────────────────────────────────────────────────────
interface ChildProfile {
  id: string;
  name: string;
  avatar: string;
  points: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
}

interface Achievement {
  id: string;
  badgeName: string;
  badgeIcon: string;
  description: string;
  pointsAwarded: number;
  earnedAt: string;
}

interface LevelInfo {
  level: number;
  name: string;
  icon: string;
  minPoints: number;
}

interface DashboardData {
  child: ChildProfile;
  levelInfo: LevelInfo;
  nextLevelInfo: LevelInfo | null;
  pointsToNextLevel: number;
}

export default function ChildAchievementsPage() {
  const { data: session } = useSession();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const childId = session?.user?.childProfileId;
    if (!childId) {
      setLoading(false);
      return;
    }

    Promise.all([
      fetch(`/api/achievements/${childId}`).then((r) => r.json()),
      fetch("/api/dashboard/child").then((r) => r.json()),
    ])
      .then(([achRes, dashRes]) => {
        if (achRes.success) setAchievements(achRes.data);
        if (dashRes.success) setDashboard(dashRes.data);
        if (!achRes.success && !dashRes.success) {
          setError("Failed to load achievements");
        }
      })
      .catch(() => setError("Something went wrong. Please try again."))
      .finally(() => setLoading(false));
  }, [session]);

  // ─── Loading State ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-col gap-4">
        <div className="skeleton" style={{ height: 120, borderRadius: "var(--radius-2xl)" }} />
        <div className="skeleton" style={{ height: 80, borderRadius: "var(--radius-xl)" }} />
        <div className="grid-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 140, borderRadius: "var(--radius-xl)" }} />
          ))}
        </div>
      </div>
    );
  }

  // ─── Error State ─────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="alert alert-error">
        <span style={{ fontSize: "1.5rem" }}>😟</span>
        <div>
          <div className="alert-title">Oops!</div>
          {error}
        </div>
      </div>
    );
  }

  const child = dashboard?.child;
  const earnedBadgeIds = new Set(achievements.map((a) => a.badgeName));
  const earnedCount = achievements.length;
  const totalBadges = BADGES.length;

  const currentLevel = child?.level || 1;
  const levelInfo = dashboard?.levelInfo || LEVELS[currentLevel - 1] || LEVELS[0];
  const nextLevelInfo = dashboard?.nextLevelInfo;
  const points = child?.points || 0;
  const pointsToNext = dashboard?.pointsToNextLevel || 0;

  // Level progress
  const currentLevelMin = levelInfo.minPoints;
  const nextLevelMin = nextLevelInfo?.minPoints ?? points;
  const levelProgress = nextLevelInfo
    ? Math.min(100, Math.round(((points - currentLevelMin) / (nextLevelMin - currentLevelMin)) * 100))
    : 100;

  return (
    <div className="flex-col gap-6 animate-fadeIn">
      {/* Header */}
      <div className="text-center">
        <div className="animate-bounce" style={{ fontSize: "3rem" }} aria-hidden="true">
          🏆
        </div>
        <h1 style={{ marginBottom: "var(--space-2)" }}>My Achievements</h1>
        <p className="text-muted" style={{ marginBottom: 0 }}>
          Collect badges and level up by completing activities! ⭐
        </p>
      </div>

      {/* Level Card */}
      <div className="card card-child">
        <div className="flex items-center gap-4 flex-wrap">
          <span
            className="flex-center animate-float"
            style={{
              fontSize: "3.5rem",
              width: "5rem",
              height: "5rem",
              borderRadius: "var(--radius-2xl)",
              background: "var(--color-primary-soft)",
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            {levelInfo.icon}
          </span>
          <div className="flex-1" style={{ minWidth: 200 }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge badge-primary badge-lg">Level {currentLevel}</span>
              <span className="coin-badge">{points} Points</span>
            </div>
            <h2 style={{ marginBottom: "var(--space-2)" }}>{levelInfo.name}</h2>
            {nextLevelInfo ? (
              <div className="progress-container">
                <div className="progress-label mb-2">
                  <span>Progress to Level {nextLevelInfo.level}</span>
                  <span>{pointsToNext} pts to go</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${levelProgress}%` }} />
                </div>
                <p className="text-muted mt-2" style={{ fontSize: "var(--text-sm)", marginBottom: 0 }}>
                  Next: {nextLevelInfo.icon} {nextLevelInfo.name}
                </p>
              </div>
            ) : (
              <div className="alert alert-success" style={{ marginBottom: 0 }}>
                <span style={{ fontSize: "1.5rem" }}>👑</span>
                <div>
                  <div className="alert-title">Max Level Reached!</div>
                  You&apos;re a Yuan&apos;s World Champion! Amazing!
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid-3 gap-4">
        <div className="card card-child text-center" style={{ padding: "var(--space-4)" }}>
          <div className="coin-badge" style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-2)" }}>
            {points}
          </div>
          <small className="text-muted">Total Points</small>
        </div>
        <div className="card card-child text-center" style={{ padding: "var(--space-4)" }}>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: "var(--font-bold)",
              fontSize: "var(--text-3xl)",
              color: "var(--color-warning-dark)",
              marginBottom: "var(--space-2)",
            }}
          >
            {earnedCount}
          </div>
          <small className="text-muted">Badges Earned</small>
        </div>
        <div className="card card-child text-center" style={{ padding: "var(--space-4)" }}>
          <div className="streak-counter" style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-2)" }}>
            🔥 {child?.longestStreak || 0}
          </div>
          <small className="text-muted">Best Streak (days)</small>
        </div>
      </div>

      {/* Badge Collection */}
      <div className="card card-child">
        <div className="card-header">
          <h3 style={{ marginBottom: 0 }}>🎖️ Badge Collection</h3>
          <span className="badge badge-primary badge-lg">
            {earnedCount} / {totalBadges}
          </span>
        </div>

        {/* Progress to all badges */}
        <div className="progress-container mb-6">
          <div className="progress-label mb-2">
            <span>Collection Progress</span>
            <span>{Math.round((earnedCount / totalBadges) * 100)}%</span>
          </div>
          <div className="progress-bar progress-sm">
            <div
              className="progress-fill"
              style={{ width: `${(earnedCount / totalBadges) * 100}%` }}
            />
          </div>
        </div>

        <div className="grid-3 gap-4">
          {BADGES.map((badge, index) => {
            const earned = earnedBadgeIds.has(badge.id);
            const earnedAch = achievements.find((a) => a.badgeName === badge.id);
            return (
              <div
                key={badge.id}
                className={`card-hover text-center animate-slideUp`}
                style={{
                  padding: "var(--space-4)",
                  borderRadius: "var(--radius-xl)",
                  background: earned ? "var(--color-warning-soft)" : "var(--color-bg)",
                  border: earned ? "3px solid var(--color-warning)" : "2px dashed var(--color-border)",
                  opacity: 0,
                  animationFillMode: "forwards",
                  animationDelay: `${index * 50}ms`,
                  filter: earned ? "none" : "grayscale(1)",
                  transition: "transform var(--transition-normal) var(--ease-bounce)",
                }}
              >
                <div
                  style={{
                    fontSize: "2.5rem",
                    marginBottom: "var(--space-2)",
                    opacity: earned ? 1 : 0.4,
                  }}
                  aria-hidden="true"
                >
                  {badge.icon}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontWeight: "var(--font-bold)",
                    fontSize: "var(--text-sm)",
                    color: earned ? "var(--color-text)" : "var(--color-text-muted)",
                    marginBottom: "var(--space-1)",
                  }}
                >
                  {badge.name}
                </div>
                <p
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-light)",
                    marginBottom: "var(--space-2)",
                    minHeight: "2.5em",
                  }}
                >
                  {badge.description}
                </p>
                {earned ? (
                  <span className="badge badge-success badge-lg animate-pop">✓ Earned!</span>
                ) : (
                  <span className="badge badge-lg" style={{ opacity: 0.6 }}>🔒 Locked</span>
                )}
                {earned && earnedAch && (
                  <p className="text-muted mt-2" style={{ fontSize: "var(--text-xs)", marginBottom: 0 }}>
                    {formatDate(earnedAch.earnedAt)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Achievements Timeline */}
      {achievements.length > 0 && (
        <div className="card card-child">
          <div className="card-header">
            <h3 style={{ marginBottom: 0 }}>📅 Achievement Timeline</h3>
          </div>
          <div className="flex-col gap-3">
            {achievements.slice(0, 10).map((ach, index) => {
              const badge = BADGES.find((b) => b.id === ach.badgeName);
              return (
                <div
                  key={ach.id}
                  className="flex items-center gap-3 animate-slideUp"
                  style={{
                    padding: "var(--space-3)",
                    borderRadius: "var(--radius-lg)",
                    background: index % 2 === 0 ? "var(--color-bg)" : "transparent",
                    opacity: 0,
                    animationFillMode: "forwards",
                    animationDelay: `${index * 60}ms`,
                  }}
                >
                  <span
                    className="flex-center"
                    style={{
                      fontSize: "1.8rem",
                      width: "3rem",
                      height: "3rem",
                      borderRadius: "var(--radius-full)",
                      background: "var(--color-warning-soft)",
                      flexShrink: 0,
                    }}
                    aria-hidden="true"
                  >
                    {ach.badgeIcon}
                  </span>
                  <div className="flex-1">
                    <div
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontWeight: "var(--font-bold)",
                        fontSize: "var(--text-base)",
                      }}
                    >
                      {badge?.name || ach.badgeName.replace(/_/g, " ")}
                    </div>
                    <p className="text-muted" style={{ marginBottom: 0, fontSize: "var(--text-sm)" }}>
                      {ach.description}
                    </p>
                  </div>
                  <span className="badge badge-primary">{formatDate(ach.earnedAt)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Encouragement when no badges yet */}
      {achievements.length === 0 && (
        <div className="card card-child text-center">
          <div className="animate-float" style={{ fontSize: "3rem", marginBottom: "var(--space-3)" }} aria-hidden="true">
            🎯
          </div>
          <h3 style={{ marginBottom: "var(--space-2)" }}>No Badges Yet!</h3>
          <p className="text-muted" style={{ marginBottom: 0 }}>
            Complete your first activity to earn the &quot;First Steps&quot; badge! 🎯
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Date Formatter ─────────────────────────────────────────────────────────
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
