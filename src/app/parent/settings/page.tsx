"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

const LEVEL_NAMES = [
  { level: 1, name: "Beginner Explorer", icon: "🌱" },
  { level: 2, name: "Smart Learner", icon: "📖" },
  { level: 3, name: "Outdoor Champion", icon: "🏆" },
  { level: 4, name: "Cleanliness Hero", icon: "🦸" },
  { level: 5, name: "Yuan's World Champion", icon: "👑" },
];

interface RewardConfigData {
  id?: string;
  parentId: string;
  pointsPerActivity: number;
  bonusStreak3Days: number;
  bonusStreak7Days: number;
  bonusStreak30Days: number;
  level1Threshold: number;
  level2Threshold: number;
  level3Threshold: number;
  level4Threshold: number;
  level5Threshold: number;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [config, setConfig] = useState<RewardConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/rewards/config");
      const data = await res.json();
      if (data.success) {
        setConfig(data.data);
      }
    } catch {
      console.error("Failed to fetch config");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/rewards/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.data);
        setSuccessMsg("Settings saved successfully!");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErrorMsg(data.error || "Failed to save settings.");
      }
    } catch {
      setErrorMsg("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof RewardConfigData, value: number) => {
    setConfig((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: "50vh" }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem", maxWidth: "700px", margin: "0 auto" }}>
      <h1 style={{ fontFamily: "'Fredoka', cursive", fontSize: "1.75rem", marginBottom: "0.25rem" }}>
        ⚙️ Settings
      </h1>
      <p className="text-muted mb-6" style={{ fontSize: "0.875rem" }}>
        Configure rewards, points, and level thresholds for your children.
      </p>

      {successMsg && (
        <div className="alert alert-success mb-4" style={{ padding: "0.75rem 1rem" }}>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="alert alert-error mb-4" style={{ padding: "0.75rem 1rem" }}>
          {errorMsg}
        </div>
      )}

      {/* Account Info */}
      <div className="card card-parent mb-6" style={{ padding: "1.25rem" }}>
        <h3 style={{ fontFamily: "'Fredoka', cursive", fontSize: "1.1rem", marginBottom: "0.75rem" }}>
          👤 Account
        </h3>
        <div className="flex-between" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <div style={{ fontWeight: 600 }}>{session?.user?.name}</div>
            <div className="text-muted" style={{ fontSize: "0.85rem" }}>{session?.user?.email}</div>
          </div>
          <button className="btn btn-danger btn-sm" onClick={() => signOut({ callbackUrl: "/" })}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Reward Configuration Form */}
      {config && (
        <form onSubmit={handleSave}>
          {/* Points */}
          <div className="card card-parent mb-4" style={{ padding: "1.25rem" }}>
            <h3 style={{ fontFamily: "'Fredoka', cursive", fontSize: "1.1rem", marginBottom: "1rem" }}>
              🪙 Points Configuration
            </h3>
            <div className="input-group">
              <label className="input-label">Points per Activity</label>
              <input
                type="number"
                className="input"
                value={config.pointsPerActivity}
                onChange={(e) => updateField("pointsPerActivity", parseInt(e.target.value) || 0)}
                min={0}
              />
              <span className="input-hint">Base points awarded for each approved activity.</span>
            </div>
          </div>

          {/* Streak Bonuses */}
          <div className="card card-parent mb-4" style={{ padding: "1.25rem" }}>
            <h3 style={{ fontFamily: "'Fredoka', cursive", fontSize: "1.1rem", marginBottom: "1rem" }}>
              🔥 Streak Bonuses
            </h3>
            <p className="text-muted mb-3" style={{ fontSize: "0.85rem" }}>
              Bonus points awarded on top of base points when a child maintains a streak.
            </p>
            <div className="grid-3" style={{ gap: "1rem" }}>
              <div className="input-group">
                <label className="input-label">3-Day Streak</label>
                <input
                  type="number"
                  className="input"
                  value={config.bonusStreak3Days}
                  onChange={(e) => updateField("bonusStreak3Days", parseInt(e.target.value) || 0)}
                  min={0}
                />
              </div>
              <div className="input-group">
                <label className="input-label">7-Day Streak</label>
                <input
                  type="number"
                  className="input"
                  value={config.bonusStreak7Days}
                  onChange={(e) => updateField("bonusStreak7Days", parseInt(e.target.value) || 0)}
                  min={0}
                />
              </div>
              <div className="input-group">
                <label className="input-label">30-Day Streak</label>
                <input
                  type="number"
                  className="input"
                  value={config.bonusStreak30Days}
                  onChange={(e) => updateField("bonusStreak30Days", parseInt(e.target.value) || 0)}
                  min={0}
                />
              </div>
            </div>
          </div>

          {/* Level Thresholds */}
          <div className="card card-parent mb-6" style={{ padding: "1.25rem" }}>
            <h3 style={{ fontFamily: "'Fredoka', cursive", fontSize: "1.1rem", marginBottom: "1rem" }}>
              🏆 Level Thresholds
            </h3>
            <p className="text-muted mb-3" style={{ fontSize: "0.85rem" }}>
              Points required to reach each level. Ensure thresholds increase progressively.
            </p>
            <div className="flex flex-col gap-3">
              {LEVEL_NAMES.map((lvl, i) => {
                const field = `level${i + 1}Threshold` as keyof RewardConfigData;
                return (
                  <div key={lvl.level} className="flex items-center gap-3" style={{ flexWrap: "wrap" }}>
                    <div
                      className="flex-center"
                      style={{
                        width: "3rem",
                        height: "3rem",
                        borderRadius: "12px",
                        background: "linear-gradient(135deg, #F5F0FF, #FFE0B2)",
                        fontSize: "1.5rem",
                        flexShrink: 0,
                      }}
                    >
                      {lvl.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: "150px" }}>
                      <label className="input-label">Level {lvl.level}: {lvl.name}</label>
                      <input
                        type="number"
                        className="input"
                        value={config[field] as number}
                        onChange={(e) => updateField(field, parseInt(e.target.value) || 0)}
                        min={0}
                        style={{ maxWidth: "150px" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Save Button */}
          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={saving}>
            {saving ? (
              <span className="flex-center gap-2">
                <span className="spinner spinner-sm spinner-white" /> Saving...
              </span>
            ) : (
              "💾 Save Settings"
            )}
          </button>
        </form>
      )}
    </div>
  );
}
