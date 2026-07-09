import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../src/app/App";

function loginWithCaptcha({
  name,
  roleLabel,
}: {
  name?: string;
  roleLabel?: "回報與行動者" | "資訊整理者";
} = {}) {
  if (name) {
    fireEvent.change(screen.getByLabelText("名稱"), {
      target: { value: name },
    });
  }

  if (roleLabel) {
    fireEvent.click(screen.getByLabelText(roleLabel));
  }

  fireEvent.change(screen.getByLabelText("CAPTCHA 驗證"), {
    target: { value: "7319" },
  });
  fireEvent.click(screen.getByRole("button", { name: "驗證並進入" }));
}

describe("App", () => {
  it("renders starter title", () => {
    render(<App />);
    expect(screen.getByText("災害資訊整理工作台")).toBeInTheDocument();
  });

  it("lets a user log in before opening the workbench", () => {
    render(<App />);

    expect(
      screen.getByRole("button", { name: "驗證並進入" }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("名稱"), {
      target: { value: "值班整理者" },
    });
    expect(screen.getByText("請輸入圖中數字：7319")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("CAPTCHA 驗證"), {
      target: { value: "0000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "驗證並進入" }));
    expect(screen.getByRole("alert")).toHaveTextContent("CAPTCHA 驗證不正確");
    fireEvent.change(screen.getByLabelText("CAPTCHA 驗證"), {
      target: { value: "7319" },
    });
    fireEvent.click(screen.getByRole("button", { name: "驗證並進入" }));

    expect(screen.getAllByText("值班整理者").length).toBeGreaterThan(0);
    expect(screen.getByText("資訊整理者")).toBeInTheDocument();
    expect(screen.getByText("資訊整理者畫面")).toBeInTheDocument();
    expect(screen.getByText("資料流與操作紀錄")).toBeInTheDocument();
    expect(screen.getByText("in-memory demo API")).toBeInTheDocument();
    expect(screen.getByText("優先處理佇列")).toBeInTheDocument();
    expect(
      screen.getAllByText(/地點不足|隱私與公開限制/).length,
    ).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole("button", { name: "標記已處理" })[0]);
    expect(screen.getByText("已處理")).toBeInTheDocument();
    expect(screen.getByText(/標記 .* 的.*已處理/)).toBeInTheDocument();
  });

  it("shows a combined reporter and actor screen", () => {
    render(<App />);

    loginWithCaptcha({ roleLabel: "回報與行動者" });

    expect(screen.getByText("回報與行動畫面")).toBeInTheDocument();
    expect(screen.getByText("先留下線索，也先避免誤行動")).toBeInTheDocument();
    expect(screen.getByText("可直接出發")).toBeInTheDocument();
    expect(screen.getByText("可接未確認線索")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "建立未確認線索" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "整理工作台" }),
    ).not.toBeInTheDocument();
  });

  it("does not show a separate actor login role", () => {
    render(<App />);

    expect(screen.queryByLabelText("行動者")).not.toBeInTheDocument();
  });

  it("lets action users accept tasks and shows organizer leaderboard", () => {
    render(<App />);

    loginWithCaptcha({ name: "小明", roleLabel: "回報與行動者" });

    fireEvent.click(screen.getAllByRole("button", { name: "接單" })[0]);
    expect(screen.getByText("已接單：小明")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "完成任務" }));
    expect(screen.getByText("已完成：小明")).toBeInTheDocument();
    expect(screen.getByText("任務完成數")).toBeInTheDocument();
    expect(screen.getAllByText("小明").length).toBeGreaterThan(0);
    expect(screen.getByText("1 件")).toBeInTheDocument();
    expect(screen.getByText("資料流與操作紀錄")).toBeInTheDocument();
    expect(screen.getByText(/完成 demo 任務/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "登出" }));
    loginWithCaptcha();

    expect(screen.getByText("任務完成數")).toBeInTheDocument();
    expect(screen.getAllByText("小明").length).toBeGreaterThan(0);
    expect(screen.getByText("1 件")).toBeInTheDocument();
    expect(screen.getByText("任務接單狀態")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "設為待接單" }));
    expect(screen.getAllByText("待接單").length).toBeGreaterThan(0);
    expect(screen.queryByText("1 件")).not.toBeInTheDocument();
    expect(screen.getByText(/將 .* 設為待接單/)).toBeInTheDocument();
  });

  it("keeps the home page focused on phase 0 tabs", () => {
    render(<App />);
    loginWithCaptcha();

    expect(
      screen.getByRole("button", { name: "整理總覽" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "原始資訊" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "整理工作台" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "通報" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "地點" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "志工任務" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "人員指派" }),
    ).not.toBeInTheDocument();
  });

  it("shows review states in the phase 0 workbench", () => {
    render(<App />);
    loginWithCaptcha();

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));

    expect(
      screen.getByText(
        "第一階段的成功不是分類正確，而是把為什麼現在還不能判斷說清楚。",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("待人工確認").length).toBeGreaterThan(0);
    expect(screen.getAllByText("未查核").length).toBeGreaterThan(0);
  });

  it("lets learners edit, delete, create, and reset phase 0 drafts", async () => {
    render(<App />);
    loginWithCaptcha();

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));

    expect(
      await screen.findByText("先選一個待確認事項，再進入狀態編輯"),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/預填 API/).length).toBeGreaterThan(0);
    expect(screen.getByText("分類總覽")).toBeInTheDocument();
    expect(screen.getByText("防護中")).toBeInTheDocument();
    expect(screen.getByLabelText("待確認事項九宮格")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /分類總覽/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByText(/篩選/)).not.toBeInTheDocument();
    expect(screen.queryByText(/代辦事項/)).not.toBeInTheDocument();
    expect(screen.getAllByText("人力需求").length).toBeGreaterThan(0);
    expect(screen.queryByText("第一階段完成檢查")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /M-003/ }));
    expect(screen.getByText("狀態編輯")).toBeInTheDocument();
    expect(screen.getByText("防護檢查")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("候選類型"), {
      target: { value: "site_status_candidate" },
    });
    expect(screen.getByLabelText("候選類型")).toHaveValue(
      "site_status_candidate",
    );

    fireEvent.click(screen.getByRole("button", { name: /M-003/ }));
    fireEvent.click(screen.getByRole("button", { name: "刪除草稿" }));
    expect(screen.getByText("M-003 仍只保留原始資訊")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "建立這筆草稿" }));
    expect(screen.getByText("M-003 的候選判斷")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "重新呼叫預填 API" }));
    expect(
      await screen.findByText("先選一個待確認事項，再進入狀態編輯"),
    ).toBeInTheDocument();
  });

  it("collapses the category overview", async () => {
    render(<App />);
    loginWithCaptcha();
    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));

    expect(
      await screen.findByText("先選一個待確認事項，再進入狀態編輯"),
    ).toBeInTheDocument();
    const categoryToggle = screen.getByRole("button", {
      name: /分類總覽/,
    });
    expect(categoryToggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(categoryToggle);
    expect(categoryToggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByText(/篩選/)).not.toBeInTheDocument();
  });

  it("lets users add raw info and comment", () => {
    render(<App />);
    loginWithCaptcha();
    fireEvent.click(screen.getByRole("button", { name: "原始資訊" }));

    fireEvent.change(screen.getByLabelText("新增未確認資訊"), {
      target: { value: "新收到一則轉述，活動中心附近可能需要飲用水。" },
    });
    fireEvent.change(screen.getByLabelText("地點描述"), {
      target: { value: "活動中心附近" },
    });
    fireEvent.click(screen.getByRole("button", { name: "新增資訊" }));

    expect(screen.getByText(/新收到一則轉述/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /愛心/ }),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("U-001 留言"), {
      target: { value: "請先確認是否仍缺水" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "留言" })[0]);
    expect(screen.getByText("請先確認是否仍缺水")).toBeInTheDocument();
  });
});
