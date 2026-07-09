import messyReports from "../fixtures/phase-0/messy-reports.json";
import type { SessionUser, UserRole } from "../components/user-role";
import type { RecordInteraction } from "../features/phase-0/Phase0RawInfoPanel";
import type { Phase0MessyRecord } from "../features/phase-0/phase0-types";

export type TaskStatus = "accepted" | "completed";

export type TaskAssignment = {
  assignee: string;
  status: TaskStatus;
};

export type BackendSummary = {
  totalRecords: number;
  needsReviewRecords: number;
  userSubmittedRecords: number;
  totalComments: number;
  acceptedTasks: number;
  completedTasks: number;
  activeCaptchas: number;
  highPriorityIssues: number;
  reviewedQualityIssues: number;
  authorizationFailures: number;
};

export type BackendIssue = {
  id: string;
  recordId: string;
  severity: "high" | "medium";
  label: string;
  reason: string;
  status: "open" | "reviewed";
};

export type AuditAction =
  | "captcha_issued"
  | "captcha_failed"
  | "login_succeeded"
  | "record_created"
  | "comment_added"
  | "task_accepted"
  | "task_completed"
  | "quality_issue_reviewed"
  | "quality_issue_review_denied";

export type AuditEvent = {
  id: string;
  occurredAt: string;
  actor: string;
  action: AuditAction;
  detail: string;
};

export type BackendSnapshot = {
  records: Phase0MessyRecord[];
  taskAssignments: Record<string, TaskAssignment>;
  interactions: Record<string, RecordInteraction>;
  summary: BackendSummary;
  auditEvents: AuditEvent[];
  qualityIssues: BackendIssue[];
};

export type CaptchaChallenge = {
  captchaId: string;
  prompt: string;
  demoAnswer: string;
};

export class BackendAuthorizationError extends Error {
  constructor(message = "此操作需要資訊整理者權限。") {
    super(message);
    this.name = "BackendAuthorizationError";
  }
}

const demoCaptchaAnswer = "7319";
const initialRecords = messyReports satisfies Phase0MessyRecord[];

