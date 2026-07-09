import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../src/app/App";

describe("App", () => {
  it("renders starter title", () => {
    render(<App />);
    expect(screen.getByText("災害資訊整理工作台")).toBeInTheDocument();
  });

  it("keeps the home page focused on phase 0 tabs", () => {
    render(<App />);

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

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));

    expect(
      screen.getByText(
        "第一階段的成功不是分類正確，而是把為什麼現在還不能判斷說清楚。",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("待人工確認").length).toBeGreaterThan(0);
    expect(screen.getAllByText("未查核").length).toBeGreaterThan(0);
  });

  it("lets learners edit, delete, create, and reset phase 0 drafts", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "整理工作台" }));

    expect(screen.getByText("整理草稿")).toBeInTheDocument();
    const suppliesFilter = screen.getAllByRole("button", {
      name: /物資需求/,
    })[0];
    expect(suppliesFilter).toBeInTheDocument();
    expect(screen.getAllByText("人力需求").length).toBeGreaterThan(0);
    expect(screen.queryByText("第一階段完成檢查")).not.toBeInTheDocument();

    fireEvent.click(suppliesFilter);
    fireEvent.click(screen.getByRole("button", { name: /M-003/ }));

    fireEvent.change(screen.getByLabelText("候選類型"), {
      target: { value: "site_status_candidate" },
    });
    expect(screen.getByLabelText("候選類型")).toHaveValue(
      "site_status_candidate",
    );

    fireEvent.click(screen.getByRole("button", { name: /全部/ }));
    fireEvent.click(screen.getByRole("button", { name: /M-003/ }));
    fireEvent.click(screen.getByRole("button", { name: "刪除草稿" }));
    expect(screen.getByText("M-003 仍只保留原始資訊")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "建立這筆草稿" }));
    expect(screen.getByText("M-003 的候選判斷")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "重設為 agent 預填草稿" }),
    );
    expect(screen.getByText("M-001 的候選判斷")).toBeInTheDocument();
  });
});
