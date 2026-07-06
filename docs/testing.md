# Testing

測試不是為了追求覆蓋率，而是為了把 acceptance criteria、schema 與 event injection 的處理決策變成可驗證的成果。

## Required checks

- [ ] schema validation
- [ ] one component or app smoke test
- [ ] one edge case test
- [ ] event injection 後至少一個 adapter / validation test

## Commands

```bash
pnpm validate:data
pnpm test
pnpm check
```

## Acceptance criteria mapping

| AC | Test / manual check |
|---|---|
| AC-01 |  |
| AC-02 |  |
| AC-03 |  |
| AC-04 |  |

## Notes

- `events/**` 是外部 dirty input，不要求直接通過 validation。
- `src/fixtures/**` 是 normalized internal data，必須通過 validation。
- 若需要支援外部格式，優先新增 adapter 測試。
