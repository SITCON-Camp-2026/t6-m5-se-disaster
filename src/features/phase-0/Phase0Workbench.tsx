import { useEffect, useMemo, useState } from "react";
import { RecordCard } from "../../components/RecordCard";
import { StatusBadge } from "../../components/StatusBadge";
import { Phase0JudgementCard } from "./Phase0JudgementCard";
import { createPhase0AgentDraft } from "./phase0-heuristics";
import { demandCategoryLabels, demandCategoryOptions } from "./phase0-labels";
import { requestPhase0Prefill } from "./phase0-prefill-api";
import type {
  Phase0DemandCategory,
  Phase0JudgementDraft,
  Phase0MessyRecord,
} from "./phase0-types";

function createInitialDrafts(records: Phase0MessyRecord[]) {
  return Object.fromEntries(
    records.map((record) => [record.id, createPhase0AgentDraft(record)]),
  );
}

function countDrafts(
  draftsByRecordId: Record<string, Phase0JudgementDraft>,
  predicate: (draft: Phase0JudgementDraft) => boolean,
) {
  return Object.values(draftsByRecordId).filter(predicate).length;
}

export function Phase0Workbench({
  records,
  onSelect,
}: {
  records: Phase0MessyRecord[];
  onSelect: (recordId: string) => void;
}) {
  const [draftsByRecordId, setDraftsByRecordId] = useState<
    Record<string, Phase0JudgementDraft>
  >({});
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [prefillStatus, setPrefillStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("loading");
  const [prefillGeneratedAt, setPrefillGeneratedAt] = useState<string | null>(
    null,
  );

  const editingRecord =
    records.find((record) => record.id === editingRecordId) ?? null;
  const selectedDraft = editingRecord
    ? draftsByRecordId[editingRecord.id]
    : null;
  const categoryCounts = useMemo(
    () =>
      Object.fromEntries(
        demandCategoryOptions.map((option) => [
          option.value,
          countDrafts(
            draftsByRecordId,
            (draft) => draft.demandCategory === option.value,
          ),
        ]),
      ) as Record<Phase0DemandCategory, number>,
    [draftsByRecordId],
  );
  const protectionCounts = useMemo(
    () => ({
      blocked: countDrafts(
        draftsByRecordId,
        (draft) => draft.unsafeToActDirectly,
      ),
      review: countDrafts(
        draftsByRecordId,
        (draft) => draft.needsHumanReview === true,
      ),
      ready: countDrafts(
        draftsByRecordId,
        (draft) => !draft.unsafeToActDirectly && !draft.needsHumanReview,
      ),
    }),
    [draftsByRecordId],
  );

  useEffect(() => {
    let isMounted = true;

    requestPhase0Prefill(records)
      .then((response) => {
        if (!isMounted) return;
        setDraftsByRecordId(response.drafts);
        setPrefillGeneratedAt(response.generatedAt);
        setPrefillStatus("ready");
      })
      .catch(() => {
        if (!isMounted) return;
        setDraftsByRecordId(createInitialDrafts(records));
        setPrefillGeneratedAt(null);
        setPrefillStatus("error");
      });

    return () => {
      isMounted = false;
    };
  }, [records]);

  function createDraft(record: Phase0MessyRecord) {
    setDraftsByRecordId((currentDrafts) => ({
      ...currentDrafts,
      [record.id]: createPhase0AgentDraft(record),
    }));
  }

  function updateDraft(nextDraft: Phase0JudgementDraft) {
    setDraftsByRecordId((currentDrafts) => ({
      ...currentDrafts,
      [nextDraft.messyRecordId]: nextDraft,
    }));
  }

  function deleteDraft(recordId: string) {
    setDraftsByRecordId((currentDrafts) => {
      const nextDrafts = { ...currentDrafts };
      delete nextDrafts[recordId];
      return nextDrafts;
    });
  }

  function openEditor(recordId: string) {
    setEditingRecordId(recordId);
    onSelect(recordId);
  }

  function resetDrafts() {
    setPrefillStatus("loading");
    setEditingRecordId(null);
    requestPhase0Prefill(records)
      .then((response) => {
        setDraftsByRecordId(response.drafts);
        setPrefillGeneratedAt(response.generatedAt);
        setPrefillStatus("ready");
      })
      .catch(() => {
        setDraftsByRecordId(createInitialDrafts(records));
        setPrefillGeneratedAt(null);
        setPrefillStatus("error");
      });
  }

  return (
    <div className="workbench">
      <div className="workbench__intro">
        <div>
          <p className="eyebrow">整理工作台</p>
          <h2>
            第一階段的成功不是分類正確，而是把為什麼現在還不能判斷說清楚。
          </h2>
          <p>
            這裡透過預填 API
            產生可編輯分類草稿；這不是已確認資料，也不是正式資料模型。每一筆仍需要人類確認。
          </p>
          <p className={`api-status api-status--${prefillStatus}`}>
            {prefillStatus === "loading"
              ? "預填 API 產生分類草稿中"
              : prefillStatus === "error"
                ? "預填 API 失敗，已改用保守草稿"
                : prefillGeneratedAt
                  ? `預填 API 已產生草稿：${new Date(prefillGeneratedAt).toLocaleString("zh-TW")}`
                  : "等待預填 API"}
          </p>
        </div>
        <button className="button" type="button" onClick={resetDrafts}>
          重新呼叫預填 API
        </button>
      </div>

      <div className="workbench__layout">
        <aside className="workbench__queue" aria-label="選擇待確認事項">
          <div className="category-dashboard" aria-label="分類總覽">
            <button
              aria-expanded={isCategoryOpen}
              className="category-dashboard__toggle"
              type="button"
              onClick={() => setIsCategoryOpen((current) => !current)}
            >
              <span>分類總覽</span>
              <strong>{isCategoryOpen ? "收合" : "展開"}</strong>
            </button>
            {isCategoryOpen ? (
              <div className="category-dashboard__grid">
                {demandCategoryOptions.map((option) => (
                  <div className="category-tile" key={option.value}>
                    <span
                      className={`demand-dot demand-${option.value}`}
                      aria-hidden="true"
                    />
                    <span>{option.label}</span>
                    <strong>{categoryCounts[option.value] ?? 0}</strong>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="protection-meter" aria-label="防護摘要">
            <div>
              <span>先擋下</span>
              <strong>{protectionCounts.blocked}</strong>
            </div>
            <div>
              <span>待人工確認</span>
              <strong>{protectionCounts.review}</strong>
            </div>
            <div>
              <span>可再整理</span>
              <strong>{protectionCounts.ready}</strong>
            </div>
          </div>

          <div className="review-grid" aria-label="待確認事項九宮格">
            {records.map((record) => (
              <button
                className={record.id === editingRecordId ? "active" : ""}
                key={record.id}
                type="button"
                onClick={() => openEditor(record.id)}
              >
                <span className="review-grid__id">{record.id}</span>
                <StatusBadge status={record.verificationStatus} />
                {draftsByRecordId[record.id] ? (
                  <span
                    className={`demand-badge demand-${draftsByRecordId[record.id].demandCategory}`}
                  >
                    {
                      demandCategoryLabels[
                        draftsByRecordId[record.id].demandCategory
                      ]
                    }
                  </span>
                ) : (
                  <span className="draft-pill draft-pill--muted">未建草稿</span>
                )}
              </button>
            ))}
          </div>
        </aside>

        <div className="workbench__main">
          {editingRecord ? (
            <>
              <RecordCard record={editingRecord} />

              {selectedDraft ? (
                <Phase0JudgementCard
                  judgement={selectedDraft}
                  record={editingRecord}
                  onChange={updateDraft}
                  onDelete={() => deleteDraft(editingRecord.id)}
                />
              ) : (
                <article className="judgement-card judgement-card--empty">
                  <div className="judgement-card__header">
                    <div>
                      <p className="eyebrow">尚未建立草稿</p>
                      <h3>{editingRecord.id} 仍只保留原始資訊</h3>
                    </div>
                    <button
                      className="button"
                      type="button"
                      onClick={() => createDraft(editingRecord)}
                    >
                      建立這筆草稿
                    </button>
                  </div>
                  <p>
                    建立草稿後，請只填入原文能支持的候選判斷；不確定之處要留在人工確認與不能直接變任務的欄位。
                  </p>
                </article>
              )}
            </>
          ) : (
            <article className="judgement-card judgement-card--guard">
              <div className="judgement-card__header">
                <div>
                  <p className="eyebrow">防護中</p>
                  <h3>先選一個待確認事項，再進入狀態編輯</h3>
                </div>
              </div>
              <p>
                工作台不會自動把未查核資訊變成任務。請從左側九宮格點選一筆資料，確認原文、來源與阻擋原因後再修改狀態。
              </p>
            </article>
          )}
        </div>
      </div>
    </div>
  );
}
