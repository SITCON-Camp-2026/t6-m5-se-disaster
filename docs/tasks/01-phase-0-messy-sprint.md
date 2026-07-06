# Phase 0：共同混亂 Sprint

## 時間

09:20–10:10

## 你現在拿到的來源

- `docs/course-context.md`
- `docs/brief.md`
- `docs/output-paths.md`
- `src/fixtures/phase-0/messy-reports.json`
- 起始畫面

## 你要做什麼

把網頁改造成一個資訊整理工作台，讓下一位協作者可以：

1. 左邊看目前收到的原始資訊
2. 右邊逐步判斷它們比較像是通報、地點狀態、志工任務，還是人員指派
3. 清楚標示哪些資訊還不能判斷
4. 清楚標示哪些資訊還不能相信
5. 清楚標示哪些資訊不能直接變成任務

這一階段不是找出唯一正確答案，也不是把資料整理成乾淨模型，而是讓混亂資訊如何被判斷、卡住、保留不確定性被看見。

## 前 10 分鐘

1. 開起始畫面；若還沒開，在 repo 裡跑 `pnpm install`、`pnpm dev`，再打開 localhost URL。
2. 看 `src/app/App.tsx`，確認畫面從哪裡 render。
3. 看 `messy-reports.json`，找原文、來源、查核狀態、更新時間等欄位。
4. 決定工作台版面，讓原始資訊和判斷過程能同時被看見。
5. 若問 Coding Agent，先請它分析資料，不要直接改 code。

不要爬社群、查地圖、補真實地址或從外部網站補資料。

## 成果放哪裡

- 畫面：`src/app/App.tsx`、`src/components/`，或 `src/features/phase-0/`
- 資料：只讀 `src/fixtures/phase-0/messy-reports.json`
- 文件：`docs/phase0-observations.md`、`docs/ai-log.md`

Phase 0 可以直接顯示未整理資料，但畫面要標示「這還不是整理後資料」。

## 不做什麼

- 不做完整產品、角色權限、後端、資料庫、localStorage、外部 API、地圖
- 不修改 `CommonRecord`
- 不把未整理資料移進 `src/fixtures/shared/` 假裝乾淨

## 必須交付

- [ ] 畫面顯示所有 Phase 0 原始資料
- [ ] 首頁能看到原始資訊和整理工作台
- [ ] 每筆至少顯示原文、來源、查核狀態、更新時間
- [ ] `needs_review` / `unverified` 有明顯標示
- [ ] 能看出資料可能對應到通報、地點狀態、志工任務或人員指派
- [ ] 至少標示 3 個「我們不知道如何判斷」
- [ ] 至少標示 3 個「不能直接變成任務」的原因
- [ ] 寫出畫面從哪個檔案進入
- [ ] `docs/phase0-observations.md` 有初步紀錄
- [ ] `docs/ai-log.md` 有一筆 AI 使用紀錄

## 停止條件

10:00 後停止新增主要功能，補 observation、確認 demo 入口，準備 10:10 復盤。
