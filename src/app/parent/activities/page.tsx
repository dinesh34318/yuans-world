"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CATEGORY_CONFIG,
  type Activity,
  type ActivityCategory,
  type ChildProfile,
  type Frequency,
} from "@/types";

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "DAILY", label: "Every Day" },
  { value: "EVERY_2_DAYS", label: "Every 2 Days" },
  { value: "EVERY_3_DAYS", label: "Every 3 Days" },
  { value: "EVERY_4_DAYS", label: "Every 4 Days" },
];

const CATEGORY_KEYS = Object.keys(CATEGORY_CONFIG) as ActivityCategory[];

interface ActivityFormState {
  name: string;
  description: string;
  category: ActivityCategory;
  icon: string;
  pointValue: string;
  requiresPhoto: boolean;
  requiresApproval: boolean;
}

const emptyActivityForm: ActivityFormState = {
  name: "",
  description: "",
  category: "STUDYING",
  icon: "📚",
  pointValue: "10",
  requiresPhoto: false,
  requiresApproval: true,
};

interface AssignedSchedule {
  activityName: string;
  activityIcon: string;
  childName: string;
  frequency: Frequency;
}

function CategoryBadge({ category }: { category: ActivityCategory }) {
  const cfg = CATEGORY_CONFIG[category];
  return (
    <span
      className="badge"
      style={{
        backgroundColor: `${cfg.color}22`,
        color: cfg.color,
        borderColor: `${cfg.color}55`,
      }}
    >
      {cfg.icon} {cfg.label}
    </span>
  );
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Activity modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [form, setForm] = useState<ActivityFormState>(emptyActivityForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Assign modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignActivity, setAssignActivity] = useState<Activity | null>(null);
  const [assignChildId, setAssignChildId] = useState("");
  const [assignFreq, setAssignFreq] = useState<Frequency>("DAILY");
  const [assigning, setAssigning] = useState(false);
  const [assignedSchedules, setAssignedSchedules] = useState<AssignedSchedule[]>(
    []
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [actRes, childRes] = await Promise.all([
        fetch("/api/activities"),
        fetch("/api/children"),
      ]);
      const actJson = await actRes.json();
      const childJson = await childRes.json();
      if (!actJson.success) throw new Error(actJson.error);
      setActivities(actJson.data as Activity[]);
      if (childJson.success) setChildren(childJson.data as ChildProfile[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load activities");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyActivityForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (activity: Activity) => {
    setEditing(activity);
    setForm({
      name: activity.name,
      description: activity.description,
      category: activity.category,
      icon: activity.icon,
      pointValue: String(activity.pointValue),
      requiresPhoto: activity.requiresPhoto,
      requiresApproval: activity.requiresApproval,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Activity name is required";
    const pts = Number(form.pointValue);
    if (form.pointValue === "" || isNaN(pts) || pts < 0)
      errs.pointValue = "Points must be 0 or more";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveActivity = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const body = {
        name: form.name,
        description: form.description,
        category: form.category,
        icon: form.icon || "📚",
        pointValue: Number(form.pointValue),
        requiresPhoto: form.requiresPhoto,
        requiresApproval: form.requiresApproval,
        ...(editing ? { isActive: editing.isActive } : {}),
      };
      const url = editing ? `/api/activities/${editing.id}` : "/api/activities";
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
        text: json.message || (editing ? "Activity updated" : "Activity created"),
      });
      setModalOpen(false);
      fetchData();
    } catch (e) {
      setFormErrors({
        ...formErrors,
        form: e instanceof Error ? e.message : "Failed to save",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteActivity = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/activities/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to delete");
      setToast({ type: "success", text: "Activity deactivated" });
      setDeleteTarget(null);
      fetchData();
    } catch (e) {
      setToast({
        type: "error",
        text: e instanceof Error ? e.message : "Failed to delete",
      });
    } finally {
      setDeleting(false);
    }
  };

  const openAssign = (activity: Activity) => {
    setAssignActivity(activity);
    setAssignChildId(children[0]?.id || "");
    setAssignFreq("DAILY");
    setAssignModalOpen(true);
  };

  const handleAssign = async () => {
    if (!assignActivity || !assignChildId) return;
    setAssigning(true);
    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId: assignActivity.id,
          childId: assignChildId,
          frequency: assignFreq,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to assign");
      const child = children.find((c) => c.id === assignChildId);
      setAssignedSchedules((prev) => [
        {
          activityName: assignActivity.name,
          activityIcon: assignActivity.icon,
          childName: child?.name || "Child",
          frequency: assignFreq,
        },
        ...prev,
      ]);
      setToast({ type: "success", text: "Activity assigned successfully!" });
      setAssignModalOpen(false);
    } catch (e) {
      setToast({
        type: "error",
        text: e instanceof Error ? e.message : "Failed to assign",
      });
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex-between mb-6 flex-wrap gap-2">
        <div>
          <h1 style={{ marginBottom: "0.25rem" }}>Activities</h1>
          <p className="text-muted" style={{ marginBottom: 0 }}>
            Create activities and assign them to your children
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openAdd}>
          ➕ Create Activity
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
        <div className="card-parent">
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-text short" />
        </div>
      ) : activities.length === 0 ? (
        <div className="card-parent text-center">
          <p style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📋</p>
          <p className="text-muted" style={{ marginBottom: "1rem" }}>
            No activities yet. Create your first activity to get started.
          </p>
          <button type="button" className="btn btn-primary" onClick={openAdd}>
            ➕ Create Activity
          </button>
        </div>
      ) : (
        <div className="table-container mb-6">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Activity</th>
                <th>Category</th>
                <th>Points</th>
                <th>Requirements</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <tr key={activity.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <span aria-hidden="true" style={{ fontSize: "1.25rem" }}>
                        {activity.icon}
                      </span>
                      <div>
                        <div style={{ fontWeight: 700 }}>{activity.name}</div>
                        {activity.description && (
                          <small className="text-muted">
                            {activity.description}
                          </small>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <CategoryBadge category={activity.category} />
                  </td>
                  <td>
                    <span className="badge badge-warning">
                      ⭐ {activity.pointValue}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      {activity.requiresPhoto ? (
                        <span className="badge badge-accent">📷 Photo</span>
                      ) : (
                        <span className="badge" style={{ opacity: 0.6 }}>
                          No photo
                        </span>
                      )}
                      {activity.requiresApproval ? (
                        <span className="badge badge-primary">✅ Approval</span>
                      ) : (
                        <span className="badge" style={{ opacity: 0.6 }}>
                          Auto
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    {activity.isActive ? (
                      <span className="badge badge-success">Active</span>
                    ) : (
                      <span className="badge badge-danger">Inactive</span>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => openAssign(activity)}
                      >
                        Assign
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEdit(activity)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm btn-icon"
                        aria-label={`Deactivate ${activity.name}`}
                        onClick={() => setDeleteTarget(activity)}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recently assigned schedules (this session) */}
      {assignedSchedules.length > 0 && (
        <section>
          <h3 className="mb-3">Recently Assigned (This Session)</h3>
          <div className="grid-2 gap-3">
            {assignedSchedules.map((s, i) => (
              <div key={i} className="card-parent">
                <div className="flex-between">
                  <div className="flex items-center gap-2">
                    <span aria-hidden="true" style={{ fontSize: "1.25rem" }}>
                      {s.activityIcon}
                    </span>
                    <div>
                      <div style={{ fontWeight: 700 }}>{s.activityName}</div>
                      <small className="text-muted">→ {s.childName}</small>
                    </div>
                  </div>
                  <span className="badge badge-accent">
                    {FREQUENCY_OPTIONS.find((f) => f.value === s.frequency)
                      ?.label || s.frequency}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-muted" style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
            Note: Full schedule history requires a dedicated listing endpoint;
            this shows assignments made in the current session.
          </p>
        </section>
      )}

      {/* Create/Edit Activity Modal */}
      {modalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal"
            style={{ maxWidth: 520 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                {editing ? "Edit Activity" : "Create Activity"}
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
                  Activity Name <span className="required">*</span>
                </label>
                <input
                  className={`input ${formErrors.name ? "error" : ""}`}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Reading Time"
                />
                {formErrors.name && (
                  <span className="form-error">{formErrors.name}</span>
                )}
              </div>
              <div className="input-group">
                <label className="input-label">Description</label>
                <textarea
                  className="textarea"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="What should the child do?"
                />
              </div>
              <div className="grid-2 gap-3">
                <div className="input-group">
                  <label className="input-label">Category</label>
                  <select
                    className="select"
                    value={form.category}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category: e.target.value as ActivityCategory,
                        icon: CATEGORY_CONFIG[e.target.value as ActivityCategory].icon,
                      })
                    }
                  >
                    {CATEGORY_KEYS.map((key) => (
                      <option key={key} value={key}>
                        {CATEGORY_CONFIG[key].icon} {CATEGORY_CONFIG[key].label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Icon</label>
                  <input
                    className="input"
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    maxLength={4}
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">
                  Point Value <span className="required">*</span>
                </label>
                <input
                  className={`input ${formErrors.pointValue ? "error" : ""}`}
                  type="number"
                  min={0}
                  value={form.pointValue}
                  onChange={(e) =>
                    setForm({ ...form, pointValue: e.target.value })
                  }
                />
                {formErrors.pointValue && (
                  <span className="form-error">{formErrors.pointValue}</span>
                )}
              </div>
              <div className="flex flex-col gap-3" style={{ marginTop: "0.5rem" }}>
                <label className="checkbox-group">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={form.requiresPhoto}
                    onChange={(e) =>
                      setForm({ ...form, requiresPhoto: e.target.checked })
                    }
                  />
                  <span>Requires Photo</span>
                </label>
                <div className="flex items-center gap-3">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={form.requiresApproval}
                      onChange={(e) =>
                        setForm({ ...form, requiresApproval: e.target.checked })
                      }
                    />
                    <span className="switch-slider" />
                  </label>
                  <span className="input-label" style={{ margin: 0 }}>
                    Requires Approval
                  </span>
                </div>
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
                onClick={handleSaveActivity}
              >
                {saving ? (
                  <>
                    <span className="spinner spinner-sm spinner-white" />
                    Saving...
                  </>
                ) : editing ? (
                  "Save Changes"
                ) : (
                  "Create Activity"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign to Child Modal */}
      {assignModalOpen && assignActivity && (
        <div
          className="modal-overlay"
          onClick={() => setAssignModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal"
            style={{ maxWidth: 440 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">Assign Activity</h3>
              <button
                type="button"
                className="modal-close"
                aria-label="Close"
                onClick={() => setAssignModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div
                className="card-parent"
                style={{ background: "var(--color-bg-parent)", marginBottom: "1rem" }}
              >
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: "1.5rem" }}>
                    {assignActivity.icon}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700 }}>{assignActivity.name}</div>
                    <CategoryBadge category={assignActivity.category} />
                  </div>
                </div>
              </div>
              {children.length === 0 ? (
                <div className="alert alert-warning">
                  You need to add a child first before assigning activities.
                </div>
              ) : (
                <>
                  <div className="input-group">
                    <label className="input-label">Child</label>
                    <select
                      className="select"
                      value={assignChildId}
                      onChange={(e) => setAssignChildId(e.target.value)}
                    >
                      {children.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.avatar} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Frequency</label>
                    <select
                      className="select"
                      value={assignFreq}
                      onChange={(e) =>
                        setAssignFreq(e.target.value as Frequency)
                      }
                    >
                      {FREQUENCY_OPTIONS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setAssignModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-accent"
                disabled={assigning || children.length === 0}
                onClick={handleAssign}
              >
                {assigning ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
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
              <h3 className="modal-title">Deactivate Activity</h3>
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
              <p>
                Deactivate <strong>{deleteTarget.name}</strong>? The activity
                will be marked inactive and won&apos;t be available for new
                submissions. Existing history is preserved.
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
                onClick={handleDeleteActivity}
              >
                {deleting ? "Deactivating..." : "Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
