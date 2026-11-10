"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const NAV_LINKS = [
  { href: "/parent/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/parent/children", label: "Children", icon: "👧" },
  { href: "/parent/activities", label: "Activities", icon: "📋" },
  { href: "/parent/approvals", label: "Approvals", icon: "✅" },
  { href: "/parent/rules", label: "Rules", icon: "📏" },
  { href: "/parent/reports", label: "Reports", icon: "📈" },
  { href: "/parent/settings", label: "Settings", icon: "⚙️" },
];

export default function ParentShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login/parent");
    } else if (status === "authenticated" && session?.user?.role !== "PARENT") {
      router.push("/child/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (status === "loading" || !session || session.user?.role !== "PARENT") {
    return (
      <div data-theme="parent" className="flex-center" style={{ minHeight: "100vh" }}>
        <div className="spinner spinner-lg" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div data-theme="parent" style={{ display: "flex", minHeight: "100vh" }}>
      <style>{`
        @media (min-width: 640px) {
          .parent-hamburger { display: none !important; }
        }
        @media (max-width: 639px) {
          .parent-mobile-menu { display: block !important; }
        }
        @media (min-width: 640px) {
          .parent-mobile-menu { display: none !important; }
        }
      `}</style>

      <aside className="sidebar">
        <Link href="/parent/dashboard" className="sidebar-brand">
          🌍 Yuan&apos;s World
        </Link>
        <nav className="sidebar-nav" aria-label="Parent navigation">
          {NAV_LINKS.map((link) => (
            <div key={link.href} className="sidebar-item">
              <Link href={link.href} className={`sidebar-link ${pathname === link.href ? "active" : ""}`}>
                <span aria-hidden="true">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            </div>
          ))}
        </nav>
      </aside>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header className="nav">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="parent-hamburger btn btn-icon btn-sm"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
            >
              ☰
            </button>
            <span className="nav-brand" style={{ fontSize: "1.25rem" }}>
              Yuan&apos;s World — Parent
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-muted" style={{ fontSize: "0.875rem" }}>
              {session.user.name}
            </span>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => signOut({ callbackUrl: "/auth/login/parent" })}
            >
              Logout
            </button>
          </div>
        </header>

        {mobileOpen && (
          <nav
            className="parent-mobile-menu animate-slideDown"
            aria-label="Parent mobile navigation"
            style={{
              background: "#FFFFFF",
              borderBottom: "2px solid var(--color-border)",
              padding: "0.75rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
            }}
          >
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={`sidebar-link ${pathname === link.href ? "active" : ""}`}>
                <span aria-hidden="true">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>
        )}

        <main style={{ flex: 1, padding: "1.5rem 1rem 3rem" }}>
          <div className="container">{children}</div>
        </main>
      </div>
    </div>
  );
}
