import type { DisasterCategory } from "@/game/types";
import fire from "@/assets/cutscenes/fire.mp4.asset.json";
import atmospheric from "@/assets/cutscenes/atmospheric.mp4.asset.json";
import cosmic from "@/assets/cutscenes/cosmic.mp4.asset.json";
import geological from "@/assets/cutscenes/geological.mp4.asset.json";
import hydrological from "@/assets/cutscenes/hydrological.mp4.asset.json";
import electromagnetic from "@/assets/cutscenes/electromagnetic.mp4.asset.json";
import biological from "@/assets/cutscenes/biological.mp4.asset.json";
import slowburn from "@/assets/cutscenes/slowburn.mp4.asset.json";

/**
 * Static per-category effect videos played when an attack/disaster deploys.
 * Used as a fallback when no admin-configured cutscene exists in the DB.
 */
export const CUTSCENE_FALLBACK_URLS: Record<DisasterCategory, string> = {
  Fire: fire.url,
  Atmospheric: atmospheric.url,
  Cosmic: cosmic.url,
  Geological: geological.url,
  Hydrological: hydrological.url,
  Electromagnetic: electromagnetic.url,
  Biological: biological.url,
  SlowBurn: slowburn.url,
};

export const CUTSCENE_FALLBACK_DURATION = 6;