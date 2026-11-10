"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

// ─── Level Definitions (client-safe copy) ──────────────────────────────────
const LEVELS = [
  { level: 1, name: "Beginner Explorer", icon: "🌱", minPoints: 0 },
  { level: 2, name: "Smart Learner", icon: "📖", minPoints: 100 },
  { level: 3, name: "Outdoor Champion", icon: "🏆", minPoints: 300 },
  { level: 4, name: "Cleanliness Hero", icon: "🦸", minPoints: 600 },
  { level: 5, name: "Yuan's World Champion", icon: "👑", minPoints: 1000 },
];

// ─── Local Types ──────────────────────────────────────────────────────────
interface ChildProfile {
  id: string;
  childId: string;
  name: string;
  avatar: string;
  points: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
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
  levelInfo: LevelInfo;
  nextLevelInfo: LevelInfo | null;
  pointsToNextLevel: number;
  totalToday: number;
  completedToday: number;
}

export default function ChildProfilePage() {
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
          setError(result.error || "Failed to load profile");
        }
      })
      .catch(() => setError("Something went wrong. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  // ─── Loading State ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-col gap-4">
        <div className="skeleton" style={{ height: 160, borderRadius: "var(--radius-2xl)" }} />
        <div className="grid-2 gap-4">
          <div className="skeleton" style={{ height: 100, borderRadius: "var(--radius-xl)" }} />
          <div className="skeleton" style={{ height: 100, borderRadius: "var(--radius-xl)" }} />
        </div>
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
          {error || "Could not load your profile."}
        </div>
      </div>
    );
  }

  const child = data.child;
  const levelInfo = data.levelInfo || LEVELS[child.level - 1] || LEVELS[0];
  const nextLevelInfo = data.nextLevelInfo;
  const pointsToNext = data.pointsToNextLevel;

  // Level progress
  const currentLevelMin = levelInfo.minPoints;
  const nextLevelMin = nextLevelInfo?.minPoints ?? child.points;
  const levelProgress = nextLevelInfo
    ? Math.min(100, Math.round(((child.points - currentLevelMin) / (nextLevelMin - currentLevelMin)) * 100))
    : 100;

  // Days since joining
  const daysSinceJoin = Math.floor(
    (Date.now() - new Date(child.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="flex-col gap-6 animate-fadeIn" style={{ maxWidth: 700, margin: "0 auto" }}>
      {/* ─── Profile Header ──────────────────────────────────────────────── */}
      <div className="card card-child text-center">
        <div
          className="flex-center animate-float mx-auto mb-4"
          style={{
            fontSize: "4rem",
            width: "6rem",
            height: "6rem",
            borderRadius: "var(--radius-full)",
            background: "var(--color-primary-soft)",
            border: "4px solid #FFFFFF",
            boxShadow: "var(--shadow-md)",
          }}
          aria-hidden="true"
        >
          {child.avatar}
        </div>
        <h1 style={{ marginBottom: "var(--space-2)" }}>{child.name}</h1>
        <div className="flex items-center gap-2 justify-center flex-wrap">
          <span className="badge badge-primary badge-lg">Level {child.level}</span>
          <span className="badge badge-accent badge-lg">
            {levelInfo.icon} {levelInfo.name}
          </span>
        </div>
        <p className="text-muted mt-3" style={{ marginBottom: 0, fontSize: "var(--text-sm)" }}>
          Child ID: <strong>{child.childId}</strong> · Member for {daysSinceJoin} days
        </p>
      </div>

      {/* ─── Stats Grid ──────────────────────────────────────────────────── */}
      <div className="grid-2 gap-4">
        {/* Points */}
        <div className="card card-child text-center">
          <div className="flex-center" style={{ fontSize: "2rem", marginBottom: "var(--space-2)" }} aria-hidden="true">
            🪙
          </div>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: "var(--font-bold)",
              fontSize: "var(--text-4xl)",
              color: "var(--color-warning-dark)",
              marginBottom: "var(--space-1)",
            }}
          >
            {child.points}
          </div>
          <small className="text-muted">Total Points</small>
        </div>

        {/* Level */}
        <div className="card card-child text-center">
          <div className="flex-center" style={{ fontSize: "2rem", marginBottom: "var(--space-2)" }} aria-hidden="true">
            {levelInfo.icon}
          </div>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: "var(--font-bold)",
              fontSize: "var(--text-4xl)",
              color: "var(--color-primary)",
              marginBottom: "var(--space-1)",
            }}
          >
            {child.level}
          </div>
          <small className="text-muted">Current Level</small>
        </div>

        {/* Current Streak */}
        <div className="card card-child text-center">
          <div className="flex-center" style={{ fontSize: "2rem", marginBottom: "var(--space-2)" }} aria-hidden="true">
            🔥
          </div>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: "var(--font-bold)",
              fontSize: "var(--text-4xl)",
              color: "var(--color-danger)",
              marginBottom: "var(--space-1)",
            }}
          >
            {child.currentStreak}
          </div>
          <small className="text-muted">Current Streak (days)</small>
        </div>

        {/* Longest Streak */}
        <div className="card card-child text-center">
          <div className="flex-center" style={{ fontSize: "2rem", marginBottom: "var(--space-2)" }} aria-hidden="true">
            🏅
          </div>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: "var(--font-bold)",
              fontSize: "var(--text-4xl)",
              color: "var(--color-success-dark)",
              marginBottom: "var(--space-1)",
            }}
          >
            {child.longestStreak}
          </div>
          <small className="text-muted">Longest Streak (days)</small>
        </div>
      </div>

      {/* ─── Level Progression ───────────────────────────────────────────── */}
      <div className="card card-child">
        <div className="card-header">
          <h3 style={{ marginBottom: 0 }}>📈 Level Progress</h3>
          <span className="badge badge-primary badge-lg">
            {levelInfo.icon} {levelInfo.name}
          </span>
        </div>

        {nextLevelInfo ? (
          <>
            <div className="progress-container mb-4">
              <div className="progress-label mb-2">
                <span>{child.points} / {nextLevelMin} points</span>
                <span>{pointsToNext} to go</span>
              </div>
              <div className="progress-bar progress-lg">
                <div className="progress-fill" style={{ width: `${levelProgress}%` }} />
              </div>
            </div>

            {/* Level Path */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {LEVELS.map((lvl) => {
                const isCurrent = lvl.level === child.level;
                const isPast = lvl.level < child.level;
                const isNext = lvl.level === child.level + 1;
                return (
                  <div
                    key={lvl.level}
                    className="text-center animate-pop"
                    style={{
                      padding: "var(--space-3)",
                      borderRadius: "var(--radius-lg)",
                      minWidth: 90,
                      background: isCurrent
                        ? "var(--color-primary-soft)"
                        : isPast
                        ? "var(--color-success-soft)"
                        : "var(--color-bg)",
                      border: isCurrent
                        ? "3px solid var(--color-primary)"
                        : isNext
                        ? "3px dashed var(--color-accent)"
                        : "2px solid var(--color-border)",
                      opacity: isPast || isCurrent ? 1 : 0.5,
                    }}
                  >
                    <div style={{ fontSize: "1.5rem", marginBottom: "var(--space-1)" }} aria-hidden="true">
                      {lvl.icon}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontWeight: "var(--font-bold)",
                        fontSize: "var(--text-xs)",
                      }}
                    >
                      Lvl {lvl.level}
                    </div>
                    <small style={{ fontSize: "0.65rem", color: "var(--color-text-muted)" }}>
                      {lvl.minPoints} pts
                    </small>
                    {isCurrent && (
                      <div className="badge badge-primary mt-2" style={{ fontSize: "0.6rem" }}>
                        You are here
                      </div>
                    )}
                    {isPast && (
                      <div style={{ fontSize: "0.7rem", color: "var(--color-success)", marginTop: "2px" }}>
                        ✓ Done
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="alert alert-success" style={{ marginBottom: 0 }}>
            <span style={{ fontSize: "1.5rem" }}>👑</span>
            <div>
              <div className="alert-title">Max Level Reached!</div>
              You&apos;re a Yuan&apos;s World Champion! Amazing work! 🎉
            </div>
          </div>
        )}
      </div>

      {/* ─── Today's Summary ─────────────────────────────────────────────── */}
      <div className="card card-child">
        <div className="card-header">
          <h3 style={{ marginBottom: 0 }}>📅 Today&apos;s Summary</h3>
        </div>
        <div className="flex-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="badge badge-success badge-lg">
              {data.completedToday} Done
            </span>
            <span className="badge badge-primary badge-lg">
              {data.totalToday} Total
            </span>
          </div>
          <Link href="/child/activities" className="btn btn-primary btn-sm">
            View Activities →
          </Link>
        </div>
        <div className="progress-container mt-4">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${data.totalToday > 0 ? (data.completedToday / data.totalToday) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ─── Info Note ────────────────────────────────────────────────────── */}
      <div className="alert alert-info">
        <span style={{ fontSize: "1.5rem" }}>💡</span>
        <div>
          <div className="alert-title">Need to change something?</div>
          Ask your parent to update your profile. Only parents can change profile settings.
        </div>
      </div>

      {/* ─── Sign Out ────────────────────────────────────────────────────── */}
      <div className="text-center">
        <button
          className="btn btn-danger btn-lg"
          onClick={() => signOut({ callbackUrl: "/auth/login/child" })}
        >
          🚪 Sign Out
        </button>
      </div>
    </div>
  );
}
