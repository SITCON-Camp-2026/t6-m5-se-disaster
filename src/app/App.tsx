import { useState } from "react";
import messyReports from "../fixtures/phase-0/messy-reports.json";
import { EmptyState } from "../components/EmptyState";
import {
  labelForUserRole,
  LoginPanel,
  type SessionUser,
} from "../components/LoginPanel";
import {
  Phase0RawInfoPanel,
  type RecordInteraction,
} from "../features/phase-0/Phase0RawInfoPanel";
import { Phase0Workbench } from "../features/phase-0/Phase0Workbench";
import { createPhase0AgentDraft } from "../features/phase-0/phase0-heuristics";
import type { Phase0MessyRecord } from "../features/phase-0/phase0-types";

type TabKey = "role" | "raw" | "workbench";
type TaskStatus = "accepted" | "completed";
type TaskAssignment = {
  assignee: string;
  status: TaskStatus;
};

const phase0Records = messyReports satisfies Phase0MessyRecord[];

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
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [records, setRecords] = useState<Phase0MessyRecord[]>(phase0Records);
  const [taskAssignments, setTaskAssignments] = useState<
    Record<string, TaskAssignment>
  >({});
  const [interactions, setInteractions] = useState<
    Record<string, RecordInteraction>
  >({});
  const [activeTab, setActiveTab] = useState<TabKey>("role");
  const [selectedRecordId, setSelectedRecordId] = useState(records[0]?.id ?? "");

  function selectForWorkbench(recordId: string) {
    setSelectedRecordId(recordId);
    setActiveTab("workbench");
  }

  function login(user: SessionUser) {
    setSessionUser(user);
    setActiveTab("role");
  }

  function logout() {
    setSessionUser(null);
    setActiveTab("role");
  }

  function createRecord(rawText: string, locationText: string) {
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

    setRecords((currentRecords) => [nextRecord, ...currentRecords]);
    setSelectedRecordId(nextRecord.id);
    setInteractions((currentInteractions) => ({
      ...currentInteractions,
      [nextRecord.id]: {
        liked: false,
        likeCount: 0,
        comments: [],
      },
    }));
  }

  function toggleLike(recordId: string) {
    setInteractions((currentInteractions) => {
      const current = currentInteractions[recordId] ?? {
        liked: false,
        likeCount: 0,
        comments: [],
      };

      return {
        ...currentInteractions,
        [recordId]: {
          ...current,
          liked: !current.liked,
          likeCount: current.liked
            ? Math.max(0, current.likeCount - 1)
            : current.likeCount + 1,
        },
      };
    });
  }

  function addComment(recordId: string, comment: string) {
    setInteractions((currentInteractions) => {
      const current = currentInteractions[recordId] ?? {
        liked: false,
        likeCount: 0,
        comments: [],
      };

      return {
        ...currentInteractions,
        [recordId]: {
          ...current,
          comments: [...current.comments, comment],
        },
      };
    });
  }

  function acceptTask(recordId: string) {
    if (!sessionUser) return;
    setTaskAssignments((currentAssignments) => ({
      ...currentAssignments,
      [recordId]: {
        assignee: sessionUser.name,
        status: "accepted",
      },
    }));
  }

  function completeTask(recordId: string) {
    if (!sessionUser) return;
    setTaskAssignments((currentAssignments) => ({
      ...currentAssignments,
      [recordId]: {
        assignee: currentAssignments[recordId]?.assignee ?? sessionUser.name,
        status: "completed",
      },
    }));
  }

  if (!sessionUser) {
    return <LoginPanel onLogin={login} />;
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
        {records.length === 0 ? (
          <EmptyState message="目前沒有資料" />
        ) : activeTab === "role" ? (
          <RoleScreen
            role={sessionUser.role}
            records={records}
            taskAssignments={taskAssignments}
            onCreateRecord={createRecord}
            onAcceptTask={acceptTask}
            onCompleteTask={completeTask}
            onOpenRaw={() => setActiveTab("raw")}
            onOpenWorkbench={() => setActiveTab("workbench")}
          />
        ) : activeTab === "raw" ? (
          <Phase0RawInfoPanel
            records={records}
            selectedRecordId={selectedRecordId}
            onSelect={selectForWorkbench}
            interactions={interactions}
            onCreateRecord={createRecord}
            onToggleLike={toggleLike}
            onAddComment={addComment}
          />
        ) : (
          <Phase0Workbench
            records={records}
            selectedRecordId={selectedRecordId}
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
  taskAssignments,
  onCreateRecord,
  onAcceptTask,
  onCompleteTask,
  onOpenRaw,
  onOpenWorkbench,
}: {
  role: SessionUser["role"];
  records: Phase0MessyRecord[];
  taskAssignments: Record<string, TaskAssignment>;
  onCreateRecord: (rawText: string, locationText: string) => void;
  onAcceptTask: (recordId: string) => void;
  onCompleteTask: (recordId: string) => void;
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
            <strong>{drafts.filter((draft) => draft.unsafeToActDirectly).length}</strong>
          </div>
          <div className="summary-tile">
            <span>待人工確認</span>
            <strong>{drafts.filter((draft) => draft.needsHumanReview).length}</strong>
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
        <button className="button button--primary" type="button" onClick={onOpenWorkbench}>
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
          <strong>{drafts.filter((draft) => draft.unsafeToActDirectly).length}</strong>
        </div>
        <div className="summary-tile">
          <span>待人工確認</span>
          <strong>{drafts.filter((draft) => draft.needsHumanReview).length}</strong>
        </div>
      </div>
      <Leaderboard taskAssignments={taskAssignments} />
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

function TaskBoard({
  records,
  taskAssignments,
  onAcceptTask,
  onCompleteTask,
}: {
  records: Phase0MessyRecord[];
  taskAssignments: Record<string, TaskAssignment>;
  onAcceptTask: (recordId: string) => void;
  onCompleteTask: (recordId: string) => void;
}) {
  return (
    <section className="task-board" aria-label="接單任務">
      <div>
        <p className="eyebrow">接單區</p>
        <h3>可接未確認線索</h3>
        <p>這裡模擬平台接單流程；接單不代表資訊已確認，也不代表可以直接出發。</p>
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
                    : "尚未接單"}
                </span>
              </div>
              {assignment?.status === "completed" ? (
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
