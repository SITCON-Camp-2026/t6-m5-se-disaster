import { useState } from "react";
import {
  BackendAuthorizationError,
  type AuditEvent,
  type BackendIssue,
  type BackendSnapshot,
  type BackendSummary,
  type CaptchaChallenge,
  type TaskAssignment,
  createDemoBackend,
} from "../backend/demo-backend";
import { EmptyState } from "../components/EmptyState";
import { LoginPanel } from "../components/LoginPanel";
import {
  labelForUserRole,
  type SessionUser,
  type UserRole,
} from "../components/user-role";
import { Phase0RawInfoPanel } from "../features/phase-0/Phase0RawInfoPanel";
import { Phase0Workbench } from "../features/phase-0/Phase0Workbench";
import { createPhase0AgentDraft } from "../features/phase-0/phase0-heuristics";
import type { Phase0MessyRecord } from "../features/phase-0/phase0-types";

type TabKey = "role" | "raw" | "workbench";
type QualityIssueFilter = "open" | "high" | "reviewed" | "all";

function tabsForRole(role: SessionUser["role"]): Array<{
  key: TabKey;
  label: string;
}> {
  if (role === "reporter") {
    return [
      { key: "role", label: "回報與行動" },
      { key: "raw", label: "原始資訊" },
    ];
  }

  return [
    { key: "role", label: "整理總覽" },
    { key: "raw", label: "原始資訊" },
    { key: "workbench", label: "整理工作台" },
  ];
}

export function App() {
  const [backend] = useState(() => createDemoBackend());
  const [backendSnapshot, setBackendSnapshot] = useState<BackendSnapshot>(() =>
    backend.getSnapshot(),
  );
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [notice, setNotice] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("role");
  const [, setSelectedRecordId] = useState(
    backendSnapshot.records[0]?.id ?? "",
  );
  const {
    auditEvents,
    interactions,
    qualityIssues,
    records,
    summary,
    taskAssignments,
  } = backendSnapshot;

  function requestCaptchaChallenge(): CaptchaChallenge {
    return backend.requestCaptchaChallenge();
  }

  function login(input: {
    name: string;
    role: UserRole;
    captchaId: string;
    captchaAnswer: string;
  }) {
    const user = backend.login(input);
    setSessionUser(user);
    setNotice("");
    setActiveTab("role");
    setBackendSnapshot(backend.getSnapshot());
    return user;
  }

  function logout() {
    setSessionUser(null);
    setActiveTab("role");
    setNotice("");
  }

  function createRecord(rawText: string, locationText: string) {
    const nextSnapshot = backend.createRecord(
      rawText,
      locationText,
      sessionUser?.name,
    );
    setBackendSnapshot(nextSnapshot);
    setSelectedRecordId(nextSnapshot.records[0]?.id ?? "");
  }

  function addComment(recordId: string, comment: string) {
    setBackendSnapshot(
      backend.addComment(recordId, comment, sessionUser?.name),
    );
  }

  function acceptTask(recordId: string) {
    if (!sessionUser) return;
    setBackendSnapshot(backend.acceptTask(recordId, sessionUser.name));
  }

  function completeTask(recordId: string) {
    if (!sessionUser) return;
    setBackendSnapshot(backend.completeTask(recordId, sessionUser.name));
  }

  function reopenTask(recordId: string) {
    if (!sessionUser) return;
    try {
      setBackendSnapshot(backend.reopenTask(recordId, sessionUser));
      setNotice("");
    } catch (error) {
      if (error instanceof BackendAuthorizationError) {
        setBackendSnapshot(backend.getSnapshot());
        setNotice(error.message);
        return;
      }

      throw error;
    }
  }

  function reviewQualityIssue(issueId: string) {
    if (!sessionUser) return;
    try {
      setBackendSnapshot(backend.reviewQualityIssue(issueId, sessionUser));
      setNotice("");
    } catch (error) {
      if (error instanceof BackendAuthorizationError) {
        setBackendSnapshot(backend.getSnapshot());
        setNotice(error.message);
        return;
      }

      throw error;
    }
  }

  if (!sessionUser) {
    return (
      <LoginPanel
        onRequestCaptchaChallenge={requestCaptchaChallenge}
        onLogin={login}
      />
    );
  }

  const tabs = tabsForRole(sessionUser.role);

  return (
    <main className="layout">
      <header className="hero">
        <div>
          <p className="eyebrow">SITCON Camp 2026</p>
          <h1>災害資訊整理工作台</h1>
          <p>
            第一階段先用 coding agent
            做出可展示的前端原型，再從成果中看見資料品質、角色、狀態與來源的限制。
          </p>
        </div>
        <div className="session-card" aria-label="目前登入使用者">
          <span>{labelForUserRole(sessionUser.role)}</span>
          <strong>{sessionUser.name}</strong>
          <button type="button" onClick={logout}>
            登出
          </button>
        </div>
      </header>

      <nav className="tabs" aria-label="第一階段工作區">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? "active" : ""}
            type="button"
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section className="panel">
        {notice ? (
          <p className="app-notice" role="status">
            {notice}
          </p>
        ) : null}
        {records.length === 0 ? (
          <EmptyState message="目前沒有資料" />
        ) : activeTab === "role" ? (
          <RoleScreen
            role={sessionUser.role}
            records={records}
            summary={summary}
            auditEvents={auditEvents}
            qualityIssues={qualityIssues}
            taskAssignments={taskAssignments}
            onCreateRecord={createRecord}
            onAcceptTask={acceptTask}
            onCompleteTask={completeTask}
            onReopenTask={reopenTask}
            onReviewQualityIssue={reviewQualityIssue}
            onOpenRaw={() => setActiveTab("raw")}
            onOpenWorkbench={() => setActiveTab("workbench")}
          />
        ) : activeTab === "raw" ? (
          <Phase0RawInfoPanel
            records={records}
            interactions={interactions}
            onCreateRecord={createRecord}
            onAddComment={addComment}
            compact={sessionUser.role === "organizer"}
          />
        ) : (
          <Phase0Workbench
            records={records}
            onSelect={setSelectedRecordId}
          />
        )}
      </section>
    </main>
  );
}

