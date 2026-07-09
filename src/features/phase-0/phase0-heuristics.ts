import type { Phase0JudgementDraft, Phase0MessyRecord } from "./phase0-types";

// Phase 0 safety scaffolds: these are editable draft starters, not an answer engine.
export function createPhase0Judgement(
  record: Phase0MessyRecord,
): Phase0JudgementDraft {
  const isVerified = record.verificationStatus === "verified";

  return {
    messyRecordId: record.id,
    possibleKind: "unknown",
    demandCategory: "unknown",
    confidence: "low",
    evidence: ["尚未建立整理草稿：請由小組從原文標出判斷依據。"],
    blockers: isVerified
      ? ["仍需確認這筆資訊適合進入哪個後續流程。"]
      : ["目前不是已確認資訊，不能直接行動或當成事實發布。"],
    suggestedNextStep: isVerified ? "keep_raw" : "send_to_human_review",
    unsafeToActDirectly: true,
    needsHumanReview: !isVerified,
    agentJudgementQuestioned: false,
  };
}

export function createPhase0AgentDraft(
  record: Phase0MessyRecord,
): Phase0JudgementDraft {
  const rawText = record.rawText;
  const possibleKind = inferPossibleKind(rawText);
  const demandCategory = inferDemandCategory(rawText);
  const blockers = [
    `查核狀態仍是 ${record.verificationStatus}，不能顯示成已確認。`,
    ...inferBlockers(rawText),
  ];

  return {
    messyRecordId: record.id,
    possibleKind,
    demandCategory,
    confidence: possibleKind === "unknown" ? "low" : "medium",
    evidence: [`原文可見：「${rawText}」`],
    blockers,
    suggestedNextStep:
      possibleKind === "unknown" ? "ask_for_more_info" : "send_to_human_review",
    unsafeToActDirectly: true,
    needsHumanReview: true,
    agentJudgementQuestioned: shouldQuestionAgentDraft(rawText),
    humanReviewNote:
      "Agent 預填草稿：請人類逐項檢查原文依據，刪除沒有被原文支持的推測。",
  };
}

function inferDemandCategory(
  rawText: string,
): Phase0JudgementDraft["demandCategory"] {
  if (hasAny(rawText, ["公告", "道路封閉"])) return "announcement";
  if (hasAny(rawText, ["雨鞋", "飲用水", "二手衣物", "鏟子", "藥品"]))
    return "supplies";
  if (hasAny(rawText, ["水電", "工班", "檢修"])) return "professional_support";
  if (hasAny(rawText, ["集合點", "活動中心", "開放", "封閉", "不要再派人"]))
    return "site_status";
  if (hasAny(rawText, ["人", "志工", "清泥", "搬動", "協助"])) return "people";
  return "unknown";
}

function inferPossibleKind(
  rawText: string,
): Phase0JudgementDraft["possibleKind"] {
  if (hasAny(rawText, ["公告", "道路封閉"])) return "announcement_candidate";
  if (hasAny(rawText, ["雨鞋", "飲用水", "二手衣物", "集合點", "開放", "不缺"]))
    return "site_status_candidate";
  if (hasAny(rawText, ["需要", "協助", "支援", "藥品", "清泥", "搬動"]))
    return "help_request_candidate";
  if (hasAny(rawText, ["派人", "志工"])) return "task_candidate";
  return "unknown";
}

function inferBlockers(rawText: string): string[] {
  const blockers = new Set<string>();

  if (hasAny(rawText, ["不知道", "疑似", "無法確認", "尚未確認", "不確定"])) {
    blockers.add("原文直接指出仍有不確定或尚未確認的資訊。");
  }

  if (hasAny(rawText, ["有人", "群組", "留言", "轉述", "家屬", "代一位"])) {
    blockers.add("資訊可能是轉述或二手來源，需要確認當事人與最新狀態。");
  }

  if (hasAny(rawText, ["地址只有", "附近", "那邊", "A 區", "第二排"])) {
    blockers.add("地點描述不足，不能直接派人前往。");
  }

  if (hasAny(rawText, ["昨天", "原本", "沒更新", "下午還有沒有"])) {
    blockers.add("時間或版本可能已變動，需要確認目前是否仍有效。");
  }

  if (blockers.size === 0) {
    blockers.add("仍需要人類確認來源、時間、地點與是否能公開使用。");
  }

  return [...blockers];
}

function shouldQuestionAgentDraft(rawText: string) {
  return hasAny(rawText, [
    "不知道",
    "疑似",
    "無法確認",
    "尚未確認",
    "不確定",
    "有人",
    "留言",
    "轉述",
    "家屬",
  ]);
}

function hasAny(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}
