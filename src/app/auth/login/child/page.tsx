"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const AVATARS = ["🦁", "🧒", "👧", "👦", "🦊", "🐼", "🐨", "🐰", "🦄", "🐯"];

export default function ChildLoginPage() {
  const router = useRouter();
  const [childId, setChildId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("child-login", {
        childId,
        pin,
        redirect: false,
      });

      if (result?.error) {
        setError("Oops! Wrong Child ID or PIN. Try again! 🤔");
        setLoading(false);
      } else if (result?.ok) {
        router.push("/child/dashboard");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main
      data-theme="child"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #FFF8F0 0%, #FFE0B2 50%, #FFF3E0 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Floating decorations */}
      <div className="animate-float" style={{ position: "absolute", top: "10%", left: "5%", fontSize: "2.5rem", opacity: 0.3 }}>🎈</div>
      <div className="animate-float" style={{ position: "absolute", top: "15%", right: "8%", fontSize: "2rem", opacity: 0.3, animationDelay: "1s" }}>🌟</div>
      <div className="animate-float" style={{ position: "absolute", bottom: "10%", left: "8%", fontSize: "2rem", opacity: 0.3, animationDelay: "0.5s" }}>🌈</div>

      <div style={{ width: "100%", maxWidth: "400px", position: "relative", zIndex: 1 }}>
        <div className="text-center mb-6">
          <Link href="/">
            <h1
              style={{
                fontFamily: "'Fredoka', cursive",
                fontSize: "2.2rem",
                fontWeight: 700,
                background: "linear-gradient(135deg, #FF8A80, #FFD54F)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                cursor: "pointer",
              }}
            >
              Yuan&apos;s World
            </h1>
          </Link>
          <p style={{ marginTop: "0.25rem", color: "#FF8A80", fontFamily: "'Fredoka', cursive", fontWeight: 600 }}>
            Time for an adventure! 🎉
          </p>
        </div>

        <div
          className="card-child"
          style={{ padding: "2rem", background: "#fff" }}
        >
          {/* Avatar Display */}
          <div className="flex-center mb-6">
            <div
              className="animate-bounce"
              style={{
                fontSize: "3.5rem",
                width: "5rem",
                height: "5rem",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #FFE0B2, #FFD54F)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "4px solid #fff",
                boxShadow: "0 4px 16px rgba(255,138,128,0.3)",
              }}
            >
              🧒
            </div>
          </div>

          {error && (
            <div className="alert alert-error mb-4" style={{ padding: "0.75rem 1rem", fontSize: "0.875rem" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label" style={{ fontFamily: "'Fredoka', cursive" }}>
                Child ID
              </label>
              <input
                type="text"
                className="input"
                value={childId}
                onChange={(e) => setChildId(e.target.value)}
                placeholder="Your special ID"
                required
                disabled={loading}
                style={{ fontSize: "1.1rem", textAlign: "center", fontFamily: "'Fredoka', cursive" }}
              />
            </div>

            <div className="input-group">
              <label className="input-label" style={{ fontFamily: "'Fredoka', cursive" }}>
                Secret PIN
              </label>
              <input
                type="password"
                className="input"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••"
                required
                disabled={loading}
                style={{ fontSize: "1.25rem", textAlign: "center", letterSpacing: "0.5rem", fontFamily: "'Fredoka', cursive" }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-secondary btn-full btn-lg"
              disabled={loading}
              style={{ marginTop: "0.5rem", fontFamily: "'Fredoka', cursive" }}
            >
              {loading ? (
                <span className="flex-center gap-2">
                  <span className="spinner spinner-sm spinner-white" /> Loading...
                </span>
              ) : (
                "🎮 Let&apos;s Go!"
              )}
            </button>
          </form>

          <div className="flex-center mt-6" style={{ gap: "0.5rem", fontSize: "0.85rem" }}>
            <span style={{ color: "#6B6B80" }}>Are you a parent?</span>
            <Link href="/auth/login/parent" style={{ color: "#9B7FE6", fontWeight: 700, fontFamily: "'Fredoka', cursive" }}>
              Parent Login
            </Link>
          </div>
        </div>

        <div className="card mt-4" style={{ padding: "0.75rem 1rem", background: "#E3F2FD", borderColor: "#90CAF9", borderRadius: "16px" }}>
          <p style={{ fontSize: "0.8rem", color: "#1976D2", textAlign: "center", fontWeight: 600 }}>
            Demo: yuan123 / PIN: 1234
          </p>
        </div>
      </div>
    </main>
  );
}
