import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Navbar, type TabKey } from "@/components/infinity/Navbar";
import { LocationsTab } from "@/components/infinity/LocationsTab";
import { MyRoomTab } from "@/components/infinity/MyRoomTab";
import { LiveViewTab } from "@/components/infinity/LiveViewTab";
import { PatentDrawer } from "@/components/infinity/PatentDrawer";
import { InfinityProvider } from "@/components/infinity/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Infinity Window — Virtual Window System" },
      {
        name: "description",
        content:
          "Stream remote locations into your room. Map physical walls to directional views and simulate your perspective as you move.",
      },
      { property: "og:title", content: "Infinity Window — Virtual Window System" },
      {
        property: "og:description",
        content:
          "A virtual window system that streams remote locations and shifts perspective as you move through your room.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [tab, setTab] = useState<TabKey>("locations");

  return (
    <InfinityProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Navbar active={tab} onChange={setTab} />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div key={tab} className="animate-tab-in">
            {tab === "locations" && <LocationsTab />}
            {tab === "room" && <MyRoomTab />}
            {tab === "live" && <LiveViewTab />}
          </div>
        </main>
        <PatentDrawer />
      </div>
    </InfinityProvider>
  );
}
