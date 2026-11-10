import { Suspense } from "react";
import ChildShell from "./child-shell";

export default function ChildLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex-center" style={{ minHeight: "100vh" }}>
          <div className="spinner spinner-lg" />
        </div>
      }
    >
      <ChildShell>{children}</ChildShell>
    </Suspense>
  );
}
