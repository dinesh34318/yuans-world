import type { Metadata } from "next";
import "./globals.css";
import { SessionProviderWrapper } from "@/components/session-provider";

export const metadata: Metadata = {
  title: "Yuan's World - Children's Activity Tracking",
  description: "Playful and engaging activity tracker for kids and parents",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  );
}
