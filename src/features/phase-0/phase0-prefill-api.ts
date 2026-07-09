import { createPhase0AgentDraft } from "./phase0-heuristics";
import type { Phase0JudgementDraft, Phase0MessyRecord } from "./phase0-types";

export type Phase0PrefillApiResponse = {
  generatedAt: string;
  drafts: Record<string, Phase0JudgementDraft>;
};

export async function requestPhase0Prefill(
  records: Phase0MessyRecord[],
): Promise<Phase0PrefillApiResponse> {
  const drafts = Object.fromEntries(
    records.map((record) => [record.id, createPhase0AgentDraft(record)]),
  );

  return {
    generatedAt: new Date().toISOString(),
    drafts,
  };
}
