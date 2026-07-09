import type { Phase0DemandCategory } from "./phase0-types";

export const demandCategoryLabels: Record<Phase0DemandCategory, string> = {
  people: "人力需求",
  supplies: "物資需求",
  professional_support: "專業支援",
  site_status: "地點狀態",
  announcement: "公告資訊",
  unknown: "待判斷",
};

export const demandCategoryOptions = Object.entries(demandCategoryLabels).map(
  ([value, label]) => ({
    value: value as Phase0DemandCategory,
    label,
  }),
);