function RoleScreen({
  role,
  records,
  summary,
  auditEvents,
  qualityIssues,
  taskAssignments,
  onCreateRecord,
  onAcceptTask,
  onCompleteTask,
  onReopenTask,
  onReviewQualityIssue,
  onOpenRaw,
  onOpenWorkbench,
}: {
  role: SessionUser["role"];
  records: Phase0MessyRecord[];
  summary: BackendSummary;
  auditEvents: AuditEvent[];
  qualityIssues: BackendIssue[];
  taskAssignments: Record<string, TaskAssignment>;
  onCreateRecord: (rawText: string, locationText: string) => void;
  onAcceptTask: (recordId: string) => void;
  onCompleteTask: (recordId: string) => void;
  onReopenTask: (recordId: string) => void;
  onReviewQualityIssue: (issueId: string) => void;
  onOpenRaw: () => void;
  onOpenWorkbench: () => void;
}) {
  if (role === "reporter") {
    const drafts = records.map(createPhase0AgentDraft);

    return (
      <div className="role-screen">
        <div className="panel__header">
          <div>
            <p className="eyebrow">回報與行動畫面</p>
            <h2>先留下線索，也先避免誤行動</h2>
          </div>
          <button className="button" type="button" onClick={onOpenRaw}>
            查看原始資訊
          </button>
        </div>
        <div className="safety-grid">
          <div className="summary-tile summary-tile--warning">
            <span>暫勿直接行動</span>
            <strong>
              {drafts.filter((draft) => draft.unsafeToActDirectly).length}
            </strong>
          </div>
          <div className="summary-tile">
            <span>待人工確認</span>
            <strong>
              {drafts.filter((draft) => draft.needsHumanReview).length}
            </strong>
          </div>
          <div className="summary-tile">
            <span>可直接出發</span>
            <strong>0</strong>
          </div>
        </div>
        <form
          className="intake-form"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const rawText = String(formData.get("rawText") ?? "");
            const locationText = String(formData.get("locationText") ?? "");
            if (!rawText.trim()) return;
            onCreateRecord(rawText, locationText);
            event.currentTarget.reset();
            onOpenRaw();
          }}
        >
          <label>
            我知道的狀況
            <textarea
              name="rawText"
              placeholder="可以先寫不完整資訊，例如地點大概在哪、誰轉述、現在不確定什麼。"
              rows={5}
            />
          </label>
          <div className="intake-form__grid">
            <label>
              地點描述
              <input name="locationText" placeholder="例如：老街口附近" />
            </label>
            <label>
              來源
              <select defaultValue="reported">
                <option value="reported">轉述或聽說</option>
                <option value="seen">親眼看到</option>
                <option value="unknown">不確定</option>
              </select>
            </label>
          </div>
          <p className="safety-note">
            送出後仍會標示為未確認，不會直接變成志工任務。
          </p>
          <button className="button button--primary" type="submit">
            建立未確認線索
          </button>
        </form>
        <div className="safety-list">
          {records.slice(0, 3).map((record) => (
            <article className="safety-item" key={record.id}>
              <h3>{record.id}</h3>
              <p>{record.rawText}</p>
              <strong>尚未確認，請不要直接出發。</strong>
            </article>
          ))}
        </div>
        <TaskBoard
          records={records}
          taskAssignments={taskAssignments}
          onAcceptTask={onAcceptTask}
          onCompleteTask={onCompleteTask}
        />
        <BackendStatusPanel
          auditEvents={auditEvents}
          summary={summary}
          variant="compact"
        />
        <Leaderboard taskAssignments={taskAssignments} />
      </div>
    );
  }

  const drafts = records.map(createPhase0AgentDraft);

  return (
    <div className="role-screen">
      <div className="panel__header">
        <div>
          <p className="eyebrow">資訊整理者畫面</p>
          <h2>分類、缺口與人工確認總覽</h2>
        </div>
        <button
          className="button button--primary"
          type="button"
          onClick={onOpenWorkbench}
        >
          進入整理工作台
        </button>
      </div>
      <div className="safety-grid">
        <div className="summary-tile">
          <span>原始資訊</span>
          <strong>{records.length}</strong>
        </div>
        <div className="summary-tile summary-tile--warning">
          <span>不能直接行動</span>
          <strong>
            {drafts.filter((draft) => draft.unsafeToActDirectly).length}
          </strong>
        </div>
        <div className="summary-tile">
          <span>待人工確認</span>
          <strong>
            {drafts.filter((draft) => draft.needsHumanReview).length}
          </strong>
        </div>
      </div>
      <Leaderboard taskAssignments={taskAssignments} />
      <TaskBoard
        records={records}
        taskAssignments={taskAssignments}
        onAcceptTask={onAcceptTask}
        onCompleteTask={onCompleteTask}
        onReopenTask={onReopenTask}
        mode="manage"
      />
      <DataQualityQueue
        issues={qualityIssues}
        onReviewIssue={onReviewQualityIssue}
      />
      <BackendStatusPanel auditEvents={auditEvents} summary={summary} />
      <div className="role-actions">
        <button className="button" type="button" onClick={onOpenRaw}>
          檢視原始資訊
        </button>
        <button className="button" type="button" onClick={onOpenWorkbench}>
          開始分類整理
        </button>
      </div>
    </div>
  );
}

