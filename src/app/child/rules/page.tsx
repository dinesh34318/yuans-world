"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Rule {
  id: string;
  title: string;
  description: string;
  icon: string;
  orderIndex: number;
}

export default function ChildRulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/rules")
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setRules(result.data);
        } else {
          setError(result.error || "Failed to load rules");
        }
      })
      .catch(() => setError("Something went wrong. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  const handleAcknowledge = async (ruleId: string) => {
    setSubmitting(ruleId);
    setError(null);

    try {
      const res = await fetch("/api/rules/acknowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruleId }),
      });
      const result = await res.json();

      if (result.success) {
        setAcknowledged((prev) => new Set([...prev, ruleId]));
      } else {
        // If already acknowledged (409), mark as acknowledged anyway
        if (res.status === 409) {
          setAcknowledged((prev) => new Set([...prev, ruleId]));
        } else {
          setError(result.error || "Could not acknowledge rule");
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(null);
    }
  };

  const allAcknowledged = rules.length > 0 && acknowledged.size === rules.length;

  // ─── Loading State ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-col gap-4">
        <div className="skeleton" style={{ height: 80, borderRadius: "var(--radius-xl)" }} />
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
      </div>
    );
  }

  // ─── Error State ─────────────────────────────────────────────────────────
  if (error && rules.length === 0) {
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

  return (
    <div className="flex-col gap-6 animate-fadeIn" style={{ maxWidth: 800, margin: "0 auto" }}>
      {/* Header */}
      <div className="text-center">
        <div className="animate-bounce" style={{ fontSize: "3.5rem" }} aria-hidden="true">
          📜
        </div>
        <h1 style={{ marginBottom: "var(--space-2)" }}>Our House Rules</h1>
        <p className="text-muted lead" style={{ marginBottom: 0 }}>
          Let&apos;s read the rules together. Tap &quot;I Understand&quot; when you&apos;re ready!
        </p>
      </div>

      {/* Error toast */}
      {error && (
        <div className="alert alert-error">
          <span style={{ fontSize: "1.5rem" }}>⚠️</span>
          <div>{error}</div>
        </div>
      )}

      {/* Rule Cards */}
      <div className="flex-col gap-4">
        {rules.map((rule, index) => {
          const isAck = acknowledged.has(rule.id);
          return (
            <div
              key={rule.id}
              className={`card card-child card-hover animate-slideUp`}
              style={{
                animationDelay: `${index * 120}ms`,
                opacity: 0,
                animationFillMode: "forwards",
                border: isAck ? "3px solid var(--color-success)" : undefined,
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex-center animate-float"
                  style={{
                    fontSize: "2.5rem",
                    width: "4rem",
                    height: "4rem",
                    borderRadius: "var(--radius-xl)",
                    background: "var(--color-primary-soft)",
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                >
                  {rule.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge badge-primary">Rule {index + 1}</span>
                    {isAck && <span className="badge badge-success">✓ Understood</span>}
                  </div>
                  <h3 style={{ marginBottom: "var(--space-2)" }}>{rule.title}</h3>
                  <p style={{ marginBottom: 0, color: "var(--color-text-light)" }}>
                    {rule.description}
                  </p>
                </div>
              </div>
              <div className="card-footer">
                {isAck ? (
                  <span className="badge badge-success badge-lg animate-pop">
                    ✓ I Understand
                  </span>
                ) : (
                  <button
                    className="btn btn-primary"
                    disabled={submitting === rule.id}
                    onClick={() => handleAcknowledge(rule.id)}
                  >
                    {submitting === rule.id ? (
                      <>
                        <span className="spinner spinner-sm spinner-white" /> Saving...
                      </>
                    ) : (
                      <>🙌 I Understand</>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* No rules state */}
      {rules.length === 0 && !error && (
        <div className="card card-child text-center">
          <div style={{ fontSize: "3rem", marginBottom: "var(--space-3)" }} aria-hidden="true">
            🌟
          </div>
          <p style={{ marginBottom: 0 }} className="text-muted">
            Your parent hasn&apos;t set up any rules yet. You can go straight to your dashboard!
          </p>
        </div>
      )}

      {/* Success / Continue */}
      {(allAcknowledged || rules.length === 0) && (
        <div className="card card-child text-center animate-pop" style={{ borderColor: "var(--color-success)" }}>
          <div className="animate-bounce" style={{ fontSize: "3rem", marginBottom: "var(--space-3)" }} aria-hidden="true">
            🎉
          </div>
          <h2 style={{ marginBottom: "var(--space-2)" }}>You&apos;re All Set!</h2>
          <p className="text-muted" style={{ marginBottom: "var(--space-5)" }}>
            Great job reading all the rules. Now let&apos;s start completing activities and earning points!
          </p>
          <Link href="/child/dashboard" className="btn btn-success btn-lg animate-wiggle">
            🚀 Continue to Dashboard
          </Link>
        </div>
      )}

      {/* Progress indicator */}
      {rules.length > 0 && !allAcknowledged && (
        <div className="progress-container">
          <div className="progress-label mb-2">
            <span>Rules Acknowledged</span>
            <span>
              {acknowledged.size} / {rules.length}
            </span>
          </div>
          <div className="progress-bar progress-sm">
            <div
              className="progress-fill"
              style={{ width: `${(acknowledged.size / rules.length) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
