import { useEffect, useRef } from "react";
import ActivateShields from "@/assets/actions/Activate_Shields.mp4.asset.json";
import AtmosphericEngineering from "@/assets/actions/Atmospheric_Engineering.mp4.asset.json";
import BrokerCeasefire from "@/assets/actions/Broker_Ceasefire.mp4.asset.json";
import CouncilPanic from "@/assets/actions/Council_Panic.mp4.asset.json";
import DeployCountermeasure from "@/assets/actions/Deploy_Countermeasure.mp4.asset.json";
import EnforceEvacuation from "@/assets/actions/Enforce_Evacuation.mp4.asset.json";
import EstablishOrder from "@/assets/actions/Establish_Order.mp4.asset.json";
import ModelStormPath from "@/assets/actions/Model_Storm_Path.mp4.asset.json";
import PredictChainEvent from "@/assets/actions/Predict_Chain_Event.mp4.asset.json";
import RepairInfrastructure from "@/assets/actions/Repair_Infrastructure.mp4.asset.json";
import StabilityCollapse from "@/assets/actions/Stability_Collapse.mp4.asset.json";

export const ACTION_CUTSCENES: Record<string, string> = {
  "Activate Shields": ActivateShields.url,
  "Atmospheric Engineering": AtmosphericEngineering.url,
  "Broker Ceasefire": BrokerCeasefire.url,
  "Deploy Countermeasure": DeployCountermeasure.url,
  "Enforce Evacuation": EnforceEvacuation.url,
  "Establish Order": EstablishOrder.url,
  "Model Storm Path": ModelStormPath.url,
  "Predict Chain Event": PredictChainEvent.url,
  "Repair Infrastructure": RepairInfrastructure.url,
  // Generic high-pressure intro re-used for negotiation/control moments
  "Negotiate Aid": BrokerCeasefire.url,
  "Control Media": CouncilPanic.url,
};

export const STABILITY_COLLAPSE_CUTSCENE = StabilityCollapse.url;

const MAX_DURATION_MS = 6000;

export function ActionCutscene({
  src,
  onDone,
}: {
  src: string;
  onDone: () => void;
}) {
  const doneRef = useRef(false);
  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  };

  useEffect(() => {
    const t = setTimeout(finish, MAX_DURATION_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black flex items-center justify-center"
      onClick={finish}
      role="dialog"
      aria-label="Action cinematic"
    >
      <video
        src={src}
        autoPlay
        muted
        playsInline
        onEnded={finish}
        className="w-full h-full object-cover"
      />
      <button
        onClick={(e) => {
          e.stopPropagation();
          finish();
        }}
        className="absolute top-4 right-4 font-mono text-[10px] tracking-[0.3em] text-white/70 hover:text-white px-3 py-2 rounded bg-black/40 backdrop-blur"
      >
        SKIP →
      </button>
    </div>
  );
}