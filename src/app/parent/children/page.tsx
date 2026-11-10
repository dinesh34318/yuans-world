"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { ChildProfile } from "@/types";

const PRESET_AVATARS = [
  "🦁", "🐯", "🐻", "🐼", "🐨", "🦊", "🐰", "🐱",
  "🐶", "🐸", "🦄", "🐙", "🦉", "🐢", "🐳", "🌟",
];

interface ChildFormState {
  name: string;
  childId: string;
  pin: string;
  avatar: string;
}

const emptyForm: ChildFormState = {
  name: "",
  childId: "",
  pin: "",
  avatar: "🦁",
};

export default function ChildrenPage() {
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ChildProfile | null>(null);
  const [form, setForm] = useState<ChildFormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ChildProfile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchChildren = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/children");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setChildren(json.data as ChildProfile[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load children");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (child: ChildProfile) => {
    setEditing(child);
    setForm({
      name: child.name,
      childId: child.childId,
      pin: "",
      avatar: child.avatar,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.childId.trim()) errs.childId = "Child ID is required";
    if (!editing) {
      if (!form.pin) errs.pin = "PIN is required";
      else if (!/^\d{4,6}$/.test(form.pin))
        errs.pin = "PIN must be 4-6 digits";
    } else if (form.pin && !/^\d{4,6}$/.test(form.pin)) {
      errs.pin = "PIN must be 4-6 digits";
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setFormErrors((p) => {
      const { form: _f, ...rest } = p;
      return rest;
    });
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        avatar: form.avatar,
        childId: form.childId,
      };
      if (form.pin) body.pin = form.pin;
      const url = editing ? `/api/children/${editing.id}` : "/api/children";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to save");
      setToast({
        type: "success",
        text: json.message || (editing ? "Child updated" : "Child created"),
      });
      setModalOpen(false);
      fetchChildren();
    } catch (e) {
      setFormErrors({
        ...formErrors,
        form: e instanceof Error ? e.message : "Failed to save",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/children/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to delete");
      setToast({ type: "success", text: "Child deleted" });
      setDeleteTarget(null);
      fetchChildren();
    } catch (e) {
      setToast({
        type: "error",
        text: e instanceof Error ? e.message : "Failed to delete",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex-between mb-6 flex-wrap gap-2">
        <div>
          <h1 style={{ marginBottom: "0.25rem" }}>Children</h1>
          <p className="text-muted" style={{ marginBottom: 0 }}>
            Manage your child profiles and login credentials
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openAdd}>
          ➕ Add Child
        </button>
      </div>

      {toast && (
        <div
          className={`alert ${toast.type === "success" ? "alert-success" : "alert-error"}`}
        >
          <span>{toast.text}</span>
        </div>
      )}
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="grid-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      ) : children.length === 0 ? (
        <div className="card-parent text-center">
          <p style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>👧</p>
          <p className="text-muted" style={{ marginBottom: "1rem" }}>
            No children yet. Add your first child to start tracking activities.
          </p>
          <button type="button" className="btn btn-primary" onClick={openAdd}>
            ➕ Add Child
          </button>
        </div>
      ) : (
        <div className="grid-3 gap-4">
          {children.map((child) => (
            <div key={child.id} className="card-parent card-hover">
              <div className="flex items-center gap-3 mb-3">
                <div className="avatar avatar-lg">{child.avatar}</div>
                <div style={{ minWidth: 0 }}>
                  <div
                    className="card-title"
                    style={{ fontSize: "1.2rem" }}
                  >
                    {child.name}
                  </div>
                  <small className="text-muted">ID: {child.childId}</small>
                </div>
              </div>
              <div className="flex gap-2 mb-3 flex-wrap">
                <span className="badge badge-primary">Level {child.level}</span>
                <span className="badge badge-warning">⭐ {child.points}</span>
                <span className="badge badge-danger">
                  🔥 {child.currentStreak}d
                </span>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/parent/reports?child=${child.id}`}
                  className="btn btn-outline btn-sm"
                  style={{ flex: 1 }}
                >
                  View Details
                </Link>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => openEdit(child)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm btn-icon"
                  aria-label={`Delete ${child.name}`}
                  onClick={() => setDeleteTarget(child)}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 480 }}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                {editing ? "Edit Child" : "Add Child"}
              </h3>
              <button
                type="button"
                className="modal-close"
                aria-label="Close"
                onClick={() => setModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {formErrors.form && (
                <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
                  {formErrors.form}
                </div>
              )}
              <div className="input-group">
                <label className="input-label">
                  Name <span className="required">*</span>
                </label>
                <input
                  className={`input ${formErrors.name ? "error" : ""}`}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Yuan"
                />
                {formErrors.name && (
                  <span className="form-error">{formErrors.name}</span>
                )}
              </div>
              <div className="input-group">
                <label className="input-label">
                  Child ID <span className="required">*</span>
                </label>
                <input
                  className={`input ${formErrors.childId ? "error" : ""}`}
                  value={form.childId}
                  onChange={(e) =>
                    setForm({ ...form, childId: e.target.value })
                  }
                  placeholder="e.g. yuan2024"
                />
                <span className="input-hint">
                  Used by your child to log in
                </span>
                {formErrors.childId && (
                  <span className="form-error">{formErrors.childId}</span>
                )}
              </div>
              <div className="input-group">
                <label className="input-label">
                  PIN{" "}
                  {editing ? (
                    <span className="text-muted">(leave blank to keep)</span>
                  ) : (
                    <span className="required">*</span>
                  )}
                </label>
                <input
                  className={`input ${formErrors.pin ? "error" : ""}`}
                  type="password"
                  inputMode="numeric"
                  value={form.pin}
                  onChange={(e) =>
                    setForm({ ...form, pin: e.target.value.replace(/\D/g, "") })
                  }
                  placeholder="4-6 digits"
                  maxLength={6}
                />
                {formErrors.pin && (
                  <span className="form-error">{formErrors.pin}</span>
                )}
              </div>
              <div className="input-group">
                <label className="input-label">Avatar</label>
                <div
                  className="flex gap-2 flex-wrap"
                  style={{ marginBottom: "0.5rem" }}
                >
                  {PRESET_AVATARS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setForm({ ...form, avatar: emoji })}
                      className="btn btn-icon btn-sm"
                      aria-label={`Select ${emoji} avatar`}
                      style={{
                        fontSize: "1.25rem",
                        background:
                          form.avatar === emoji
                            ? "var(--color-primary-soft)"
                            : "#fff",
                        border:
                          form.avatar === emoji
                            ? "2px solid var(--color-primary)"
                            : "2px solid var(--color-border)",
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <input
                  className="input"
                  value={form.avatar}
                  onChange={(e) =>
                    setForm({ ...form, avatar: e.target.value })
                  }
                  placeholder="Or type an emoji"
                  maxLength={4}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={saving}
                onClick={handleSave}
              >
                {saving ? (
                  <>
                    <span className="spinner spinner-sm spinner-white" />
                    Saving...
                  </>
                ) : editing ? (
                  "Save Changes"
                ) : (
                  "Create Child"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="modal-overlay"
          onClick={() => setDeleteTarget(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal"
            style={{ maxWidth: 420 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">Delete Child</h3>
              <button
                type="button"
                className="modal-close"
                aria-label="Close"
                onClick={() => setDeleteTarget(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="flex-center" style={{ marginBottom: "1rem" }}>
                <div className="avatar avatar-lg">{deleteTarget.avatar}</div>
              </div>
              <p className="text-center">
                Are you sure you want to delete{" "}
                <strong>{deleteTarget.name}</strong>? This will permanently
                remove the child and all their activities, submissions, and
                history. This cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={deleting}
                onClick={handleDelete}
              >
                {deleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
