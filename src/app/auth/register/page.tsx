"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Registration failed.");
        setLoading(false);
        return;
      }

      // Redirect to login page on success
      router.push("/auth/login/parent?registered=true");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main
      data-theme="parent"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #F0F4FF 0%, #E8E0F0 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: "440px" }}>
        <div className="text-center mb-6">
          <Link href="/">
            <h1
              style={{
                fontFamily: "'Fredoka', cursive",
                fontSize: "2rem",
                fontWeight: 700,
                color: "#9B7FE6",
                cursor: "pointer",
              }}
            >
              Yuan&apos;s World
            </h1>
          </Link>
          <p className="text-muted" style={{ marginTop: "0.5rem" }}>
            Create a parent account
          </p>
        </div>

        <div className="card card-parent" style={{ padding: "2rem" }}>
          <h2
            style={{
              fontFamily: "'Fredoka', cursive",
              fontSize: "1.5rem",
              fontWeight: 700,
              marginBottom: "0.25rem",
            }}
          >
            Join Yuan&apos;s World! ✨
          </h2>
          <p className="text-muted mb-6" style={{ fontSize: "0.875rem" }}>
            Create an account to manage your child&apos;s activities and track their progress.
          </p>

          {error && (
            <div className="alert alert-error mb-4" style={{ padding: "0.75rem 1rem" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Your Name</label>
              <input
                type="text"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Parent Name"
                required
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Email</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="parent@example.com"
                required
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                disabled={loading}
              />
              <span className="input-hint">Minimum 6 characters</span>
            </div>

            <div className="input-group">
              <label className="input-label">Confirm Password</label>
              <input
                type="password"
                className="input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
              style={{ marginTop: "0.5rem" }}
            >
              {loading ? (
                <span className="flex-center gap-2">
                  <span className="spinner spinner-sm spinner-white" /> Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="flex-center mt-6" style={{ gap: "0.5rem", fontSize: "0.875rem" }}>
            <span className="text-muted">Already have an account?</span>
            <Link href="/auth/login/parent" style={{ color: "#9B7FE6", fontWeight: 600 }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