export function createDemoBackend() {
  let records: Phase0MessyRecord[] = [...initialRecords];
  let taskAssignments: Record<string, TaskAssignment> = {};
  let interactions: Record<string, RecordInteraction> = {};
  let nextCaptchaNumber = 1;
  let nextAuditNumber = 1;
  let authorizationFailures = 0;
  let auditEvents: AuditEvent[] = [];
  const reviewedIssueIds = new Set<string>();
  const captchaChallenges = new Map<string, string>();

  function createQualityIssues(): BackendIssue[] {
    return records.flatMap((record) => {
      const issues: BackendIssue[] = [];
      const text = record.rawText;

      if (hasAny(text, ["個資", "住址", "完整地址", "公開", "同意"])) {
        issues.push({
          id: `${record.id}-privacy`,
          recordId: record.id,
          severity: "high",
          label: "隱私與公開限制",
          reason: "原文涉及住址、個資或公開同意，不能直接派工或公開。",
          status: reviewedIssueIds.has(`${record.id}-privacy`)
            ? "reviewed"
            : "open",
        });
      }

      if (
        hasAny(text, [
          "地址只有",
          "附近",
          "那邊",
          "A 區",
          "B 區",
          "第二排",
          "市場後面",
          "老街後段",
        ])
      ) {
        issues.push({
          id: `${record.id}-location`,
          recordId: record.id,
          severity: "high",
          label: "地點不足",
          reason: "地點描述仍不足，使用者無法安全抵達或確認對象。",
          status: reviewedIssueIds.has(`${record.id}-location`)
            ? "reviewed"
            : "open",
        });
      }

      if (hasAny(text, ["昨天", "原本", "沒更新", "是否仍有效", "哪一天"])) {
        issues.push({
          id: `${record.id}-stale`,
          recordId: record.id,
          severity: "medium",
          label: "時間或版本待確認",
          reason: "資訊可能已過期，需要確認最新狀態。",
          status: reviewedIssueIds.has(`${record.id}-stale`)
            ? "reviewed"
            : "open",
        });
      }

      if (hasAny(text, ["有人", "群組", "社群", "留言", "轉述", "截圖"])) {
        issues.push({
          id: `${record.id}-source`,
          recordId: record.id,
          severity: "medium",
          label: "來源需查核",
          reason: "來源可能是二手資訊或截圖，不能直接當成已確認。",
          status: reviewedIssueIds.has(`${record.id}-source`)
            ? "reviewed"
            : "open",
        });
      }

      return issues;
    });
  }

  function createSummary(): BackendSummary {
    const qualityIssues = createQualityIssues();

    return {
      totalRecords: records.length,
      needsReviewRecords: records.filter(
        (record) => record.verificationStatus !== "verified",
      ).length,
      userSubmittedRecords: records.filter((record) =>
        record.id.startsWith("U-"),
      ).length,
      totalComments: Object.values(interactions).reduce(
        (count, interaction) => count + interaction.comments.length,
        0,
      ),
      acceptedTasks: Object.values(taskAssignments).filter(
        (assignment) => assignment.status === "accepted",
      ).length,
      completedTasks: Object.values(taskAssignments).filter(
        (assignment) => assignment.status === "completed",
      ).length,
      activeCaptchas: captchaChallenges.size,
      highPriorityIssues: qualityIssues.filter(
        (issue) => issue.severity === "high" && issue.status === "open",
      ).length,
      reviewedQualityIssues: qualityIssues.filter(
        (issue) => issue.status === "reviewed",
      ).length,
      authorizationFailures,
    };
  }

  function appendAudit(action: AuditAction, actor: string, detail: string) {
    const nextEvent: AuditEvent = {
      id: `EV-${String(nextAuditNumber).padStart(3, "0")}`,
      occurredAt: new Date().toISOString(),
      actor,
      action,
      detail,
    };
    nextAuditNumber += 1;
    auditEvents = [nextEvent, ...auditEvents].slice(0, 20);
  }

  function createSnapshot(): BackendSnapshot {
    return {
      records: [...records],
      taskAssignments: { ...taskAssignments },
      interactions: Object.fromEntries(
        Object.entries(interactions).map(([recordId, interaction]) => [
          recordId,
          { comments: [...interaction.comments] },
        ]),
      ),
      summary: createSummary(),
      auditEvents: [...auditEvents],
      qualityIssues: createQualityIssues()
        .sort((a, b) => {
          if (a.status !== b.status) return a.status === "reviewed" ? -1 : 1;
          if (a.severity !== b.severity) return a.severity === "high" ? -1 : 1;
          return a.recordId.localeCompare(b.recordId);
        })
        .slice(0, 16),
    };
  }

  return {
    getSnapshot() {
      return createSnapshot();
    },

    requestCaptchaChallenge(): CaptchaChallenge {
      const captchaId = `captcha-${nextCaptchaNumber}`;
      nextCaptchaNumber += 1;
      captchaChallenges.set(captchaId, demoCaptchaAnswer);
      appendAudit("captcha_issued", "system", `建立登入 CAPTCHA ${captchaId}`);

      return {
        captchaId,
        prompt: "請輸入圖中數字：7319",
        demoAnswer: demoCaptchaAnswer,
      };
    },

    login(input: {
      name: string;
      role: UserRole;
      captchaId: string;
      captchaAnswer: string;
    }): SessionUser {
      const expectedCaptchaAnswer = captchaChallenges.get(input.captchaId);
      if (
        !expectedCaptchaAnswer ||
        input.captchaAnswer.trim() !== expectedCaptchaAnswer
      ) {
        appendAudit(
          "captcha_failed",
          input.name.trim() || "匿名使用者",
          "CAPTCHA 驗證失敗",
        );
        throw new Error("CAPTCHA_FAILED");
      }

      captchaChallenges.delete(input.captchaId);
      const user = {
        name: input.name.trim() || "Demo 使用者",
        role: input.role,
      };
      appendAudit("login_succeeded", user.name, `以 ${user.role} 角色登入`);

      return user;
    },

    createRecord(rawText: string, locationText: string, actor = "Demo 使用者") {
      const nextIndex =
        records.filter((record) => record.id.startsWith("U-")).length + 1;
      const locationPrefix = locationText.trim()
        ? `地點：${locationText.trim()}。`
        : "";
      const nextRecord: Phase0MessyRecord = {
        id: `U-${String(nextIndex).padStart(3, "0")}`,
        rawText: `${locationPrefix}${rawText.trim()}`,
        sourceType: "volunteer_update",
        verificationStatus: "needs_review",
        updatedAt: new Date().toISOString(),
      };

      records = [nextRecord, ...records];
      interactions = {
        ...interactions,
        [nextRecord.id]: {
          comments: [],
        },
      };
      appendAudit("record_created", actor, `新增未確認資訊 ${nextRecord.id}`);

      return createSnapshot();
    },

    addComment(recordId: string, comment: string, actor = "Demo 使用者") {
      const current = interactions[recordId] ?? {
        comments: [],
      };

      interactions = {
        ...interactions,
        [recordId]: {
          ...current,
          comments: [...current.comments, comment],
        },
      };
      appendAudit("comment_added", actor, `在 ${recordId} 新增留言`);

      return createSnapshot();
    },

    acceptTask(recordId: string, assignee: string) {
      taskAssignments = {
        ...taskAssignments,
        [recordId]: {
          assignee,
          status: "accepted",
        },
      };
      appendAudit("task_accepted", assignee, `接單 ${recordId}`);

      return createSnapshot();
    },

    completeTask(recordId: string, assignee: string) {
      taskAssignments = {
        ...taskAssignments,
        [recordId]: {
          assignee: taskAssignments[recordId]?.assignee ?? assignee,
          status: "completed",
        },
      };
      appendAudit(
        "task_completed",
        taskAssignments[recordId]?.assignee ?? assignee,
        `完成 demo 任務 ${recordId}`,
      );

      return createSnapshot();
    },

    reviewQualityIssue(issueId: string, actor: SessionUser) {
      if (actor.role !== "organizer") {
        authorizationFailures += 1;
        appendAudit(
          "quality_issue_review_denied",
          actor.name,
          "嘗試處理資料品質風險但權限不足",
        );
        throw new BackendAuthorizationError();
      }

      const issue = createQualityIssues().find(
        (currentIssue) => currentIssue.id === issueId,
      );
      if (!issue) return createSnapshot();

      reviewedIssueIds.add(issueId);
      appendAudit(
        "quality_issue_reviewed",
        actor.name,
        `標記 ${issue.recordId} 的「${issue.label}」已處理`,
      );

      return createSnapshot();
    },
  };
}

export const demoBackend = createDemoBackend();

function hasAny(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}
