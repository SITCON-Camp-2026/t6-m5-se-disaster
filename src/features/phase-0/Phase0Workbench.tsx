import { useEffect, useMemo, useState } from "react";
import { RecordCard } from "../../components/RecordCard";
import { StatusBadge } from "../../components/StatusBadge";
import { Phase0JudgementCard } from "./Phase0JudgementCard";
import { createPhase0AgentDraft } from "./phase0-heuristics";
import { demandCategoryLabels, demandCategoryOptions } from "./phase0-labels";
import type {
  Phase0DemandCategory,
  Phase0JudgementDraft,
  Phase0MessyRecord,
} from "./phase0-types";

type DemandFilter = Phase0DemandCategory | "all";

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
  selectedRecordId,
  onSelect,
}: {
  records: Phase0MessyRecord[];
  selectedRecordId: string;
  onSelect: (recordId: string) => void;
}) {
  const [draftsByRecordId, setDraftsByRecordId] = useState<
    Record<string, Phase0JudgementDraft>
  >(() => createInitialDrafts(records));
  const [demandFilter, setDemandFilter] = useState<DemandFilter>("all");

  const visibleRecords = useMemo(
    () =>
      demandFilter === "all"
        ? records
        : records.filter(
            (record) =>
              draftsByRecordId[record.id]?.demandCategory === demandFilter,
          ),
    [demandFilter, draftsByRecordId, records],
  );

  const selectedRecord =
    records.find((record) => record.id === selectedRecordId) ?? records[0];
  const selectedDraft = draftsByRecordId[selectedRecord.id];
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

  useEffect(() => {
    if (
      visibleRecords.length > 0 &&
      !visibleRecords.some((record) => record.id === selectedRecordId)
    ) {
      onSelect(visibleRecords[0].id);
    }
  }, [onSelect, selectedRecordId, visibleRecords]);

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

  function resetDrafts() {
    setDraftsByRecordId(createInitialDrafts(records));
    onSelect(records[0]?.id ?? "");
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
            這裡使用 coding agent 協助預填可編輯草稿；這不是 runtime LLM
            分析，也不是正式資料模型。每一筆仍需要人類確認。
          </p>
        </div>
        <button className="button" type="button" onClick={resetDrafts}>
          重設為 agent 預填草稿
        </button>
      </div>

      <div className="workbench__layout">
        <aside className="workbench__queue" aria-label="選擇原始資訊">
          <div className="filter-panel">
            <h3>需求分類篩選</h3>
            <button
              className={demandFilter === "all" ? "active" : ""}
              type="button"
              onClick={() => setDemandFilter("all")}
            >
              全部
              <span>{Object.keys(draftsByRecordId).length} 筆</span>
            </button>
            {demandCategoryOptions.map((option) => (
              <button
                className={demandFilter === option.value ? "active" : ""}
                key={option.value}
                type="button"
                onClick={() => setDemandFilter(option.value)}
              >
                <span
                  className={`demand-dot demand-${option.value}`}
                  aria-hidden="true"
                />
                {option.label}
                <span>{categoryCounts[option.value] ?? 0} 筆</span>
              </button>
            ))}
          </div>

          {visibleRecords.map((record) => (
            <button
              className={record.id === selectedRecord.id ? "active" : ""}
              key={record.id}
              type="button"
              onClick={() => onSelect(record.id)}
            >
              <span>{record.id}</span>
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
              ) : null}
              {draftsByRecordId[record.id] ? (
                <span className="draft-pill">agent 草稿</span>
              ) : null}
            </button>
          ))}
          {visibleRecords.length === 0 ? (
            <p className="filter-empty">這個分類目前沒有草稿</p>
          ) : null}
        </aside>

        <div className="workbench__main">
          <RecordCard record={selectedRecord} />

          {selectedDraft ? (
            <Phase0JudgementCard
              judgement={selectedDraft}
              record={selectedRecord}
              onChange={updateDraft}
              onDelete={() => deleteDraft(selectedRecord.id)}
            />
          ) : (
            <article className="judgement-card">
              <div className="judgement-card__header">
                <div>
                  <p className="eyebrow">尚未建立草稿</p>
                  <h3>{selectedRecord.id} 仍只保留原始資訊</h3>
                </div>
                <button
                  className="button"
                  type="button"
                  onClick={() => createDraft(selectedRecord)}
                >
                  建立這筆草稿
                </button>
              </div>
              <p>
                建立草稿後，請只填入原文能支持的候選判斷；不確定之處要留在人工確認與不能直接變任務的欄位。
              </p>
            </article>
          )}
        </div>
      </div>
    </div>
  );
}
