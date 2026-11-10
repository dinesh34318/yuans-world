"use client";

import { useEffect, useState } from "react";

interface Rule {
  id: string;
  title: string;
  description: string;
  icon: string;
  orderIndex: number;
  isActive: boolean;
}

const RULE_ICONS = ["🎮", "📱", "📸", "📋", "🚫", "⏰", "📖", "🌟", "💪", "🧹", "🛏️", "🍎"];

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("📋");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const res = await fetch("/api/rules");
      const data = await res.json();
      if (data.success) {
        setRules(data.data);
      }
    } catch {
      console.error("Failed to fetch rules");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingRule(null);
    setTitle("");
    setDescription("");
    setIcon("📋");
    setError("");
    setShowModal(true);
  };

  const openEdit = (rule: Rule) => {
    setEditingRule(rule);
    setTitle(rule.title);
    setDescription(rule.description);
    setIcon(rule.icon);
    setError("");
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editingRule) {
        // Update
        const res = await fetch(`/api/rules/${editingRule.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, icon }),
        });
        const data = await res.json();
        if (data.success) {
          setSuccessMsg("Rule updated successfully!");
          setShowModal(false);
          fetchRules();
          setTimeout(() => setSuccessMsg(""), 3000);
        } else {
          setError(data.error || "Failed to update rule.");
        }
      } else {
        // Create
        const res = await fetch("/api/rules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, icon }),
        });
        const data = await res.json();
        if (data.success) {
          setSuccessMsg("Rule created successfully!");
          setShowModal(false);
          fetchRules();
          setTimeout(() => setSuccessMsg(""), 3000);
        } else {
          setError(data.error || "Failed to create rule.");
        }
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;
    try {
      const res = await fetch(`/api/rules/${ruleId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setRules((prev) => prev.filter((r) => r.id !== ruleId));
        setSuccessMsg("Rule deleted.");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch {
      console.error("Failed to delete rule");
    }
  };

  const handleReorder = async (rule: Rule, direction: "up" | "down") => {
    const index = rules.findIndex((r) => r.id === rule.id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= rules.length) return;

    const swapRule = rules[swapIndex];
    // Update both rules' orderIndex via PUT
    try {
      await fetch(`/api/rules/${rule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIndex: swapRule.orderIndex }),
      });
      await fetch(`/api/rules/${swapRule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIndex: rule.orderIndex }),
      });
      fetchRules();
    } catch {
      console.error("Failed to reorder");
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: "50vh" }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem", maxWidth: "800px", margin: "0 auto" }}>
      <div className="flex-between mb-6" style={{ flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontFamily: "'Fredoka', cursive", fontSize: "1.75rem", marginBottom: "0.25rem" }}>
            📏 Household Rules
          </h1>
          <p className="text-muted" style={{ fontSize: "0.875rem" }}>
            Children must acknowledge these rules before accessing their dashboard.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + Add Rule
        </button>
      </div>

      {successMsg && (
        <div className="alert alert-success mb-4" style={{ padding: "0.75rem 1rem" }}>
          {successMsg}
        </div>
      )}

      {rules.length === 0 ? (
        <div className="card card-parent" style={{ textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📋</div>
          <h3 style={{ fontFamily: "'Fredoka', cursive" }}>No Rules Yet</h3>
          <p className="text-muted mb-4">Create your first household rule to get started.</p>
          <button className="btn btn-primary" onClick={openCreate}>+ Add Your First Rule</button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rules.map((rule, index) => (
            <div key={rule.id} className="card card-parent card-hover" style={{ padding: "1.25rem" }}>
              <div className="flex items-start gap-3" style={{ flexWrap: "wrap" }}>
                <div
                  className="flex-center"
                  style={{
                    width: "3.5rem",
                    height: "3.5rem",
                    borderRadius: "16px",
                    background: "linear-gradient(135deg, #F5F0FF, #FFF8F0)",
                    fontSize: "2rem",
                    flexShrink: 0,
                  }}
                >
                  {rule.icon}
                </div>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <div className="flex items-center gap-2" style={{ flexWrap: "wrap" }}>
                    <span className="badge badge-accent">Rule #{rule.orderIndex}</span>
                    {!rule.isActive && <span className="badge badge-danger">Inactive</span>}
                  </div>
                  <h3 style={{ fontFamily: "'Fredoka', cursive", fontSize: "1.15rem", marginTop: "0.25rem" }}>
                    {rule.title}
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "#6B6B80", marginTop: "0.25rem" }}>
                    {rule.description}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex gap-1">
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleReorder(rule, "up")} disabled={index === 0} title="Move up">↑</button>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleReorder(rule, "down")} disabled={index === rules.length - 1} title="Move down">↓</button>
                  </div>
                  <div className="flex gap-1">
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(rule)}>✏️ Edit</button>
                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(rule.id)} title="Delete">🗑️</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingRule ? "Edit Rule" : "Add Rule"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error mb-3">{error}</div>}
              <form onSubmit={handleSave}>
                <div className="input-group">
                  <label className="input-label">Icon</label>
                  <div className="flex gap-1" style={{ flexWrap: "wrap" }}>
                    {RULE_ICONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setIcon(emoji)}
                        style={{
                          width: "2.5rem",
                          height: "2.5rem",
                          borderRadius: "12px",
                          border: icon === emoji ? "3px solid #9B7FE6" : "2px solid #E8E0F0",
                          background: icon === emoji ? "#F5F0FF" : "#fff",
                          cursor: "pointer",
                          fontSize: "1.3rem",
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Title <span className="required">*</span></label>
                  <input
                    type="text"
                    className="input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., No Video Games"
                    required
                    disabled={saving}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Description <span className="required">*</span></label>
                  <textarea
                    className="textarea"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Video games are not allowed during the week..."
                    required
                    disabled={saving}
                    rows={3}
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <span className="spinner spinner-sm" /> : editingRule ? "Update Rule" : "Create Rule"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
