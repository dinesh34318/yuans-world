"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "/child/dashboard", label: "Home", icon: "🏠" },
  { href: "/child/activities", label: "Tasks", icon: "📋" },
  { href: "/child/achievements", label: "Awards", icon: "🏆" },
  { href: "/child/calendar", label: "Calendar", icon: "📅" },
  { href: "/child/profile", label: "Me", icon: "⚙️" },
];

export default function ChildShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [avatar, setAvatar] = useState("🧒");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login/child");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.childProfileId) {
      fetch("/api/dashboard/child")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data?.child?.avatar) {
            setAvatar(data.data.child.avatar);
          }
        })
        .catch(() => {});
    }
  }, [status, session]);

  if (status === "loading") {
    return (
      <div className="flex-center" style={{ minHeight: "100vh" }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!session || session.user.role !== "CHILD") {
    return (
      <div className="flex-center" style={{ minHeight: "100vh" }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  const childName = session.user.childName || session.user.name || "Friend";

  return (
    <div data-theme="child" style={{ minHeight: "100vh" }}>
      <nav className="nav">
        <Link href="/child/dashboard" className="nav-brand">
          <span className="animate-float" aria-hidden="true">🌍</span>
          Yuan&apos;s World
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="avatar avatar-sm" aria-hidden="true">{avatar}</span>
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: "var(--font-bold)",
                fontSize: "var(--text-sm)",
                color: "var(--color-text)",
              }}
            >
              {childName}
            </span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => signOut({ callbackUrl: "/auth/login/child" })}>
            🚪 Logout
          </button>
        </div>
      </nav>

      <main className="container" style={{ paddingTop: "var(--space-6)", paddingBottom: "var(--space-8)" }}>
        {children}
      </main>

      <nav className="bottom-nav" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href} className={`bottom-nav-link ${isActive ? "active" : ""}`}>
              <span style={{ fontSize: "1.4rem" }} aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
