import { useState } from "react";
import { SourceLabel } from "../../components/SourceLabel";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDateTime } from "../../lib/date";
import type { Phase0MessyRecord } from "./phase0-types";

export type RecordInteraction = {
  comments: string[];
};

export function Phase0RawInfoPanel({
  records,
  interactions = {},
  onCreateRecord,
  onAddComment,
  compact = false,
}: {
  records: Phase0MessyRecord[];
  interactions: Record<string, RecordInteraction>;
  onCreateRecord: (rawText: string, locationText: string) => void;
  onAddComment: (recordId: string, comment: string) => void;
  compact?: boolean;
}) {
  const [rawText, setRawText] = useState("");
  const [locationText, setLocationText] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>(
    {},
  );

  function submitRecord(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rawText.trim()) return;
    onCreateRecord(rawText, locationText);
    setRawText("");
    setLocationText("");
  }

  function submitComment(recordId: string) {
    const comment = commentDrafts[recordId]?.trim();
    if (!comment) return;
    onAddComment(recordId, comment);
    setCommentDrafts((currentDrafts) => ({
      ...currentDrafts,
      [recordId]: "",
    }));
  }

  return (
    <div className={compact ? "phase0-raw phase0-raw--compact" : "phase0-raw"}>
      <div className="panel__header">
        <div>
          <h2>原始資訊</h2>
          <p>這些還不是整理後資料，不能直接當成行動依據。</p>
        </div>
        <p>{records.length} 筆資料</p>
      </div>

      <form className="add-record-form" onSubmit={submitRecord}>
        <label>
          新增未確認資訊
          <textarea
            placeholder="輸入剛收到的線索，保留不確定描述，不要自行補成事實。"
            rows={3}
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
          />
        </label>
        <div className="add-record-form__row">
          <label>
            地點描述
            <input
              placeholder="可留空或填模糊地點"
              value={locationText}
              onChange={(event) => setLocationText(event.target.value)}
            />
          </label>
          <button className="button button--primary" type="submit">
            新增資訊
          </button>
        </div>
      </form>

      <div className={compact ? "grid raw-grid--compact" : "grid"}>
        {records.map((record) => {
          const interaction = interactions[record.id] ?? {
            comments: [],
          };

          return (
            <article className="record-card" key={record.id}>
              <div className="record-card__header">
                <h3>{record.id}</h3>
                <StatusBadge status={record.verificationStatus} />
              </div>
              <p>{record.rawText}</p>
              <div className="record-card__meta">
                <SourceLabel sourceType={record.sourceType} />
                <span>更新：{formatDateTime(record.updatedAt)}</span>
              </div>
              <div className="comments">
                <h4>留言</h4>
                {interaction.comments.length === 0 ? (
                  <p className="comments__empty">尚無留言</p>
                ) : (
                  <ul>
                    {interaction.comments.map((comment, index) => (
                      <li key={`${record.id}-${index}`}>{comment}</li>
                    ))}
                  </ul>
                )}
                <div className="comment-form">
                  <input
                    aria-label={`${record.id} 留言`}
                    placeholder="補充觀察或疑問"
                    value={commentDrafts[record.id] ?? ""}
                    onChange={(event) =>
                      setCommentDrafts((currentDrafts) => ({
                        ...currentDrafts,
                        [record.id]: event.target.value,
                      }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => submitComment(record.id)}
                  >
                    留言
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
