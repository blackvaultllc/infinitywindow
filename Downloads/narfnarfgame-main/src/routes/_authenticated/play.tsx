import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useGame } from "@/game/store";
import { AlertHud } from "@/components/terra/AlertHud";
import { EarthGlobe } from "@/components/terra/EarthGlobe";
import type { ActiveImpact } from "@/components/terra/EarthGlobe";
import { PlanetRing } from "@/components/terra/PlanetRing";
import { DamagePanel } from "@/components/terra/DamagePanel";
import { ActionPanel } from "@/components/terra/ActionPanel";
import { TerraView } from "@/components/terra/TerraView";
import { FrequencyComms } from "@/components/terra/FrequencyComms";
import { InboundFeed } from "@/components/terra/InboundFeed";
import { RedAlertBanner } from "@/components/terra/RedAlertBanner";
import { CabinetDrawer } from "@/components/terra/CabinetDrawer";
import type { CommsSender } from "@/lib/comms";
import { LogOut, Radio, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/play")({
  head: () => ({
    meta: [
      { title: "Command — Narf Narf" },
      {
        name: "description",
        content:
          "Active theater — coordinate operators, triage disasters, and command the planetary crisis response in real time.",
      },
      { property: "og:title", content: "Command — Narf Narf" },
      { property: "og:description", content: "Active theater. Manage disasters in real time." },
      { property: "og:url", content: "/play" },
    ],
    links: [{ rel: "canonical", href: "/play" }],
  }),
  component: PlayPage,
});

function PlayPage() {
  const { started, outcome, playerRole, abandonGame, disasters, selectedDisasterId } = useGame();
  const navigate = useNavigate();
  const [commsOpen, setCommsOpen] = useState(false);

  useEffect(() => {
    if (outcome) navigate({ to: "/end" });
  }, [outcome, navigate]);

  if (!started) return <Navigate to="/select" />;

  if (playerRole === "Terra")
    return (
      <>
        <RedAlertBanner />
        <TerraView />
      </>
    );

  const roleForComms = (playerRole as CommsSender["role"]) ?? "Observer";

  const globeImpacts: ActiveImpact[] = disasters
    .filter((d) => !d.resolved)
    .map((d) => ({ id: d.id, regionId: d.region, category: d.category }));

  const focusedDisaster =
    disasters.find((d) => d.id === selectedDisasterId && !d.resolved) ?? disasters.find((d) => !d.resolved);
  const focusRegionId = focusedDisaster?.region;

  return (
    <div className="h-[100dvh] overflow-hidden p-2 sm:p-4 flex flex-col gap-2 sm:gap-4 pb-20 md:pb-4">
      <RedAlertBanner />
      <CabinetDrawer />
      <AlertHud />

      {/* Exit button */}
      <button
        onClick={() => {
          if (window.confirm("Leave this match? This counts as a loss and gives the other side the win.")) {
            abandonGame();
          }
        }}
        className="fixed right-3 top-3 z-40 flex h-9 w-9 items-center justify-center rounded-full lg:right-4 lg:top-4"
        style={{ background: "rgba(3,6,15,0.9)", border: "1px solid rgba(226,75,74,0.65)", color: "#E24B4A" }}
        aria-label="Exit match"
      >
        <LogOut size={16} />
      </button>

      {/* ── Main grid ── */}
      <div className="flex flex-1 min-h-0 gap-2 sm:gap-4 overflow-hidden">
        {/* Left column: globe + panels */}
        <div className="flex flex-col gap-3 sm:gap-4 flex-1 min-w-0 min-h-0 overflow-y-auto">
          {/* Globe row */}
          <div className="grid grid-cols-12 gap-3 sm:gap-4">
            {/* Globe window */}
            <div
              className="col-span-12 md:col-span-8 relative rounded-lg overflow-hidden"
              style={{
                minHeight: 280,
                height: "clamp(280px, 36vh, 420px)",
                background: "#03060F",
                border: "1px solid rgba(55,138,221,0.2)",
              }}
            >
              <EarthGlobe impacts={globeImpacts} focusRegionId={focusRegionId} compact />
              {/* Floating inbound alerts */}
              <div className="absolute top-2 right-2 z-10 w-56 hidden sm:block">
                <InboundFeed />
              </div>
            </div>

            {/* Planet ring sidebar */}
            <div className="col-span-12 md:col-span-4">
              <PlanetRing />
            </div>
          </div>

          {/* Damage + Action panels */}
          <div className="grid grid-cols-12 gap-3 sm:gap-4">
            <div className="col-span-12 md:col-span-7">
              <DamagePanel />
            </div>
            <div className="col-span-12 md:col-span-5">
              <ActionPanel />
            </div>
          </div>

          {/* Mobile inbound feed */}
          <div className="col-span-12 sm:hidden">
            <InboundFeed />
          </div>
        </div>

        {/* Right column: comms — desktop only, full height */}
        <div className="hidden lg:flex flex-col" style={{ width: "clamp(280px, 28vw, 380px)", minHeight: 0 }}>
          <FrequencyComms role={roleForComms} className="flex-1 h-full" />
        </div>
      </div>

      {/* Mobile/tablet: floating comms FAB */}
      <button
        onClick={() => setCommsOpen((v) => !v)}
        className="lg:hidden fixed z-40 rounded-full flex items-center justify-center shadow-lg"
        style={{
          right: 12,
          bottom: "calc(76px + env(safe-area-inset-bottom))",
          width: 48,
          height: 48,
          background: commsOpen ? "#378ADD" : "rgba(3,6,15,0.92)",
          border: "1px solid #378ADD",
          color: commsOpen ? "#03060F" : "#378ADD",
          boxShadow: "0 0 24px rgba(55,138,221,0.45)",
        }}
        aria-label={commsOpen ? "Close comms" : "Open comms"}
      >
        {commsOpen ? <X size={20} /> : <Radio size={20} />}
      </button>

      {commsOpen && (
        <div
          className="lg:hidden fixed z-40"
          style={{
            right: 8,
            left: 8,
            bottom: "calc(132px + env(safe-area-inset-bottom))",
            height: "min(58vh, 460px)",
          }}
        >
          <FrequencyComms role={roleForComms} className="h-full" />
        </div>
      )}
    </div>
  );
}
