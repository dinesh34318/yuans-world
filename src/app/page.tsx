"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      if (session.user.role === "PARENT") {
        router.push("/parent/dashboard");
      } else if (session.user.role === "CHILD") {
        router.push("/child/dashboard");
      }
    }
  }, [status, session, router]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #F5F0FF 0%, #FFF8F0 35%, #F0F4FF 100%)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Floating decorative elements */}
      <div
        className="animate-float"
        style={{
          position: "absolute",
          top: "8%",
          left: "5%",
          fontSize: "3rem",
          opacity: 0.4,
          animationDelay: "0s",
        }}
      >
        🌟
      </div>
      <div
        className="animate-float"
        style={{
          position: "absolute",
          top: "15%",
          right: "8%",
          fontSize: "2.5rem",
          opacity: 0.35,
          animationDelay: "1s",
        }}
      >
        🎈
      </div>
      <div
        className="animate-float"
        style={{
          position: "absolute",
          bottom: "20%",
          left: "7%",
          fontSize: "2.5rem",
          opacity: 0.35,
          animationDelay: "0.5s",
        }}
      >
        🌈
      </div>
      <div
        className="animate-float"
        style={{
          position: "absolute",
          bottom: "10%",
          right: "12%",
          fontSize: "3rem",
          opacity: 0.3,
          animationDelay: "1.5s",
        }}
      >
        🚀
      </div>
      <div
        className="animate-float"
        style={{
          position: "absolute",
          top: "45%",
          left: "3%",
          fontSize: "2rem",
          opacity: 0.3,
          animationDelay: "2s",
        }}
      >
        ⭐
      </div>
      <div
        className="animate-float"
        style={{
          position: "absolute",
          top: "30%",
          right: "5%",
          fontSize: "2.5rem",
          opacity: 0.3,
          animationDelay: "2.5s",
        }}
      >
        🍎
      </div>

      <div
        className="container flex-center flex-col"
        style={{ minHeight: "100vh", gap: "2rem", position: "relative", zIndex: 1 }}
      >
        {/* Title */}
        <div className="text-center animate-slideUp" style={{ animationDelay: "0.1s" }}>
          <h1
            style={{
              fontSize: "clamp(2.5rem, 7vw, 4.5rem)",
              fontFamily: "'Fredoka', cursive",
              fontWeight: 700,
              background:
                "linear-gradient(135deg, #9B7FE6 0%, #FF8A80 50%, #64B5F6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: "0.5rem",
              letterSpacing: "-0.02em",
            }}
          >
            Yuan&apos;s World
          </h1>
          <p
            style={{
              fontSize: "clamp(1rem, 2.5vw, 1.3rem)",
              color: "#6B6B80",
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 600,
            }}
          >
            Build great habits, earn rewards, and have fun every day! 🌱
          </p>
        </div>

        {/* Digital Admission Ticket */}
        <div
          className="animate-slideUp"
          style={{
            animationDelay: "0.3s",
            width: "min(500px, 90vw)",
            background: "linear-gradient(135deg, #9B7FE6 0%, #7F5ECE 100%)",
            borderRadius: "24px",
            padding: "2.5rem 2rem",
            boxShadow: "0 20px 60px rgba(155, 127, 230, 0.4)",
            color: "#fff",
            position: "relative",
            border: "3px solid rgba(255,255,255,0.3)",
          }}
        >
          {/* Ticket perforation edges */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "-14px",
              transform: "translateY(-50%)",
              width: "28px",
              height: "28px",
              background: "#F5F0FF",
              borderRadius: "50%",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              right: "-14px",
              transform: "translateY(-50%)",
              width: "28px",
              height: "28px",
              background: "#F5F0FF",
              borderRadius: "50%",
            }}
          />

          <div className="text-center">
            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }} className="animate-bounce">
              🎟️
            </div>
            <h2
              style={{
                fontFamily: "'Fredoka', cursive",
                fontSize: "clamp(1.3rem, 4vw, 2rem)",
                fontWeight: 700,
                letterSpacing: "0.05em",
                marginBottom: "0.5rem",
                color: "#fff",
              }}
            >
              WELCOME TO YUAN&apos;S WORLD
            </h2>
            <div
              style={{
                width: "60px",
                height: "3px",
                background: "rgba(255,255,255,0.5)",
                margin: "0 auto 1rem",
                borderRadius: "99px",
              }}
            />
            <p
              style={{
                fontSize: "clamp(0.85rem, 2.5vw, 1rem)",
                opacity: 0.9,
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 500,
                marginBottom: "1.5rem",
              }}
            >
              Your adventure starts here! Track daily activities, follow household
              rules, and earn amazing rewards. 🎯
            </p>

            {/* Ticket details row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-around",
                borderTop: "2px dashed rgba(255,255,255,0.4)",
                paddingTop: "1rem",
                fontSize: "0.8rem",
                fontFamily: "'Fredoka', cursive",
                fontWeight: 600,
              }}
            >
              <div>
                <div style={{ opacity: 0.7, fontSize: "0.7rem" }}>LEVEL</div>
                <div>Beginner 🌱</div>
              </div>
              <div>
                <div style={{ opacity: 0.7, fontSize: "0.7rem" }}>POINTS</div>
                <div>0 ⭐</div>
              </div>
              <div>
                <div style={{ opacity: 0.7, fontSize: "0.7rem" }}>BADGES</div>
                <div>0 🏆</div>
              </div>
            </div>
          </div>
        </div>

        {/* Start Your Adventure Button */}
        <div className="animate-slideUp" style={{ animationDelay: "0.5s" }}>
          <Link href="/auth/login/child">
            <button
              className="btn btn-primary btn-lg animate-pulse"
              style={{
                fontSize: "1.3rem",
                padding: "1.1rem 2.5rem",
                fontFamily: "'Fredoka', cursive",
              }}
            >
              🚀 Start Your Adventure
            </button>
          </Link>
        </div>

        {/* Login options */}
        <div
          className="animate-fadeIn flex-center"
          style={{ gap: "1rem", animationDelay: "0.7s", flexWrap: "wrap" }}
        >
          <Link href="/auth/login/child">
            <button
              className="btn btn-accent btn-sm"
              style={{ fontFamily: "'Fredoka', cursive" }}
            >
              🧒 Child Login
            </button>
          </Link>
          <Link href="/auth/login/parent">
            <button
              className="btn btn-outline btn-sm"
              style={{ fontFamily: "'Fredoka', cursive" }}
            >
              👨‍👩‍👧 Parent Login
            </button>
          </Link>
          <Link href="/auth/register">
            <button
              className="btn btn-ghost btn-sm"
              style={{ fontFamily: "'Fredoka', cursive" }}
            >
              ✨ New Parent? Sign Up
            </button>
          </Link>
        </div>

        {/* Three Rules Preview */}
        <div
          className="animate-slideUp grid-3"
          style={{
            gap: "1rem",
            width: "min(700px, 90vw)",
            animationDelay: "0.9s",
          }}
        >
          {[
            { icon: "🎮", title: "No Video Games", color: "#FF8A80" },
            { icon: "📱", title: "Limit Screen Time", color: "#FFD54F" },
            { icon: "📸", title: "Honesty First", color: "#81C784" },
          ].map((rule, i) => (
            <div
              key={i}
              className="card card-hover"
              style={{
                textAlign: "center",
                padding: "1.25rem 0.75rem",
                border: `2px solid ${rule.color}40`,
                borderRadius: "20px",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>
                {rule.icon}
              </div>
              <div
                style={{
                  fontFamily: "'Fredoka', cursive",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  color: "#2D2D3F",
                }}
              >
                {rule.title}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
