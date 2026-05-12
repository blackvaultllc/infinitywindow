import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { EngagementPopups } from "./EngagementPopups";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <EngagementPopups />
    </div>
  );
}
