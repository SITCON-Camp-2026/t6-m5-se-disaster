# 災害資訊整理工作台

SITCON Camp 2026 軟體工程工作坊的災害資訊平台 demo。這個版本已整理成可發行的前端應用，並用本地 typed backend service 模擬登入、資料新增、留言、接單、完成任務與排行榜。

## 目前功能

- CAPTCHA 登入流程：先選擇角色與名稱，再輸入 demo CAPTCHA `7319`。
- 角色分流：`回報與行動者` 可新增未確認線索、查看原始資訊、接 demo 任務、完成 demo 任務與查看排行榜。
- 資訊整理者工作台：可查看分類總覽、需求分類篩選、可行動狀態、原始資訊與整理草稿。
- 本地後端服務層：`src/backend/demo-backend.ts` 管理 records、comments、assignments 與登入挑戰。
- 後端狀態板：顯示資料摘要、接單完成狀態與近期 audit events。
- API 預填分類：`src/features/phase-0/phase0-prefill-api.ts` 產生可編輯草稿，仍需要人工確認。
- 可折疊總覽與篩選：分類總覽、需求分類篩選、可行動狀態預設收合。
- 原始資訊互動：可新增未確認資訊與留言；已移除愛心與送到整理工作台按鈕。

## 快速開始

```bash
pnpm install
pnpm dev
```

開發伺服器預設為：

```text
http://localhost:5173/
```

## 驗證與發行

```bash
pnpm check
pnpm build
pnpm preview
```

`pnpm check` 會執行格式檢查、lint、typecheck、fixture 驗證、測試與 production build。

## Demo 邊界

- CAPTCHA 是 demo 流程，測試答案會顯示在畫面上，不能當成真實安全機制。
- `src/backend/demo-backend.ts` 是瀏覽器內的本地服務層，不是獨立部署的資料庫或 server。
- 所有原始資訊與新增資訊都預設未確認，不能直接當成真實救災依據。
- 接單、完成任務與排行榜只代表 demo 操作狀態，不代表真實派工、現場解決或人員能力。
- API 預填分類只產生草稿，不會自動確認資訊。

## 主要入口

```text
src/main.tsx
src/app/App.tsx
src/backend/demo-backend.ts
src/components/LoginPanel.tsx
src/features/phase-0/
```

系統架構請看 [`docs/system-design.md`](docs/system-design.md)。

## 授權

- 程式碼：MIT
- 教案與文件：CC BY-SA
- mock data：CC0
