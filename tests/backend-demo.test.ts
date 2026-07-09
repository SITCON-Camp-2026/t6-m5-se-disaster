import { describe, expect, it } from "vitest";
import {
  BackendAuthorizationError,
  createDemoBackend,
} from "../src/backend/demo-backend";

describe("demo backend", () => {
  it("validates captcha before creating a session snapshot", () => {
    const demoBackend = createDemoBackend();
    const challenge = demoBackend.requestCaptchaChallenge();

    expect(() =>
      demoBackend.login({
        name: "整理者",
        role: "organizer",
        captchaId: challenge.captchaId,
        captchaAnswer: "0000",
      }),
    ).toThrow("CAPTCHA_FAILED");

    const retryChallenge = demoBackend.requestCaptchaChallenge();
    const user = demoBackend.login({
      name: "整理者",
      role: "organizer",
      captchaId: retryChallenge.captchaId,
      captchaAnswer: retryChallenge.demoAnswer,
    });

    expect(user).toEqual({ name: "整理者", role: "organizer" });
    expect(demoBackend.getSnapshot().auditEvents[0]?.action).toBe(
      "login_succeeded",
    );
  });

  it("updates summary and audit events for record, comment, and task actions", () => {
    const demoBackend = createDemoBackend();
    const before = demoBackend.getSnapshot().summary;
    const afterCreate = demoBackend.createRecord(
      "測試新增：市場後方疑似需要搬運協助。",
      "市場後方",
      "測試使用者",
    );
    const createdRecord = afterCreate.records[0];

    expect(afterCreate.summary.totalRecords).toBe(before.totalRecords + 1);
    expect(afterCreate.summary.userSubmittedRecords).toBe(
      before.userSubmittedRecords + 1,
    );
    expect(afterCreate.auditEvents[0]?.action).toBe("record_created");

    const afterComment = demoBackend.addComment(
      createdRecord.id,
      "請先確認地點與是否仍需要協助。",
      "測試使用者",
    );
    expect(afterComment.summary.totalComments).toBe(
      afterCreate.summary.totalComments + 1,
    );
    expect(afterComment.auditEvents[0]?.action).toBe("comment_added");

    const afterAccept = demoBackend.acceptTask(createdRecord.id, "測試使用者");
    expect(afterAccept.summary.acceptedTasks).toBeGreaterThanOrEqual(1);
    expect(afterAccept.auditEvents[0]?.action).toBe("task_accepted");

    const afterComplete = demoBackend.completeTask(
      createdRecord.id,
      "測試使用者",
    );
    expect(afterComplete.summary.completedTasks).toBeGreaterThanOrEqual(1);
    expect(afterComplete.auditEvents[0]?.action).toBe("task_completed");

    const afterReopen = demoBackend.reopenTask(createdRecord.id, {
      name: "整理者",
      role: "organizer",
    });
    expect(afterReopen.taskAssignments[createdRecord.id]).toBeUndefined();
    expect(afterReopen.summary.acceptedTasks).toBe(0);
    expect(afterReopen.summary.completedTasks).toBe(0);
    expect(afterReopen.auditEvents[0]?.action).toBe("task_reopened");
  });

  it("returns data quality issues for high-risk records", () => {
    const demoBackend = createDemoBackend();
    const snapshot = demoBackend.getSnapshot();

    expect(snapshot.qualityIssues.length).toBeGreaterThan(0);
    expect(snapshot.summary.highPriorityIssues).toBeGreaterThan(0);
    expect(
      snapshot.qualityIssues.some((issue) => issue.label === "隱私與公開限制"),
    ).toBe(true);
    expect(
      snapshot.qualityIssues.some((issue) => issue.label === "地點不足"),
    ).toBe(true);
  });

  it("lets organizers review a data quality issue", () => {
    const demoBackend = createDemoBackend();
    const issue = demoBackend
      .getSnapshot()
      .qualityIssues.find((currentIssue) => currentIssue.status === "open");

    expect(issue).toBeDefined();
    const afterReview = demoBackend.reviewQualityIssue(issue?.id ?? "", {
      name: "整理者",
      role: "organizer",
    });

    expect(afterReview.summary.reviewedQualityIssues).toBe(1);
    expect(
      afterReview.qualityIssues.find(
        (currentIssue) => currentIssue.id === issue?.id,
      )?.status,
    ).toBe("reviewed");
    expect(afterReview.auditEvents[0]?.action).toBe("quality_issue_reviewed");
  });

  it("rejects quality issue review from non-organizer users", () => {
    const demoBackend = createDemoBackend();
    const issue = demoBackend
      .getSnapshot()
      .qualityIssues.find((currentIssue) => currentIssue.status === "open");

    expect(() =>
      demoBackend.reviewQualityIssue(issue?.id ?? "", {
        name: "回報者",
        role: "reporter",
      }),
    ).toThrow(BackendAuthorizationError);

    const snapshot = demoBackend.getSnapshot();
    expect(snapshot.summary.authorizationFailures).toBe(1);
    expect(snapshot.auditEvents[0]?.action).toBe("quality_issue_review_denied");
  });

  it("rejects reopening tasks from non-organizer users", () => {
    const demoBackend = createDemoBackend();
    const record = demoBackend.getSnapshot().records[0];
    demoBackend.acceptTask(record.id, "回報者");

    expect(() =>
      demoBackend.reopenTask(record.id, {
        name: "回報者",
        role: "reporter",
      }),
    ).toThrow(BackendAuthorizationError);

    const snapshot = demoBackend.getSnapshot();
    expect(snapshot.taskAssignments[record.id]?.status).toBe("accepted");
    expect(snapshot.summary.authorizationFailures).toBe(1);
    expect(snapshot.auditEvents[0]?.action).toBe("task_reopen_denied");
  });
});