function DataQualityQueue({
  issues,
  onReviewIssue,
}: {
  issues: BackendIssue[];
  onReviewIssue: (issueId: string) => void;
}) {
  const [filter, setFilter] = useState<QualityIssueFilter>("open");
  const openIssueCount = issues.filter(
    (issue) => issue.status === "open",
  ).length;
  const highIssueCount = issues.filter(
    (issue) => issue.severity === "high",
  ).length;
  const reviewedIssueCount = issues.filter(
    (issue) => issue.status === "reviewed",
  ).length;
  const filteredIssues = issues.filter((issue) => {
    if (filter === "open") return issue.status === "open";
    if (filter === "high") return issue.severity === "high";
    if (filter === "reviewed") return issue.status === "reviewed";
    return true;
  });
  const visibleIssues = filteredIssues.slice(0, 6);
  const filterOptions: Array<{
    key: QualityIssueFilter;
    label: string;
    count: number;
  }> = [
    { key: "open", label: "未處理", count: openIssueCount },
    { key: "high", label: "高風險", count: highIssueCount },
    { key: "reviewed", label: "已處理", count: reviewedIssueCount },
    { key: "all", label: "全部", count: issues.length },
  ];

  return (
    <section className="quality-queue" aria-label="資料品質佇列">
      <div className="backend-status__header">
        <div>
          <p className="eyebrow">Data Quality</p>
          <h3>優先處理佇列</h3>
        </div>
        <span>{openIssueCount} 個未處理</span>
      </div>
      <div className="quality-queue__filters" aria-label="資料品質狀態">
        {filterOptions.map((option) => (
          <button
            key={option.key}
            className={filter === option.key ? "active" : ""}
            type="button"
            aria-pressed={filter === option.key}
            onClick={() => setFilter(option.key)}
          >
            <span>{option.label}</span>
            <strong>{option.count}</strong>
          </button>
        ))}
      </div>
      {visibleIssues.length === 0 ? (
        <p className="backend-status__empty">這個狀態目前沒有資料品質風險</p>
      ) : (
        <ol className="quality-queue__list">
          {visibleIssues.map((issue) => (
            <li
              className={
                issue.status === "reviewed"
                  ? "quality-queue__item quality-queue__item--reviewed"
                  : "quality-queue__item"
              }
              key={issue.id}
            >
              <span
                className={`quality-queue__severity quality-queue__severity--${issue.severity}`}
              >
                {issue.severity === "high" ? "高" : "中"}
              </span>
              <div>
                <strong>
                  {issue.recordId} · {issue.label}
                </strong>
                <p>{issue.reason}</p>
              </div>
              {issue.status === "open" ? (
                <button
                  className="button"
                  type="button"
                  onClick={() => onReviewIssue(issue.id)}
                >
                  標記已處理
                </button>
              ) : (
                <span className="quality-queue__reviewed">已處理</span>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function BackendStatusPanel({
  auditEvents,
  summary,
  variant = "full",
}: {
  auditEvents: AuditEvent[];
  summary: BackendSummary;
  variant?: "compact" | "full";
}) {
  const recentEvents = auditEvents.slice(0, variant === "compact" ? 3 : 6);

  return (
    <section className="backend-status" aria-label="後端狀態">
      <div className="backend-status__header">
        <div>
          <p className="eyebrow">Backend</p>
          <h3>資料流與操作紀錄</h3>
        </div>
        <span>in-memory demo API</span>
      </div>
      <div className="backend-status__metrics">
        <span>原始資訊 {summary.totalRecords}</span>
        <span>待確認 {summary.needsReviewRecords}</span>
        <span>使用者新增 {summary.userSubmittedRecords}</span>
        <span>留言 {summary.totalComments}</span>
        <span>高風險 {summary.highPriorityIssues}</span>
        <span>已處理風險 {summary.reviewedQualityIssues}</span>
        <span>拒絕操作 {summary.authorizationFailures}</span>
        <span>接單中 {summary.acceptedTasks}</span>
        <span>已完成 {summary.completedTasks}</span>
      </div>
      {recentEvents.length === 0 ? (
        <p className="backend-status__empty">尚無後端操作紀錄</p>
      ) : (
        <ol className="backend-status__events">
          {recentEvents.map((event) => (
            <li key={event.id}>
              <strong>{event.actor}</strong>
              <span>{event.detail}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function TaskBoard({
  records,
  taskAssignments,
  onAcceptTask,
  onCompleteTask,
  onReopenTask,
  mode = "claim",
}: {
  records: Phase0MessyRecord[];
  taskAssignments: Record<string, TaskAssignment>;
  onAcceptTask: (recordId: string) => void;
  onCompleteTask: (recordId: string) => void;
  onReopenTask?: (recordId: string) => void;
  mode?: "claim" | "manage";
}) {
  return (
    <section className="task-board" aria-label="接單任務">
      <div>
        <p className="eyebrow">{mode === "manage" ? "任務管理" : "接單區"}</p>
        <h3>{mode === "manage" ? "任務接單狀態" : "可接未確認線索"}</h3>
        <p>
          {mode === "manage"
            ? "管理者可把已接單或已完成的 demo 任務放回待接單，方便重新媒合。"
            : "這裡模擬平台接單流程；接單不代表資訊已確認，也不代表可以直接出發。"}
        </p>
      </div>
      <div className="task-list">
        {records.slice(0, 5).map((record) => {
          const assignment = taskAssignments[record.id];

          return (
            <article className="task-card" key={record.id}>
              <div>
                <h4>{record.id}</h4>
                <p>{record.rawText}</p>
                <span>
                  {assignment
                    ? assignment.status === "completed"
                      ? `已完成：${assignment.assignee}`
                      : `已接單：${assignment.assignee}`
                    : "待接單"}
                </span>
              </div>
              {mode === "manage" ? (
                assignment ? (
                  <button
                    className="button"
                    type="button"
                    onClick={() => onReopenTask?.(record.id)}
                  >
                    設為待接單
                  </button>
                ) : (
                  <button className="button" type="button" disabled>
                    待接單
                  </button>
                )
              ) : assignment?.status === "completed" ? (
                <button className="button" type="button" disabled>
                  已完成
                </button>
              ) : assignment ? (
                <button
                  className="button button--primary"
                  type="button"
                  onClick={() => onCompleteTask(record.id)}
                >
                  完成任務
                </button>
              ) : (
                <button
                  className="button"
                  type="button"
                  onClick={() => onAcceptTask(record.id)}
                >
                  接單
                </button>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Leaderboard({
  taskAssignments,
}: {
  taskAssignments: Record<string, TaskAssignment>;
}) {
  const rows = Object.values(taskAssignments)
    .filter((assignment) => assignment.status === "completed")
    .reduce<Record<string, number>>((counts, assignment) => {
      counts[assignment.assignee] = (counts[assignment.assignee] ?? 0) + 1;
      return counts;
    }, {});
  const leaderboard = Object.entries(rows).sort(([, a], [, b]) => b - a);

  return (
    <section className="leaderboard" aria-label="任務完成排行榜">
      <div>
        <p className="eyebrow">排行榜</p>
        <h3>任務完成數</h3>
      </div>
      {leaderboard.length === 0 ? (
        <p className="leaderboard__empty">尚無完成紀錄</p>
      ) : (
        <ol>
          {leaderboard.map(([name, count]) => (
            <li key={name}>
              <span>{name}</span>
              <strong>{count} 件</strong>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
