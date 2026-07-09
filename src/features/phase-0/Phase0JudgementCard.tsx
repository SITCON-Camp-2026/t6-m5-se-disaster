import { demandCategoryOptions } from "./phase0-labels";
import type { Phase0JudgementDraft, Phase0MessyRecord } from "./phase0-types";

const kindLabels: Record<Phase0JudgementDraft["possibleKind"], string> = {
  help_request_candidate: "求助候選",
  site_status_candidate: "地點狀態候選",
  task_candidate: "任務候選",
  assignment_candidate: "人員指派候選",
  announcement_candidate: "公告候選",
  unknown: "候選類型待判斷",
};

const confidenceLabels: Record<Phase0JudgementDraft["confidence"], string> = {
  low: "低",
  medium: "中",
  high: "高",
};

const nextStepLabels: Record<
  Phase0JudgementDraft["suggestedNextStep"],
  string
> = {
  keep_raw: "先保留原始資訊",
  ask_for_more_info: "補問來源或現場資訊",
  send_to_human_review: "交給人工確認",
  create_candidate_report: "建立候選通報",
  create_site_update_suggestion: "建立地點更新建議",
  do_not_use_yet: "暫時不要使用",
};

function toTextareaValue(items: string[]) {
  return items.join("\n");
}

function toList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function Phase0JudgementCard({
  judgement,
  record,
  onChange,
  onDelete,
}: {
  judgement: Phase0JudgementDraft;
  record: Phase0MessyRecord;
  onChange: (nextDraft: Phase0JudgementDraft) => void;
  onDelete: () => void;
}) {
  function update(patch: Partial<Phase0JudgementDraft>) {
    onChange({ ...judgement, ...patch });
  }

  return (
    <form
      className="judgement-card"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="judgement-card__header">
        <div>
          <p className="eyebrow">狀態編輯</p>
          <h3>{record.id} 的候選判斷</h3>
          <span className={`demand-badge demand-${judgement.demandCategory}`}>
            {
              demandCategoryOptions.find(
                (option) => option.value === judgement.demandCategory,
              )?.label
            }
          </span>
        </div>
        <button
          className="button button--danger"
          type="button"
          onClick={onDelete}
        >
          刪除草稿
        </button>
      </div>

      <p>
        這份草稿只是一個候選整理，不能取代人工確認，也不能把原始資訊變成已確認事實。
      </p>

      <div className="draft-guard" role="note">
        <strong>防護檢查</strong>
        <span>未完成人工確認前，狀態只能停留在候選整理。</span>
        <span>若來源、時間或地點不足，請維持不能直接變成志工任務。</span>
      </div>

      <div className="draft-form__grid">
        <label>
          需求分類
          <select
            value={judgement.demandCategory}
            onChange={(event) =>
              update({
                demandCategory: event.target
                  .value as Phase0JudgementDraft["demandCategory"],
              })
            }
          >
            {demandCategoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          候選類型
          <select
            value={judgement.possibleKind}
            onChange={(event) =>
              update({
                possibleKind: event.target
                  .value as Phase0JudgementDraft["possibleKind"],
              })
            }
          >
            {Object.entries(kindLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label>
          信心程度
          <select
            value={judgement.confidence}
            onChange={(event) =>
              update({
                confidence: event.target
                  .value as Phase0JudgementDraft["confidence"],
              })
            }
          >
            {Object.entries(confidenceLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label>
          下一步
          <select
            value={judgement.suggestedNextStep}
            onChange={(event) =>
              update({
                suggestedNextStep: event.target
                  .value as Phase0JudgementDraft["suggestedNextStep"],
              })
            }
          >
            {Object.entries(nextStepLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label>
        原文依據
        <textarea
          rows={4}
          value={toTextareaValue(judgement.evidence)}
          onChange={(event) => update({ evidence: toList(event.target.value) })}
        />
      </label>

      <label>
        不能直接變成任務的原因
        <textarea
          rows={4}
          value={toTextareaValue(judgement.blockers)}
          onChange={(event) => update({ blockers: toList(event.target.value) })}
        />
      </label>

      <label>
        人工確認備註
        <textarea
          rows={3}
          value={judgement.humanReviewNote ?? ""}
          onChange={(event) => update({ humanReviewNote: event.target.value })}
        />
      </label>

      <div className="draft-form__checks">
        <label>
          <input
            type="checkbox"
            checked={judgement.unsafeToActDirectly}
            onChange={(event) =>
              update({ unsafeToActDirectly: event.target.checked })
            }
          />
          不能直接變成志工任務
        </label>
        <label>
          <input
            type="checkbox"
            checked={judgement.needsHumanReview ?? false}
            onChange={(event) =>
              update({ needsHumanReview: event.target.checked })
            }
          />
          需要人工確認
        </label>
        <label>
          <input
            type="checkbox"
            checked={judgement.agentJudgementQuestioned ?? false}
            onChange={(event) =>
              update({ agentJudgementQuestioned: event.target.checked })
            }
          />
          人類質疑或修正 agent 判斷
        </label>
      </div>
    </form>
  );
}
