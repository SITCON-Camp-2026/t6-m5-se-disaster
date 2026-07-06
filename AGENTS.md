# Agent Instructions

0. 接手前先閱讀 `docs/course-context.md`，了解課程目的、固定決策、資料釋出規則與 repo 邊界。
1. 修改程式前先閱讀 `docs/spec.md` 與 `docs/data-contract.md`。
2. 不得新增後端、資料庫或外部 runtime API。
3. 不得放入 API key、密碼、真實個資或真實災情資料。
4. 所有 runtime 資料使用 mock data。
5. `events/**` 是外部 dirty data，不代表可直接進入核心模型。
6. `src/fixtures/**` 是 normalized internal data，必須通過 validation。
7. 遇到外部資料格式不一致時，優先寫 adapter，不要直接污染 core schema。
8. 不得自行修改 `CommonRecord`。若需要擴充 family schema，必須更新 `docs/data-contract.md` 與測試。
9. AI 輸出必須對應 acceptance criteria。
10. 使用 AI / Coding Agent 完成重要工作時，必須更新 `docs/ai-log.md`；不需要逐字貼 prompt，但要記錄任務、AI 建議、採用或拒絕、人類判斷理由，以及相關檔案或 commit。
11. 完成前執行 `pnpm run check`。
12. 重大設計決策記錄於 `docs/decisions.md`。
13. 不確定需求時，不可自行補完為救災決策。
