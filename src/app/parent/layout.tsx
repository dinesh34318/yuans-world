import { Suspense } from "react";
import ParentShell from "./parent-shell";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex-center" style={{ minHeight: "100vh" }}>
          <div className="spinner spinner-lg" />
        </div>
      }
    >
      <ParentShell>{children}</ParentShell>
    </Suspense>
  );
}
