import { ALL_STAGES, getClientStageIndex, getClientStageName } from "./pipeline-constants";
import { StageKey } from "./types";

export interface StageInfo {
  index: number;
  code: string;
  label: string;
}

export const STAGE_CODES = ["L", "C", "B", "R", "P", "S", "W", "V", "F", "H"] as const;
export const STAGE_LABELS = [
  "Lead",
  "Contacted",
  "Booked",
  "Requirements",
  "Proposal",
  "Signed",
  "Work",
  "Revisions",
  "Final",
  "Handover",
] as const;

export function getStage(checks?: Record<string, { done?: boolean }>): StageInfo {
  const idx = getClientStageIndex({ checks });
  const clampedIdx = Math.min(idx, 9);
  return {
    index: clampedIdx,
    code: STAGE_CODES[clampedIdx],
    label: STAGE_LABELS[clampedIdx],
  };
}

export { ALL_STAGES, getClientStageIndex, getClientStageName };

