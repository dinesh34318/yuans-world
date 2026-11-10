"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ParentLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("parent-login", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
        setLoading(false);
      } else if (result?.ok) {
        router.push("/parent/dashboard");
        router.refresh();
      }
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
        background: "linear-gradient(135deg, #F0F4FF 0%, #E3F2FD 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div className="container-sm" style={{ width: "100%", maxWidth: "420px" }}>
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
            Parent Portal 🔒
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
            Welcome Back!
          </h2>
          <p className="text-muted mb-6" style={{ fontSize: "0.875rem" }}>
            Sign in to manage your child&apos;s activities and progress.
          </p>

          {error && (
            <div className="alert alert-error mb-4" style={{ padding: "0.75rem 1rem" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Email</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="parent@example.com"
                required
                autoComplete="email"
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
                placeholder="••••••••"
                required
                autoComplete="current-password"
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
                  <span className="spinner spinner-sm spinner-white" /> Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div
            className="flex-center mt-6"
            style={{ gap: "0.5rem", fontSize: "0.875rem" }}
          >
            <span className="text-muted">New to Yuan&apos;s World?</span>
            <Link href="/auth/register" style={{ color: "#9B7FE6", fontWeight: 600 }}>
              Create an account
            </Link>
          </div>

          <div
            className="flex-center mt-4"
            style={{ gap: "0.5rem", fontSize: "0.875rem" }}
          >
            <span className="text-muted">Are you a child?</span>
            <Link href="/auth/login/child" style={{ color: "#64B5F6", fontWeight: 600 }}>
              Child Login
            </Link>
          </div>
        </div>

        <div className="card mt-4" style={{ padding: "1rem", background: "#FFF9C4", borderColor: "#FFD54F", borderRadius: "16px" }}>
          <p style={{ fontSize: "0.8rem", color: "#B26A00", textAlign: "center", fontWeight: 600 }}>
            Demo: parent@yuansworld.com / parent123
          </p>
        </div>
      </div>
    </main>
  );
}
