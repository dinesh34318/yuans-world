"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { CATEGORY_CONFIG, type ActivityCategory } from "@/types";

interface ChildInfo {
  id: string;
  name: string;
  avatar: string;
}

interface ReportData {
  child: { id: string; name: string; points: number; level: number; currentStreak: number; longestStreak: number };
  byCategory: Array<{ category: string; total: number; approved: number; rejected: number; pending: number; pointsEarned: number }>;
  dailyCompletion: Array<{ date: string; total: number; approved: number; rejected: number; pending: number }>;
  weeklySummary: Array<{ weekStart: string; weekEnd: string; total: number; approved: number; pointsEarned: number }>;
  streakHistory: Array<{ date: string; completed: boolean; activitiesCompleted: number; activitiesTotal: number }>;
  pointsOverTime: Array<{ date: string; pointsAwarded: number; cumulativePoints: number; activityName: string }>;
  summary: { totalSubmissions: number; approved: number; rejected: number; pending: number; totalPointsEarned: number };
}

export default function ReportsPage() {
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      const res = await fetch("/api/children");
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setChildren(data.data);
        setSelectedChild(data.data[0].id);
        fetchReport(data.data[0].id);
      }
    } catch {
      console.error("Failed to fetch children");
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async (childId: string) => {
    setReportLoading(true);
    try {
      const res = await fetch(`/api/reports/child/${childId}`);
      const data = await res.json();
      if (data.success) {
        setReport(data.data);
      }
    } catch {
      console.error("Failed to fetch report");
    } finally {
      setReportLoading(false);
    }
  };

  const handleChildChange = (childId: string) => {
    setSelectedChild(childId);
    fetchReport(childId);
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: "50vh" }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="container" style={{ paddingTop: "2rem" }}>
        <div className="card card-parent" style={{ textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📊</div>
          <h2 style={{ fontFamily: "'Fredoka', cursive" }}>No Children Yet</h2>
          <p className="text-muted">Add a child to view their reports and analytics.</p>
        </div>
      </div>
    );
  }

  // Chart data transformations
  const categoryChartData = report?.byCategory.map((c) => {
    const config = CATEGORY_CONFIG[c.category as ActivityCategory] || CATEGORY_CONFIG.OTHER;
    return {
      name: config.label,
      Approved: c.approved,
      Pending: c.pending,
      Rejected: c.rejected,
      color: config.color,
    };
  }) || [];

  const dailyChartData = report?.dailyCompletion.map((d) => ({
    date: d.date.slice(5), // MM-DD
    Submissions: d.total,
    Approved: d.approved,
  })) || [];

  const weeklyChartData = report?.weeklySummary.map((w) => ({
    week: w.weekStart.slice(5),
    Submissions: w.total,
    Approved: w.approved,
    Points: w.pointsEarned,
  })) || [];

  const pointsChartData = report?.pointsOverTime.map((p) => ({
    date: new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    Points: p.cumulativePoints,
  })) || [];

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1100px", margin: "0 auto" }}>
      <h1 style={{ fontFamily: "'Fredoka', cursive", fontSize: "1.75rem", marginBottom: "0.25rem" }}>
        📈 Reports & Analytics
      </h1>
      <p className="text-muted mb-6" style={{ fontSize: "0.875rem" }}>
        Track your child&apos;s progress and activity completion over time.
      </p>

      {/* Child Selector */}
      <div className="flex gap-2 mb-6" style={{ flexWrap: "wrap" }}>
        {children.map((child) => (
          <button
            key={child.id}
            className={`btn btn-sm ${selectedChild === child.id ? "btn-primary" : "btn-outline"}`}
            onClick={() => handleChildChange(child.id)}
          >
            {child.avatar} {child.name}
          </button>
        ))}
      </div>

      {reportLoading || !report ? (
        <div className="flex-center" style={{ minHeight: "40vh" }}>
          <div className="spinner spinner-lg" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid-4 mb-6" style={{ gap: "1rem" }}>
            <div className="card card-parent" style={{ padding: "1.25rem", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>📋</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, fontFamily: "'Fredoka', cursive" }}>
                {report.summary.totalSubmissions}
              </div>
              <div className="text-muted" style={{ fontSize: "0.75rem" }}>Total Submissions</div>
            </div>
            <div className="card card-parent" style={{ padding: "1.25rem", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>✅</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, fontFamily: "'Fredoka', cursive", color: "#2E7D32" }}>
                {report.summary.approved}
              </div>
              <div className="text-muted" style={{ fontSize: "0.75rem" }}>Approved</div>
            </div>
            <div className="card card-parent" style={{ padding: "1.25rem", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>⏳</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, fontFamily: "'Fredoka', cursive", color: "#F57F17" }}>
                {report.summary.pending}
              </div>
              <div className="text-muted" style={{ fontSize: "0.75rem" }}>Pending</div>
            </div>
            <div className="card card-parent" style={{ padding: "1.25rem", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>🪙</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, fontFamily: "'Fredoka', cursive", color: "#B26A00" }}>
                {report.summary.totalPointsEarned}
              </div>
              <div className="text-muted" style={{ fontSize: "0.75rem" }}>Points Earned</div>
            </div>
          </div>

          {/* Child Stats */}
          <div className="card card-parent mb-6" style={{ padding: "1.25rem" }}>
            <div className="flex-between" style={{ flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h3 style={{ fontFamily: "'Fredoka', cursive", fontSize: "1.25rem" }}>
                  {report.child.name}&apos;s Progress
                </h3>
                <div className="flex gap-4 mt-2" style={{ flexWrap: "wrap" }}>
                  <span className="badge badge-primary badge-lg">Level {report.child.level}</span>
                  <span className="coin-badge">🪙 {report.child.points} pts</span>
                  <span className="streak-counter">🔥 {report.child.currentStreak} day streak</span>
                  <span className="badge badge-accent badge-lg">🏆 Best: {report.child.longestStreak} days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid-2 mb-6" style={{ gap: "1rem" }}>
            {/* Category Bar Chart */}
            <div className="card card-parent" style={{ padding: "1.25rem" }}>
              <h4 style={{ fontFamily: "'Fredoka', cursive", fontSize: "1rem", marginBottom: "1rem" }}>
                Submissions by Category
              </h4>
              {categoryChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={categoryChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8E0F0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B6B80" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#6B6B80" }} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Approved" fill="#81C784" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Pending" fill="#FFD54F" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Rejected" fill="#EF5350" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted text-center" style={{ padding: "3rem 0" }}>No data yet.</p>
              )}
            </div>

            {/* Points Over Time */}
            <div className="card card-parent" style={{ padding: "1.25rem" }}>
              <h4 style={{ fontFamily: "'Fredoka', cursive", fontSize: "1rem", marginBottom: "1rem" }}>
                Points Progress Over Time
              </h4>
              {pointsChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={pointsChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8E0F0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6B6B80" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#6B6B80" }} allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="Points" stroke="#9B7FE6" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted text-center" style={{ padding: "3rem 0" }}>No points earned yet.</p>
              )}
            </div>
          </div>

          {/* Daily Completion */}
          <div className="card card-parent mb-6" style={{ padding: "1.25rem" }}>
            <h4 style={{ fontFamily: "'Fredoka', cursive", fontSize: "1rem", marginBottom: "1rem" }}>
              Daily Activity Completion (Last 30 Days)
            </h4>
            {dailyChartData.some((d) => d.Submissions > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E0F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6B6B80" }} interval={4} />
                  <YAxis tick={{ fontSize: 11, fill: "#6B6B80" }} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Submissions" fill="#64B5F6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Approved" fill="#81C784" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted text-center" style={{ padding: "2rem 0" }}>No activity in the last 30 days.</p>
            )}
          </div>

          {/* Weekly Summary */}
          <div className="card card-parent mb-6" style={{ padding: "1.25rem" }}>
            <h4 style={{ fontFamily: "'Fredoka', cursive", fontSize: "1rem", marginBottom: "1rem" }}>
              Weekly Summary (Last 4 Weeks)
            </h4>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Week</th>
                    <th>Total</th>
                    <th>Approved</th>
                    <th>Points Earned</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyChartData.map((w, i) => (
                    <tr key={i}>
                      <td>{w.week}</td>
                      <td>{w.Submissions}</td>
                      <td>{w.Approved}</td>
                      <td>🪙 {w.Points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Streak History */}
          {report.streakHistory.length > 0 && (
            <div className="card card-parent" style={{ padding: "1.25rem" }}>
              <h4 style={{ fontFamily: "'Fredoka', cursive", fontSize: "1rem", marginBottom: "1rem" }}>
                Streak History (Last 30 Records)
              </h4>
              <div className="flex gap-2" style={{ flexWrap: "wrap" }}>
                {report.streakHistory.slice(0, 30).map((s, i) => (
                  <div
                    key={i}
                    className="flex-center flex-col"
                    style={{
                      padding: "0.5rem 0.75rem",
                      borderRadius: "12px",
                      background: s.completed ? "#E8F5E9" : "#FFEBEE",
                      border: `2px solid ${s.completed ? "#81C784" : "#EF9A9A"}`,
                      minWidth: "60px",
                    }}
                  >
                    <div style={{ fontSize: "0.7rem", color: "#6B6B80" }}>
                      {new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                    <div style={{ fontSize: "1.2rem" }}>{s.completed ? "✅" : "❌"}</div>
                    <div style={{ fontSize: "0.65rem", color: "#6B6B80" }}>
                      {s.activitiesCompleted}/{s.activitiesTotal}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
