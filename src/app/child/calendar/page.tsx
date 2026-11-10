"use client";

import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

// ─── Local Types ──────────────────────────────────────────────────────────
interface DaySubmission {
  id: string;
  activityName: string;
  activityIcon: string;
  category: string;
  status: string;
  pointsAwarded: number;
}

interface CalendarDay {
  date: string;
  completed: boolean;
  activitiesCompleted: number;
  activitiesTotal: number;
  submissions: DaySubmission[];
}

interface CalendarResponse {
  month: number;
  year: number;
  days: CalendarDay[];
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CATEGORY_CONFIG_LOCAL: Record<string, { label: string; icon: string }> = {
  STUDYING: { label: "Studying", icon: "📚" },
  READING: { label: "Reading", icon: "📖" },
  OUTDOOR: { label: "Outdoor", icon: "⚽" },
  CHORES: { label: "Chores", icon: "🏠" },
  CLEANLINESS: { label: "Cleanliness", icon: "✨" },
  OTHER: { label: "Other", icon: "🌟" },
};

export default function ChildCalendarPage() {
  const { data: session } = useSession();
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-indexed
  const [calendarData, setCalendarData] = useState<CalendarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  const childId = session?.user?.childProfileId;

  useEffect(() => {
    if (!childId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/calendar/${childId}?month=${viewMonth + 1}&year=${viewYear}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setCalendarData(result.data);
        } else {
          setError(result.error || "Failed to load calendar");
        }
      })
      .catch(() => setError("Something went wrong. Please try again."))
      .finally(() => setLoading(false));
  }, [childId, viewMonth, viewYear]);

  // Build day data lookup map
  const dayMap = useMemo(() => {
    const map = new Map<string, CalendarDay>();
    if (calendarData?.days) {
      for (const day of calendarData.days) {
        map.set(day.date, day);
      }
    }
    return map;
  }, [calendarData]);

  // Build calendar grid
  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const cells: (number | null)[] = [];
    // Leading empty cells
    for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
    // Day cells
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    // Trailing empty cells to complete last row
    while (cells.length % 7 !== 0) cells.push(null);

    return cells;
  }, [viewYear, viewMonth]);

  // Date string for a given day
  const getDateStr = (day: number): string => {
    const m = String(viewMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${viewYear}-${m}-${d}`;
  };

  // Day color helper
  const getDayColor = (day: number): "green" | "yellow" | "red" | "none" => {
    const dateStr = getDateStr(day);
    const dayData = dayMap.get(dateStr);
    if (!dayData) return "none";
    if (dayData.completed) return "green";
    if (dayData.submissions.length > 0) return "yellow";
    if (dayData.activitiesTotal > 0) return "red";
    return "none";
  };

  // Navigation
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const isCurrentMonth =
    viewMonth === now.getMonth() && viewYear === now.getFullYear();
  const today = now.getDate();

  // Summary stats
  const activeDays = calendarData?.days?.filter((d) => d.submissions.length > 0).length || 0;
  const totalCompleted = calendarData?.days?.reduce((sum, d) => sum + d.activitiesCompleted, 0) || 0;
  const totalSubmissions = calendarData?.days?.reduce((sum, d) => sum + d.submissions.length, 0) || 0;

  return (
    <div className="flex-col gap-6 animate-fadeIn">
      {/* Header */}
      <div className="text-center">
        <div className="animate-float" style={{ fontSize: "3rem" }} aria-hidden="true">
          📅
        </div>
        <h1 style={{ marginBottom: "var(--space-2)" }}>My Calendar</h1>
        <p className="text-muted" style={{ marginBottom: 0 }}>
          See all the activities you&apos;ve completed! 🌟
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid-3 gap-4">
        <div className="card card-child text-center" style={{ padding: "var(--space-4)" }}>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: "var(--font-bold)",
              fontSize: "var(--text-3xl)",
              color: "var(--color-success-dark)",
              marginBottom: "var(--space-2)",
            }}
          >
            {activeDays}
          </div>
          <small className="text-muted">Active Days</small>
        </div>
        <div className="card card-child text-center" style={{ padding: "var(--space-4)" }}>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: "var(--font-bold)",
              fontSize: "var(--text-3xl)",
              color: "var(--color-primary)",
              marginBottom: "var(--space-2)",
            }}
          >
            {totalCompleted}
          </div>
          <small className="text-muted">Completed</small>
        </div>
        <div className="card card-child text-center" style={{ padding: "var(--space-4)" }}>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: "var(--font-bold)",
              fontSize: "var(--text-3xl)",
              color: "var(--color-accent-dark)",
              marginBottom: "var(--space-2)",
            }}
          >
            {totalSubmissions}
          </div>
          <small className="text-muted">Submissions</small>
        </div>
      </div>

      {/* Calendar Card */}
      <div className="card card-child">
        {/* Month Navigation */}
        <div className="flex-between mb-4">
          <button className="btn btn-outline btn-sm" onClick={prevMonth} aria-label="Previous month">
            ← Prev
          </button>
          <h2 style={{ marginBottom: 0 }}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h2>
          <button className="btn btn-outline btn-sm" onClick={nextMonth} aria-label="Next month">
            Next →
          </button>
        </div>

        {loading ? (
          <div className="flex-center" style={{ minHeight: 200 }}>
            <div className="spinner spinner-lg" />
          </div>
        ) : error ? (
          <div className="alert alert-error">
            <span style={{ fontSize: "1.5rem" }}>😟</span>
            <div>{error}</div>
          </div>
        ) : (
          <>
            {/* Day Headers */}
            <div className="grid-7 gap-2 mb-2" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "var(--space-2)" }}>
              {DAY_NAMES.map((day) => (
                <div
                  key={day}
                  className="text-center"
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontWeight: "var(--font-bold)",
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-muted)",
                    padding: "var(--space-1)",
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "var(--space-2)" }}>
              {calendarCells.map((day, index) => {
                if (day === null) {
                  return <div key={index} style={{ minHeight: 60 }} />;
                }

                const color = getDayColor(day);
                const dateStr = getDateStr(day);
                const dayData = dayMap.get(dateStr);
                const isToday = isCurrentMonth && day === today;
                const hasData = dayData && dayData.submissions.length > 0;

                return (
                  <button
                    key={index}
                    onClick={() => dayData && setSelectedDay(dayData)}
                    className="text-center animate-pop"
                    style={{
                      minHeight: 60,
                      padding: "var(--space-1)",
                      borderRadius: "var(--radius-md)",
                      border: isToday
                        ? "2px solid var(--color-primary)"
                        : "2px solid transparent",
                      background: color === "green"
                        ? "var(--color-success-soft)"
                        : color === "yellow"
                        ? "var(--color-warning-soft)"
                        : color === "red"
                        ? "var(--color-danger-soft)"
                        : "var(--color-bg)",
                      cursor: hasData ? "pointer" : "default",
                      transition: "transform var(--transition-fast) var(--ease-bounce)",
                      position: "relative",
                    }}
                    onMouseEnter={(e) => {
                      if (hasData) e.currentTarget.style.transform = "scale(1.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontWeight: isToday ? "var(--font-bold)" : "var(--font-semibold)",
                        fontSize: "var(--text-sm)",
                        color: "var(--color-text)",
                      }}
                    >
                      {day}
                    </div>
                    {/* Color dot */}
                    {color !== "none" && (
                      <div
                        style={{
                          width: "0.5rem",
                          height: "0.5rem",
                          borderRadius: "50%",
                          background:
                            color === "green"
                              ? "var(--color-success)"
                              : color === "yellow"
                              ? "var(--color-warning)"
                              : "var(--color-danger)",
                          margin: "2px auto",
                        }}
                      />
                    )}
                    {/* Activity count */}
                    {hasData && (
                      <div
                        style={{
                          fontSize: "var(--text-xs)",
                          color: "var(--color-text-light)",
                          fontFamily: "var(--font-heading)",
                          fontWeight: "var(--font-bold)",
                        }}
                      >
                        {dayData.submissions.length} 📝
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 flex-wrap mt-4" style={{ justifyContent: "center" }}>
              <div className="flex items-center gap-2">
                <span style={{ width: "0.75rem", height: "0.75rem", borderRadius: "50%", background: "var(--color-success)" }} />
                <small className="text-muted">All Done</small>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ width: "0.75rem", height: "0.75rem", borderRadius: "50%", background: "var(--color-warning)" }} />
                <small className="text-muted">Partial</small>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ width: "0.75rem", height: "0.75rem", borderRadius: "50%", background: "var(--color-danger)" }} />
                <small className="text-muted">Missed</small>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ width: "0.75rem", height: "0.75rem", borderRadius: "50%", background: "var(--color-border)" }} />
                <small className="text-muted">No Activity</small>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Day Detail Modal */}
      {selectedDay && (
        <div className="modal-overlay" onClick={() => setSelectedDay(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{formatDateLong(selectedDay.date)}</h2>
              <button className="modal-close" onClick={() => setSelectedDay(null)} aria-label="Close">
                ✕
              </button>
            </div>
            <div className="modal-body">
              {/* Day summary */}
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className={`badge badge-lg ${selectedDay.completed ? "badge-success" : "badge-warning"}`}>
                  {selectedDay.completed ? "✓ All Done!" : "Partial"}
                </span>
                <span className="badge badge-primary badge-lg">
                  {selectedDay.activitiesCompleted} / {selectedDay.activitiesTotal} Done
                </span>
              </div>

              {/* Submissions list */}
              {selectedDay.submissions.length === 0 ? (
                <p className="text-muted text-center py-4">No activities submitted on this day.</p>
              ) : (
                <div className="flex-col gap-3">
                  {selectedDay.submissions.map((sub) => {
                    const cat = CATEGORY_CONFIG_LOCAL[sub.category] || CATEGORY_CONFIG_LOCAL.OTHER;
                    return (
                      <div
                        key={sub.id}
                        className="flex items-center gap-3"
                        style={{
                          padding: "var(--space-3)",
                          borderRadius: "var(--radius-lg)",
                          background: "var(--color-bg)",
                        }}
                      >
                        <span
                          className="flex-center"
                          style={{
                            fontSize: "1.5rem",
                            width: "2.5rem",
                            height: "2.5rem",
                            borderRadius: "var(--radius-full)",
                            background: "var(--color-primary-soft)",
                            flexShrink: 0,
                          }}
                          aria-hidden="true"
                        >
                          {sub.activityIcon}
                        </span>
                        <div className="flex-1">
                          <div style={{ fontFamily: "var(--font-heading)", fontWeight: "var(--font-bold)" }}>
                            {sub.activityName}
                          </div>
                          <small className="text-muted">{cat.icon} {cat.label}</small>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={sub.status} />
                          {sub.status === "APPROVED" && sub.pointsAwarded > 0 && (
                            <span className="coin-badge">+{sub.pointsAwarded}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setSelectedDay(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Status Badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  if (status === "APPROVED") {
    return <span className="badge badge-success">✓ Approved</span>;
  }
  if (status === "REJECTED") {
    return <span className="badge badge-danger">↻ Rejected</span>;
  }
  return <span className="badge badge-warning">⏳ Pending</span>;
}

// ─── Date Formatter ─────────────────────────────────────────────────────────
function formatDateLong(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
