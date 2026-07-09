import { describe, expect, it } from "vitest";
import messyReports from "../src/fixtures/phase-0/messy-reports.json";
import {
  createPhase0AgentDraft,
  createPhase0Judgement,
} from "../src/features/phase-0/phase0-heuristics";

describe("phase 0 heuristics", () => {
  it("loads the current phase 0 messy data", () => {
    expect(messyReports).toHaveLength(12);
    expect(messyReports.map((record) => record.id)).toEqual(
      Array.from(
        { length: 12 },
        (_, index) => `M-${String(index + 1).padStart(3, "0")}`,
      ),
    );
  });

  it("creates conservative safety placeholders for all records", () => {
    const judgements = messyReports.map(createPhase0Judgement);

    expect(judgements).toHaveLength(messyReports.length);
    expect(
      judgements.filter((judgement) => judgement.unsafeToActDirectly),
    ).toHaveLength(messyReports.length);
    expect(
      judgements.filter((judgement) => judgement.possibleKind === "unknown"),
    ).toHaveLength(messyReports.length);
    expect(
      judgements.filter((judgement) => judgement.confidence === "low"),
    ).toHaveLength(messyReports.length);
  });

  it("does not treat review-needed records as confirmed facts", () => {
    const judgement = createPhase0Judgement(messyReports[9]);

    expect(messyReports[9].verificationStatus).toBe("needs_review");
    expect(judgement.unsafeToActDirectly).toBe(true);
    expect(judgement.evidence.join(" ")).not.toContain("verified");
  });

  it("does not infer candidate kind from the starter text", () => {
    const judgement = createPhase0Judgement(messyReports[10]);

    expect(judgement.possibleKind).toBe("unknown");
    expect(judgement.suggestedNextStep).toBe("send_to_human_review");
  });

  it("creates editable agent prefill drafts without confirming records", () => {
    const drafts = messyReports.map(createPhase0AgentDraft);

    expect(drafts).toHaveLength(messyReports.length);
    expect(drafts.some((draft) => draft.possibleKind !== "unknown")).toBe(true);
    expect(drafts.some((draft) => draft.demandCategory === "supplies")).toBe(
      true,
    );
    expect(drafts.some((draft) => draft.demandCategory === "people")).toBe(
      true,
    );
    expect(drafts.every((draft) => draft.unsafeToActDirectly)).toBe(true);
    expect(drafts.every((draft) => draft.needsHumanReview)).toBe(true);
    expect(
      drafts.every((draft) => draft.suggestedNextStep !== "keep_raw"),
    ).toBe(true);
    expect(drafts.flatMap((draft) => draft.evidence).join(" ")).not.toContain(
      "已確認",
    );
  });
});
